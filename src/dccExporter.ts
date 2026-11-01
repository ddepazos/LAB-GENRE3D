import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter.js';
import {USDZExporter} from 'three/examples/jsm/exporters/USDZExporter.js';

export type ExportFormat='glb'|'obj'|'usdz';
export type ExportScope='selection'|'scene';
export type DccExportOptions={
 format:ExportFormat;
 scope:ExportScope;
 scene:THREE.Object3D;
 selected?:THREE.Object3D|null;
 clips?:THREE.AnimationClip[];
 name?:string;
};
export type DccExportFile={name:string;blob:Blob;warnings:string[]};
const cleanName=(name:string)=>name.replace(/[^a-z0-9._-]/gi,'_').slice(0,100)||'genre3d';
function meshes(root:THREE.Object3D){const result:THREE.Mesh[]=[];root.traverse(n=>{if((n as THREE.Mesh).isMesh)result.push(n as THREE.Mesh)});return result}
function rootForExport({scene,selected,scope}:DccExportOptions){
 if(scope==='selection'){if(!selected)throw new Error('Selecciona un objeto para exportar');return selected}
 return scene;
}
function mtlFromMeshes(root:THREE.Object3D){
 const warnings:string[]=['OBJ/MTL no conserva rigging, animaciones, luces ni PBR completo. Las texturas requieren un paquete adicional.'];
 const materials=new Map<string,THREE.Material>();
 for(const mesh of meshes(root)){for(const mat of (Array.isArray(mesh.material)?mesh.material:[mesh.material]))materials.set(mat.name||'Material',mat)}
 const lines=['# LAB GENRE3D - materiales aproximados para OBJ'];
 for(const [name,mat] of materials){const m=mat as THREE.MeshStandardMaterial;const color=m.color??new THREE.Color(1,1,1);lines.push('newmtl '+name.replace(/\s+/g,'_'),'Kd '+color.r.toFixed(6)+' '+color.g.toFixed(6)+' '+color.b.toFixed(6),'d '+(1-m.opacity||1).toFixed(6),'illum 2');if(m.map)warnings.push('El mapa de '+name+' no se empaquetó en OBJ/MTL; usa GLB para conservarlo.')}
 return {text:lines.join('\n')+'\n',warnings};
}
export async function exportDcc(options:DccExportOptions):Promise<DccExportFile[]>{
 const root=rootForExport(options),name=cleanName(options.name??'genre3d-export');
 if(!meshes(root).length)throw new Error('No hay mallas exportables');
 if(options.format==='glb'){
   const data=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:false,trs:true,animations:options.clips??[]});
   if(!(data instanceof ArrayBuffer))throw new Error('El exportador no devolvió un GLB binario');
   // Round-trip verification of GLB structure and parseability.
   const parsed=await new GLTFLoader().parseAsync(data,'');
   if(!meshes(parsed.scene).length)throw new Error('El GLB exportado no contiene mallas');
   return [{name:name+'.glb',blob:new Blob([data],{type:'model/gltf-binary'}),warnings:[]}];
 }
 if(options.format==='obj'){
   const obj=new OBJExporter().parse(root);const mtl=mtlFromMeshes(root);
   return [
     {name:name+'.obj',blob:new Blob(['mtllib '+name+'.mtl\n',obj],{type:'text/plain'}),warnings:mtl.warnings},
     {name:name+'.mtl',blob:new Blob([mtl.text],{type:'text/plain'}),warnings:mtl.warnings}
   ];
 }
 const exporter=new USDZExporter();
 const data=await exporter.parseAsync(root as THREE.Scene);
 return [{name:name+'.usdz',blob:new Blob([data],{type:'model/vnd.usdz+zip'}),warnings:['USDZ: verifica materiales y compatibilidad de animaciones en el programa destino.']}];
}
export function downloadDcc(files:DccExportFile[]){
 for(const file of files){const url=URL.createObjectURL(file.blob);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)}
}
