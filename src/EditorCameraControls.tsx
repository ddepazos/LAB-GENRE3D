import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {copyCameraView} from './cameraFraming';
import type {SceneCamera} from './sceneObjects';

export type CameraActions={align:(target:SceneCamera)=>void;aim:(target:SceneCamera,point:THREE.Vector3)=>void};

/** Camera framing is opt-in; normal editor orbit behavior is unchanged. */
export function EditorCameraControls({
 active,
 actions,
 focusBounds,
 focusRevision=0,
}:{
 active:SceneCamera|null;
 actions?:React.MutableRefObject<CameraActions|null>;
 focusBounds?:THREE.Box3|null;
 focusRevision?:number;
}){
 const set=useThree(state=>state.set);
 const initial=useThree(state=>state.camera);
 const editorCamera=useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>(initial);
 const controls=useRef<React.ElementRef<typeof OrbitControls>>(null);
 const camera=active??editorCamera.current;
 const size=useThree(state=>state.size);
 useEffect(()=>{
  if(camera instanceof THREE.PerspectiveCamera){camera.aspect=size.width/size.height;camera.updateProjectionMatrix()}
 },[camera,size]);
 useEffect(()=>{
  if(!actions)return;
  actions.current={
   align(target){copyCameraView(camera,target);target.userData.orbitTarget=controls.current?.target.toArray()},
   aim(target,point){target.lookAt(point);target.updateMatrixWorld(true);target.userData.orbitTarget=point.toArray();if(target===camera){controls.current?.target.copy(point);controls.current?.update()}}
  };
  return()=>{actions.current=null};
 },[actions,camera]);
 useEffect(()=>{
  const orbit=controls.current;if(!orbit)return;
  const saved=camera.userData.orbitTarget;
  if(Array.isArray(saved))orbit.target.fromArray(saved);
  else orbit.target.copy(camera.getWorldPosition(new THREE.Vector3())).addScaledVector(camera.getWorldDirection(new THREE.Vector3()),Math.max(camera.position.length(),1));
  orbit.update();
  return()=>{camera.userData.orbitTarget=orbit.target.toArray()};
 },[camera]);
 useEffect(()=>{
   if(camera instanceof THREE.PerspectiveCamera||camera instanceof THREE.OrthographicCamera)camera.updateProjectionMatrix();
   camera.updateMatrixWorld(true);
   set({camera});
   return ()=>set({camera:editorCamera.current});
 },[camera,set]);
 useEffect(()=>{
   if(!focusBounds||focusBounds.isEmpty()||!controls.current)return;
   const center=focusBounds.getCenter(new THREE.Vector3());
   const size=focusBounds.getSize(new THREE.Vector3());
   const radius=Math.max(size.length()*0.5,0.005);
   const orbit=controls.current;
   const direction=camera.position.clone().sub(orbit.target);
   if(direction.lengthSq()<1e-8)direction.set(1,0.7,1);
   direction.normalize();
   if(camera instanceof THREE.PerspectiveCamera){
     const halfFov=THREE.MathUtils.degToRad(camera.fov)*0.5;
     const vertical=radius/Math.max(Math.sin(halfFov),0.05);
     const horizontal=vertical/Math.max(camera.aspect,0.2);
     const distance=Math.max(vertical,horizontal)*1.25;
     camera.position.copy(center).addScaledVector(direction,distance);
     camera.near=Math.max(0.001,distance-radius*2.5);
     camera.far=Math.max(camera.far,distance+radius*4);
   }else if(camera instanceof THREE.OrthographicCamera){
     const width=Math.max(size.x,size.z,size.y*0.5,0.01);
     const height=Math.max(size.y,size.z,size.x*0.5,0.01);
     camera.zoom=Math.max(0.01,Math.min(
       (camera.right-camera.left)/(width*1.3),
       (camera.top-camera.bottom)/(height*1.3)
     ));
     camera.position.copy(center).addScaledVector(direction,Math.max(radius*3,0.1));
   }
   orbit.target.copy(center);
   camera.updateProjectionMatrix();
   orbit.update();
 },[camera,focusBounds,focusRevision]);
 return <OrbitControls ref={controls} key={camera.uuid} camera={camera} makeDefault/>;
}
