import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, TransformControls, Grid } from "@react-three/drei";
import "./style.css";

function Scene({ mode, selected, onSelect }: { mode: "translate" | "rotate" | "scale"; selected: boolean; onSelect: () => void }) {
  return <>
    <ambientLight intensity={1.2} />
    <directionalLight position={[5, 8, 4]} intensity={2} />
    <Grid infiniteGrid sectionSize={1} sectionColor="#414d60" cellColor="#2b333f" fadeDistance={24} />
    {selected ? <TransformControls mode={mode}><mesh onClick={onSelect} position={[0, 1, 0]}><boxGeometry args={[1.4, 1.4, 1.4]} /><meshStandardMaterial color="#a9b6ff" metalness={0.3} roughness={0.45} /></mesh></TransformControls> :
    <mesh position={[0, 1, 0]} onClick={onSelect}><boxGeometry args={[1.4, 1.4, 1.4]} /><meshStandardMaterial color="#a9b6ff" /></mesh>}
    <OrbitControls makeDefault />
  </>;
}
function App() {
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [selected, setSelected] = useState(true);
  return <div className="app">
    <header><strong>LAB <span>GENRE3D</span></strong><nav>Archivo　 Modelar　 Rigging　 Animar　 Materiales　 Exportar</nav><small>PRE-ALFA · 0.1</small></header>
    <div className="workspace"><aside><h3>HERRAMIENTAS</h3>{(["translate","rotate","scale"] as const).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>setMode(m)}>{m==="translate"?"Mover":m==="rotate"?"Rotar":"Escalar"}</button>)}<p>Selecciona el cubo para manipularlo con el mouse.</p></aside>
    <main><Canvas camera={{position:[4,3,6],fov:48}}><Scene mode={mode} selected={selected} onSelect={()=>setSelected(true)}/></Canvas><div className="viewport-label">PERSPECTIVA · THREE.JS</div></main>
    <aside><h3>JERARQUÍA</h3><button className={selected?"active":""} onClick={()=>setSelected(!selected)}>▣ Cubo 01</button><h3>PROPIEDADES</h3><p>Herramienta: {mode}</p><p>Rigging, importación y exportación: siguientes fases.</p></aside></div>
    <footer><div>▶　00:00　│　 Timeline por capas — pendiente</div><small>LAB Creative Suite · aplicación independiente</small></footer>
  </div>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
