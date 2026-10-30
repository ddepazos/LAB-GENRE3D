import * as THREE from "three";
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from "three-mesh-bvh";
import { Brush, Evaluator, ADDITION, SUBTRACTION, INTERSECTION } from "three-bvh-csg";

/** Enable BVH acceleration without changing existing editor meshes or their materials. */
export function enableMeshAcceleration(): void {
  // Use runtime registration to avoid conflicting Three.js/BVH declaration merging.
  const proto = THREE.BufferGeometry.prototype;
  if (!("computeBoundsTree" in proto)) Object.defineProperty(proto, "computeBoundsTree", { value: computeBoundsTree, writable: true, configurable: true });
  if (!("disposeBoundsTree" in proto)) Object.defineProperty(proto, "disposeBoundsTree", { value: disposeBoundsTree, writable: true, configurable: true });
  if (THREE.Mesh.prototype.raycast !== acceleratedRaycast) THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

export type BooleanOperation = "union" | "subtract" | "intersect";
/** Non-destructive boolean result; source meshes remain unchanged.
 * Inputs must be triangle meshes with valid geometry. Expensive operations
 * should run only on explicit user action, never per animation frame.
 */
export function booleanMeshes(a: THREE.Mesh, b: THREE.Mesh, operation: BooleanOperation): THREE.Mesh {
  a.updateWorldMatrix(true, false);
  b.updateWorldMatrix(true, false);
  const brushA = new Brush(a.geometry.clone(), a.material);
  const brushB = new Brush(b.geometry.clone(), b.material);
  brushA.matrix.copy(a.matrixWorld);
  brushB.matrix.copy(b.matrixWorld);
  brushA.matrix.decompose(brushA.position, brushA.quaternion, brushA.scale);
  brushB.matrix.decompose(brushB.position, brushB.quaternion, brushB.scale);
  brushA.updateMatrixWorld(true);
  brushB.updateMatrixWorld(true);
  const operationCode = operation === "union" ? ADDITION : operation === "subtract" ? SUBTRACTION : INTERSECTION;
  const result = new Evaluator().evaluate(brushA, brushB, operationCode);
  result.geometry.computeVertexNormals();
  result.name = `CSG ${operation}: ${a.name} + ${b.name}`;
  return result;
}
