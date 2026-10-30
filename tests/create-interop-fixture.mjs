import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const file=new URL('../.fixture-rig.mjs',import.meta.url);
writeFileSync(file,ts.transpileModule(readFileSync(new URL('../src/rigTemplate.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{const {createRigTemplate}=await import(file.href);const root=createRigTemplate(),mesh=root.children[0],bone=mesh.skeleton.bones[1];
const clip=new THREE.AnimationClip('GENRE3D_Codo_Volumen',1,[new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',[0,1],[...new THREE.Quaternion().toArray(),...new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/3).toArray()]),new THREE.NumberKeyframeTrack(mesh.uuid+'.morphTargetInfluences',[0,1],[0,1])]);
const binary=await new GLTFExporter().parseAsync(root,{binary:true,animations:[clip],trs:true});writeFileSync(new URL('../public/fixtures/genre3d-rig-animation.glb',import.meta.url),new Uint8Array(binary));console.log('GENRE3D interoperability fixture generated');}finally{unlinkSync(file)}
