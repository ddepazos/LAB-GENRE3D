import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {KTX2Loader} from 'three/examples/jsm/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const version='0.175.0';
const base='https://cdn.jsdelivr.net/npm/three@'+version+'/examples/jsm/libs/';
let renderer:THREE.WebGLRenderer|null=null;
export function registerAssetRenderer(gl:THREE.WebGLRenderer){renderer=gl}
export type AssetProgress={phase:'reading'|'decoding'|'ready';percent:number};
export function triangleCount(root:THREE.Object3D){
 let total=0;root.traverse(n=>{const mesh=n as THREE.Mesh;if(mesh.isMesh){const g=mesh.geometry;total+=g.index?g.index.count/3:g.getAttribute('position')?.count/3||0}});return Math.round(total);
}
export async function readModelFile(file:File,progress:(value:AssetProgress)=>void):Promise<ArrayBuffer>{
 if(file.size>40*1024*1024)throw new Error('Límite de proyecto actual: 40 MB comprimidos. Optimiza o procesa el modelo remotamente.');
 if(!file.stream){progress({phase:'reading',percent:0});const data=await file.arrayBuffer();progress({phase:'reading',percent:100});return data}
 const reader=file.stream().getReader();const parts:Uint8Array[]=[];let received=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);received+=value.byteLength;progress({phase:'reading',percent:Math.min(100,Math.round(received/file.size*100))})}}
 finally{reader.releaseLock()}
 const result=new Uint8Array(received);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.byteLength}
 return result.buffer;
}
export async function decodeCompressedGlb(data:ArrayBuffer):Promise<{scene:THREE.Group;animations:THREE.AnimationClip[];triangles:number}>{
 const loader=new GLTFLoader();const draco=new DRACOLoader();
 draco.setDecoderPath(base+'draco/');draco.setWorkerLimit(2);loader.setDRACOLoader(draco);
 loader.setMeshoptDecoder(MeshoptDecoder);
 let ktx2:KTX2Loader|null=null;
 if(renderer){ktx2=new KTX2Loader();ktx2.setTranscoderPath(base+'basis/');ktx2.setWorkerLimit(2);ktx2.detectSupport(renderer);loader.setKTX2Loader(ktx2)}
 try{
   const gltf=await loader.parseAsync(data,'');
   return {scene:gltf.scene,animations:gltf.animations,triangles:triangleCount(gltf.scene)};
 }catch(e){throw new Error('No se pudo decodificar el GLB (Draco/meshopt/KTX2): '+(e instanceof Error?e.message:String(e)))}
 finally{draco.dispose();ktx2?.dispose()}
}
export function disposeModel(root:THREE.Object3D,protectedRoots:THREE.Object3D[]=[]){
 const used=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const protectedGeometry=new Set<THREE.BufferGeometry>(),protectedMaterials=new Set<THREE.Material>(),protectedTextures=new Set<THREE.Texture>();
 function collect(node:THREE.Object3D,geo:Set<THREE.BufferGeometry>,mat:Set<THREE.Material>,tex:Set<THREE.Texture>){
 node.traverse(o=>{const m=o as THREE.Mesh;if(!m.isMesh)return;geo.add(m.geometry);for(const material of (Array.isArray(m.material)?m.material:[m.material])){mat.add(material);for(const v of Object.values(material)){if(v instanceof THREE.Texture)tex.add(v)}}});
 }
 protectedRoots.forEach(r=>collect(r,protectedGeometry,protectedMaterials,protectedTextures));
 collect(root,used,materials,textures);
 used.forEach(g=>{if(!protectedGeometry.has(g))g.dispose()});
 textures.forEach(t=>{if(!protectedTextures.has(t)){t.dispose();const img=t.image as {close?:()=>void}|undefined;img?.close?.()}});
 materials.forEach(m=>{if(!protectedMaterials.has(m))m.dispose()});
 root.removeFromParent();
}
