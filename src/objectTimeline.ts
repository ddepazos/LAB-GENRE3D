import * as THREE from 'three';
import {animatedCopy} from './turntable';
export type ObjectKey={frame:number;position:[number,number,number];rotation:[number,number,number];scale:[number,number,number]};
export function objectTimeline(source:THREE.Object3D,clips:THREE.AnimationClip[],keys:ObjectKey[]){
 const sorted=[...keys].sort((a,b)=>a.frame-b.frame);
 if(sorted.length<2||sorted.length>100||new Set(sorted.map(k=>k.frame)).size!==sorted.length||sorted.some(k=>!Number.isInteger(k.frame)||k.frame<0||k.frame>900||![...k.position,...k.rotation,...k.scale].every(Number.isFinite)))throw new Error('Timeline: al menos dos fotogramas únicos entre 0 y 900');
 const duration=sorted.at(-1)!.frame/30;if(duration<=0)throw new Error('La duración debe ser positiva');
 const result=animatedCopy(source,clips,{axis:'y',degrees:0,duration});
 const pivot=result.root.children[0];result.clip.tracks.shift();result.clip.name='Timeline_objeto_LAB';
 const times=sorted.map(k=>k.frame/30);
 result.clip.tracks.push(new THREE.VectorKeyframeTrack(pivot.uuid+'.position',times,sorted.flatMap(k=>k.position)),new THREE.QuaternionKeyframeTrack(pivot.uuid+'.quaternion',times,sorted.flatMap(k=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...k.rotation)).toArray())),new THREE.VectorKeyframeTrack(pivot.uuid+'.scale',times,sorted.flatMap(k=>k.scale)));
 result.root.userData.genre3dObjectKeys=keys;return result;
}
