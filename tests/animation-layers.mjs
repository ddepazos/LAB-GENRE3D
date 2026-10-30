import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
const path=new URL('../.layer-blend-test.mjs',import.meta.url);
writeFileSync(path,ts.transpileModule(readFileSync(new URL('../src/animationLayers.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{
 const {layerPlayback,bakeLayerClip,layerDuration}=await import(path.href);const root=new THREE.Group(),joint=new THREE.Group();root.add(joint);
 const clips=[new THREE.AnimationClip('A',1,[new THREE.VectorKeyframeTrack(joint.uuid+'.position',[0,1],[0,0,0,2,0,0])]),new THREE.AnimationClip('B',1,[new THREE.VectorKeyframeTrack(joint.uuid+'.position',[0,1],[0,0,0,0,2,0])])];
 const layers=[{clip:0,enabled:true,weight:.5,speed:1,offset:0},{clip:1,enabled:true,weight:.5,speed:1,offset:0}];const player=layerPlayback(root,clips,layers);player.seek(.5);assert(Math.abs(joint.position.x-.5)<1e-6);assert(Math.abs(joint.position.y-.5)<1e-6);player.dispose();assert.equal(joint.position.x,0);
 const baked=bakeLayerClip(root,clips,layers),mixer=new THREE.AnimationMixer(root);assert(baked);mixer.clipAction(baked).play();mixer.setTime(.5);assert(Math.abs(joint.position.y-.5)<1e-5);mixer.stopAllAction();
 assert.equal(layerDuration(clips,[{...layers[0],speed:.5,offset:1}]),3);assert.equal(layerDuration(clips,[]),0);
 const delayed=layerPlayback(root,clips,[{...layers[0],offset:1}]);delayed.seek(.5);assert.equal(joint.position.x,0);delayed.dispose();
 console.log('PASS: weighted blend, baked portable clip, timing/speed, disabled layers and pose restoration');
}finally{unlinkSync(path)}
