import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import type {SceneCamera} from './sceneObjects';

/** Bind controls to the selected camera without recreating Canvas. */
export function EditorCameraControls({active}:{active:SceneCamera|null}){
 const set=useThree(state=>state.set);
 const initial=useThree(state=>state.camera);
 const editorCamera=useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera>(initial);
 const camera=active??editorCamera.current;
 useEffect(()=>{
   if(camera instanceof THREE.PerspectiveCamera||camera instanceof THREE.OrthographicCamera)camera.updateProjectionMatrix();
   camera.updateMatrixWorld(true);
   set({camera});
   return ()=>set({camera:editorCamera.current});
 },[camera,set]);
 return <OrbitControls key={camera.uuid} camera={camera} makeDefault/>;
}
