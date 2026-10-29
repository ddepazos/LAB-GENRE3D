# LAB GENRE3D — LAB Motion 3D
**Documento fundacional · 29 de octubre de 2026 · Estado: propuesta, no implementado**

Aplicación web independiente para modelado 3D, rigging, animación y exportación profesional, integrable en el futuro con el ecosistema LAB Creative Suite. Referencias de experiencia y capacidades: Cinema 4D (jerarquías y modificadores), Blender (modelado, armatures y curvas), Mixamo (rigging asistido y clips) y Substance 3D Painter (materiales PBR). No se reutilizarán recursos propietarios sin licencia.

## Objetivos
- Modelar y editar objetos 3D mediante gizmos de traslación, rotación y escala, selección con mouse y jerarquías.
- Modificadores no destructivos: extrusión, bevel, subdivisión, espejo, booleanas, curvas, deformación y duplicación procedural.
- Rigging manual: huesos, armatures, parenting, skinning, weight painting, constraints, IK/FK y controladores visibles.
- Rigging asistido posterior: puntos guía, generación inicial de esqueleto, corrección de pesos y retargeting.
- Animación independiente por objeto y hueso: keyframes, dope sheet, curvas, clips, loops, capas, mezclas y procedimientos.
- Biblioteca de personajes (humanos, animales, criaturas), objetos, robots, geometrías abstractas y recursos propios/importados.
- Materiales PBR: base color, metallic, roughness, normal, emissive, alpha, máscaras y texturas avanzadas (pieles, metal, fuego estilizado, vidrio, piedra, textiles y biomecánico).
- Composición con fondo transparente para After Effects y Premiere Pro; integración con LAB Studio y flujos hacia Blender e Illustrator.

## Interfaz propuesta
Barra superior Archivo / Modelar / Rigging / Animar / Materiales / Exportar; barra compacta de herramientas; viewport 3D central; árbol de escena/jerarquías y propiedades a la derecha; timeline multicapas redimensionable y contraíble abajo. Manipulación directa con mouse, estados claros, undo/redo y guardado recuperable. Economía funcional: controles contextuales y paneles plegables.

## Formatos y criterios de interoperabilidad
| Formato | Propósito | Fase |
|---|---|---|
| GLB/glTF | Geometría, materiales PBR, esqueletos y animaciones compatibles | MVP |
| PNG RGBA secuencial | Fotogramas con alfa para composición | MVP |
| OBJ/MTL | Mallas y materiales básicos, sin rig | Fase 2 |
| FBX | Intercambio de personajes/animaciones, con pruebas de compatibilidad | Fase 2 |
| OpenEXR RGBA | Composición de alta profundidad | Fase 2 |
| MOV ProRes 4444 | Video con alfa, sujeto a encoder validado | Fase 2 |
| MP4 H.264 | Previsualización sin transparencia | Fase 2 |
| WebM con alfa / GIF | Loops; verificar compatibilidad y límites de alfa | Fase 2 |
| USD/USDZ, Alembic, STL | Escenas, caché de geometría y fabricación según formato | Posterior |

No prometer preservación total de modificadores, rigs, materiales ni animaciones al intercambiar formatos: definir matriz de compatibilidad y pruebas de ida y vuelta.

## Arquitectura candidata (por validar)
React + TypeScript + Vite para UI; Three.js para viewport, escena y animación; núcleo de geometría/modificadores desacoplado; rigging y edición de pesos como subsistemas; formato de proyecto versionado con esquema y migraciones; almacenamiento local inicial. Blender opcional como servicio de conversión/baking, FFmpeg para codificación, y cómputo remoto separado para render pesado. Cloudflare podría alojar la web y coordinar trabajos, sin asumir que Workers ejecuta render pesado directamente.

## Contrato de integración con LAB Studio
Ambas aplicaciones mantienen repositorios y despliegues independientes. Intercambio inicial mediante GLB/glTF y manifiesto JSON versionado de recursos, unidades, ejes, FPS, duración, materiales, nombres de clips y rutas. No compartir estado interno ni modificar el código de LAB Studio sin contrato probado.

## MVP — criterios de aceptación
1. Crear/guardar/reabrir escena y cargar un GLB sin perder jerarquías compatibles.
2. Seleccionar y transformar objetos con mouse y gizmos; undo/redo.
3. Crear/editar huesos, enlazar una malla, ajustar pesos básicos y animar con keyframes.
4. Timeline por objeto/hueso con reproducción estable, pausa y loop.
5. Aplicar materiales PBR de biblioteca con licencia documentada.
6. Exportar GLB animado y PNG RGBA secuencial; reimportar GLB en Blender y comprobar animación; verificar alfa de PNG en After Effects.
7. Probar cada herramienta individualmente y registrar fallos reproducibles antes de expandir funciones.

## Fases
- **Fase 0:** especificaciones, prototipo de interfaz, esquema de proyecto, decisiones de licencias y pruebas de formatos.
- **Fase 1 (MVP):** escena, viewport, transformaciones, armature básico, keyframes, materiales, GLB y PNG RGBA.
- **Fase 2:** IK/FK, weight painting avanzado, curvas y capas, biblioteca, FBX, EXR, ProRes 4444 y adaptadores.
- **Fase 3:** rigging asistido, retargeting, modificadores complejos, simulación y render remoto.
- **Fase 4:** integración bidireccional estable con LAB Studio y herramientas Adobe mediante puentes probados.

## Riesgos y reglas de ingeniería
- Priorizar rendimiento en hardware modesto: LOD, carga diferida, límites de textura y render escalable.
- No repetir fallos de LAB: evitar controles sin efecto, importación frágil, transformaciones no manipulables, exportaciones falsas, autenticaciones innecesarias y cambios que rompan funciones existentes.
- Tests unitarios, de integración y E2E por herramienta; matriz de exportación; builds reproducibles; registro de decisiones y errores.
- Sin crear ramas innecesarias ni mezclar código con LAB Studio. No afirmar que una función está terminada sin prueba real.
- Biblioteca con procedencia, autor, licencia y restricciones por recurso.

**Estado:** documentación inicial aprobada como dirección conceptual; implementación, diseño detallado, cronograma y compatibilidad real pendientes de validación.
