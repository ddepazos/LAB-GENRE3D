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

## Publicación y resultado de esta etapa
- GitHub: cambios publicados directamente sobre `main`, commit `3ddc93682d794d280cdd5a305b6ecce140216af4`, padre `a3573ca`. Sin ramas nuevas ni sobrescritura de cambios recientes.
- Cloudflare: despliegue `52fe62f3-cabb-4623-aefa-b7370f932e3b`, commit coincidente, etapa `deploy`, estado `success`, terminado 2026-10-30 04:44:00 UTC (01:44 Chile).
- URL de producción: https://lab-genre3d.pages.dev/ . URL inmutable: https://52fe62f3.lab-genre3d.pages.dev .
- Bloqueo de navegador: la pestaña separada de QA devuelve `Debugger unattached` al leer DOM y al intentar recargar/usar DOM CUA. Se consultó la guía de recuperación y se obtuvo una referencia fresca a la pestaña; persiste el bloqueo. No se sustituye por pruebas simuladas ni se continúa en bucle. No hay capturas de las funciones nuevas verificadas.

| Prueba nueva | Resultado |
| --- | --- |
| Conversión a triángulos, extrusión, inset, bisel de cara | Aprobada en prueba automática de geometría; UI pendiente |
| Selección/arrastre de vértice, arista, cara | Bloqueada por conexión del navegador; pendiente |
| Deshacer y persistencia JSON de geometría | Implementada; prueba UI pendiente |
| Controles GLB y visualización de huesos | Implementados/conservados; prueba UI pendiente |
| Interpolación quaternion, reproducción, pausa, repetir | Compilan; prueba con rig GLB pendiente |
| Compilación de producción | Aprobada localmente y despliegue Cloudflare exitoso |

No considerar esta etapa una finalización del modelador completo. Reanudar por las filas pendientes, sin repetir las pruebas automáticas aprobadas salvo cambios que las afecten.

## Segunda etapa — recuperación del navegador y bisel de aristas
- Conexión de navegador recuperada. Se probó selección de vértice y se detectó que el arrastre movía el contenedor de Drei pero se leía el hijo; corregido con `object={ref}` en controles de componente, primitiva y GLB. La prueba anterior de arrastre no se considera aprobada.
- Extrusión triangular comprobada visualmente en la primera versión publicada. Pendiente repetir solo lo afectado por las correcciones.
- Bisel plano de arista convexa: recorta por el plano bisector, triangula el cierre y conserva UV interpolados; ancho ajustable. Rechaza diagonales coplanares, aristas abiertas, concavidad sin soporte y anchuras inválidas. No es bisel redondeado multisegmento.
- Marcadores de esquinas seleccionadas y número de cara/arista/triángulos en interfaz. Centro de selección calculado con posiciones únicas.
- UV conservados en conversión, extrusión/inset y arrastre. Material de la primitiva conservado en modo componentes. Exportación omite guías y TransformControls y restaura su visibilidad incluso si falla.
- Pruebas automáticas afectadas: correctas; se añadieron cierre de aristas (cada borde aparece dos veces), volumen positivo y menor al original, longitud UV y anchos inválidos. TypeScript/Vite: correctos.

### Resultados de navegador — segunda etapa
Pruebas en `https://lab-genre3d.pages.dev/`, commit `b7cee62`:

| Función | Resultado y evidencia |
| --- | --- |
| Selección de componentes | Los modos Vértices, Aristas y Caras se activan; se muestran marcadores y cara seleccionada |
| Bisel de arista | Aprobado: clic sobre borde izquierdo del cubo, ancho 0.2, botón Biselar; mensaje «Bisel plano aplicado», 12 → 22 triángulos. Captura `evidencias/bisel-arista.png` |
| Deshacer bisel | Aprobado: 22 → 12 triángulos |
| Inset de cara | Aprobado: clic sobre cara triangular y botón Inset; 12 → 18 triángulos |
| Arrastre de componentes | Detectado desfase de gizmo bajo padre transformado. Corregido en `975c757`: controles mediante portal en raíz de escena y objetivo local explícito. Compila; validación final pendiente por caída de conexión al recargar |
| Guardar JSON | Se pulsa Guardar JSON; el capturador del navegador no recibe evento download en 10 s. No se aprueba persistencia completa ni se atribuye la causa sin evidencia |
| Exportación GLB sin guías | Exclusión incorporada y compila; archivo final no verificado |
| Rig importado / reproducción | Pendiente prueba con GLB riggeado; no se infiere aprobación |

Publicación confirmada por API Cloudflare:
- `b7cee6203d2cc89711cee01fd4d3f068303fa114`: despliegue `548a7438-e8b6-4508-88ea-b53d09e704aa`, deploy success.
- `975c7579f85579c35ec02b5ac338d4950c6bccf1`: despliegue `c2f00076-08d8-428b-b808-65ed01ebc4e6`, deploy success.

Se añade limpieza de selección al cambiar la cantidad de vértices (extrusión/bisel/deshacer) y filtrado de índices inválidos para evitar marcadores NaN al volver a una topología anterior. No afecta las operaciones geométricas ya aprobadas. Build final correcto.

La reconexión posterior a recargar volvió a fallar; no continuar repitiendo pruebas aprobadas. Reanudar con arrastre tras portal, descarga/recarga JSON, exportación limpia y GLB riggeado. El bisel sigue limitado a aristas convexas de soporte; no se ha implementado IK/FK, pesos ni edición skinned.
