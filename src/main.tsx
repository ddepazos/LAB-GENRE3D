import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import "./style.css";

type Mode = "translate" | "rotate" | "scale";
type Shape = "box" | "sphere" | "torus" | "cone" | "cylinder";
type Item = { id: number; name: string; shape: Shape; color: string; visible: boolean; position: [number,number,number]; rotation: [number,number,number]; scale: [number,number,number] };
const initial: Item[] = [{ id: 1, name: "Cubo 01", shape: "box", color: "#a9b6ff", visible: true, position: [0,1,0], rotation: [0,0,0], scale: [1,1,1] }];
const shapes: Shape[] = ["box","sphere","torus","cone","cylinder"];
const labels: Record<Shape,string> = {box:"Cubo",sphere:"Esfera",torus:"Toro",cone:"Cono",cylinder:"Cilindro"};
function Geometry({shape}:{shape:Shape}) {
  switch(shape) {
    case "sphere": return <sphereGeometry args={[.8,24,16]}/>;
    case "torus": return <torusGeometry args={[.7,.25,12,32]}/>;
    case "cone": return <coneGeometry args={[.8,1.6,24]}/>;
    case "cylinder": return <cylinderGeometry args={[.7,.7,1.6,24]}/>;
    default: return <boxGeometry args={[1.5,1.5,1.5]}/>;
  }
}
function Object3D({item,selected,mode,onSelect,onTransform}:{item:Item;selected:boolean;mode:Mode;onSelect:(id:number)=>void;onTransform:(id:number,mesh:THREE.Mesh)=>void}) {
  const ref=useRef<THREE.Mesh>(null);
  if(!item.visible)return null;
  const mesh=<mesh ref={ref} position={item.position} rotation={item.rotation} scale={item.scale} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();onSelect(item.id)}}>
    <Geometry shape={item.shape}/><meshStandardMaterial color={item.color} metalness={.25} roughness={.5}/>
  </mesh>;
  return selected ? <TransformControls mode={mode} onMouseUp={()=>{if(ref.current)onTransform(item.id,ref.current)}}>{mesh}</TransformControls> : mesh;
}
function App(){
  const [items,setItems]=useState<Item[]>(initial);
  const [selected,setSelected]=useState<number|null>(1);
  const [mode,setMode]=useState<Mode>("translate");
  const [tab,setTab]=useState("Modelar");
  const [transparent,setTransparent]=useState(false);
  const [showGrid,setShowGrid]=useState(true);
  const [timelineOpen,setTimelineOpen]=useState(true);
  const [frame,setFrame]=useState(0);
  const current=items.find(x=>x.id===selected);
  const update=(id:number,patch:Partial<Item>)=>setItems(prev=>prev.map(x=>x.id===id?{...x,...patch}:x));
  const add=(shape:Shape)=>{const id=Math.max(0,...items.map(x=>x.id))+1;setItems(p=>[...p,{id,name:labels[shape]+" "+String(id).padStart(2,"0"),shape,color:"#a9b6ff",visible:true,position:[0,1,0],rotation:[0,0,0],scale:[1,1,1]}]);setSelected(id)};
  const exportProject=()=>{const blob=new Blob([JSON.stringify({version:1,application:"LAB GENRE3D",items},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="genre3d-scene.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
  const importProject=async(file?:File)=>{if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.items)||data.items.some((x:Item)=>!shapes.includes(x.shape)||!Array.isArray(x.position)))throw Error("Formato incompatible");setItems(data.items);setSelected(null)}catch{alert("No se pudo abrir el proyecto JSON de GENRE3D.")}};
  const transform=(id:number,m:THREE.Mesh)=>update(id,{position:m.position.toArray() as Item["position"],rotation:[m.rotation.x,m.rotation.y,m.rotation.z],scale:m.scale.toArray() as Item["scale"]});
  return <div className="app">
    <header className="top"><div className="brand"><span className="brandmark">◈</span><b>LAB <em>GENRE3D</em></b><span className="edition">WEB / 0.2</span></div><nav>{["Archivo","Edición","Modelar","Rigging","Animar","Materiales","Exportar","Interfaz"].map(t=><button key={t} className={tab===t?"nav-active":""} onClick={()=>setTab(t)}>{t}</button>)}</nav><span className="status">● MOTOR THREE.JS</span></header>
    <div className="subbar"><span>ESCENA / SIN TÍTULO</span><div className="sub-actions"><button onClick={()=>setShowGrid(v=>!v)}>{showGrid?"▦ Retícula":"□ Retícula"}</button><button onClick={()=>setTransparent(v=>!v)}>{transparent?"◩ Alfa activo":"◧ Fondo sólido"}</button><button onClick={exportProject}>↓ Guardar JSON</button><label className="file-button">↑ Abrir JSON<input type="file" accept=".json,application/json" onChange={e=>{void importProject(e.target.files?.[0]);e.target.value=""}}/></label></div></div>
    <div className="workspace">
      <aside className="tools"><h3>HERRAMIENTAS</h3><div className="toolgrid">{(["translate","rotate","scale"] as Mode[]).map((m,i)=><button key={m} title={["Mover","Rotar","Escalar"][i]} className={mode===m?"active":""} onClick={()=>setMode(m)}>{["✥","⟳","⤢"][i]}<small>{["Mover","Rotar","Escala"][i]}</small></button>)}</div><h3>PRIMITIVAS 3D</h3><div className="shapes">{shapes.map(s=><button key={s} onClick={()=>add(s)}>＋ {labels[s]}</button>)}</div><div className="hint">Gizmos y órbita con mouse. Los módulos de rigging y animación se incorporarán por etapas.</div></aside>
      <main className={transparent?"alpha":""}><Canvas camera={{position:[5,4,7],fov:48}} gl={{antialias:true,alpha:true}} onPointerMissed={()=>setSelected(null)}><ambientLight intensity={1.2}/><directionalLight position={[5,8,4]} intensity={2}/>{showGrid&&<Grid infiniteGrid sectionSize={1} sectionColor="#414d60" cellColor="#2b333f" fadeDistance={24}/>}<group>{items.map(item=><Object3D key={item.id} item={item} selected={selected===item.id} mode={mode} onSelect={setSelected} onTransform={transform}/>)}</group><OrbitControls makeDefault/></Canvas><div className="viewport-label">PERSPECTIVA <span>●</span> 3D / EDITOR</div><div className="viewport-bottom">XYZ　 ·　{items.length} OBJETOS　 ·　{transparent?"FONDO ALFA":"FONDO OSCURO"}</div></main>
      <aside className="inspector"><h3>JERARQUÍA <span>{items.length}</span></h3><div className="scene-tree"><div className="tree-root">⌄　◈ Escena</div>{items.map(item=><div key={item.id} className={"tree-item "+(selected===item.id?"selected":"")}><button className="object-name" onClick={()=>setSelected(item.id)}>◇ {item.name}</button><button className="eye" title="Mostrar u ocultar" onClick={()=>update(item.id,{visible:!item.visible})}>{item.visible?"◉":"○"}</button></div>)}</div><h3>PROPIEDADES</h3>{current?<div className="properties"><label>Nombre<input value={current.name} onChange={e=>update(current.id,{name:e.target.value})}/></label><label>Material<input type="color" value={current.color} onChange={e=>update(current.id,{color:e.target.value})}/></label>{(["position","rotation","scale"] as const).map(prop=><div key={prop} className="vector"><div>{prop==="position"?"Posición":prop==="rotation"?"Rotación (rad)":"Escala"}</div><div className="axis">{current[prop].map((v,i)=><label key={i}><span>{["X","Y","Z"][i]}</span><input aria-label={prop+" "+["X","Y","Z"][i]} type="number" step=".1" value={Number(v.toFixed(2))} onChange={e=>{const n=[...current[prop]] as [number,number,number];n[i]=Number(e.target.value);update(current.id,{[prop]:n})}}/></label>)}</div></div>)}<button className="danger" onClick={()=>{setItems(p=>p.filter(x=>x.id!==current.id));setSelected(null)}}>Eliminar objeto</button></div>:<p>Selecciona un objeto para editarlo.</p>}<div className="future"><h3>MÓDULOS PRÓXIMOS</h3><p>Armature · IK/FK · Materiales PBR · Keyframes · GLB · PNG RGBA</p></div></aside>
    </div>
    <section className={"timeline "+(!timelineOpen?"collapsed":"")}><div className="timeline-head"><button onClick={()=>setTimelineOpen(v=>!v)}>{timelineOpen?"▾":"▸"} LÍNEA DE TIEMPO</button><span>◀　▷　▶</span><label>Fotograma <input type="number" min="0" max="240" value={frame} onChange={e=>setFrame(Math.max(0,Number(e.target.value)))}/></label><span>30 FPS · ANIMACIÓN PENDIENTE</span></div>{timelineOpen&&<div className="timeline-body"><div className="track-label">Escena / {current?.name??"Sin selección"}</div><input type="range" min="0" max="240" value={frame} onChange={e=>setFrame(Number(e.target.value))}/><div className="track-note">La edición de keyframes se habilitará con el motor de animación.</div></div>}</section>
    <footer><span>LAB CREATIVE SUITE / GENRE3D</span><span>React · TypeScript · Three.js　 |　 Sin conexión con los motores de LAB Studio</span></footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
