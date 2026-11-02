import * as THREE from 'three';

/** LAB Creative Suite anatomical metadata, stored in glTF node extras (Object3D.userData).
 * No geometry or animation is discarded. Editable properties survive GLB export/import.
 */
export type AnatomyEditable = {
  schema: 'lab.anatomy/1';
  id: string;
  label: string;
  latinName: string;
  system: string;
  region: string;
  source: string;
  license: string;
  attribution: string;
  editable: { transform: boolean; geometry: boolean; material: boolean; visibility: boolean; rig: boolean; animation: boolean };
  appearance: { visible: boolean; opacity: number; color: string };
  notes: string;
};

const safeId = (value: string) => value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'structure';
const asRecord = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const getColor = (mesh: THREE.Mesh): string => {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  return material && 'color' in material && (material as THREE.MeshStandardMaterial).color instanceof THREE.Color
    ? (material as THREE.MeshStandardMaterial).color.getHexString() : 'cccccc';
};

/** Attach defaults only when absent; never overwrite user-edited properties. */
export function prepareAnatomyForLab(root: THREE.Object3D, source = 'imported-glb'): number {
  let count = 0;
  const used = new Set<string>();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const existing = asRecord(node.userData.labAnatomy);
    const base = safeId(String(existing.id || node.name || 'mesh-' + count));
    let id = base, index = 2;
    while (used.has(id)) id = base + '-' + index++;
    used.add(id);
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const opacity = material && 'opacity' in material ? Number(material.opacity) : 1;
    const appearance = asRecord(existing.appearance);
    const editable = asRecord(existing.editable);
    const permissions = ['transform','geometry','material','visibility','rig','animation'] as const;
    const flags = Object.fromEntries(permissions.map(key => [key, typeof editable[key] === 'boolean' ? editable[key] : true]));
    node.userData.labAnatomy = {
      schema: 'lab.anatomy/1',
      id, label: String(existing.label || node.name || 'Estructura ' + (count + 1)),
      latinName: String(existing.latinName || ''),
      system: String(existing.system || 'sin clasificar'),
      region: String(existing.region || 'sin clasificar'),
      source: String(existing.source || source),
      license: String(existing.license || 'verificar licencia del modelo de origen'),
      attribution: String(existing.attribution || ''),
      editable: flags as AnatomyEditable['editable'],
      appearance: {
        visible: typeof appearance.visible === 'boolean' ? appearance.visible : node.visible,
        opacity: Number.isFinite(Number(appearance.opacity)) ? Math.min(1,Math.max(0,Number(appearance.opacity))) : opacity,
        color: typeof appearance.color === 'string' ? appearance.color : '#' + getColor(mesh)
      },
      notes: String(existing.notes || '')
    } satisfies AnatomyEditable;
    count++;
  });
  return count;
}

/** Update metadata without altering geometry, skinning or animation tracks. */
export function editAnatomyAttributes(node: THREE.Object3D, patch: Partial<AnatomyEditable>): AnatomyEditable {
  const previous = asRecord(node.userData.labAnatomy);
  if (previous.schema !== 'lab.anatomy/1') throw new Error('La estructura no tiene metadatos anatómicos LAB');
  const merged = {
    ...previous, ...patch,
    schema: 'lab.anatomy/1',
    editable: {...asRecord(previous.editable), ...asRecord(patch.editable)},
    appearance: {...asRecord(previous.appearance), ...asRecord(patch.appearance)}
  } as AnatomyEditable;
  node.userData.labAnatomy = merged;
  return merged;
}
