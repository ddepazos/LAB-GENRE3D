# Blender Bridge — LAB Genre3D

This is an **offline external processing bridge**, not an embedded Blender runtime in the browser. The React editor remains powered by Three.js. No changes to LAB Studio.

## Requirements
- Blender installed locally (or on a future authorized processing server).
- An exported GLB from LAB Genre3D.
- Python script `tools/blender/genre3d_bridge.py` (uses Blender's bundled `bpy`, no pip package required).

## Command (PowerShell from repository root)
```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" --background --factory-startup --python-exit-code 1 --python tools/blender/genre3d_bridge.py -- --input "genre3d-scene.glb" --output "genre3d-refined.glb" --operation subdivide --subdivision 1
```
Adjust the executable path to the Blender version actually installed. Alternative operations:
- `--operation smooth`: smooth polygon shading.
- `--operation normals`: smooth polygon shading; not a full mesh-normal reconstruction.
- `--operation subdivide --subdivision 1`: Catmull-Clark subdivision (maximum 2 to limit load).
- `--operation decimate --ratio 0.5`: simplify meshes to approximately half their faces.

## Current scope and constraints
- The existing editor's GLB export must be validated first; it currently exports editor scene objects, not the separate CharacterLab/HandLab views.
- This bridge does **not** automatically modify the browser viewport. Reimporting processed GLB into Genre3D is a separate pending feature.
- Blender is not installed on the user's Windows PC by this commit; the browser cannot execute a local program without a local companion service or manual invocation.
- This pipeline does not automatically generate high-quality human topology, facial skinning, UV maps, or facial rigs.
- Preserve original input and export to a different output filename. Avoid processing untrusted .blend scripts.
- No build, Blender runtime execution, end-to-end round trip, or deployed UI test is confirmed.

## Conexión web preparada — 30 octubre 2026
- Pages Function `functions/api/blender/[[path]].js` atiende `/api/blender/health` y `/api/blender/process` con el gateway compartido.
- Configuración necesaria en producción: `GENRE3D_RENDER_URL`, secreto `GENRE3D_INTERNAL_TOKEN` coincidente con Render, `GENRE3D_ACCESS_ISSUER`, `GENRE3D_ACCESS_AUD`, `GENRE3D_ALLOWED_EMAIL`. Proteger la ruta con la aplicación Access correspondiente. No configurar valores secretos en código React.
- Se verifica la firma RSA del JWT de Access; un encabezado email enviado por el cliente no concede acceso. Peticiones con cuerpo chunked también tienen límite de 12 MB.
- Cliente valida GLB 2.0 antes/después del procesamiento, traduce errores y tiene timeout. Un resultado correcto se importa como objeto adicional y se descarga; el original permanece.
- Pruebas de contrato con backend simulado: firma válida, rechazo de JWT falsificado, ausencia de configuración y respuesta GLB correctas. Esto no demuestra ejecución de Blender real.
- Cloudflare no tenía variables del puente al inspeccionar. Render requiere confirmar workspace antes de consultar/configurar el servicio. Workspace disponible: `plcdb` (`tea-darcos60tbcc73b2uk1g`). No se seleccionó automáticamente. Activación real y prueba extremo a extremo pendientes de esa identificación.
