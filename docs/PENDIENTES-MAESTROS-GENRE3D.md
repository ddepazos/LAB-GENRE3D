# LAB GENRE3D — pendientes maestros para completar el alcance solicitado

**Corte: 30 de octubre de 2026, America/Santiago. Estado: versión funcional en desarrollo; no es una implementación completa.**

Este documento es la referencia de alcance vigente. Reúne las solicitudes originales, las omisiones corregidas en la conversación y el estado observable del código y de las pruebas. Los informes anteriores se conservan como historial; cerrar una entrega técnica no significa cerrar el programa completo.

## 1. Base que ya existe y no debe rehacerse

- Editor React/Three.js; primitivas, jerarquía, selección y transformaciones con mouse.
- Edición de submallas GLB estáticas: vértices, aristas y caras triangulares; extrusión, inset, biseles y deshacer. No equivale a un modelador completo.
- Importación GLB con huesos/morphs, controles disponibles, poses, keyframes y reproducción/exportación de clips.
- Rig lineal básico, pintura de pesos por clic con deshacer, IK CCD y FK por rotaciones. No equivale a rig anatómico avanzado.
- Mezcla normal de clips con peso, velocidad e inicio; exportación horneada. No equivale a una timeline profesional por objeto/hueso.
- Materiales procedurales básicos: liso, piel, hueso, acero, piedra, madera y escamas. No equivale a biblioteca PBR avanzada.
- Transferencia de Mano/Personaje como jerarquías rígidas animadas; PNG RGBA y secuencia ZIP de alcance limitado.
- Blender remoto `lab-genre3d-blender` para suavizar, subdividir, reducir polígonos y normales; no es Blender completo dentro de la web.
- LAB Studio reconoce GLB animados. Duplicación independiente verificada; superposición animada observada en la sesión posterior.

Evidencias existentes: [consolidación técnica](CONSOLIDACION-SUITE-2026-10-30.md), [validación de rig/capas](VALIDACION-RIG-CAPAS-2026-10-30.md), [edición GLB](EDICION-GLB-2026-10-30.md), [puente Blender](BLENDER-BRIDGE.md). Repetir una prueba solo si cambia código que afecta su resultado, aparece un fallo o falta evidencia concreta.

## 2. Requisitos abiertos de implementación

| ID / bloque | Estado real | Falta para completar lo pedido | Criterio de cierre |
|---|---|---|---|
| G01 · 2D → 3D | **No implementado** | Importar/dibujar perfiles 2D y SVG; extrusión y revolución; controles de profundidad, eje, ángulo y bisel; volver a editar el perfil/parámetros | Un perfil con hueco se extruye sin rellenarlo incorrectamente; otro genera volumen por revolución. Ambos se manipulan, guardan/reabren y exportan como GLB |
| G02 · Grease Pencil | **No implementado** | Herramienta de trazos 2D colocados en espacio 3D; capas, grosor, color/opacidad, edición/borrado y keyframes; relación con cámara y objetos | Dibujar sobre un plano elegido, orbitar sin perder la colocación, editar y animar trazos de dos capas, guardar/reabrir. Definir y probar su salida renderizada; no prometer portabilidad nativa de Grease Pencil por GLB |
| G03 · Modelos y bibliotecas | **Parcial: primitivas y prototipos procedurales** | Mano humana, personajes y objetos de mayor detalle; mejorar también los modelos ya existentes; topología, UV, pivotes y deformaciones limpios; miniaturas y organización tipo biblioteca de activos | Reemplazar geometría de los templates sin perder poses/controles. Importar un modelo externo y editarlo. Comprobar mano, rostro y cuerpo detallados con sus animaciones |
| G04 · Materiales y texturas | **Parcial: presets básicos** | Panel PBR con base color, normal, roughness, metallic, AO, emissive/alpha; asignación por submalla; repetir/escalar/rotar UV; herramientas UV. Texturas solicitadas: serpiente, leopardo y fuego, además de piel/hueso/metal/madera y otras del estándar | Aplicar mapas reales a un modelo con UV, guardar/reabrir y exportar/reimportar sin perderlos. Biblioteca con miniaturas, procedencia/licencia y perfiles de calidad. Ver [estándar visual](ESTANDAR-CALIDAD-MODELOS-TEXTURAS.md) |
| G05 · Modelado editable completo | **Parcial: componentes de malla estática** | Multiselección y selección por caja/lazo; cara lógica además de triángulos; pivote local/global y snapping; historial global undo/redo; edición no destructiva y herramientas de simetría/subdivisión integradas | Editar varios componentes con mouse, confirmar/cancelar una operación y recuperar la escena con undo/redo. Mantener UV/materiales y persistencia. Las operaciones ya verificadas no se rehacen |
| G06 · Rigging corporal/facial avanzado | **Parcial: cadena lineal, CCD y pesos básicos** | Crear/reorganizar huesos y jerarquías arbitrarias; controladores visibles con mouse; límites y calibración; edición visual de pesos con mapa de calor. Vincular mandíbula, boca, cejas y otros canales reales mediante alias; mejorar skinning de mano/cuerpo | Manipular un modelo detallado sin deformaciones incorrectas; mandíbula y cejas independientes; recuperar rest pose, guardar y exportar clips. Conservar rig/pesos cuando se edita la malla o informar/rechazar la operación antes de dañar datos |
| G07 · Animación de producción | **Parcial: poses y mezcla de clips** | Timeline editable por objeto, hueso y expresión; selección/movimiento de keys, duración, loop e interpolación; controles independientes de cada objeto/capa. Convivencia clara entre pose manual, clip importado y mezcla | Dos objetos con animaciones distintas se editan y reproducen simultáneamente, persisten y se exportan. No limitar la edición a mezclar clips ya existentes. Máscaras por hueso y mezcla aditiva son ampliaciones, no capacidades actuales |
| G08 · Editor de scripts | **No implementado en UI** | Montar Monaco bajo demanda; JavaScript para scripts de usuario, API controlada de escena/huesos/materiales/timeline, ejemplos, errores y guardado. TypeScript para extensiones; Python reservado al puente externo | Ejecutar un ejemplo que cree/modifique un objeto y otro que anime una articulación mediante API definida; errores visibles y recuperación del editor. Tener la dependencia instalada no cierra el requisito |
| G09 · Intercambio y formatos | **Parcial: GLB operativo** | Completar recepción/guardado de activos 3D en proyectos de LAB Studio, selección de clips en superposición y tratamiento de materiales/escala. Revisar glTF y el OBJ que falló; evaluar FBX solo con un convertidor validado | Transferir modelo detallado con textura y animación, componerlo en Studio, guardar/reabrir esa composición y comprobar exportación. `.lab.json` es manifiesto, no proyecto. No anunciar OBJ/FBX/glTF como resueltos por tener GLB |
| G12 · Salida de animación final | **Parcial: PNG/secuencia RGBA** | Completar tamaños y duraciones de salida, perfiles de exportación y formato de vídeo con alfa cuando el pipeline lo permita. Distinguir secuencia con alfa de MP4/GIF de previsualización; validar glTF/FBX y otros formatos antes de anunciarlos | Exportación con dimensiones, FPS, duración y transparencia verificadas; archivo descargado e importado en el receptor real. No dar por exportación de producción completa un ZIP de prueba de tres imágenes |
| G10 · Calidad y rendimiento | **Pendiente de cierre** | Perfiles baja/media/alta, LOD y carga diferida; liberar recursos; medir FPS/memoria en equipo objetivo. Extender exportación de alta resolución según presupuesto y probar perfil 4K cuando corresponda | Comparar perfiles con el mismo activo en 8 GB/Intel HD 4000 o entorno documentado equivalente. Resolución alta no sustituye calidad de modelo/textura; no cargar 4K automáticamente |
| G11 · Interfaz y documentación | **Parcial** | Reducir scroll y solapamientos; paneles plegables/redimensionables y controles contextuales; mayor viewport, atajos y estados de error/bloqueo claros. Actualizar Figma, flujo, guía de estilos y roadmap; card del portafolio | Herramientas accesibles sin tapar el lienzo en el tamaño objetivo. Figma y manual describen la versión publicada; ninguna herramienta futura aparece como funcional |

**Distinciones obligatorias:** extruir una cara 3D no es convertir 2D a 3D; una copia estática sin rig no es edición de topología conservando rig; mezclar clips no es toda la animación por capas solicitada; un color/patrón procedural no es PBR completo; los prototipos rígidos no son modelos anatómicos detallados.

## 3. Cierre de funciones implementadas: pruebas que aún faltan

| ID | Comprobación pendiente | Qué ya se sabe |
|---|---|---|
| V01 | Pintar pesos, guardar y reabrir desde la UI | Pintar/deshacer probados en navegador; persistencia probada automáticamente |
| V02 | Reproducción visual completa de Mano y Personaje/Cabeza transferidos, incluyendo movimiento corporal y facial combinado | Generación y reconocimiento de sus clips comprobados; aún son piezas rígidas |
| V03 | Vista previa final del PNG compuesto en Studio: dimensiones y presencia de patrón + GLB | Superposición animada observada. Vista previa PNG incorporada, compilada y desplegada en `fec46e5`; su prueba final quedó interrumpida por la conexión Browser |
| V04 | Descarga a disco y reapertura del GLB/ZIP obtenido por el usuario | Reapertura en memoria sí probada. La herramienta Browser informó que no soporta descargas `blob:`; eso no demuestra un fallo de descarga normal |
| V05 | Importar la secuencia PNG RGBA a 30 FPS en After Effects/Premiere; comprobar alfa, orden y duración | PNG transparente y ZIP preparados en navegador. Límite actual: cuadrado hasta 2048 px, 1–120 fotogramas. No hay prueba directa en Adobe |
| V06 | Preservación de rig/morphs/materiales/clips al recorrer las operaciones aplicables de Blender | Las cuatro operaciones de malla tienen pruebas propias. Modificar topología con morphs tiene restricciones; no se debe prometer preservación universal |

**V01–V06 no sustituyen G01–G12.** Aunque todas las pruebas actuales pasaran, seguirían faltando las herramientas no implementadas.

## 4. Orden de trabajo para completar el alcance

1. **Cerrar la base sin reescribirla:** V01–V03, corregir etiquetas/estados engañosos e inventario de controles. Mantener las regresiones ya documentadas.
2. **Incorporar 2D → 3D:** G01, comenzando por SVG/perfiles, extrusión y revolución editables.
3. **Incorporar dibujo tipo Grease Pencil:** G02, con capas y persistencia, separado del lápiz de Studio.
4. **Subir la calidad visual:** G04 y G03 en conjunto: UV/PBR y activos detallados, incluyendo reemplazo de templates existentes.
5. **Completar edición y rigging:** G05–G06 sobre esos modelos; no destruir pesos ni animaciones al editar.
6. **Completar timeline:** G07, con objetos/huesos/expresiones independientes y prioridad explícita de controles.
7. **Montar scripts:** G08 sobre una API estable del editor.
8. **Cerrar entrega web:** G09–G12 y V04–V06; pruebas de rendimiento, Adobe, documentación y portafolio. Desktop Windows/Tauri queda para después de completar la web.

Cada entrega debe señalar por separado: diseño, código, compilación, publicación y prueba funcional. No usar “completo” hasta cumplir los criterios del bloque correspondiente.

## 5. Restricciones que continúan

- Continuar desde main, conservar cambios recientes y no crear ramas nuevas ni reescribir historial.
- Repositorios separados. La autorización posterior permite cambios de compatibilidad en LAB Studio; no autoriza rehacer ni romper su editor 2D/lápiz.
- Usar exclusivamente el servicio `lab-genre3d-blender` para el puente; no confundirlo con `plc-demo` ni con el nombre del workspace.
- No pedir nuevas claves como rutina ni añadir servicios de pago o autenticación nueva por esta consolidación.
- Adobe Animate fue solamente una consulta: **no se añade como integración comprometida**.
- No implementar funciones nuevas como parte de este documento: esta entrega consolida el alcance y corrige el registro de pendientes.

## 6. Fuentes del alcance

- [Registro original de avances y solicitudes](AVANCES-2026-10-29.md): Grease Pencil y scripts ya figuraban como pendientes.
- [UX e interoperabilidad](FLUJOS-UX-INTEROPERABILIDAD-2026-10-29.md): escenas, selección, rig facial y materiales.
- [Estándar de modelos y texturas](ESTANDAR-CALIDAD-MODELOS-TEXTURAS.md): calidad aplicable a todos los activos.
- Conversación: petición explícita de 2D→3D por extrusión/revolución, modelos más detallados/editables, texturas solicitadas, alcance de rigging y corrección de la afirmación de implementación completa.
- Código actual de `src/` y registros de validación enlazados en este documento. Los documentos de diseño no se toman como prueba de funcionalidad implementada.
