import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
globalThis.ProgressEvent=class{constructor(type,init){this.type=type;Object.assign(this,init)}};
const target=new URL('../.project-test.mjs',import.meta.url);
const meshDataTarget=new URL('../.mesh-data-test.mjs',import.meta.url);
writeFileSync(meshDataTarget,ts.transpileModule(readFileSync(new URL('../src/meshData.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/projectPersistence.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from ['\"]\.\/meshData['\"]/g,"from './.mesh-data-test.mjs'"));
try{
 const {loadAsset,createProject,openProject}=await import(target.href);
 const geometry=new THREE.BoxGeometry();const count=geometry.attributes.position.count;
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(Array.from({length:count},()=>[1,0,0,0]).flat(),4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(Array.from({length:count},()=>[1,0,0,0]).flat(),4));
 const morph=geometry.attributes.position.clone();morph.name='Smile';for(let i=0;i<count;i++)morph.setX(i,morph.getX(i)+.2);geometry.morphAttributes.position=[morph];
 const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({color:'#dba957',roughness:.23,metalness:.4}));mesh.name='Character';
 const root=new THREE.Bone();root.name='Root';const jaw=new THREE.Bone();jaw.name='Jaw';jaw.position.y=.4;root.add(jaw);mesh.add(root);mesh.bind(new THREE.Skeleton([root,jaw]));mesh.updateMorphTargets();
 const scene=new THREE.Group();scene.add(mesh);scene.updateMatrixWorld(true);
 const clip=new THREE.AnimationClip('OriginalClip',1,[new THREE.QuaternionKeyframeTrack('Jaw.quaternion',[0,1],[0,0,0,1,0,0,Math.sin(.2),Math.cos(.2)])]);
 const binary=await new GLTFExporter().parseAsync(scene,{binary:true,animations:[clip]});
 const asset=await loadAsset(binary,'personaje.glb',111);assert.equal(asset.bones.length,2);assert.equal(asset.morphs.length,1);assert.equal(asset.clips[0].name,'OriginalClip');
 asset.morphs[0].mesh.geometry.attributes.skinWeight.setXYZW(0,.25,.75,0,0);asset.morphs[0].mesh.geometry.userData.genre3dWeightsEdited=true;
 const rest=structuredClone(asset.restRotations);asset.bones[1].rotation.z=.7;asset.morphs[0].mesh.morphTargetInfluences[0]=.65;asset.position=[2,3,4];asset.rotation=[.1,.2,.3];asset.scale=[2,1,.5];asset.visible=false;
 asset.rigKeys=[{frame:0,bones:rest.map(v=>[...v]),morphs:[0]},{frame:30,bones:asset.bones.map(b=>[b.rotation.x,b.rotation.y,b.rotation.z]),morphs:[.65]}];
 const item={id:1,name:'Malla editada',shape:'box',color:'#123456',visible:false,position:[1,2,3],rotation:[.2,0,0],scale:[1,2,1],preset:'metal',metalness:.7,geometry:{positions:[0,0,0,2,0,0,0,3,0],uvs:[0,0,1,0,0,1]}};
 const editor={frame:17,showGrid:false,transparent:true,rigLoop:false,timelineOpen:false,selected:null,selectedAsset:111};
 const face={jaw:40,brow:0,blink:10,gazeX:0,gazeY:0,smile:20,lipOpen:5,tongue:0,browLeft:0,browRight:0};
 const modules={hand:{pose:'Puño',angles:[65,90,90,90,90],keys:[{frame:0,value:[0,0,0,0,0]},{frame:30,value:[65,90,90,90,90]}]},character:{kind:'Robot',motion:'Saludar',speed:1.2,angles:Object.fromEntries(['Hombro izq.','Codo izq.','Muñeca izq.','Hombro der.','Codo der.','Muñeca der.','Cadera izq.','Rodilla izq.','Tobillo izq.','Cadera der.','Rodilla der.','Tobillo der.'].map(k=>[k,15])),face,facePreset:'Personalizada',faceFrame:20,faceKeys:[{frame:0,pose:{...face,jaw:0}},{frame:30,pose:face}]}};
 const blob=createProject([item],[asset],editor,modules);const reopened=await openProject(blob),a=reopened.assets[0];
 assert.deepEqual(reopened.items,[item]);assert.deepEqual(reopened.editor,editor);assert.deepEqual(reopened.modules,modules);
 assert.equal(a.sourceGlb,asset.sourceGlb,'retain original GLB bytes and embedded materials/clips');
 assert.equal(a.morphs[0].mesh.geometry.attributes.skinWeight.getX(0),.25);assert.equal(a.morphs[0].mesh.geometry.attributes.skinWeight.getY(0),.75);assert.deepEqual(a.restRotations,rest);assert.deepEqual(a.rigKeys,asset.rigKeys);assert.deepEqual(a.position,asset.position);assert.deepEqual(a.rotation,asset.rotation);assert.deepEqual(a.scale,asset.scale);assert.equal(a.visible,false);
 assert(Math.abs(a.bones[1].rotation.z-.7)<1e-6);assert.equal(a.morphs[0].mesh.morphTargetInfluences[0],.65);assert.equal(a.clips[0].name,'OriginalClip');
 assert.equal(a.morphs[0].mesh.material.color.getHexString(),asset.morphs[0].mesh.material.color.getHexString());
 const second=await openProject(createProject(reopened.items,reopened.assets,reopened.editor,reopened.modules));assert.equal(second.assets[0].sourceGlb,asset.sourceGlb);assert(Math.abs(second.assets[0].bones[1].rotation.z-.7)<1e-6);
 const old=await openProject(new Blob([JSON.stringify({application:'LAB GENRE3D',version:1,items:[item]})]));assert(old.legacy);assert.equal(old.assets.length,0);
 const valid=JSON.parse(await blob.text());assert.equal(valid.version,3);const v2=structuredClone(valid);v2.version=2;assert.equal((await openProject(new Blob([JSON.stringify(v2)]))).assets.length,1);
 for(const mutate of [v=>v.version=99,v=>v.items[0].position=[1,2],v=>v.items.push(v.items[0]),v=>v.assets[0].sourceGlb='not-base64!',v=>v.assets[0].nodes[0].path=[9999],v=>v.assets[0].rigKeys[0].bones=[],v=>v.editor.frame=900,v=>v.modules.hand.angles=[999,0,0,0,0]]){
  const broken=structuredClone(valid);mutate(broken);await assert.rejects(()=>openProject(new Blob([JSON.stringify(broken)])));
 }
 assert.deepEqual(asset.restRotations,rest,'failed imports never mutate original live asset');
 // Reject external references before GLTFLoader can request network resources.
 const json={asset:{version:'2.0'},buffers:[{byteLength:3,uri:'https://example.invalid/private.bin'}]};let raw=JSON.stringify(json);raw+=' '.repeat((4-raw.length%4)%4);const external=new ArrayBuffer(20+raw.length),view=new DataView(external);[0x46546c67,2,external.byteLength,raw.length,0x4e4f534a].forEach((v,i)=>view.setUint32(i*4,v,true));new Uint8Array(external,20).set(new TextEncoder().encode(raw));await assert.rejects(()=>loadAsset(external,'externo.glb',2),/enlaces externos/);
 console.log('PASS: v3 project roundtrip twice, edited geometry/UV/material, skinned rig, pose, morphs, original clips, rig keys, editor settings, hand/character/facial keyframes, legacy v1 and invalid files');
}finally{unlinkSync(target);unlinkSync(meshDataTarget)}
