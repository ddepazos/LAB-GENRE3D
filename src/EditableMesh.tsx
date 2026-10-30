import React, {useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {ThreeEvent} from '@react-three/fiber';
import {TransformControls} from '@react-three/drei';
export type MeshData={positions:number[]};
export type ComponentMode='object'|'vertex'|'edge'|'face';
export function geometryData(g:THREE.BufferGeometry):MeshData {
 const n=g.index?g.toNonIndexed():g.clone();const data={positions:Array.from(n.getAttribute('position').array)};n.dispose();return data;
}
export function faceOperation(data:MeshData,face:number,distance:number,inset=false,bevel=false):MeshData {
 const p=[...data.positions],start=face*9;
 if(start<0||start+8>=p.length||!Number.isFinite(distance))return data;
 const v=[0,1,2].map(i=>new THREE.Vector3().fromArray(p,start+i*3));
 const normal=new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0])).normalize();
 const center=v[0].clone().add(v[1]).add(v[2]).divideScalar(3);
 const top=v.map(a=>{const result=inset?a.clone().lerp(center,Math.min(.9,Math.max(.01,Math.abs(distance)))):a.clone().addScaledVector(normal,distance);if(bevel)result.addScaledVector(normal,Math.abs(distance)*.25);return result});
 top.forEach((a,i)=>a.toArray(p,start+i*3));
 for(let i=0;i<3;i++){const j=(i+1)%3;for(const a of [v[i],v[j],top[j],v[i],top[j],top[i]])p.push(a.x,a.y,a.z)}
 return {positions:p};
}
export function EditableMesh({data,mode,onChange,onFace}:{data:MeshData;mode:ComponentMode;onChange:(d:MeshData)=>void;onFace:(face:number)=>void}) {
 const ref=useRef<THREE.Mesh>(null);const handle=useRef<THREE.Group>(null);
 const [indices,setIndices]=useState<number[]>([]);
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));g.computeVertexNormals();g.computeBoundingSphere();return g},[data]);
 React.useEffect(()=>()=>geometry.dispose(),[geometry]);
 React.useEffect(()=>setIndices([]),[mode]);
 const center=new THREE.Vector3();indices.forEach(i=>center.add(new THREE.Vector3().fromArray(data.positions,i*3)));if(indices.length)center.divideScalar(indices.length);
 const pick=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();const face=e.faceIndex;if(face==null)return;onFace(face);const ids=[face*3,face*3+1,face*3+2];const local=ref.current!.worldToLocal(e.point.clone());
 let chosen=ids;
 if(mode==='vertex')chosen=[ids.reduce((a,b)=>new THREE.Vector3().fromArray(data.positions,a*3).distanceToSquared(local)<new THREE.Vector3().fromArray(data.positions,b*3).distanceToSquared(local)?a:b)];
 if(mode==='edge'){let best=Infinity;for(let i=0;i<3;i++){const a=ids[i],b=ids[(i+1)%3],line=new THREE.Line3(new THREE.Vector3().fromArray(data.positions,a*3),new THREE.Vector3().fromArray(data.positions,b*3));const d=line.closestPointToPoint(local,true,new THREE.Vector3()).distanceToSquared(local);if(d<best){best=d;chosen=[a,b]}}}
 // Weld coincident corners so moving an edge or vertex does not split UV seams.
 const all:number[]=[];for(let i=0;i<data.positions.length/3;i++)if(chosen.some(j=>new THREE.Vector3().fromArray(data.positions,i*3).distanceToSquared(new THREE.Vector3().fromArray(data.positions,j*3))<1e-12))all.push(i);setIndices(all);
 };
 return <><mesh ref={ref} geometry={geometry} onClick={pick}><meshBasicMaterial color="#ffbd59" wireframe transparent opacity={.45} depthTest={false}/></mesh>{indices.length>0&&<TransformControls mode="translate" onMouseUp={()=>{if(!handle.current)return;const delta=handle.current.position.clone().sub(center),p=[...data.positions];indices.forEach(i=>{p[i*3]+=delta.x;p[i*3+1]+=delta.y;p[i*3+2]+=delta.z});onChange({positions:p})}}><group ref={handle} position={center}><mesh><sphereGeometry args={[.065,8,8]}/><meshBasicMaterial color="#ffcc55" depthTest={false}/></mesh></group></TransformControls>}</>;
}
