import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import * as THREE from 'three';

const target=new URL('../.capture-export-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(readFileSync(new URL('../src/captureExport.ts',import.meta.url),'utf8'),{
 compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText);

try{
 const {captureDimensions,framesForDuration,frameExportCamera,CAPTURE_MAX_PIXELS}=await import(target.href);
 assert.deepEqual(captureDimensions(3840,'landscape'),{width:3840,height:2160});
 assert.deepEqual(captureDimensions(3840,'portrait'),{width:2160,height:3840});
 assert.deepEqual(captureDimensions(2048,'landscape'),{width:2048,height:1152});
 assert.deepEqual(captureDimensions(2048,'square'),{width:2048,height:2048});
 assert.throws(()=>captureDimensions(3840,'square'),/cuadrado 4K|cuadrado 4k/i);
 assert.equal(3840*2160,CAPTURE_MAX_PIXELS);
 assert.equal(framesForDuration(5,30),150);
 assert.equal(framesForDuration(2.5,60),150);
 assert.equal(framesForDuration(1,24),24);
 assert.equal(framesForDuration(40,30),900);
 assert.throws(()=>framesForDuration(0,30),/Duración/);

 const cam=new THREE.PerspectiveCamera(48,16/9,.1,500);
 cam.position.set(5,4,7);cam.lookAt(0,0,0);cam.updateMatrixWorld();
 const bounds=new THREE.Box3(new THREE.Vector3(-1,-2,-1),new THREE.Vector3(1,2,1));
 const originalCam=cam.clone();
 frameExportCamera(cam,bounds);
 const center=bounds.getCenter(new THREE.Vector3());
 const direction=cam.getWorldDirection(new THREE.Vector3());
 assert(direction.dot(center.clone().sub(cam.position).normalize())>.999);
 assert(cam.near>0&&cam.far>cam.near);
 assert(originalCam.position.distanceTo(cam.position)>0);
 const corner=new THREE.Vector3(1,2,1).project(cam);
 assert(Math.abs(corner.x)<=1&&Math.abs(corner.y)<=1,'Auto frame must contain model in camera');
 
 const alpha=readFileSync(new URL('../src/AlphaCapture.tsx',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
 assert(alpha.includes('samples,depthBuffer:true'));
 assert(main.includes('Usar duración completa del clip seleccionado'));
 assert(main.includes('setCaptureFrames(framesForDuration(selectedClipDuration,captureFps))'));
 assert(main.includes('Autoencuadrar movimiento en la exportación'));
 assert(main.includes('captureDimensions(captureSize,captureAspect)'));
 console.log('PASS: 4K UHD orientation, seconds-to-frames, GPU MSAA, alpha camera auto frame, full clip duration UI');
}finally{unlinkSync(target)}
