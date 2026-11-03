/** Derive the visible bottom timeline from the animation currently playable.
 * Authored rig keys have precedence; otherwise scrub the selected GLB clip.
 * Keep rig frame and imported clip seconds separate to avoid feedback loops.
 */
export type TimelineMode='rig'|'clip'|'empty';
export type TimelineView={mode:TimelineMode;frame:number;maxFrame:number;playingAvailable:boolean;label:string};
export function timelineView({
  hasAsset,rigKeyframes,clipCount,clipDuration,rigFrame,clipTime,fps=30
}:{
  hasAsset:boolean;rigKeyframes:number[];clipCount:number;clipDuration:number;
  rigFrame:number;clipTime:number;fps?:number;
}):TimelineView{
  const rate=Number.isFinite(fps)&&fps>0?fps:30;
  if(!hasAsset)return {mode:'empty',frame:0,maxFrame:240,playingAvailable:false,label:'SELECCIONA GLB'};
  if(rigKeyframes.length>=2){
    const maxFrame=Math.max(1,...rigKeyframes.filter(n=>Number.isFinite(n)&&n>=0));
    return {mode:'rig',frame:Math.max(0,Math.min(maxFrame,Math.round(Number.isFinite(rigFrame)?rigFrame:0))),maxFrame,playingAvailable:true,label:'RIG LAB'};
  }
  if(clipCount>0&&Number.isFinite(clipDuration)&&clipDuration>0){
    const maxFrame=Math.max(1,Math.ceil(clipDuration*rate));
    return {mode:'clip',frame:Math.max(0,Math.min(maxFrame,Math.round((Number.isFinite(clipTime)?clipTime:0)*rate))),maxFrame,playingAvailable:true,label:'CLIP GLB'};
  }
  return {mode:'empty',frame:0,maxFrame:240,playingAvailable:false,label:rigKeyframes.length?'GUARDA OTRA POSE':'SIN ANIMACIÓN'};
}
