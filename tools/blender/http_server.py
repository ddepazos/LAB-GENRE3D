"""Authenticated, bounded GLB processing API. Internal use through Cloudflare only."""
import hmac
import json
import os
import subprocess
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MAX_BYTES = 12 * 1024 * 1024
TIMEOUT_SECONDS = 90
BUSY = threading.BoundedSemaphore(1)
TOKEN = os.environ.get("GENRE3D_INTERNAL_TOKEN", "")
OPERATIONS = {"smooth", "subdivide", "decimate", "normals"}

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ready", "service": "genre3d-blender", "jobs": "enabled" if TOKEN else "disabled"})
        else:
            self.respond(404, {"error": "not_found"})

    def do_POST(self):
        if self.path != "/api/process":
            return self.respond(404, {"error": "not_found"})
        supplied = self.headers.get("Authorization", "")
        if not TOKEN or not hmac.compare_digest(supplied, "Bearer " + TOKEN):
            return self.respond(401, {"error": "unauthorized"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.respond(400, {"error": "invalid_length"})
        if not (12 <= length <= MAX_BYTES):
            return self.respond(413, {"error": "invalid_file_size"})
        operation = self.headers.get("X-Genre3D-Operation", "smooth").lower()
        if operation not in OPERATIONS:
            return self.respond(400, {"error": "invalid_operation"})
        if not BUSY.acquire(blocking=False):
            return self.respond(429, {"error": "processor_busy"})
        try:
            payload = self.rfile.read(length)
            if len(payload) != length or payload[:4] != b"glTF":
                return self.respond(400, {"error": "invalid_glb"})
            with tempfile.TemporaryDirectory(prefix="genre3d-") as folder:
                source = Path(folder) / "input.glb"
                target = Path(folder) / "output.glb"
                source.write_bytes(payload)
                cmd = ["blender", "--threads", "1", "--background", "--factory-startup", "--python-exit-code", "1",
                       "--python", "/app/genre3d_bridge.py", "--", "--input", str(source),
                       "--output", str(target), "--operation", operation]
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT_SECONDS, check=False, env={**os.environ,"OMP_NUM_THREADS":"1","OPENBLAS_NUM_THREADS":"1"})
                except subprocess.TimeoutExpired:
                    return self.respond(504, {"error": "processing_timeout"})
                if result.returncode != 0 or not target.is_file():
                    print(json.dumps({"event":"blender_failed","operation":operation,"exit_code":result.returncode,"stderr":result.stderr[-3000:],"stdout":result.stdout[-3000:]}),flush=True)
                    return self.respond(422, {"error": "blender_processing_failed"})
                output = target.read_bytes()
                if len(output) > 40 * 1024 * 1024:
                    return self.respond(413, {"error": "output_too_large"})
                self.send_response(200)
                self.send_header("Content-Type", "model/gltf-binary")
                self.send_header("Content-Disposition", 'attachment; filename="genre3d-processed.glb"')
                self.send_header("Content-Length", str(len(output)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(output)
        finally:
            BUSY.release()

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "10000"))), Handler).serve_forever()
