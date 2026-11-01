import {useEffect, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {SceneCamera} from './sceneObjects';

/** Render inside Canvas. Never re-create Canvas when changing cameras. */
export function SceneCameraBridge({requested,onApplied}:{requested:SceneCamera|null;onApplied?:(camera:THREE.Camera)=>void}){
 const set=useThree(state=>state.set);
 const original=useRef(useThree(state=>state.camera));
 useEffect(()=>{
  const camera=requested??original.current;
  if(camera instanceof THREE.PerspectiveCamera||camera instanceof THREE.OrthographicCamera)camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  set({camera});
  onApplied?.(camera);
  return ()=>{
   // Restore the stable editor camera before a model-owned camera is detached.
   set({camera:original.current});
  };
 },[requested,set,onApplied]);
 return null;
}
