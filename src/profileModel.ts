import * as THREE from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
export type ProfileSettings={kind:'ring'|'star'|'rectangle'|'svg'|'revolve';depth:number;bevel:number;angle:number;svg:string;color:string};
export const defaultProfile:ProfileSettings={kind:'ring',depth:.5,bevel:.03,angle:360,svg:'',color:'#b6a3ed'};
export function profileModel(p:ProfileSettings){
 if(!Number.isFinite(p.depth)||p.depth<.01||p.depth>10||!Number.isFinite(p.bevel)||p.bevel<0||p.bevel>.25||!Number.isFinite(p.angle)||p.angle<1||p.angle>360)throw new Error('Parámetros de perfil fuera de rango');
 const root=new THREE.Group();root.name='Perfil_2D_3D';root.userData.genre3dProfile=p;
 const material=new THREE.MeshStandardMaterial({color:p.color,roughness:.45,metalness:.15,side:THREE.DoubleSide});
 if(p.kind==='revolve'){
  const points=[new THREE.Vector2(.25,-1),new THREE.Vector2(.65,-.9),new THREE.Vector2(.8,-.5),new THREE.Vector2(.48,.1),new THREE.Vector2(.3,.65),new THREE.Vector2(.55,1)];
  const geometry=new THREE.LatheGeometry(points,64,0,THREE.MathUtils.degToRad(p.angle));geometry.scale(p.depth,1,p.depth);root.add(new THREE.Mesh(geometry,material));return root;
 }
 let shapes:THREE.Shape[]=[];
 if(p.kind==='svg'){
  if(p.svg.length>100000||/<!DOCTYPE|<!ENTITY|<image|<use|<script|<foreignObject/i.test(p.svg))throw new Error('SVG: usa trazados locales, sin imágenes, scripts ni referencias externas (máximo 100 KB)');
  const data=new SVGLoader().parse(p.svg);for(const path of data.paths)if(path.userData?.style?.fill!=='none')shapes.push(...SVGLoader.createShapes(path));
  if(!shapes.length||shapes.length>100)throw new Error('SVG sin perfiles rellenos o con más de 100 perfiles');
 }else{
  const shape=new THREE.Shape();if(p.kind==='ring'){shape.absarc(0,0,1,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.5,0,Math.PI*2,true);shape.holes.push(hole)}
  else if(p.kind==='star'){for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?.45:1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y)}shape.closePath()}
  else{shape.moveTo(-1,-.6);shape.lineTo(1,-.6);shape.lineTo(1,.6);shape.lineTo(-1,.6);shape.closePath()}shapes=[shape];
 }
 if(p.kind==='svg'){
  const flat=new THREE.ShapeGeometry(shapes);flat.computeBoundingBox();const box=flat.boundingBox!,size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2/Math.max(size.x,size.y,1e-6);flat.dispose();
  for(const shape of shapes){const contours=[shape,...shape.holes];for(const contour of contours){const points=contour.getPoints(32).map(v=>new THREE.Vector2((v.x-center.x)*scale,-(v.y-center.y)*scale));contour.curves=[];contour.setFromPoints(points);contour.closePath()}}
 }
 const geometry=new THREE.ExtrudeGeometry(shapes,{depth:p.depth,bevelEnabled:p.bevel>0,bevelSize:p.bevel,bevelThickness:p.bevel,bevelSegments:3,steps:1,curveSegments:24});geometry.translate(0,0,-p.depth/2);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.name='Volumen_perfil';root.add(mesh);return root;
}
