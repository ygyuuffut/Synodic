"""Rebuild the fixed SVG path table from local, licensed official assets."""
from pathlib import Path
import json,re,hashlib,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent
names=['login','logout','format_align_justify','swords','crown','not_listed_location','fmd_bad','bed','settings_suggest','cyclone','verified_user','privacy_tip','shield_with_heart','poker_chip','deployed_code']
rows=[];paths={}
for name in names:
 file=root/'assets/icons/map'/f'{name}.svg';data=file.read_bytes();svg=ET.fromstring(data);viewbox=svg.attrib.get('viewBox','0 0 24 24');p=[e.attrib['d'] for e in svg.iter() if e.tag.endswith('path') and 'd' in e.attrib];assert p
 paths[name]={'viewBox':viewbox,'paths':p};rows.append({'name':name,'url':f'https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/{name}/materialsymbolsoutlined/{name}_24px.svg','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'viewBox':viewbox})
(root/'assets/icons/map/manifest.json').write_text(json.dumps({'family':'Material Symbols Outlined','axes':{'opsz':24,'wght':400,'FILL':0,'GRAD':0},'license':'Apache-2.0','icons':rows},indent=2)+'\n')
f=root/'moonshine/moonshine.component.map_visuals.cjs';s=f.read_text();s=re.sub(r' var paths=.*?;\n',lambda m:' var paths='+json.dumps(paths,separators=(',',':'))+';\n',s,count=1);f.write_text(s)
print('15 fixed SVGs:',sum(r['bytes'] for r in rows),'source bytes; no font payload or runtime requests')
