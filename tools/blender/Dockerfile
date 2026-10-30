FROM blender/blender:4.5
WORKDIR /app
COPY tools/blender/genre3d_bridge.py /app/genre3d_bridge.py
COPY tools/blender/http_server.py /app/http_server.py
EXPOSE 10000
ENTRYPOINT ["python3", "/app/http_server.py"]
