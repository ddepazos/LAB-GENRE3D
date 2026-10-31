import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const paths=[];
async function module(name){const url=new URL('../.creative-'+name+'.mjs',import.meta.url);paths.push(url);writeFileSync(url,ts.transpileModule(readFileSync(new URL('../src/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("'./turntable'","'./.creative-turntable.mjs'"));return import(url.href)}
try{
 const {animatedCopy}=await module('turntable'),{profileModel,defaultProfile}=await module('profileModel');
 const source=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());source.add(mesh);
 const motion=new THREE.AnimationClip('Movement',2,[new THREE.VectorKeyframeTrack(mesh.uuid+'.position',[0,2],[0,0,0,2,0,0])]);
 for(const axis of ['x','y','z']){
  const model=animatedCopy(source,[motion],{axis,degrees:-721,duration:2});
  const data=await new GLTFExporter().parseAsync(model.root,{binary:true,animations:[model.clip],trs:true});
  const gltf=await new GLTFLoader().parseAsync(data,'');assert.equal(gltf.animations[0].tracks.length,2);
  const pivot=gltf.scene.getObjectByName('Pivote_giro_LAB');const mixer=new THREE.AnimationMixer(gltf.scene),action=mixer.clipAction(gltf.animations[0]);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  let total=0,previous=0;for(let i=0;i<=60;i++){mixer.setTime(i/30);const q=pivot.quaternion;const angle=2*Math.atan2(q[axis],q.w);let delta=angle-previous;while(delta>Math.PI)delta-=Math.PI*2;while(delta< -Math.PI)delta+=Math.PI*2;total+=delta;previous=angle}assert(Math.abs(THREE.MathUtils.radToDeg(total)+721)<.001);
 }
 assert.equal(source.children.length,1);assert.equal(mesh.position.x,0);assert.throws(()=>animatedCopy(source,[],{axis:'x',degrees:NaN,duration:2}));
 const ring=profileModel(defaultProfile);ring.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(0,0,2),new THREE.Vector3(0,0,-1));assert.equal(ray.intersectObject(ring,true).length,0);ray.set(new THREE.Vector3(.75,0,2),new THREE.Vector3(0,0,-1));assert(ray.intersectObject(ring,true).length>0);
 const binary=await new GLTFExporter().parseAsync(ring,{binary:true});const saved=await new GLTFLoader().parseAsync(binary,'');assert.equal(saved.scene.children[0].userData.genre3dProfile.depth,.5);
 const {objectTimeline}=await module('objectTimeline');const timeline=objectTimeline(source,[],[{frame:0,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1]},{frame:30,position:[2,0,0],rotation:[0,Math.PI/2,0],scale:[2,2,2]}]);const tm=new THREE.AnimationMixer(timeline.root);tm.clipAction(timeline.clip).play();tm.setTime(.5);assert.equal(timeline.root.children[0].position.x,1);assert.equal(timeline.root.children[0].scale.x,1.5);
 const {strokeModel,defaultDrawing}=await module('strokeModel');
 const drawing={...defaultDrawing,layers:[...defaultDrawing.layers,{...defaultDrawing.layers[0],name:'Segunda'}],strokes:[{layer:0,points:[[0,0],[1,1],[1,1],[1.5,0]],frame:0},{layer:1,points:[[0,1],[1,0]],frame:30}]};
 const strokes=strokeModel(drawing),strokeBinary=await new GLTFExporter().parseAsync(strokes.root,{binary:true,animations:strokes.clips,trs:true});
 const restored=await new GLTFLoader().parseAsync(strokeBinary,'');assert.equal(restored.animations.length,1);assert.equal(restored.scene.children[0].userData.genre3dDrawing.layers.length,2);
 const sm=new THREE.AnimationMixer(restored.scene);sm.clipAction(restored.animations[0]).play();sm.setTime(.5);assert.equal(restored.scene.getObjectByName('Segunda_1').scale.x,0);sm.setTime(1.01);assert.equal(restored.scene.getObjectByName('Segunda_1').scale.x,1);
 assert.throws(()=>strokeModel({...defaultDrawing,strokes:[]}));
 const lathe=profileModel({...defaultProfile,kind:'revolve',angle:180});assert(lathe.children[0].geometry.attributes.position.count>0);
 console.log('PASS: signed multi-turn rotation on XYZ plus original motion survives GLB roundtrip; source unchanged; extruded hole remains open; profile parameters retained; partial revolution generated; layered strokes and STEP appearance survive GLB roundtrip');
}finally{paths.forEach(p=>unlinkSync(p))}
