import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {createClipPlayback} from './clipPlayback';

/** Seek requests are separate from playback reports to avoid feeding the clock back into itself. */
export function ImportedAnimation({object,clip,playing,repeat,speed,seek,onTime,onEnded}:{object:THREE.Object3D;clip?:THREE.AnimationClip;playing:boolean;repeat:boolean;speed:number;seek:{time:number;revision:number};onTime:(time:number)=>void;onEnded:()=>void}){
 const playback=useRef<ReturnType<typeof createClipPlayback>>();
 const report=useRef(0);
 useEffect(()=>{
   if(!clip)return;
   playback.current=createClipPlayback(object,clip);
   return()=>{playback.current?.dispose();playback.current=undefined};
 },[object,clip]);
 useEffect(()=>{playback.current?.loop(repeat)},[repeat,object,clip]);
 useEffect(()=>{if(playback.current)onTime(playback.current.seek(seek.time))},[seek,object,clip]);
 useEffect(()=>{if(playing&&clip&&playback.current&&playback.current.time>=clip.duration)playback.current.seek(0)},[playing,clip]);
 useFrame((_,delta)=>{
  if(!playing||!playback.current)return;
  const state=playback.current.step(delta,speed);report.current+=delta;
  if(report.current>=.1||state.ended){onTime(state.time);report.current=0}
  if(state.ended)onEnded();
 });
 return null;
}
