import * as THREE from 'three';

/** Small weighted armature for posing, mesh protection and animation interchange. */
export function createRigTemplate():THREE.Group {
  const root=new THREE.Group();root.name='Brazo_articulado_LAB';
  const height=3,geometry=new THREE.CylinderGeometry(.28,.35,height,12,16);
  geometry.translate(0,height/2,0);
  const positions=geometry.getAttribute('position'),indices:number[]=[],weights:number[]=[];
  for(let i=0;i<positions.count;i++){
    const y=positions.getY(i),segment=Math.min(1,Math.floor(y/1.5)),blend=(y-segment*1.5)/1.5;
    indices.push(segment,segment+1,0,0);weights.push(1-blend,blend,0,0);
  }
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const swollen=positions.clone();
  for(let i=0;i<positions.count;i++){
    swollen.setX(i,positions.getX(i)*1.5);swollen.setZ(i,positions.getZ(i)*1.5);
  }
  geometry.morphAttributes.position=[swollen];
  const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({color:'#8fbad9',roughness:.65}));mesh.name='Malla_brazo';
  const bones=['Base','Codo','Extremo'].map(name=>{const bone=new THREE.Bone();bone.name=name;return bone});
  bones[0].add(bones[1]);bones[1].position.y=1.5;bones[1].add(bones[2]);bones[2].position.y=1.5;
  mesh.add(bones[0]);mesh.bind(new THREE.Skeleton(bones));mesh.updateMorphTargets();mesh.morphTargetDictionary={Volumen:0};
  root.add(mesh);root.updateMatrixWorld(true);return root;
}
