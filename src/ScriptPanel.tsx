import {useEffect,useState} from 'react';
import Editor,{loader} from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import ScriptWorker from './script.worker?worker';
const env=self as typeof self&{MonacoEnvironment?:{getWorker:()=>Worker}};env.MonacoEnvironment={getWorker:()=>new EditorWorker()};loader.config({monaco});
export default function ScriptPanel({onCommands,disabled}:{onCommands:(commands:unknown[])=>void;disabled:boolean}){
 const [code,setCode]=useState(()=>{try{return localStorage.getItem('genre3d-script')??'api.primitive("torus", "#d69a48", [0, 1, 0]);\n// api.rotateBone(0, [0, 0, 30]); // grados XYZ'}catch{return 'api.primitive("box");'}}),[notice,setNotice]=useState('');
 useEffect(()=>{try{localStorage.setItem('genre3d-script',code)}catch{}},[code]);
 const run=()=>{const worker=new ScriptWorker();const timeout=setTimeout(()=>{worker.terminate();setNotice('Script detenido: límite de dos segundos')},2000);worker.onmessage=e=>{clearTimeout(timeout);worker.terminate();if(e.data.error){setNotice(e.data.error);return}try{onCommands(e.data.commands);setNotice('Script aplicado: '+e.data.commands.length+' instrucciones')}catch(error){setNotice(String(error))}};worker.onerror=e=>{clearTimeout(timeout);worker.terminate();setNotice(e.message)};worker.postMessage({code})};
 return <section><Editor height="240px" language="javascript" theme="vs-dark" value={code} onChange={value=>setCode(value??'')} options={{minimap:{enabled:false},fontSize:11,automaticLayout:true,wordWrap:'on'}}/><button disabled={disabled} onClick={run}>Ejecutar script JavaScript</button><small>API: primitive(forma, color, [x,y,z]); rotateBone(índice, [gradosX,Y,Z]). Hasta 32 instrucciones; se validan antes de aplicarlas. Código guardado en este navegador.</small><p role="status">{notice}</p></section>;
}
