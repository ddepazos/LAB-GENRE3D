# Validación web de GLB — 30 octubre 2026

Pruebas realizadas en https://lab-genre3d.pages.dev/ con Edge, en una pestaña de prueba nueva. Sin cambios en LAB Studio ni ramas nuevas.

## Despliegue
La página carga `/assets/index-DQ84HDkQ.js`, el mismo nombre de bundle producido por la compilación local que incorpora exportación de keyframes del rig (commit 541e9d1). La consulta de estados GitHub devolvió una lista vacía; esa consulta por sí sola no acredita CI.

## Pruebas nuevas de edición importada
Modelo: cubo inicial enviado con «Procesar escena con Blender», operación Suavizar. Resultado: `blender-smooth-escena.glb` añadido al lienzo, una submalla `Cubo_01`, 12 triángulos. Mensaje: «Blender: modelo procesado y añadido al lienzo». Original conservado y ocultado para que no intercepte los clics sobre el resultado superpuesto.

- Caras: selección por clic sobre la superficie habilita Extruir cara.
- Extrusión: 12 → 18 triángulos; Deshacer habilitado.
- Deshacer: recuperación de 12 triángulos.
- Bisel de cara triangular: selección y aplicación, 12 → 18 triángulos; deshecho después para la prueba siguiente.
- Vértices: clic sobre la superficie selecciona el vértice más cercano y muestra el gizmo. Arrastre del eje Y desplaza visiblemente la esquina superior izquierda; Deshacer habilitado. Deshecho antes de aristas.
- Aristas: clic junto al borde izquierdo habilita Biselar arista seleccionada. Aplicación devuelve «Bisel plano aplicado».

## Límites y pendientes
No se cierra todavía la prueba de copia editable de un modelo con rig/morphs: el modelo utilizado es estático. Tampoco se valida una animación exportada desde UI: `waitForEvent('download')` agotó 10 segundos sin entregar archivo verificable, sin diálogo JS observado. Esto no demuestra por sí solo un defecto del exportador ni una descarga exitosa. La prueba automática de canales de animación GLB sigue siendo evidencia separada.

El cubo original superpuesto interceptó inicialmente los clics. Al ocultarlo y volver a seleccionar GLB + modo de componente, la edición funcionó. Conviene desplazar el resultado Blender al importarlo o explicar la superposición en UI.
