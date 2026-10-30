import gateway from '../../../cloudflare/genre3d-blender-gateway.js';
export const onRequest = context => gateway.fetch(context.request,context.env);
