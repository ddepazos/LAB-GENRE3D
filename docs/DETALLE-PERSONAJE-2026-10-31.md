# Detalle del personaje · 31 octubre 2026

Base: main e80d199. Exclusivamente LAB GENRE3D.

Referencia aportada: https://anatomy3datlas.com/ y su sección de cabeza https://anatomy3datlas.com/regions/head/. Se usa como objetivo de proporciones, volúmenes y articulaciones. No se descargan ni incorporan sus modelos, imágenes o texturas.

## Implementado

- Superficie craneofacial continua original: perfil del mentón, pómulos, frente y concavidades orbitales. Pesos suavizados entre base craneal y mandíbula; el giro mandibular deforma la superficie de piel.
- Labios superior/inferior de 17 segmentos cada uno: contorno, apertura y comisuras responden a sonrisa y apertura de boca. Nombres estables para exportación animada.
- Pose neutra con dientes ocultos y labios cerrados; proporciones oculares reducidas tras la inspección visual.
- Pupilas, iris, reflejos; párpados superiores e inferiores. El control de cierre cubre y reduce la abertura ocular.
- Nariz con puente, punta, alas y fosas; orejas con relieve interno, cejas curvas y dos filas de dientes.
- Materiales diferenciados para piel, labios, ojos, iris, dentición y cavidad oral. No se incorporan texturas fotográficas.
- Presets adicionales Tristeza y Atención; presets existentes ajustados a los nuevos detalles.
- Torso perfilado con geometría de revolución, pelvis redondeada, palmas/dedos y pies redondeados. La mano del cuerpo es decorativa; la mano articulada independiente conserva su editor.
- Acercar rostro / Ver cuerpo completo. Iluminación de relleno y contraluz para evaluar el volumen.

## Validación

`npm run build`; regresiones de UI, persistencia y bake. `tests/head-detail.mjs` verifica estabilidad de la jerarquía entre expresiones, valores finitos, 34 segmentos labiales y exportación/reapertura GLB con animación de mandíbula, labios y párpados. La prueba construye objetos Three desde los componentes y reproduce el clip reimportado.

## Límite de esta entrega

Es una mejora del personaje procedural. No alcanza el detalle de un atlas anatómico ni constituye un modelo clínicamente validado. La superficie de cabeza usa dos huesos; el cuerpo sigue articulado por segmentos. Músculos faciales, skinning corporal de producción, retopología integral y texturas escaneadas siguen abiertos. Los proyectos GLB ya guardados conservan sus modelos originales; las nuevas instancias usan la plantilla actualizada.
