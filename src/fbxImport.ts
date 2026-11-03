import * as THREE from 'three';

export const FBX_INPUT_LIMIT = 150 * 1024 * 1024;
export const FBX_GLB_LIMIT = 40 * 1024 * 1024;
export type FbxImportStats = {meshes:number;bones:number;clips:number;textures:number};
export type FbxPrepared = {root:THREE.Group;clips:THREE.AnimationClip[];textures:THREE.Texture[];stats:FbxImportStats};

/** FBX is parsed only on explicit user import. The source never alters an existing scene. */
export async function parseFbxFile(file:File):Promise<FbxPrepared>{
  if(!/\.fbx$/i.test(file.name))throw new Error('Selecciona un archivo .fbx.');
  if(file.size>FBX_INPUT_LIMIT)throw new Error('El FBX supera 150 MB. Usa la conversión remota con Blender.');
  const {FBXLoader}=await import('three/examples/jsm/loaders/FBXLoader.js');
  const root=new FBXLoader().parse(await file.arrayBuffer(),'');
  root.name=file.name.replace(/\.fbx$/i,'');
  const clips=root.animations??[];
  const textures=new Set<THREE.Texture>();
  let meshes=0,bones=0;
  root.traverse(node=>{
    if((node as THREE.Bone).isBone)bones++;
    const mesh=node as THREE.Mesh;
    if(!mesh.isMesh)return;
    meshes++;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const material of mats){
      if(!material)continue;
      for(const value of Object.values(material)){
        if(value&&typeof value==='object'&&(value as THREE.Texture).isTexture)
          textures.add(value as THREE.Texture);
      }
    }
  });
  if(!meshes)throw new Error('El FBX no contiene mallas visibles. Puede ser una animación sin personaje (Without Skin).');
  return {root,clips,textures:[...textures],stats:{meshes,bones,clips:clips.length,textures:textures.size}};
}

function imageSize(image:unknown):{width:number;height:number}{
  if(!image||typeof image!=='object')return {width:0,height:0};
  const i=image as {naturalWidth?:number;naturalHeight?:number;width?:number;height?:number};
  return {width:i.naturalWidth||i.width||0,height:i.naturalHeight||i.height||0};
}

/** FBX may contain embedded PNG/JPEG images decoded after parse() returns. */
export async function waitFbxTextures(textures:THREE.Texture[],maxMs=15000){
  for(const texture of textures){
    const deadline=Date.now()+maxMs;
    while(true){
      const image=texture.image as (HTMLImageElement&{complete?:boolean})|undefined;
      const dimensions=imageSize(image);
      const ready=dimensions.width>0&&dimensions.height>0&&(!(image&&'complete' in image)||Boolean(image?.complete));
      if(ready)break;
      if(Date.now()>=deadline)throw new Error('No se pudo decodificar una textura FBX incrustada. Comprueba las imágenes y vuelve a exportar el FBX desde Blender.');
      await new Promise<void>(resolve=>setTimeout(resolve,100));
    }
  }
}

/** Reduce images only when necessary to respect browser/GLB size constraints. */
export function shrinkFbxTextures(textures:THREE.Texture[],maxDimension:number){
  if(!Number.isInteger(maxDimension)||maxDimension<64)throw new Error('Límite de textura inválido');
  let changed=0;
  for(const texture of textures){
    const image=texture.image as CanvasImageSource|undefined;
    if(!image)continue;
    const {width,height}=imageSize(image);
    if(!width||!height||Math.max(width,height)<=maxDimension)continue;
    const factor=maxDimension/Math.max(width,height);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*factor));canvas.height=Math.max(1,Math.round(height*factor));
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('No se pudo preparar una textura optimizada');
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    try{ctx.drawImage(image,0,0,canvas.width,canvas.height)}
    catch{throw new Error('La textura FBX no se pudo dibujar para exportación. Convierte el modelo con Blender.')}
    texture.image=canvas;texture.needsUpdate=true;
    changed++;
  }
  return changed;
}
