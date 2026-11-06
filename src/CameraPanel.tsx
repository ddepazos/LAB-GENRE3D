import React from 'react';
import * as THREE from 'three';
import {SceneNumericControl} from './SceneNumericControl';
import {updateSceneCameraProjection} from './sceneObjectOperations';
import type {SceneCamera} from './sceneObjects';

type Props={camera:SceneCamera;revision:number;onChange:()=>void;onActivate:(camera:SceneCamera)=>void;active:boolean;onAlign:()=>void;onAim:()=>void;canAim:boolean;onExit:()=>void};
export function CameraPanel({camera,revision,onChange,onActivate,active,onAlign,onAim,canAim,onExit}:Props){
 const field=(label:string,value:number,write:(n:number)=>void,min?:number,max?:number)=><SceneNumericControl key={camera.uuid+revision+label} label={label} value={value} min={min} max={max} onCommit={n=>{write(n);updateSceneCameraProjection(camera);onChange()}}/>;
 return <section aria-label="Propiedades de cámara"><h3>CÁMARA · {camera.name}</h3><p>{active?'Vista de esta cámara activa':'Vista del editor u otra cámara'}</p><button type="button" onClick={onAlign}>Alinear cámara con esta vista</button><button type="button" disabled={!canAim} onClick={onAim}>Apuntar al último objeto seleccionado</button><small>Selecciona primero un objeto y luego esta cámara. Izquierdo: orbitar · derecho: desplazar · rueda: acercar. Alinear copia exactamente la vista entre cámaras del mismo tipo.</small>{active&&<button type="button" onClick={onExit}>Volver a la vista del editor</button>}{camera instanceof THREE.PerspectiveCamera?field('FOV',camera.fov,n=>{camera.fov=n},1,179):field('Zoom',camera.zoom,n=>{camera.zoom=n},0.001)}{field('Near',camera.near,n=>{camera.near=Math.min(n,camera.far-0.001)},0.001)}{field('Far',camera.far,n=>{camera.far=Math.max(n,camera.near+0.001)},0.002)}{(['x','y','z'] as const).map(axis=>field('Posición '+axis.toUpperCase(),camera.position[axis],n=>{camera.position[axis]=n;camera.updateMatrixWorld(true)}))}<button type="button" onClick={()=>onActivate(camera)}>Ver desde esta cámara</button></section>;
}
