import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
export type CaptureFrame=(width:number,height?:number)=>Promise<{blob:Blob;transparentPixels:number}>;
export function AlphaCapture({onReady}:{onReady:(capture:CaptureFrame|null)=>void}){
 const {gl,scene,camera}=useThree();
 useEffect(()=>{onReady(async (width,height=width)=>{
  if(![width,height].every(n=>Number.isInteger(n)&&n>=128&&n<=2048))throw new Error('Resolución fuera de rango');
  const target=new THREE.WebGLRenderTarget(width,height);target.texture.colorSpace=THREE.SRGBColorSpace;
  const oldTarget=gl.getRenderTarget(),alpha=gl.getClearAlpha(),color=gl.getClearColor(new THREE.Color()).clone(),background=scene.background;
  const hidden:THREE.Object3D[]=[];
  scene.traverse(n=>{if(n.visible&&(n.userData.editorOnly||n.type==='GridHelper'||n.type==='SkeletonHelper'||n.type==='TransformControls'||(n as THREE.Object3D&{isTransformControls?:boolean}).isTransformControls||n.name==='InfiniteGrid')){n.visible=false;hidden.push(n)}});
  const copy=camera.clone();if(copy instanceof THREE.PerspectiveCamera){copy.aspect=width/height;copy.updateProjectionMatrix()}
  const pixels=new Uint8Array(width*height*4);
  try{scene.background=null;gl.setClearColor(0x000000,0);gl.setRenderTarget(target);gl.clear();gl.render(scene,copy);gl.readRenderTargetPixels(target,0,0,width,height,pixels)}finally{gl.setRenderTarget(oldTarget);gl.setClearColor(color,alpha);scene.background=background;hidden.forEach(n=>n.visible=true);target.dispose()}
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');if(!context)throw new Error('Canvas no disponible');const output=context.createImageData(width,height);
  for(let y=0;y<height;y++)output.data.set(pixels.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);
  // Render target blending stores premultiplied edge RGB; PNG ImageData expects straight RGB.
  for(let i=0;i<output.data.length;i+=4){const a=output.data[i+3];if(a>0&&a<255)for(let c=0;c<3;c++)output.data[i+c]=Math.min(255,Math.round(output.data[i+c]*255/a))}
  context.putImageData(output,0,0);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG no disponible')),'image/png'));let transparentPixels=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparentPixels++;return {blob,transparentPixels};
 });return()=>onReady(null)},[gl,scene,camera,onReady]);return null;
}
