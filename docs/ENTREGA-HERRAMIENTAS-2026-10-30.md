# Entrega por etapas · herramientas de creación y salida

Se continúa en main y se conserva el editor existente. LAB Studio no se modifica en esta entrega.

## Implementación

- Copia animada de primitivas o GLB: eje XYZ, −3600…3600 grados y 0.1…30 segundos. Muestreo evita perder vueltas completas por interpolación quaternion. Combina el primer clip previo y conserva el original.
- Timeline de transformaciones por objeto: capturar posición/rotación/escala, mover o eliminar keyframes y crear una copia animada con datos de keys incluidos en GLB. Reproducción conjunta de archivos y primer clip combinado al exportar varias animaciones. No reemplaza una timeline profesional por hueso/canal.
- Captura alfa: 1:1, 16:9 o 9:16; 24/25/30/60 FPS; 1–900 imágenes; 256 MB de límite y cancelación. PNG de vista previa y manifiesto de secuencia con dimensiones/FPS. Hasta 2048 px en el lado mayor. No hay vídeo con alfa ni 4K nativo.
- 2D→3D: anillo con hueco, estrella, rectángulo, SVG por archivo o contenido; extrusión con profundidad/bisel. Revolución paramétrica de perfil de jarrón con radio/ángulo. Los parámetros viajan en GLB y se pueden recuperar y regenerar. No hay editor libre de nodos Bézier ni perfil de revolución arbitrario. La revolución tiene extremos abiertos.
- Dibujo por capas: lienzo de trazos, planos XY/XZ/YZ, nombres, visibilidad, color, grosor/opacidad, deshacer y aparición por fotograma. Geometría tubular GLB y metadatos para volver a editar. Es primera versión de dibujo 3D, no formato Grease Pencil nativo ni dibujo directo sobre superficies del viewport.
- Materiales: presets procedurales originales serpiente/leopardo/fuego; panel de mapas base color, normal, roughness G, metallic B, AO R y emissive; repetir/rotar UV existentes. La aplicación del material reserializa el GLB para guardar mapas. No hay unwrap UV ni biblioteca fotográfica de activos detallados.
- Rig: gizmo de rotación sobre el hueso elegido en el control IK. No añade jerarquías anatómicas ni límites articulares.
- Scripts: Monaco bajo demanda, JavaScript ejecutado en worker con tiempo máximo de dos segundos; API validada de creación de primitivas y rotación de huesos. Se guarda el texto en el navegador. No hay API completa de materiales/timeline ni exportación del script en proyecto.

## Comprobaciones automáticas

- TypeScript/Vite: compilación realizada; Monaco y sus workers se cargan por separado.
- tests/creative-models.mjs: giro negativo de 721° sobre X/Y/Z y movimiento previo conservados en roundtrip GLB; original sin cambios; hueco de perfil extruido sin rellenar; parámetros de perfil en GLB; revolución parcial; interpolación de transformaciones; capas y aparición STEP de trazos tras exportar/reimportar.
- tests/project-persistence.mjs: regresión pertinente por ampliación de presets y nuevos metadatos; pasa.

Las pruebas de interfaz, mapas reales, SVG, secuencia completa, rig y scripts se registrarán con sus resultados observados tras publicar. La descarga real y la importación en Adobe siguen sin comprobarse. Esta entrega no cierra todo el alcance maestro ni afirma compatibilidad universal.
