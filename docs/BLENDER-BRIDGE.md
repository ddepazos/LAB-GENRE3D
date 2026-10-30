# Conexión Blender — LAB GENRE3D

## Servicio y alcance
- Editor: https://lab-genre3d.pages.dev/
- Procesador: `lab-genre3d-blender`, Render `srv-dbhvo62jnfac73cgacrg`, https://lab-genre3d-blender.onrender.com .
- El espacio de trabajo se llama `plcdb`; el servicio `plc-demo` es distinto y no se modifica.
- Todos los cambios del repositorio `ddepazos/LAB-GENRE3D` están sobre `main`. LAB Studio no se modifica.
- Blender corre en el servidor; el navegador sigue usando Three.js. No se instala Blender en el equipo del usuario.

## Uso desde el editor
1. En la sección Blender remoto, abrir «Conectar / autorizar Blender» si no existe sesión.
2. Elegir Suavizar, Subdividir, Reducir polígonos o Normales.
3. «Procesar escena con Blender» envía la escena visible como GLB sin guías ni gizmos. Alternativamente, «Procesar archivo GLB» toma un archivo externo.
4. Un resultado correcto se añade como GLB nuevo en la jerarquía y se descarga una copia. El original permanece intacto.

Límite de entrada 12 MB; salida 40 MB; un trabajo simultáneo por procesador; Blender tiene timeout de 90 s. Evitar modelos pesados en el plan gratuito. La operación Normales aplica sombreado suave, no reconstrucción avanzada de normales.

## Arquitectura y configuración
`React → Pages Function /api/blender/process → Render /api/process → Blender → GLB → editor`.

- Cloudflare Access protege `/api/blender/*`, con política limitada a la cuenta autorizada; sesión de aplicación de hasta 720 h, sujeta a la sesión del proveedor.
- Pages verifica firma RS256, issuer, audiencia, expiración y email del JWT. No confía en un encabezado email aportado por el navegador.
- El secreto `GENRE3D_INTERNAL_TOKEN` coincide en Render y Pages; no se guarda en Git ni se entrega a React.
- Variables de producción configuradas: `GENRE3D_RENDER_URL`, `GENRE3D_INTERNAL_TOKEN` (secreto), `GENRE3D_ACCESS_ISSUER`, `GENRE3D_ACCESS_AUD`, `GENRE3D_ALLOWED_EMAIL`.
- Health de Render: `/health`. Health de Pages: `/api/blender/health`, tras Access, devuelve `configured:true` cuando están las variables.
- El gateway usa redirección manual para evitar reenviar credenciales a otro destino.

## Correcciones efectuadas al conectar
1. Pages no tenía ruta/variables del puente: se añadió la Function y se configuró producción.
2. Se sincronizó la credencial interna únicamente para `lab-genre3d-blender`; no se alteró otro servicio de Render.
3. La primera ejecución real devolvió 422: los logs comprobaron `ModuleNotFoundError: No module named numpy` en el importador glTF de Blender 4.0.2.
4. Docker instala `python3-numpy` y `python3-pil`; cada build exporta e importa un GLB de prueba. Un fallo de estas operaciones detiene la publicación.
5. Blender se limita a un hilo de procesamiento y registra diagnóstico acotado cuando falla. El cliente no recibe stdout completo ni secretos.
6. Se añadió procesamiento de escena, estado visible y retorno automático del modelo al lienzo.

## Resultados verificados — 30 octubre 2026
Prueba directa autenticada contra el servicio real con un cubo GLB de 12 triángulos:

| Operación | HTTP | Triángulos de salida | GLB válido |
| --- | --- | --- | --- |
| Suavizar | 200 | 12 | Sí, 1012 bytes |
| Normales | 200 | 12 | Sí, 1012 bytes |
| Subdividir (nivel 1) | 200 | 72 | Sí, 4752 bytes |
| Reducir polígonos (ratio 0.5) | 200 | 6 | Sí, 1220 bytes |

Pruebas automáticas: `tests/blender-gateway.mjs` verifica cabecera GLB, configuración ausente, JWT RSA válido/falsificado, rechazo sin acceso y forwarding. `tests/blender-scene-export.mjs` verifica serialización sin guías y restauración de visibilidad. TypeScript/Vite correctos.

La prueba inicial de navegador alcanzó el gateway pero falló en la llamada saliente a Render. Se corrigió el modo de redirección de fetch para Workers en `41cf0a5`. Validación final del recorrido completo se registra a continuación cuando termine; no confundir estas pruebas directas con la interfaz completa.

## Límites que permanecen
Este puente realiza cuatro operaciones de malla. No incorpora Blender completo en la web ni crea automáticamente rigs, pesos, IK/FK o personajes. El guardado completo de proyectos con GLB importados y las pruebas de preservación de rigs/animaciones tras modificar topología son trabajos separados.

## Cierre de validación del puente
- Cloudflare publicó `41cf0a5cba94dce40c3040bbcc80038194d6858a` en despliegue `3039a226-7778-4953-83f2-d8d6d5bc9c55` con deploy success.
- Recorrido real desde el navegador: seleccionar Subdividir → «Procesar escena con Blender» → estado «Blender: modelo procesado y añadido al lienzo» → jerarquía con Cubo 01 original y `blender-subdivide-escena.glb`. Tras cambiar X del resultado a 2.3, se comprueba que es un objeto independiente.
- La comprobación visual detectó caras desconectadas al subdividir GLB de Three.js por las costuras de normales/UV. Se corrigió en `932ac25315ce67cd1294289f515e8f9462996981`: soldar vértices coincidentes por malla antes de subdividir/reducir, conservando UV por loop. Los modelos con shape keys rechazan estas dos operaciones para no destruir expresiones; suavizado/normales siguen disponibles.
- Render publicó esa corrección con estado live, despliegue `dep-dbi2j095efls7399n890`.
- Nueva prueba con GLB exportado por Three.js BoxGeometry (vértices duplicados en costuras): subdividir 200, 72 triángulos, **1 componente conectado**, 6140 bytes; reducir 200, 6 triángulos, **1 componente conectado**, 1616 bytes. No se repitieron suavizado/normales, no afectados por esa corrección.
- Consola de la prueba del puente: los errores observados pertenecían a una extensión MetaMask, no a GENRE3D. No se modificó esa extensión.
- La copia descargable se inicia desde la aplicación; el evento de descarga del navegador no se verifica por separado en esta etapa. Importación y retorno al lienzo sí verificados.
