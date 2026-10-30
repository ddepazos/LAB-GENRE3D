import * as THREE from 'three';

export function createClipPlayback(root:THREE.Object3D,clip:THREE.AnimationClip){
 const mixer=new THREE.AnimationMixer(root),action=mixer.clipAction(clip);
 action.play();action.clampWhenFinished=true;
 const duration=Math.max(0,clip.duration);
 return {
  get time(){return action.time},
  seek(seconds:number){
   action.enabled=true;action.paused=false;
   action.time=Math.max(0,Math.min(duration,Number.isFinite(seconds)?seconds:0));
   mixer.update(0);return action.time;
  },
  loop(repeat:boolean){action.setLoop(repeat?THREE.LoopRepeat:THREE.LoopOnce,repeat?Infinity:1)},
  step(delta:number,speed=1){
   action.paused=false;mixer.update(Math.max(0,Math.min(.1,delta))*Math.max(.25,Math.min(2,speed)));
   return {time:action.time,ended:action.loop===THREE.LoopOnce&&action.time>=duration};
  },
  dispose(){action.stop();mixer.uncacheRoot(root)}
 };
}
