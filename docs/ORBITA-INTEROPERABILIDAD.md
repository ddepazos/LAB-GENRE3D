# Generación nativa y salidas interoperables

Se incorpora «Crear Órbita LAB · 361° / 4 s» al editor principal. Genera seis mallas con materiales metálicos y una animación de rotación muestreada a 30 FPS. El recurso pasa por el importador GLB del editor y utiliza sus controles de reproducción, edición y exportación existentes. No depende del archivo creado externamente.

Para LAB Studio y aplicaciones que admitan glTF 2.0: exportar GLB con su animación. Para composición: seleccionar resolución alfa 1080, 120 fotogramas y exportar secuencia PNG RGBA ZIP. La secuencia contiene muestras de 0 a 119/30 segundos; el clip GLB incluye el extremo de 361° a los 4 segundos. No es un bucle cerrado de 360°.

No se afirma compatibilidad universal: cada destino debe admitir el formato y preservar sus propiedades. La exportación nativa MOV ProRes 4444, FBX, USDZ y proyectos Adobe no está implementada por este cambio. El manifiesto .lab.json es metadato, no un proyecto universal.

Validación: compilación TypeScript/Vite correcta; prueba nueva tests/orbit-model.mjs exporta y reimporta GLB, comprueba seis mallas, clip de cuatro segundos y desplazamiento angular acumulado de 361°. Pendiente comprobar el botón y la captura del nuevo modelo en producción, importación en LAB Studio y otras aplicaciones. Las pruebas anteriores no se repitieron.
