import * as THREE from 'three';
import type { SceneCamera, SceneLight } from './sceneObjects';

export function isSceneLight(node: THREE.Object3D): node is SceneLight {
  return node instanceof THREE.DirectionalLight || node instanceof THREE.PointLight ||
    node instanceof THREE.SpotLight || node instanceof THREE.AmbientLight;
}

export function isSceneCamera(node: THREE.Object3D): node is SceneCamera {
  return node instanceof THREE.PerspectiveCamera || node instanceof THREE.OrthographicCamera;
}

export function isEditableSceneObject(node: THREE.Object3D): boolean {
  return node.userData.labOrigin === 'editor' && node.userData.labEditable === true &&
    (isSceneLight(node) || isSceneCamera(node));
}

export function updateSceneCameraProjection(camera: SceneCamera): void {
  camera.near = Math.max(0.001, camera.near);
  camera.far = Math.max(camera.near + 0.001, camera.far);
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov = THREE.MathUtils.clamp(camera.fov, 1, 179);
  } else {
    camera.zoom = Math.max(0.001, camera.zoom);
  }
  camera.updateProjectionMatrix();
}

/** Save LAB's preference as glTF extras, not as a glTF-standard active camera. */
export function markActiveExportCamera(root: THREE.Object3D, active: THREE.Camera | null): void {
  root.traverse(node => {
    if (isSceneCamera(node)) node.userData.labActiveCamera = node === active;
  });
}

/** Remove the light and its editor-created target; never dispose the model root. */
export function detachEditableSceneObject(node: THREE.Object3D): boolean {
  if (!isEditableSceneObject(node)) return false;
  const parent = node.parent;
  if (!parent) return false;
  if (node instanceof THREE.DirectionalLight || node instanceof THREE.SpotLight) {
    if (node.target.parent === parent && node.target.userData.labTargetOf === node.uuid) {
      parent.remove(node.target);
    }
  }
  parent.remove(node);
  return true;
}
