import * as THREE from 'three';
export type StrokeLayer={name:string;color:string;width:number;opacity:number;visible:boolean};
export type Stroke={layer:number;points:[number,number][];frame:number};
export type Drawing={plane:'xy'|'xz'|'yz';layers:StrokeLayer[];strokes:Stroke[]};
export const defaultDrawing:Drawing={plane:'xy',layers:[{name:'Trazo 1',color:'#ffc367',width:.035,opacity:1,visible:true}],strokes:[]};
export function strokeModel(d:Drawing){
 if(d.layers.length>16||d.strokes.length>128||!['xy','xz','yz'].includes(d.plane))throw new Error('Dibujo fuera de límites');
 const root=new THREE.Group();root.name='Dibujo_3D_LAB';root.userData.genre3dDrawing=d;
 const tracks:THREE.KeyframeTrack[]=[];let duration=0;
 for(const [i,s] of d.strokes.entries()){
  const l=d.layers[s.layer];if(!l||!l.visible)continue;
  if(s.points.length<2||s.points.length>512||!s.points.every(p=>p.length===2&&p.every(Number.isFinite))||!Number.isFinite(l.width)||l.width<.005||l.width>.2||!Number.isFinite(s.frame)||s.frame<0||s.frame>900)throw new Error('Trazo inválido');
  const unique=s.points.filter((p,i)=>i===0||Math.hypot(p[0]-s.points[i-1][0],p[1]-s.points[i-1][1])>.0001);if(unique.length<2)continue;
  const points=unique.map(([a,b])=>d.plane==='xz'?new THREE.Vector3(a,0,b):d.plane==='yz'?new THREE.Vector3(0,a,b):new THREE.Vector3(a,b,0));
  const curve=new THREE.CatmullRomCurve3(points);const geometry=new THREE.TubeGeometry(curve,Math.min(512,s.points.length*3),l.width,8,false);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:l.color,roughness:.6,transparent:l.opacity<1,opacity:l.opacity}));mesh.name=l.name+'_'+i;root.add(mesh);
  if(s.frame>0){const time=s.frame/30;duration=Math.max(duration,time+.1);tracks.push(new THREE.VectorKeyframeTrack(mesh.uuid+'.scale',[0,time,time+.1],[0,0,0,1,1,1,1,1,1],THREE.InterpolateDiscrete))}
 }
 if(!root.children.length)throw new Error('Dibuja al menos un trazo visible');
 return {root,clips:tracks.length?[new THREE.AnimationClip('Dibujo_por_fotogramas',duration,tracks)]:[]};
}
