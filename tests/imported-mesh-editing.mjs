import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
globalThis.ProgressEvent=class{constructor(type,init){this.type=type;Object.assign(this,init)}};
const files=['meshData.ts','EditableMesh.tsx','projectPersistence.ts'];const targets=[];
for(const file of files){const stem=file.replace(/\.tsx?$/,''),target=new URL('../.static-'+stem+'.mjs',import.meta.url);targets.push(target);const source=ts.transpileModule(readFileSync(new URL('../src/'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ['"]\.\/meshData['"]/g,"from './.static-meshData.mjs'");writeFileSync(target,source)}
try{
 const {geometryData,geometryFromData,setMeshData,meshParts,meshEditReason,bakeEditableCopy}=await import(targets[0].href);
 const {faceOperation,bevelEdge}=await import(targets[1].href);
 const {loadAsset,createProject,openProject}=await import(targets[2].href);
 const source=new THREE.BoxGeometry(1,1,1);source.setAttribute('color',new THREE.Uint8BufferAttribute(new Uint8Array(source.attributes.position.count*3).fill(64),3,true));source.setAttribute('uv1',source.attributes.uv.clone());
 const data=geometryData(source);assert(Math.abs(data.attributes.color.values[0]-64/255)<1e-8);assert(data.groups.length);
 for(const output of [faceOperation(data,0,.4),faceOperation(data,0,.2,true)]){assert.equal(output.attributes.color.values.length,output.positions.length);assert.equal(output.attributes.uv1.values.length,output.uvs.length);assert.equal(output.groups.reduce((sum,g)=>sum+g.count,0),output.positions.length/3);assert.equal(geometryFromData(output).attributes.uv1.count,output.positions.length/3)}
 let edge;for(let i=0;i<data.positions.length/3&&!edge;i++)for(let j=i+1;j<data.positions.length/3;j++){try{const result=bevelEdge(data,[i,j],.1);assert.equal(result.attributes.color.values.length,result.positions.length);assert.equal(result.attributes.uv1.values.length,result.uvs.length);assert(result.attributes.color.values.every(Number.isFinite));edge=[i,j];break}catch{}}
 assert(edge,'bevel with color/UV/material attributes');
 const root=new THREE.Group(),nested=new THREE.Group();nested.position.set(2,1,-1);nested.rotation.z=.3;nested.scale.set(2,1,.5);root.add(nested);
 const first=new THREE.Mesh(source,new THREE.MeshStandardMaterial({color:'#22cc88',vertexColors:true}));first.name='Panel_A';nested.add(first);
 const second=new THREE.Mesh(source,new THREE.MeshStandardMaterial({color:'#aa8844',vertexColors:true}));second.name='Panel_B';second.position.x=3;root.add(second);root.updateMatrixWorld(true);
 const binary=await new GLTFExporter().parseAsync(root,{binary:true}),asset=await loadAsset(binary,'dos-paneles.glb',7),parts=meshParts(asset.object);assert.equal(parts.length,2);
 const a=parts.find(p=>p.label==='Panel_A').mesh,b=parts.find(p=>p.label==='Panel_B').mesh;assert.equal(meshEditReason(a),null);
 const originalOther=geometryData(b.geometry),material=a.material,originalA=geometryData(a.geometry);
 const edit=faceOperation(originalA,0,.4);setMeshData(a,edit);assert.equal(a.material,material);assert.deepEqual(geometryData(b.geometry),originalOther);assert.equal(a.geometry.userData.genre3dEdited,true);
 // A portal used for editing must not become part of the saved source hierarchy.
 const guide=new THREE.Group();guide.userData.editorOnly=true;guide.add(new THREE.Mesh(new THREE.SphereGeometry()));a.add(guide);assert.equal(meshParts(asset.object).length,2);
 const editor={frame:0,showGrid:true,transparent:false,rigLoop:true,timelineOpen:true,selected:null,selectedAsset:7};
 const file=createProject([], [asset],editor),restored=await openProject(file),restoredParts=meshParts(restored.assets[0].object),restoredA=restoredParts.find(p=>p.label==='Panel_A').mesh;
 assert.deepEqual(geometryData(restoredA.geometry),geometryData(a.geometry));assert.deepEqual(geometryData(restoredParts.find(p=>p.label==='Panel_B').mesh.geometry),originalOther);assert.equal(restored.assets[0].sourceGlb,asset.sourceGlb);assert.equal(restoredA.children.length,0);
 assert(restoredA.matrixWorld.equals(a.matrixWorld),'local edit keeps nested transforms');
 setMeshData(a,originalA);const undone=geometryData(a.geometry);assert.deepEqual(undone.positions,originalA.positions);assert.deepEqual(undone.uvs,originalA.uvs);assert(undone.attributes.color.values.every((value,i)=>Math.abs(value-originalA.attributes.color.values[i])<1e-6),'undo restores colors within Float32 precision');
 const skinned=new THREE.SkinnedMesh(source,new THREE.MeshStandardMaterial());assert.match(meshEditReason(skinned),/pesos/);assert.throws(()=>setMeshData(skinned,data),/pesos/);
 const morphed=new THREE.Mesh(source.clone(),new THREE.MeshStandardMaterial());morphed.geometry.morphAttributes.position=[morphed.geometry.attributes.position.clone()];assert.match(meshEditReason(morphed),/morph/);assert.throws(()=>setMeshData(morphed,data),/morph/);
  const rigGeometry=source.clone(),n=rigGeometry.attributes.position.count;
 rigGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Uint16Array(n*4),4));rigGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Array.from({length:n},()=>[1,0,0,0]).flat(),4));
 const rig=new THREE.SkinnedMesh(rigGeometry,new THREE.MeshStandardMaterial()),bone=new THREE.Bone();rig.add(bone);rig.bind(new THREE.Skeleton([bone]));bone.position.y=.5;rig.position.x=2;rig.scale.set(2,1,1);rig.updateMatrixWorld(true);rig.skeleton.update();
 const expected=rig.getVertexPosition(0,new THREE.Vector3()).applyMatrix4(rig.matrixWorld),baked=bakeEditableCopy(rig);assert.equal(meshEditReason(baked),null);assert(!baked.isSkinnedMesh);assert.equal(baked.children.length,0);assert(baked.getVertexPosition(0,new THREE.Vector3()).applyMatrix4(baked.matrixWorld).distanceTo(expected)<1e-6);assert.equal(rig.skeleton.bones[0],bone);assert.equal(rig.geometry,rigGeometry);assert.equal(bone.position.y,.5);
 const morphTarget=morphed.geometry.morphAttributes.position[0];for(let i=0;i<morphTarget.count;i++)morphTarget.setX(i,morphTarget.getX(i)+1);morphed.updateMorphTargets();morphed.morphTargetInfluences[0]=.6;const bakedMorph=bakeEditableCopy(morphed);assert.equal(meshEditReason(bakedMorph),null);assert(Math.abs(bakedMorph.geometry.attributes.position.getX(0)-morphed.getVertexPosition(0,new THREE.Vector3()).x)<1e-6);assert.equal(morphed.morphTargetInfluences[0],.6);
 const invalid=JSON.parse(await file.text());const node=invalid.assets[0].nodes.find(n=>n.geometry);node.geometry.attributes.color.values.pop();await assert.rejects(()=>openProject(new Blob([JSON.stringify(invalid)])),/Atributo incompleto/);
 console.log('PASS: GLB submesh independence, nested transforms, extrusion/bevel with normalized colors and secondary UVs, material groups, undo, project overrides, portal exclusion rig/morph guards and static copies of posed skinned/morph meshes');
}finally{for(const target of targets)unlinkSync(target)}
