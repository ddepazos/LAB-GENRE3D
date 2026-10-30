# Guardado de proyectos GENRE3D — 30 octubre 2026

## Comportamiento
«Guardar proyecto» prepara `genre3d-proyecto.json` y conserva una copia del último guardado en este navegador (IndexedDB). «Abrir proyecto» permite elegir el archivo. «Recuperar guardado» recupera la copia local incluso tras cerrar la pestaña. No se carga automáticamente ni se reemplaza una escena al iniciar.

La copia del navegador es única por origen/perfil. Otro guardado la reemplaza. Borrar datos del sitio o usar otro navegador no permite recuperarla; conservar el archivo descargado para trasladar o respaldar proyectos.

## Contenido del formato v2
- Primitivas: geometría editada, UV, nombre, color, material procedural, parámetros de material, visibilidad, posición, rotación y escala.
- Modelos: GLB original incrustado en base64. Conserva recursos incluidos, materiales, texturas, skinning y clips originales sin reexportarlos.
- Estado de cada nodo: transformaciones, visibilidad y pesos de morph targets; rutas de hijos estables sobre el GLB original.
- Rig: pose actual, rotaciones de reposo y keyframes creados en GENRE3D.
- Mano procedural: pose y flexión de dedos.
- Personaje procedural: tipo, movimiento seleccionado, velocidad, articulaciones, rostro, fotograma y keyframes faciales. Se restaura pausado.
- Editor: fotograma del rig, repetición, retícula, fondo alfa, timeline y selección. Se restablece en modo Objeto y se limpia el historial de malla anterior.

Los archivos v1 anteriores (solo primitivas) se siguen abriendo y reemplazan la escena completa. No contienen modelos GLB que no hubieran sido guardados por aquella versión.

## Integridad y límites
- 128 MB por proyecto; 40 MB por GLB; máximo 200 GLB y 2000 primitivas, sujetos al tamaño total.
- GLB debe ser autónomo: sin URI externas. Evita un proyecto que dependa de archivos o URLs perdidos.
- Validación de versión, IDs únicos, vectores y números finitos, malla/UV, jerarquía, pose de reposo y dimensiones de keyframes.
- Toda la lectura y reconstrucción termina antes de cambiar el estado de React. Un archivo inválido conserva la escena actual y muestra un error.
- No se guardan credenciales, sesión de Cloudflare, historial Deshacer, cámara orbital ni el tiempo exacto de un movimiento corporal procedural en ejecución. Los clips importados se conservan; esto no añade un nuevo reproductor/exportador de esos clips.

## Pruebas antes de publicación
- `npm run build`: TypeScript y Vite correctos (advertencia conocida de bundle >500 KB).
- `node tests/project-persistence.mjs`: dos ciclos guardar/abrir, geometría/UV/material, rig skinned de dos huesos, pose no neutra, morph, clip original, keyframes del rig, ajustes del editor, mano, personaje y keyframes faciales.
- Compatibilidad v1 comprobada. Rechazo de versión desconocida, IDs duplicados, vectores inválidos, GLB corrupto, rutas de nodo inválidas, keyframes incompatibles, fotogramas y poses de mano fuera de rango, y referencias GLB externas.
- Pruebas de navegador de guardado/recuperación tras cerrar pestaña: completadas después de publicar; resultados detallados a continuación.

## Prueba real de recuperación tras cerrar pestaña
Versión de guardado `eb59491` y ajuste de mensajes `54a5afe`, publicados en Cloudflare con estado deploy success (despliegues `5b392d1d-fb35-4d90-b014-bf393d17b882` y `aad8bd54-1794-43d4-9de0-2943ef614e37`).

1. Se preparó un «Cubo de respaldo» en X=-1.5 y un modelo `blender-smooth-escena.glb` en X=3. Se configuró fotograma 17, retícula oculta y fondo alfa.
2. Mano: pose Puño (pulgar 65°, índice y demás dedos 90°).
3. Personaje: Robot, rostro Sorpresa (mandíbula 45°), un keyframe facial.
4. Se pulsó Guardar proyecto, se cerró esa pestaña y se abrió una nueva desde producción.
5. «Recuperar guardado» devolvió la primitiva y el GLB con transformaciones y ajustes. La interfaz mostró el proyecto abierto y dos objetos en la jerarquía.
6. Se reabrieron Mano y Cabeza: Puño, mandíbula 45°, Robot y keyframe facial conservados; personaje pausado al restaurar.

Resultado: **aprobado el guardado/recuperación persistente desde el navegador**, incluyendo modelo importado y módulos. Captura: `evidencias/proyecto-recuperado.jpg`.

Los rigs skinned, morph targets, clips y keyframes del rig se verificaron en el test del formato con un GLB sintético; no se atribuyen a esta escena de dos cubos sin rig. La apertura del archivo desde el selector nativo y la terminación de la descarga en el sistema operativo no se verificaron por separado; la copia recuperable usa exactamente el Blob JSON preparado para descargar y el mismo lector `openProject`.

La consulta de consola durante la recuperación solo mostró errores de una extensión MetaMask ajena a GENRE3D; no se modificó esa extensión. No se repitieron las auditorías de botones ni las pruebas geométricas anteriores.
