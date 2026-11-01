/** Curated third-party anatomical assets. Licenses belong to their authors.
 * Remote imports require the host to permit CORS; manual download remains available.
 */
export type AnatomyCatalogEntry={
 id:string;title:string;description:string;url:string;license:string;attribution:string;source:string;
};
export const anatomyCatalog:AnatomyCatalogEntry[]=[
 {id:'scattering-skull',title:'Cráneo · Khronos ScatteringSkull',description:'GLB de referencia para materiales avanzados y geometría craneal.',url:'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ScatteringSkull/glTF-Binary/ScatteringSkull.glb',license:'Consultar licencia del asset en Khronos',attribution:'Khronos glTF Sample Assets',source:'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ScatteringSkull'},
 {id:'body-anatomy',title:'Cuerpo anatómico · Body Anatomy 3D Viewer',description:'GLB anatómico con compresión Draco; verificar disponibilidad y condiciones de atribución.',url:'https://raw.githubusercontent.com/hpfrei/body-anatomy-3d-viewer/main/public/body.glb',license:'Consultar licencia y condiciones del repositorio',attribution:'hpfrei / Body Anatomy 3D Viewer',source:'https://github.com/hpfrei/body-anatomy-3d-viewer'}
];
