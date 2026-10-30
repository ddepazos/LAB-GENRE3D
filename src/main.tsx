import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { enableMeshAcceleration } from "./meshEngine";
enableMeshAcceleration();
import "./style.css";
import HandLab from "./HandLab";
import { exportToLabStudio } from "./labInterop";
import { processGlbRemotely, type BlenderOperation } from "./blenderRemote";
import CharacterLab from "./CharacterLab";
import {presets,useProceduralMaps,type MaterialPreset} from "./materialPresets";

type Mode = "translate" | "rotate" | "scale";
type Shape = "box" | "sphere" | "torus" | "cone" | "cylinder";
type Item = { id: number; name: string; shape: Shape; color: string; visible: boolean; position: [number,number,number]; rotation: [number,number,number]; scale: [number,number,number]; metalness?:number; roughness?:number; wireframe?:boolean; flatShading?:boolean; segments?:number; preset?:MaterialPreset };
const initial: Item[] = [{ id: 1, name: "Cubo 01", shape: "box", color: "#a9b6ff", visible: true, position: [0,1,0], rotation: [0,0,0], scale: [1,1,1] }];
const shapes: Shape[] = ["box","sphere","torus","cone","cylinder"];
const labels: Record<Shape,string> = {box:"Cubo",sphere:"Esfera",torus:"Toro",cone:"Cono",cylinder:"Cilindro"};
function Geometry({shape,segments=24}:{shape:Shape;segments?:number}) {
  switch(shape) {
    case "sphere": return <sphereGeometry args={[.8,segments,Math.max(8,Math.floor(segments*.7))]}/>;
    case "torus": return <torusGeometry args={[.7,.25,12,segments]}/>;
    case "cone": return <coneGeometry args={[.8,1.6,segments]}/>;
    case "cylinder": return <cylinderGeometry args={[.7,.7,1.6,segments]}/>;
    default: return <boxGeometry args={[1.5,1.5,1.5]}/>;
  }
}
function Object3D({item,selected,mode,onSelect,onTransform}:{item:Item;selected:boolean;mode:Mode;onSelect:(id:number)=>void;onTransform:(id:number,mesh:THREE.Mesh)=>void}) {
  const ref=useRef<THREE.Mesh>(null);
  const maps=useProceduralMaps(item.preset??"liso",256);
  if(!item.visible)return null;
  const mesh=<mesh ref={ref} position={item.position} rotation={item.rotation} scale={item.scale} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(item.id)}}>
    <Geometry shape={item.shape} segments={item.segments}/><meshStandardMaterial color={item.color} metalness={item.metalness??.25} roughness={item.roughness??.5} wireframe={item.wireframe??false} flatShading={item.flatShading??false} map={maps?.color??null} normalMap={maps?.normal??null} normalScale={new THREE.Vector2(.35,.35)}/>
  </mesh>;
  return selected ? <TransformControls mode={mode} onMouseUp={()=>{if(ref.current)onTransform(item.id,ref.current)}}>{mesh}</TransformControls> : mesh;
}
function App(){
  const exportGroup=useRef<THREE.Group>(null);
  const [exportingGlb,setExportingGlb]=useState(false);
  const exportGlb=async()=>{if(!exportGroup.current||exportingGlb)return;setExportingGlb(true);try{await exportToLabStudio(exportGroup.current,{name:"genre3d-scene",fps:30});}catch(error){alert("No se pudo exportar GLB: "+(error instanceof Error?error.message:String(error)));}finally{setExportingGlb(false)}};
  const [blenderBusy,setBlenderBusy]=useState(false);
  const [blenderOperation,setBlenderOperation]=useState<BlenderOperation>("smooth");
  const processBlenderFile=async(file?:File)=>{
    if(!file||blenderBusy)return;
    setBlenderBusy(true);
    try {
      const output=await processGlbRemotely(file,blenderOperation);
      const url=URL.createObjectURL(output);
      const anchor=document.createElement("a");
      anchor.href=url;anchor.download="genre3d-processed.glb";anchor.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),15000);
    } catch(error) {
      alert("Blender remoto todavía no está disponible: "+(error instanceof Error?error.message:String(error)));
    } finally {setBlenderBusy(false)}
  };
  const [items,setItems]=useState<Item[]>(initial);
  const [selected,setSelected]=useState<number|null>(1);
  const [mode,setMode]=useState<Mode>("translate");
  const [tab,setTab]=useState("Modelar");
  const [handOpen,setHandOpen]=useState(false);
  const [menuOpen,setMenuOpen]=useState<string|null>(null);
  const [library,setLibrary]=useState<"figuras"|"materiales"|"personajes"|null>(null);
  const [transparent,setTransparent]=useState(false);
  const [showGrid,setShowGrid]=useState(true);
  const [timelineOpen,setTimelineOpen]=useState(true);
  const [frame,setFrame]=useState(0);
  const current=items.find(x=>x.id===selected);
  const update=(id:number,patch:Partial<Item>)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
  const add=(shape:Shape)=>{const id=Math.max(0,...items.map(x=>x.id))+1;setItems(p=>[...p,{id,name:labels[shape]+" "+String(id).padStart(2,"0"),shape,color:"#a9b6ff",visible:true,position:[0,1,0],rotation:[0,0,0],scale:[1,1,1]}]);setSelected(id)};
  const applyPreset=(preset:MaterialPreset)=>{if(!current)return;const p=presets[preset];update(current.id,{preset,color:preset==="liso"?current.color:"#ffffff",roughness:p.roughness,metalness:p.metalness})};
  const duplicate=()=>{if(!current)return;const id=Math.max(0,...items.map(x=>x.id))+1;setItems(p=>[...p,{...current,id,name:current.name+" copia",position:[current.position[0]+1,current.position[1],current.position[2]]}]);setSelected(id)};
  const resetObject=()=>{if(current)update(current.id,{position:[0,1,0],rotation:[0,0,0],scale:[1,1,1]})};
  const mirror=(axis:0|1|2)=>{if(!current)return;const next=[...current.scale] as [number,number,number];next[axis]*=-1;update(current.id,{scale:next})};
  const exportProject=()=>{const blob=new Blob([JSON.stringify({version:1,application:"LAB GENRE3D",items},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="genre3d-scene.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  const importProject=async(file?:File)=>{if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.items)||data.items.some((x:Item)=>!shapes.includes(x.shape)||!Array.isArray(x.position)))throw Error("Formato incompatible");setItems(data.items);setSelected(null)}catch{alert("No se pudo abrir el proyecto JSON de GENRE3D.")}};
  const transform=(id:number,m:THREE.Mesh)=>update(id,{position:m.position.toArray() as Item["position"],rotation:[m.rotation.x,m.rotation.y,m.rotation.z],scale:m.scale.toArray() as Item["scale"]});
  return <div className="app">
    <header className="top"><div className="brand"><span className="brandmark">◈</span><b>LAB <em>GENRE3D</em></b><span className="edition">WEB / 0.2</span></div><nav>{["Archivo","Edición","Modelar","Rigging","Animar","Materiales","Exportar","Interfaz"].map(t=><button key={t} className={tab===t?"nav-active":""} onClick={()=>{setTab(t);setMenuOpen(v=>v===t?null:t);if(t==="Rigging"){setHandOpen(true);setLibrary(null)}else if(t==="Materiales"){setHandOpen(false);setLibrary("materiales")}else if(t==="Modelar"){setHandOpen(false);setLibrary("figuras")}else if(t==="Animar"){setHandOpen(true);setLibrary(null)}else if(t==="Edición"||t==="Archivo"||t==="Exportar"||t==="Interfaz"){setLibrary(null)}}}>{t}</button>)}</nav><span className="status">● MOTOR THREE.JS</span></header>
    <div className="subbar"><span>ESCENA / SIN TÍTULO</span><div className="sub-actions"><button onClick={()=>setShowGrid(v=>!v)}>{showGrid?"▦ Retícula":"□ Retícula"}</button><button onClick={()=>setTransparent(v=>!v)}>{transparent?"◩ Alfa activo":"◧ Fondo sólido"}</button><button onClick={exportProject}>↓ Guardar JSON</button><button onClick={()=>void exportGlb()} disabled={exportingGlb}>{exportingGlb?"Exportando…":"↓ Enviar a LAB Studio (GLB)"}</button><label className="file-button">↑ Abrir JSON<input type="file" accept=".json,application/json" onChange={e=>{void importProject(e.target.files?.[0]);e.target.value=""}}/></label></div></div>
    {menuOpen&&<div className="genre-menu" role="region" aria-label={"Menú "+menuOpen}><strong>{menuOpen}</strong>{menuOpen==="Rigging"||menuOpen==="Animar"?<button onClick={()=>{setHandOpen(true);setLibrary(null)}}>✋ Abrir mano articulada</button>:menuOpen==="Materiales"?<button onClick={()=>{setLibrary("materiales");setHandOpen(false)}}>▤ Biblioteca de materiales</button>:menuOpen==="Modelar"?<><button onClick={()=>{setLibrary("figuras");setHandOpen(false)}}>◇ Figuras geométricas</button><button onClick={()=>{setLibrary("personajes");setHandOpen(false)}}>♙ Personajes (en desarrollo)</button></>:menuOpen==="Archivo"?<button onClick={exportProject}>↓ Guardar proyecto JSON</button>:menuOpen==="Edición"?<button onClick={()=>{if(current){setItems(p=>p.filter(x=>x.id!==current.id));setSelected(null)}}}>Eliminar objeto seleccionado</button>:menuOpen==="Interfaz"?<button onClick={()=>setTimelineOpen(v=>!v)}>Mostrar / ocultar línea de tiempo</button>:<><button onClick={()=>void exportGlb()} disabled={exportingGlb}>Exportar GLB + manifiesto LAB Studio</button><button onClick={exportProject}>Exportar escena JSON</button></>}<button onClick={()=>setMenuOpen(null)}>× Cerrar</button></div>}
    <div className="workspace">
      <aside className="tools"><h3>HERRAMIENTAS</h3><div className="toolgrid">{(["translate","rotate","scale"] as Mode[]).map((m,i)=><button key={m} title={["Mover","Rotar","Escalar"][i]} className={mode===m?"active":""} onClick={()=>setMode(m)}>{["✥","⟳","⤢"][i]}<small>{["Mover","Rotar","Escala"][i]}</small></button>)}</div><h3>PRIMITIVAS 3D</h3><div className="shapes">{shapes.map(s=><button key={s} onClick={()=>add(s)}>＋ {labels[s]}</button>)}</div><h3>EDITAR OBJETO</h3><div className="shapes"><button onClick={duplicate} disabled={!current}>⧉ Duplicar seleccionado</button><button onClick={resetObject} disabled={!current}>↺ Restablecer transformaciones</button><button onClick={()=>mirror(0)} disabled={!current}>⇆ Espejo X</button><button onClick={()=>mirror(1)} disabled={!current}>⇅ Espejo Y</button><button onClick={()=>mirror(2)} disabled={!current}>⇄ Espejo Z</button></div><h3>BIBLIOTECAS</h3><div className="shapes"><button onClick={()=>{setLibrary("figuras");setHandOpen(false)}}>◇ Figuras</button><button onClick={()=>{setLibrary("materiales");setHandOpen(false)}}>▤ Materiales</button><button onClick={()=>{setLibrary("personajes");setHandOpen(false)}}>♙ Personajes</button></div><h3>BLENDER REMOTO (BETA)</h3><div className="shapes"><select aria-label="Operación Blender" value={blenderOperation} onChange={e=>setBlenderOperation(e.target.value as BlenderOperation)}><option value="smooth">Suavizar</option><option value="subdivide">Subdividir</option><option value="decimate">Reducir polígonos</option><option value="normals">Normales</option></select><label className="file-button">{blenderBusy?"Procesando…":"↑ Procesar archivo GLB"}<input type="file" accept=".glb,model/gltf-binary" disabled={blenderBusy} onChange={e=>{void processBlenderFile(e.target.files?.[0]);e.target.value=""}}/></label><small>Disponible cuando el gateway seguro esté conectado al sitio.</small></div><h3>RIGGING EXPERIMENTAL</h3><div className="shapes"><button onClick={()=>{setHandOpen(v=>!v);setLibrary(null)}}>{handOpen?"← Volver al editor":"✋ Mano articulada"}</button></div><div className="hint">Gizmos y órbita con mouse. Los módulos de rigging y animación se incorporarán por etapas.</div></aside>
      <main className={transparent?"alpha":""}>{handOpen ? <HandLab/> : library==="personajes" ? <CharacterLab/> : library ? <div className="genre-library"><div className="genre-library-head"><strong>{library==="figuras"?"BIBLIOTECA DE FIGURAS":library==="materiales"?"BIBLIOTECA DE MATERIALES":"BIBLIOTECA DE PERSONAJES"}</strong><button onClick={()=>setLibrary(null)}>× Volver al visor</button></div>{library==="figuras"?<div className="genre-library-grid">{shapes.map(shape=><button key={shape} onClick={()=>{add(shape);setLibrary(null)}}><span>◇</span>＋ {labels[shape]}</button>)}</div>:library==="materiales"?<div className="genre-library-grid">{(Object.keys(presets) as MaterialPreset[]).map(preset=><button key={preset} onClick={()=>{if(current){applyPreset(preset);setLibrary(null)}else alert("Selecciona primero un objeto en la jerarquía.")}}><span style={{background:presets[preset].color,borderRadius:"50%"}}></span>{presets[preset].label}</button>)}</div>:<p>Los personajes riggeados y la importación GLB están pendientes. Puedes abrir la mano articulada desde Rigging.</p>}<p className="genre-library-note">{library==="materiales"?"Materiales procedurales con mapas de color y normales generados localmente (256 px). No son escaneos PBR fotográficos.":"Las bibliotecas avanzadas se incorporarán progresivamente."}</p></div> : <><Canvas camera={{position:[5,4,7],fov:48}} gl={{antialias:true,alpha:true}} onPointerMissed={()=>setSelected(null)}><ambientLight intensity={1.2}/><directionalLight position={[5,8,4]} intensity={2}/>{showGrid&&<Grid infiniteGrid sectionSize={1} sectionColor="#414d60" cellColor="#2b333f" fadeDistance={24}/>}<group ref={exportGroup}>{items.map(item=><Object3D key={item.id} item={item} selected={selected===item.id} mode={mode} onSelect={setSelected} onTransform={transform}/>)}</group><OrbitControls makeDefault/></Canvas><div className="viewport-label">PERSPECTIVA <span>●</span> 3D / EDITOR</div><div className="viewport-bottom">XYZ　 ·　{items.length} OBJETOS　 ·　{transparent?"FONDO ALFA":"FONDO OSCURO"}</div></>}</main>
      <aside className="inspector"><h3>JERARQUÍA <span>{items.length}</span></h3><div className="scene-tree"><div className="tree-root">⌄　◈ Escena</div>{items.map(item=><div key={item.id} className={"tree-item "+(selected===item.id?"selected":"")}><button className="object-name" onClick={()=>setSelected(item.id)}>◇ {item.name}</button><button className="eye" title="Mostrar u ocultar" onClick={()=>update(item.id,{visible:!item.visible})}>{item.visible?"◉":"○"}</button></div>)}</div><h3>PROPIEDADES</h3>{current?<div className="properties"><label>Nombre<input value={current.name} onChange={e=>update(current.id,{name:e.target.value})}/></label><label>Material<input type="color" value={current.color} onChange={e=>update(current.id,{color:e.target.value})}/></label>{(["position","rotation","scale"] as const).map(prop=><div key={prop} className="vector"><div>{prop==="position"?"Posición":prop==="rotation"?"Rotación (rad)":"Escala"}</div><div className="axis">{current[prop].map((v,i)=><label key={i}><span>{["X","Y","Z"][i]}</span><input aria-label={prop+" "+["X","Y","Z"][i]} type="number" step=".1" value={Number(v.toFixed(2))} onChange={e=>{const n=[...current[prop]] as [number,number,number];n[i]=Number(e.target.value);update(current.id,{[prop]:n})}}/></label>)}</div></div>)}<div className="genre-modifiers"><h3>MODIFICADORES / MATERIAL</h3><label>Material procedural<select value={current.preset??"liso"} onChange={e=>applyPreset(e.target.value as MaterialPreset)}>{(Object.keys(presets) as MaterialPreset[]).map(k=><option key={k} value={k}>{presets[k].label}</option>)}</select></label><label>Metalicidad <span>{(current.metalness??.25).toFixed(2)}</span><input type="range" min="0" max="1" step=".05" value={current.metalness??.25} onChange={e=>update(current.id,{metalness:Number(e.target.value)})}/></label><label>Rugosidad <span>{(current.roughness??.5).toFixed(2)}</span><input type="range" min="0" max="1" step=".05" value={current.roughness??.5} onChange={e=>update(current.id,{roughness:Number(e.target.value)})}/></label><label>Resolución geométrica <span>{current.segments??24}</span><input type="range" min="8" max="64" step="4" value={current.segments??24} onChange={e=>update(current.id,{segments:Number(e.target.value)})}/></label><label className="genre-check"><input type="checkbox" checked={current.wireframe??false} onChange={e=>update(current.id,{wireframe:e.target.checked})}/> Modo alambre</label><label className="genre-check"><input type="checkbox" checked={current.flatShading??false} onChange={e=>update(current.id,{flatShading:e.target.checked})}/> Sombreado plano</label><button onClick={duplicate}>⧉ Duplicar</button><button onClick={resetObject}>↺ Restablecer</button></div><button className="danger" onClick={()=>{setItems(p=>p.filter(x=>x.id!==current.id));setSelected(null)}}>Eliminar objeto</button></div>:<p>Selecciona un objeto para editarlo.</p>}<div className="future"><h3>MÓDULOS PRÓXIMOS</h3><p>Armature · IK/FK · Materiales PBR · Keyframes · GLB · PNG RGBA</p></div></aside>
    </div>
    <section className={"timeline "+(!timelineOpen?"collapsed":"")}><div className="timeline-head"><button onClick={()=>setTimelineOpen(v=>!v)}>{timelineOpen?"▾":"▸"} LÍNEA DE TIEMPO</button><span>◀　▷　▶</span><label>Fotograma <input type="number" min="0" max="240" value={frame} onChange={e=>setFrame(Math.max(0,Number(e.target.value)))}/></label><span>30 FPS · ANIMACIÓN PENDIENTE</span></div>{timelineOpen&&<div className="timeline-body"><div className="track-label">Escena / {current?.name??"Sin selección"}</div><input type="range" min="0" max="240" value={frame} onChange={e=>setFrame(Number(e.target.value))}/><div className="track-note">La edición de keyframes se habilitará con el motor de animación.</div></div>}</section>
    <footer><span>LAB CREATIVE SUITE / GENRE3D</span><span>React · TypeScript · Three.js　 |　 Sin conexión con los motores de LAB Studio</span></footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
