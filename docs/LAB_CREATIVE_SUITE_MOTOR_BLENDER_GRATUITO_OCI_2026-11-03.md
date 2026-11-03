# LAB Creative Suite — Infraestructura gratuita para procesamiento Blender

**Documento de decisión técnica · 3 de noviembre de 2026**  
**Estado:** arquitectura definida y documentada. **No se ha creado la cuenta OCI, máquina virtual, Cloudflare independiente ni un servicio nuevo en producción.**  
**Propietario previsto de nueva infraestructura:** cuenta `llabcreativesuite@gmail.com` (verificar titularidad y conexión antes de activar servicios).  
**Productos consumidores:** LAB-GENRE3D y LAB Generative Design Studio, sin mezclar sus repositorios ni sobrescribir sus proyectos.

## 1. Decisión

Iniciar **LAB Creative Suite Render Engine** como un servicio de Blender/Python en una VM gratuita **Oracle Cloud Infrastructure Always Free** (OCI Ampere A1 ARM), si hay capacidad disponible. Se prohíbe habilitar servicios facturables o convertir la cuenta a Pay As You Go sin autorización específica del propietario. Usar **Cloudflare Workers Free** solo como API ligera y **R2 Standard** solo si se acepta vigilar su cuota; **no usar Cloudflare Containers**, que no tiene nivel Free.

**Actualización crítica de cuotas (2026):** la documentación vigente de Oracle indica **2 OCPU ARM y 12 GB RAM** gratuitos, equivalentes a **1.500 OCPU-h y 9.000 GB-h de memoria al mes**, hasta **200 GB de volúmenes en bloque**, incluyendo volumen de arranque. Documentación antigua y parte de la página comercial todavía muestran 4 OCPU/24 GB o 3.000 OCPU-h; **no provisionar con esos valores antiguos**.

**Limitaciones de gratuidad:** el registro Oracle solicita verificación con tarjeta; las VM Always Free pueden estar sin capacidad, pueden recuperarse tras inactividad y no llevan GPU dedicada. Recursos fuera de cuota o fuera de región pueden tener cargo en cuentas pagadas; mantener cuenta Free y cuotas explícitas. R2 Free permite aproximadamente **10 GB-mes Standard, 1 M operaciones clase A y 10 M clase B**; exceder cuota puede facturarse dependiendo de la configuración de facturación. Monitorizar uso y aplicar borrado automático de trabajos. Modal ofrece 30 USD de crédito de cómputo mensual Starter pero **puede facturar excedentes**: no se considera garantía de costo cero.

## 2. Por qué separar Cloudflare del cómputo

Cloudflare Pages actual sirve la interfaz. El navegador importa FBX/GLB y hoy puede ocupar mucha CPU/RAM al convertir un FBX grande, procesar texturas o generar un ZIP 4K. El backend Blender actual en Render `lab-genre3d-blender` atiende solo operaciones simples sobre **GLB <=12 MB** en una petición sin cola.

**Nueva arquitectura**:

```text
[LAB-GENRE3D]            [LAB Studio]
       \                   /
         [API LAB Suite, Cloudflare Workers Free*]
                | POST trabajo (autenticado, sin cargar un FBX enorme
                | en la memoria del Worker)
                v
       [Almacenamiento temporal privado]
       | OCI 200 GB block (piloto) / Cloudflare R2 Standard Free*
       v
       [Cola simple de trabajos persistida en VM]
           | trabajo 1 por vez, usuario único
           v
       [Oracle Always Free: Ubuntu ARM + Blender headless + Python]
           | FBX → inspección → optimización no destructiva → GLB
           | registrar huesos, clips, mallas, texturas y advertencias
           v
       [Archivo .glb + manifiesto .json + informe técnico]
           | descarga autenticada con caducidad
           v
       [GENRE3D: reimportar y editar] → [LAB Studio: overlay GLB]
```

* Para **fase 0 de costo estricto cero**, usar almacenamiento temporal en la VM y exponer solo endpoints autenticados; Cloudflare R2/Workers son una integración posterior que solo se habilita si la cuota y acceso a la nueva cuenta están comprobados. Nunca abrir puerto de Blender directamente sin autenticación.

## 3. Contrato inicial del motor

- Entrada: **FBX** (piloto con `Dying.fbx`), GLB; luego OBJ/MTL y texturas asociadas en ZIP validado.
- Operaciones fase 1: importar, normalizar unidades/ejes, conservar armature/skin y acciones, verificar rutas de textura, preparar GLB binario editable; simplificación de malla solo opt-in y sin destruir shapes/blendshapes.
- Operaciones fase 2: precalcular animaciones de origen, LOD, inspección de materiales, normal maps, generación de UV si hace falta, bake selectivo. No prometer conversión perfecta de restricciones o plugins propietarios de FBX a glTF.
- Respuesta: ID de trabajo + estado `queued|running|succeeded|failed|cancelled`, porcentaje/etapa reales si disponibles, mensajes de error, enlace privado temporal GLB, manifiesto con `sha256`, `mimeType=model/gltf-binary`, tamaño, conteos de huesos/clips y transformaciones.
- **No modificar proyectos 2D ni sobrescribir la escena actual**: importar resultado como nuevo asset, con aceptación explícita del usuario.
- Seguridad: autenticación; URL firmada o transporte controlado; límite de tamaño por etapa; nombres seguros; sin ejecución de scripts suministrados por usuario; carpeta temporal aislada; procesos con timeout y límites de memoria/cpu; antivirus/escaneo si crece a multiusuario; trazas sin credenciales; limpieza automática.
- Rendimiento: con 2 OCPU ARM y 12 GB memoria **procesar de uno en uno**, sin prometer simultaneidad, render en tiempo real, aceleración GPU ni tiempos de exportación fijos.

## 4. ¿Habrá impacto real en resultados?

| Dimensión | Impacto probable | Evidencia que debemos medir |
|---|---|---|
| FBX pesados | **Alto** al quitar parseo/conversión pesados del hilo web | `Dying.fbx`: carga del browser y tiempo en VM |
| Estabilidad de la web | **Alto** si API/cola asíncrona: el usuario puede seguir trabajando | Interfaz responde mientras se procesa |
| Huesos y clips | **Mejor control de validación**, pero no garantiza equivalencia automática | Conteos, duración, poses a 0/25/50/75/100%, roundtrip |
| Texturas PBR | **Mejora condicionada** a corrección de rutas, materiales y bake adecuado | Comparación visual y metadatos de textura |
| Calidad visual del modelo | **No mejora por mover cómputo**; solo con nuevos procesos de modelado/materiales/render | Capturas comparables, mismas cámaras/luces |
| Render 4K | Render fuera del browser evita limitaciones de RAM/browser; **CPU de 2 OCPU será lenta** | 150 frames a 3840×2160, tiempo real y tamaño |
| Video alfa | **Fuera de esta fase**, según decisión previa | No iniciar video hasta validar GLB compatible LAB Studio |
| Costo | Puede ser 0 dentro de Always Free | Panel OCI: cuota, región, facturación y alertas |

**Regla:** no publicar declaraciones de «más calidad», «más rápido» o «150 frames garantizados» sin medir con un proyecto real. Los GPU y GPUs gratuitas de notebooks no equivalen a un servicio persistente seguro.

## 5. Hitos de implementación

1. **Cuenta e infraestructura:** titular inicia sesión/crea OCI con su email. Comprobar `Always Free Eligible`, cuota **2 OCPU / 12 GB** y disponibilidad de la región; no activar upgrade. Conectar cuenta Cloudflare separada solo cuando exista y esté autorizada.
2. **Repositorio aislado:** crear `LAB-CREATIVE-SUITE-ENGINE` bajo la cuenta/repositorio que el usuario elija. Dockerfile **ARM64**, Blender headless, Python, API y pruebas de roundtrip, sin tocar los repos LAB Studio/GENRE3D.
3. **MVP de conversión:** hacer la prueba `Dying.fbx` → `Dying-optimizado.glb` con informe de integridad. Medir archivos, memoria, latencia y animación.
4. **Cola y descargas:** trabajo con ID y estado persistente, cancelación, retención 24 h y descarga protegida.
5. **Conector de GENRE3D:** botón `Procesar en LAB Suite` envía a motor solo bajo consentimiento, muestra estado y reimporta el resultado, no bloquea editor.
6. **LAB Studio:** validar que el GLB resultante se abre como superposición 3D y reproduce clips. **JSON v3 de GENRE3D no equivale al proyecto `lab-project` v1 de LAB Studio**; un importador dedicado es otra etapa.
7. **Etapas posteriores:** procesado por lotes, material baking, render CPU con transparencia y conversiones extra. Video alfa no inicia hasta cerrar contrato GLB.

## 6. Qué NO se hace hoy

- No se crea una VM o cuenta OCI ni Cloudflare sin conexión y verificación de quien administra el servicio.
- No se traslada el proyecto en producción, no se borra Render, no se reinstala Cloudflare y no se elimina ninguna ruta actual.
- No se integra Human Atlas descartado.
- No se aprovisiona Cloudflare Containers ni recursos pagados, no se usa Modal con cargos automáticos.
- No se exporta video alfa nuevo.
- No se promete aumento de calidad, compatibilidad 100% con FBX ni rendimiento de GPU.

## 7. Fuentes oficiales consultadas (noviembre 2026)

- Oracle Always Free Compute y cuotas: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Oracle Free Tier FAQ (tarjeta/capacidad): https://www.oracle.com/cloud/free/faq/
- Cloudflare Containers, **no gratuito**: https://developers.cloudflare.com/containers/platform/pricing/
- Cloudflare R2: https://developers.cloudflare.com/r2/pricing/
- Modal Starter (uso sujeto a créditos): https://modal.com/pricing

**Decisión final:** adoptar **Oracle Always Free como primera alternativa de cómputo externo**, con almacenamiento local temporal y API autenticada para el piloto, evolucionando a Cloudflare Free + R2 solo si corresponde. El impacto verificable esperado es **menos bloqueos del navegador y conversiones más controlables**, no calidad visual superior por sí sola.
