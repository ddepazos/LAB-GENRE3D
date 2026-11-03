#!/usr/bin/env python3
"""Retirar exclusivamente Human Atlas/BodyParts3D fallido del checkout local.
Conserva anatomía LAB propia, CharacterLab, HandLab y catálogo GLB independiente.
Por defecto solo informa. Ejecutar --apply tras revisar el resultado.
"""
from __future__ import annotations
import argparse
from datetime import datetime
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

root = Path(__file__).resolve().parents[1]
main = root / "src/main.tsx"
loader = root / "src/anatomyAtlasLoader.ts"
assets = root / "public/assets/anatomy/atlas"
source_ref = root / ".reference-human-atlas"

def retire_source(original: str) -> tuple[str, bool]:
    marker = "/* LAB_HUMAN_ATLAS_INTEGRATION_V1 */"
    ui_start = '<section className="genre-atlas-panel" aria-label="Atlas anatómico detallado">'
    fn_start = '  const importAtlasPart=async(partId:string)=>{'
    imported = "import {loadAtlasManifest,createAtlasMesh,type AtlasManifest} from './anatomyAtlasLoader';"
    signatures = (marker, ui_start, fn_start, imported, "atlasManifest", "AtlasManifest")
    if not any(s in original for s in signatures):
        return original, False
    # Refuse to rewrite a different atlas integration than the version previously
    # generated for GENRE3D. The user can inspect and adapt safely if it changed.
    for expected in (marker, ui_start, fn_start, imported):
        if original.count(expected) != 1:
            raise RuntimeError(f"Marcador Atlas ausente o duplicado: {expected[:58]}")
    s = original.replace(imported + "\n", "", 1)
    # Remove the exact generated Atlas state and its filter, preserving other hooks.
    start = s.index(marker)
    state_end = s.find("  )??[];", start)
    if state_end < 0 or state_end - start > 2500:
        raise RuntimeError("Estado Human Atlas cambiado; no se eliminará nada")
    s = s[:start] + s[state_end + len("  )??[];"):]
    # Remove the exact Atlas import callback, not neighboring model handlers.
    start = s.index(fn_start)
    fn_end = s.find("  const timelineSelected=async(keys:ObjectKey[])=>", start)
    if fn_end < 0 or fn_end - start > 2500:
        raise RuntimeError("Función importAtlasPart cambiada; no se eliminará nada")
    s = s[:start] + s[fn_end:]
    # Keep the separate working anatomical catalog and GLB import UI intact.
    start = s.index(ui_start)
    ui_end = s.find("<h3>MODELOS ANATÓMICOS EXTERNOS · GLB</h3>", start)
    if ui_end < 0 or ui_end - start > 6000:
        raise RuntimeError("Panel del atlas cambió; no se eliminará nada")
    s = s[:start] + s[ui_end:]
    for token in signatures:
        if token in s:
            raise RuntimeError("Persisten referencias Human Atlas, cancelando: " + token[:60])
    return s, True

def main_cli() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Crear respaldo ZIP y retirar Human Atlas")
    args = parser.parse_args()
    if not main.is_file():
        raise SystemExit("ERROR: falta src/main.tsx; ejecuta desde LAB-GENRE3D")
    original = main.read_text(encoding="utf-8-sig")
    try:
        updated, changed = retire_source(original)
    except RuntimeError as exc:
        raise SystemExit("SIN MODIFICAR: " + str(exc))
    existing = [p for p in (loader, assets, source_ref) if p.exists()]
    print("Panel/código Human Atlas:", "presente" if changed else "ausente")
    print("Recursos fallidos:", ", ".join(str(p.relative_to(root)) for p in existing) or "ninguno")
    print("Se mantienen: biblioteca anatómica LAB, CharacterLab, HandLab, GLB.")
    if not changed and not existing:
        print("Human Atlas ya está ausente. No se requiere acción.")
        return
    if not args.apply:
        print("Modo de revisión. Para retirar con respaldo: python scripts/retirar_human_atlas.py --apply")
        return
    backup_dir = root / ".local-backups"
    backup_dir.mkdir(exist_ok=True)
    archive = backup_dir / ("human-atlas-retirado-" + datetime.now().strftime("%Y%m%d-%H%M%S-%f") + ".zip")
    with ZipFile(archive, "w", compression=ZIP_DEFLATED) as z:
        z.write(main, "src/main.tsx")
        for p in existing:
            if p.is_file():
                z.write(p, p.relative_to(root).as_posix())
            elif p.is_dir():
                for child in p.rglob("*"):
                    if child.is_file():
                        z.write(child, child.relative_to(root).as_posix())
    if changed:
        tmp = main.with_name("main.tsx.without-atlas.tmp")
        tmp.write_text(updated, encoding="utf-8")
        tmp.replace(main)
    for p in existing:
        if p.is_dir():
            shutil.rmtree(p)
        else:
            p.unlink()
    print("Atlas retirado. Respaldo:", archive)
    print("Siguiente: npm run build && npm run test:consolidation")
if __name__ == "__main__":
    main_cli()
