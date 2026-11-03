# LAB-GENRE3D — Motor Python web, automatización y Blender

**Fecha:** 2026-11-03  
**Estado:** decisión de diseño y hoja de ruta; **no implementado íntegramente**  
**Documento principal:** [Arquitectura híbrida Blender + Three.js](./ARQUITECTURA-HIBRIDA-BLENDER-THREEJS-2026-11-03.md)  
**Principio:** emplear motores profesionales probados, no reinventar un DCC, conservar las funciones útiles y no reactivar bibliotecas anatómicas experimentales descartadas.

## 1. Decisión

LAB-GENRE3D ofrecerá **automatización Python accesible desde el navegador**. El navegador representa el editor, los controles y la salida visual; **Blender con su API Python `bpy` y BMesh** ejecuta las tareas de procesamiento avanzado en un servicio aislado. Una API autenticada orquesta solicitudes, estados, archivos y resultados.

**No equivale a ejecutar Blender dentro de React, ni a instalar Python libremente en el navegador.** Python puede tener un modo ligero local opcional (Pyodide) para operaciones puras y demostraciones, pero no para importar FBX gigantes, manipular la escena real de Blender ni ejecutar procesos DCC pesados.

No crear otro motor 3D: continuar con Three.js/React Three Fiber para visualización/interacción y reutilizar Blender para la autoría y el cálculo profesional.

## 2. Base existente que debe reutilizarse

El repositorio ya contiene:
- `tools/blender/genre3d_bridge.py`: operaciones **smooth, normals, subdivide, decimate** sobre GLB mediante Blender headless.
- `tools/blender/http_server.py`: servidor Python autenticado que invoca Blender como subproceso.
- `tools/blender/Dockerfile`: entorno de Blender en Render.
- `cloudflare/genre3d-blender-gateway.js` y `functions/api/blender/[[path]].js`: ruta protegida desde Cloudflare Pages.
- UI del editor en React/Three.js; reproductor de clips GLB y sistema de escena.

Ver [BLENDER-BRIDGE.md](./BLENDER-BRIDGE.md) para resultados y límites comprobados. El flujo actual de Blender remoto **admite GLB, no FBX**; usa **12 MB de entrada**, **40 MB de salida**, **90 s** por operación y **un proceso concurrente**. No asumir que subir esos límites sin rediseño sea suficiente para un FBX de ~100 MB.

No reescribir lo anterior por introducir FastAPI: **FastAPI es una opción para evolucionar la API**, no condición de la primera etapa. Mantener el gateway y las protecciones actuales en cualquier migración.

## 3. Arquitectura objetivo

```text
LAB-GENRE3D (React/TypeScript)
  ├─ Visor Three.js / React Three Fiber
  ├─ Modelado con controles, ratón y tableta
  ├─ Timeline, rig y clips previsualizables
  └─ Panel «Automatización Python» (propuesto)
       ├─ Editor de scripts/recetas y ejemplos
       ├─ Validación y vista previa de parámetros
       ├─ Ejecutar / cancelar / progreso / registro seguro
       └─ Historial de trabajos y resultados
                │ HTTPS autenticado
                ▼
Cloudflare Access + gateway (actual, a ampliar)
                │
                ▼
API y cola de trabajos (nueva capacidad)
  ├─ Autorización por usuario y proyecto
  ├─ Catálogo de operaciones permitidas (primera etapa)
  ├─ Estado, progreso, cancelación y límites
  └─ Versiones de assets y registros acotados
                │
                ▼
Blender headless + bpy / BMesh (Render existente, a ampliar)
  ├─ Importación FBX / OBJ / GLB
  ├─ Inventario de escena, armatures, materiales, acciones
  ├─ Modelado, modificadores, UV, rigging y animación
  └─ Exportación GLB y archivo maestro editable
                │
                ▼
Validación / optimización / almacenamiento (a integrar)
  ├─ glTF Transform, Meshopt, KTX2 según compatibilidad
  ├─ Original + derivado + metadatos/hash
  └─ GLB de preview a GENRE3D / intercambio a LAB Studio
```

### Separación de responsabilidades

| Capa | Tecnología | Qué resuelve |
|---|---|---|
| UI y viewport | React, TS, Three.js, R3F | Gizmos, selección, reproducción, paneles, preview |
| Orquestación | Gateway actual; API Python actual/evolucionada | Autenticación, trabajos, estados, validación, transferencias |
| Autoría profesional | Blender, bpy, BMesh | Mallas, extrusión, bisel, rigs, pesos, FBX, baking |
| Kernel geométrico opcional | Manifold 3D | CSG en sólidos compatibles, no sustituye Blender |
| Aceleración de picking | three-mesh-bvh | Raycasting y selección sobre mallas grandes |
| Optimización | glTF Transform, Meshopt/Draco, KTX2/Basis | Derivados de visualización |
| Almacenamiento | Cloudflare R2 u otra opción evaluada | Originales, derivados, versiones, resultados |
| Composición | LAB Studio | GLB animados, timeline de composición, export audiovisual |

No cambiar a Babylon.js/Godot ahora y no integrar bibliotecas redundantes sin demostrar su aporte.

## 4. Casos de uso Python desde GENRE3D

1. **Modelar por código:** crear primitivas y mallas paramétricas; deformar, extruir, biselar, subdividir, aplicar modificadores y materiales.
2. **Animar:** generar poses, fotogramas clave y movimientos de objetos; hornear o exportar clips compatibles.
3. **Rigging:** armatures, bones, pesos y controladores; distinguir los constraints de Blender de lo que puede expresarse en glTF.
4. **Convertir:** importar FBX/OBJ, conservar fuente y generar GLB optimizados con diagnósticos.
5. **Crear variantes:** recetas de material, UV, cámara, iluminación, LOD y resolución de texturas.
6. **Automatizar tareas repetitivas:** aplicar operaciones por lote con límites y resultado recuperable.
7. **Interoperar:** enviar GLB/manifest al contrato LAB Studio sin sobrescribir capas ni timelines preexistentes.

## 5. Diseño del panel «Automatización Python» (propuesto)

- Panel **desplegable** que no reduzca permanentemente el visor.
- Editor con resaltado, plantillas y parámetros; mensajes en español.
- Biblioteca de recetas mantenidas en el repositorio, con versión, entradas y salidas declaradas.
- Botones **Validar**, **Ejecutar**, **Cancelar** y **Aplicar resultado**. Cada acción deberá implementar una conducta real, no ser decorativa.
- Barra de progreso por etapa: carga, importación, procesado, exportación, validación.
- Vista previa del GLB derivado antes de reemplazar/añadir a escena.
- Historial, errores específicos, advertencias de pérdida de formato y recuperación del original.
- Permitir más adelante acciones desde ratón, Wacom y menús que generen recetas Python equivalentes: la interfaz no debe obligar a escribir código.

### Ejemplo conceptual de receta Blender

El siguiente código **solo es una muestra de bpy**; **no** debe exponerse como ejecución arbitraria en el servicio compartido:

```python
import bpy
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1)
obj = bpy.context.object
obj.name = "Modelo LAB"
obj.location.z = 0
obj.keyframe_insert(data_path="location", frame=1)
obj.location.z = 2
obj.keyframe_insert(data_path="location", frame=60)
```

La interfaz final enviaría **operaciones tipadas y argumentos validados** a un ejecutor controlado; no un `eval` universal de texto recibido por HTTP.

## 6. Seguridad: decisión no negociable

- **No ejecutar Python arbitrario remitido por clientes en el contenedor compartido actual.** RCE, lectura de secretos, consumo de recursos y acceso entre proyectos serían riesgos severos.
- **Fase inicial:** catálogo permitido de recetas/operaciones parametrizadas, validadas en servidor; no aceptar comandos de shell ni importaciones de módulos arbitrarios.
- Si se habilita scripting Python libre en el futuro: tareas efímeras y aisladas por usuario/ejecución, sin red externa por defecto, sin acceso a credenciales, con permisos mínimos, sistema de archivos temporal, cuotas de CPU/RAM/tiempo, límites de salida y auditoría. La instalación y licencias de paquetes se controlan.
- Cloudflare Access se conserva; el servidor verifica identidad y autorización en cada solicitud. Tokens internos nunca se exponen en React o en archivos del repositorio.
- El procesador no se conecta directamente con el navegador por una ruta pública sin autorización.
- Las operaciones con datos de terceros requieren inspección de contenido, validación de formatos y límites contra archivos maliciosos o archivos-bomba.

## 7. Primera implementación: criterio de éxito

**No empezar por un intérprete Python general.** El primer entregable será usar el ejecutor Blender existente para importar de forma fiable **`Dying.fbx`**, el caso que hoy bloquea GENRE3D:

1. Incorporar una operación de prueba `fbx_to_glb` en un script aislado del puente actual (o equivalente), sin cambiar endpoints que funcionan.
2. Validar importación real en Blender headless: mallas, armature, bones, materials, acciones/clips y tamaño de texturas.
3. Crear un **GLB de preview** y una descripción de elementos preservados/perdidos; mantener original y fuente editable.
4. Comprobar mediante pruebas automatizadas que el GLB renderiza y mantiene esqueleto/animaciones indispensables.
5. Implementar carga segura y **asincrónica** para archivos de ~100 MB, con trabajos y progreso; no enviarlos al endpoint GLB actual de 12 MB y no ejecutar `FBXLoader.parse()` pesado en el hilo principal del navegador.
6. Importar GLB convertido a GENRE3D, seleccionar clip, reproducir y hacer seek; medir memoria/respuesta del visor.
7. Probar transferencia a LAB Studio y secuencia RGBA como tareas independientes, sin dar por validadas exportaciones por el mero hecho de importar.

**Criterios de aceptación:** `Dying.fbx` se procesa sin congelar la UI; inventario y salida son comprobables; el modelo aparece, sus huesos y al menos su movimiento original son reproducibles; la carga puede fallar o cancelarse sin destruir el proyecto actual.

## 8. Fases siguientes

- **Fase A — Pipeline FBX probado:** conversión de Dying + informes y tests; conservar servicio y flujo GLB original.
- **Fase B — API y cola:** upload seguro a almacenamiento temporal, estados `queued/running/validating/ready/failed/cancelled`, cancelación, límites, reintentos controlados.
- **Fase C — Panel Python de recetas:** scripts autorizados, parámetros y muestras; integración con gizmos, inspector y Wacom; preview/undo.
- **Fase D — Modelado y rigging:** geometría compleja y animaciones usando bpy/BMesh, no primitivas simuladas.
- **Fase E — Integración LAB Studio:** contrato de assets, clips glTF, manifest, versiones y pruebas de Alpha.

## 9. Recursos existentes y documentación

- [Arquitectura híbrida Blender + Three.js](./ARQUITECTURA-HIBRIDA-BLENDER-THREEJS-2026-11-03.md).
- [Puente Blender real](./BLENDER-BRIDGE.md).
- [Contrato LAB Creative Suite](./LAB_CREATIVE_SUITE_INTEROPERABILIDAD.md).
- Código: `tools/blender/http_server.py`, `tools/blender/genre3d_bridge.py`, `tools/blender/Dockerfile`, `cloudflare/genre3d-blender-gateway.js`.
- [Repositorio LAB Studio](https://github.com/ddepazos/lab).

## 10. Qué **no** significa este documento

- No afirma que exista ya una consola Python web operativa, que FastAPI esté instalado o que `Dying.fbx` esté convertido.
- No ejecuta migraciones a otras cuentas GitHub, Cloudflare o Render; **no son necesarias para empezar**.
- No amplía automáticamente límites, memoria o plan de Render; estos requisitos deberán verificarse antes de desplegar trabajos grandes.
- No altera la interfaz ni los repositorios de LAB Studio. No publica credenciales ni transforma la biblioteca anatómica.
- No basta con `npm run build`: toda funcionalidad deberá pasar pruebas funcionales con archivos reales.

---

**Decisión guardada:** LAB-GENRE3D = **editor web React/Three.js + motor Blender/Python externo ya existente (ampliado por etapas) + API de trabajos segura + panel de automatización Python orientado primero a recetas + pipeline de activos optimizados e interoperabilidad con LAB Studio**. Primero estabilizar y validar `Dying.fbx`, después ampliar herramientas profesionales sin reinventar la rueda.
