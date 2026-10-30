import assert from 'node:assert/strict';
import gateway,{validGlb} from '../cloudflare/genre3d-blender-gateway.js';
const glb=new ArrayBuffer(12);const view=new DataView(glb);view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,12,true);
assert(validGlb(glb));assert(!validGlb(new ArrayBuffer(12)));
const req=(token)=>new Request('https://test.invalid/api/blender/process',{method:'POST',headers:{'Cf-Access-Jwt-Assertion':token??'','X-Genre3D-Operation':'smooth'},body:glb});
assert.equal((await gateway.fetch(req(),{})).status,503);
const env={GENRE3D_INTERNAL_TOKEN:'test-only',GENRE3D_RENDER_URL:'https://backend.invalid',GENRE3D_ACCESS_ISSUER:'https://test.cloudflareaccess.com',GENRE3D_ACCESS_AUD:'test-audience',GENRE3D_ALLOWED_EMAIL:'test@example.invalid'};
assert.equal((await gateway.fetch(req(),env)).status,403);
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test-key';
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const prefix=encode({alg:'RS256',kid:'test-key'})+'.'+encode({iss:env.GENRE3D_ACCESS_ISSUER,aud:[env.GENRE3D_ACCESS_AUD],email:env.GENRE3D_ALLOWED_EMAIL,exp:Math.floor(Date.now()/1000)+60});
const token=prefix+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(prefix))).toString('base64url');
const original=globalThis.fetch;let backendCalls=0;
globalThis.fetch=async(url,options)=>{if(String(url).endsWith('/cdn-cgi/access/certs'))return Response.json({keys:[jwk]});backendCalls++;assert.equal(options.headers.Authorization,'Bearer test-only');assert.equal(options.headers['X-Genre3D-Operation'],'smooth');return new Response(glb,{headers:{'Content-Type':'model/gltf-binary'}})};
try{const response=await gateway.fetch(req(token),env);assert.equal(response.status,200);assert(validGlb(await response.arrayBuffer()));assert.equal(backendCalls,1);assert.equal((await gateway.fetch(req(token+'x'),env)).status,403);assert.equal(backendCalls,1)}finally{globalThis.fetch=original}
console.log('PASS: GLB validation, unconfigured route, Access signature verification, authorized forwarding and rejection of forged JWT');
