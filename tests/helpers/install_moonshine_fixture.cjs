/* Test-only loader for the same manifest used by the injector. */
const fs=require('node:fs'),path=require('node:path');
const root=require('./synodic-test-paths.cjs').root;
module.exports=async function(page,{hecate=false}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'modules.json'),'utf8'));
 const catalog=JSON.parse(require('node:child_process').execFileSync('python3',['-c',
  'import sys,json; from pathlib import Path; sys.path.insert(0,sys.argv[1]); from inject_mobile import build_catalog; p=Path(sys.argv[1]); m=json.loads((p/"modules.json").read_text()); print(json.dumps(build_catalog(p,m,["hecate"] if sys.argv[2]=="true" else [])))',root,String(hecate)],{encoding:'utf8'}));
 await page.evaluate(data=>{const el=document.createElement('script');el.type='application/json';el.id='LUNAR-mod-catalog';el.textContent=JSON.stringify(data);document.body.append(el);},catalog);
 const styles=[...manifest.styles,...(hecate?manifest.optional.hecate.styles:[])];
 for(let i=0;i<styles.length;i++){const f=styles[i],tag=await page.addStyleTag({content:fs.readFileSync(path.join(root,f),'utf8').replace(/^@import .*$/gm,'')});await tag.evaluate((el,id)=>{el.id=id;},i===0?'MOONSHINE-source-css':'MOONSHINE-fixture-'+i);}
 for(const f of manifest.modules)await page.addScriptTag({path:path.join(root,f)});
 if(hecate&&await page.evaluate(()=>LUNAR.bridge.mods.shouldLoad('hecate')))for(const f of manifest.optional.hecate.modules)await page.addScriptTag({path:path.join(root,f)});
};
