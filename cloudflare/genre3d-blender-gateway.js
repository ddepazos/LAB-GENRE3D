/** Server-side bridge. Secrets never enter the React bundle. */
const MAX_BYTES = 12 * 1024 * 1024;
const operations = new Set(['smooth', 'subdivide', 'decimate', 'normals']);
const error = (status, code) => Response.json({error:code}, {status,headers:{'Cache-Control':'no-store'}});
const decode = value => Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function authorize(request,env) {
  // Verify Access signatures instead of trusting a caller-supplied email header.
  if(!env.GENRE3D_ACCESS_ISSUER||!env.GENRE3D_ACCESS_AUD||!env.GENRE3D_ALLOWED_EMAIL)return false;
  try {
    const token=request.headers.get('Cf-Access-Jwt-Assertion')||'';
    const parts=token.split('.');if(parts.length!==3)return false;
    const head=JSON.parse(new TextDecoder().decode(decode(parts[0])));
    const body=JSON.parse(new TextDecoder().decode(decode(parts[1])));
    const issuer=new URL(env.GENRE3D_ACCESS_ISSUER);
    if(issuer.protocol!=='https:'||!issuer.hostname.endsWith('.cloudflareaccess.com')||issuer.pathname!=='/')return false;
    if(head.alg!=='RS256'||body.iss!==issuer.origin||!Array.isArray(body.aud)||!body.aud.includes(env.GENRE3D_ACCESS_AUD)||!Number.isFinite(body.exp)||body.exp<=Date.now()/1000||body.nbf>Date.now()/1000||typeof body.email!=='string'||body.email.toLowerCase()!==env.GENRE3D_ALLOWED_EMAIL.toLowerCase())return false;
    const certs=await fetch(new URL('/cdn-cgi/access/certs',issuer),{cf:{cacheTtl:300}});
    if(!certs.ok)return false;
    const {keys}=await certs.json();const jwk=keys.find(k=>k.kid===head.kid&&k.kty==='RSA');if(!jwk)return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
  }catch{return false}
}
export function validGlb(buffer) {
  if(buffer.byteLength<12)return false;
  const view=new DataView(buffer);
  return view.getUint32(0,true)===0x46546c67&&view.getUint32(4,true)===2&&view.getUint32(8,true)===buffer.byteLength;
}
export default {
  async fetch(request,env) {
    const path=new URL(request.url).pathname;
    const configured=Boolean(env.GENRE3D_INTERNAL_TOKEN&&env.GENRE3D_RENDER_URL&&env.GENRE3D_ACCESS_ISSUER&&env.GENRE3D_ACCESS_AUD&&env.GENRE3D_ALLOWED_EMAIL);
    if(path==='/api/blender/health'||path==='/health')return Response.json({service:'genre3d-blender-gateway',configured},{headers:{'Cache-Control':'no-store'}});
    if(path!=='/api/blender/process')return error(404,'not_found');
    if(request.method!=='POST')return error(405,'method_not_allowed');
    if(!configured)return error(503,'gateway_not_configured');
    if(!await authorize(request,env))return error(403,'access_required');
    const operation=request.headers.get('X-Genre3D-Operation')||'smooth';
    if(!operations.has(operation))return error(400,'invalid_operation');
    if(Number(request.headers.get('Content-Length')||0)>MAX_BYTES)return error(413,'file_too_large');
    // Bound chunked requests as well as Content-Length requests.
    if(!request.body)return error(400,'invalid_glb');
    const reader=request.body.getReader(),chunks=[];let length=0;
    while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_BYTES){await reader.cancel();return error(413,'file_too_large')}chunks.push(value)}
    const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
    if(!validGlb(bytes.buffer))return error(400,'invalid_glb');
    try {
      const destination=new URL('/api/process',env.GENRE3D_RENDER_URL);
      if(destination.protocol!=='https:')return error(503,'invalid_backend_configuration');
      const response=await fetch(destination,{method:'POST',headers:{Authorization:'Bearer '+env.GENRE3D_INTERNAL_TOKEN,'Content-Type':'model/gltf-binary','X-Genre3D-Operation':operation},body:bytes,signal:AbortSignal.timeout(100000),redirect:'manual'});
      if(!response.ok)return error([401,403].includes(response.status)?502:response.status,'backend_processing_failed');
      return new Response(response.body,{headers:{'Content-Type':'model/gltf-binary','Content-Disposition':'attachment; filename="genre3d-processed.glb"','Cache-Control':'no-store'}});
    }catch(e){return Response.json({error:'backend_unavailable',detail:String(e?.message||e).slice(0,300)},{status:e?.name==='TimeoutError'?504:502,headers:{'Cache-Control':'no-store'}})}
  }
};
