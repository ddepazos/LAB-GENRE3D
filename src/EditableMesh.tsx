import React, {useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {ThreeEvent,createPortal,useThree} from '@react-three/fiber';
import {TransformControls} from '@react-three/drei';
import {type MeshData,geometryData} from './meshData';
export {geometryData};
export type {MeshData};
export type ComponentMode='object'|'vertex'|'edge'|'face';
export function faceOperation(data:MeshData,face:number,distance:number,inset=false,bevel=false):MeshData {
 const p=[...data.positions],start=face*9;
 if(start<0||start+8>=p.length||!Number.isFinite(distance))return data;
 const v=[0,1,2].map(i=>new THREE.Vector3().fromArray(p,start+i*3));
 const normal=new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0])).normalize();
 const center=v[0].clone().add(v[1]).add(v[2]).divideScalar(3);
 const top=v.map(a=>{const result=inset?a.clone().lerp(center,Math.min(.9,Math.max(.01,Math.abs(distance)))):a.clone().addScaledVector(normal,distance);if(bevel)result.addScaledVector(normal,Math.abs(distance)*.25);return result});
 top.forEach((a,i)=>a.toArray(p,start+i*3));
 for(let i=0;i<3;i++){const j=(i+1)%3;for(const a of [v[i],v[j],top[j],v[i],top[j],top[i]])p.push(a.x,a.y,a.z)}
 const uvs=data.uvs?[...data.uvs]:undefined;
 if(uvs)for(let i=0;i<3;i++){const j=(i+1)%3;for(const k of [i,j,j,i,j,i])uvs.push(data.uvs![face*6+k*2],data.uvs![face*6+k*2+1])}
 const attributes=data.attributes?structuredClone(data.attributes):undefined;
 if(attributes)for(const [name,attr] of Object.entries(attributes))for(let i=0;i<3;i++){const j=(i+1)%3;for(const k of [i,j,j,i,j,i])attr.values.push(...data.attributes![name].values.slice((face*3+k)*attr.itemSize,(face*3+k+1)*attr.itemSize))}
 const groups=data.groups?data.groups.map(g=>({...g})):undefined;
 if(groups){const materialIndex=groups.find(g=>start/3>=g.start&&start/3<g.start+g.count)?.materialIndex??0;groups.push({start:data.positions.length/3,count:18,materialIndex})}
 return {positions:p,uvs,attributes,groups};
}
/** Extrude a connected coplanar region without creating internal walls.
 * The original region becomes the cap; only its outer boundary receives side faces.
 * Preserves per-corner UVs, custom attributes and material groups.
 */
export function extrudeCoplanarRegion(data:MeshData,seedFace:number,distance:number):MeshData {
 const count=data.positions.length/9;
 if(!Number.isInteger(seedFace)||seedFace<0||seedFace>=count)throw Error('Cara no válida');
 if(!Number.isFinite(distance)||Math.abs(distance)<1e-8)throw Error('Indica una distancia de extrusión distinta de cero');
 const point=(f:number,k:number)=>new THREE.Vector3().fromArray(data.positions,f*9+k*3);
 const key=(p:THREE.Vector3)=>p.toArray().map(n=>Math.round(n*1e6)).join(',');
 const faceNormal=(f:number)=>point(f,1).sub(point(f,0)).cross(point(f,2).sub(point(f,0))).normalize();
 const normal=faceNormal(seedFace),origin=point(seedFace,0),plane=normal.dot(origin);
 if(normal.lengthSq()<1e-12)throw Error('La cara inicial es degenerada');
 const edges=new Map<string,{f:number;a:number;b:number}[]>();
 for(let f=0;f<count;f++)for(let k=0;k<3;k++){
  const a=k,b=(k+1)%3,ka=key(point(f,a)),kb=key(point(f,b)),id=[ka,kb].sort().join('|');
  const list=edges.get(id)??[];list.push({f,a,b});edges.set(id,list);
 }
 const adjacent=new Map<number,Set<number>>();
 for(const uses of edges.values())if(uses.length===2){
  const [a,b]=uses;(adjacent.get(a.f)??(adjacent.set(a.f,new Set()),adjacent.get(a.f)!)).add(b.f);
  (adjacent.get(b.f)??(adjacent.set(b.f,new Set()),adjacent.get(b.f)!)).add(a.f);
 }
 const region=new Set<number>([seedFace]),queue=[seedFace];
 while(queue.length){const f=queue.shift()!;for(const n of adjacent.get(f)??[]){
  if(region.has(n)||faceNormal(n).dot(normal)<.9999)continue;
  if([0,1,2].some(k=>Math.abs(normal.dot(point(n,k))-plane)>1e-5))continue;
  region.add(n);queue.push(n);
 }}
 const boundary:Array<{f:number;a:number;b:number}>=[];
 for(const uses of edges.values()){
  const selected=uses.filter(e=>region.has(e.f));
  if(selected.length===1)boundary.push(selected[0]);
  if(selected.length>1&&uses.length!==2)throw Error('Región no manifold: no se puede extruir de forma segura');
 }
 if(!boundary.length)throw Error('La región no tiene un contorno abierto para extruir');
 if((count+boundary.length*2)>20000)throw Error('La extrusión supera el límite de 20.000 triángulos');
 const positions=[...data.positions],uvs=data.uvs?[...data.uvs]:undefined;
 const attributes=data.attributes?structuredClone(data.attributes):undefined;
 const groups=data.groups?data.groups.map(g=>({...g})):undefined;
 const groupMaterial=(f:number)=>data.groups?.find(g=>f*3>=g.start&&f*3<g.start+g.count)?.materialIndex??0;
 // Append each wall with the same corner attributes as its originating face.
 const pushCorner=(f:number,k:number,p:THREE.Vector3)=>{
  positions.push(...p.toArray());
  if(uvs)uvs.push(data.uvs![f*6+k*2],data.uvs![f*6+k*2+1]);
  if(attributes)for(const [name,attr] of Object.entries(attributes)){
   const source=data.attributes![name];attr.values.push(...source.values.slice((f*3+k)*source.itemSize,(f*3+k+1)*source.itemSize));
  }
 };
 for(const {f,a,b} of boundary){
  const pa=point(f,a),pb=point(f,b),qa=pa.clone().addScaledVector(normal,distance),qb=pb.clone().addScaledVector(normal,distance);
  const start=positions.length/3;
  for(const [k,p] of [[a,pa],[b,pb],[b,qb],[a,pa],[b,qb],[a,qa]] as Array<[number,THREE.Vector3]>)pushCorner(f,k,p);
  if(groups)groups.push({start,count:6,materialIndex:groupMaterial(f)});
 }
 // Move all cap corners only after the side walls have been generated.
 for(const f of region)for(let k=0;k<3;k++){
  const i=f*9+k*3;positions[i]+=normal.x*distance;positions[i+1]+=normal.y*distance;positions[i+2]+=normal.z*distance;
 }
 return {positions,uvs,attributes,groups};
}
/** Planar chamfer of a closed convex supporting edge. Reject diagonals and open/concave edges. */
export function bevelEdge(data:MeshData,edge:[number,number],width:number):MeshData {
 const vertex=(i:number)=>new THREE.Vector3().fromArray(data.positions,i*3);
 if(!Number.isFinite(width)||width<=0||edge.some(i=>!Number.isInteger(i)||i<0||i*3+2>=data.positions.length))throw Error('Arista o ancho inválido');
 const a=vertex(edge[0]),b=vertex(edge[1]);const eps=1e-6;
 const near=(v:THREE.Vector3,w:THREE.Vector3)=>v.distanceToSquared(w)<eps*eps;
 const normals:THREE.Vector3[]=[];
 for(let f=0;f<data.positions.length/9;f++){const v=[vertex(f*3),vertex(f*3+1),vertex(f*3+2)];if(v.some(v=>near(v,a))&&v.some(v=>near(v,b)))normals.push(v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0])).normalize())}
 if(normals.length!==2||normals[0].dot(normals[1])>.999)throw Error('Selecciona una arista entre dos caras no coplanares de una malla cerrada');
 const normal=normals[0].clone().add(normals[1]).normalize(),support=normal.dot(a);
 if(normal.lengthSq()<eps||data.positions.some((_,i)=>i%3===0&&normal.dot(new THREE.Vector3().fromArray(data.positions,i))>support+eps))throw Error('El bisel plano requiere una arista convexa de soporte');
 const limit=support-width;const minimum=Math.min(...Array.from({length:data.positions.length/3},(_,i)=>normal.dot(vertex(i))));
 if(limit<=minimum+eps)throw Error('El ancho de bisel elimina toda la malla');
 type V={p:THREE.Vector3;uv:THREE.Vector2;attributes:Record<string,number[]>};const cut:V[]=[],positions:number[]=[],uvs:number[]=[],groups:NonNullable<MeshData['groups']>=[];const attributes:NonNullable<MeshData['attributes']>=Object.fromEntries(Object.entries(data.attributes??{}).map(([name,a])=>[name,{itemSize:a.itemSize,values:[]}]));
 const emit=(v:V[],materialIndex:number)=>{const start=positions.length/3;for(let i=1;i<v.length-1;i++)for(const x of [v[0],v[i],v[i+1]]){positions.push(...x.p.toArray());uvs.push(...x.uv.toArray());for(const [name,attr] of Object.entries(attributes))attr.values.push(...x.attributes[name])}if(data.groups&&positions.length/3>start)groups.push({start,count:positions.length/3-start,materialIndex})};
 for(let f=0;f<data.positions.length/9;f++){
  const polygon:V[]=[0,1,2].map(j=>({p:vertex(f*3+j),uv:new THREE.Vector2().fromArray(data.uvs??[],(f*3+j)*2),attributes:Object.fromEntries(Object.entries(data.attributes??{}).map(([name,a])=>[name,a.values.slice((f*3+j)*a.itemSize,(f*3+j+1)*a.itemSize)]))}));if(!data.uvs)polygon.forEach(v=>v.uv.set(0,0));const result:V[]=[];
  for(let j=0;j<3;j++){const x=polygon[j],y=polygon[(j+1)%3],dx=normal.dot(x.p)-limit,dy=normal.dot(y.p)-limit;if(dx<=eps)result.push(x);if((dx>eps)!==(dy>eps)){const t=dx/(dx-dy),v={p:x.p.clone().lerp(y.p,t),uv:x.uv.clone().lerp(y.uv,t),attributes:Object.fromEntries(Object.entries(x.attributes).map(([name,a])=>[name,a.map((n,i)=>n+(y.attributes[name][i]-n)*t)]))};result.push(v);if(!cut.some(p=>near(p.p,v.p)))cut.push(v)}}emit(result,data.groups?.find(g=>f*3>=g.start&&f*3<g.start+g.count)?.materialIndex??0);
 }
 if(cut.length<3)throw Error('No se pudo cerrar el bisel');
 const center=cut.reduce((c,p)=>c.add(p.p),new THREE.Vector3()).divideScalar(cut.length),u=b.clone().sub(a).normalize(),v=normal.clone().cross(u).normalize();
 cut.sort((a,b)=>Math.atan2(a.p.clone().sub(center).dot(v),a.p.clone().sub(center).dot(u))-Math.atan2(b.p.clone().sub(center).dot(v),b.p.clone().sub(center).dot(u)));
 emit(cut.map(vertex=>({...vertex,uv:new THREE.Vector2(vertex.p.clone().sub(center).dot(u),vertex.p.clone().sub(center).dot(v))})),0);
 return {positions,uvs:data.uvs?uvs:undefined,attributes:data.attributes?attributes:undefined,groups:data.groups?groups:undefined};
}
export function EditableMesh({data,mode,onChange,onFace,onEdge,gizmoScene}:{data:MeshData;mode:ComponentMode;onChange:(d:MeshData)=>void;onFace:(face:number)=>void;onEdge:(edge:[number,number])=>void;gizmoScene?:THREE.Scene}) {
 const localScene=useThree(state=>state.scene);const scene=gizmoScene??localScene;
 const ref=useRef<THREE.Mesh>(null);const handle=useRef<THREE.Group>(null);
 const [indices,setIndices]=useState<number[]>([]);
 const geometry=useMemo(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));g.computeVertexNormals();g.computeBoundingSphere();return g},[data]);
 React.useEffect(()=>()=>geometry.dispose(),[geometry]);
 React.useEffect(()=>setIndices([]),[mode,data.positions.length]);
 const unique=indices.filter((i,k)=>i*3+2<data.positions.length&&!indices.slice(0,k).some(j=>new THREE.Vector3().fromArray(data.positions,i*3).distanceToSquared(new THREE.Vector3().fromArray(data.positions,j*3))<1e-12));
 const center=new THREE.Vector3();unique.forEach(i=>center.add(new THREE.Vector3().fromArray(data.positions,i*3)));if(unique.length)center.divideScalar(unique.length);
 const pick=(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();const face=e.faceIndex;if(face==null)return;onFace(face);const ids=[face*3,face*3+1,face*3+2];const local=ref.current!.worldToLocal(e.point.clone());
 let chosen=ids;
 if(mode==='vertex')chosen=[ids.reduce((a,b)=>new THREE.Vector3().fromArray(data.positions,a*3).distanceToSquared(local)<new THREE.Vector3().fromArray(data.positions,b*3).distanceToSquared(local)?a:b)];
 if(mode==='edge'){let best=Infinity;for(let i=0;i<3;i++){const a=ids[i],b=ids[(i+1)%3],line=new THREE.Line3(new THREE.Vector3().fromArray(data.positions,a*3),new THREE.Vector3().fromArray(data.positions,b*3));const d=line.closestPointToPoint(local,true,new THREE.Vector3()).distanceToSquared(local);if(d<best){best=d;chosen=[a,b]}}}
 if(mode==='edge')onEdge(chosen as [number,number]);
 // Weld coincident corners so moving an edge or vertex does not split UV seams.
 const all:number[]=[];for(let i=0;i<data.positions.length/3;i++)if(chosen.some(j=>new THREE.Vector3().fromArray(data.positions,i*3).distanceToSquared(new THREE.Vector3().fromArray(data.positions,j*3))<1e-12))all.push(i);
 // Shift adds components; Ctrl/Cmd toggles them. A normal click replaces selection.
 // Coincident corners share a selection to prevent tearing at UV seams.
 const native=e.nativeEvent;
 const additive=native.shiftKey;
 const toggle=native.ctrlKey||native.metaKey;
 setIndices(previous=>{
   if(!additive&&!toggle)return all;
   const current=new Set(previous);
   if(toggle){const remove=all.every(i=>current.has(i));for(const i of all){if(remove)current.delete(i);else current.add(i)}}
   else for(const i of all)current.add(i);
   return [...current].sort((a,b)=>a-b);
 });
 };
 return <group userData={{editorOnly:true}}><mesh ref={ref} geometry={geometry} onClick={pick}><meshBasicMaterial color="#ffbd59" wireframe transparent opacity={.45} depthTest={false}/></mesh>{unique.map(i=><mesh key={i} position={new THREE.Vector3().fromArray(data.positions,i*3)}><sphereGeometry args={[.04,8,8]}/><meshBasicMaterial color="#ff6600" depthTest={false}/></mesh>)}{indices.length>0&&<group ref={handle} position={center}><mesh><sphereGeometry args={[.065,8,8]}/><meshBasicMaterial color="#ffcc55" depthTest={false}/></mesh></group>}{indices.length>0&&createPortal(<TransformControls object={handle as React.MutableRefObject<THREE.Group>} mode="translate" onMouseUp={()=>{if(!handle.current)return;const delta=handle.current.position.clone().sub(center),p=[...data.positions];indices.forEach(i=>{p[i*3]+=delta.x;p[i*3+1]+=delta.y;p[i*3+2]+=delta.z});onChange({...data,positions:p})}}/>,scene)}</group>;
}
