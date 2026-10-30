"""LAB Genre3D Blender bridge: GLB -> Blender mesh cleanup -> GLB.
Usage:
 blender --background --factory-startup --python-exit-code 1 --python tools/blender/genre3d_bridge.py -- --input input.glb --output output.glb --operation smooth --subdivision 1
Blender runs separately from the web browser; this script never starts automatically.
"""
import argparse
import json
import os
import sys
import bpy
import bmesh

def main():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--operation", choices=("smooth", "subdivide", "decimate", "normals"), default="smooth")
    parser.add_argument("--subdivision", type=int, default=1)
    parser.add_argument("--ratio", type=float, default=0.5)
    options = parser.parse_args(args)
    source = os.path.abspath(options.input)
    target = os.path.abspath(options.output)
    if not os.path.isfile(source) or not source.lower().endswith(".glb"):
        raise ValueError("Input must be an existing GLB file")
    if not target.lower().endswith(".glb") or source == target:
        raise ValueError("Output must be a different GLB file")
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=source)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise ValueError("No mesh objects found in GLB")
    for obj in meshes:
        if options.operation in ("subdivide", "decimate"):
            if obj.data.shape_keys:
                raise ValueError("Topology operations on morph targets require a separate editable mesh")
            # glTF splits vertices at normal/UV seams; weld mesh vertices while
            # retaining per-loop UV data before topology modifiers.
            bm = bmesh.new()
            try:
                bm.from_mesh(obj.data)
                bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
                bm.to_mesh(obj.data)
                obj.data.update()
            finally:
                bm.free()
        if options.operation in ("smooth", "normals"):
            for poly in obj.data.polygons:
                poly.use_smooth = True
        if options.operation == "subdivide":
            modifier = obj.modifiers.new("Genre3D Subdivision", "SUBSURF")
            modifier.levels = max(0, min(2, options.subdivision))
            modifier.render_levels = modifier.levels
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        elif options.operation == "decimate":
            modifier = obj.modifiers.new("Genre3D Decimate", "DECIMATE")
            modifier.ratio = max(0.05, min(1.0, options.ratio))
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    os.makedirs(os.path.dirname(target), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=target, export_format="GLB")
    print("GENRE3D_BRIDGE_RESULT " + json.dumps({
        "status": "ok", "operation": options.operation,
        "meshes": len(meshes), "output": target
    }))

if __name__ == "__main__":
    main()
