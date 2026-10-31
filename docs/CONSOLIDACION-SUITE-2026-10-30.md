# Consolidación LAB Creative Suite — 30 octubre 2026

## Alcance y autorización
Trabajo en main, sin ramas nuevas. La restricción inicial de no modificar LAB Studio fue ampliada por el usuario: «si puedes hacer que lab studio se compatible mejor aun». Se incorporó compatibilidad de GLB animados en ddepazos/lab; las demás mejoras corresponden a LAB-GENRE3D. Se conservan documentos anteriores como historial.

Última verificación visual: [Rig, pesos, capas y duplicación](VALIDACION-RIG-CAPAS-2026-10-30.md). La conexión Browser se recuperó después de la interrupción descrita al final.

## Estado verificable
| Bloque | Implementación | Evidencia y límite |
|---|---|---|
| Malla GLB | Vértices/aristas/caras, extrusión, biseles y deshacer | Probados en navegador en etapas previas; no repetidos |
| GLB animado | Exportación, reapertura en memoria, selección de clip, tiempo, velocidad y bucle | Probados previamente; descarga a disco no verificada |
| Mano | Keyframes y transferencia de jerarquía rígida animada al editor GLB | Web: dos poses dieron «Mano LAB · 1.00 s». Falta cerrar reproducción visual y descarga de este recurso |
| Personaje/Cabeza | Muestreo de movimiento corporal y expresiones faciales a 30 FPS | Web: expresiones Neutra/Sorpresa dieron «Personaje LAB · 0.07 s». Falta prueba visual completa del clip facial/corporal |
| PNG alfa | Cámara actual, imagen cuadrada 256–2048 px | Web: 256×256, 61.777 píxeles totalmente transparentes reportados |
| Secuencia alfa | ZIP con PNG numerados a 30 FPS, 1–120 fotogramas | Web: secuencia de tres fotogramas preparada. ZIP comprobado con lector independiente en prueba automatizada; descarga real e importación Adobe pendientes |
| Crear rig | Copia de submalla con cadena lineal de 2–12 huesos y pesos automáticos por eje | Compilación/prueba automática correctas; UI: copia de cuatro huesos creada y original conservado |
| Pesos | Pincel radial por clic, influencia positiva/negativa, máximo cuatro huesos, deshacer | Normalización y aislamiento probados automáticamente. Guardado/reapertura de pesos modificado probado. UI: clic actualiza 39 vértices y Deshacer confirmado; falta reapertura del proyecto desde UI |
| IK/FK | CCD hacia objetivo XYZ y rotaciones FK existentes | UI: extremo llega al objetivo con distancia restante 0,001. CCD sin límites anatómicos |
| Capas de clips | Mezcla normal con peso, velocidad e inicio por clip; persistencia y exportación horneada | UI: dos capas, pesos 0,5, inicio 0,2 s, exportación/reapertura y reproducción de clip horneado de 1,20 s verificadas |
| LAB Studio | Clips GLB con huesos/morphs, selector de clip, línea de tiempo, URL HTTPS y clonación de esqueletos independientes | Web: fixture real de GENRE3D cargado y clip reconocido. Prueba automatizada entre Three 0.175/0.180: hueso y morph correctos; 24 pruebas afectadas aprobadas. UI: duplicación con poses independientes verificada; superposición pendiente |

## Comprobaciones automáticas relevantes
- GENRE3D: compilaciones TypeScript/Vite correctas. Pruebas específicas: rig tools, persistencia con pesos y keyframes de mano, muestreo procedural, ZIP CRC independiente, capas y conservación de clips.
- Mezcla por capas: dos clips ortogonales de peso 0,5 producen X=0,5 e Y=0,5 a mitad; clip horneado conserva resultado; dispose recupera pose original.
- Persistencia: v3 sigue leyendo proyectos anteriores; pesos modificados, keyframes de mano y configuración de capas se recuperan. No se eliminó historial.
- LAB Studio: importedClips.test.ts usa el GLB real generado por GENRE3D, no una malla reinterpretada. Reproducción de hueso/morph y clonación aislada verificadas con versión receptora de Three.

## Límites actuales
- Crear rig lineal no equivale a autorig humano, edición de jerarquía arbitraria ni skinning anatómico de Mano/Cabeza.
- Pintura por clic sin mapa de calor; IK CCD sin restricciones de articulación.
- Mezclas limitadas a 60 s, sin máscaras por hueso ni blending aditivo. Si hay dos o más poses LAB, el clip de poses tiene prioridad al exportar; en otro caso se hornea la mezcla activa. La secuencia alfa usa el primer clip exportable de cada GLB visible.
- Mano y Personaje se transfieren como jerarquías rígidas animadas; la geometría facial no se convierte en morph targets.
- Resolución alfa máxima 2048 cuadrada y hasta 120 frames por ZIP en esta versión. No se promete video MP4 con alfa ni importación Adobe comprobada.

## Historial de interrupción y pruebas posteriores
La conexión Browser perdió su sesión. Tras recuperación documentada, la API de interacción devolvió «Debugger unattached», tanto en Playwright como en la alternativa DOM. No se sustituyó por otro navegador ni se atribuyó el fallo al editor.

La conexión se recuperó. Los puntos 1, 2, 4 y la duplicación del 6 se cerraron según el nuevo informe enlazado; del punto 3 se comprobaron pintar y deshacer. Se conserva esta lista original como historial:
1. Crear rig lineal sobre submalla estática y comprobar copia/original.
2. Elegir extremo de cadena, aplicar IK, capturar pose y reproducirla.
3. Pintar pesos con clic, deshacer, guardar y reabrir.
4. Activar dos capas importadas, ajustar peso/inicio/velocidad y comparar exportación horneada.
5. Completar reproducción visual de Mano y Personaje/Cabeza transferidos.
6. LAB Studio: duplicar rig, comprobar independencia y probar superposición/exportación con clip nativo.
7. Descargar GLB y ZIP a disco e importar PNG como secuencia a 30 FPS en After Effects/Premiere.

No se consideran cerradas estas pruebas por el hecho de compilar o publicar.
