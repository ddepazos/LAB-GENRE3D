export type BlenderOperation = 'smooth' | 'subdivide' | 'decimate' | 'normals';
const messages:Record<string,string>={gateway_not_configured:'El puente Blender aún no está configurado en el servidor.',access_required:'Se necesita acceso autorizado al procesador Blender.',file_too_large:'El archivo supera 12 MB.',invalid_glb:'El archivo no es un GLB 2.0 válido.',backend_unavailable:'Blender no responde. Puede estar iniciándose; inténtalo más tarde.',backend_processing_failed:'Blender no pudo procesar este modelo.'};
export async function processGlbRemotely(file: Blob, operation: BlenderOperation): Promise<Blob> {
  if (file.size < 12 || file.size > 12 * 1024 * 1024) throw new Error('El archivo debe ser GLB y menor a 12 MB.');
  const header=new DataView(await file.slice(0,12).arrayBuffer());
  if(header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==file.size)throw new Error('El archivo no es un GLB 2.0 válido.');
  const response = await fetch('/api/blender/process', {method:'POST',headers:{'Content-Type':'model/gltf-binary','X-Genre3D-Operation':operation},credentials:'same-origin',body:file,signal:AbortSignal.timeout(115000)});
  if(!response.ok){const payload=await response.json().catch(()=>({error:''}));throw new Error(messages[payload.error]??('Blender remoto: '+response.status))}
  const output=await response.blob();
  if(output.size<12||output.size>40*1024*1024)throw new Error('Blender devolvió un archivo vacío o demasiado grande.');
  const result=new DataView(await output.slice(0,12).arrayBuffer());
  if(result.getUint32(0,true)!==0x46546c67||result.getUint32(4,true)!==2||result.getUint32(8,true)!==output.size)throw new Error('Blender devolvió una respuesta que no es GLB válido.');
  return output;
}
