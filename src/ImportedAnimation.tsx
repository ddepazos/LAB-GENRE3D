import {useEffect,useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

/** Keep clip playback scoped to its imported hierarchy; pause preserves the pose. */
export function ImportedAnimation({object,clip,playing}:{object:THREE.Object3D;clip?:THREE.AnimationClip;playing:boolean}){
 const mixer=useMemo(()=>new THREE.AnimationMixer(object),[object]);
 useEffect(()=>{
   if(!clip)return;
   const action=mixer.clipAction(clip);action.reset().play();
   return()=>{action.stop();mixer.uncacheClip(clip)};
 },[mixer,clip]);
 useFrame((_,delta)=>{if(playing&&clip)mixer.update(Math.min(delta,.1))});
 useEffect(()=>()=>{mixer.stopAllAction();mixer.uncacheRoot(object)},[mixer,object]);
 return null;
}
