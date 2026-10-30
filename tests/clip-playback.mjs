import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';
const target=new URL('../.playback-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/clipPlayback.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
try{
 const {createClipPlayback}=await import(target.href);const root=new THREE.Group(),bone=new THREE.Bone();root.add(bone);
 const clip=new THREE.AnimationClip('Test',1,[new THREE.VectorKeyframeTrack(bone.uuid+'.position',[0,1],[0,0,0,2,0,0])]);
 const p=createClipPlayback(root,clip);p.loop(true);p.seek(.5);assert.equal(bone.position.x,1);p.seek(1);assert.equal(bone.position.x,2);
 p.seek(0);p.step(.1,.5);assert(Math.abs(p.time-.05)<1e-6);
 p.loop(false);p.seek(.95);assert(p.step(.1).ended);assert.equal(p.time,1);assert.equal(bone.position.x,2);
 p.seek(0);assert.equal(bone.position.x,0);assert(!p.step(.1).ended);
 p.loop(true);p.seek(.95);assert(!p.step(.1).ended);assert(Math.abs(p.time-.05)<1e-6);
 p.seek(-10);assert.equal(p.time,0);p.seek(10);assert.equal(p.time,1);p.dispose();
 console.log('PASS: exact endpoint seeking, half speed, repeat wrap, non-loop stop, restart and range clamping');
}finally{unlinkSync(target)}
