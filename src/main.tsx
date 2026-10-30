import {createRigTemplate} from './rigTemplate';
import {assetAnimationClips} from './rigAnimation';
import {ImportedAnimation} from './ImportedAnimation';
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, ThreeEvent, createPortal, useThree } from "@react-three/fiber";
import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { enableMeshAcceleration } from "./meshEngine";
enableMeshAcceleration();
import "./style.css";
import HandLab from "./HandLab";
import { exportToLabStudio, serializeSceneGlb } from "./labInterop";
import { processGlbRemotely, type BlenderOperation } from "./blenderRemote";
import CharacterLab from "./CharacterLab";
import {presets,useProceduralMaps,type MaterialPreset} from "./materialPresets";

import {EditableMesh,geometryData,faceOperation,bevelEdge,type MeshData,type ComponentMode} from "./EditableMesh";

import {meshParts,meshEditReason,setMeshData,bakeEditableCopy} from './meshData';

type Mode = "translate" | "rotate" | "scale";
const initial: Item[] = [{ id: 1, name: "Cubo 01", shape: "box", color: "#a9b6ff", visible: true, position: [0,1,0], rotation: [0,0,0], scale: [1,1,1] }];
const shapes: Shape[] = ["box","sphere","torus","cone","cylinder"];
const labels: Record<Shape,string> = {box:"Cubo",sphere:"Esfera",torus:"Toro",cone:"Cono",cylinder:"Cilindro"};
function Geometry({shape,segments=24,offset=[0,0,0]}:{shape:Shape;segments?:number;offset?:[number,number,number]}) {
  const geometry=React.useMemo(()=>{let g:THREE.BufferGeometry;switch(shape){case "sphere":g=new THREE.SphereGeometry(.8,segments,Math.max(8,Math.floor(segments*.7)));break;case "torus":g=new THREE.TorusGeometry(.7,.25,12,segments);break;case "cone":g=new THREE.ConeGeometry(.8,1.6,segments);break;case "cylinder":g=new THREE.CylinderGeometry(.7,.7,1.6,segments);break;default:g=new THREE.BoxGeometry(1.5,1.5,1.5)}g.translate(...offset);g.computeBoundingBox();g.computeBoundingSphere();return g},[shape,segments,offset[0],offset[1],offset[2]]);
  React.useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <primitive object={geometry} attach="geometry"/>;
}
function UnusedGeometry({shape,segments=24}:{shape:Shape;segments?:number}) {
  switch(shape) {
    case "sphere": return <sphereGeometry args={[.8,segments,Math.max(8,Math.floor(segments*.7))]}/>;
    case "torus": return <torusGeometry args={[.7,.25,12,segments]}/>;
    case "cone": return <coneGeometry args={[.8,1.6,segments]}/>;
    case "cylinder": return <cylinderGeometry args={[.7,.7,1.6,segments]}/>;
    default: return <boxGeometry args={[1.5,1.5,1.5]}/>;
  }
}
function Object3D({item,selected,mode,onSelect,onTransform,editMode,onGeometry,onFace,onEdge}:{item:Item;selected:boolean;mode:Mode;onSelect:(id:number)=>void;onTransform:(id:number,mesh:THREE.Mesh)=>void;editMode:ComponentMode;onGeometry:(id:number,data:MeshData)=>void;onFace:(face:number)=>void;onEdge:(edge:[number,number])=>void}) {
  const ref=useRef<THREE.Mesh>(null);
  const maps=useProceduralMaps(item.preset??"liso",256);
  if(!item.visible)return null;
  const mesh=<mesh ref={ref} name={item.name} position={item.position} rotation={item.rotation} scale={item.scale} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(item.id)}}>
    {item.geometry?<bufferGeometry onUpdate={g=>g.computeVertexNormals()}><bufferAttribute attach="attributes-position" args={[new Float32Array(item.geometry.positions),3]}/>{item.geometry.uvs&&<bufferAttribute attach="attributes-uv" args={[new Float32Array(item.geometry.uvs),2]}/>}</bufferGeometry>:<Geometry shape={item.shape} segments={item.segments} offset={item.meshOffset}/>}<meshStandardMaterial color={item.color} metalness={item.metalness??.25} roughness={item.roughness??.5} wireframe={item.wireframe??false} flatShading={item.flatShading??false} map={maps?.color??null} normalMap={maps?.normal??null} normalScale={new THREE.Vector2(.35,.35)}/>
  </mesh>;
  if(selected&&editMode!=='object')return <group position={item.position} rotation={item.rotation} scale={item.scale}><mesh><bufferGeometry onUpdate={g=>g.computeVertexNormals()}><bufferAttribute attach="attributes-position" args={[new Float32Array(item.geometry?.positions??[]),3]}/>{item.geometry?.uvs&&<bufferAttribute attach="attributes-uv" args={[new Float32Array(item.geometry.uvs),2]}/>}</bufferGeometry><meshStandardMaterial color={item.color} side={THREE.DoubleSide} metalness={item.metalness??.25} roughness={item.roughness??.5} map={maps?.color??null} normalMap={maps?.normal??null}/></mesh>{item.geometry&&<EditableMesh data={item.geometry} mode={editMode} onChange={d=>onGeometry(item.id,d)} onFace={onFace} onEdge={onEdge}/>}</group>;
  return selected ? <TransformControls object={ref as React.MutableRefObject<THREE.Object3D>} mode={mode} onMouseUp={()=>{if(ref.current)onTransform(item.id,ref.current)}}>{mesh}</TransformControls> : mesh;
}
function ImportedGLB({object,selected,mode,position,rotation,scale,onSelect,onTransform,componentMode=false,componentMesh}:{object:THREE.Group;selected:boolean;mode:Mode;position:[number,number,number];rotation:[number,number,number];scale:[number,number,number];onSelect:(mesh?:THREE.Mesh)=>void;onTransform:(group:THREE.Group)=>void;componentMode?:boolean;componentMesh?:THREE.Mesh}) {
  const ref=useRef<THREE.Group>(null);
  const node=<group ref={ref} position={position} rotation={rotation} scale={scale} onClick={(e:ThreeEvent<MouseEvent>)=>{if(!componentMode||e.object!==componentMesh)e.stopPropagation();onSelect((e.object as THREE.Mesh).isMesh?e.object as THREE.Mesh:undefined)}}><primitive object={object}/></group>;
  return selected&&!componentMode?<TransformControls object={ref as React.MutableRefObject<THREE.Object3D>} mode={mode} onMouseUp={()=>{if(ref.current)onTransform(ref.current)}}>{node}</TransformControls>:node;
}
function ImportedMeshEditor({mesh,data,mode,onChange,onFace,onEdge}:{mesh:THREE.Mesh;data:MeshData;mode:ComponentMode;onChange:(data:MeshData)=>void;onFace:(face:number)=>void;onEdge:(edge:[number,number])=>void}) {
 const scene=useThree(state=>state.scene);
 return createPortal(<EditableMesh data={data} mode={mode} onChange={onChange} onFace={onFace} onEdge={onEdge} gizmoScene={scene}/>,mesh);
}
import {loadAsset,createProject,openProject,saveProjectBackup,readProjectBackup,type Shape,type Item,type ImportedAsset,type RigKey,type ModuleState} from './projectPersistence';
function App(){
  const exportGroup=useRef<THREE.Group>(null);
  const [exportingGlb,setExportingGlb]=useState(false);
  const [exportFiles,setExportFiles]=useState<{glb:string;manifest:string;data:Blob;name:string;clips:number;duration:number}|null>(null);
  useEffect(()=>()=>{if(exportFiles){URL.revokeObjectURL(exportFiles.glb);URL.revokeObjectURL(exportFiles.manifest)}},[exportFiles]);
  const exportGlb=async()=>{if(!exportGroup.current||exportingGlb)return;setExportingGlb(true);try{const clips=assets.filter(a=>a.visible).flatMap(a=>{return assetAnimationClips(a)});await exportToLabStudio(exportGroup.current,{name:"genre3d-scene",fps:30,clips,onReady:files=>setExportFiles({glb:URL.createObjectURL(files.glb),data:files.glb,manifest:URL.createObjectURL(files.manifest),name:files.name,clips:clips.length,duration:Math.max(0,...clips.map(c=>c.duration))})});}catch(error){alert("No se pudo exportar GLB: "+(error instanceof Error?error.message:String(error)));}finally{setExportingGlb(false)}};
  const [blenderBusy,setBlenderBusy]=useState(false);
  const [blenderNotice,setBlenderNotice]=useState("");
  const [blenderOperation,setBlenderOperation]=useState<BlenderOperation>("smooth");
  const processBlenderFile=async(file?:File)=>{
    if(!file||blenderBusy)return;
    setBlenderBusy(true);setBlenderNotice("Procesando en Blender…");
    try {
      const output=await processGlbRemotely(file,blenderOperation);
      const imported=await importGlb(new File([output],"blender-"+blenderOperation+"-"+file.name,{type:"model/gltf-binary"}));
      if(!imported)throw new Error("El resultado no pudo añadirse al lienzo.");
      setBlenderNotice("Blender: modelo procesado y añadido al lienzo.");
      const url=URL.createObjectURL(output);
      const anchor=document.createElement("a");
      anchor.href=url;anchor.download="genre3d-processed.glb";anchor.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),15000);
    } catch(error) {
      const message=error instanceof Error?error.message:String(error);setBlenderNotice("Error Blender: "+message);alert("Blender: "+message);
    } finally {setBlenderBusy(false)}
  };
  const processCurrentScene=async()=>{if(!exportGroup.current||blenderBusy||exportingGlb)return;setExportingGlb(true);try{const blob=await serializeSceneGlb(exportGroup.current);await processBlenderFile(new File([blob],"escena.glb",{type:"model/gltf-binary"}))}catch(error){setBlenderNotice("No se pudo preparar la escena: "+(error instanceof Error?error.message:String(error)))}finally{setExportingGlb(false)}};
  const [items,setItems]=useState<Item[]>(initial);
  const [assets,setAssets]=useState<ImportedAsset[]>([]);
  const [selectedAsset,setSelectedAsset]=useState<number|null>(null);
  const [importedClipIndex,setImportedClipIndex]=useState(0);
  const [importedPlaying,setImportedPlaying]=useState(false);
  useEffect(()=>{setImportedPlaying(false);setImportedClipIndex(0)},[selectedAsset]);
  const [selectedPart,setSelectedPart]=useState<{assetId:number;key:string}|null>(null);
  const [extrudeDistance,setExtrudeDistance]=useState(.25);
  const [rigRevision,setRigRevision]=useState(0);
  const importGlb=async(file?:File)=>{
    if(!file)return;
    if(file.size>40*1024*1024){alert("El GLB supera el límite local de 40 MB.");return}
    try{
      const buffer=await file.arrayBuffer();
      const id=Math.max(Date.now(),...assets.map(a=>a.id+1));
      const asset=await loadAsset(buffer,file.name,id);
      setAssets(prev=>[...prev,asset]);
      setSelectedAsset(id);setSelected(null);setHandOpen(false);setLibrary(null);return true;
    }catch(error){alert("Error al importar GLB: "+(error instanceof Error?error.message:String(error)));return false}
  };
  const addRigTemplate=async()=>{
    if(projectBusy||blenderBusy||exportingGlb)return;
    setExportingGlb(true);const template=createRigTemplate();
    try{const blob=await serializeSceneGlb(template);await importGlb(new File([blob],"Brazo-articulado-LAB.glb",{type:"model/gltf-binary"}));setProjectNotice('Rig añadido: 3 huesos, pesos y expresión Volumen. Guarda poses para animarlo.')}catch(error){setProjectNotice('No se pudo crear el rig: '+(error instanceof Error?error.message:String(error)))}finally{template.traverse(node=>{const mesh=node as THREE.Mesh;if(mesh.isMesh){mesh.geometry.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];materials.forEach(m=>m.dispose())}});setExportingGlb(false)}
  };
  const updateAsset=(id:number,patch:Partial<ImportedAsset>)=>setAssets(prev=>prev.map(a=>a.id===id?{...a,...patch}:a));
  const [selected,setSelected]=useState<number|null>(1);
  const [editMode,setEditMode]=useState<ComponentMode>("object");
  const [selectedFace,setSelectedFace]=useState<number|null>(null);
  const [selectedEdge,setSelectedEdge]=useState<[number,number]|null>(null);
  const [bevelWidth,setBevelWidth]=useState(.1);
  const [meshMessage,setMeshMessage]=useState('');
  useEffect(()=>{setSelectedFace(null);setSelectedEdge(null);setMeshMessage('')},[selected]);
  const [meshHistory,setMeshHistory]=useState<{id:number;data:MeshData;assetId?:number;path?:number[]}[]>([]);
  const [mode,setMode]=useState<Mode>("translate");
  const [tab,setTab]=useState("Modelar");
  const [handOpen,setHandOpen]=useState(false);
  const [menuOpen,setMenuOpen]=useState<string|null>(null);
  const [library,setLibrary]=useState<"figuras"|"materiales"|"personajes"|null>(null);
  const [transparent,setTransparent]=useState(false);
  const [showGrid,setShowGrid]=useState(true);
  const [timelineOpen,setTimelineOpen]=useState(true);
  const [frame,setFrame]=useState(0);
  const [rigPlaying,setRigPlaying]=useState(false);
  const [rigLoop,setRigLoop]=useState(true);
  const [showSkeleton,setShowSkeleton]=useState(false);
  useEffect(()=>setRigPlaying(false),[selectedAsset]);
  const captureRig=()=>{
    if(!currentAsset)return;
    setImportedPlaying(false);
    const key:RigKey={frame,bones:currentAsset.bones.map(b=>[b.rotation.x,b.rotation.y,b.rotation.z]),morphs:currentAsset.morphs.map(m=>m.mesh.morphTargetInfluences?.[m.index]??0)};
    updateAsset(currentAsset.id,{rigKeys:[...currentAsset.rigKeys.filter(k=>k.frame!==frame),key].sort((a,b)=>a.frame-b.frame)});
  };
  const seekRig=(nextFrame:number)=>{
    setImportedPlaying(false);
    setFrame(nextFrame);
    const a=assets.find(x=>x.id===selectedAsset);
    if(!a||a.rigKeys.length===0)return;
    const keys=a.rigKeys;
    const before=[...keys].reverse().find(k=>k.frame<=nextFrame)??keys[0];
    const after=keys.find(k=>k.frame>=nextFrame)??keys[keys.length-1];
    const t=before.frame===after.frame?0:(nextFrame-before.frame)/(after.frame-before.frame);
    a.bones.forEach((bone,i)=>{const b=before.bones[i]??[0,0,0],c=after.bones[i]??b;bone.quaternion.copy(new THREE.Quaternion().setFromEuler(new THREE.Euler(b[0],b[1],b[2]))).slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(c[0],c[1],c[2])),t)});
    a.morphs.forEach((m,i)=>{if(m.mesh.morphTargetInfluences)m.mesh.morphTargetInfluences[m.index]=(before.morphs[i]??0)*(1-t)+(after.morphs[i]??0)*t});
    setRigRevision(v=>v+1);
  };
  useEffect(()=>{
    if(!rigPlaying)return;
    const start=performance.now(),first=frame;let request=0;
    const tick=(now:number)=>{const elapsed=first+Math.floor((now-start)*30/1000);if(elapsed>240&&!rigLoop){setFrame(240);setRigPlaying(false);return}setFrame(rigLoop?elapsed%241:Math.min(240,elapsed));request=requestAnimationFrame(tick)};
    request=requestAnimationFrame(tick);return()=>cancelAnimationFrame(request);
  },[rigPlaying,rigLoop]);
  useEffect(()=>{if(rigPlaying)seekRig(frame)},[frame,rigPlaying]);

  const current=items.find(x=>x.id===selected);
  const currentAsset=assets.find(a=>a.id===selectedAsset);
  const parts=React.useMemo(()=>currentAsset?meshParts(currentAsset.object):[],[currentAsset]);
  const currentPart=parts.find(p=>selectedPart?.assetId===selectedAsset&&p.key===selectedPart.key)??parts[0];
  const partReason=currentPart?meshEditReason(currentPart.mesh):'Selecciona una submalla.';
  const partData=React.useMemo(()=>currentPart&&!partReason?geometryData(currentPart.mesh.geometry):undefined,[currentPart?.mesh,currentPart?.mesh.geometry,partReason]);
  const currentData=current?.geometry??(currentAsset?partData:undefined);
  useEffect(()=>{setSelectedFace(null);setSelectedEdge(null);setMeshMessage('')},[currentPart?.mesh]);
  useEffect(()=>{setEditMode('object');setRigPlaying(false)},[selectedAsset]);
  const update=(id:number,patch:Partial<Item>)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
  const changeGeometry=(id:number,data:MeshData)=>{const old=items.find(x=>x.id===id)?.geometry;if(old)setMeshHistory(h=>[...h.slice(-19),{id,data:old}]);update(id,{geometry:data})};
  const enterEdit=(next:ComponentMode)=>{if(currentAsset&&next!=='object'&&partReason){setMeshMessage(partReason);return}setRigPlaying(false);if(current&&!current.geometry){let g:THREE.BufferGeometry;const n=current.segments??24;switch(current.shape){case 'sphere':g=new THREE.SphereGeometry(.8,n,Math.max(8,Math.floor(n*.7)));break;case 'torus':g=new THREE.TorusGeometry(.7,.25,12,n);break;case 'cone':g=new THREE.ConeGeometry(.8,1.6,n);break;case 'cylinder':g=new THREE.CylinderGeometry(.7,.7,1.6,n);break;default:g=new THREE.BoxGeometry(1.5,1.5,1.5)}g.translate(...(current.meshOffset??[0,0,0]));update(current.id,{geometry:geometryData(g)});g.dispose()}setSelectedFace(null);setSelectedEdge(null);setMeshMessage('');setEditMode(next)};
  const changeCurrentGeometry=(data:MeshData)=>{
    if(current){changeGeometry(current.id,data);return}
    if(!currentAsset||!currentPart)return;
    try{const previous=geometryData(currentPart.mesh.geometry);setMeshData(currentPart.mesh,data);setMeshHistory(h=>[...h.slice(-19),{id:currentAsset.id,assetId:currentAsset.id,path:currentPart.path,data:previous}]);updateAsset(currentAsset.id,{})}catch(error){setMeshMessage(error instanceof Error?error.message:String(error))}
  };
  const undoMesh=()=>{const last=meshHistory.at(-1);if(!last)return;if(last.assetId!==undefined){const asset=assets.find(a=>a.id===last.assetId),part=asset?meshParts(asset.object).find(p=>p.key===last.path?.join('/')):undefined;if(part&&asset){setMeshData(part.mesh,last.data);updateAsset(asset.id,{})}}else update(last.id,{geometry:last.data});setMeshHistory(h=>h.slice(0,-1));setSelectedFace(null);setSelectedEdge(null)};
  const add=(shape:Shape)=>{const id=Math.max(0,...items.map(x=>x.id))+1;setItems(p=>[...p,{id,name:labels[shape]+" "+String(id).padStart(2,"0"),shape,color:"#a9b6ff",visible:true,position:[0,1,0],rotation:[0,0,0],scale:[1,1,1]}]);setSelected(id);setSelectedAsset(null)};
  const applyPreset=(preset:MaterialPreset)=>{if(!current)return;const p=presets[preset];update(current.id,{preset,color:preset==="liso"?current.color:"#ffffff",roughness:p.roughness,metalness:p.metalness})};
  const duplicate=()=>{if(!current)return;const id=Math.max(0,...items.map(x=>x.id))+1;setItems(p=>[...p,{...current,id,name:current.name+" copia",position:[current.position[0]+1,current.position[1],current.position[2]]}]);setSelected(id)};
  const resetObject=()=>{if(current)update(current.id,{position:[0,1,0],rotation:[0,0,0],scale:[1,1,1]})};
  const mirror=(axis:0|1|2)=>{if(!current)return;const next=[...current.scale] as [number,number,number];next[axis]*=-1;update(current.id,{scale:next})};
  const [projectBusy,setProjectBusy]=useState(false);
  const [projectNotice,setProjectNotice]=useState('');
  const [projectRevision,setProjectRevision]=useState(0);
  const modules=useRef<ModuleState>({});
  const exportProject=async()=>{
    if(projectBusy||blenderBusy||exportingGlb)return;setProjectBusy(true);
    try{
      const blob=createProject(items,assets,{frame,showGrid,transparent,rigLoop,timelineOpen,selected,selectedAsset},modules.current);
      let backup=true;try{await saveProjectBackup(blob)}catch{backup=false}
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='genre3d-proyecto.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),15000);
      setProjectNotice(backup?'Proyecto guardado: archivo preparado y copia recuperable en este navegador.':'Archivo preparado. No se pudo conservar la copia en este navegador.');
    }catch(error){setProjectNotice('No se pudo guardar: '+(error instanceof Error?error.message:String(error)))}finally{setProjectBusy(false)}
  };
  const importProject=async(file?:Blob)=>{
    if(!file||projectBusy||blenderBusy||exportingGlb)return;setProjectBusy(true);
    try{
      const project=await openProject(file);
      setRigPlaying(false);setItems(project.items);setAssets(project.assets);modules.current=project.modules;
      setFrame(project.editor.frame);setShowGrid(project.editor.showGrid);setTransparent(project.editor.transparent);setRigLoop(project.editor.rigLoop);setTimelineOpen(project.editor.timelineOpen);
      setSelected(project.editor.selected);setSelectedAsset(project.editor.selectedAsset);setEditMode('object');setSelectedPart(null);setMeshHistory([]);setSelectedFace(null);setSelectedEdge(null);setLibrary(null);setHandOpen(false);setMenuOpen(null);setShowSkeleton(false);setProjectRevision(v=>v+1);
      setProjectNotice('Proyecto abierto: '+project.items.length+' primitivas y '+project.assets.length+' modelos GLB'+(project.legacy?' (formato anterior).':'.'));
    }catch(error){setProjectNotice('No se abrió el proyecto; la escena sigue intacta. '+(error instanceof Error?error.message:String(error)))}finally{setProjectBusy(false)}
  };
  const recoverProject=async()=>{if(projectBusy||blenderBusy||exportingGlb)return;try{await importProject(await readProjectBackup())}catch(error){setProjectNotice(error instanceof Error?error.message:String(error))}};
  const createEditableCopy=async()=>{
    if(!currentPart||blenderBusy||exportingGlb||projectBusy)return;setExportingGlb(true);let copy:THREE.Mesh|undefined;
    try{copy=bakeEditableCopy(currentPart.mesh);const blob=await serializeSceneGlb(copy);const imported=await importGlb(new File([blob],copy.name+'.glb',{type:'model/gltf-binary'}));if(!imported)throw new Error('No se pudo importar la copia');setProjectNotice('Copia editable creada con la pose actual. El original y su rig se conservan.')}catch(error){setProjectNotice('No se pudo crear la copia: '+(error instanceof Error?error.message:String(error)))}finally{copy?.geometry.dispose();setExportingGlb(false)}
  };
  const transform=(id:number,m:THREE.Mesh)=>update(id,{position:m.position.toArray() as Item["position"],rotation:[m.rotation.x,m.rotation.y,m.rotation.z],scale:m.scale.toArray() as Item["scale"]});
  return <div className="app">
    <header className="top"><div className="brand"><span className="brandmark">◈</span><b>LAB <em>GENRE3D</em></b><span className="edition">WEB / 0.2</span></div><nav>{["Archivo","Edición","Modelar","Rigging","Animar","Materiales","Exportar","Interfaz"].map(t=><button key={t} className={tab===t?"nav-active":""} onClick={()=>{setTab(t);setMenuOpen(v=>v===t?null:t);if(t==="Rigging"){setHandOpen(true);setLibrary(null)}else if(t==="Materiales"){setHandOpen(false);setLibrary("materiales")}else if(t==="Modelar"){setHandOpen(false);setLibrary("figuras")}else if(t==="Animar"){setHandOpen(true);setLibrary(null)}else if(t==="Edición"||t==="Archivo"||t==="Exportar"||t==="Interfaz"){setLibrary(null)}}}>{t}</button>)}</nav><span className="status">● MOTOR THREE.JS</span></header>
    <div className="subbar"><span>ESCENA / SIN TÍTULO</span><div className="sub-actions"><button style={{background:"#425c86",color:"#fff",fontWeight:700}} onClick={()=>{setLibrary("personajes");setHandOpen(false);setMenuOpen(null);setTab("Rigging")}}>☻ CABEZA / ROSTRO 3D</button><button style={{background:"#344a60",color:"#fff"}} onClick={()=>{setLibrary(null);setHandOpen(true);setMenuOpen(null);setTab("Rigging")}}>✋ Mano 3D</button><label className="file-button" style={{background:"#344a60",color:"#fff"}}>↑ IMPORTAR GLB<input type="file" accept=".glb,model/gltf-binary" onChange={e=>{void importGlb(e.target.files?.[0]);e.target.value=""}}/></label><button onClick={()=>setShowGrid(v=>!v)}>{showGrid?"▦ Retícula":"□ Retícula"}</button><button onClick={()=>setTransparent(v=>!v)}>{transparent?"◩ Alfa activo":"◧ Fondo sólido"}</button><button onClick={()=>void exportProject()} disabled={projectBusy||blenderBusy||exportingGlb}>{projectBusy?"Procesando proyecto…":"↓ Guardar proyecto"}</button><button onClick={()=>void recoverProject()} disabled={projectBusy||blenderBusy||exportingGlb}>↺ Recuperar guardado</button><button onClick={()=>void exportGlb()} disabled={exportingGlb}>{exportingGlb?"Exportando…":"↓ Exportar escena GLB"}</button><label className="file-button">↑ Abrir proyecto<input type="file" aria-label="Abrir proyecto" disabled={projectBusy||blenderBusy||exportingGlb} accept=".json,application/json" onChange={e=>{void importProject(e.target.files?.[0]);e.target.value=""}}/></label></div></div>
    {exportFiles&&<section className="export-downloads" aria-label="Archivos exportados"><span role="status">GLB preparado · {exportFiles.clips} animación(es) · {exportFiles.duration.toFixed(2)} s · 30 FPS</span><small>LAB Studio: importar el GLB desde Editor 3D. El manifiesto no es un proyecto; su reproductor actual no reproduce huesos ni expresiones del archivo.</small><a href={exportFiles.glb} download={exportFiles.name+'.glb'}>Descargar GLB</a><a href={exportFiles.manifest} download={exportFiles.name+'.lab.json'}>Descargar manifiesto LAB</a><button disabled={exportingGlb||blenderBusy||projectBusy} onClick={()=>void importGlb(new File([exportFiles.data],exportFiles.name+'.glb',{type:'model/gltf-binary'}))}>Añadir copia GLB al lienzo</button><button onClick={()=>setExportFiles(null)}>Cerrar descargas</button></section>}
    {menuOpen&&<div className="genre-menu" role="region" aria-label={"Menú "+menuOpen}><strong>{menuOpen}</strong>{menuOpen==="Rigging"||menuOpen==="Animar"?<><button onClick={()=>{setHandOpen(false);setLibrary("personajes");setMenuOpen(null)}}>☻ Abrir cabeza y editor facial</button><button onClick={()=>{setHandOpen(true);setLibrary(null);setMenuOpen(null)}}>✋ Abrir mano articulada</button></>:menuOpen==="Materiales"?<button onClick={()=>{setLibrary("materiales");setHandOpen(false)}}>▤ Biblioteca de materiales</button>:menuOpen==="Modelar"?<><button onClick={()=>{setLibrary("figuras");setHandOpen(false)}}>◇ Figuras geométricas</button><button onClick={()=>{setLibrary("personajes");setHandOpen(false)}}>♙ Personajes / animación facial</button></>:menuOpen==="Archivo"?<><button onClick={()=>void exportProject()} disabled={projectBusy}>↓ Guardar proyecto completo</button><button onClick={()=>void recoverProject()} disabled={projectBusy}>↺ Recuperar último guardado</button></>:menuOpen==="Edición"?<button onClick={()=>{if(current){setItems(p=>p.filter(x=>x.id!==current.id));setSelected(null)}}}>Eliminar objeto seleccionado</button>:menuOpen==="Interfaz"?<button onClick={()=>setTimelineOpen(v=>!v)}>Mostrar / ocultar línea de tiempo</button>:<><button onClick={()=>void exportGlb()} disabled={exportingGlb}>Exportar GLB + manifiesto</button><button onClick={()=>void exportProject()} disabled={projectBusy}>Guardar proyecto completo</button></>}<button onClick={()=>setMenuOpen(null)}>× Cerrar</button></div>}
    <div className="workspace">
      <aside className="tools"><h3>HERRAMIENTAS</h3><div className="toolgrid">{(["translate","rotate","scale"] as Mode[]).map((m,i)=><button key={m} title={["Mover","Rotar","Escalar"][i]} className={mode===m?"active":""} onClick={()=>setMode(m)}>{["✥","⟳","⤢"][i]}<small>{["Mover","Rotar","Escala"][i]}</small></button>)}</div><h3>PRIMITIVAS 3D</h3><div className="shapes">{shapes.map(s=><button key={s} onClick={()=>add(s)}>＋ {labels[s]}</button>)}</div><h3>COMPONENTES DE MALLA</h3><div className="shapes">{(['object','vertex','edge','face'] as ComponentMode[]).map((m,i)=><button key={m} disabled={!current&&(!currentAsset||(m!=="object"&&!!partReason))} className={editMode===m?'active':''} onClick={()=>enterEdit(m)}>{['Objeto','Vértices','Aristas','Caras'][i]}</button>)}<small aria-live="polite">{selectedFace!==null?'Cara triangular '+selectedFace:'Sin componente seleccionado'}{selectedEdge?' · Arista '+selectedEdge.join('–'):''} · {currentData?currentData.positions.length/9+' triángulos':''}</small><label>Ancho de bisel<input type="number" min=".01" max="1" step=".01" value={bevelWidth} onChange={e=>setBevelWidth(Number(e.target.value))}/></label><button disabled={!currentData||editMode!=='edge'||!selectedEdge} onClick={()=>{if(!currentData||!selectedEdge)return;try{changeCurrentGeometry(bevelEdge(currentData,selectedEdge,bevelWidth));setSelectedEdge(null);setSelectedFace(null);setMeshMessage('Bisel plano aplicado')}catch(e){setMeshMessage(e instanceof Error?e.message:String(e))}}}>Biselar arista seleccionada</button><small role="status">{meshMessage}</small><small>Selecciona con clic y arrastra el gizmo. Caras triangulares. Operaciones sobre la primitiva o submalla estática seleccionada.</small><label>Distancia de extrusión<input type="number" step=".05" min="-5" max="5" value={extrudeDistance} onChange={e=>setExtrudeDistance(Number(e.target.value))}/></label><button disabled={!currentData||editMode!=="face"||selectedFace===null||!Number.isFinite(extrudeDistance)||extrudeDistance===0} onClick={()=>{if(currentData&&selectedFace!==null)changeCurrentGeometry(faceOperation(currentData,selectedFace,extrudeDistance))}}>Extruir cara</button><button disabled={!currentData||editMode!=='face'||selectedFace===null} onClick={()=>{if(currentData&&selectedFace!==null)changeCurrentGeometry(faceOperation(currentData,selectedFace,.2,true))}}>Inset de cara 20 %</button><button disabled={!currentData||editMode!=="face"||selectedFace===null} onClick={()=>{if(currentData&&selectedFace!==null)changeCurrentGeometry(faceOperation(currentData,selectedFace,.2,true,true))}}>Bisel de cara triangular</button><button disabled={!meshHistory.length} onClick={undoMesh}>Deshacer edición de malla</button></div><h3>EDITAR MALLA · PRIMITIVA</h3><div className="shapes"><small>Deformación geométrica básica: desplaza los vértices de la malla sin mover el pivote. Para GLB utiliza Componentes de malla.</small><button disabled={!current||!!current.geometry} onClick={()=>{if(current)update(current.id,{meshOffset:[0,0,0]})}}>↺ Centrar vértices</button>{(["X","Y","Z"] as const).map((axis,i)=><label key={axis}>Desplazar malla {axis}<input type="number" step=".1" disabled={!current||!!current.geometry} value={current?.meshOffset?.[i]??0} onChange={e=>{if(!current)return;const offset=[...(current.meshOffset??[0,0,0])] as [number,number,number];offset[i]=Number(e.target.value);update(current.id,{meshOffset:offset})}}/></label>)}</div><h3>EDITAR OBJETO</h3><div className="shapes"><button onClick={duplicate} disabled={!current}>⧉ Duplicar seleccionado</button><button onClick={resetObject} disabled={!current}>↺ Restablecer transformaciones</button><button onClick={()=>mirror(0)} disabled={!current}>⇆ Espejo X</button><button onClick={()=>mirror(1)} disabled={!current}>⇅ Espejo Y</button><button onClick={()=>mirror(2)} disabled={!current}>⇄ Espejo Z</button></div><h3>BIBLIOTECAS</h3><div className="shapes"><button onClick={()=>{setLibrary("figuras");setHandOpen(false)}}>◇ Figuras</button><button onClick={()=>{setLibrary("materiales");setHandOpen(false)}}>▤ Materiales</button><button onClick={()=>{setLibrary("personajes");setHandOpen(false)}}>☻ Cabeza / rostro animable</button></div><h3>IMPORTAR MODELOS</h3><div className="shapes"><label className="file-button">↑ Importar GLB al lienzo<input type="file" accept=".glb,model/gltf-binary" onChange={e=>{void importGlb(e.target.files?.[0]);e.target.value=""}}/></label><small>Modelos GLB con huesos y morph targets: se conservan al importar; edición avanzada pendiente.</small></div><h3>BLENDER REMOTO (BETA)</h3><div className="shapes"><a href="/api/blender/health" target="_blank" rel="noreferrer">Conectar / autorizar Blender</a><button disabled={blenderBusy||exportingGlb||items.length+assets.length===0} onClick={()=>void processCurrentScene()}>{blenderBusy?"Procesando en Blender…":"Procesar escena con Blender"}</button><small role="status">{blenderNotice}</small><select aria-label="Operación Blender" value={blenderOperation} onChange={e=>setBlenderOperation(e.target.value as BlenderOperation)}><option value="smooth">Suavizar</option><option value="subdivide">Subdividir</option><option value="decimate">Reducir polígonos</option><option value="normals">Normales</option></select><label className="file-button">{blenderBusy?"Procesando…":"↑ Procesar archivo GLB"}<input type="file" accept=".glb,model/gltf-binary" disabled={blenderBusy} onChange={e=>{void processBlenderFile(e.target.files?.[0]);e.target.value=""}}/></label><small>Procesa un GLB, añade el resultado al lienzo y descarga una copia. El original se conserva. Requiere conexión del servidor Blender.</small></div><h3>RIGGING EXPERIMENTAL</h3><button disabled={projectBusy||blenderBusy||exportingGlb} onClick={()=>void addRigTemplate()}>＋ Brazo con huesos y pesos</button><div className="shapes"><button onClick={()=>{setHandOpen(v=>!v);setLibrary(null)}}>{handOpen?"← Volver al editor":"✋ Mano articulada"}</button></div><div className="hint">Gizmos y órbita con mouse. Los módulos de rigging y animación se incorporarán por etapas.</div></aside>
      <main className={transparent?"alpha":""}>{handOpen ? <HandLab key={projectRevision} initialState={modules.current.hand} onStateChange={state=>{modules.current.hand=state}}/> : library==="personajes" ? <CharacterLab key={projectRevision} initialState={modules.current.character} onStateChange={state=>{modules.current.character=state}}/> : library ? <div className="genre-library"><div className="genre-library-head"><strong>{library==="figuras"?"BIBLIOTECA DE FIGURAS":library==="materiales"?"BIBLIOTECA DE MATERIALES":"BIBLIOTECA DE PERSONAJES"}</strong><button onClick={()=>setLibrary(null)}>× Volver al visor</button></div>{library==="figuras"?<div className="genre-library-grid">{shapes.map(shape=><button key={shape} onClick={()=>{add(shape);setLibrary(null)}}><span>◇</span>＋ {labels[shape]}</button>)}</div>:library==="materiales"?<div className="genre-library-grid">{(Object.keys(presets) as MaterialPreset[]).map(preset=><button key={preset} onClick={()=>{if(current){applyPreset(preset);setLibrary(null)}else alert("Selecciona primero un objeto en la jerarquía.")}}><span style={{background:presets[preset].color,borderRadius:"50%"}}></span>{presets[preset].label}</button>)}</div>:<p>Los personajes riggeados y la importación GLB están pendientes. Puedes abrir la mano articulada desde Rigging.</p>}<p className="genre-library-note">{library==="materiales"?"Materiales procedurales con mapas de color y normales generados localmente (256 px). No son escaneos PBR fotográficos.":"Las bibliotecas avanzadas se incorporarán progresivamente."}</p></div> : <><Canvas camera={{position:[5,4,7],fov:48}} gl={{antialias:true,alpha:true}} onPointerMissed={()=>{setSelected(null);setSelectedAsset(null)}}><ambientLight intensity={1.2}/><directionalLight position={[5,8,4]} intensity={2}/>{showGrid&&<Grid infiniteGrid sectionSize={1} sectionColor="#414d60" cellColor="#2b333f" fadeDistance={24}/>}{showSkeleton&&currentAsset&&<primitive object={new THREE.SkeletonHelper(currentAsset.object)}/>}{currentAsset&&currentAsset.clips[importedClipIndex]&&<ImportedAnimation object={currentAsset.object} clip={currentAsset.clips[importedClipIndex]} playing={importedPlaying}/>}<group ref={exportGroup}>{assets.filter(a=>a.visible).map(a=><ImportedGLB key={a.id} object={a.object} position={a.position} rotation={a.rotation} scale={a.scale} selected={selectedAsset===a.id} componentMode={editMode!=="object"} componentMesh={selectedAsset===a.id?currentPart?.mesh:undefined} mode={mode} onSelect={mesh=>{setSelectedAsset(a.id);setSelected(null);if(mesh){const part=meshParts(a.object).find(p=>p.mesh===mesh);if(part)setSelectedPart({assetId:a.id,key:part.key})}}} onTransform={g=>updateAsset(a.id,{position:g.position.toArray() as ImportedAsset["position"],rotation:[g.rotation.x,g.rotation.y,g.rotation.z],scale:g.scale.toArray() as ImportedAsset["scale"]})}/>)}{items.map(item=><Object3D key={item.id} item={item} editMode={editMode} onGeometry={changeGeometry} onFace={setSelectedFace} onEdge={setSelectedEdge} selected={selected===item.id} mode={mode} onSelect={id=>{setSelected(id);setSelectedAsset(null)}} onTransform={transform}/>)}</group>{currentAsset?.visible&&currentPart&&partData&&editMode!=="object"&&<ImportedMeshEditor key={currentAsset.id+":"+currentPart.key} mesh={currentPart.mesh} data={partData} mode={editMode} onChange={changeCurrentGeometry} onFace={setSelectedFace} onEdge={setSelectedEdge}/>}<OrbitControls makeDefault/></Canvas><div className="viewport-label">PERSPECTIVA <span>●</span> 3D / EDITOR</div><div className="viewport-bottom">XYZ　 ·　{items.length+assets.length} OBJETOS　 ·　{transparent?"FONDO ALFA":"FONDO OSCURO"}</div></>}</main>
      <aside className="inspector"><h3>JERARQUÍA <span>{items.length+assets.length}</span></h3><div className="scene-tree"><div className="tree-root">⌄　◈ Escena</div>{items.map(item=><div key={item.id} className={"tree-item "+(selected===item.id?"selected":"")}><button className="object-name" onClick={()=>{setSelected(item.id);setSelectedAsset(null)}}>◇ {item.name}</button><button className="eye" title="Mostrar u ocultar" onClick={()=>update(item.id,{visible:!item.visible})}>{item.visible?"◉":"○"}</button></div>)}{assets.map(a=><div key={a.id} className={"tree-item "+(selectedAsset===a.id?"selected":"")}><button className="object-name" onClick={()=>{setSelectedAsset(a.id);setSelected(null)}}>▣ {a.name}</button><button className="eye" onClick={()=>updateAsset(a.id,{visible:!a.visible})}>{a.visible?"◉":"○"}</button></div>)}</div><h3>PROPIEDADES</h3>{currentAsset?<div className="properties"><strong>{currentAsset.name}</strong><h3>SUBMALLAS DEL GLB ({parts.length})</h3><div className="shapes">{parts.map((part,i)=><button key={part.key} className={currentPart?.key===part.key?'active':''} aria-label={'Seleccionar submalla '+(i+1)+' '+part.label} onClick={()=>setSelectedPart({assetId:currentAsset.id,key:part.key})}>{i+1}. {part.label}</button>)}</div>{currentPart&&<><small>{currentPart.label}: {partReason??'Malla estática editable. Usa Vértices, Aristas o Caras.'}</small><button onClick={()=>void createEditableCopy()} disabled={blenderBusy||exportingGlb||projectBusy}>Crear copia editable sin rig</button><small>La copia conserva la pose actual como geometría fija; el original mantiene huesos y expresiones.</small></>}<p>{currentAsset.boneCount} huesos · {currentAsset.morphCount} morph targets</p>{(["position","rotation","scale"] as const).map(prop=><div className="vector" key={prop}><div>{prop}</div><div className="axis">{currentAsset[prop].map((v,i)=><label key={i}><span>{["X","Y","Z"][i]}</span><input type="number" step=".1" value={Number(v.toFixed(2))} onChange={e=>{const next=[...currentAsset[prop]] as [number,number,number];next[i]=Number(e.target.value);updateAsset(currentAsset.id,{[prop]:next})}}/></label>)}</div></div>)}{currentAsset.clips.length>0&&<><h3>ANIMACIONES DEL ARCHIVO GLB</h3><label>Clip importado<select aria-label="Clip importado" value={importedClipIndex} onChange={e=>{setImportedPlaying(false);setImportedClipIndex(Number(e.target.value))}}>{currentAsset.clips.map((clip,i)=><option key={i} value={i}>{clip.name||'Clip '+(i+1)} · {clip.duration.toFixed(2)} s</option>)}</select></label><button onClick={()=>{setRigPlaying(false);setImportedPlaying(p=>!p)}}>{importedPlaying?'Ⅱ Pausar clip importado':'▶ Reproducir clip importado'}</button><small>Los clips del archivo y los keyframes LAB son reproducciones independientes. Al exportar se usan los keyframes LAB si hay dos o más; en otro caso se conservan los clips importados.</small></> }<h3>ANIMACIÓN DEL RIG · 30 FPS</h3><p>{currentAsset.rigKeys.length} keyframes guardados</p><button onClick={captureRig}>◆ Guardar pose en fotograma {frame}</button><button onClick={()=>updateAsset(currentAsset.id,{rigKeys:currentAsset.rigKeys.filter(k=>k.frame!==frame)})}>Eliminar keyframe actual</button><label><input type="checkbox" checked={showSkeleton} onChange={e=>setShowSkeleton(e.target.checked)}/> Mostrar esqueleto</label><h3>RIG DEL GLB · CONTROLES REALES</h3><small>Los controles aparecen únicamente cuando el archivo contiene morph targets o huesos. Edición en memoria; los valores se incluyen al exportar la escena GLB.</small>{currentAsset.morphs.length>0&&<><h3>EXPRESIONES / MORPH TARGETS ({currentAsset.morphs.length})</h3>{currentAsset.morphs.slice(0,60).map((m,i)=><label key={i}>{m.name} <span>{(m.mesh.morphTargetInfluences?.[m.index]??0).toFixed(2)}</span><input type="range" min="0" max="1" step=".01" value={m.mesh.morphTargetInfluences?.[m.index]??0} onChange={e=>{if(m.mesh.morphTargetInfluences)m.mesh.morphTargetInfluences[m.index]=Number(e.target.value);setRigRevision(v=>v+1)}}/></label>)}<button onClick={()=>{currentAsset.morphs.forEach(m=>{if(m.mesh.morphTargetInfluences)m.mesh.morphTargetInfluences[m.index]=0});setRigRevision(v=>v+1)}}>Restablecer expresiones</button></>}{currentAsset.bones.length>0&&<><h3>HUESOS ({currentAsset.bones.length})</h3>{currentAsset.bones.slice(0,50).map((bone,i)=><div className="vector" key={i}><div>{bone.name||"Hueso "+(i+1)}</div><div className="axis">{(["x","y","z"] as const).map(axis=><label key={axis}><span>{axis.toUpperCase()}</span><input type="number" step="5" min="-180" max="180" value={Number(THREE.MathUtils.radToDeg(bone.rotation[axis]).toFixed(1))} onChange={e=>{bone.rotation[axis]=THREE.MathUtils.degToRad(Number(e.target.value));setRigRevision(v=>v+1)}}/></label>)}</div></div>)}<button onClick={()=>{currentAsset.bones.forEach((b,i)=>b.rotation.set(...(currentAsset.restRotations[i]??[0,0,0])));setRigRevision(v=>v+1)}}>Restablecer pose original de huesos</button></>}{rigRevision<0&&null}<button className="danger" onClick={()=>{setAssets(p=>p.filter(a=>a.id!==currentAsset.id));setSelectedAsset(null)}}>Eliminar GLB</button></div>:current?<div className="properties"><label>Nombre<input value={current.name} onChange={e=>update(current.id,{name:e.target.value})}/></label><label>Material<input type="color" value={current.color} onChange={e=>update(current.id,{color:e.target.value})}/></label>{(["position","rotation","scale"] as const).map(prop=><div key={prop} className="vector"><div>{prop==="position"?"Posición":prop==="rotation"?"Rotación (rad)":"Escala"}</div><div className="axis">{current[prop].map((v,i)=><label key={i}><span>{["X","Y","Z"][i]}</span><input aria-label={prop+" "+["X","Y","Z"][i]} type="number" step=".1" value={Number(v.toFixed(2))} onChange={e=>{const n=[...current[prop]] as [number,number,number];n[i]=Number(e.target.value);update(current.id,{[prop]:n})}}/></label>)}</div></div>)}<div className="genre-modifiers"><h3>MODIFICADORES / MATERIAL</h3><label>Material procedural<select value={current.preset??"liso"} onChange={e=>applyPreset(e.target.value as MaterialPreset)}>{(Object.keys(presets) as MaterialPreset[]).map(k=><option key={k} value={k}>{presets[k].label}</option>)}</select></label><label>Metalicidad <span>{(current.metalness??.25).toFixed(2)}</span><input type="range" min="0" max="1" step=".05" value={current.metalness??.25} onChange={e=>update(current.id,{metalness:Number(e.target.value)})}/></label><label>Rugosidad <span>{(current.roughness??.5).toFixed(2)}</span><input type="range" min="0" max="1" step=".05" value={current.roughness??.5} onChange={e=>update(current.id,{roughness:Number(e.target.value)})}/></label><label>Resolución geométrica <span>{current.segments??24}</span><input type="range" min="8" max="64" step="4" disabled={!!current.geometry} value={current.segments??24} onChange={e=>update(current.id,{segments:Number(e.target.value)})}/></label><label className="genre-check"><input type="checkbox" checked={current.wireframe??false} onChange={e=>update(current.id,{wireframe:e.target.checked})}/> Modo alambre</label><label className="genre-check"><input type="checkbox" checked={current.flatShading??false} onChange={e=>update(current.id,{flatShading:e.target.checked})}/> Sombreado plano</label><button onClick={duplicate}>⧉ Duplicar</button><button onClick={resetObject}>↺ Restablecer</button></div><button className="danger" onClick={()=>{setItems(p=>p.filter(x=>x.id!==current.id));setSelected(null)}}>Eliminar objeto</button></div>:<p>Selecciona un objeto para editarlo.</p>}<div className="future"><h3>MÓDULOS PRÓXIMOS</h3><p>Armature · IK/FK · Materiales PBR · Keyframes · GLB · PNG RGBA</p></div></aside>
    </div>
    <section className={"timeline "+(!timelineOpen?"collapsed":"")}><div className="timeline-head"><button onClick={()=>setTimelineOpen(v=>!v)}>{timelineOpen?"▾":"▸"} LÍNEA DE TIEMPO</button><button onClick={()=>setRigPlaying(p=>!p)} disabled={!currentAsset||currentAsset.rigKeys.length<2}>{rigPlaying?"Ⅱ Pausar rig":"▶ Reproducir rig"}</button><label>Fotograma <input type="number" min="0" max="240" value={frame} onChange={e=>{setRigPlaying(false);seekRig(Math.max(0,Math.min(240,Number(e.target.value))))}}/></label><label><input type="checkbox" checked={rigLoop} onChange={e=>setRigLoop(e.target.checked)}/> Repetir rig</label><span>30 FPS · {currentAsset?"RIG GLB":"SELECCIONA GLB"}</span></div>{timelineOpen&&<div className="timeline-body"><div className="track-label">Escena / {current?.name??"Sin selección"}</div><input type="range" min="0" max="240" value={frame} onChange={e=>{setRigPlaying(false);seekRig(Number(e.target.value))}}/><div className="track-note">{currentAsset?currentAsset.rigKeys.map(k=>k.frame).join(" · ")+" · keyframes del GLB":"Selecciona un GLB para animar huesos y morph targets."}</div></div>}</section>
    <footer><span>LAB CREATIVE SUITE / GENRE3D</span><span role="status" title={projectNotice}>{projectNotice||"Guarda tu proyecto para continuar después."}</span></footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
