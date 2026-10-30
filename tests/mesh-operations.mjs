import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
const target=new URL('../.mesh-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/EditableMesh.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try {
 const {geometryData,faceOperation}=await import(target.href);
 const source=geometryData(new THREE.BoxGeometry(1.5,1.5,1.5));
 assert.equal(source.positions.length,108);
 for(const inset of [false,true]){
  const result=faceOperation(source,0,.2,inset);
  assert.equal(result.positions.length,162);
  assert(result.positions.every(Number.isFinite));
  assert.equal(source.positions.length,108,'source is immutable');
  const g=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(result.positions,3));
  g.computeVertexNormals();assert(Array.from(g.getAttribute('normal').array).every(Number.isFinite));
 }
 const bevel=faceOperation(source,0,.2,true,true);
 assert.notDeepEqual(bevel,faceOperation(source,0,.2,true));
 assert.equal(faceOperation(source,-1,.2),source);
 assert.equal(faceOperation(source,999,.2),source);
 assert.equal(faceOperation(source,0,NaN),source);
 console.log('PASS: primitive conversion, extrusion, inset, face bevel, immutability, normals and invalid selection');
}finally{unlinkSync(target)}
