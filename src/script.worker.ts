const workerScope=self as unknown as {onmessage:((e:MessageEvent)=>void)|null;postMessage:(value:unknown)=>void};
workerScope.onmessage=(event:MessageEvent<{code:string}>)=>{
 try{
  const commands:unknown[]=[];
  const push=(value:unknown)=>{if(commands.length>=32)throw new Error('Máximo 32 instrucciones');commands.push(value)};
  const api=Object.freeze({primitive:(shape='box',color='#a9b6ff',position=[0,1,0])=>push({kind:'primitive',shape,color,position}),rotateBone:(index:number,rotation:number[])=>push({kind:'bone',index,rotation})});
  new Function('api','"use strict";\n'+event.data.code)(api);
  workerScope.postMessage({commands});
 }catch(error){workerScope.postMessage({error:String(error)})}
};
export {};
