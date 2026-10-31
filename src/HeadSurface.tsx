import {useEffect,useMemo} from 'react';
import * as THREE from 'three';

/** Original parametric head surface. Two bones smoothly distribute jaw motion over the chin. */
export function createHeadSurface(material:THREE.Material,wide=false){
 const geometry=new THREE.SphereGeometry(1,72,56),p=geometry.attributes.position;
 const ids:number[]=[],weights:number[]=[];
 const bump=(x:number,y:number,cx:number,cy:number,sx:number,sy:number)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
 for(let i=0;i<p.count;i++){
  const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i),y=.06+ny*.38;
  const taper=THREE.MathUtils.lerp(.74,1,THREE.MathUtils.smoothstep(y,-.30,-.02));
  const x=nx*(wide?.355:.305)*taper;let z=nz*.285;
  if(nz>0){const front=THREE.MathUtils.smoothstep(nz,.05,.65);
   z+=front*(.025*bump(x,y,0,.22,.25,.14)+.045*bump(x,y,0,-.25,.12,.07)
    +.043*(bump(x,y,-.19,-.015,.075,.09)+bump(x,y,.19,-.015,.075,.09))
    -.035*(bump(x,y,-.132,.096,.078,.052)+bump(x,y,.132,.096,.078,.052))
    +.035*bump(x,y,0,.015,.035,.12)+.05*bump(x,y,0,-.055,.047,.035));
  }
  p.setXYZ(i,x,y,z-.025);
  const w=1-THREE.MathUtils.smoothstep(y,-.27,-.10);ids.push(0,1,0,0);weights.push(1-w,w,0,0);
 }
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ids,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const base=new THREE.Bone();base.name='Base_craneal';const jaw=new THREE.Bone();jaw.name='Mandibula_piel';jaw.position.set(0,-.13,-.015);base.add(jaw);
 const mesh=new THREE.SkinnedMesh(geometry,material);mesh.name='Piel_cabeza_continua';mesh.add(base);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton([base,jaw]));mesh.frustumCulled=false;
 return {mesh,jaw};
}
export function HeadSurface({material,jaw,wide}:{material:THREE.Material;jaw:number;wide:boolean}){
 const model=useMemo(()=>createHeadSurface(material,wide),[material,wide]);model.jaw.rotation.x=jaw;
 useEffect(()=>()=>{model.mesh.geometry.dispose();model.mesh.skeleton.dispose()},[model]);
 return <primitive object={model.mesh} dispose={null}/>;
}
