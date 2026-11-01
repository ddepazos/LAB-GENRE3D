import * as THREE from 'three';

export type SceneLightType = 'directional' | 'point' | 'spot' | 'ambient';
export type SceneCameraType = 'perspective' | 'orthographic';
export type SceneLight = THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight | THREE.AmbientLight;
export type SceneCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

export function getSceneObjects(root: THREE.Group): THREE.Group {
  const found = root.children.find(child => child.userData.labSceneObjects === true);
  if (found instanceof THREE.Group) return found;
  const group = new THREE.Group();
  group.name = 'LAB SceneObjects';
  group.userData.labSceneObjects = true;
  group.userData.labOrigin = 'editor';
  root.add(group);
  return group;
}

function tag<T extends THREE.Object3D>(node: T, kind: 'light' | 'camera'): T {
  node.userData.labOrigin = 'editor';
  node.userData.labEditable = true;
  node.userData.labKind = kind;
  return node;
}

export function addSceneLight(root: THREE.Group, type: SceneLightType): SceneLight {
  let light: SceneLight;
  switch (type) {
    case 'directional': {
      const node = new THREE.DirectionalLight(0xffffff, 2);
      node.position.set(4, 6, 4);
      light = node;
      break;
    }
    case 'point': {
      const node = new THREE.PointLight(0xffffff, 10, 0, 2);
      node.position.set(2, 3, 2);
      light = node;
      break;
    }
    case 'spot': {
      const node = new THREE.SpotLight(0xffffff, 20, 0, Math.PI / 6, 0.3, 2);
      node.position.set(3, 5, 3);
      light = node;
      break;
    }
    case 'ambient':
      light = new THREE.AmbientLight(0xffffff, 0.25);
      break;
  }
  light.name = 'LAB ' + type + ' light';
  const group = getSceneObjects(root);
  group.add(tag(light, 'light'));
  if (light instanceof THREE.DirectionalLight || light instanceof THREE.SpotLight) {
    light.target.name = light.name + ' target';
    light.target.userData.labTargetOf = light.uuid;
    group.add(light.target);
  }
  root.updateMatrixWorld(true);
  return light;
}

export function addSceneCamera(root: THREE.Group, type: SceneCameraType): SceneCamera {
  const camera: SceneCamera = type === 'perspective'
    ? new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 1000)
    : new THREE.OrthographicCamera(-80 / 9, 80 / 9, 5, -5, 0.1, 1000);
  camera.position.set(5, 4, 8);
  camera.lookAt(0, 0, 0);
  camera.name = 'LAB ' + type + ' camera';
  getSceneObjects(root).add(tag(camera, 'camera'));
  root.updateMatrixWorld(true);
  return camera;
}
