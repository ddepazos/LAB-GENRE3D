import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const target=new URL('../.orbit-model-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/orbitModel.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{
 const {createOrbitModel}=await import(target.href);
 const {root,clip}=createOrbitModel();
 const binary=await new GLTFExporter().parseAsync(root,{binary:true,animations:[clip],trs:true});
 const loaded=await new GLTFLoader().parseAsync(binary,'');
 assert.equal(loaded.animations.length,1);assert.equal(loaded.animations[0].duration,4);
 let meshes=0;loaded.scene.traverse(n=>{if(n.isMesh)meshes++});assert.equal(meshes,6);
 const mixer=new THREE.AnimationMixer(loaded.scene), action=mixer.clipAction(loaded.animations[0]);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
 let previous=0,total=0;
 for(let i=0;i<=120;i++){mixer.setTime(i/30);const q=loaded.scene.getObjectByName('Giro_361').quaternion;const angle=2*Math.atan2(q.y,q.w);let delta=angle-previous;while(delta>Math.PI)delta-=2*Math.PI;while(delta< -Math.PI)delta+=2*Math.PI;total+=delta;previous=angle;}
 assert(Math.abs(THREE.MathUtils.radToDeg(total)-361)<.001);
 console.log('PASS: generated 6 meshes; GLB roundtrip retains 4-second clip and full 361-degree rotation');
}finally{unlinkSync(target)}
