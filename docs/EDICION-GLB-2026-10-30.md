# Edición de submallas GLB — 30 octubre 2026

## Alcance
LAB-GENRE3D, rama main. No se crean ramas ni se modifica LAB Studio.

- Selección de submallas por clic sobre el modelo o por lista en el inspector.
- Vértices, aristas y caras triangulares de mallas estáticas: gizmo local, extrusión con distancia ajustable, inset, bisel de cara y bisel plano de arista convexa.
- Deshacer de malla distingue primitivas y cada submalla importada. Las instancias que comparten geometría original no se modifican juntas.
- Se conservan materiales, UV principal, UV secundarios, colores por vértice y grupos de material. Las normales se recalculan al editar. Atributos especiales no compatibles se detectan antes de editar.
- Máximo de edición interactiva: 20.000 triángulos por submalla. Modelos mayores pueden reducirse con Blender.

## Rig y copia editable
Las submallas con pesos de rig o morph targets conservan su topología. «Crear copia editable sin rig» congela la pose visible (skinning y morphs) en una nueva malla estática, conserva la ubicación mundial y mantiene el original articulado. La copia deja de tener controles de huesos/expresiones; el original los conserva. Instancias requieren conversión separada.

## Guardado
El formato de escritura pasa a versión 3; se siguen leyendo v1 y v2. El GLB original continúa incrustado sin cambios y las geometrías editadas se guardan como sobrescrituras de los nodos correspondientes. Se validan atributos y grupos al recuperar. Las guías del editor no forman parte de la jerarquía persistida.

También se corrige la exclusión de los controles reales de Drei al exportar para Blender: la implementación instalada se identifica con `isTransformControls`, además del nombre de tipo. Esto evita incluir flechas de edición en nuevos GLB.

## Verificación previa
- Pruebas de edición importada: independencia de dos submallas, transformaciones anidadas, extrusión/bisel con color normalizado y UV secundario, grupos de material, deshacer, guardado/reapertura de geometría modificada, exclusión de guías y protección de rig/morph.
- Copia estática: pose skinned con transformación mundial y expresión morph conservadas en la copia; geometría, huesos y valores del original intactos.
- Regresión afectada: operaciones geométricas, guardado de proyectos v1/v2/v3 y serialización sin controles reales de Drei.
- Las pruebas de navegador se registrarán después del despliegue; no se infieren de las pruebas automáticas.
