# LAB-GENRE3D — Premisas de consolidación: animación, timeline y exportación 4K

**Fecha de registro:** 2026-11-03 (Chile)  
**Revisión prevista por el usuario:** 2026-11-04  
**Naturaleza:** decisiones y criterios de aceptación, evidencia reunida y pendientes; **no significa que todas las funciones estén publicadas**.  
**Repositorio:** [ddepazos/LAB-GENRE3D](https://github.com/ddepazos/LAB-GENRE3D)  
**Integración pendiente:** [PR #2](https://github.com/ddepazos/LAB-GENRE3D/pull/2), rama `fix/animacion-modos-exclusivos-20261103`.

## 1. Premisa central y alcance

Mantener el editor LAB-GENRE3D basado en React/TypeScript y Three.js para manipulación y previsualización web, complementado con Blender/Python remoto para tareas pesadas. **Consolidar lo que ya funciona, no construir duplicados ni romper herramientas existentes.**

Prioridad inmediata: **movimiento del personaje → timeline utilizable → exportación PNG RGBA de calidad profesional → integración controlada en GitHub/Cloudflare.** El trabajo de importación FBX pesada queda como fase separada.

No migrar repositorios ni cuentas GitHub/Cloudflare/Render por esta corrección. Conservar LAB Studio como proyecto independiente y el contrato de interoperabilidad.

## 2. Hallazgos comprobados en la sesión

1. El usuario confirmó que **el personaje ya reproduce su animación** en su prueba de localhost; no se trata todavía de una validación de Cloudflare.
2. El usuario informó que **la línea de tiempo inferior no funciona de manera útil** aunque el GLB sí reproduce. La revisión de `src/main.tsx` confirmó que el timeline inferior estaba conectado principalmente a poses `rigKeys`, no al tiempo del clip importado. De ello se deriva la corrección de sincronización.
3. El usuario entregó `GENRE3D-PNG-RGBA-30FPS.zip`. Se revisó una secuencia con **30 PNG a 30 FPS, 1 segundo, 2048 × 1152, RGBA y bucle declarado**. El movimiento aparece en los fotogramas, pero el encuadre desplaza/corta al personaje en gran parte de ellos; también se detectaron bordes alfa sin valores intermedios (aspecto dentado). El primer fotograma difiere visiblemente de los siguientes: revisar evaluación inicial de la pose y continuidad, sin atribuir una causa concluyente antes de reproducir la prueba.
4. En la captura de localhost, el modelo `Dying.glb` aparece cargado; la captura y los datos del ZIP no bastan para probar que el GLB exportado conserve íntegramente clips, huesos y materiales después de reimportarlo.
5. La pantalla mostró **30 fotogramas alfa** como parámetro editable, pero el usuario interpretó correctamente que faltaba duración exportada: el preset inicial capturaba solo un segundo y no ofrecía un control evidente de «duración completa del clip».
6. El exportador previo aceptaba hasta **2048 px por eje** y ofrecía 2048 × 1152 en 16:9, **no 4K UHD**.

## 3. Decisiones implementadas en rama de corrección

La [PR #2](https://github.com/ddepazos/LAB-GENRE3D/pull/2) contiene modificaciones en GitHub **pendientes de fusionarse con `main`**. Estas capacidades tienen código y pruebas automatizadas, pero aún no cuentan con una validación manual de producción:

### 3.1. Reproducción y movimiento

- Evitar que las rutas **«Reproducir todos»**, **clip GLB seleccionado** y **rig LAB** escriban poses a la vez sobre el mismo esqueleto.
- Al cambiar de modo, desactivar los reproductores incompatibles.
- Conservar el sistema existente de clips, mezclas de capas y animación de rigs.
- Mantener separadas las funciones de reproducción de clips GLB y creación de una **copia animada por keyframes de objeto**.

### 3.2. Timeline inferior

- Si el GLB seleccionado posee clips y **no** hay al menos dos poses `rigKeys` creadas en LAB, mostrar y controlar el **clip GLB importado**.
- El cursor debe representar el **tiempo real del clip**, convertido a fotogramas a 30 FPS para el control.
- Controles de **seek, reproducir/pausar, repetir y duración visible** del clip, con un rango ajustado a la animación real.
- Cuando existen al menos dos poses de rig, priorizar el modo **rig LAB** y sus keyframes.
- No confundir el timeline inferior con el panel independiente `TimelinePanel.tsx` para construir copias animadas de objetos. Ambos flujos necesitan verificación distinta.

### 3.3. Exportación PNG con transparencia

- Añadir **4K UHD real**:
  - Horizontal 16:9: **3840 × 2160**.
  - Vertical 9:16: **2160 × 3840**.
  - Mantener presets menores, incluido 2048 × 1152, y formato cuadrado hasta límites seguros.
- Capturar a resolución nativa del `WebGLRenderTarget`, no ampliar una imagen pequeña con escalado posterior.
- Aplicar **multisampling/antialiasing hasta 4 muestras cuando el contexto WebGL y la GPU lo permitan**, con canal alfa conservado.
- Mantener la corrección de valores RGB premultiplicados al crear los PNG RGBA.
- Elegir FPS de salida: **24, 25, 30 o 60**.
- Configurar fotogramas y segundos; ofrecer **«Usar duración completa del clip seleccionado»**.
- Límite inicial de **900 fotogramas** y **256 MB de PNG acumulados en memoria**. Son controles de seguridad del exportador web, no garantía de que toda secuencia 4K larga funcione en la GPU o memoria disponible.
- Usar muestreo determinista de poses para exportar los fotogramas; **no** depender de cuánto tarde en dibujar la pantalla.
- Ofrecer **autoencuadre opcional** del personaje a partir de varias poses de la animación. Ajustar únicamente la cámara de la exportación; **no mover la cámara de trabajo del editor**. Revisar que el encuadre soporte traslación del hueso raíz y poses extremas.
- Generar `frame-00000.png`, etc., y un `GENRE3D-sequence.json` con dimensiones, FPS, duración, número de fotogramas, bucle y autoencuadre.
- El contenedor sigue siendo un **ZIP de PNG transparentes**, no MP4 4K ni vídeo con alfa.

**Ejemplos de duración:** 5 s a 30 FPS = **150 fotogramas**; 10 s a 30 FPS = **300 fotogramas**; 5 s a 60 FPS = **300 fotogramas**. Una duración superior a la del clip original requiere repetir el clip o animar contenido adicional; no inventar fotogramas originales.

**Límite de calidad:** exportar 4K y mejorar los bordes no crea polígonos, materiales ni texturas más detalladas que las del modelo GLB de origen. Para calidad profesional se requiere revisar texturas PBR, iluminación, geometría, cámara y eventualmente render Blender.

## 4. Estado comprobado al escribir este documento

| Componente | Estado |
|---|---|
| Reproducción del GLB en localhost | **Confirmada por el usuario** |
| Exportación ZIP PNG de 30 fotogramas | **Inspeccionada**: secuencia generada, pero se observan problemas de encuadre/calidad |
| Correcciones de modos de reproducción y timeline | **Implementadas en rama**, sin validar aún en el navegador del usuario |
| Presets 4K, FPS, duración, MSAA y autoencuadre | **Implementados en rama**, sin prueba visual 4K real |
| GitHub Actions preflight | **Aprobado**, ejecución [41586829942](https://github.com/ddepazos/LAB-GENRE3D/actions/runs/41586829942), commit `e6151e60f7e097464f734e1667cc9865e705e473` |
| PR #2 hacia `main` | **Abierta como borrador, no fusionada** (consultado el 2026-11-03) |
| Cloudflare Pages producción | **Versión anterior**, commit `87a0d98cf0585f59dc202276286b7ce9b65adc37`, despliegue anterior satisfactorio |
| Localhost con cambios no incorporados a GitHub | **No inspeccionado desde esta conversación**; no asumir que el commit remoto conserva todas las modificaciones locales |
| FBX pesado en Blender remoto | **Pendiente**, no se resuelve con los cambios de la PR #2 |

**Restricción importante:** la acción de convertir la PR #2 de borrador a lista para revisión fue bloqueada por la conexión de GitHub. No afirmar que se fusionó, publicó ni desplegó. Verificar nuevamente en la siguiente sesión.

## 5. Criterios de aceptación antes de dar por finalizada la consolidación

### A. Movimiento y timeline
- [ ] Abrir el mismo GLB animado y seleccionar explícitamente su clip.
- [ ] Reproducir, pausar, hacer seek a 0 %, 25 %, 50 %, 75 % y 100 %, comprobar que el personaje cambia de pose y que el cursor sigue el tiempo.
- [ ] Validar bucle y no-bucle, reinicio del clip y controles de velocidad.
- [ ] Confirmar que activar «Reproducir rig» interrumpe el reproductor del clip y que «Reproducir todos» no crea mezclas no deseadas.
- [ ] Validar por separado una animación construida con keyframes de objeto y su reimportación.

### B. Exportación y calidad
- [ ] Exportar secuencia 5 s / 30 FPS y verificar exactamente 150 PNG numerados y metadatos coherentes.
- [ ] Exportar 1920 × 1080 y, en equipo compatible, 3840 × 2160 PNG RGBA; comprobar dimensiones, bordes alfa y peso.
- [ ] Inspeccionar fotogramas iniciales, intermedios y final, buscando salto de primera pose, recortes, encuadre y movimiento real.
- [ ] Verificar autoencuadre activo e inactivo; la cámara del editor no debe cambiar.
- [ ] Comprobar el resultado como secuencia PNG importada en Premiere o After Effects con transparencia funcional.
- [ ] Revisar cómo falla de forma segura si la GPU no soporta 4K o si el ZIP supera el límite.
- [ ] Exportar **GLB animado** y volverlo a importar para confirmar rig, clips, materiales/texturas y movimiento. Esta prueba es independiente del ZIP PNG.

### C. Consolidación y publicación
- [ ] Obtener estado real de localhost: `git status --short`, `git diff --stat`; **no ejecutar `git reset --hard` ni `git add .` indiscriminadamente**.
- [ ] Conservar respaldos y reconciliar las modificaciones locales de FBX, cámaras, exportación y UI frente a la rama remota.
- [ ] Confirmar CI del commit exacto de la PR y realizar prueba manual en navegador.
- [ ] Fusionar la PR en `main` solo cuando sea seguro y verificable; si sigue bloqueada, no eludir los controles de permisos.
- [ ] Comprobar en Cloudflare un despliegue de producción con SHA nuevo y estado `success`; verificar además la app funcionando, no solamente el build.
- [ ] Si el resultado visual retrocede, revertir únicamente el cambio problemático, sin perder el trabajo local no publicado.

## 6. Prioridades de la próxima revisión

1. **Confirmar primero** si el usuario logró reimportar el GLB y si conservó todos los clips.
2. Probar timeline corregido en el modelo real y resolver los saltos de pose o desincronizaciones que aparezcan.
3. Probar PNG RGBA en 4K y corregir encuadre/bordes si los resultados no cumplen.
4. Consolidar locales sin pisar archivos, probar y publicar mediante `main` solo con evidencia.
5. Para FBX pesados, retomar el **pipeline Blender/Python asincrónico**: no ampliar sin control la carga por `FBXLoader` en el hilo principal, ni confiar en el endpoint GLB actual de 12 MB.
6. Mantener los objetivos de LAB Creative Suite: interfaz con menús desplegables, visor amplio, compatibilidad con Wacom y exportaciones interoperables a LAB Studio.

## 7. Vínculos permanentes y referencias

- [PR #2 — timeline, reproducción, alfa y 4K](https://github.com/ddepazos/LAB-GENRE3D/pull/2)
- [Pruebas CI aprobadas](https://github.com/ddepazos/LAB-GENRE3D/actions/runs/41586829942)
- [Arquitectura híbrida Blender/Three.js](./ARQUITECTURA-HIBRIDA-BLENDER-THREEJS-2026-11-03.md)
- [Motor Python web y automatización](./MOTOR-PYTHON-WEB-AUTOMATIZACION-2026-11-03.md)
- [Interoperabilidad LAB Studio](./LAB_CREATIVE_SUITE_INTEROPERABILIDAD.md)
- [Puente Blender existente](./BLENDER-BRIDGE.md)
- [Producción Cloudflare](https://lab-genre3d.pages.dev/)

---

**Premisa de cierre:** preservar la reproducción que ya funciona; que **timeline, GLB y PNG RGBA representen el mismo movimiento**; ofrecer **4K real sin engaños sobre texturas ni límites**; separar pruebas automatizadas de validaciones reales; conservar los cambios de localhost; publicar únicamente una versión comprobada y recuperable.
