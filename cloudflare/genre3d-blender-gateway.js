/** Dedicated Genre3D Cloudflare Worker. Never reuse LAB Studio's render Worker.
 * Bind GENRE3D_INTERNAL_TOKEN as a secret; configure GENRE3D_RENDER_URL
 * as a server-side variable. Protect /api/blender/* with Cloudflare Access
 * before enabling this Worker in production.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ service: "genre3d-blender-gateway", configured: Boolean(env.GENRE3D_INTERNAL_TOKEN) });
    }
    if (url.pathname !== "/api/blender/process" || request.method !== "POST") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    if (!env.GENRE3D_INTERNAL_TOKEN || !env.GENRE3D_RENDER_URL) {
      return Response.json({ error: "gateway_not_configured" }, { status: 503 });
    }
    // Cloudflare Access must enforce user authorization at the edge.
    // A public Worker without Access is not a safe processing gateway.
    const user = request.headers.get("Cf-Access-Authenticated-User-Email");
    if (!user || !env.GENRE3D_ALLOWED_EMAIL ||
        user.toLowerCase() !== env.GENRE3D_ALLOWED_EMAIL.toLowerCase()) {
      return Response.json({ error: "access_required" }, { status: 403 });
    }
    const operation = request.headers.get("X-Genre3D-Operation") || "smooth";
    if (!["smooth", "subdivide", "decimate", "normals"].includes(operation)) {
      return Response.json({ error: "invalid_operation" }, { status: 400 });
    }
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 12 * 1024 * 1024) {
      return Response.json({ error: "file_too_large" }, { status: 413 });
    }
    const payload = await request.arrayBuffer();
    if (payload.byteLength < 12 || payload.byteLength > 12 * 1024 * 1024) {
      return Response.json({ error: "invalid_size" }, { status: 413 });
    }
    const magic = new Uint8Array(payload, 0, 4);
    if (String.fromCharCode(...magic) !== "glTF") {
      return Response.json({ error: "invalid_glb" }, { status: 400 });
    }
    const destination = new URL("/api/process", env.GENRE3D_RENDER_URL).toString();
    const response = await fetch(destination, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.GENRE3D_INTERNAL_TOKEN,
        "Content-Type": "model/gltf-binary",
        "X-Genre3D-Operation": operation
      },
      body: payload
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store"
      }
    });
  }
};
