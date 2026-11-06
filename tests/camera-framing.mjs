import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
const file=new URL('../src/.camera-framing-test.mjs',import.meta.url);
writeFileSync(file,ts.transpileModule(readFileSync(new URL('../src/cameraFraming.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText);
try {
 const {copyCameraView}=await import(file.href);
 for(const aspect of [1,16/9,9/16]){
  const source=new THREE.PerspectiveCamera(48,aspect,.1,1000);source.position.set(5,4,7);source.lookAt(0,0,0);
  const parent=new THREE.Group();parent.position.set(2,1,-3);parent.rotation.y=.4;
  const target=new THREE.PerspectiveCamera();parent.add(target);copyCameraView(source,target);
  for(const point of [new THREE.Vector3(),new THREE.Vector3(1,2,-1)]){
   assert(point.clone().project(source).distanceTo(point.clone().project(target))<1e-8);
  }
 }
 const a=new THREE.OrthographicCamera(-4,4,3,-3,.1,1000);a.position.set(2,3,8);a.lookAt(0,0,0);a.zoom=2;a.updateProjectionMatrix();
 const b=new THREE.OrthographicCamera();copyCameraView(a,b);
 assert(new THREE.Vector3(1,1,0).project(a).distanceTo(new THREE.Vector3(1,1,0).project(b))<1e-8);
 console.log('PASS: perspective framing in 3 output aspects, transformed camera parent, orthographic zoom');
}finally{unlinkSync(file)}
