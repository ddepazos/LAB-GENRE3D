import React from 'react';
import * as THREE from 'three';
import {SceneNumericControl} from './SceneNumericControl';
import type {SceneLight} from './sceneObjects';

type Props={light:SceneLight;revision:number;onChange:()=>void};
export function LightPanel({light,revision,onChange}:Props){
 const field=(label:string,value:number,write:(n:number)=>void,min?:number,max?:number)=><SceneNumericControl key={light.uuid+revision+label} label={label} value={value} min={min} max={max} onCommit={n=>{write(n);onChange()}}/>;
 const vec=(label:string,v:THREE.Vector3)=>(['x','y','z'] as const).map(axis=>field(label+' '+axis.toUpperCase(),v[axis],n=>{v[axis]=n}));
 const target=light instanceof THREE.DirectionalLight||light instanceof THREE.SpotLight?light.target:null;
 return <section aria-label="Propiedades de luz"><h3>LUZ · {light.name}</h3><label>Color<input type="color" value={'#'+light.color.getHexString()} onChange={e=>{light.color.set(e.currentTarget.value);onChange()}}/></label>{field('Intensidad',light.intensity,n=>{light.intensity=n},0)}{!(light instanceof THREE.AmbientLight)&&vec('Posición',light.position)}{(light instanceof THREE.PointLight||light instanceof THREE.SpotLight)&&<>{field('Distancia',light.distance,n=>{light.distance=n},0)}{field('Decaimiento',light.decay,n=>{light.decay=n},0)}</>}{light instanceof THREE.SpotLight&&<>{field('Ángulo (grados)',THREE.MathUtils.radToDeg(light.angle),n=>{light.angle=THREE.MathUtils.degToRad(n)},0.1,89)}{field('Penumbra',light.penumbra,n=>{light.penumbra=n},0,1)}</>}{target&&vec('Objetivo',target.position)}{light instanceof THREE.AmbientLight&&<small>La luz ambiental no se exporta mediante KHR_lights_punctual.</small>}</section>;
}
