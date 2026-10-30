import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/** LAB Creative Suite interchange contract v1. */
export type LabAssetManifest = {
  schema: "lab.creative-suite.asset";
  version: 1;
  source: "LAB GENRE3D";
  target: "LAB Studio";
  asset: { file: string; format: "glb"; units: "meters"; upAxis: "Y"; handedness: "right" };
  animation: { fps: number; clipNames: string[]; durationSeconds: number };
  content: { meshes: number; skinnedMeshes: number; bones: number; morphTargets: number; materials: number };
  createdAt: string;
};
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15000);
}
export async function exportToLabStudio(
  scene: THREE.Object3D,
  options: { name?: string; fps?: number; clips?: THREE.AnimationClip[]; onReady?: (files:{glb:Blob;manifest:Blob;name:string})=>void } = {}
): Promise<LabAssetManifest> {
  const name = (options.name ?? "genre3d-asset").replace(/[^a-z0-9_-]/gi, "-");
  const file = name + ".glb";
  const clips = options.clips ?? [];
  const content = { meshes: 0, skinnedMeshes: 0, bones: 0, morphTargets: 0, materials: 0 };
  const materialIds = new Set<string>();
  const hidden: {object:THREE.Object3D;visible:boolean}[]=[];
  scene.traverse(object=>{if(object.userData.editorOnly || object.type==='TransformControls'||(object as THREE.Object3D&{isTransformControls?:boolean}).isTransformControls){hidden.push({object,visible:object.visible});object.visible=false}});
  const isVisible=(object:THREE.Object3D)=>{let node:THREE.Object3D|null=object;while(node){if(!node.visible)return false;node=node.parent}return true};
  try {
  scene.traverse((object) => {
    if(!isVisible(object))return;
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      content.meshes++;
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) content.skinnedMeshes++;
      content.morphTargets += Object.keys(mesh.morphTargetDictionary ?? {}).length;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.filter(Boolean).forEach((m) => materialIds.add(m.uuid));
    }
    if ((object as THREE.Bone).isBone) content.bones++;
  });
  if (!content.meshes) throw new Error("La escena no contiene mallas exportables.");
  content.materials = materialIds.size;
  const exporter = new GLTFExporter();
  const binary = await exporter.parseAsync(scene, { binary: true, animations: clips, onlyVisible: true, trs: true });
  if (!(binary instanceof ArrayBuffer)) throw new Error("GLTFExporter no produjo un GLB binario.");
  const manifest: LabAssetManifest = {
    schema: "lab.creative-suite.asset", version: 1, source: "LAB GENRE3D", target: "LAB Studio",
    asset: { file, format: "glb", units: "meters", upAxis: "Y", handedness: "right" },
    animation: { fps: options.fps ?? 30, clipNames: clips.map((c) => c.name), durationSeconds: Math.max(0, ...clips.map((c) => c.duration)) },
    content, createdAt: new Date().toISOString()
  };
  const glbBlob=new Blob([binary],{type:"model/gltf-binary"});
  const manifestBlob=new Blob([JSON.stringify(manifest,null,2)],{type:"application/json"});
  if(options.onReady)options.onReady({glb:glbBlob,manifest:manifestBlob,name});
  else {saveBlob(glbBlob,file);saveBlob(manifestBlob,name+".lab.json")};
  return manifest;
  } finally {hidden.forEach(({object,visible})=>{object.visible=visible})}
}

/** Serialize for Blender without downloading files or exporting editing guides. */
export async function serializeSceneGlb(scene:THREE.Object3D,clips:THREE.AnimationClip[]=[] ):Promise<Blob> {
  const hidden:{object:THREE.Object3D;visible:boolean}[]=[];
  scene.traverse(object=>{if(object.userData.editorOnly||object.type==='TransformControls'||(object as THREE.Object3D&{isTransformControls?:boolean}).isTransformControls){hidden.push({object,visible:object.visible});object.visible=false}});
  try {
    const data=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true,trs:true,animations:clips});
    if(!(data instanceof ArrayBuffer))throw new Error('No se pudo preparar la escena GLB');
    return new Blob([data],{type:'model/gltf-binary'});
  }finally{hidden.forEach(({object,visible})=>{object.visible=visible})}
}
