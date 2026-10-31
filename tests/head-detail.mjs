import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const tmp=[];
async function load(name,ext){const path=new URL('../.head-'+name+'.mjs',import.meta.url);tmp.push(path);writeFileSync(path,ts.transpileModule(readFileSync(new URL('../src/'+name+'.'+ext,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace("'./HeadSurface'","'./.head-HeadSurface.mjs'").replace('"./HeadSurface"','"./.head-HeadSurface.mjs"'));return import(path.href)}
try{
 await load('HeadSurface','tsx');const {default:Head,neutralFace,facePresets,faceMetrics}=await load('HeadDetail','tsx');const {bakeAnimation}=await load('bakeAnimation','ts');let view;
 await act(async()=>{view=Renderer.create(React.createElement(Head,{kind:'Humano',pose:neutralFace}))});
 const host=()=>view.root.findAll(n=>n.type==='group'||n.type==='mesh');const links=[];
 const apply=(o,p)=>{o.position.fromArray(p.position??[0,0,0]);o.rotation.set(...(p.rotation??[0,0,0]));o.scale.fromArray(p.scale??[1,1,1])};
 const childrenOf=n=>n.children.flatMap(c=>typeof c==='string'?[]:['mesh','group','primitive'].includes(c.type)?[c]:childrenOf(c));
 function build(n){const o=n.type==='mesh'?new THREE.Mesh():new THREE.Group();o.name=n.props.name??'';apply(o,n.props);links.push(o);if(o.isMesh){const g=n.children.find(c=>typeof c!=='string'&&typeof c.type==='string'&&c.type.endsWith('Geometry'));o.geometry=g.type==='coneGeometry'?new THREE.ConeGeometry(...g.props.args):new THREE.SphereGeometry(...g.props.args);o.material=n.props.material}childrenOf(n).forEach(c=>o.add(c.type==='primitive'?c.props.object:build(c)));return o}
 const root=build(host()[0]);assert(root.getObjectByName('Diente_superior_0').scale.y<.001);assert(root.getObjectByName('Cavidad_oral').scale.y<.005);assert(root.getObjectByName('Piel_cabeza_continua').isSkinnedMesh);assert(root.getObjectByName('Punta_nariz'));assert(root.getObjectByName('Parpado_superior'));assert(root.getObjectByName('Pupila'));assert.equal(links.filter(o=>o.name.startsWith('Labio_')).length,34);
 for(const pose of [...Object.values(facePresets),{...neutralFace,jaw:65,blink:100,smile:-100}]){assert(Object.values(faceMetrics(pose)).every(Number.isFinite));await act(async()=>view.update(React.createElement(Head,{kind:'Humano',pose})));assert.equal(host().length,links.length)}
 const clip=await bakeAnimation(root,'Rostro detallado',30,async frame=>{const t=frame/30;await act(async()=>view.update(React.createElement(Head,{kind:'Humano',pose:{...neutralFace,jaw:40*t,smile:75*t,blink:100*t,lipOpen:40*t}})));host().forEach((n,i)=>apply(links[i],n.props))});
 assert(clip.tracks.some(t=>t.name.includes(root.getObjectByName('Mandibula').uuid)));assert(clip.tracks.some(t=>t.name.includes(root.getObjectByName('Labio_superior_0').uuid)));
 const binary=await new GLTFExporter().parseAsync(root,{binary:true,animations:[clip],trs:true});const restored=await new GLTFLoader().parseAsync(binary,'');const mixer=new THREE.AnimationMixer(restored.scene);mixer.clipAction(restored.animations[0]).play();mixer.setTime(.5);assert(restored.scene.getObjectByName('Mandibula').rotation.x>.1);assert(restored.scene.getObjectByName('Mandibula_piel').rotation.x>.1);assert(restored.scene.getObjectByName('Mirada').scale.y<1);
 await act(async()=>view.unmount());console.log('PASS: stable detailed facial hierarchy, finite expression presets, 34 lip segments, jaw/lip/eyelid animation survives GLB roundtrip');
}finally{tmp.forEach(unlinkSync)}
