import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
class Reader {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}}
globalThis.FileReader=Reader;
const target=new URL('../.interop-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/labInterop.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try {
 const {serializeSceneGlb}=await import(target.href);
 const scene=new THREE.Group();const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());scene.add(mesh);
 const guide=mesh.clone();guide.userData={editorOnly:true};scene.add(guide);
 const controls=new THREE.Group();controls.isTransformControls=true;controls.add(mesh.clone());scene.add(controls);
 const blob=await serializeSceneGlb(scene),bytes=await blob.arrayBuffer();
 const view=new DataView(bytes);assert.equal(view.getUint32(0,true),0x46546c67);
 const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,view.getUint32(12,true))));
 assert.equal(doc.meshes.length,1);assert.equal(doc.nodes.filter(n=>n.mesh!==undefined).length,1);
 assert.equal(guide.visible,true);assert.equal(controls.visible,true);
 console.log('PASS: Blender scene serialization returns GLB, excludes editor guides and restores visibility');
}finally{unlinkSync(target)}
