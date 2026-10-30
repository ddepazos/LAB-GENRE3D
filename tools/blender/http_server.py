"""Minimal private-ready Blender processing service for Genre3D."""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

class Handler(BaseHTTPRequestHandler):
    def respond(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/health":
            self.respond(200, {"status": "ready", "service": "genre3d-blender", "jobs": "not-enabled"})
        else:
            self.respond(404, {"error": "not_found"})

    def do_POST(self):
        # Never expose Blender execution publicly without verified auth,
        # bounded job queue, upload validation and private R2 integration.
        self.respond(503, {"error": "jobs_not_configured", "message": "Private job processing is not yet enabled"})

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "10000"))), Handler).serve_forever()
