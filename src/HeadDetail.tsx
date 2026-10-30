import React, { useMemo } from "react";
import * as THREE from "three";

/** Procedural facial head, independent of the character's body rig.
 * Controls are real geometric transforms (jaw, eyes, brows), not skinning or morph targets.
 */
export type HeadKind = "Humano" | "Robot" | "Maniquí" | "Criatura";
export type FacePose = { jaw: number; brow: number; blink: number; gazeX: number; gazeY: number; smile: number; lipOpen: number; tongue: number; browLeft: number; browRight: number };
export const neutralFace: FacePose = { jaw: 0, brow: 0, blink: 0, gazeX: 0, gazeY: 0, smile: 0, lipOpen: 0, tongue: 0, browLeft: 0, browRight: 0 };
export const facePresets: Record<string, FacePose> = {
  Neutra: neutralFace,
  Sorpresa: { jaw: 45, brow: 80, blink: 0, gazeX: 0, gazeY: 0, smile: 0, lipOpen: 0, tongue: 0, browLeft: 0, browRight: 0 },
  Enojo: { jaw: 12, brow: -75, blink: 20, gazeX: 0, gazeY: 0, smile: 0, lipOpen: 0, tongue: 0, browLeft: 0, browRight: 0 },
  Sonrisa: { jaw: 22, brow: 35, blink: 12, gazeX: 0, gazeY: 0, smile: 0, lipOpen: 0, tongue: 0, browLeft: 0, browRight: 0 },
  Sueño: { jaw: 0, brow: -20, blink: 95, gazeX: 0, gazeY: 0, smile: 0, lipOpen: 0, tongue: 0, browLeft: 0, browRight: 0 }
};
const material = (color: string, roughness=.7, metalness=0) =>
  new THREE.MeshStandardMaterial({color, roughness, metalness});
function HeadDetail({kind,pose,onJawDrag}:{kind:HeadKind;pose:FacePose;onJawDrag?:(delta:number)=>void}) {
  const robot=kind==="Robot",creature=kind==="Criatura",mannequin=kind==="Maniquí";
  const skin=robot?"#9bafc6":creature?"#76a98a":mannequin?"#dac9aa":"#d9a68e";
  const main=useMemo(()=>material(skin,.72,robot?.65:0),[skin,robot]);
  const shadow=useMemo(()=>material(robot?"#344a63":creature?"#385b48":"#815e52"),[robot,creature]);
  const eye=useMemo(()=>material(robot?"#75d9f7":"#f3f0e9",.2,robot?.25:0),[robot]);
  const iris=useMemo(()=>material(robot?"#22c7f5":creature?"#d6a43d":"#3d6b83",.2),[robot,creature]);
  const mouth=useMemo(()=>material("#281b23"),[]);
  const tooth=useMemo(()=>material("#eee8db",.32),[]);
  const jawRad=THREE.MathUtils.degToRad(Math.max(0,Math.min(65,pose.jaw)))*.75;
  const browOffset=pose.brow/400;
  const eyelidScale=Math.max(.07,1-pose.blink/100);
  return <group>
    <mesh material={main} scale={[creature?.43:.34,creature?.39:.37,.34]} position={[0,.05,0]}><sphereGeometry args={[1,48,32]}/></mesh>
    <mesh material={shadow} position={[0,-.145,.292]} scale={[.225,.115,.045]}><sphereGeometry args={[1,24,12]}/></mesh>
    <group position={[0,-.16,.02]} rotation={[jawRad,0,0]}>
      <mesh material={main} position={[0,-.115,.095]} scale={[.26,.125,.275]}><sphereGeometry args={[1,32,20]}/></mesh>
      <mesh material={mouth} position={[0,-.025,.29]} scale={[.20+pose.smile*.0008,.025+pose.lipOpen*.00035,.016]}><sphereGeometry args={[1,24,12]}/></mesh>
      <mesh position={[0,-.07,.323]} scale={[.075,.025+pose.tongue*.00035,.018]}><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#bb6477" roughness={.8}/></mesh>{[-2,-1,0,1,2].map(i=><mesh key={i} material={tooth} position={[i*.065,-.02,.306]}><boxGeometry args={[.054,.055,.03]}/></mesh>)}
      <mesh material={main} position={[0,-.21,.26]} scale={[.17,.035,.055]}><sphereGeometry args={[1,24,12]}/></mesh>
    </group>
    {[-1,1].map(side=><group key={side}>
      <mesh material={shadow} position={[side*.175,.11,.293]} scale={[.13,.105,.042]}><sphereGeometry args={[1,24,16]}/></mesh>
      <mesh material={eye} position={[side*.175,.11,.323]} scale={[.105,.09*eyelidScale,.035]}><sphereGeometry args={[1,32,20]}/></mesh>
      <mesh material={iris} position={[side*.175+pose.gazeX*.0006,.11+pose.gazeY*.0006,.354]} scale={[.036,.041*eyelidScale,.014]}><sphereGeometry args={[1,20,12]}/></mesh>
      <mesh material={shadow} position={[side*.175,.245+browOffset+(side===-1?pose.browLeft:pose.browRight)/400,.323]} rotation={[0,0,-side*(pose.brow/450)]} scale={[.15,.026,.037]}><boxGeometry args={[1,1,1]}/></mesh>
      <mesh material={main} position={[side*.335,-.03,.01]} scale={[.07,.135,.085]}><sphereGeometry args={[1,20,16]}/></mesh>
    </group>)}
    <mesh material={main} position={[0,-.015,.35]} scale={[.078,.15,.11]}><sphereGeometry args={[1,24,16]}/></mesh>
    {creature&&[-1,1].map(side=><mesh key={side} material={shadow} position={[side*.28,.4,-.015]} rotation={[0,0,-side*.3]}><coneGeometry args={[.085,.3,20]}/></mesh>)}
    <mesh material={main} position={[0,-.2,-.08]} scale={[.20,.09,.18]}><sphereGeometry args={[1,20,16]}/></mesh>
    {onJawDrag&&<mesh position={[0,-.31,.35]} onPointerDown={e=>{e.stopPropagation();(e.target as Element).setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(e.buttons===1){e.stopPropagation();onJawDrag(-e.movementY*.9)}}} onPointerUp={e=>{e.stopPropagation();(e.target as Element).releasePointerCapture(e.pointerId)}}><sphereGeometry args={[.065,12,12]}/><meshStandardMaterial color="#ffd46c" transparent opacity={.75}/></mesh>}
  </group>;
}
export default HeadDetail;
