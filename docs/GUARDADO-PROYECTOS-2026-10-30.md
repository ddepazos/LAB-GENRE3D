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
- Pruebas de navegador de guardado/recuperación tras cerrar pestaña: pendientes de publicación; no se infieren de los tests del formato.
