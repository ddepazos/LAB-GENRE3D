import importlib.util
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("retirar_human_atlas", root/"scripts/retirar_human_atlas.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
source = """import {prepareAnatomyForLab} from './anatomyInterop';
import {loadAtlasManifest,createAtlasMesh,type AtlasManifest} from './anatomyAtlasLoader';
const other = 123;
  /* LAB_HUMAN_ATLAS_INTEGRATION_V1 */
  const [atlasManifest,setAtlasManifest]=useState<AtlasManifest|null>(null);
  const atlasMatches=atlasManifest?.parts.filter(part=>
    part.system===atlasSystem &&
    (!atlasQuery.trim()||part.name.includes(atlasQuery))
  )??[];
  const useful = 'kept';
  const importAtlasPart=async(partId:string)=>{
    if(!atlasManifest)return;
    await createAtlasMesh(atlasManifest,partId);
  };
  const timelineSelected=async(keys:ObjectKey[])=>{
    return keys;
  };
<section className="genre-atlas-panel" aria-label="Atlas anatómico detallado">Human Atlas UI</section><h3>MODELOS ANATÓMICOS EXTERNOS · GLB</h3>
<HandLab/><CharacterLab/>
"""
updated, changed=module.retire_source(source)
assert changed is True
assert "Human Atlas UI" not in updated
assert "AtlasManifest" not in updated
assert "atlasManifest" not in updated
assert "loadAtlasManifest" not in updated
assert "<HandLab/><CharacterLab/>" in updated
assert "<h3>MODELOS ANATÓMICOS EXTERNOS · GLB</h3>" in updated
assert "const useful = 'kept'" in updated
assert "const timelineSelected" in updated
same, changed_again=module.retire_source(updated)
assert not changed_again and same==updated
print("PASS: Atlas retirement is guarded, idempotent and preserves LAB anatomy tools")
