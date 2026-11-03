import assert from 'node:assert/strict';
import ts from 'typescript';
import * as THREE from 'three';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
const target=new URL('../.fbx-import-test.mjs',import.meta.url);
const source=readFileSync(new URL('../src/fbxImport.ts',import.meta.url),'utf8');
writeFileSync(target,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
try{
 const {parseFbxFile,waitFbxTextures,shrinkFbxTextures,FBX_INPUT_LIMIT,FBX_GLB_LIMIT}=await import(target.href);
 assert.equal(FBX_INPUT_LIMIT,150*1024*1024);
 assert.equal(FBX_GLB_LIMIT,40*1024*1024);
 await assert.rejects(()=>parseFbxFile({name:'wrong.obj',size:1}),/\.fbx/i);
 await assert.rejects(()=>parseFbxFile({name:'too-large.fbx',size:FBX_INPUT_LIMIT+1}),/150 MB/i);
 await waitFbxTextures([]);
 assert.equal(shrinkFbxTextures([],2048),0);
 assert.throws(()=>shrinkFbxTextures([],0),/inválido/i);
 const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
 assert(main.includes('const importFbx=async(file?:File)=>'));
 assert(main.includes('const importModel=async(file?:File)=>'));
 assert(main.includes('await importModel(file);'));
 assert(main.includes('importModel(f)'));
 assert(main.includes("const supported=files.filter(file=>/\\.(glb|obj|fbx)$/i.test(file.name))"));
 assert(main.includes('La conversión FBX → GLB perdió el esqueleto'));
 assert(main.includes('La conversión FBX → GLB perdió los clips'));
 assert(!main.includes('LAB_HUMAN_ATLAS_INTEGRATION_V1'));
 assert(!main.includes('atlasManifest'));
 console.log('PASS: FBX routing, limits, asset roundtrip guards and no failed Human Atlas');
}finally{unlinkSync(target)}
