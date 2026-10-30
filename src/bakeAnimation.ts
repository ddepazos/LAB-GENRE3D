import * as THREE from 'three';

export const settleFrame=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
/** Bake rigid procedural hierarchies after the authoring UI has applied each exact sample. */
export async function bakeAnimation(root:THREE.Object3D,name:string,frames:number,sample:(frame:number)=>Promise<void>,fps=30){
 if(!Number.isInteger(frames)||frames<1||frames>240)throw new Error('Duración fuera de rango');
 const nodes:THREE.Object3D[]=[];root.traverse(n=>{if(!n.userData.editorOnly)nodes.push(n)});
 const values=nodes.map(()=>({position:[] as number[],quaternion:[] as number[],scale:[] as number[]}));
 const times:number[]=[];
 for(let frame=0;frame<=frames;frame++){
  await sample(frame);root.updateMatrixWorld(true);times.push(frame/fps);
  nodes.forEach((n,i)=>{values[i].position.push(...n.position.toArray());values[i].quaternion.push(...n.quaternion.toArray());values[i].scale.push(...n.scale.toArray())});
 }
 const tracks:THREE.KeyframeTrack[]=[];
 nodes.forEach((n,i)=>{for(const property of ['position','quaternion','scale'] as const){const v=values[i][property],size=property==='quaternion'?4:3;if(v.some((x,k)=>Math.abs(x-v[k%size])>1e-7))tracks.push(property==='quaternion'?new THREE.QuaternionKeyframeTrack(n.uuid+'.quaternion',times,v):new THREE.VectorKeyframeTrack(n.uuid+'.'+property,times,v))}});
 return tracks.length?new THREE.AnimationClip(name,frames/fps,tracks):null;
}
export function sampleKeys<T>(keys:{frame:number;value:T}[],frame:number,blend:(a:T,b:T,t:number)=>T):T|undefined{
 if(!keys.length)return undefined;
 const sorted=[...keys].sort((a,b)=>a.frame-b.frame),before=[...sorted].reverse().find(k=>k.frame<=frame)??sorted[0],after=sorted.find(k=>k.frame>=frame)??sorted[sorted.length-1];
 return blend(before.value,after.value,before.frame===after.frame?0:(frame-before.frame)/(after.frame-before.frame));
}
