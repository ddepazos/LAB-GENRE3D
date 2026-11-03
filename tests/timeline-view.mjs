import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';

const target=new URL('../.timeline-view-test.mjs',import.meta.url);
const source=readFileSync(new URL('../src/timelineView.ts',import.meta.url),'utf8');
writeFileSync(target,ts.transpileModule(source,{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
}).outputText);
try{
  const {timelineView}=await import(target.href);
  const initial=timelineView({hasAsset:false,rigKeyframes:[],clipCount:0,clipDuration:0,rigFrame:0,clipTime:0});
  assert.deepEqual([initial.mode,initial.playingAvailable,initial.frame],['empty',false,0]);

  const clip=timelineView({hasAsset:true,rigKeyframes:[],clipCount:1,clipDuration:2.5,rigFrame:0,clipTime:1.25});
  assert.equal(clip.mode,'clip');
  assert.equal(clip.maxFrame,75);
  assert.equal(clip.frame,38);
  assert.equal(clip.playingAvailable,true);
  assert.equal(clip.label,'CLIP GLB');

  const rig=timelineView({hasAsset:true,rigKeyframes:[0,60],clipCount:2,clipDuration:5,rigFrame:30,clipTime:1});
  assert.equal(rig.mode,'rig');
  assert.equal(rig.frame,30);
  assert.equal(rig.maxFrame,60);

  const seekClamped=timelineView({hasAsset:true,rigKeyframes:[],clipCount:1,clipDuration:1,rigFrame:0,clipTime:99});
  assert.equal(seekClamped.frame,30);

  const noKeys=timelineView({hasAsset:true,rigKeyframes:[0],clipCount:0,clipDuration:0,rigFrame:0,clipTime:0});
  assert.equal(noKeys.mode,'empty');
  assert.equal(noKeys.playingAvailable,false);

  const main=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');
  assert(main.includes("if(selectedTimeline.mode==='clip')seekImported(target/30)"), 'GLB clip scrubbing must invoke imported clip seek');
  assert(main.includes("setImportedPlaybackEnabled(true);setImportedPlaying(p=>!p)"), 'Bottom timeline must start imported playback');
  assert(main.includes('value={selectedTimeline.frame}'), 'Scrub cursor must follow active clip or rig');
  assert(main.includes('max={selectedTimeline.maxFrame}'), 'Max must match clip duration or rig keyframes');
  assert(main.includes('aria-label="Tiempo de animación seleccionado"'));
  console.log('PASS: timeline shows imported clip, seeks in seconds, follows playback, selects rig only with authored keys, and clamps bounds');
}finally{unlinkSync(target)}
