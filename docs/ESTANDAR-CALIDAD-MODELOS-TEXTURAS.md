# Estándar visual y de materiales — LAB GENRE3D
Fecha: 2026-10-29
Estado: **objetivo de diseño, no implementación terminada**.

## Alcance
Aplicar progresivamente a todos los activos: figuras del editor, mano procedural, humano, maniquí, robot, criatura, calavera GLB importada y futuros templates. No afirmar que la geometría actual es anatómica ni que los colores planos son texturas PBR.

## Requisitos por activo
- Malla optimizada, topología limpia y deformaciones compatibles con articulaciones; separación de componentes cuando el mecanismo lo requiera.
- UV y mapas PBR: base color, roughness, metallic, normal y ambient occlusion. Height/displacement opcionales según capacidad.
- Variantes de resolución de texturas: 512 px (bajo), 1024 px (medio), 2048 px (alto); 4K únicamente bajo demanda, fuera del perfil de previsualización ligera.
- Tres niveles LOD para modelos complejos: LOD0 detalle, LOD1 intermedio, LOD2 ligero; geometría y texturas cargadas bajo demanda.
- Perfiles de materiales: piel, hueso, metal, piedra, madera, escamas, pelaje estilizado, fuego estilizado. No confundir muestras de color con texturas.
- Pivotes, jerarquía y pesos de skinning donde corresponda. Rig facial de calavera: bisagra mandibular y morph targets para regiones deformables si la topología lo permite.
- Exportación GLB/glTF con materiales compatibles, preservando huesos y animaciones cuando existan.

## Prioridades
1. Importación y revisión de GLB con materiales existentes sin pérdida.
2. Panel de materiales PBR real (mapas, UV, intensidad, roughness, metalness, normal).
3. Biblioteca de texturas reales con miniaturas y licencias verificables.
4. Actualizar personajes y mano desde geometría primitiva a modelos detallados, conservando sus controles y poses.
5. Optimizar carga y FPS en hardware de 8 GB RAM e Intel HD 4000.
6. Validación visual y funcional en navegador y build antes de anunciar completado.

## Restricciones
LAB Studio es otra aplicación; no importar allí motores de rigging ni bibliotecas pesadas. Evitar cargas automáticas de texturas 2K/4K. Guardar presets de calidad por escena y activo. No modificar código funcional sin pruebas de regresión.

## Criterios de aceptación
- El mismo objeto muestra correctamente mapas base/normal/roughness bajo iluminación.
- El usuario puede alternar calidad Baja/Media/Alta y comparar memoria y FPS.
- Mano, humano, robot y criatura conservan movilidad tras reemplazar su geometría.
- La calavera GLB puede importarse y verse antes de configurar su rig.
- No hay pérdidas de selección, controles del mouse ni persistencia JSON.
