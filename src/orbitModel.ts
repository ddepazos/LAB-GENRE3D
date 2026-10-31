import * as THREE from 'three';

/** Sample densely so quaternion interpolation retains the full 361° turn. */
export function createOrbitModel() {
  const root=new THREE.Group();root.name='Orbita_LAB';
  const turn=new THREE.Group();turn.name='Giro_361';root.add(turn);
  const copper=new THREE.MeshStandardMaterial({color:'#c96d35',metalness:.8,roughness:.28});
  const gold=new THREE.MeshStandardMaterial({color:'#e2b966',metalness:.85,roughness:.25});
  const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(.65,.19,128,16),copper);knot.name='Nucleo';turn.add(knot);
  for(let i=0;i<2;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.18+i*.15,.025,8,96),gold);ring.name='Anillo_'+i;ring.rotation.set(.7+i*.8,.4+i*.6,.2);turn.add(ring);
  }
  for(let i=0;i<3;i++){
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(.1,20,12),gold);sphere.name='Satelite_'+i;
    const angle=i*Math.PI*2/3;sphere.position.set(Math.cos(angle)*1.3,Math.sin(angle)*1.3,.15);turn.add(sphere);
  }
  const times:number[]=[],values:number[]=[];
  for(let i=0;i<=120;i++){times.push(i/30);const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),THREE.MathUtils.degToRad(361)*i/120);values.push(q.x,q.y,q.z,q.w)}
  const clip=new THREE.AnimationClip('Orbita_361_grados_4s',4,[new THREE.QuaternionKeyframeTrack(turn.uuid+'.quaternion',times,values)]);
  return {root,clip};
}
