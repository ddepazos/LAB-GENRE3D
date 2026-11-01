import * as THREE from 'three';

/** Editable per-structure metadata stored as glTF node extras (Object3D.userData). */
export type AnatomyAttributes={
  structureId:string; name:string; latinName:string; fmaId:string;
  system:string; region:string; side:string; description:string;
  source:string; license:string; attribution:string;
  editable:boolean;
};
export const emptyAnatomyAttributes=(name:string):AnatomyAttributes=>({
  structureId:'',name,latinName:'',fmaId:'',system:'',region:'',side:'',
  description:'',source:'',license:'',attribution:'',editable:true
});
const fields=['structureId','name','latinName','fmaId','system','region','side','description','source','license','attribution'] as const;
export function readAnatomyAttributes(object:THREE.Object3D):AnatomyAttributes{
  const stored=object.userData.labAnatomy;
  const base=emptyAnatomyAttributes(object.name);
  if(stored&&typeof stored==='object'){
    for(const field of fields){const value=(stored as Record<string,unknown>)[field];if(typeof value==='string')base[field]=value.slice(0,2000)}
    if(typeof (stored as Record<string,unknown>).editable==='boolean')base.editable=(stored as Record<string,boolean>).editable;
  }
  return base;
}
export function writeAnatomyAttributes(object:THREE.Object3D,patch:Partial<AnatomyAttributes>):AnatomyAttributes{
  const next=readAnatomyAttributes(object);
  if(!next.editable)throw new Error('Los atributos de esta estructura están bloqueados');
  for(const field of fields){const value=patch[field];if(typeof value==='string')next[field]=value.slice(0,2000)}
  if(typeof patch.editable==='boolean')next.editable=patch.editable;
  object.userData.labAnatomy=next;
  if(typeof patch.name==='string')object.name=next.name;
  return next;
}
/** Geometry remains in the GLB; extras preserve the anatomical identity across both LAB editors. */
export function collectAnatomyAttributes(scene:THREE.Object3D){
  const structures:{node:string;attributes:AnatomyAttributes}[]=[];
  scene.traverse(node=>{if(node.userData.labAnatomy)structures.push({node:node.uuid,attributes:readAnatomyAttributes(node)})});
  return structures;
}
