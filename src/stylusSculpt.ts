import * as THREE from 'three';
import type {StylusSample} from './stylusInput';
export type SculptMode='inflate'|'deflate'|'smooth'|'pinch'|'flatten';
export interface SculptBrush {mode:SculptMode; radius:number; strength:number; symmetryX:boolean}
export const DEFAULT_SCULPT_BRUSH:SculptBrush={mode:'inflate',radius:.3,strength:.25,symmetryX:false};
/** Sculpt in mesh-local coordinates. Geometry must be owned by the edited mesh, not shared. */
export function sculptGeometry(geometry:THREE.BufferGeometry,point:THREE.Vector3,stroke:StylusSample,brush:SculptBrush):boolean{
 const position=geometry.getAttribute('position') as THREE.BufferAttribute|undefined;
 if(!position||position.count===0||brush.radius<=0)return false;
 const radius=brush.radius, pressure=Math.max(0,Math.min(1,stroke.pressure));
 if(!pressure)return false;
 const vertices:THREE.Vector3[]=[];
 for(let i=0;i<position.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(position,i));
 geometry.computeVertexNormals();
 const normals=geometry.getAttribute('normal');
 const center=new THREE.Vector3();
 const target=new THREE.Vector3();
 let changed=false;
 const centers=[point];
 if(brush.symmetryX&&Math.abs(point.x)>1e-5)centers.push(new THREE.Vector3(-point.x,point.y,point.z));
 for(let i=0;i<vertices.length;i++){
  const v=vertices[i];let delta=new THREE.Vector3();
  for(const c of centers){
   const distance=v.distanceTo(c);if(distance>=radius)continue;
   const falloff=Math.pow(1-distance/radius,2)*brush.strength*pressure;
   const normal=new THREE.Vector3().fromBufferAttribute(normals,i).normalize();
   if(brush.mode==='inflate'||brush.mode==='deflate')delta.addScaledVector(normal,falloff*(brush.mode==='deflate'?-1:1));
   else if(brush.mode==='pinch')delta.addScaledVector(center.copy(c).sub(v).normalize(),falloff);
   else if(brush.mode==='flatten')delta.addScaledVector(normal,-v.clone().sub(c).dot(normal)*falloff);
   else {
    target.set(0,0,0);let count=0;
    for(let j=0;j<vertices.length;j++)if(vertices[j].distanceTo(v)<radius*.45){target.add(vertices[j]);count++;}
    if(count)delta.addScaledVector(target.divideScalar(count).sub(v),falloff);
   }
  }
  if(delta.lengthSq()>0){position.setXYZ(i,v.x+delta.x,v.y+delta.y,v.z+delta.z);changed=true;}
 }
 if(changed){position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();}
 return changed;
}
