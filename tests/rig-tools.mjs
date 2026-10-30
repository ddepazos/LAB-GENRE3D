import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
const targets=[];
for(const name of ['meshData','rigTools']){const target=new URL('../.rigtools-'+name+'.mjs',import.meta.url);targets.push(target);writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace("'./meshData'","'./.rigtools-meshData.mjs'"))}
try{
 const {rigMeshCopy,paintWeights,solveIK}=await import(targets[1].href);const original=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,3,8,12),new THREE.MeshStandardMaterial());original.name='Test';
 const root=rigMeshCopy(original,3,'y'),mesh=root.children[0];assert.equal(mesh.skeleton.bones.length,3);assert(!original.isSkinnedMesh);assert.equal(original.children.length,0);
 const w=mesh.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)assert(Math.abs(w.getX(i)+w.getY(i)-1)<1e-6);
 const point=mesh.getVertexPosition(0,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),before=mesh.geometry;
 assert(paintWeights(mesh,0,point,1,.5)>0);assert.notEqual(mesh.geometry,before);
 const weights=mesh.geometry.attributes.skinWeight;for(let i=0;i<weights.count;i++)assert(Math.abs([0,1,2,3].reduce((s,j)=>s+weights.getComponent(i,j),0)-1)<1e-5);
 const end=mesh.skeleton.bones[2],target=new THREE.Vector3(1,0,0);const initial=end.getWorldPosition(new THREE.Vector3()).distanceTo(target),distance=solveIK(end,target,40);assert(distance<initial);assert(distance<.01);
 assert.throws(()=>rigMeshCopy(original,1,'y'));
 console.log('PASS: isolated rig copy, normalized automatic/painted weights and CCD reachable target');
}finally{targets.forEach(unlinkSync)}
