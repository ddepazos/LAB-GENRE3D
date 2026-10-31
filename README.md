# LAB GENRE3D — LAB Motion 3D

**Arquitectura y hoja de ruta actualizadas · 30 octubre 2026**
> **Estado actual: versión funcional en desarrollo. La implementación completa sigue pendiente.** Consulta el [registro maestro de requisitos abiertos y criterios de cierre](docs/PENDIENTES-MAESTROS-GENRE3D.md). Incluye 2D→3D, Grease Pencil, modelos detallados, PBR/UV, rigging avanzado y scripts; no deben darse por terminados por la existencia de una base funcional.


**Aplicación:** https://lab-genre3d.pages.dev/  
**Repositorio exclusivo:** https://github.com/ddepazos/LAB-GENRE3D  
**Diseño Figma:** https://www.figma.com/design/ZEmZOrTCx7sbsblQ4e8qyD

> Estado: repositorio y despliegue existentes; las capacidades descritas a continuación son requisitos y objetivos de implementación, no funciones verificadas. No confundir con LAB Studio (`ddepazos/lab`).

## Propósito
Editor web independiente para modelado 3D, personajes de alta fidelidad, rigging facial y corporal, materiales PBR, animación por capas y exportación para After Effects, Premiere, Blender y LAB Studio. Mantener la edición directa con mouse, jerarquías, herramientas y escenas existentes.

## Stack actual verificado
React 18, TypeScript, Vite, Three.js 0.175, React Three Fiber, Drei, Zustand y Monaco. **Three.js sigue como único motor gráfico del viewport.** No introducir Babylon.js ni duplicar renderer, cámara o escena.

## Arquitectura modular propuesta
- **Editor React:** paneles compactos, inspector contextual, timeline por objeto/hueso, undo/redo y persistencia versionada.
- **Three.js / R3F:** escena, GLB/glTF, `SkinnedMesh`, `Skeleton`, morph targets, materiales PBR, iluminación y transformaciones.
- **RigBindingResolver:** inspección real de nodos GLB, diccionarios de morphs, bones, rest pose, ejes locales, límites y mapa de alias configurable por personaje. Nunca simular una deformación si el rig no existe; informar ausencia y ofrecer vinculación manual.
- **RigController:** estado de expresión independiente del viewport, animación y exportación. Priorizar morph target válido o bone calibrado, sin duplicar deformación; resolver conflictos con clips del timeline.
- **ModelingCore:** operaciones de geometría aisladas del editor; evaluar `three-mesh-bvh` para raycast y `three-bvh-csg` para booleanas, tras pruebas de compatibilidad. Extrusión, bisel, subdivisión, espejo y edición por mouse.
- **MaterialLab:** `MeshStandardMaterial` / `MeshPhysicalMaterial`, mapas baseColor, normal, roughness, metalness, AO, emissive, alpha, UV y máscaras; biblioteca de piel, escamas, pelaje, cuero, tela, metal, hueso, fuego y superficies biomecánicas. Pintura 3D como fase posterior.
- **Procesamiento externo opcional:** Blender para baking, rigging complejo, conversión y render pesado; FFmpeg para codificación compatible. No integrar Blender como segundo renderer web.
- **Interop:** GLB/glTF + manifiesto JSON versionado (unidades, ejes, FPS, clips, materiales, licencias); intercambio con LAB Studio sin compartir estado interno. Los cambios de compatibilidad en su repositorio fueron autorizados posteriormente por el usuario.

## Preset de personaje solicitado
| Control | Valor inicial | Aplicación |
|---|---:|---|
| Mandíbula | 55% | `jawOpen` / `mouthOpen` morph real o bone `jaw` calibrado |
| Cejas | −7% | `browDownLeft/Right` o bones locales calibrados; conservar signo |
| Rotación Y | 70° | Rotación relativa a orientación de importación, no sobreescribir cámara |
| Calidad | high | Perfil PBR de alta calidad con degradación dinámica para equipos modestos |

**Reglas de vinculación:** detectar y listar morph targets reales por `morphTargetDictionary`; localizar `Bone` y `SkinnedMesh` en jerarquía; registrar transformaciones de reposo; validar ejes y límites específicos por personaje; soportar nombres ARKit/variantes mediante alias editables; mantener referencias al modelo original; probar boca, cejas y rotación con GLB real antes de afirmar compatibilidad. Si falta el canal, mostrar “sin rig” y permitir asignación manual. El valor −7% requiere descenso facial real; no usar `clamp(−7,0,100)`.

## Calidad y rendimiento
- Perfil low/medium/high configurable; High no equivale automáticamente a 4K ni a geometría más detallada.
- Texturas 1K/2K en edición; 4K para modelos seleccionados y exportación cuando memoria y UV lo permitan; 8K solo procesamiento especializado.
- LOD, carga diferida, límites de DPR, compresión de texturas cuando sea compatible, eliminación de recursos GPU no usados y medición de FPS/memoria.
- Microrelieve mediante normal/bump; desplazamiento real solo cuando la malla y rendimiento lo soporten.
- Materiales y texturas con autor, procedencia y licencia.

## Interfaz Figma — pantallas/flujo
Archivo → Importar GLB → Inspeccionar rig → Vincular huesos/morph targets → Manipular personaje → MaterialLab → Timeline por capas → Exportar. Inspector contextual: mandíbula, cejas, rotación Y, calidad, advertencias de canales ausentes y edición con mouse. Mantener layout compacto y paneles plegables.

## Exportación
MVP: GLB/glTF animado y secuencia PNG RGBA transparente. Verificar reimportación en Blender y alfa en After Effects. Futuro: FBX, EXR, ProRes 4444 con alfa, WebM alfa, MP4 para preview y GIF (sin transparencia avanzada). No afirmar soporte sin pruebas.

## Entregables y aceptación
1. Importar GLB sin pérdida de jerarquía y detectar bones/morphs.
2. Mandíbula 55%, cejas −7% y rotación 70° aplicados al modelo real y visibles con mouse.
3. Materiales PBR high sin romper selección, cámara, lápiz o editor existente.
4. Timeline no sobrescribe controles sin regla explícita de mezcla.
5. Guardar/reabrir valores y exportar/reimportar GLB animado.
6. Probar build, errores de consola, FPS y exportación antes de publicar.

## Política de cambios
Mantener repositorios separados y trabajar desde `main`, sin ramas nuevas. Los cambios de compatibilidad en `ddepazos/lab` cuentan con autorización posterior; no rehacer ni romper su editor 2D/lápiz. Validar compilación y funcionamiento antes de producción. Documentar cada cambio y no confundir diseño, implementación y despliegue.

## Manipulación directa de mallas en viewport — requisito prioritario
**No sustituir por sliders:** todos los objetos, mallas y controladores de rig deben poder seleccionarse y editarse con el mouse en el viewport existente.

- **Modo Objeto:** raycasting, selección visible, gizmos de mover/rotar/escalar, arrastre con mouse, pivot local/global, snapping, ejes X/Y/Z y multiselección.
- **Modo Vértice:** selección de vértices individuales o grupos, box/lasso selection, movimiento interactivo, edición simétrica opcional y actualización de posiciones/normales/bounds de `BufferGeometry`.
- **Modo Arista y Cara:** selección indexada con mapeo triángulo→cara lógica, extrusión, inset, bevel, subdivisión y transformaciones con preview no destructiva; preservar UV y normales cuando sea posible.
- **Modo Rig/Pose:** picking de huesos y controladores visibles, manipulación de articulaciones con gizmos y límites calibrados; no editar accidentalmente la malla base cuando se posa un personaje.
- **Modo Sculpt/Paint posterior:** pinceles de deformación, smooth, máscaras, weight paint y pintura PBR sobre UV.

**Diseño técnico:** `Raycaster` / `three-mesh-bvh` opcional para picking; `TransformControls` de Drei/Three para transformaciones de objetos; editor propio de subelementos sobre `BufferGeometry`, con IDs de selección estables, operaciones en coordenadas locales, actualización de `position`, `normal`, `boundingBox`/`boundingSphere`, manejo de geometrías compartidas y descarte de buffers GPU antiguos. No modificar directamente una geometría de `SkinnedMesh` sin separar edición base de deformación animada. Integrar `OrbitControls` para suspender navegación durante drag, atajos y undo/redo transaccional. El sistema de selección debe convivir con la cámara, las capas y la timeline existentes.

**Pruebas mínimas:** arrastrar objeto con mouse; mover un vértice y conservar forma al guardar/reabrir; seleccionar cara y extruir; rotar un hueso sin alterar geometría base; verificar picking sobre GLB importado; comprobar undo/redo y ausencia de interferencia con OrbitControls. **Estado: especificado, no verificado como implementado.**
