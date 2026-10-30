import * as THREE from 'three';
import {bakeEditableCopy} from './meshData';

export function rigMeshCopy(source:THREE.Mesh,count:number,axis:'x'|'y'|'z'){
 if(!Number.isInteger(count)||count<2||count>12)throw new Error('Usa entre 2 y 12 huesos');
 const copy=bakeEditableCopy(source),g=copy.geometry;g.computeBoundingBox();const box=g.boundingBox!,length=box.max[axis]-box.min[axis];
 if(length<1e-5){g.dispose();throw new Error('El eje elegido no tiene longitud suficiente')}
 const center=box.getCenter(new THREE.Vector3()),step=length/(count-1),bones:THREE.Bone[]=[];
 for(let i=0;i<count;i++){const bone=new THREE.Bone();bone.name='Hueso_'+String(i+1).padStart(2,'0');if(i===0){bone.position.copy(center);bone.position[axis]=box.min[axis]}else{bone.position[axis]=step;bones[i-1].add(bone)}bones.push(bone)}
 const pos=g.attributes.position,indices:number[]=[],weights:number[]=[];
 for(let i=0;i<pos.count;i++){const t=THREE.MathUtils.clamp((new THREE.Vector3().fromBufferAttribute(pos,i)[axis]-box.min[axis])/step,0,count-1),lower=Math.min(count-2,Math.floor(t)),f=t-lower;indices.push(lower,lower+1,0,0);weights.push(1-f,f,0,0)}
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(g,copy.material);mesh.name=(source.name||'Malla')+'_rig';mesh.position.copy(copy.position);mesh.quaternion.copy(copy.quaternion);mesh.scale.copy(copy.scale);mesh.add(bones[0]);
 const root=new THREE.Group();root.name='Rig_lineal_LAB';root.add(mesh);root.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));return root;
}
export function paintWeights(mesh:THREE.SkinnedMesh,boneIndex:number,worldPoint:THREE.Vector3,radius:number,strength:number){
 if(boneIndex<0||boneIndex>=mesh.skeleton.bones.length||radius<=0||!Number.isFinite(radius))throw new Error('Pincel inválido');
 if(!mesh.geometry.userData.genre3dWeightsEdited){mesh.geometry=mesh.geometry.clone();mesh.geometry.userData.genre3dWeightsEdited=true}
 mesh.updateWorldMatrix(true,true);mesh.skeleton.update();const ids=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight'),point=new THREE.Vector3();let changed=0;
 for(let i=0;i<ids.count;i++){
  mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);const distance=point.distanceTo(worldPoint);if(distance>radius)continue;
  const influences=new Map<number,number>();for(let j=0;j<4;j++){const id=ids.getComponent(i,j),w=weights.getComponent(i,j);if(w>0)influences.set(id,(influences.get(id)??0)+w)}
  const value=THREE.MathUtils.clamp((influences.get(boneIndex)??0)+strength*(1-distance/radius),0,1);influences.delete(boneIndex);
  const other=[...influences].sort((a,b)=>b[1]-a[1]).slice(0,3);if(!other.length&&value<1&&mesh.skeleton.bones.length>1)other.push([boneIndex===0?1:0,1]);const total=other.reduce((sum,x)=>sum+x[1],0);const values:[[number,number],...[number,number][]]=[[boneIndex,total?value:1],...other.map(([id,w])=>[id,w/total*(1-value)] as [number,number])];
  for(let j=0;j<4;j++){ids.setComponent(i,j,values[j]?.[0]??0);weights.setComponent(i,j,values[j]?.[1]??0)}changed++;
 }
 ids.needsUpdate=weights.needsUpdate=true;return changed;
}
/** CCD on ancestor rotations; no anatomical joint-limit model is assumed. */
export function solveIK(end:THREE.Bone,target:THREE.Vector3,iterations=20){
 const root=end;root.updateWorldMatrix(true,true);const current=new THREE.Vector3();
 for(let iteration=0;iteration<iterations;iteration++){
  let joint=end.parent;
  while(joint&&(joint as THREE.Bone).isBone){
   const origin=joint.getWorldPosition(new THREE.Vector3()),a=end.getWorldPosition(new THREE.Vector3()).sub(origin),b=target.clone().sub(origin);
   if(a.lengthSq()>1e-12&&b.lengthSq()>1e-12){const delta=new THREE.Quaternion().setFromUnitVectors(a.normalize(),b.normalize()),parent=joint.parent?.getWorldQuaternion(new THREE.Quaternion())??new THREE.Quaternion();joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent)).normalize();joint.updateWorldMatrix(false,true)}joint=joint.parent;
  }
  if(end.getWorldPosition(current).distanceTo(target)<.001)break;
 }
 return end.getWorldPosition(current).distanceTo(target);
}
