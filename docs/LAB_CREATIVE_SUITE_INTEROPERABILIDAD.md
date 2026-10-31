# LAB Creative Suite · contrato de interoperabilidad (borrador)
Actualizado: 2026-10-31

## Estado
Este documento define el intercambio previsto, **no** indica que Google Drive ya esté conectado.
No se modifican los archivos originales ni las composiciones 2D de LAB Studio.

## Exportación LAB GENRE3D → LAB Studio
- Mantener el archivo JSON v3 original como fuente inmutable.
- Cada asset 3D debe disponer de `id`, `name`, `mimeType`, `byteLength`, `sha256`, `glb` y `transform` cuando esos datos existan.
- `glb`: GLB 2.0 embebido en base64 o referencia explícita; no inferir un archivo externo.
- `transform`: posición, rotación y escala locales; no normalizar ni centrar silenciosamente.
- Conservar nombres de nodos, jerarquía, mallas, materiales PBR, texturas, skins y clips glTF.
- Emitir advertencias por constraints, scripts, simulación, parámetros procedurales o timeline propietario que no se puedan representar.

## Importación segura en LAB Studio
1. Leer y validar el JSON y el tamaño de cada GLB.
2. Presentar lista de assets y advertencias; pedir confirmación antes de añadir.
3. Crear un grupo 3D nuevo sin tocar `layers`, `timeline` ni `doc` de la composición 2D.
4. Mantener matrices originales de cada nodo GLB; no reemplazar materiales con presets.
5. Revertir solo el grupo recién añadido ante un fallo; registrar el resultado.

## Drive privado
Raíz: `LAB Creative Suite` — `1GpBj2CiHS_ISKaHmJJ-iJvjQxepTPaCJ`
Cuenta: `llabcreativesuite@gmail.com`.
Subcarpetas: 01_MODELOS_3D, 02_RIGGING, 03_MATERIALES, 04_RECURSOS_2D,
05_ANIMACIONES, 06_PROYECTOS_TERMINADOS, 07_TEMPLATES,
08_DOCUMENTACION, 09_INTERCAMBIO_ADOBE, 10_BACKUPS.

La integración futura requiere un servicio autorizado de Drive con permisos mínimos,
identidad privada, control de versiones, validación de tipos y límites de carga.
No almacenar tokens OAuth ni claves de servicio en el frontend o en archivos JSON.

## Pendiente de validación
- Obtener `avance.json` original v3 y confirmar esquema real.
- Implementar exportador interoperable y UI de importación.
- Probar compilación y roundtrip en ambas aplicaciones.
- Implementar conector Drive y pruebas de permisos y versionado.
