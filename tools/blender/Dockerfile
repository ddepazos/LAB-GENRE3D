FROM blender/blender:4.5
WORKDIR /app
COPY tools/blender/genre3d_bridge.py /app/genre3d_bridge.py
# Container image is a worker building block; an HTTP job runner and authentication
# must be implemented before public deployment.
ENTRYPOINT ["blender", "--background", "--factory-startup", "--python-exit-code", "1", "--python", "/app/genre3d_bridge.py", "--"]
