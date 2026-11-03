import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.()})}};
const target=new URL('../.giro-selected-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/turntable.ts',import.meta.url),'utf8'),{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText);
try {
 const {animatedCopy}=await import(target.href);
 const source=new THREE.Group();source.name='Personaje_fuente';
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshStandardMaterial({color:0xaebccd}));
 mesh.name='Modelo_original';source.add(mesh);
 const walk=new THREE.AnimationClip('Caminar',3.57,[new THREE.VectorKeyframeTrack(mesh.uuid+'.position',[0,3.57],[0,0,0,0.5,0,0])]);
 const {root,clip,preservedClips}=animatedCopy(source,[walk],{axis:'y',degrees:361,duration:4});
 assert.equal(source.children.length,1,'source is untouched');
 assert.equal(root.children.length,1,'no decorative orbit model');
 assert.equal(preservedClips.length,1,'original animation preserved');
 assert.equal(clip.tracks.length,2,'turn + original motion in first clip');
 const glb=await new GLTFExporter().parseAsync(root,{binary:true,animations:[clip,...preservedClips],trs:true});
 const loaded=await new GLTFLoader().parseAsync(glb,'');
 let meshCount=0;loaded.scene.traverse(n=>{if(n.isMesh)meshCount++});
 assert.equal(meshCount,1,'keep selected geometry without generating new decorative meshes');
 assert.equal(loaded.animations.length,2);
 assert.match(loaded.animations[0].name,/Giro_LAB_361_y_4s/,'LAB Studio uses first clip');
 assert.equal(loaded.animations[1].name,'Caminar');
 const pivot=loaded.scene.getObjectByName('Pivote_giro_LAB');
 assert(pivot,'animated pivot exported as editable GLB scene node');
 const mixer=new THREE.AnimationMixer(loaded.scene);
 const action=mixer.clipAction(loaded.animations[0]);
 action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
 let total=0,previous=0;
 for(let frame=0;frame<=120;frame++){
   mixer.setTime(frame/30);
   const q=pivot.quaternion,angle=2*Math.atan2(q.y,q.w);
   let delta=angle-previous;
   while(delta>Math.PI)delta-=2*Math.PI;
   while(delta< -Math.PI)delta+=2*Math.PI;
   total+=delta;previous=angle;
 }
 assert(Math.abs(THREE.MathUtils.radToDeg(total)-361)<.005,'full 361° turn survives raw GLB roundtrip');
 const sourceText=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
 assert(!sourceText.includes('createOrbitModel()'),'old decorative orbit action removed');
 assert(sourceText.includes('Aplicar giro a la selección · GLB editable'));
 assert(sourceText.includes('setAssets(prev=>prev.map(asset=>asset.id===targetAsset.id?next:asset))'),'replace, do not duplicate selected GLB');
 assert(sourceText.includes('setItems(prev=>prev.filter(value=>value.id!==item!.id))'),'convert selected native primitive in place');
 console.log('PASS: selected object 361° GLB first clip, original animation, one mesh, source intact, no standalone orbit');
}finally{unlinkSync(target)}
