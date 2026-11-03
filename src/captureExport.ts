import * as THREE from 'three';

export type CaptureAspect='square'|'landscape'|'portrait';
export const CAPTURE_MAX_FRAMES=900;
export const CAPTURE_MAX_BYTES=256*1024*1024;
export const CAPTURE_MAX_PIXELS=3840*2160;
export const CAPTURE_SIZES=[256,512,1024,1080,1920,2048,3840] as const;

export function captureDimensions(size:number,aspect:CaptureAspect){
  if(!Number.isInteger(size)||!CAPTURE_SIZES.includes(size as typeof CAPTURE_SIZES[number]))throw new Error('Resolución alfa no admitida');
  const width=aspect==='portrait'?Math.round(size*9/16):size;
  const height=aspect==='landscape'?Math.round(size*9/16):size;
  if(width*height>CAPTURE_MAX_PIXELS)throw new Error('Para 4K selecciona formato horizontal 16:9 o vertical 9:16; cuadrado 4K excede la memoria prevista');
  return {width,height};
}

export function framesForDuration(duration:number,fps:number){
  if(!Number.isFinite(duration)||duration<=0||![24,25,30,60].includes(fps))throw new Error('Duración del clip o FPS inválidos');
  return Math.min(CAPTURE_MAX_FRAMES,Math.max(1,Math.ceil(duration*fps)));
}

/** Recenter only the export camera. Keep the editor camera and controls untouched. */
export function frameExportCamera(camera:THREE.Camera,bounds:THREE.Box3){
  if(bounds.isEmpty())return;
  const sphere=bounds.getBoundingSphere(new THREE.Sphere());
  if(!Number.isFinite(sphere.radius)||sphere.radius<=0)return;
  const center=sphere.center;
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  if(camera instanceof THREE.PerspectiveCamera){
    const fovY=THREE.MathUtils.degToRad(camera.fov)*.5;
    const fovX=Math.atan(Math.tan(fovY)*camera.aspect);
    const distance=sphere.radius*1.2/Math.sin(Math.min(fovY,fovX));
    camera.position.copy(center).addScaledVector(forward,-distance);
    camera.near=Math.max(.001,Math.min(camera.near,distance-sphere.radius*1.5));
    camera.far=Math.max(camera.far,distance+sphere.radius*2);
    camera.lookAt(center);camera.updateProjectionMatrix();
  }else if(camera instanceof THREE.OrthographicCamera){
    const radius=sphere.radius*1.2;
    const height=camera.top-camera.bottom, width=camera.right-camera.left;
    camera.position.copy(center).addScaledVector(forward,-Math.max(radius*3,1));
    camera.zoom=Math.min(height,width)/(2*radius);
    camera.lookAt(center);camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld(true);
}
