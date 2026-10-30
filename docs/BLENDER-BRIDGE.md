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
