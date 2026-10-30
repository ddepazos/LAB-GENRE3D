import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
globalThis.ProgressEvent=class{constructor(type,init){Object.assign(this,init)}};
const target=new URL('../.rig-template-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/rigTemplate.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{
 const {createRigTemplate}=await import(target.href);const root=createRigTemplate(),mesh=root.children[0];
 assert(mesh.isSkinnedMesh);assert.equal(mesh.skeleton.bones.length,3);
 const weights=mesh.geometry.attributes.skinWeight;
 for(let i=0;i<weights.count;i++)assert(Math.abs(weights.getX(i)+weights.getY(i)-1)<1e-6);
 const p=new THREE.Vector3(),original=mesh.getVertexPosition(0,p).clone();
 mesh.skeleton.bones[1].rotation.z=.7;root.updateMatrixWorld(true);mesh.skeleton.update();
 assert(mesh.getVertexPosition(0,p).distanceTo(original)>.1);
 const buffer=await new GLTFExporter().parseAsync(root,{binary:true,trs:true});
 const loaded=await new GLTFLoader().parseAsync(buffer,'');let imported;loaded.scene.traverse(n=>{if(n.isSkinnedMesh)imported=n});
 assert(imported);assert.equal(imported.skeleton.bones.length,3);assert.equal(imported.morphTargetInfluences.length,1);assert.equal(imported.morphTargetDictionary.Volumen,0);
 console.log('PASS: normalized weights, visible skin deformation, GLB rig and named morph roundtrip');
}finally{unlinkSync(target)}
