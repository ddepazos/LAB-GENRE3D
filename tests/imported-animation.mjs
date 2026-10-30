import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
globalThis.ProgressEvent=class{constructor(type,init){Object.assign(this,init)}};
const layerTarget=new URL('../.layers-test.mjs',import.meta.url);writeFileSync(layerTarget,ts.transpileModule(readFileSync(new URL('../src/animationLayers.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const target=new URL('../.imported-animation-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/rigAnimation.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("'./animationLayers'","'./.layers-test.mjs'"));
try{
 const {assetAnimationClips}=await import(target.href);const root=new THREE.Group();const a=new THREE.Group(),b=new THREE.Group();root.add(a,b);
 const first=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()),second=first.clone();first.name=second.name='Body';a.add(first);b.add(second);
 const source=new THREE.AnimationClip('Mover',1,[new THREE.VectorKeyframeTrack('Body.position',[0,1],[0,0,0,2,0,0])]);
 const asset={name:'A',object:a,clips:[source],rigKeys:[],bones:[],morphs:[]};const clips=assetAnimationClips(asset);
 assert.equal(source.tracks[0].name,'Body.position');assert.equal(clips[0].tracks[0].name,first.uuid+'.position');
 const mixer=new THREE.AnimationMixer(root);mixer.clipAction(clips[0]).play();mixer.setTime(.5);assert.equal(first.position.x,1);assert.equal(second.position.x,0);
 const binary=await new GLTFExporter().parseAsync(root,{binary:true,animations:clips,trs:true});const loaded=await new GLTFLoader().parseAsync(binary,'');assert.equal(loaded.animations.length,1);
 const playback=new THREE.AnimationMixer(loaded.scene);playback.clipAction(loaded.animations[0]).play();playback.setTime(.25);let moved;loaded.scene.traverse(n=>{if(n.isMesh&&n.position.x!==0)moved=n});assert(Math.abs(moved.position.x-.5)<1e-6);
 assert.throws(()=>assetAnimationClips({...asset,clips:[new THREE.AnimationClip('Bad',1,[new THREE.VectorKeyframeTrack('Missing.position',[0,1],[0,0,0,1,0,0])])]}),/vincular/);
 console.log('PASS: imported clips survive re-export/reopen, duplicate names remain isolated, source tracks intact, missing bindings reported');
}finally{unlinkSync(target);unlinkSync(layerTarget)}
