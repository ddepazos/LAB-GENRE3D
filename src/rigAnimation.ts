import {bakeLayerClip} from './animationLayers';
import * as THREE from 'three';
import type {ImportedAsset} from './projectPersistence';

/** Export the same quaternion/linear interpolation used by the rig timeline. */
export function rigAnimationClip(asset:ImportedAsset,fps=30):THREE.AnimationClip|null {
  if(!Number.isFinite(fps)||fps<=0)throw new Error('FPS inválidos');
  const keys=[...asset.rigKeys].sort((a,b)=>a.frame-b.frame);
  if(keys.length<2)return null;
  const times=keys.map(k=>k.frame/fps);
  const tracks:THREE.KeyframeTrack[]=[];
  asset.bones.forEach((bone,index)=>{
    const values=keys.flatMap(k=>{
      const r=k.bones[index]??[0,0,0];
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0],r[1],r[2])).toArray();
    });
    tracks.push(new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',times,values));
  });
  const meshes=[...new Set(asset.morphs.map(m=>m.mesh))];
  meshes.forEach(mesh=>{
    const count=mesh.morphTargetInfluences?.length??0;
    if(!count)return;
    const values=keys.flatMap(k=>Array.from({length:count},(_,index)=>{
      const control=asset.morphs.findIndex(m=>m.mesh===mesh&&m.index===index);
      return control<0?(mesh.morphTargetInfluences?.[index]??0):(k.morphs[control]??0);
    }));
    tracks.push(new THREE.NumberKeyframeTrack(mesh.uuid+'.morphTargetInfluences',times,values));
  });
  return tracks.length?new THREE.AnimationClip(asset.name+' · rig LAB',-1,tracks):null;
}

/** Rebind imported track targets to UUIDs so equal names in other GLBs cannot collide. */
export function assetAnimationClips(asset:ImportedAsset):THREE.AnimationClip[]{
  const authored=rigAnimationClip(asset);
  if(authored)return [authored];
  if(asset.layers){const clip=bakeLayerClip(asset.object,asset.clips,asset.layers);return clip?[clip]:[]}
  return asset.clips.map(source=>{
    const clip=source.clone();clip.name=asset.name+' · '+source.name;
    clip.tracks.forEach(track=>{
      const parsed=THREE.PropertyBinding.parseTrackName(track.name);
      const target=THREE.PropertyBinding.findNode(asset.object,parsed.nodeName);
      if(!(target instanceof THREE.Object3D)||parsed.objectName)throw new Error('No se pudo vincular la pista '+track.name);
      track.name=target.uuid+'.'+parsed.propertyName+(parsed.propertyIndex!==undefined?'['+parsed.propertyIndex+']':'');
    });
    return clip;
  });
}
