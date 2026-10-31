# Auditoría focalizada de edición de mallas y puente Blender — 2026-10-31

## Alcance y evidencia
Inspección estática en `main` de `package.json`, `src/main.tsx`, `src/EditableMesh.tsx`, `src/meshData.ts`, `src/meshEngine.ts`, `src/blenderRemote.ts`, `README.md` y `docs/PENDIENTES-MAESTROS-GENRE3D.md`. Sin compilación ni prueba de navegador en esta revisión. No se modificó LAB Studio.

## Implementación confirmada por lectura de código
- React 18, Three.js 0.175, R3F, Drei, Zustand, BVH y CSG.
- `TransformControls` para objetos y componentes; `EditableMesh` permite selección triangular de vértices/aristas/caras y arrastre al soltar el gizmo.
- `faceOperation` genera tapas laterales para extrusión/inset; `bevelEdge` restringe biseles a aristas convexas de soporte.
- `meshData` convierte geometrías indexadas a no indexadas, conserva ciertos atributos/UV y bloquea topología de `SkinnedMesh` y morphs.
- `blenderRemote` llama `/api/blender/process` para `smooth`, `subdivide`, `decimate`, `normals`, con validación GLB y límites de tamaño.
- Exportación GLB y PNG RGBA presente en `main.tsx`; funcionamiento final no verificado aquí.

## Riesgos concretos para corregir por etapas
1. **Selección de cara lógica:** `EditableMesh` trabaja con `faceIndex` triangular; una cara de cubo compuesta por dos triángulos no se trata como polígono único. Introducir agrupación coplanar controlada, sin modificar IDs existentes hasta probar migración.
2. **Selección limitada:** `setIndices(all)` reemplaza la selección en cada clic. Falta selección aditiva, caja/lazo y atajos documentados.
3. **Edición no destructiva:** la geometría cambia al soltar el gizmo; falta preview transaccional con confirmar/cancelar y recuperación de errores.
4. **Atributos:** `EditableMesh` usa una geometría auxiliar solo con posiciones; la malla principal debe preservar UV, grupos y atributos tras toda operación. Añadir pruebas con GLB multimaterial.
5. **Gizmo y cámara:** verificar interferencia de `TransformControls` con `OrbitControls` durante drag y con edición de submallas importadas mediante portal.
6. **Bisel/extrusión:** añadir pruebas de manifold, winding, normales, UV y materiales antes de ampliar operaciones a geometría arbitraria.
7. **Rigging:** `meshEditReason` rechaza topología de mallas con skin/morph. Mantener el bloqueo hasta disponer de remapeo seguro de pesos y targets.
8. **Blender Bridge:** endpoint web configurado no equivale a servicio remoto disponible. Verificar servicio `lab-genre3d-blender`, conservación de materiales/animaciones y errores de red antes de anunciarlo operativo.

## Integración prudente de Build 3D Game Rooms
Reutilizar **conceptos** de validación geométrica, manifiestos de activos y controles de calidad; no copiar scripts externos sin revisar dependencias y licencia. No introducir Meshy de pago sin autorización explícita ni credenciales en repositorio. Blender sigue como servicio externo opcional, no renderer web.

## Próxima entrega técnica
1. Añadir pruebas unitarias de selección/transformación y preservación de UV/materiales.
2. Implementar multiselección aditiva y cancelación de arrastre sin romper `EditableMesh`.
3. Verificar compilación `npm run build` y pruebas reales de UI antes de despliegue.
4. Continuar G01/G02/G03/G04 según registro maestro.

**Estado:** auditoría estática documentada; sin afirmaciones de compilación, despliegue o pruebas funcionales.
