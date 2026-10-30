import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const target=new URL('../.downloads-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/labInterop.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{
 const {exportToLabStudio}=await import(target.href);const root=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());root.add(mesh);
 const clip=new THREE.AnimationClip('Mover',1,[new THREE.VectorKeyframeTrack(mesh.uuid+'.position',[0,1],[0,0,0,1,0,0])]);
 const guide=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());guide.userData.editorOnly=true;root.add(guide);
 let files;const manifest=await exportToLabStudio(root,{name:'escena prueba',clips:[clip],onReady:f=>{files=f}});
 assert(files.glb instanceof Blob);assert(files.manifest instanceof Blob);assert.equal(files.name,'escena-prueba');assert.deepEqual(JSON.parse(await files.manifest.text()),manifest);assert.equal(manifest.animation.clipNames[0],'Mover');assert.equal(manifest.animation.durationSeconds,1);
 const bytes=await files.glb.arrayBuffer(),view=new DataView(bytes),doc=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,view.getUint32(12,true))));assert.equal(doc.animations.length,1);assert.equal(doc.meshes.length,1);assert(guide.visible);
 console.log('PASS: export prepares GLB and manifest without automatic downloads, retains animation and excludes guides');
}finally{unlinkSync(target)}
