#!/usr/bin/env python3
"""Offline, reproducible WOFF2 subsets. Not a runtime/injector dependency."""
from pathlib import Path
import json, re, hashlib, shutil, io
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parent
manifest=json.loads((ROOT/'modules.json').read_text())
files=[ROOT/p for p in manifest['modules']+manifest['styles']]+[ROOT/'bootstrap.loading.cjs',ROOT/manifest['bootstrap']['style']]
native=re.sub(r'<!-- STG-[A-Z-]+:START -->.*?<!-- STG-[A-Z-]+:END -->\n?', '', (ROOT.parent/'STG 0.2m-b5.html').read_text(),flags=re.S)
texts=[p.read_text() for p in files]+[native]
# Include authored Unicode and JS escapes; no translated CJK library.
chars=set(range(0x20,0x250))
for text in texts:
    chars.update(map(ord,text))
    chars.update(int(x,16) for x in re.findall(r'\\u([\da-fA-F]{4})',text))
    for hi,lo in re.findall(r'\\u(D[89ABab][\da-fA-F]{2})\\u(D[C-Fc-f][\da-fA-F]{2})',text):
        chars.add(0x10000+((int(hi,16)-0xD800)<<10)+int(lo,16)-0xDC00)
fontdir=ROOT/'assets/fonts'
specs=[('ui','noto-sans.ttf',Path('assets/fonts/sources/noto-sans.ttf'),{'wdth':100,'wght':(400,700)},'Noto Sans',True,'Noto-Sans-LICENSE.txt'),
('mono','jetbrains-mono.ttf',Path('assets/fonts/sources/jetbrains-mono.ttf'),{'wght':(400,800)},'JetBrains Mono',False,'JetBrains-Mono-LICENSE.txt'),
('emoji','noto-emoji.ttf',Path('assets/fonts/sources/noto-emoji.ttf'),{'wght':400},'Noto Emoji',False,'Noto-Emoji-LICENSE.txt'),
('symbol','noto-symbols.ttf',Path('assets/fonts/sources/noto-symbols.ttf'),{'wght':400},'Noto Sans Symbols',False,'Noto-Symbols-LICENSE.txt'),
('symbol2','noto-symbols2.ttf',Path('assets/fonts/sources/noto-symbols2.ttf'),{},'Noto Sans Symbols 2',False,'Noto-Symbols2-LICENSE.txt')]
native_aliases={'ui':['Noto Sans','Cinzel','Crimson Pro','Georgia','Helmet','Freesans','serif','sans-serif'],'mono':['JetBrains Mono','Consolas','Courier New','monospace']}
rows=[]; sizes=[]
for role,source_name,source,axes,original,critical,license in specs:
    source=source if source.is_absolute() else ROOT/source
    saved=fontdir/'sources'/source_name
    if source!=saved: shutil.copy2(source,saved)
    font=TTFont(saved,recalcTimestamp=False)
    full=io.BytesIO();font.flavor='woff2';font.save(full);font.flavor=None
    if axes: font=instantiateVariableFont(font,axes,inplace=True)
    if 'gvar' in font:
        font['gvar'].variations={g:font['gvar'].variations.get(g,[]) for g in font.getGlyphOrder()}
    family='SYNODIC '+role.capitalize()
    for record in font['name'].names:
        if record.nameID in (1,2,3,4,6,16,17):
            value=family.replace(' ','-') if record.nameID==6 else ('Regular' if record.nameID in (2,17) else family)
            record.string=value.encode(record.getEncoding(),errors='replace')
        elif record.nameID==25 or record.nameID>=256:
            # Variation PostScript prefixes/instance names also lose reserved names;
            # copyright, trademark, license and author records remain unchanged.
            value=record.toUnicode().replace(original.replace(' ',''),family.replace(' ','')).replace(original,family)
            record.string=value.encode(record.getEncoding(),errors='replace')
    keep=chars & set(font.getBestCmap());options=subset.Options();options.flavor='woff2';options.recalc_timestamp=False;options.name_IDs=['*'];options.name_legacy=True
    worker=subset.Subsetter(options=options);worker.populate(unicodes=keep);worker.subset(font);font.flavor='woff2'
    target=fontdir/(role+'.woff2');font.save(target)
    row=dict(id='font.'+role,family=family,aliases=native_aliases.get(role,[original]),role=role,kind='embedded',file=str(target.relative_to(ROOT)),weight='400 700' if role=='ui' else '400 800' if role=='mono' else '400',critical=critical,profiles=['common'],sample='Aa09' if role in ('ui','mono') else '♥✔📡' if role=='emoji' else '◀▶',license='assets/fonts/'+license)
    rows.append(row);sizes.append(dict(id=row['id'],original=original,source=str(saved.relative_to(ROOT)),sourceSha256=hashlib.sha256(saved.read_bytes()).hexdigest(),sourceBytes=saved.stat().st_size,fullWoff2Bytes=len(full.getvalue()),subsetBytes=target.stat().st_size,glyphs=len(keep),sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
roles={
 'ui':dict(family='"SYNODIC Ui",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',resources=['font.ui'],classification='critical'),
 'display':dict(family='"SYNODIC Ui",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',resources=['font.ui'],classification='critical'),
 'mono':dict(family='"SYNODIC Mono","MOONSHINE Loading Mono",ui-monospace,monospace',resources=['font.mono'],classification='deferred'),
 'emoji':dict(family='"SYNODIC Emoji","SYNODIC Symbol","SYNODIC Symbol2",sans-serif',resources=['font.emoji','font.symbol','font.symbol2'],classification='deferred'),
 'symbol':dict(family='"SYNODIC Symbol","SYNODIC Symbol2",sans-serif',resources=['font.symbol','font.symbol2'],classification='deferred'),
 'symbol2':dict(family='"SYNODIC Symbol2",sans-serif',resources=['font.symbol2'],classification='deferred'),
 'system':dict(family='Roboto,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',resources=[],classification='system')}
(ROOT/'lunar/lunar.fonts.manifest.json').write_text(json.dumps(dict(schema=1,roles=roles,resources=rows,externalResources=[dict(id='font.bootstrap.mono',family='MOONSHINE Loading Mono',classification='critical',kind='bootstrap',profiles=['common']),dict(id='font.bootstrap.moons',family='MOONSHINE Loading Moons',classification='critical',kind='bootstrap',profiles=['common']),dict(id='font.native.icons',family='tme-fa-icons',classification='deferred',kind='native-embedded',profiles=['common'])],nativeImportFamilies=['Cinzel','Crimson+Pro']),indent=2)+'\n')
(ROOT/'diagnostics/b66-font-subsets.json').write_text(json.dumps(sizes,indent=2)+'\n')
print(json.dumps(sizes,indent=2))
