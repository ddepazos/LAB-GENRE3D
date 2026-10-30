FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends blender python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY tools/blender/genre3d_bridge.py /app/genre3d_bridge.py
COPY tools/blender/http_server.py /app/http_server.py
EXPOSE 10000
ENTRYPOINT ["python3", "/app/http_server.py"]
