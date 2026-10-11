"""Editable timing data validation; animation remains in MOONSHINE."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from inject_mobile import transition_config


class TimingConfigTest(unittest.TestCase):
    def test_authored_defaults_and_external_edit(self):
        manifest = json.loads((ROOT / 'modules.json').read_text())
        self.assertEqual(transition_config(ROOT, manifest), dict(decisionMs=100, minLoadingMs=150,
                         fadeToBlackMs=50, fadeFromBlackMs=50, backgroundCrossfadeMs=200))
        with tempfile.TemporaryDirectory(dir=ROOT / 'builds') as directory:
            folder = Path(directory)
            custom = dict(configuration=dict(transitions='timing.toml'))
            file = folder / 'timing.toml'
            file.write_text('[presentation]\ndecision_ms=50\nmin_loading_ms=200\nfade_to_black_ms=0\nbackground_crossfade_ms=150\n')
            self.assertEqual(transition_config(folder, custom), dict(decisionMs=50, minLoadingMs=200,
                             fadeToBlackMs=0, fadeFromBlackMs=50, backgroundCrossfadeMs=150))
            for invalid in ['-1', '10001', 'true', '"slow"', 'nan', 'inf']:
                file.write_text('[presentation]\ndecision_ms=' + invalid + '\n')
                with self.assertRaises(ValueError):
                    transition_config(folder, custom)


if __name__ == '__main__':
    unittest.main()
