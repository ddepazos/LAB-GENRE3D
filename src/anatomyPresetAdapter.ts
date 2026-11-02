import * as THREE from 'three';
import {attachAnatomyReference, removeAnatomyReference, compareAnatomyBounds, type AnatomyPreset} from './anatomyPresetReference';

export type AtlasPart = {
  id: string;
  name?: string;
  label?: string;
  system?: string;
  bounds?: [[number, number, number], [number, number, number]];
};

export type PresetAtlasPlan = {
  preset: AnatomyPreset;
  terms: readonly string[];
  systems: readonly string[];
  maxParts: number;
};

/** Conservative candidate matching: users can review parts before adding them. */
export const PRESET_ATLAS_PLANS: Record<AnatomyPreset, PresetAtlasPlan> = {
  skull: {preset:'skull', terms:['skull','cranium','mandible','maxilla','tooth','teeth'], systems:['skeletal'], maxParts:60},
  head: {preset:'head', terms:['skull','cranium','mandible','maxilla','facial'], systems:['skeletal','muscular'], maxParts:80},
  hand: {preset:'hand', terms:['hand','carpal','metacarpal','phalanx','phalanges'], systems:['skeletal'], maxParts:70},
  arm: {preset:'arm', terms:['humerus','ulna','radius','elbow','scapula'], systems:['skeletal'], maxParts:40},
  figure: {preset:'figure', terms:[], systems:['skeletal'], maxParts:120},
};

const normalize = (v:unknown) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export function suggestAtlasParts(preset: AnatomyPreset, parts: readonly AtlasPart[]): AtlasPart[] {
  const plan = PRESET_ATLAS_PLANS[preset];
  return parts.filter(part => {
    const system = normalize(part.system);
    if (!plan.systems.some(s => system.includes(s))) return false;
    if (!plan.terms.length) return true;
    const label = normalize([part.name,part.label,part.id].join(' '));
    return plan.terms.some(term => label.includes(term));
  }).slice(0,plan.maxParts);
}

/**
 * Adds a visual overlay without changing the existing preset rig or mesh.
 * The atlas and the preset must already use compatible local coordinates.
 * Do not use this to auto-scale anatomy or transfer bone weights.
 */
export function previewPresetAnatomy(presetRoot: THREE.Object3D, atlasParts: readonly THREE.Object3D[]) {
  if (!atlasParts.length) throw new Error('Selecciona estructuras anatómicas antes de previsualizar.');
  const reference = attachAnatomyReference(presetRoot,atlasParts,{opacity:0.3,visible:true});
  const measurements = compareAnatomyBounds(presetRoot,reference);
  return {reference,measurements,source:reference.userData.source as string};
}

export function clearPresetAnatomyPreview(presetRoot: THREE.Object3D) {
  return removeAnatomyReference(presetRoot);
}

export function atlasSelectionBounds(parts: readonly THREE.Object3D[]) {
  const bounds = new THREE.Box3();
  for (const part of parts) {
    part.updateWorldMatrix(true,true);
    bounds.expandByObject(part);
  }
  if (bounds.isEmpty()) return null;
  return {center:bounds.getCenter(new THREE.Vector3()),size:bounds.getSize(new THREE.Vector3()),bounds};
}

/** Create a non-destructive, named assembly; retain each original mesh as a child. */
export function assembleAtlasReference(parts: readonly THREE.Object3D[], name = 'Atlas anatómico') {
  const root = new THREE.Group();
  root.name = name;
  root.userData.labAnatomyAssembly = true;
  root.userData.attribution = 'BodyParts3D 4.0 / Human Atlas — CC BY 4.0';
  for (const part of parts) root.add(part.clone(true));
  return root;
}
