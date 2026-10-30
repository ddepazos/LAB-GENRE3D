import * as THREE from 'three';
export type ExtraAttribute={itemSize:number;values:number[]};
export type MeshData={positions:number[];uvs?:number[];attributes?:Record<string,ExtraAttribute>;groups?:{start:number;count:number;materialIndex:number}[]};
export function geometryData(g:THREE.BufferGeometry):MeshData {
 const n=g.index?g.toNonIndexed():g.clone();
 const data:MeshData={positions:Array.from(n.getAttribute('position').array),uvs:n.getAttribute('uv')?Array.from(n.getAttribute('uv').array):undefined};
 for(const key of ['color','uv1','uv2']){const attr=n.getAttribute(key);if(attr){data.attributes??={};data.attributes[key]={itemSize:attr.itemSize,values:Array.from({length:attr.count*attr.itemSize},(_,i)=>attr.getComponent(Math.floor(i/attr.itemSize),i%attr.itemSize))}}}
 if(n.groups.length)data.groups=n.groups.map(g=>({start:g.start,count:g.count,materialIndex:g.materialIndex??0}));
 n.dispose();return data;
}
export function geometryFromData(data:MeshData):THREE.BufferGeometry {
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
 if(data.uvs)g.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));
 for(const [name,attr] of Object.entries(data.attributes??{}))g.setAttribute(name,new THREE.Float32BufferAttribute(attr.values,attr.itemSize));
 for(const group of data.groups??[])g.addGroup(group.start,group.count,group.materialIndex);
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function meshEditReason(mesh:THREE.Mesh):string|null {
 if((mesh as THREE.SkinnedMesh).isSkinnedMesh)return 'Esta submalla tiene pesos de rig. Su edición de topología todavía no está disponible.';
 if(Object.keys(mesh.geometry.morphAttributes).length)return 'Esta submalla tiene expresiones morph. Su topología se conserva para mantenerlas.';
 if((mesh as THREE.InstancedMesh).isInstancedMesh)return 'Convierte las instancias antes de editar esta submalla.';
 const position=mesh.geometry.getAttribute('position');if(!position||position.itemSize!==3)return 'La submalla no tiene posiciones 3D editables.';
 const count=mesh.geometry.index?.count??position.count;if(count<3||count%3)return 'La submalla no está triangulada.';
 if(count>60000)return 'La submalla supera 20.000 triángulos. Puedes reducirla con Blender antes de editar.';
 const unsupported=Object.keys(mesh.geometry.attributes).filter(key=>!['position','normal','tangent','uv','uv1','uv2','color'].includes(key));
 if(unsupported.length)return 'La submalla tiene atributos especiales que deben conservarse: '+unsupported.join(', ');
 if(mesh.geometry.drawRange.start!==0||Number.isFinite(mesh.geometry.drawRange.count)&&mesh.geometry.drawRange.count<count)return 'La submalla tiene un rango de dibujo parcial.';
 return null;
}
export function setMeshData(mesh:THREE.Mesh,data:MeshData):void {
 const reason=meshEditReason(mesh);if(reason)throw new Error(reason);
 if(data.positions.length/3>60000)throw new Error("La edición supera 20.000 triángulos.");
 const geometry=geometryFromData(data);geometry.userData.genre3dEdited=true;
 const previous=mesh.geometry;mesh.geometry=geometry;
 // Imported instances may share their original geometry. Only dispose owned edits.
 if(previous.userData.genre3dEdited)previous.dispose();
 for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.needsUpdate=true;
}
export type MeshPart={key:string;path:number[];mesh:THREE.Mesh;label:string};
export function meshParts(root:THREE.Object3D):MeshPart[]{
 const result:MeshPart[]=[];
 const walk=(node:THREE.Object3D,path:number[])=>{if(node.userData.editorOnly)return;if((node as THREE.Mesh).isMesh)result.push({key:path.join('/'),path,mesh:node as THREE.Mesh,label:node.name||'Submalla '+(result.length+1)});node.children.forEach((child,index)=>walk(child,[...path,index]))};walk(root,[]);return result;
}

/** Freeze the current morph/skinning pose into an independent static mesh. */
export function bakeEditableCopy(mesh:THREE.Mesh):THREE.Mesh {
 if((mesh as THREE.InstancedMesh).isInstancedMesh)throw new Error('Selecciona una malla individual para crear la copia.');
 const position=mesh.geometry.getAttribute('position');if(!position)throw new Error('La malla no contiene posiciones.');
 mesh.updateWorldMatrix(true,true);
 if((mesh as THREE.SkinnedMesh).isSkinnedMesh){const skin=mesh as THREE.SkinnedMesh;skin.skeleton.bones.forEach(b=>b.updateWorldMatrix(true,false));skin.skeleton.update()}
 const geometry=mesh.geometry.clone(),posed=new THREE.Float32BufferAttribute(new Float32Array(position.count*3),3),vertex=new THREE.Vector3();
 for(let i=0;i<position.count;i++){mesh.getVertexPosition(i,vertex);posed.setXYZ(i,vertex.x,vertex.y,vertex.z)}
 geometry.setAttribute('position',posed);geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.morphAttributes={} as THREE.BufferGeometry["morphAttributes"];
 const data=geometryData(geometry);geometry.dispose();
 const copy=new THREE.Mesh(geometryFromData(data),mesh.material);copy.name=(mesh.name||'Submalla')+' editable';
 mesh.matrixWorld.decompose(copy.position,copy.quaternion,copy.scale);copy.updateMatrixWorld(true);return copy;
}
