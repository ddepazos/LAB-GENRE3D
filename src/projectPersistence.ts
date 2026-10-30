import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {HandSnapshot} from './HandLab';
import type {CharacterSnapshot} from './CharacterLab';
import {type MeshData,geometryData,setMeshData} from './meshData';
import type {MaterialPreset} from './materialPresets';
export type Vec3=[number,number,number];
export type Shape='box'|'sphere'|'torus'|'cone'|'cylinder';
export type Item={id:number;name:string;shape:Shape;color:string;visible:boolean;position:Vec3;rotation:Vec3;scale:Vec3;metalness?:number;roughness?:number;wireframe?:boolean;flatShading?:boolean;segments?:number;meshOffset?:Vec3;preset?:MaterialPreset;geometry?:MeshData};
export type RigKey={frame:number;bones:number[][];morphs:number[]};
export type ImportedAsset={id:number;name:string;object:THREE.Group;sourceGlb:string;clips:THREE.AnimationClip[];visible:boolean;position:Vec3;rotation:Vec3;scale:Vec3;morphCount:number;boneCount:number;morphs:{name:string;mesh:THREE.Mesh;index:number}[];bones:THREE.Bone[];restRotations:Vec3[];rigKeys:RigKey[]};
type NodeState={path:number[];position:Vec3;quaternion:[number,number,number,number];scale:Vec3;visible:boolean;morphs?:number[];geometry?:MeshData};
type SavedAsset=Pick<ImportedAsset,'id'|'name'|'sourceGlb'|'visible'|'position'|'rotation'|'scale'|'restRotations'|'rigKeys'>&{nodes:NodeState[]};
export type EditorState={frame:number;showGrid:boolean;transparent:boolean;rigLoop:boolean;timelineOpen:boolean;selected:number|null;selectedAsset:number|null};
export type ModuleState={hand?:HandSnapshot;character?:CharacterSnapshot};
export type ProjectFile={application:'LAB GENRE3D';version:3;items:Item[];assets:SavedAsset[];editor:EditorState;modules?:ModuleState};
export const MAX_PROJECT_BYTES=128*1024*1024;
const MAX_GLB_BYTES=40*1024*1024;
const defaults:EditorState={frame:0,showGrid:true,transparent:false,rigLoop:true,timelineOpen:true,selected:null,selectedAsset:null};
const fail=(message:string):never=>{throw new Error(message)};
function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))fail('Estructura de proyecto inválida');return value as Record<string,unknown>}
function array(value:unknown,max=10000):unknown[]{if(!Array.isArray(value)||value.length>max)fail('Lista inválida o demasiado extensa');return value as unknown[]}
function number(value:unknown):number{if(typeof value!=='number'||!Number.isFinite(value))fail('El proyecto contiene valores numéricos inválidos');return value as number}
function vector(value:unknown,length:number):number[]{const values=array(value,length);if(values.length!==length)fail('Vector inválido');return values.map(number)}
const vec3=(value:unknown)=>vector(value,3) as Vec3;
function bool(value:unknown):boolean{if(typeof value!=='boolean')fail('Valor lógico inválido');return value as boolean}
function id(value:unknown):number{const n=number(value);if(!Number.isSafeInteger(n)||n<0)fail('Identificador inválido');return n}
function name(value:unknown):string{if(typeof value!=='string'||!value.length||value.length>512)fail('Nombre de objeto inválido');return value as string}
function uniqueIds(objects:{id:number}[]){if(new Set(objects.map(o=>o.id)).size!==objects.length)fail('Hay identificadores duplicados')}
function item(value:unknown):Item{
 const v=record(value);if(!['box','sphere','torus','cone','cylinder'].includes(String(v.shape)))fail('Primitiva incompatible');
 if(typeof v.color!=='string'||!/^#[0-9a-f]{6}$/i.test(v.color))fail('Color inválido');
 const result:Item={id:id(v.id),name:name(v.name),shape:v.shape as Shape,color:v.color as string,visible:bool(v.visible),position:vec3(v.position),rotation:vec3(v.rotation),scale:vec3(v.scale)};
 for(const k of ['metalness','roughness'] as const)if(v[k]!==undefined){const n=number(v[k]);if(n<0||n>1)fail('Material fuera de rango');result[k]=n}
 for(const k of ['wireframe','flatShading'] as const)if(v[k]!==undefined)result[k]=bool(v[k]);
 if(v.segments!==undefined){const n=id(v.segments);if(n<3||n>64)fail('Resolución geométrica inválida');result.segments=n}
 if(v.meshOffset!==undefined)result.meshOffset=vec3(v.meshOffset);
 if(v.preset!==undefined){if(!['liso','piel','hueso','metal','piedra','madera','escamas'].includes(String(v.preset)))fail('Material procedural incompatible');result.preset=v.preset as MaterialPreset}
 if(v.geometry!==undefined)result.geometry=meshValue(v.geometry);
 return result;
}
function meshValue(value:unknown):MeshData {
 const g=record(value),positions=array(g.positions,6000000).map(number);if(!positions.length||positions.length%9)fail('Malla triangular inválida');const result:MeshData={positions};
 if(g.uvs!==undefined){const uvs=array(g.uvs,4000000).map(number);if(uvs.length!==positions.length/3*2)fail('UV incompatibles con la malla');result.uvs=uvs}
 if(g.attributes!==undefined){result.attributes={};for(const [name,value] of Object.entries(record(g.attributes))){if(!['color','uv1','uv2'].includes(name))fail('Atributo de malla incompatible');const a=record(value),itemSize=id(a.itemSize);if(name==='color'?![3,4].includes(itemSize):itemSize!==2)fail('Dimensión de atributo inválida');const values=array(a.values,8000000).map(number);if(values.length!==positions.length/3*itemSize)fail('Atributo incompleto');result.attributes[name]={itemSize,values}}}
 if(g.groups!==undefined)result.groups=array(g.groups,100000).map(value=>{const g=record(value),start=id(g.start),count=id(g.count),materialIndex=id(g.materialIndex);if(start%3||count%3||start+count>positions.length/3)fail('Grupo de material inválido');return {start,count,materialIndex}});
 return result;
}
export function encodeGlb(buffer:ArrayBuffer):string {
 const bytes=new Uint8Array(buffer);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);
}
function decodeGlb(source:unknown):ArrayBuffer {
 if(typeof source!=='string'||source.length>Math.ceil(MAX_GLB_BYTES/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(source))fail('GLB incrustado inválido o mayor a 40 MB');
 let binary:string;try{binary=atob(source as string)}catch{return fail('GLB incrustado inválido')}
 return Uint8Array.from(binary,c=>c.charCodeAt(0)).buffer;
}
function checkGlb(buffer:ArrayBuffer){
 if(buffer.byteLength<20||buffer.byteLength>MAX_GLB_BYTES)fail('GLB fuera del límite de 40 MB');const view=new DataView(buffer);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength||view.getUint32(16,true)!==0x4e4f534a)fail('El modelo no es un GLB 2.0 válido');
 const size=view.getUint32(12,true);if(size>buffer.byteLength-20)fail('GLB truncado');
 const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,size)));
 for(const entry of [...(doc.buffers??[]),...(doc.images??[])])if(entry.uri&&!String(entry.uri).startsWith('data:'))fail('El GLB debe contener sus recursos; no se admiten enlaces externos');
}
export async function loadAsset(buffer:ArrayBuffer,name:string,assetId:number):Promise<ImportedAsset>{
 checkGlb(buffer);const gltf=await new GLTFLoader().parseAsync(buffer,'');
 const bones:THREE.Bone[]=[],morphs:ImportedAsset['morphs']=[];
 gltf.scene.traverse(node=>{if((node as THREE.Bone).isBone)bones.push(node as THREE.Bone);if((node as THREE.Mesh).isMesh){const mesh=node as THREE.Mesh;for(const [name,index] of Object.entries(mesh.morphTargetDictionary??{}))morphs.push({name,mesh,index})}});
 return {id:assetId,name,object:gltf.scene,sourceGlb:encodeGlb(buffer),clips:gltf.animations,visible:true,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],bones,morphs,boneCount:bones.length,morphCount:morphs.length,restRotations:bones.map(b=>[b.rotation.x,b.rotation.y,b.rotation.z]),rigKeys:[]};
}
function walk(root:THREE.Object3D,callback:(node:THREE.Object3D,path:number[])=>void,path:number[]=[]){if(root.userData.editorOnly)return;callback(root,path);root.children.forEach((node,index)=>walk(node,callback,[...path,index]))}
function snapshot(asset:ImportedAsset):SavedAsset{
 const nodes:NodeState[]=[];walk(asset.object,(node,path)=>{const mesh=node as THREE.Mesh;nodes.push({path,position:node.position.toArray() as Vec3,quaternion:node.quaternion.toArray(),scale:node.scale.toArray() as Vec3,visible:node.visible,...(mesh.isMesh&&mesh.geometry.userData.genre3dEdited?{geometry:geometryData(mesh.geometry)}:{}),...(mesh.morphTargetInfluences?{morphs:[...mesh.morphTargetInfluences]}:{})})});
 return {id:asset.id,name:asset.name,sourceGlb:asset.sourceGlb,position:[...asset.position],rotation:[...asset.rotation],scale:[...asset.scale],visible:asset.visible,restRotations:asset.restRotations.map(v=>[...v]),rigKeys:structuredClone(asset.rigKeys),nodes};
}
export function createProject(items:Item[],assets:ImportedAsset[],editor:EditorState,modules:ModuleState={}):Blob {
 const file:ProjectFile={application:'LAB GENRE3D',version:3,items:items.map(item),assets:assets.map(snapshot),editor:{...editor},modules:structuredClone(modules)};
 const blob=new Blob([JSON.stringify(file)],{type:'application/json'});if(blob.size>MAX_PROJECT_BYTES)fail('El proyecto supera 128 MB');return blob;
}
export async function openProject(blob:Blob):Promise<{items:Item[];assets:ImportedAsset[];editor:EditorState;legacy:boolean;modules:ModuleState}>{
 if(blob.size>MAX_PROJECT_BYTES)fail('El proyecto supera 128 MB');
 const file=record(JSON.parse(await blob.text()));
 if(file.application!=='LAB GENRE3D'||![1,2,3].includes(file.version as number))fail('No es un proyecto compatible de GENRE3D');
 const items=array(file.items,2000).map(item);uniqueIds(items);
 if(file.version===1)return {items,assets:[],editor:{...defaults},legacy:true,modules:{}};
 const saved=array(file.assets,200),assets:ImportedAsset[]=[];
 // Resolve everything before returning so failures never partially replace the active scene.
 for(const value of saved){
  const v=record(value),source=decodeGlb(v.sourceGlb),asset=await loadAsset(source,name(v.name),id(v.id));
  asset.position=vec3(v.position);asset.rotation=vec3(v.rotation);asset.scale=vec3(v.scale);asset.visible=bool(v.visible);
  const nodes=array(v.nodes,100000);const paths=new Set<string>();let nodeCount=0;walk(asset.object,()=>nodeCount++);if(nodes.length!==nodeCount)fail('La jerarquía guardada no coincide con el GLB');
  for(const value of nodes){const state=record(value),path=array(state.path,256).map(id);const key=path.join('/');if(paths.has(key))fail('Nodo duplicado');paths.add(key);let node:THREE.Object3D=asset.object;for(const i of path){if(!node.children[i])fail('Ruta de nodo inválida');node=node.children[i]}
   node.position.fromArray(vec3(state.position));const q=vector(state.quaternion,4);if(Math.abs(new THREE.Quaternion().fromArray(q).length()-1)>.001)fail('Rotación de nodo inválida');node.quaternion.fromArray(q);node.scale.fromArray(vec3(state.scale));node.visible=bool(state.visible);
   if(state.geometry!==undefined){if(!(node as THREE.Mesh).isMesh)fail('El nodo no es una malla');const data=meshValue(state.geometry),mesh=node as THREE.Mesh;const materials=Array.isArray(mesh.material)?mesh.material:null;if(materials&&data.groups?.some(g=>g.materialIndex>=materials.length))fail('Material de submalla inválido');setMeshData(mesh,data)}
   const morphs=(node as THREE.Mesh).morphTargetInfluences;if(morphs){const values=array(state.morphs,morphs.length).map(number);if(values.length!==morphs.length)fail('Expresiones incompatibles');values.forEach((v,i)=>{morphs[i]=v})}else if(state.morphs!==undefined)fail('El nodo no tiene expresiones');
  }
  asset.restRotations=array(v.restRotations,asset.bones.length).map(vec3);if(asset.restRotations.length!==asset.bones.length)fail('Pose de reposo incompatible');
  const frames=new Set<number>();asset.rigKeys=array(v.rigKeys,241).map(value=>{const key=record(value),frame=id(key.frame);if(frame>240||frames.has(frame))fail('Fotograma de rig inválido');frames.add(frame);const bones=array(key.bones,asset.bones.length).map(vec3),morphs=array(key.morphs,asset.morphs.length).map(number);if(bones.length!==asset.bones.length||morphs.length!==asset.morphs.length)fail('Keyframe incompatible con el rig');return {frame,bones,morphs}}).sort((a,b)=>a.frame-b.frame);
  asset.object.updateMatrixWorld(true);assets.push(asset);
 }
 uniqueIds(assets);const e=record(file.editor),frame=id(e.frame);if(frame>240)fail('Fotograma fuera de rango');
 const selected=e.selected===null?null:id(e.selected),selectedAsset=e.selectedAsset===null?null:id(e.selectedAsset);
 const editor:EditorState={frame,showGrid:bool(e.showGrid),transparent:bool(e.transparent),rigLoop:bool(e.rigLoop),timelineOpen:bool(e.timelineOpen),selected:items.some(i=>i.id===selected)?selected:null,selectedAsset:assets.some(a=>a.id===selectedAsset)?selectedAsset:null};
 if(editor.selectedAsset!==null)editor.selected=null;
 return {items,assets,editor,legacy:false,modules:moduleState(file.modules)};
}
function moduleState(value:unknown):ModuleState {
 if(value===undefined)return {};const v=record(value),result:ModuleState={};
 if(v.hand!==undefined){const hand=record(v.hand),angles=vector(hand.angles,5);if(angles.some(n=>n<0||n>95))fail('Ángulos de mano inválidos');result.hand={pose:name(hand.pose),angles:angles as HandSnapshot['angles']}}
 if(v.character!==undefined){const c=record(v.character);
  if(!['Humano','Robot','Maniquí','Criatura'].includes(String(c.kind))||!['Reposo','Caminar','Correr','Saludar','Saltar'].includes(String(c.motion)))fail('Personaje incompatible');
  const speed=number(c.speed),faceFrame=id(c.faceFrame);if(speed<.2||speed>2||faceFrame>240)fail('Tiempo de personaje inválido');
  const angleData=record(c.angles),angles={} as CharacterSnapshot['angles'];for(const key of ['Hombro izq.','Codo izq.','Muñeca izq.','Hombro der.','Codo der.','Muñeca der.','Cadera izq.','Rodilla izq.','Tobillo izq.','Cadera der.','Rodilla der.','Tobillo der.'] as const){angles[key]=number(angleData[key]);if(Math.abs(angles[key])>120)fail('Articulación fuera de rango')}
  const pose=(value:unknown)=>{const v=record(value),result={} as CharacterSnapshot['face'];for(const key of ['jaw','brow','blink','gazeX','gazeY','smile','lipOpen','tongue','browLeft','browRight'] as const){result[key]=number(v[key]);if(Math.abs(result[key])>100)fail('Expresión fuera de rango')}return result};
  const frames=new Set<number>();const faceKeys=array(c.faceKeys,241).map(value=>{const key=record(value),frame=id(key.frame);if(frame>240||frames.has(frame))fail('Keyframe facial inválido');frames.add(frame);return {frame,pose:pose(key.pose)}}).sort((a,b)=>a.frame-b.frame);
  result.character={kind:c.kind as CharacterSnapshot['kind'],motion:c.motion as CharacterSnapshot['motion'],speed,angles,face:pose(c.face),facePreset:name(c.facePreset),faceFrame,faceKeys};
 }
 return result;
}
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('genre3d-projects',1);request.onupgradeneeded=()=>request.result.createObjectStore('backups');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
export async function saveProjectBackup(blob:Blob):Promise<void>{const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('backups','readwrite');tx.objectStore('backups').put(blob,'last-project');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
export async function readProjectBackup():Promise<Blob>{const db=await database();try{return await new Promise((resolve,reject)=>{const request=db.transaction('backups').objectStore('backups').get('last-project');request.onsuccess=()=>request.result instanceof Blob?resolve(request.result):reject(new Error('Todavía no hay un proyecto guardado en este navegador'));request.onerror=()=>reject(request.error)})}finally{db.close()}}
