import * as THREE from 'three';

/** Original, redistributable educational anatomy templates. Not clinical anatomy. */
export type AnatomyKind='skull'|'hand'|'arm'|'figure';
const bone=new THREE.MeshStandardMaterial({color:0xd8c5a7,roughness:.82});
const skin=new THREE.MeshStandardMaterial({color:0xb88c70,roughness:.8});
const joint=new THREE.MeshStandardMaterial({color:0x766e65,roughness:.7});
function part(parent:THREE.Object3D,name:string,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0){
 const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function ellipsoid(parent:THREE.Object3D,name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,material=bone){
 const mesh=part(parent,name,new THREE.SphereGeometry(1,24,16),material,x,y,z);mesh.scale.set(sx,sy,sz);return mesh;
}
function link(parent:THREE.Object3D,name:string,from:THREE.Vector3,to:THREE.Vector3,radius:number,material=bone){
 const delta=to.clone().sub(from);const mesh=part(parent,name,new THREE.CylinderGeometry(radius*.85,radius,delta.length(),12),material,...from.clone().add(to).multiplyScalar(.5).toArray() as [number,number,number]);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
}
export function createAnatomyTemplate(kind:AnatomyKind):THREE.Group{
 const root=new THREE.Group();root.name='LAB Anatomía · '+kind;root.userData={anatomyTemplate:kind,license:'LAB original educational template',version:1};
 if(kind==='skull'){
   const cranium=new THREE.Group();cranium.name='01 · Cráneo / bóveda';root.add(cranium);
   ellipsoid(cranium,'Neurocráneo',0,1.7,0,.73,.85,.65);
   ellipsoid(cranium,'Frontal',0,1.95,.38,.62,.42,.27);
   for(const side of [-1,1]){
     ellipsoid(cranium,'Cigomático '+side,side*.56,1.48,.47,.24,.17,.2);
     ellipsoid(cranium,'Órbita borde '+side,side*.32,1.71,.57,.34,.34,.1);
     ellipsoid(cranium,'Órbita cavidad '+side,side*.32,1.72,.666,.235,.235,.04,joint);
     ellipsoid(cranium,'Maxilar '+side,side*.22,1.24,.48,.3,.2,.26);
     for(let i=0;i<5;i++)ellipsoid(cranium,'Diente superior '+side+' '+i,side*(.08+i*.095),1.11,.66-i*.012,.048,.075,.06);
   }
   ellipsoid(cranium,'Hueso nasal',0,1.52,.72,.13,.24,.16);
   const jaw=new THREE.Group();jaw.name='02 · Mandíbula (pieza separada)';jaw.position.set(0,1.1,0);root.add(jaw);
   ellipsoid(jaw,'Cuerpo mandibular',0,-.13,.42,.55,.15,.3);
   for(const side of [-1,1]){link(jaw,'Rama mandibular '+side,new THREE.Vector3(side*.51,-.1,.34),new THREE.Vector3(side*.57,.32,.1),.11);for(let i=0;i<5;i++)ellipsoid(jaw,'Diente inferior '+side+' '+i,side*(.08+i*.095),.01,.65-i*.012,.047,.068,.05)}
   root.userData.editableParts=['01 · Cráneo / bóveda','02 · Mandíbula (pieza separada)'];
 }else if(kind==='hand'){
   const palm=new THREE.Group();palm.name='01 · Palma';root.add(palm);
   ellipsoid(palm,'Metacarpo',0,.68,0,.48,.62,.17,skin);
   ellipsoid(palm,'Muñeca',0,.12,0,.27,.2,.19,skin);
   const lengths=[.65,.83,.91,.81,.67];
   for(let i=0;i<5;i++){
     const thumb=i===0;const x=thumb?-.46:(i-2)*.23;const base=new THREE.Group();base.name=(thumb?'Pulgar':(['','Índice','Medio','Anular','Meñique'][i]))+' · articulación raíz';base.position.set(x,thumb?.42:1.11,0);if(thumb)base.rotation.z=.68;palm.add(base);
     let parent:THREE.Group=base;for(let j=0;j<3;j++){const segment=new THREE.Group();segment.name='Falange '+(j+1);if(j)segment.position.y=lengths[i]/3;parent.add(segment);ellipsoid(segment,'Malla falange '+(j+1),0,lengths[i]/6,0,.11-(j*.018),lengths[i]/6+.045,.105-(j*.012),skin);ellipsoid(segment,'Articulación '+(j+1),0,0,0,.115-j*.014,.1,.11-j*.012,joint);parent=segment}
   }
   root.userData.editableParts=['01 · Palma','Falanges por dedo'];
 }else if(kind==='arm'){
   const shoulder=new THREE.Group();shoulder.name='01 · Hombro';root.add(shoulder);shoulder.position.y=2.3;
   ellipsoid(shoulder,'Deltoides',0,0,0,.38,.35,.35,skin);
   const upper=new THREE.Group();upper.name='02 · Brazo superior';shoulder.add(upper);ellipsoid(upper,'Húmero',0,-.52,0,.22,.6,.21,skin);
   const elbow=new THREE.Group();elbow.name='03 · Codo';elbow.position.y=-1.12;upper.add(elbow);ellipsoid(elbow,'Articulación codo',0,0,0,.24,.24,.24,joint);
   const forearm=new THREE.Group();forearm.name='04 · Antebrazo';elbow.add(forearm);ellipsoid(forearm,'Radio y cúbito',0,-.47,0,.21,.52,.19,skin);
   root.userData.editableParts=['01 · Hombro','02 · Brazo superior','03 · Codo','04 · Antebrazo'];
 }else{
   const torso=new THREE.Group();torso.name='01 · Tronco';root.add(torso);ellipsoid(torso,'Caja torácica',0,2.7,0,.75,.92,.42,skin);ellipsoid(torso,'Pelvis',0,1.65,0,.58,.36,.37,skin);
   const neck=new THREE.Group();neck.name='02 · Cuello y cabeza';neck.position.y=3.52;torso.add(neck);ellipsoid(neck,'Cuello',0,.05,0,.18,.28,.18,skin);ellipsoid(neck,'Cabeza',0,.64,0,.43,.58,.4,skin);
   for(const side of [-1,1]){
     const arm=new THREE.Group();arm.name=(side<0?'03 · Brazo izquierdo':'04 · Brazo derecho');arm.position.set(side*.88,3.18,0);torso.add(arm);ellipsoid(arm,'Brazo',side*.16,-.45,0,.2,.56,.2,skin);const elbow=new THREE.Group();elbow.name='Codo';elbow.position.set(side*.3,-.95,0);arm.add(elbow);ellipsoid(elbow,'Antebrazo',side*.05,-.45,0,.17,.5,.17,skin);
     const leg=new THREE.Group();leg.name=side<0?'05 · Pierna izquierda':'06 · Pierna derecha';leg.position.set(side*.34,1.5,0);torso.add(leg);ellipsoid(leg,'Muslo',0,-.43,0,.28,.56,.26,skin);const knee=new THREE.Group();knee.name='Rodilla';knee.position.y=-.92;leg.add(knee);ellipsoid(knee,'Pierna inferior',0,-.45,0,.2,.52,.2,skin);ellipsoid(knee,'Pie',0,-.99,.18,.22,.16,.44,skin);
   }
   root.userData.editableParts=['01 · Tronco','02 · Cuello y cabeza','03/04 · Brazos','05/06 · Piernas'];
 }
 return root;
}
