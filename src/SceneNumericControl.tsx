import React, {useEffect, useRef, useState} from 'react';

type Props = {label:string;value:number;onCommit:(value:number)=>void;min?:number;max?:number;step?:number};
export function SceneNumericControl({label,value,onCommit,min,max,step=0.1}:Props){
 const [draft,setDraft]=useState(String(value));
 const commitRef=useRef(onCommit);
 useEffect(()=>{commitRef.current=onCommit},[onCommit]);
 useEffect(()=>{setDraft(String(value))},[value]);
 useEffect(()=>{
  if(draft===String(value)||draft.trim()==='')return;
  const parsed=Number(draft);if(!Number.isFinite(parsed))return;
  const timer=window.setTimeout(()=>commitRef.current(Math.max(min??-Infinity,Math.min(max??Infinity,parsed))),180);
  return ()=>window.clearTimeout(timer);
 },[draft,value,min,max]);
 return <label>{label}<input type="number" value={draft} min={min} max={max} step={step} onChange={e=>setDraft(e.currentTarget.value)}/></label>;
}
