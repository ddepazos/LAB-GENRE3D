# Informe técnico y estado de LAB GENRE3D — 30-10-2026

## Alcance
Proyecto **LAB GENRE3D** (repositorio `ddepazos/LAB-GENRE3D`). Independiente de LAB Studio (`ddepazos/lab`). Todos los cambios indicados se realizaron en `main`; no se crearon ramas.

## Estado de compilación y despliegue
- Cloudflare Pages: `https://lab-genre3d.pages.dev/`, proyecto `lab-genre3d`, rama de producción `main`.
- **Confirmado por API de Cloudflare:** despliegue de commit `ea3f6dabb549bf6529bbdb42bfa6bcefa951418b` con estado `success`, etapa `deploy`, ID `0e96f286-d54d-4045-8dd3-5a5aabac2c8c`.
- El bloqueo anterior de compilación era `TS2322` en `src/meshEngine.ts`, conflicto de tipos de `three-mesh-bvh`. Corregido en commit `721e5327`; compilaciones posteriores exitosas.
- **No equivale a prueba funcional de navegador:** todavía falta comprobar importación real de GLB, manipulación, rigging, timeline y exportaciones de extremo a extremo.

## Cambios incorporados en código
| Área | Implementado | Límites |
| --- | --- | --- |
| Editor 3D | Primitivas cubo/esfera/toro/cono/cilindro, gizmos de mover/rotar/escalar, jerarquía, inspector, duplicar, espejo y materiales básicos | Sin edición de vértices/aristas/caras ni operaciones CSG expuestas |
| GLB | Importación al lienzo, selección desde jerarquía, visibilidad, transformaciones con mouse e inspector, detección de número de huesos/morph targets (`02d3dc7`) | No hay controles vinculados a huesos/morphs, ni validación funcional con archivos reales; JSON de proyecto aún no serializa modelos importados |
| Rostro | Cabeza procedural en módulo Personajes, mandíbula/ojos/cejas/labios/lengua, presets, keyframes e interpolación, reproducción facial 30 FPS (`20fc963`, `d5c4452`, `936d07e`) | No es un rig facial skinned/morph de modelo externo; reproducción y exportación no verificadas |
| Interfaz | Accesos permanentes a Cabeza/Rostro 3D, Mano 3D e Importar GLB en subbarra; menú Rigging/Animar enlaza editor facial (`ea3f6da`) | Paneles extensos, lienzo limitado y menús superpuestos; reorganización compacta pendiente |
| Materiales | 7 presets procedurales y controles de color, metalicidad, rugosidad, wireframe, sombreado | No hay carga completa de mapas PBR externos ni texturas avanzadas solicitadas |
| Animación | Timeline facial del módulo Personajes | Timeline del editor principal sigue sin motor de keyframes de objeto/hueso |
| Exportación | Exportador GLB + manifiesto para LAB Studio en editor principal | Clips skinned/morph no generados por editor; falta probar animación exportable |
| Blender remoto | Servicio Render `lab-genre3d-blender` con despliegue `live` al consultar; cliente `src/blenderRemote.ts` | Ruta same-origin `/api/blender/process` no conectada a gateway seguro/Pages Function; no afirmar procesamiento funcional |

## Cuellos de botella comprobados
1. Arquitectura: primitivas y GLB importados requieren persistencia unificada, selección y edición de mallas.
2. Rigging: el módulo procedural de cabeza/mano no comparte un motor de huesos/morph targets con GLB importados.
3. Animación: timeline de escena es visual; no crea ni exporta clips de transformación.
4. Blender: Render puede estar `live`, pero faltan proxy y autenticación segura en Cloudflare. No exponer tokens ni abrir el endpoint sin validación de identidad.
5. UX: herramientas dispersas en scroll y menús; se añadió acceso directo, pero queda rediseño de paneles.
6. Rendimiento: objetivo de hardware modesto (Intel HD 4000/8 GB); evitar subdivisiones pesadas, texturas grandes y geometría de alta densidad en cada fotograma.

## Orden de implementación recomendado
1. **Pruebas reales**: abrir sitio y GLB conocido; comprobar gizmos, importación, inspector, selección y exportación; documentar errores de consola/red.
2. **Base común de escena**: serialización de modelos importados, jerarquía, historial undo/redo, selección de submallas y controles de vértices/caras/aristas.
3. **RigBindingResolver**: identificar huesos y morph targets por nombre, mostrar controles disponibles y permitir vinculación manual.
4. **Timeline por objeto/hueso/morph**: keyframes, reproducción y exportación `AnimationClip` a GLB.
5. **Materiales PBR**: mapas albedo/normal/roughness/metalness/ao, escala UV y presets avanzados, con límites de resolución.
6. **Blender remoto**: conectar Pages Function/Worker y Render con política de acceso verificable; probar health, archivo GLB y respuesta, sin solicitar ni divulgar claves.
7. **UX**: paneles plegables, acceso contextual, atajos y mayor área de lienzo.

## Registro de commits relevantes
- `20fc963`: parámetros faciales adicionales.
- `d5c4452`: keyframes e interpolación facial.
- `936d07e`: reproducción facial a 30 FPS.
- `721e532`: corrección TS2322 de BVH que bloqueaba Cloudflare.
- `02d3dc7`: importación GLB al editor principal.
- `ea3f6da`: accesos visibles a cabeza, mano e importación GLB.

## Criterio de verificación
**Código incorporado** ≠ **compilación exitosa** ≠ **despliegue publicado** ≠ **función probada en navegador**. Registrar por separado los cuatro estados. No modificar LAB Studio ni crear ramas nuevas. Mantener `main` y evitar ciclos de despliegue sin comprobar logs.
