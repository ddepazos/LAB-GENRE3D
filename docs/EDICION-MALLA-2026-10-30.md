# Etapas de edición de malla y animación — 30 octubre 2026

Base: main a3573ca. Se conservan importación GLB, controles de huesos/morphs y pose original. LAB Studio no se modifica.

## Implementación
1. Primitivas convertibles a triángulos editables; selección por clic del vértice/arista más cercano de la cara pulsada, o de la cara triangular. Gizmo de traslación local y soldadura por coincidencia espacial. No incluye edición de mallas skinned GLB.
2. Extrusión de cara 0.25 unidades, inset 20 % y bisel local de cara triangular (inset con elevación). No es un bisel general de aristas ni de todo el sólido. Historial de 20 ediciones de malla. Geometría guardada con el JSON de primitivas.
3. Interpolación quaternion por camino corto, reloj de reproducción basado en tiempo real, repetir opcional y pausa al cambiar de GLB. Visualización opcional de esqueleto. Controles numéricos de huesos/morph targets existentes conservados; sin IK ni pintura de pesos.

## Verificación previa al despliegue
- npm run build: TypeScript y Vite correctos. Advertencia existente: bundle >500 KB.
- node tests/mesh-operations.mjs: conversión, extrusión, inset, bisel de cara, inmutabilidad, normales finitas y selección inválida correctos.
- Sitio abierto en navegador: versión anterior; escena de usuario con calavera.glb y esfera. No se recarga esa pestaña para no perder su trabajo.
- Pruebas UI de cambios nuevos: pendientes de publicación. Ninguna prueba anterior se registra como repetida o aprobada por inferencia.

## Limitaciones pendientes
Edición de submallas GLB, bisel de aristas, selección múltiple, pesos/IK, clips de animación GLB y serialización de importados siguen pendientes. El mapa UV de primitivas editables requiere conservación explícita; no afirmar materiales texturizados verificados en estas mallas. Probar cada modo de selección/arrastre, operaciones, deshacer, JSON, rig y reproducción en producción antes de darlo por terminado.
