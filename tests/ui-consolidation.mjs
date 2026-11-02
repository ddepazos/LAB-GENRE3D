import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
const files=[];
async function load(name){const path=new URL('../.ui-'+name+'.mjs',import.meta.url);files.push(path);let code=ts.transpileModule(readFileSync(new URL('../src/'+name+'.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;code=code.replace("'./materialPresets'","'./.ui-materialPresets.mjs'").replace('"./HeadSurface"','"./.ui-HeadSurface.mjs"');writeFileSync(path,code);return import(path.href)}
try{
 // Use real Three textures with a tiny canvas substitute, avoiding a WebGL dependency.
 globalThis.document={createElement:()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{}})})};
 const mapsPath=new URL('../.ui-materialPresets.mjs',import.meta.url);files.push(mapsPath);writeFileSync(mapsPath,ts.transpileModule(readFileSync(new URL('../src/materialPresets.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {PbrPanel}=await load('PbrPanel');let applied,resolveApply;let tree;
 await act(async()=>{tree=TestRenderer.create(React.createElement(PbrPanel,{disabled:false,onApply:async material=>{applied=material;await new Promise(resolve=>resolveApply=resolve)}}))});
 const field=label=>tree.root.findAllByType('label').find(n=>n.children.some(c=>typeof c==='string' && c.includes(label)))?.findByType('input');
 await act(async()=>tree.root.findByProps({'aria-label':'Preset PBR'}).props.onChange({target:{value:'metal'}}));
 assert.equal(field('Rugosidad PBR').props.value,.3);assert.equal(field('Metalicidad PBR').props.value,.85);
 await act(async()=>tree.root.findByType('button').props.onClick());
 assert.equal(applied.color.getHexString(),'ffffff');assert(applied.map);assert(applied.normalMap);assert.equal(tree.root.findByType('button').props.disabled,true);
 await act(async()=>resolveApply());assert.equal(tree.root.findByType('button').props.disabled,false);
 applied=undefined;await act(async()=>field('Repetición UV').props.onChange({target:{value:'0'}}));await act(async()=>tree.root.findByType('button').props.onClick());assert.equal(applied,undefined);assert.match(tree.root.findByProps({role:'status'}).children.join(''),/Repetición UV/);
 await load('HeadSurface');const {facePresets}=await load('HeadDetail');assert(facePresets.Sonrisa.smile>0);assert.equal(facePresets.Neutra.smile,0);
 const {TimelinePanel}=await load('TimelinePanel');const pose={position:[1,2,3],rotation:[0,0,0],scale:[1,1,1]};let timeline;
 await act(async()=>{timeline=TestRenderer.create(React.createElement(TimelinePanel,{key:'object-1',disabled:false,onPose:()=>pose,onRead:()=>undefined,onBuild:async()=>{}}))});
 await act(async()=>timeline.root.findAllByType('button')[0].props.onClick());assert.equal(timeline.root.findAllByType('input').length,2);
 await act(async()=>timeline.update(React.createElement(TimelinePanel,{key:'object-2',disabled:false,onPose:()=>pose,onRead:()=>undefined,onBuild:async()=>{}})));assert.equal(timeline.root.findAllByType('input').length,1);
 console.log('PASS: PBR preset physical values, single color tint, busy lock, invalid UV rejection; smile preset and isolated object timeline drafts');
}finally{files.forEach(unlinkSync)}
