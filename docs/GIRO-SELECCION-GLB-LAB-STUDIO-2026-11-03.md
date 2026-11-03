# Giro 360°/361° sobre un objeto seleccionado — contrato LAB Studio

**Fecha:** 2026-11-03  
**Solicitud:** no generar una «órbita» decorativa como nuevo modelo. Animar el objeto existente que el usuario seleccionó; obtener un archivo 3D crudo y reutilizable en LAB Studio. **No modificar todavía la exportación de video con alfa.**

## Comportamiento corregido

1. Seleccionar un objeto existente de la jerarquía (primitiva propia o GLB/FBX previamente convertido a GLB).
2. Escoger eje X/Y/Z, grados (preset 360° o 361°) y duración.
3. Pulsar **Aplicar giro a la selección · GLB editable**.
4. Si la operación termina correctamente, el mismo objeto es reemplazado **en su posición**, sin crear un segundo objeto visible.
   - Si era una primitiva nativa, se convierte a un modelo GLB editable con la misma geometría y transformación externa.
   - Si era un GLB con rig, conserva la jerarquía, piel, huesos, materiales y clips base cuando son exportables.
   - Se genera una primera animación que combina el giro y el primer clip preexistente, cuando hay uno. Los clips base también se conservan individualmente.
   - Si la exportación falla (p. ej. excede 40 MB), el objeto anterior permanece intacto.
5. El timeline de GENRE3D puede reproducir y recorrer el primer clip del modelo importado.
6. Exportar **Escena GLB** desde GENRE3D para descargar un archivo 3D editable y animado. También se conserva el proyecto nativo GENRE3D JSON v3 como respaldo.
7. En LAB Studio abrir la sección de superposición 3D y usar **Importar modelo GLB/GLTF** para cargar el GLB en el proyecto. El reproductor actual de Studio reproduce el primer clip del GLB.

## Contrato de formato y alcances

- El formato de intercambio inicial es **GLB 2.0 binario**, no GIF, MP4 ni secuencia PNG.
- Incluye geometría, jerarquía, materiales, texturas integradas y animaciones glTF representables.
- Es editable en programas y motores compatibles con GLB; no se promete reconstruir los nodos procedurales de GENRE3D a partir de él.
- La importación actual en LAB Studio funciona como **superposición 3D**, no como importación completa del proyecto JSON v3.
- El **JSON v3 de GENRE3D no debe hacerse pasar por un proyecto nativo de LAB Studio**: ambos tienen esquemas distintos. La interoperabilidad JSON completa requiere importador dedicado y respaldo de la composición 2D.
- 360° es el valor correcto para bucle continuo sin salto; 361° es un giro ligeramente superior, útil para la animación específica solicitada, pero al repetirlo puede presentar una diferencia de 1°.
- El modelo original de ejemplo «Órbita 361°» ya no aparece como herramienta de creación en la interfaz.
- No se modifica el módulo de **video con canal alfa** ni se inicia nuevo desarrollo de exportación de video hasta tener intercambio GLB funcional verificado.

## Validación requerida

- [ ] Seleccionar una primitiva existente, aplicar 360° y confirmar un solo objeto y movimiento desde timeline.
- [ ] Exportar GLB, reimportar en GENRE3D y verificar giro.
- [ ] Seleccionar un GLB con huesos, aplicar giro y comprobar clips y mallas originales.
- [ ] Cargar GLB resultante en LAB Studio desde «Importar modelo GLB/GLTF» y verificar su movimiento.
- [ ] Probar guardar/cargar proyecto de GENRE3D sin perder el giro.
- [ ] Mantener exportación PNG RGBA tal como estaba y no implementar MP4 alfa todavía.

**Nota:** las pruebas automatizadas pueden validar el contrato y un roundtrip GLB pequeño, pero no sustituyen la inspección visual en navegador de los archivos grandes.
