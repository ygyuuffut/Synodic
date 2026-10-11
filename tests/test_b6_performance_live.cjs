/* Diagnostic, not a performance pass/fail threshold. A/B gates are test-only. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const paths=require('./helpers/synodic-test-paths.cjs'),{instrument}=require('./helpers/performance-probe.cjs');
const input=fs.readFileSync(paths.game(process.env.STG_TEST_HTML||'STG 0.2m-b6.html'),'utf8'),probed=instrument(input);
const output=path.resolve(paths.root,process.env.PERF_OUTPUT||'builds/performance-b6');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'instrumented.html'),probed);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report=process.env.PERF_CONTROL_ONLY?JSON.parse(fs.readFileSync(path.join(output,'report.json'),'utf8')):{date:process.env.PERF_DATE||'2026-10-02',viewport:{width:400,height:760},throttle:Number(process.env.PERF_CPU_RATE||4),notes:['Timings are inclusive, recursive calls counted separately; do not sum parent and child totals.','rAF gaps are main-thread scheduling gaps, not compositor FPS.','Network fixture: PERF_CRITICAL_FIXTURE substitutes tiny SVG for current image/fetch requests; otherwise all remote requests aborted. Audio/fonts always aborted; no phone/GPU claim.','Read-only/no-notify freeze downstream consumer refresh, including direct routes/observers, not only subscribers. Incidental native route pack conversions remain counted.','no-notify uses one shadow source pull per notification epoch, a lower bound on normal consumer fan-out.','no-visible-dom retains the hidden workspace; only player-facing DOM commit is frozen.','Same test-only seeded RNG during fixture/card play; native functions unmodified.'],runs:[]};
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 async function create(withProbe=true){
  const context=await browser.newContext({viewport:report.viewport,hasTouch:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>process.env.PERF_CRITICAL_FIXTURE&&/^(image|fetch)$/.test(r.request().resourceType())&&r.request().url().includes('/media/')?r.fulfill({contentType:'image/svg+xml',headers:{'Access-Control-Allow-Origin':'*'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="760"><rect width="400" height="760" fill="#302035"/></svg>'}):r.abort());await page.route('http://synodic-perf.test/**',r=>r.fulfill({contentType:'text/html',body:withProbe?probed:input}));
  if(!withProbe)await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);window.perfControl={active:false,frames:[],tasks:[],last:0};function tick(t){const p=perfControl;if(p.active){if(p.last)p.frames.push(t-p.last);p.last=t;}raf(tick);}raf(tick);new PerformanceObserver(list=>{if(perfControl.active)perfControl.tasks.push(...list.getEntries().map(e=>e.duration));}).observe({type:'longtask'});});
  const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:report.throttle});
  let startup='document';
  try{
   await page.goto('http://synodic-perf.test/game');const own=page.locator('#MOONSHINE-root');
   startup='boot-ready';await page.waitForFunction(()=>window.LUNAR&&window.MOONSHINE_RUNTIME&&!LUNAR.assets.locked(),null,{timeout:45000});
   startup='fullscreen';await own.locator('[data-ms-class~="stg-fs-no"]').click();startup='consent';await own.locator('[data-ms-class~="stg-consent-btn-accept"]').click();
   await page.evaluate(()=>stgStartNewGame());startup='character-ready';await page.waitForFunction(()=>!LUNAR.assets.locked(),null,{timeout:45000});
   startup='character-confirm';await own.locator('[data-ms-class~="charsel-confirm"]').click();await own.locator('[data-ms-class~="stg-story-panel"]').waitFor();await wait(1600);
  }catch(error){
   const failure={startup,errors,message:error.message};
   try{failure.state=await page.evaluate(()=>({lunar:!!window.LUNAR,runtime:!!window.MOONSHINE_RUNTIME,assets:window.LUNAR?.api?.moonshine?.assets?.status(),presentation:window.MOONSHINE_PRESENTATION?.status(),passage:window.SugarCube?.State?.passage,html:document.querySelector('#MOONSHINE-root')?.outerHTML.slice(0,12000)}));await page.screenshot({path:path.join(output,'startup-failure.png'),timeout:10000});}catch(capture){failure.captureError=capture.message;}
   fs.writeFileSync(path.join(output,'startup-failure.json'),JSON.stringify(failure,null,2));throw error;
  }
  return {context,page,cdp,errors};
 }
 async function phase(run,name,mode,action,ms=1200){
  const {page,cdp}=run;const metric=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));const before=await metric();
  await page.evaluate(({name,mode})=>SYNODIC_PERF.begin(name,mode),{name,mode});await action();await wait(ms);const data=await page.evaluate(()=>SYNODIC_PERF.end());const after=await metric();
  data.name=name;data.cdp={};for(const k of ['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration'])data.cdp[k]=after[k]-before[k];
  report.runs.push(data);console.log(name,mode,JSON.stringify({notify:data.stats['LUNAR.notify.time']?.count,capture:data.stats['LUNAR.game.capture.time']?.count,nativeCapture:data.stats['LUNAR.native.capture.time']?.count,render:data.stats['MOONSHINE.runtime.render.time']?.count,patch:data.stats['MOONSHINE.catalog.patch.time']?.count,frame:data.frames,layout:data.cdp.LayoutDuration,script:data.cdp.ScriptDuration}));return data;
 }
 if(!process.env.PERF_CONTROL_ONLY){const run=await create();
 await phase(run,'story-idle','normal',async()=>{},2200);
 await phase(run,'open-actions-pointer','normal',()=>run.page.locator('#MOONSHINE-root [data-ms-class~="stg-story-actions"]').click());
 await phase(run,'accordion-open','normal',()=>run.page.locator('[data-action-id="upgrade"] .MOONSHINE-action-summary').click(),700);
 await run.page.evaluate(()=>MOONSHINE_ACTIONS.close());await wait(250);
 // Use the game's existing developer combat fixture, not a replacement mechanic.
 await run.page.evaluate(()=>{let seed=319;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);stgDevCardTestCombat('dodge',1);});await run.page.locator('#MOONSHINE-root [data-ms-id="stg-root"] .MOONSHINE-card, #MOONSHINE-combat [data-combat-card]').first().waitFor();await wait(900);
 await phase(run,'combat-idle','normal',async()=>{},2200);
 const trace=[];run.cdp.on('Tracing.dataCollected',e=>trace.push(...e.value));await run.cdp.send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline.stack,v8.execute,blink.user_timing',transferMode:'ReportEvents'});
 const play=await phase(run,'one-card-native','normal',()=>run.page.evaluate(()=>{const i=_STG.hand.findIndex(c=>!c.unplayable&&stgCardEffCost(c)<=_STG.energy);if(i<0)throw Error('No playable fixture card');window.perfPlayed={id:_STG.hand[i].id,name:_STG.hand[i].name};stgPlayCard(i);}),1500);
 const complete=new Promise(resolve=>run.cdp.once('Tracing.tracingComplete',resolve));await run.cdp.send('Tracing.end');await complete;fs.writeFileSync(path.join(output,'one-card-trace.json.gz'),zlib.gzipSync(JSON.stringify({traceEvents:trace})));
 const layouts=trace.filter(e=>e.name==='Layout'&&e.ph==='X');play.trace={layoutCount:layouts.length,totalLayoutMs:layouts.reduce((s,e)=>s+(e.dur||0)/1000,0),layoutStacks:layouts.filter(e=>e.args?.beginData?.stackTrace).sort((a,b)=>(b.dur||0)-(a.dur||0)).slice(0,8).map(e=>({ms:e.dur/1000,stack:e.args.beginData.stackTrace})),frameEvents:Object.fromEntries(['DrawFrame','DroppedFrame','BeginFrame'].map(name=>[name,trace.filter(e=>e.name===name).length]))};
 await phase(run,'controlled-hp-native-bars','normal',()=>run.page.evaluate(()=>{_STG.player.hp=Math.max(1,_STG.player.hp-1);stgUpdateBlockBars();}),1000);
 assert.deepEqual(run.errors,[]);
 // Same-scene shop state refresh while the upgrade accordion is still resizing.
 await run.page.evaluate(()=>{_stgUpgradePicks=STG_BOONS.slice(0,7);_stgUpgradeCosts=[10,20,30,40,50,60,70];_STG.player.data=100;_stgMerlinLine=STG_MERLIN_LINES.intro[0];stgGoTo('Upgrade');});await run.page.locator('.MOONSHINE-story-actions').waitFor();await run.page.waitForFunction(()=>!LUNAR.assets.locked());await run.page.locator('.MOONSHINE-story-actions').click();await run.page.locator('[data-action-id="upgrade"] .MOONSHINE-action-summary').waitFor();await wait(200);
 await run.page.evaluate(()=>{document.querySelector('[data-action-id="upgrade"] .MOONSHINE-action-summary').click();});await wait(190);
 const identity=await run.page.evaluate(()=>{window.perfWatched=document.querySelector('[data-action-id="upgrade"]');return {id:SYNODIC_PERF.nodeId(perfWatched),animations:perfWatched.getAnimations().map(a=>({state:a.playState,frames:a.effect.getKeyframes()}))};});
 const update=await phase(run,'shop-balance-during-animation','normal',()=>run.page.evaluate(()=>{_STG.player.data=0;LUNAR.bridge.port.emit();}),600);update.identity={before:identity,after:await run.page.evaluate(()=>({connected:perfWatched.isConnected,same:perfWatched===document.querySelector('[data-action-id="upgrade"]'),id:SYNODIC_PERF.nodeId(document.querySelector('[data-action-id="upgrade"]'))}))};
 assert(identity.animations.some(a=>a.state==='running'),'probe must hit a live height animation');if(process.env.PERF_IDENTITY_REQUIRED){assert(update.identity.after.connected,'ordinary refresh must preserve animated row');assert(update.identity.after.same,'ordinary refresh must preserve row identity');}assert.deepEqual(run.errors,[]);await run.context.close();
 // Four fresh runs per repetition, same existing native combat fixture and one
 // native card play. Changing notify/UI is deliberate only in diagnostic modes.
 for(let repeat=0;repeat<Number(process.env.PERF_REPEATS||3);repeat++)for(const mode of ['read-only','no-notify','no-visible-dom','normal']){
  const r=await create();await r.page.evaluate(()=>{let seed=319;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);stgDevCardTestCombat('dodge',1);});await r.page.locator('#MOONSHINE-root [data-ms-id="stg-root"] .MOONSHINE-card, #MOONSHINE-combat [data-combat-card]').first().waitFor();await wait(900);
  const result=await phase(r,'ab-card-'+repeat,mode,()=>r.page.evaluate(()=>{const i=_STG.hand.findIndex(c=>!c.unplayable&&stgCardEffCost(c)<=_STG.energy);if(i<0)throw Error('No playable card');stgPlayCard(i);}),1500);
  result.state=await r.page.evaluate(()=>({hand:_STG.hand.length,energy:_STG.energy,hp:_STG.player.hp,enemy:_STG.enemy.hp}));assert.deepEqual(r.errors,[]);await r.context.close();
 }
 }
 // Uninstrumented control: confirms operation semantics and gives scheduling /
 // CDP totals without any diagnostic wrappers or animation/mutation observers.
 const control=await create(false);await control.page.evaluate(()=>{let seed=319;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);stgDevCardTestCombat('dodge',1);});await control.page.locator('#MOONSHINE-root [data-ms-id="stg-root"] .MOONSHINE-card, #MOONSHINE-combat [data-combat-card]').first().waitFor();await wait(900);
 const before=Object.fromEntries((await control.cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));await control.page.evaluate(()=>{perfControl.active=true;const i=_STG.hand.findIndex(c=>!c.unplayable&&stgCardEffCost(c)<=_STG.energy);stgPlayCard(i);});await wait(1500);const after=Object.fromEntries((await control.cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));report.control={monitor:'rAF/LongTask only; no pipeline timing wrappers or A/B gates',cdp:Object.fromEntries(['LayoutCount','LayoutDuration','ScriptDuration','TaskDuration'].map(k=>[k,after[k]-before[k]])),state:await control.page.evaluate(()=>({hand:_STG.hand.length,energy:_STG.energy,hp:_STG.player.hp,enemy:_STG.enemy.hp})),scheduling:await control.page.evaluate(()=>{perfControl.active=false;return {maxRafGap:Math.max(...perfControl.frames),longTasks:perfControl.tasks};}),errors:control.errors};assert.deepEqual(control.errors,[]);for(const r of report.runs.filter(r=>r.name.startsWith('ab-card')))assert.deepEqual(r.state,report.control.state,'A/B must preserve card result');await control.context.close();
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log('Saved diagnostic report and trace to',output);
}finally{await browser.close();}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(output,'partial-report.json'),JSON.stringify(report,null,2));process.exitCode=1;});
