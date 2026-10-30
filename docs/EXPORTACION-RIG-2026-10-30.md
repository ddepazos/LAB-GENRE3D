# Exportación de keyframes del rig — 30 octubre 2026

## Cambio
El exportador de escena recibe ahora los clips construidos desde los keyframes de los GLB visibles. Huesos: pistas quaternion con interpolación esférica; expresiones: pesos morph con interpolación lineal. Los tiempos conservan el fotograma absoluto a 30 FPS. El manifiesto LAB incluye nombres y duración de clips.

No se alteran los GLB originales ni el guardado de proyectos. No incluye movimientos procedurales de los módulos Mano/Cabeza, clips originales importados ni animación de transformaciones de objeto. Cada rig genera su propio clip; reproducir varios simultáneamente depende del programa receptor.

## Verificación
- Compilación TypeScript y Vite: correcta.
- `node tests/rig-animation.mjs`: correcta. Comprueba interpolación a mitad del movimiento, dos morph targets, canales rotation/weights en GLB binario, orden de keyframes, ausencia de claves y FPS inválidos.
- Navegador publicado: pendiente. No se considera validado por compilar ni por la prueba automática.
- La sesión anterior de descarga del navegador no devolvió un archivo verificable. No se registra como exportación exitosa.

## Siguiente prueba
Importar un GLB con huesos y expresiones, guardar dos poses en fotogramas 0 y 30, exportar la escena, reabrir en un visor con animaciones y comprobar duración, giro y pesos morph. Cerrar además las pruebas UI pendientes de edición de submallas GLB y copia editable sin rig.
