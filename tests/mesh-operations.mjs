import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
const target=new URL('../.mesh-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/EditableMesh.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try {
 const {geometryData,faceOperation,bevelEdge}=await import(target.href);
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
 const v=i=>new THREE.Vector3().fromArray(source.positions,i*3);
 let edge;for(let i=0;i<source.positions.length/3;i++)for(let j=i+1;j<source.positions.length/3;j++)if(Math.abs(v(i).distanceTo(v(j))-1.5)<1e-6){try{bevelEdge(source,[i,j],.1);edge=[i,j];break}catch{}}
 assert(edge,'find a supporting cube edge');
 const beveled=bevelEdge(source,edge,.1);
 assert(beveled.positions.every(Number.isFinite));assert.equal(beveled.uvs.length,beveled.positions.length/3*2);
 // Every geometric edge must occur twice: chamfer remains watertight.
 const edges=new Map();const key=p=>p.map(x=>x.toFixed(5)).join(',');
 for(let f=0;f<beveled.positions.length;f+=9){const pts=[0,3,6].map(i=>key(beveled.positions.slice(f+i,f+i+3)));for(let i=0;i<3;i++){const k=[pts[i],pts[(i+1)%3]].sort().join('|');edges.set(k,(edges.get(k)??0)+1)}}
 assert([...edges.values()].every(n=>n===2),'bevel must be closed without T junctions');
 const volume=p=>{let total=0;for(let i=0;i<p.length;i+=9){const a=new THREE.Vector3().fromArray(p,i),b=new THREE.Vector3().fromArray(p,i+3),c=new THREE.Vector3().fromArray(p,i+6);total+=a.dot(b.cross(c))/6}return total};
 assert(volume(beveled.positions)>0);assert(volume(beveled.positions)<volume(source.positions));
 assert.throws(()=>bevelEdge(source,edge,5));assert.throws(()=>bevelEdge(source,edge,-.1));
 assert.equal(faceOperation(source,0,.2).uvs.length,faceOperation(source,0,.2).positions.length/3*2);
 console.log('PASS: supporting-edge bevel closure, volume, UVs and invalid width');
 console.log('PASS: primitive conversion, extrusion, inset, face bevel, immutability, normals and invalid selection');
}finally{unlinkSync(target)}
