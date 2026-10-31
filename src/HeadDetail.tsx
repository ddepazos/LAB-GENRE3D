import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import {HeadSurface} from "./HeadSurface";

export type HeadKind = "Humano" | "Robot" | "Maniquí" | "Criatura";
export type FacePose = { jaw: number; brow: number; blink: number; gazeX: number; gazeY: number; smile: number; lipOpen: number; tongue: number; browLeft: number; browRight: number };
export const neutralFace: FacePose = { jaw: 0, brow: 0, blink: 0, gazeX: 0, gazeY: 0, smile: 0, lipOpen: 0, tongue: 0, browLeft: 0, browRight: 0 };
export const facePresets: Record<string, FacePose> = {
  Neutra: neutralFace,
  Sorpresa: { ...neutralFace, jaw: 38, brow: 65, lipOpen: 65 },
  Enojo: { ...neutralFace, jaw: 8, brow: -60, blink: 22, browLeft: -10, browRight: -10 },
  Sonrisa: { ...neutralFace, jaw: 12, brow: 20, blink: 15, smile: 75, lipOpen: 20 },
  Sueño: { ...neutralFace, brow: -15, blink: 100 },
  Tristeza: { ...neutralFace, brow: 15, browLeft: 18, browRight: 18, smile: -55, blink: 20 },
  Atención: { ...neutralFace, smile: 15, browRight: 35, gazeX: 25 }
};
/** Every expression uses named mesh transforms, retained by the existing GLB animation baker. */
export function faceMetrics(pose:FacePose){
 const clamp=(v:number,min:number,max:number)=>THREE.MathUtils.clamp(Number.isFinite(v)?v:0,min,max);
 return {jaw:THREE.MathUtils.degToRad(clamp(pose.jaw,0,65))*.62,smile:clamp(pose.smile,-100,100)/100,blink:clamp(pose.blink,0,100)/100,open:clamp(pose.lipOpen,0,100)/100,gazeX:clamp(pose.gazeX,-100,100)*.00032,gazeY:clamp(pose.gazeY,-100,100)*.00025};
}
function HeadDetail({kind,pose,onJawDrag}:{kind:HeadKind;pose:FacePose;onJawDrag?:(delta:number)=>void}) {
 const robot=kind==="Robot",creature=kind==="Criatura",mannequin=kind==="Maniquí",f=faceMetrics(pose);
 const materials=useMemo(()=>{
  const m=(color:string,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  return {skin:m(robot?'#9bafc6':creature?'#72957c':mannequin?'#d3c3a8':'#c9957d',robot?.32:.62,robot?.72:0),shadow:m(robot?'#304459':'#705246'),lip:m(robot?'#526e87':creature?'#567265':'#a96460',.48),white:m('#f1e9dc',.24),iris:m(robot?'#37cde2':creature?'#c29b47':'#526f64',.27),pupil:m('#11191b',.18),mouth:m('#291820',.9),tongue:m('#bd737a',.62),teeth:m('#e4dccb',.32),hair:m(robot?'#304459':'#40332d',.86)};
 },[kind]);
 useEffect(()=>()=>Object.values(materials).forEach(m=>m.dispose()),[materials]);
 const {skin,shadow,lip,white,iris,pupil,mouth,tongue,teeth,hair}=materials;
 const brow=THREE.MathUtils.clamp(pose.brow,-100,100);
 return <group name="Cabeza_detallada_LAB">
  <HeadSurface material={skin} jaw={f.jaw} wide={creature}/>
  <mesh name="Cavidad_oral" material={mouth} position={[0,-.155,.242]} scale={[.157+f.smile*.025,.032+f.open*.03+f.jaw*.09,.038]}><sphereGeometry args={[1,32,20]}/></mesh>
  <group name="Mandibula" position={[0,-.13,-.015]} rotation={[f.jaw,0,0]}>
   <mesh name="Lengua" material={tongue} position={[0,-.055,.265+pose.tongue*.00035]} scale={[.07,.016+Math.max(0,pose.tongue)*.0001,.042]}><sphereGeometry args={[1,24,16]}/></mesh>
   {Array.from({length:9},(_,i)=>{const x=(i-4)*.029;return <mesh key={i} name={'Diente_inferior_'+i} material={teeth} position={[x,-.029,.263-.12*x*x]} scale={[.012,.019,.012]}><sphereGeometry args={[1,12,10]}/></mesh>})}
   {Array.from({length:17},(_,i)=>{const u=(i-8)/8,x=u*(.151+f.smile*.025),y=-.034-.021*(1-u*u)-f.open*.025+f.smile*.025*u*u;return <mesh key={i} name={'Labio_inferior_'+i} material={lip} position={[x,y,.278-.045*u*u]} rotation={[0,0,u*.22]} scale={[.015,.012*(1-.35*Math.abs(u)),.013]}><sphereGeometry args={[1,12,10]}/></mesh>})}
  </group>
  {Array.from({length:9},(_,i)=>{const x=(i-4)*.029;return <mesh key={i} name={'Diente_superior_'+i} material={teeth} position={[x,-.157,.275-.12*x*x]} scale={[.012,.021,.012]}><sphereGeometry args={[1,12,10]}/></mesh>})}
  {Array.from({length:17},(_,i)=>{const u=(i-8)/8,x=u*(.151+f.smile*.025),cupid=.006*Math.cos(u*Math.PI*3)*(1-Math.abs(u));return <mesh key={i} name={'Labio_superior_'+i} material={lip} position={[x,-.152+cupid+f.smile*.027*u*u,.283-.045*u*u]} scale={[.015,.009*(1-.35*Math.abs(u)),.014]}><sphereGeometry args={[1,12,10]}/></mesh>})}
  {[-1,1].map(side=><group key={side} name={side<0?'Facial_izquierdo':'Facial_derecho'}>
   <mesh name="Orbita" material={shadow} position={[side*.132,.095,.225]} scale={[.103,.066,.036]}><sphereGeometry args={[1,32,20]}/></mesh>
   <mesh name="Globo_ocular" material={white} position={[side*.132,.096,.252]} scale={[.086,.052*Math.max(.001,1-f.blink),.044]}><sphereGeometry args={[1,32,24]}/></mesh>
   <group name="Mirada" position={[side*.132+f.gazeX,.096+f.gazeY,.293]} scale={[1,Math.max(.001,1-f.blink),1]}>
    <mesh name="Iris" material={iris} scale={[.032,.034,.009]}><sphereGeometry args={[1,28,20]}/></mesh>
    <mesh name="Pupila" material={pupil} position={[0,0,.008]} scale={[.014,.018,.004]}><sphereGeometry args={[1,20,16]}/></mesh>
    <mesh name="Reflejo" material={white} position={[-.009,.011,.012]} scale={[.005,.005,.002]}><sphereGeometry args={[1,12,8]}/></mesh>
   </group>
   <mesh name="Parpado_superior" material={skin} position={[side*.132,.142-f.blink*.044,.263]} scale={[.091,.014+f.blink*.025,.039]}><sphereGeometry args={[1,28,20]}/></mesh>
   <mesh name="Parpado_inferior" material={skin} position={[side*.132,.046+f.blink*.013,.259]} scale={[.089,.014,.032]}><sphereGeometry args={[1,28,16]}/></mesh>
   <group name="Ceja" position={[side*.132,.192+brow*.00045+(side<0?pose.browLeft:pose.browRight)*.0004,.25]} rotation={[0,0,-side*brow*.002]}>
    {Array.from({length:7},(_,i)=>{const u=(i-3)/3;return <mesh key={i} material={hair} position={[u*.031,.013*(1-u*u),-.014*u*u]} rotation={[0,0,-u*.15]} scale={[.02,.009*(1-.3*Math.abs(u)),.012]}><sphereGeometry args={[1,12,8]}/></mesh>})}
   </group>
   <group name="Oreja" position={[side*.303,-.015,-.005]} rotation={[0,side*.2,side*.08]}>
    <mesh material={skin} scale={[.048,.1,.062]}><sphereGeometry args={[1,28,20]}/></mesh>
    <mesh material={shadow} position={[side*.012,.005,.049]} scale={[.026,.065,.014]}><sphereGeometry args={[1,20,16]}/></mesh>
    <mesh material={skin} position={[side*.014,-.025,.056]} scale={[.019,.033,.012]}><sphereGeometry args={[1,20,12]}/></mesh>
   </group>
   <mesh name="Aile_nariz" material={skin} position={[side*.047,-.067,.281]} scale={[.037,.026,.041]}><sphereGeometry args={[1,24,16]}/></mesh>
   <mesh name="Fosa_nasal" material={shadow} position={[side*.037,-.083,.307]} rotation={[.3,0,0]} scale={[.014,.009,.012]}><sphereGeometry args={[1,16,12]}/></mesh>
  </group>)}
  <mesh name="Puente_nasal" material={skin} position={[0,.012,.257]} scale={[.038,.105,.062]} rotation={[-.16,0,0]}><sphereGeometry args={[1,32,24]}/></mesh>
  <mesh name="Punta_nariz" material={skin} position={[0,-.051,.315]} scale={[.043,.032,.039]}><sphereGeometry args={[1,28,20]}/></mesh>
  {creature&&[-1,1].map(side=><mesh key={side} material={shadow} position={[side*.25,.4,-.03]} rotation={[0,0,-side*.3]}><coneGeometry args={[.065,.28,24]}/></mesh>)}
  {onJawDrag&&<mesh position={[0,-.31,.28]} onPointerDown={e=>{e.stopPropagation();(e.target as Element).setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(e.buttons===1){e.stopPropagation();onJawDrag(-e.movementY*.9)}}} onPointerUp={e=>{e.stopPropagation();(e.target as Element).releasePointerCapture(e.pointerId)}}><sphereGeometry args={[.04,12,12]}/><meshStandardMaterial color="#ffd46c" transparent opacity={.75}/></mesh>}
 </group>;
}
export default HeadDetail;
