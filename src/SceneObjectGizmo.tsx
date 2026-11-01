import React from 'react';
import * as THREE from 'three';
import {TransformControls} from '@react-three/drei';
import type {SceneCamera} from './sceneObjects';

export type SceneTransformMode='translate'|'rotate'|'scale';
export function SceneObjectGizmo({node,mode,onChange}:{node:THREE.Object3D|null;mode:SceneTransformMode;onChange:()=>void}){
 if(!node)return null;
 // Do not scale lights or cameras: glTF light properties and camera frustum do not use object scale.
 const safeMode=mode==='scale'?'translate':mode;
 return <TransformControls object={node} mode={safeMode} onObjectChange={onChange}/>;
}
