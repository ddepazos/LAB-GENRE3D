import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/main.tsx',import.meta.url),'utf8');

/**
 * The three playback modes must be mutually exclusive:
 * - play-all mixers
 * - selected GLB clip
 * - authored rig pose player
 * These guards prevent multiple mixers/pose writers targeting one skeleton.
 */
const guards=[
  ['selected clip play deactivates play-all', 'setRigPlaying(false);setPlayAll(false);setImportedPlaybackEnabled(true);setImportedPlaying(p=>!p)'],
  ['clip seek deactivates play-all','const seekImported=(time:number)=>{setPlayAll(false);setImportedPlaybackEnabled(true);'],
  ['rig play deactivates clips and play-all', "else if(selectedTimeline.mode==='rig'){\n      setImportedPlaying(false);setPlayAll(false);setRigPlaying(p=>!p);"],
  ['rig seek deactivates play-all', 'const seekRig=(nextFrame:number)=>{\n    setPlayAll(false);setImportedPlaying(false);'],
  ['rig keyframe capture deactivates play-all','const captureRig=()=>{\n    if(!currentAsset)return;\n    setPlayAll(false);setImportedPlaying(false);'],
  ['play-all menu deactivates other players','setImportedPlaying(false);setRigPlaying(false);setPlayAll(v=>!v);setMenuOpen(null)'],
  ['selected clip is not mounted during play-all', '!playAll&&importedPlaybackEnabled&&currentAsset']
];
for(const [name,needle] of guards){
 assert(source.includes(needle), 'Missing playback guard: '+name);
}
console.log('PASS: playback mode exclusivity wiring for selected GLB clips, all clips and rig timeline');
