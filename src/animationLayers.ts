import * as THREE from 'three';
export type ClipLayer={clip:number;enabled:boolean;weight:number;speed:number;offset:number};
export function layerDuration(clips:THREE.AnimationClip[],layers:ClipLayer[]){return Math.min(60,Math.max(0,...layers.filter(l=>l.enabled&&l.weight>0&&clips[l.clip]).map(l=>l.offset+clips[l.clip].duration/l.speed)))}
export function layerPlayback(root:THREE.Object3D,clips:THREE.AnimationClip[],layers:ClipLayer[]){
 const duration=layerDuration(clips,layers);
 const mixer=new THREE.AnimationMixer(root);let time=0,repeat=true;
 const actions=layers.filter(l=>l.enabled&&l.weight>0&&clips[l.clip]).map(layer=>({layer,action:mixer.clipAction(clips[layer.clip]).play()}));
 const sample=(seconds:number)=>{time=THREE.MathUtils.clamp(seconds,0,duration);for(const {layer,action} of actions){action.enabled=true;action.paused=false;action.setEffectiveWeight(time<layer.offset?0:layer.weight);action.time=Math.min(clips[layer.clip].duration,Math.max(0,(time-layer.offset)*layer.speed))}mixer.update(0);return time};
 return {get time(){return time},duration,seek:sample,loop(value:boolean){repeat=value},step(delta:number,speed=1){const next=time+Math.max(0,Math.min(.1,delta))*speed;const ended=!repeat&&next>=duration;sample(repeat&&duration>0?next%duration:Math.min(next,duration));return {time,ended}},dispose(){mixer.stopAllAction();mixer.uncacheRoot(root)}};
}
/** Bake the blend into an ordinary clip so other GLB consumers need no LAB-specific layer format. */
export function bakeLayerClip(root:THREE.Object3D,clips:THREE.AnimationClip[],layers:ClipLayer[]){
 const player=layerPlayback(root,clips,layers);if(!player.duration){player.dispose();return null}
 const nodes:THREE.Object3D[]=[];root.traverse(n=>{if(!n.userData.editorOnly)nodes.push(n)});
 const arrays=nodes.map(()=>({p:[] as number[],q:[] as number[],s:[] as number[],m:[] as number[]})),times:number[]=[],count=Math.ceil(player.duration*30);
 try{for(let frame=0;frame<=count;frame++){const time=Math.min(player.duration,frame/30);times.push(time);player.seek(time);nodes.forEach((n,i)=>{arrays[i].p.push(...n.position.toArray());arrays[i].q.push(...n.quaternion.toArray());arrays[i].s.push(...n.scale.toArray());arrays[i].m.push(...((n as THREE.Mesh).morphTargetInfluences??[]))})}}finally{player.dispose()}
 const tracks:THREE.KeyframeTrack[]=[];
 nodes.forEach((n,i)=>{for(const [key,property,size] of [['p','position',3],['q','quaternion',4],['s','scale',3],['m','morphTargetInfluences',(n as THREE.Mesh).morphTargetInfluences?.length??0]] as const){const values=arrays[i][key];if(size&&values.some((v,k)=>Math.abs(v-values[k%size])>1e-7)){const name=n.uuid+'.'+property;tracks.push(property==='quaternion'?new THREE.QuaternionKeyframeTrack(name,times,values):property==='morphTargetInfluences'?new THREE.NumberKeyframeTrack(name,times,values):new THREE.VectorKeyframeTrack(name,times,values))}}});
 return tracks.length?new THREE.AnimationClip('Mezcla por capas LAB',player.duration,tracks):null;
}
