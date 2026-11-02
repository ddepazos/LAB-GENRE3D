import * as THREE from 'three';

/**
 * LAB GENRE3D — anatomical reference layer.
 * Keeps the original preset/rig untouched. Atlas geometry is a reference,
 * NOT an automatic replacement for skinned meshes or animation controls.
 * BodyParts3D 4.0 geometry: CC BY 4.0. Retain source attribution.
 */
export type AnatomyPreset = 'skull' | 'hand' | 'arm' | 'figure' | 'head';
export type ReferenceOptions = {
  opacity?: number;
  visible?: boolean;
  color?: THREE.ColorRepresentation;
};
export const ANATOMY_REFERENCE_SOURCE =
  'BodyParts3D 4.0 / Human Atlas (geometry CC BY 4.0; attribution required)';

const REFERENCE_LAYER = 'lab-anatomy-reference';

function referenceMaterial(source: THREE.Material | THREE.Material[], opacity: number, color: THREE.ColorRepresentation) {
  const base = Array.isArray(source) ? source[0] : source;
  const material = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: THREE.MathUtils.clamp(opacity, 0.05, 1),
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0,
  });
  if (base instanceof THREE.MeshStandardMaterial && base.map) material.map = base.map;
  return material;
}

/** Reference geometries must already share the same meter/Y-up coordinates. */
export function attachAnatomyReference(
  presetRoot: THREE.Object3D,
  atlasParts: readonly THREE.Object3D[],
  options: ReferenceOptions = {},
): THREE.Group {
  removeAnatomyReference(presetRoot);
  const layer = new THREE.Group();
  layer.name = REFERENCE_LAYER;
  layer.visible = options.visible ?? true;
  layer.userData = {
    labAnatomyReference: true,
    source: ANATOMY_REFERENCE_SOURCE,
    editable: false,
    exportByDefault: false,
  };
  for (const part of atlasParts) {
    const copy = part.clone(true);
    copy.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      // Cloned geometry remains independent of edits to the original atlas.
      node.geometry = node.geometry.clone();
      node.material = referenceMaterial(
        node.material,
        options.opacity ?? 0.32,
        options.color ?? 0x9fd5d1,
      );
      node.userData = {
        ...node.userData,
        labAnatomyReferencePart: true,
        source: ANATOMY_REFERENCE_SOURCE,
      };
      node.castShadow = false;
      node.receiveShadow = false;
    });
    layer.add(copy);
  }
  presetRoot.add(layer);
  return layer;
}

export function removeAnatomyReference(presetRoot: THREE.Object3D): boolean {
  const old = presetRoot.children.find(child => child.name === REFERENCE_LAYER);
  if (!old) return false;
  presetRoot.remove(old);
  old.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      material.dispose();
    }
  });
  return true;
}

export function setAnatomyReferenceVisible(presetRoot: THREE.Object3D, visible: boolean): boolean {
  const layer = presetRoot.children.find(child => child.name === REFERENCE_LAYER);
  if (!layer) return false;
  layer.visible = visible;
  return true;
}

/**
 * Bounding-box diagnostics: compare atlas reference to preset.
 * No automatic rescaling: human anatomy dimensions must remain truthful.
 */
export function compareAnatomyBounds(preset: THREE.Object3D, atlas: THREE.Object3D) {
  preset.updateMatrixWorld(true);
  atlas.updateMatrixWorld(true);
  const a = new THREE.Box3().setFromObject(preset);
  const b = new THREE.Box3().setFromObject(atlas);
  const presetSize = a.getSize(new THREE.Vector3());
  const atlasSize = b.getSize(new THREE.Vector3());
  return {
    presetSizeMeters: presetSize.toArray(),
    atlasSizeMeters: atlasSize.toArray(),
    presetCenterMeters: a.getCenter(new THREE.Vector3()).toArray(),
    atlasCenterMeters: b.getCenter(new THREE.Vector3()).toArray(),
    valid: !a.isEmpty() && !b.isEmpty(),
  };
}
