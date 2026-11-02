import * as THREE from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {prepareAnatomyForLab} from './anatomyInterop';

/** Load OBJ as a separate, editable reference asset. No implicit rigging. */
export function parseObjReference(source: string, name = 'Modelo OBJ') {
  const loader = new OBJLoader();
  const root = loader.parse(source);
  root.name = name;
  root.userData.labReference = {
    schema: 'lab.reference/1',
    format: 'obj',
    editable: true,
    rigged: false,
    sourceUnits: 'unknown',
  };
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const parts: {name:string; vertices:number; triangles:number}[] = [];
  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    const geometry = node.geometry;
    parts.push({
      name: node.name || 'Sin nombre',
      vertices: geometry.getAttribute('position')?.count ?? 0,
      triangles: Math.floor((geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0) / 3),
    });
  });
  return {root, parts, size, center, bounds};
}

/** Scale only on explicit user selection, preserving the original geometry. */
export function setReferenceUnitScale(root: THREE.Object3D, sourceUnits: 'meters'|'centimeters'|'millimeters') {
  const scale = sourceUnits === 'meters' ? 1 : sourceUnits === 'centimeters' ? 0.01 : 0.001;
  root.scale.setScalar(scale);
  root.updateMatrixWorld(true);
  root.userData.labReference = {
    ...root.userData.labReference,
    sourceUnits,
    unitScale: scale,
  };
  return root;
}

/** Clone before modifying so the original reference remains untouched. */
export function editableObjCopy(root: THREE.Object3D) {
  const copy = root.clone(true);
  copy.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry = node.geometry.clone();
    node.material = Array.isArray(node.material)
      ? node.material.map(material => material.clone())
      : node.material.clone();
  });
  prepareAnatomyForLab(copy,'obj-reference');
  return copy;
}
