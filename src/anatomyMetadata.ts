import * as THREE from 'three';

/** Editable per-structure metadata stored as glTF node extras (Object3D.userData). */
export type AnatomyAttributes={
  structureId:string; name:string; latinName:string; fmaId:string;
  system:string; region:string; side:string; description:string;
  source:string; license:string; attribution:string;
  editable:boolean;
  schema?:'lab.anatomy/1';
  appearance?:{visible:boolean;opacity:number;color:string};
  permissions?:{transform:boolean;geometry:boolean;material:boolean;visibility:boolean;rig:boolean;animation:boolean};
  notes?:string;
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
    const v=stored as Record<string,unknown>;
    if(v.schema==='lab.anatomy/1')base.schema='lab.anatomy/1';
    if(typeof v.notes==='string')base.notes=v.notes.slice(0,2000);
    if(v.appearance&&typeof v.appearance==='object')base.appearance=v.appearance as AnatomyAttributes['appearance'];
    if(v.permissions&&typeof v.permissions==='object')base.permissions=v.permissions as AnatomyAttributes['permissions'];
    if(v.editable&&typeof v.editable==='object')base.permissions=v.editable as AnatomyAttributes['permissions'];
    if(typeof v.id==='string'&&!v.structureId)base.structureId=v.id;
    if(typeof v.label==='string'&&!v.name)base.name=v.label;
    for(const field of fields){const value=(stored as Record<string,unknown>)[field];if(typeof value==='string')base[field]=value.slice(0,2000)}
    if(typeof v.editable==='boolean')base.editable=v.editable;
    else if(base.permissions)base.editable=Object.values(base.permissions).some(Boolean);
  }
  return base;
}
export function writeAnatomyAttributes(object:THREE.Object3D,patch:Partial<AnatomyAttributes>):AnatomyAttributes{
  const next=readAnatomyAttributes(object);
  if(!next.editable)throw new Error('Los atributos de esta estructura están bloqueados');
  for(const field of fields){const value=patch[field];if(typeof value==='string')next[field]=value.slice(0,2000)}
  if(typeof patch.editable==='boolean')next.editable=patch.editable;
  if(patch.permissions)next.permissions={...next.permissions,...patch.permissions} as NonNullable<AnatomyAttributes['permissions']>;
  if(patch.appearance)next.appearance={...next.appearance,...patch.appearance} as NonNullable<AnatomyAttributes['appearance']>;
  if(typeof patch.notes==='string')next.notes=patch.notes.slice(0,2000);
  const old=object.userData.labAnatomy && typeof object.userData.labAnatomy==='object' ? object.userData.labAnatomy : {};
  object.userData.labAnatomy={...old,...next,schema:'lab.anatomy/1',id:next.structureId,label:next.name,editable:next.permissions??next.editable};
  if(typeof patch.name==='string')object.name=next.name;
  return next;
}
/** Geometry remains in the GLB; extras preserve the anatomical identity across both LAB editors. */
export function collectAnatomyAttributes(scene:THREE.Object3D){
  const structures:{node:string;attributes:AnatomyAttributes}[]=[];
  scene.traverse(node=>{if(node.userData.labAnatomy)structures.push({node:node.uuid,attributes:readAnatomyAttributes(node)})});
  return structures;
}
