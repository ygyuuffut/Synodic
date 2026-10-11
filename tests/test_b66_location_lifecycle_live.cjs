/* Opt-in browser diagnostics/regression, never injected into the game. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},isMobile:true,hasTouch:true}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));page.on('crash',()=>errors.push('renderer crash'));page.on('dialog',d=>d.dismiss());
 if(!process.env.STG_LOCATION_REMOTE)await page.route('https://**/*',r=>r.abort());
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');if(process.env.CPU_RATE)await cdp.send('Emulation.setCPUThrottlingRate',{rate:Number(process.env.CPU_RATE)});
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 const main=page.locator('#MOONSHINE-root'),launch=page.locator('.MOONSHINE-location-launcher'),panel=page.locator('.MOONSHINE-location-panel');
 await main.locator('[data-ms-class~="stg-fs-no"]').click();await main.locator('[data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(()=>stgDevStomachMap());await sleep(700);
 async function enter(fn){await page.evaluate(fn);await sleep(900);assert(await launch.isVisible());}
 await enter(()=>stgGoTo('MapScreen'));
 // Sample actual SugarCube passage entrance, including before its opacity transition starts.
 await page.evaluate(()=>{window.entranceSamples=[];stgGoTo('MapScreen');let start=performance.now();function sample(){const h=document.querySelector('#MOONSHINE-root [data-ms-class~=stg-mobile-top-hud]'),l=document.querySelector('.MOONSHINE-location-launcher');let opacity=h?1:0;for(let n=h;n&&n.id!=='MOONSHINE-root';n=n.parentElement)opacity*=Number(getComputedStyle(n).opacity);if(l&&h&&h.isConnected)entranceSamples.push({time:performance.now()-start,hud:opacity,launcher:Number(getComputedStyle(l).opacity)});if(performance.now()-start<750)LUNAR.api.moonshine.timing.ui(()=>requestAnimationFrame(sample));}LUNAR.api.moonshine.timing.ui(()=>requestAnimationFrame(sample));});await sleep(1000);
 const samples=await page.evaluate(()=>entranceSamples);assert(samples.some(s=>s.hud<.1),'sampled initially hidden HUD');assert(samples.some(s=>s.hud>.1&&s.hud<.9),'sampled fade');if(!process.env.STG_LOCATION_BEFORE)assert(samples.every(s=>Math.abs(s.hud-s.launcher)<.025),JSON.stringify(samples));
 // The pending compatibility dialog has not committed yet; visibility must already be suppressed.
 for(const action of ['stg-mobile-top-hud-info','stg-banner-menu-btn']){
  const hidden=await page.evaluate(action=>{document.querySelector('#MOONSHINE-root [data-ms-class~="'+action+'"]').click();return getComputedStyle(document.querySelector('.MOONSHINE-location-launcher')).visibility;},action);
  if(!process.env.STG_LOCATION_BEFORE)assert.equal(hidden,'hidden','hide in the input callback, before visual commit');
  const close=main.locator(action==='stg-mobile-top-hud-info'?'[data-ms-class~=stg-mobile-tiny-close]':'[data-ig=close]');await close.click();await sleep(400);assert(await launch.isVisible());
 }
 // Game mutations interleaved with pause-control writes are still delivered (even same attribute).
 await page.evaluate(()=>{window.realChanges=[];window.unsub=LUNAR.api.moonshine.subscribe(c=>realChanges.push(c.domains));LUNAR.api.moonshine.timing.acquire('regression');document.body.classList.add('b66-native-probe');LUNAR.api.moonshine.timing.release('regression');});await sleep(200);assert(await page.evaluate(()=>realChanges.length>0));await page.evaluate(()=>{unsub();document.body.classList.remove('b66-native-probe');});await sleep(300);
 await page.evaluate(()=>{window.lifecycleCounts={capture:0,notify:0,workspace:0,patch:0};for(const [obj,key,name] of [[LUNAR.bridge.native,'capture','capture'],[MOONSHINE_WORKSPACE,'data','workspace'],[MOONSHINE_COMPONENTS,'patch','patch']]){const f=obj[key];obj[key]=function(){lifecycleCounts[name]++;return f.apply(this,arguments);};}window.lifecycleChanges=[];LUNAR.api.moonshine.subscribe(c=>{lifecycleCounts.notify++;lifecycleChanges.push({domains:c.domains,targets:c.targets});});window.lifecycleMap=document.querySelector('#MOONSHINE-root [data-ms-class~=submap-svg-wrap] svg');});
 const report={throttle:Number(process.env.CPU_RATE)||1,remote:!!process.env.STG_LOCATION_REMOTE,entranceMaxError:Math.max(...samples.map(s=>Math.abs(s.hud-s.launcher))),cases:[]};
 for(const scene of ['map','combat']){
  if(scene==='combat')await enter(()=>stgDevAveryBossChaos());await sleep(500);await page.evaluate(()=>{Object.keys(lifecycleCounts).forEach(k=>lifecycleCounts[k]=0);});
  const before=(await cdp.send('Performance.getMetrics')).metrics;const nodes=await page.evaluate(()=>document.querySelectorAll('*').length);
  for(let i=0;i<20;i++){
   await launch.click();await panel.waitFor();await sleep(i===0?600:190);
   if(i%3===0){await page.evaluate(()=>{MOONSHINE_LOCATION.close();MOONSHINE_LOCATION.close();});}else await panel.locator('.MOONSHINE-location-ok').click();
   await panel.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>LUNAR.api.moonshine.timing.active()),false);assert.equal(await main.evaluate(el=>el.inert),false);
   if(scene==='map')assert(await page.evaluate(()=>lifecycleMap===document.querySelector('#MOONSHINE-root [data-ms-class~=submap-svg-wrap] svg')));await sleep(60);
  }
  const counts=await page.evaluate(()=>({...lifecycleCounts})),after=(await cdp.send('Performance.getMetrics')).metrics;
  const metric=(list,name)=>list.find(m=>m.name===name).value;
  const row={scene,cycles:20,...counts,connectedNodesBefore:nodes,connectedNodesAfter:await page.evaluate(()=>document.querySelectorAll('*').length),scriptMs:(metric(after,'ScriptDuration')-metric(before,'ScriptDuration'))*1000,heapBytes:metric(after,'JSHeapUsedSize')};report.cases.push(row);
  console.log('lifecycle case',JSON.stringify(row));if(!process.env.STG_LOCATION_BEFORE){const control=await page.evaluate(async()=>{await MOONSHINE_RUNTIME.flush();const previous={...lifecycleCounts};MOONSHINE_LOCATION.open();MOONSHINE_LOCATION.close(true);LUNAR.bridge.port.revision();await Promise.resolve();return Object.fromEntries(Object.keys(previous).map(k=>[k,lifecycleCounts[k]-previous[k]]));});row.controlCycle=control;assert.deepEqual(control,{capture:0,notify:0,workspace:0,patch:0},'pause control alone never refreshes the game');assert(counts.capture<20,'no capture per open/close; genuine background notifications may remain');}
  assert.equal(row.connectedNodesAfter,row.connectedNodesBefore);
 }
 // Immediate scene teardown during an in-flight close does not focus/reopen a stale launcher.
 await launch.click();await page.evaluate(()=>{MOONSHINE_LOCATION.close();stgGoTo('Menu');});await panel.waitFor({state:'detached'});await launch.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>LUNAR.api.moonshine.timing.active()),false);
 assert.deepEqual(errors,[]);if(process.env.STG_LOCATION_REPORT)fs.writeFileSync(process.env.STG_LOCATION_REPORT,JSON.stringify(report,null,2));console.log('PASS location lifecycle',JSON.stringify(report));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
