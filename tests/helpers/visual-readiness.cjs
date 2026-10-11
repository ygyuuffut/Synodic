/* Test-only bounded visual oracle. Never part of scene/UI readiness. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
exports.functional=async function(page,{scene,map=false}={}){
 await page.waitForFunction(({scene,map})=>{
  const api=window.LUNAR?.api?.moonshine,root=document.querySelector('#MOONSHINE-root');
  return !!(api&&root&&!root.inert&&api.assets.status().state==='READY'&&!api.assets.status().error&&!api.assets.locked()&&(!scene||SugarCube.State.passage===scene)&&(!map||root.querySelector('.MOONSHINE-map-node')));
 },{scene,map},{timeout:30000});
 const proof=await page.evaluate(({map})=>{
  const api=LUNAR.api.moonshine,root=document.querySelector('#MOONSHINE-root');
  return {status:'UI_READY',scene:SugarCube.State.passage,locked:api.assets.locked(),error:api.assets.status().error,mapNodes:map?root.querySelectorAll('.MOONSHINE-map-node').length:null};
 },{map});
 assert(!proof.locked&&!proof.error);return proof;
};
exports.capture=async function(page,{out,tag,images=[],backgrounds=[],deadlineMs=30000}={}){
 fs.mkdirSync(out,{recursive:true});
 // Explicit screenshot targets are important to THIS capture. The separate
 // functionalTier still comes from LUNAR. No whole-document image enumeration.
 const result=await page.evaluate(async ({images,backgrounds,deadlineMs})=>{
  const api=LUNAR.api.moonshine,start=performance.now(),targets=[],seen=new Set();
  function add(url,image){if(!url||seen.has(url))return;seen.add(url);targets.push({url,image,functionalTier:api.assets.readiness(url).tier,tier:'important',done:false,reason:'pending'});}
  function visible(el){const css=getComputedStyle(el),r=el.getBoundingClientRect();return css.visibility!=='hidden'&&css.display!=='none'&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}
  images.forEach(selector=>document.querySelectorAll(selector).forEach(img=>{if(visible(img))add(img.currentSrc||img.src,img);}));
  backgrounds.forEach(selector=>document.querySelectorAll(selector).forEach(el=>{if(!visible(el))return;getComputedStyle(el).backgroundImage.replace(/url\(["']?([^"')]+)["']?\)/g,(_,url)=>{add(url,null);return _;});
   // Test-only normalized target, not just the old committed plate retained
   // while a new background decodes. No native DOM or runtime Logger oracle.
   const source=el._moonshineSourceAttrs,frame=source&&source['data-ms-background-frame'];
   if(frame){const asset=api.resources.backgroundImage(JSON.parse(frame).image);add(asset.url,null);}
   // A directly owned story plate has no compatibility-source attributes.
   // Its pending target is still normalized API data, not the painted old URL.
   if(el.id==='MOONSHINE-story-choice-background'){
    const target=(typeof api.chrome.background==='function'&&api.chrome.background())||api.chrome.story().background;
    if(target){const asset=api.resources.backgroundImage(target.image);add(asset.url,null);}
   }
  }));
  const cleanup=[];let expired=false,timer;
  const work=targets.map(target=>new Promise(resolve=>{
   const image=target.image||new Image();if(!target.image)image.dataset.msArtRole='cg';let ended=false;
   function finish(reason){if(ended)return;ended=true;target.done=reason==='decoded';target.reason=reason;resolve();}
   function decode(){if(!image.naturalWidth){finish('load-failed');return;}image.decode().then(()=>finish('decoded'),()=>finish('decode-failed'));}
   const load=()=>decode(),error=()=>finish('load-failed');image.addEventListener('load',load,{once:true});image.addEventListener('error',error,{once:true});
   cleanup.push(()=>{image.removeEventListener('load',load);image.removeEventListener('error',error);if(!target.image)image.removeAttribute('src');});
   if(!target.image)image.src=target.url;
   if(image.complete)decode();
  }));
  await Promise.race([Promise.all(work),new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve();},deadlineMs);})]);clearTimeout(timer);cleanup.forEach(fn=>fn());
  const motions=[];
  backgrounds.forEach(selector=>document.querySelectorAll(selector).forEach(el=>el.querySelectorAll('[data-ms-background-buffer]').forEach(buffer=>buffer.getAnimations().forEach(animation=>{if(animation.effect.getTiming().iterations===Infinity)return;motions.push({animation,url:api.resources.backgroundImage(buffer.style.backgroundImage).url});}))));
  if(!expired&&motions.length){await Promise.race([Promise.all(motions.map(row=>row.animation.finished.catch(()=>{}))),new Promise(resolve=>{timer=setTimeout(()=>{expired=true;resolve();},Math.max(0,deadlineMs-(performance.now()-start)));})]);clearTimeout(timer);}
  const missingAssets=targets.filter(t=>!t.done).map(t=>({url:t.url,tier:t.tier,functionalTier:t.functionalTier,reason:expired&&t.reason==='pending'?'deadline':t.reason}));
  if(expired)motions.filter(row=>row.animation.playState==='running').forEach(row=>missingAssets.push({url:row.url,tier:'important',functionalTier:api.assets.readiness(row.url).tier,reason:'background-animation-deadline'}));
  const status=missingAssets.length?'VISUAL_CAPTURE_DEGRADED':'VISUAL_SETTLED',log=api.logger.scope('MOONSHINE.transition');
  if(expired&&missingAssets.some(t=>t.reason==='deadline'))log.warn('ASSET_DECODE_TIMEOUT',{tier:'important',count:missingAssets.filter(t=>t.reason==='deadline').length});
  if(missingAssets.length)log.warn('VISUAL_CAPTURE_DEGRADED',{count:missingAssets.length});else log.info('VISUAL_SETTLED',{count:targets.length});
  return {status,deadlineMs,waitMs:Math.round(performance.now()-start),targets:targets.length,missingAssets};
 },{images,backgrounds,deadlineMs});
 const screenshot=path.join(out,tag+'.png');await page.screenshot({path:screenshot,timeout:30000});result.screenshot=path.basename(screenshot);
 fs.writeFileSync(path.join(out,tag+'.visual.json'),JSON.stringify(result,null,2));assert(!result.missingAssets.some(a=>a.functionalTier==='critical'),'Genuine critical visual failure: '+tag);return result;
};
exports.pass=async function(page,cases){await page.evaluate(cases=>LUNAR.api.moonshine.logger.scope('MOONSHINE.runtime').info('FUNCTIONAL_REGRESSION_PASS',{cases}),cases);};
