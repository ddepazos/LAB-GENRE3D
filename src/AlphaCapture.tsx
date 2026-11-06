import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {frameExportCamera} from './captureExport';

export type CaptureFrame=((width:number,height?:number,options?:{autoFrameBounds?:THREE.Box3})=>Promise<{blob:Blob;transparentPixels:number}>)&{dispose?:()=>void};

/** Reuse the render target and PNG encoder canvas during a sequence.
 * Creating a new MSAA render target at 4K for each frame can exhaust GPU memory.
 */
export function AlphaCapture({onReady}:{onReady:(capture:CaptureFrame|null)=>void}){
  const {gl,scene,camera}=useThree();
  useEffect(()=>{
    type FrameCache={
      width:number;height:number;
      target:THREE.WebGLRenderTarget;
      pixels:Uint8Array;
      canvas:HTMLCanvasElement;
      context:CanvasRenderingContext2D;
      output:ImageData;
    };
    let cache:FrameCache|null=null;
    const release=()=>{
      if(!cache)return;
      cache.target.dispose();
      cache.canvas.width=0;
      cache.canvas.height=0;
      cache=null;
    };
    const capture:CaptureFrame=Object.assign(async(width:number,height=width,options?:{autoFrameBounds?:THREE.Box3})=>{
      const webglContext=gl.getContext();
      const gpuLimit=Math.min(4096,gl.capabilities.maxTextureSize,Number(webglContext.getParameter(webglContext.MAX_RENDERBUFFER_SIZE))||4096);
      if(![width,height].every(n=>Number.isInteger(n)&&n>=128&&n<=gpuLimit)||width*height>3840*2160)
        throw new Error('Resolución 4K no soportada por esta GPU; prueba 1920 × 1080');
      if(!cache||cache.width!==width||cache.height!==height){
        release();
        const webgl2=webglContext as WebGL2RenderingContext;
        const maxSamples=typeof webgl2.MAX_SAMPLES==='number'?Number(webglContext.getParameter(webgl2.MAX_SAMPLES))||0:0;
        // 4K MSAA x4 requires large multisample color and depth attachments.
        const samples=Math.min(width*height>2048*1152?2:4,maxSamples);
        const target=new THREE.WebGLRenderTarget(width,height,{samples,depthBuffer:true,stencilBuffer:false});
        target.texture.colorSpace=THREE.SRGBColorSpace;
        const canvas=document.createElement('canvas');
        canvas.width=width;canvas.height=height;
        const context=canvas.getContext('2d',{willReadFrequently:false});
        if(!context){target.dispose();throw new Error('Canvas PNG no disponible')}
        cache={width,height,target,pixels:new Uint8Array(width*height*4),canvas,context,output:context.createImageData(width,height)};
      }
      const work=cache;
      const oldTarget=gl.getRenderTarget(),alpha=gl.getClearAlpha();
      const color=gl.getClearColor(new THREE.Color()).clone(),background=scene.background;
      const hidden:THREE.Object3D[]=[];
      scene.traverse(n=>{
        if(n.visible&&(n.userData.editorOnly||n.type==='GridHelper'||n.type==='SkeletonHelper'||n.type==='TransformControls'||(n as THREE.Object3D&{isTransformControls?:boolean}).isTransformControls||n.name==='InfiniteGrid')){
          n.visible=false;hidden.push(n);
        }
      });
      camera.updateWorldMatrix(true,false);
      const copy=camera.clone();
      camera.getWorldPosition(copy.position);camera.getWorldQuaternion(copy.quaternion);copy.updateMatrixWorld(true);
      if(copy instanceof THREE.PerspectiveCamera){copy.aspect=width/height;copy.updateProjectionMatrix()}
      else if(copy instanceof THREE.OrthographicCamera){
        const centerX=(copy.left+copy.right)/2,widthOld=copy.right-copy.left;
        const halfWidth=Math.max(widthOld,(copy.top-copy.bottom)*width/height)/2;
        copy.left=centerX-halfWidth;copy.right=centerX+halfWidth;copy.updateProjectionMatrix();
      }
      if(options?.autoFrameBounds)frameExportCamera(copy,options.autoFrameBounds);
      try{
        scene.background=null;gl.setClearColor(0x000000,0);
        gl.setRenderTarget(work.target);gl.clear();gl.render(scene,copy);
        gl.readRenderTargetPixels(work.target,0,0,width,height,work.pixels);
      }finally{
        gl.setRenderTarget(oldTarget);gl.setClearColor(color,alpha);scene.background=background;
        hidden.forEach(n=>n.visible=true);
      }
      for(let y=0;y<height;y++){
        work.output.data.set(work.pixels.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);
      }
      let transparentPixels=0;
      // Render target RGB may be premultiplied at partially transparent edges.
      const rgba=work.output.data;
      for(let i=0;i<rgba.length;i+=4){
        const a=rgba[i+3];
        if(a===0)transparentPixels++;
        else if(a<255)for(let c=0;c<3;c++)rgba[i+c]=Math.min(255,Math.round(rgba[i+c]*255/a));
      }
      work.context.putImageData(work.output,0,0);
      const blob=await new Promise<Blob>((resolve,reject)=>
        work.canvas.toBlob(data=>data?resolve(data):reject(new Error('PNG no disponible')),'image/png'));
      return {blob,transparentPixels};
    },{dispose:release});
    onReady(capture);
    return()=>{release();onReady(null)};
  },[gl,scene,camera,onReady]);
  return null;
}
