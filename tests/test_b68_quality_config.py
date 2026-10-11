"""One editable resolution policy drives build URLs and logger scales."""
import json, sys, tempfile, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from inject_mobile import quality_scales, image_variants
class QualityConfigTest(unittest.TestCase):
 def test_defaults_and_edits(self):
  manifest=json.loads((ROOT/'modules.json').read_text())
  self.assertEqual(quality_scales(ROOT,manifest),{'LOW':.5,'MEDIUM':.7,'HIGH':.85,'ULTRA':1})
  with tempfile.TemporaryDirectory(dir=ROOT/'builds') as folder:
   folder=Path(folder);(folder/'lunar').mkdir();file=folder/'quality.toml';custom={'configuration':{'graphicsQuality':'quality.toml'}}
   registry={'images':{'https://example/art.png':{'width':1536,'height':1024},'small':{'width':64,'height':64,'small':True},'unknown':{'unavailable':'timeout'}}}
   (folder/'lunar/lunar.assets.variants.json').write_text(json.dumps(registry))
   file.write_text('[resolution_percent]\nfast=40.5\nstandard=65\nfancy=82\nultra=95\n')
   result=image_variants(folder,custom);self.assertEqual(result['linearScales'],{'LOW':.405,'MEDIUM':.65,'HIGH':.82,'ULTRA':.95})
   self.assertEqual(result['images']['https://example/art.png']['variants']['LOW'],'https://example/art.png/v1/fit/w_622,h_415/file.webp')
   self.assertNotIn('variants',result['images']['small']);self.assertNotIn('variants',result['images']['unknown'])
   for invalid in ['0','101','true','"slow"','nan','inf','90']:
    file.write_text('[resolution_percent]\nfast='+invalid+'\nstandard=70\nfancy=85\nultra=100\n')
    with self.assertRaises(ValueError):quality_scales(folder,custom)
   file.write_text('[resolution_percent]\nfast=50\n')
   with self.assertRaises(ValueError):quality_scales(folder,custom)
if __name__=='__main__':unittest.main()
