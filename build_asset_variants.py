"""Build declared CDN image variants from bounded original-header reads.
No runtime bitmap resizing, calibration downloads or preload catalog.
"""
import argparse, concurrent.futures, hashlib, json, re, struct, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent
OUTPUT=ROOT/'lunar/lunar.assets.variants.json'
from inject_mobile import quality_scales
SCALES=quality_scales(ROOT, json.loads((ROOT/'modules.json').read_text()))
def inspect(url):
    try:
        req=urllib.request.Request(url,headers={'Range':'bytes=0-32767','User-Agent':'SYNODIC asset metadata build'})
        with urllib.request.urlopen(req,timeout=12) as response:
            head=response.read(32)
            if head[:8]==b'\x89PNG\r\n\x1a\n': w,h=struct.unpack('>II',head[16:24])
            else:
                data=head+response.read(32736);w=h=0
                if data[:2]==b'\xff\xd8':
                    i=2
                    while i<len(data)-8:
                        if data[i]!=255: i+=1;continue
                        tag=data[i+1];i+=2
                        if tag in (216,217):continue
                        size=int.from_bytes(data[i:i+2],'big')
                        if tag in (192,193,194,195,197,198,199,201,202,203,205,206,207):h,w=struct.unpack('>HH',data[i+3:i+7]);break
                        i+=max(2,size)
                if not w or not h: raise ValueError('unsupported bounded header')
        if max(w,h)<600:return url,{'width':w,'height':h,'small':True}
        variants={k:url+'/v1/fit/w_'+str(max(1,round(w*scale)))+',h_'+str(max(1,round(h*scale)))+'/file.webp' for k,scale in SCALES.items()}
        return url,{'width':w,'height':h,'variants':variants}
    except Exception as error:return url,{'unavailable':type(error).__name__}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('input');args=parser.parse_args()
    text=Path(args.input).read_text();urls=sorted(set(re.findall(r'https://static\.wixstatic\.com/media/[^\s\"\'<>;)]+?\.(?:png|jpe?g|webp)',text)))
    old=json.loads(OUTPUT.read_text())['images'] if OUTPUT.exists() else {};results={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for i,(url,row) in enumerate(pool.map(inspect,urls)):
            results[url]=old.get(url,row) if 'unavailable' in row else row
            if i%40==0:print('Metadata',i,'/',len(urls),flush=True)
    OUTPUT.write_text(json.dumps({'schema':1,'provider':'Wix declared CDN derivatives; original dimensions from bounded headers','linearScales':SCALES,'fallbackOrder':{'ULTRA':['HIGH','MEDIUM','LOW'],'HIGH':['MEDIUM','ULTRA','LOW'],'MEDIUM':['LOW','HIGH','ULTRA'],'LOW':['MEDIUM','HIGH','ULTRA']},'images':results},indent=2)+'\n')
    print('Declared',sum('variants' in r for r in results.values()),'large images;',sum('unavailable' in r for r in results.values()),'unavailable headers')
if __name__=='__main__':main()
