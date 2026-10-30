# LAB Genre3D — Especificación UX, flujos e interoperabilidad
Fecha: 2026-10-29. Repositorio: ddepazos/LAB-GENRE3D. Figma: https://www.figma.com/design/ZEmZOrTCx7sbsblQ4e8qyD

## Estado confirmado por inspección de código
- Editor React/R3F/Three.js en src/main.tsx: primitivas, selección de objeto, TransformControls (traslación/rotación/escala), OrbitControls, jerarquía, inspector, materiales procedurales 256px, guardado/carga JSON, timeline visual todavía sin keyframes.
- Biblioteca de personajes y mano articulada son vistas separadas; NO hay evidencia de que sus escenas formen parte de la exportación actual.
- src/labInterop.ts agrega GLTFExporter y descarga GLB + manifiesto JSON, y src/main.tsx conecta botón «Enviar a LAB Studio (GLB)» a un group del editor principal. Sin build ni prueba de reimportación verificados.
- NO existe un receptor del manifiesto en LAB Studio confirmado. NO afirmar interoperabilidad bidireccional completa.
- La exportación actual pasa `clips: []` implícitamente: no exporta animación del timeline todavía. GLTFExporter exporta datos compatibles presentes en el group, no genera rig ni morphs ausentes.
- No existe todavía edición de vértices, aristas y caras mediante mouse, ni sculpt profesional.

## Flujo 1 — Exportación desde Genre3D
1. Usuario trabaja en viewport 3D y selecciona objetos.
2. Activa Archivo/Exportar → Enviar a LAB Studio (GLB).
3. Validar mallas exportables; mostrar error si no existen.
4. GLTFExporter serializa grupo visible en GLB; genera manifiesto schema=lab.creative-suite.asset version=1 con nombre, unidades, ejes, FPS, nombres/duración de clips y conteos.
5. Descarga archivos independientes .glb y .lab.json. Mostrar resultado/errores en UI futura.
6. Validación pendiente: importar GLB en Three.js/Blender; verificar jerarquías, materiales, transformaciones y nombres; verificar que no se exportan helpers/gizmos.
**Nota:** no hay botón de transferencia remota ni importación automática en LAB Studio. «Enviar» actualmente significa descargar paquete.

## Flujo 2 — Recepción en LAB Studio (diseño, NO implementado)
1. Importar GLB + .lab.json desde panel de recursos.
2. Verificar schema/version y compatibilidad; rechazar rutas inseguras y formatos inválidos.
3. Mostrar preview 3D y resumen: meshes, bones, morphs, clips, unidades, escala.
4. Crear capa 3D independiente sobre composición 2D sin modificar lienzos existentes.
5. Controlar posición/rotación/escala, opacidad, visibilidad, orden, loop y reproducción de clips.
6. Guardar referencia al asset y detectar revisiones; conservar ajustes locales al reemplazar GLB.
7. Errores: falta de manifiesto (importación GLB manual), materiales no compatibles, rig ausente, clip no soportado, archivo demasiado grande.
**Contrato:** mantener repos y despliegues separados; sin sincronización de estado interno.

## Flujo 3 — Modelado por mouse (diseño, NO implementado)
- Objeto: raycast → seleccionar → gizmo X/Y/Z → drag → commit undo/redo → persistencia.
- Vértice: entrar modo edición → picking subelemento → selección múltiple → mover → actualizar buffer/normales/UV/bounds → guardar.
- Arista/cara: seleccionar arista o cara lógica → extrusión/bevel/inset → preview → confirmar/cancelar → actualizar topología.
- Pose: seleccionar hueso/controlador → rotar con límites → conservar rest pose → keyframe sin destruir geometría base.
- Estado visual: hover, seleccionado, bloqueo, error, guardando; shortcuts y accesibilidad.

## Flujo 4 — Rig facial detallado (diseño, NO implementado)
Importar GLB → inspeccionar SkinnedMesh/Skeleton/Bones/morphTargetDictionary → asignar alias → calibrar eje/neutral → mandíbula 55%, cejas −7%, rotación Y 70° → reproducir timeline → exportar clips compatibles. Si no hay rig, mostrar «sin canal», nunca fingir deformación.

## Flujo 5 — MaterialLab y rendimiento (diseño)
Elegir malla → UV/slots → PBR baseColor/normal/roughness/metalness/AO/alpha → preview low/medium/high → presupuesto de memoria y LOD → exportación. No confundir textura 4K con detalle geométrico. Equipos modestos: DPR limitado, lazy load, texturas 1K/2K en edición y 4K opcional en exportación.

## Componentes Figma y criterios de detalle
Cada pantalla debe incluir encabezado, navegación, jerarquía, viewport, inspector contextual, timeline, controles con valores y unidades, estado hover/active/disabled, confirmación y error; diagramas de flechas con decisiones, notas de implementación y criterios de aceptación. Capas Figma editables, no una captura plana.

## Criterios de aceptación
A1: objeto seleccionable y arrastrable con mouse, undo/redo.
A2: malla editable en vértices/aristas/caras con persistencia.
A3: jaw/brow rig real responde sin duplicación bone+morph.
A4: GLB + JSON exportados; reimportación conserva geometría y materiales compatibles.
A5: animaciones reales se conservan en GLB y se reproducen en LAB Studio.
A6: composición 2D y editor existente no se rompen.
A7: build TypeScript/Vite, pruebas E2E y despliegue verificados antes de marcar completado.

## Riesgos técnicos y pendientes inmediatos
- GLTFExporter con objetos R3F: probar manejo de texturas procedurales y `TransformControls` dentro del árbol, además de recursos `SkinnedMesh`.
- El botón descarga dos archivos y no confirma recepción por LAB Studio; ajustar texto o incorporar un empaquetado ZIP cuando esté validado.
- Las vistas HandLab y CharacterLab no se incluyen en el grupo exportado: diseñar un SceneAssetRegistry común.
- La capa importadora LAB Studio debe diseñarse/probarse por separado, sin tocar su código hasta validar contrato.
- No confundir Figma diseñado con React implementado, ni commit GitHub con Cloudflare desplegado.
