import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';

/** The canvas itself has the output aspect, so orbit and export share one frame. */
export function ExportViewport({aspect,children}:{aspect:number;children:ReactNode}){
 const host=useRef<HTMLDivElement>(null);
 const [size,setSize]=useState({width:1,height:1});
 useLayoutEffect(()=>{
  if(!host.current)return;
  const observer=new ResizeObserver(([entry])=>{
   const width=Math.max(1,Math.min(entry.contentRect.width,entry.contentRect.height*aspect));
   setSize({width,height:width/aspect});
  });
  observer.observe(host.current);return()=>observer.disconnect();
 },[aspect]);
 return <div ref={host} style={{position:'absolute',inset:0,display:'grid',placeItems:'center'}}><div style={{...size,position:'relative',outline:'1px solid #91a8d0'}}>{children}</div></div>;
}
