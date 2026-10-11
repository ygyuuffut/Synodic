"""Injection integrity: current/legacy inputs, module order, no core mutation."""
import re
import os
import sys
import json
import tempfile
import shutil
from pathlib import Path
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from inject_mobile import inject, restore_font_imports, watermark_config, module_metadata, logger_quotes, build_config
manifest = json.loads((root/'modules.json').read_text())
addon_files = manifest['optional']['hecate']['modules'] + manifest['optional']['hecate']['styles'] + [manifest['optional']['hecate']['manifest']]
addon_available = (root/'hecate').is_dir() and all((root/name).is_file() for name in addon_files)
def assert_public(text):
    for name in addon_files:
        marker = re.sub(r'[^A-Z]+', '-', name.upper()).strip('-')
        assert '<!-- STG-'+marker+':START -->' not in text, 'Public output contains MOD file: '+name
strip = lambda s: re.sub(r'<!-- STG-[A-Z-]+:START -->.*?<!-- STG-[A-Z-]+:END -->\n?', '', restore_font_imports(s), flags=re.S)
with tempfile.TemporaryDirectory() as tmp:
    first, second = Path(tmp)/'first.html', Path(tmp)/'second.html'
    legacy = root.parent/'STG 0.2m-b2.html'
    current = Path(os.environ.get('STG_GAME_INPUT', str(root.parent/'STG 0.2m-b5.html'))).expanduser().resolve()
    assert current.exists(), 'Accepted b5 input is required'
    bare = Path(tmp)/'native-only.html'
    bare.write_text(strip(current.read_text()))
    sources = [bare] + ([legacy] if legacy.exists() else []) + [current]
    for source in sources:
        inject(source, first, root)
        inject(first, second, root)
        text = first.read_text()
        assert_public(text)
        catalog = json.loads(re.search(r'id="LUNAR-mod-catalog">(.*?)</script>', text, re.S)[1])
        assert [e['id'] for e in catalog] == ['lunar', 'moonshine']
        assert catalog[0]['apiVersion'] == module_metadata(root, 'lunar', manifest['metadata']['lunar'], True)['apiVersion']
        assert catalog[1]['requiresApi'] == module_metadata(root, 'moonshine', manifest['metadata']['moonshine'], True)['requiresApi']
        assert all(not e['description'].startswith(' ') for e in catalog)
        watermark = json.loads(re.search(r'id="LUNAR-main-menu-watermark">(.*?)</script>', text, re.S)[1])
        assert watermark == watermark_config(root, manifest)
        diagnostic = json.loads(re.search(r'id="LUNAR-diagnostic-config">(.*?)</script>', text, re.S)[1])
        assert diagnostic['build'] == build_config(root, manifest)['version']
        assert diagnostic['buildRevision'] == build_config(root, manifest)['revision']
        assert diagnostic['quotes'], '[crash].quotes must reach the diagnostic config'
        assert len(diagnostic['gameFingerprint']) == 64
        assert diagnostic['modules'] == catalog
        assert diagnostic['quotes'] == logger_quotes(root, manifest)
        assert watermark['position'] == 'bottom left'
        assert '--stg-watermark-text:' not in text
        assert text.count('id="LUNAR-main-menu-watermark"') == 1
        assert text == second.read_text(), 'Injection must be idempotent'
        assert strip(text) == strip(source.read_text()), 'Native core changed'
        ids = [Path(name).stem for name in manifest['modules']]
        offsets = [text.index('id="'+name+'"') for name in ids]
        assert offsets == sorted(offsets), 'Incorrect dependency order'
        assets = json.loads(re.search(r'id="LUNAR-asset-manifest">(.*?)</script>', text, re.S)[1])
        assert assets['schema'] == 1 and assets['profiles']['mobile']['available']
        assert not assets['profiles']['desktop']['available']
        assert [row['id'] for row in assets['assets'] if row['critical']] == ['menu.background']
        assert len({row['id'] for row in assets['assets']}) == len(assets['assets'])
        assert len({row['source'] for row in assets['assets']}) == len(assets['assets'])
        licenses = json.loads(re.search(r'id="MOONSHINE-loading-licenses">(.*?)</script>', text, re.S)[1])
        assert set(licenses) == {'JetBrains-Mono-LICENSE.txt', 'Noto-Emoji-LICENSE.txt', 'Material-Symbols-LICENSE.txt'}
        assert all('SIL OPEN FONT LICENSE' in licenses[name].upper() for name in ('JetBrains-Mono-LICENSE.txt', 'Noto-Emoji-LICENSE.txt'))
        assert 'APACHE LICENSE' in licenses['Material-Symbols-LICENSE.txt'].upper()
        assert text.index('<meta charset=') < 1024
        assert text.index('name="viewport"') < text.index('STG-BOOTSTRAP:START') < text.index('id="MOONSHINE-source-css"')
        assert text.count('STG-BOOTSTRAP:START') == 1
        assert text.count('data:font/woff2;base64,') == 7
        assert text.index('id="lunar.assets.core"') < text.index('id="lunar.bridge.pause"')
        assert text.index('id="lunar.logger.core"') < text.index('id="lunar.bridge.pause"')
        assert text.index('id="lunar.logger.storage"') < text.index('id="lunar.bridge.pause"')
        assert all(text.count('id="'+name+'"') == 1 for name in ids)
print('PASS injection order, idempotence, unchanged core ('+', '.join(source.name for source in sources)+')')

with tempfile.TemporaryDirectory() as tmp:
    assets = Path(tmp)
    (assets/'lunar').mkdir()
    quotes_file = assets/'lunar/lunar.logger.quotes.toml'
    assert logger_quotes(assets, manifest) == []
    for data in ('quotes = [', 'quotes = []', 'quotes = "wrong type"'):
        quotes_file.write_text(data)
        assert logger_quotes(assets, manifest) == []
    quotes_file.write_text('quotes = ["valid", ""]')
    assert logger_quotes(assets, manifest) == ['valid']
    quotes_file.write_text('[crash]\nquotes = ["new schema", "", 3]')
    assert logger_quotes(assets, manifest) == ['new schema']
    quotes_file.write_text('[crash]\nquotes = "invalid"')
    assert logger_quotes(assets, manifest) == []
    build_file = assets/'synodic.build.toml'
    for value in ('[build]\nversion="b6.6"\nrevision="label"', '[build]\nversion="b6.6"\nrevision="</script>"'):
        build_file.write_text(value)
        assert build_config(assets, manifest)['version'] == 'b6.6'
    for version in ('1.0.0-rc1', '1.0.0-rc.1', '1.0.0', '2.10.3+build.01'):
        build_file.write_text('[build]\nversion=' + json.dumps(version))
        assert build_config(assets, manifest)['version'] == version
    for version in ('01.0.0', '1.0.0-01', '1.0.0-rc..1', '1.0.0+', '1.0'):
        build_file.write_text('[build]\nversion=' + json.dumps(version))
        try: build_config(assets, manifest)
        except ValueError: pass
        else: raise AssertionError('invalid SemVer accepted: ' + version)
    for value in ('[build]\nversion=6.6', '[build]\nversion="invalid"', '[build]\nversion="b6.6"\nrevision=2'):
        build_file.write_text(value)
        try: build_config(assets, manifest)
        except ValueError: pass
        else: raise AssertionError('invalid build identity accepted')
print('PASS optional Logger legacy/crash quote schemas and standalone build identity validation')

if addon_available:
    with tempfile.TemporaryDirectory() as tmp:
        addon, normal = Path(tmp)/'hecate.html', Path(tmp)/'normal.html'
        inject(current, addon, root, hecate=True)
        addon_text = addon.read_text()
        catalog = json.loads(re.search(r'id="LUNAR-mod-catalog">(.*?)</script>', addon_text, re.S)[1])
        assert [e['id'] for e in catalog] == ['lunar', 'moonshine', 'hecate']
        assert addon_text.count('shouldLoad("hecate")') == len(manifest['optional']['hecate']['modules'])
        for name in manifest['optional']['hecate']['modules']:
            assert 'id="'+Path(name).stem+'"' in addon_text
        assert addon_text.index('id="lunar.api.hecate"') < addon_text.index('id="hecate.command.player"')
        inject(addon, normal, root, hecate=True)
        assert normal.read_text() == addon_text, 'MOD reinjection must be idempotent'
        inject(addon, normal, root)
        assert_public(normal.read_text())
        assert strip(addon.read_text()) == strip(current.read_text()) == strip(normal.read_text())
    print('PASS optional plugin installation/removal leaves core unchanged')
else:
    print('SKIP private HECATE install check: MOD not supplied in this checkout')

with tempfile.TemporaryDirectory() as tmp:
    assets, output = Path(tmp)/'assets', Path(tmp)/'public.html'
    assets.mkdir()
    for folder in ('lunar', 'moonshine', 'hecate', 'assets'):
        if (root/folder).is_dir():
            shutil.copytree(root/folder, assets/folder)
    for name in ('modules.json', 'display-config.js', 'bootstrap.loading.cjs', 'synodic.build.toml'):
        shutil.copy2(root/name, assets/name)
    if addon_available:
        # One missing dependency must never leave a partial API/panel installation.
        (assets/'hecate/hecate.panel.tools.css').unlink()
        inject(current, output, assets, hecate=True)
        assert_public(output.read_text())
        assert strip(output.read_text()) == strip(current.read_text())
    # A public source checkout omits both the private MOD and its dedicated API.
    shutil.rmtree(assets/'hecate', ignore_errors=True)
    (assets/'lunar/lunar.api.hecate.cjs').unlink(missing_ok=True)
    for enabled in (False, True):
        inject(current, output, assets, hecate=enabled)
        assert_public(output.read_text())
        assert strip(output.read_text()) == strip(current.read_text())
    public_manifest = json.loads((assets/'modules.json').read_text())
    public_manifest.pop('optional')
    (assets/'modules.json').write_text(json.dumps(public_manifest))
    inject(current, output, assets, hecate=True)
    assert_public(output.read_text())
    for missing in ('lunar', 'moonshine'):
        invalid = dict(public_manifest, modules=[f for f in public_manifest['modules'] if not f.startswith(missing+'/')])
        (assets/'modules.json').write_text(json.dumps(invalid))
        try:
            inject(current, output, assets)
        except ValueError as error:
            assert 'requires both' in str(error)
        else:
            raise AssertionError('Unpaired core accepted: '+missing)
print('PASS paired Runtime, public checkout without HECATE/API, incomplete MOD atomic skip and absent optional manifest')

# Manifest text is data, never executable HTML; reject an incompatible paired Core.
with tempfile.TemporaryDirectory() as tmp:
    assets, output = Path(tmp)/'assets', Path(tmp)/'game.html'
    assets.mkdir()
    for folder in ('lunar', 'moonshine', 'assets'):
        shutil.copytree(root/folder, assets/folder)
    for name in ('modules.json', 'display-config.js', 'bootstrap.loading.cjs', 'synodic.build.toml'):
        shutil.copy2(root/name, assets/name)
    toml = assets/'moonshine/moonshine.manifest.toml'
    # Use a controlled temporary fixture, not replace prose in the user's
    # editable description. Otherwise changing TOML wording silently removes
    # the escaping case and makes this integrity check fail for the wrong reason.
    api_version = module_metadata(assets, 'lunar', manifest['metadata']['lunar'], True)['apiVersion']
    def metadata_fixture(requirement):
        return ('[mod]\ntitle = "Escaping fixture"\nauthor = "Test"\n'
                'description = "</script><script>not_code()</script>"\nversion = "0.1"\n'
                'lunar.api.requirement = ' + json.dumps(requirement) + '\n')
    toml.write_text(metadata_fixture('>=' + api_version))
    inject(current, output, assets)
    text = output.read_text()
    catalog = json.loads(re.search(r'id="LUNAR-mod-catalog">(.*?)</script>', text, re.S)[1])
    assert '</script><script>not_code()</script>' in catalog[1]['description']
    assert '<script>not_code()</script>' not in text
    toml.write_text(metadata_fixture('>' + api_version))
    try:
        inject(current, output, assets)
    except ValueError as error:
        assert 'Incompatible Core' in str(error)
    else:
        raise AssertionError('Incompatible paired Core accepted')
print('PASS TOML script escaping and incompatible Core rejection')

# Watermark accepts supplied dotted tables and normal TOML, validates numbers/corners,
# embeds plain escaped data and does not require runtime filesystem access.
with tempfile.TemporaryDirectory() as tmp:
    assets, output = Path(tmp)/'assets', Path(tmp)/'game.html'
    assets.mkdir()
    for folder in ('lunar', 'moonshine', 'assets'):
        shutil.copytree(root/folder, assets/folder)
    for name in ('modules.json', 'display-config.js', 'bootstrap.loading.cjs', 'synodic.build.toml'):
        shutil.copy2(root/name, assets/name)
    build_file = assets/manifest['configuration']['build']
    build_file.write_text('[build]\nversion="b6.6"\nrevision="</script><script>bad()</script>"')
    (assets/'lunar/lunar.logger.quotes.toml').write_text('[crash]\nquotes=["nested </script> quote"]')
    inject(current, output, assets)
    config_text = re.search(r'id="LUNAR-diagnostic-config">(.*?)</script>', output.read_text(), re.S)[1]
    assert '</script>' not in config_text
    identity = json.loads(config_text)
    assert identity['buildRevision'] == '</script><script>bad()</script>'
    assert identity['quotes'] == ['nested </script> quote']
    config = assets/manifest['configuration']['mainMenuWatermark']
    for corner in ('bottom left', 'bottom right', 'top left', 'top right'):
        config.write_text('[watermark]\ntext = "</script><script>bad()</script> & 月相"\nposition = "'+corner+'"\nopacity = 0\n[watermark.font]\nname = "JetBrains Mono"\nweight = 700\nsize = 18\n')
        inject(current, output, assets)
        html = output.read_text()
        value = json.loads(re.search(r'id="LUNAR-main-menu-watermark">(.*?)</script>', html, re.S)[1])
        assert value['text'] == '</script><script>bad()</script> & 月相'
        assert value['position'] == corner and value['opacity'] == 0
        assert '<script>bad()</script>' not in html
    valid = config.read_text()
    for invalid in (valid.replace('opacity = 0', 'opacity = 2'), valid.replace('opacity = 0', 'opacity = nan'), valid.replace('size = 18', 'size = -1'), valid.replace('weight = 700', 'weight = true'), valid.replace('top right', 'center')):
        config.write_text(invalid)
        try:
            inject(current, output, assets)
        except ValueError as error:
            assert 'watermark' in str(error)
        else:
            raise AssertionError('Invalid watermark accepted')
print('PASS watermark TOML normalization, four corners, script escaping and invalid-setting rejection')
