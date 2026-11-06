import * as THREE from 'three';
import type {SceneCamera} from './sceneObjects';

export function copyCameraView(source:THREE.Camera,target:SceneCamera){
 source.updateWorldMatrix(true,false);
 source.getWorldPosition(target.position);
 source.getWorldQuaternion(target.quaternion);
 if(target.parent){
  target.parent.updateWorldMatrix(true,false);
  target.parent.worldToLocal(target.position);
  const parentRotation=target.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  target.quaternion.premultiply(parentRotation);
 }
 target.up.copy(source.up);
 if(source instanceof THREE.PerspectiveCamera || source instanceof THREE.OrthographicCamera){target.near=source.near;target.far=source.far;}
 if(source instanceof THREE.PerspectiveCamera && target instanceof THREE.PerspectiveCamera){
  target.fov=source.fov;target.aspect=source.aspect;target.zoom=source.zoom;
 }else if(source instanceof THREE.OrthographicCamera && target instanceof THREE.OrthographicCamera){
  target.left=source.left;target.right=source.right;target.top=source.top;target.bottom=source.bottom;target.zoom=source.zoom;
 }
 target.updateProjectionMatrix();target.updateMatrixWorld(true);
}
