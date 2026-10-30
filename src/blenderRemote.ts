export type BlenderOperation = 'smooth' | 'subdivide' | 'decimate' | 'normals';

export async function processGlbRemotely(file: Blob, operation: BlenderOperation): Promise<Blob> {
  if (file.size < 12 || file.size > 12 * 1024 * 1024) throw new Error('El archivo debe ser GLB y menor a 12 MB.');
  const response = await fetch('/api/blender/process', {
    method: 'POST',
    headers: { 'Content-Type': 'model/gltf-binary', 'X-Genre3D-Operation': operation },
    credentials: 'same-origin',
    body: file
  });
  if (!response.ok) throw new Error('Blender remoto: ' + response.status);
  return response.blob();
}
