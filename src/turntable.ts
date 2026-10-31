import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
export type TurnSettings={axis:'x'|'y'|'z';degrees:number;duration:number};
export function turnClip(node:THREE.Object3D,settings:TurnSettings){
 const {axis,degrees,duration}=settings;
 if(!['x','y','z'].includes(axis)||!Number.isFinite(degrees)||Math.abs(degrees)>3600||!Number.isFinite(duration)||duration<.1||duration>30)throw new Error('Giro: grados entre −3600 y 3600; duración entre 0.1 y 30 s');
 const count=Math.max(2,Math.ceil(duration*30),Math.ceil(Math.abs(degrees)/90)),times:number[]=[],values:number[]=[];
 const vector=new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0);
 for(let i=0;i<=count;i++){times.push(duration*i/count);values.push(...new THREE.Quaternion().setFromAxisAngle(vector,THREE.MathUtils.degToRad(degrees)*i/count).toArray())}
 return new THREE.AnimationClip(`Giro_${degrees}_${axis}_${duration}s`,duration,[new THREE.QuaternionKeyframeTrack(node.uuid+'.quaternion',times,values)]);
}
/** Preserve source geometry, skin, morphs and its first animation under an independent pivot. */
export function animatedCopy(source:THREE.Object3D,clips:THREE.AnimationClip[],settings:TurnSettings){
 const root=new THREE.Group();root.name='Modelo_animado_LAB';root.userData.genre3dTurn=settings;
 const pivot=new THREE.Group();pivot.name='Pivote_giro_LAB';root.add(pivot);
 const copy=clone(source);copy.traverse(n=>{delete n.userData.itemId});pivot.add(copy);
 const originals:THREE.Object3D[]=[],copies:THREE.Object3D[]=[];source.traverse(n=>originals.push(n));copy.traverse(n=>copies.push(n));
 const mapping=new Map(originals.map((n,i)=>[n.uuid,copies[i].uuid]));
 const clip=turnClip(pivot,settings);
 if(clips[0])for(const sourceTrack of clips[0].tracks){const track=sourceTrack.clone(),parsed=THREE.PropertyBinding.parseTrackName(track.name),target=THREE.PropertyBinding.findNode(source,parsed.nodeName);if(!(target instanceof THREE.Object3D)||parsed.objectName)throw new Error('Pista no compatible: '+track.name);track.name=mapping.get(target.uuid)+'.'+parsed.propertyName+(parsed.propertyIndex!==undefined?'['+parsed.propertyIndex+']':'');clip.tracks.push(track)}
 return {root,clip};
}
