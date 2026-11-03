import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';

const target=new URL('../.streaming-zip-test.mjs',import.meta.url);
writeFileSync(target,ts.transpileModule(
  readFileSync(new URL('../src/streamingPngZip.ts',import.meta.url),'utf8'),
  {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}
).outputText);
try{
  const {StreamingPngZip}=await import(target.href);
  const chunks=[];
  let finished=false;
  const writer=new StreamingPngZip({
    async write(bytes){chunks.push(Buffer.from(bytes))},
    async close(){finished=true},
    async abort(){throw new Error('unexpected abort')}
  });
  const data=new TextEncoder().encode('abc');
  await writer.add('frame-00000.png',data);
  await writer.add('GENRE3D-sequence.json',new TextEncoder().encode('{"frames":150}'));
  await writer.close();
  assert(finished,'ZIP must close the output sink');
  const bytes=Buffer.concat(chunks);
  assert.equal(bytes.readUInt32LE(0),0x04034b50,'ZIP local file header');
  assert.equal(bytes.readUInt16LE(6),8,'ZIP streaming data-descriptor bit');
  const nameLen=bytes.readUInt16LE(26);
  assert.equal(bytes.subarray(30,30+nameLen).toString(),'frame-00000.png');
  const descAt=30+nameLen+data.length;
  assert.equal(bytes.readUInt32LE(descAt),0x08074b50);
  assert.equal(bytes.readUInt32LE(descAt+4),0x352441c2,'CRC32("abc")');
  assert.equal(bytes.readUInt32LE(descAt+8),3);
  assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50,'ZIP end record');
  assert.equal(bytes.readUInt16LE(bytes.length-12),2,'Two ZIP members');

  const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
  const capture=readFileSync(new URL('../src/AlphaCapture.tsx',import.meta.url),'utf8');
  assert(main.includes('await openStreamingZip(outputName)'));
  assert(main.includes('await zipWriter.add('));
  assert(main.includes('bounds.expandByObject(asset.object,false)'));
  assert(!main.includes('setFromObject(asset.object,true)'),'Precise per-vertex auto frame should be removed');
  assert(main.includes('[captureFrames,setCaptureFrames]=useState(150)'));
  assert(capture.includes('cache.target.dispose()'));
  assert(capture.includes('if(!cache||cache.width!==width||cache.height!==height)'));
  console.log('PASS: streaming ZIP headers/CRC/descriptor/EOCD, default 150, fast framing and reused 4K capture');
}finally{unlinkSync(target)}
