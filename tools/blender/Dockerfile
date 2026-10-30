FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends blender python3 python3-numpy python3-pil ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY tools/blender/genre3d_bridge.py /app/genre3d_bridge.py
COPY tools/blender/http_server.py /app/http_server.py
RUN blender --threads 1 --background --factory-startup --python-exit-code 1 --python-expr "import numpy; from PIL import Image; import bpy; bpy.ops.export_scene.gltf(filepath='/tmp/genre3d-smoke.glb', export_format='GLB')"
RUN blender --threads 1 --background --factory-startup --python-exit-code 1 --python /app/genre3d_bridge.py -- --input /tmp/genre3d-smoke.glb --output /tmp/genre3d-smoke-result.glb --operation smooth
RUN rm /tmp/genre3d-smoke.glb /tmp/genre3d-smoke-result.glb
EXPOSE 10000
ENTRYPOINT ["python3", "/app/http_server.py"]

