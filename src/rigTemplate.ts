import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Original educational armature: shoulder, elbow, forearm, wrist and five fingers.
 *  Geometry is skinned to three bones; fingers are visible but not independently rigged yet. */
export function createRigTemplate():THREE.Group {
 const root=new THREE.Group();root.name='Brazo_anatomico_LAB';
 const skin=new THREE.MeshStandardMaterial({color:'#bc9077',roughness:.77,metalness:0});
 const geometries:THREE.BufferGeometry[]=[];
 function ellipsoid(x:number,y:number,z:number,sx:number,sy:number,sz:number){
   const g=new THREE.SphereGeometry(1,16,12);
   g.scale(sx,sy,sz);g.translate(x,y,z);geometries.push(g);
 }
 function limb(x:number,y:number,z:number,rTop:number,rBottom:number,height:number,angle=0){
   const g=new THREE.CylinderGeometry(rTop,rBottom,height,16,8);
   g.rotateZ(angle);g.translate(x,y,z);geometries.push(g);
 }
 // World-space bind pose: shoulder y=2.8, elbow y=1.65, wrist y=.65
 ellipsoid(0,2.7,0,.39,.36,.36);
 limb(0,2.18,0,.29,.235,1.08);
 ellipsoid(0,1.65,0,.25,.25,.25);
 limb(0,1.13,0,.23,.16,1.02);
 ellipsoid(0,.65,0,.17,.17,.17);
 ellipsoid(0,.35,0,.28,.37,.13);
 const fingers=[[-.25,.055,.36],[-.125,.015,.51],[0,0,.57],[.125,.015,.51],[.25,.055,.39]];
 for(let i=0;i<fingers.length;i++){
   const [x,z,length]=fingers[i];const thumb=i===0;
   const startY=thumb?.37:.08;const fx=thumb?x-.12:x;
   ellipsoid(fx,startY-length*.5,z,.065,length*.53,.065);
   ellipsoid(fx,startY-length,z,.058,.075,.058);
 }
 const geometry=mergeGeometries(geometries,false);
 if(!geometry)throw new Error('No se pudo crear la malla anatómica');
 geometries.forEach(g=>g.dispose());
 const positions=geometry.getAttribute('position'),indices:number[]=[],weights:number[]=[];
 for(let i=0;i<positions.count;i++){
   const y=positions.getY(i);
   // Bone 0: shoulder, 1: elbow, 2: wrist. Smooth skinning near joints.
   if(y>1.9){indices.push(0,1,0,0);weights.push(1,0,0,0)}
   else if(y>1.4){const t=THREE.MathUtils.clamp((1.9-y)/.5,0,1);indices.push(0,1,0,0);weights.push(1-t,t,0,0)}
   else if(y>.9){indices.push(1,2,0,0);weights.push(1,0,0,0)}
   else if(y>.55){const t=THREE.MathUtils.clamp((.9-y)/.35,0,1);indices.push(1,2,0,0);weights.push(1-t,t,0,0)}
   else {indices.push(2,0,0,0);weights.push(1,0,0,0)}
 }
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
 geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 const inflated=positions.clone();
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);inflated.setX(i,x*1.1);inflated.setZ(i,z*1.1)}
 geometry.morphAttributes.position=[inflated];
 const shoulder=new THREE.Bone();shoulder.name='Hombro';shoulder.position.y=2.8;
 const elbow=new THREE.Bone();elbow.name='Codo';elbow.position.y=-1.15;
 const wrist=new THREE.Bone();wrist.name='Muñeca';wrist.position.y=-1;
 shoulder.add(elbow);elbow.add(wrist);
 const mesh=new THREE.SkinnedMesh(geometry,skin);mesh.name='Malla_brazo_anatomico';
 mesh.add(shoulder);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton([shoulder,elbow,wrist]));
 mesh.updateMorphTargets();mesh.morphTargetDictionary={Volumen:0};
 root.add(mesh);root.userData={template:'anatomical-arm',limitations:'fingers not independently rigged',version:2};
 return root;
}
