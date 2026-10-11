/* Rendered opacity, interrupted transitions and the real Mods launcher. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const paths=require('./helpers/synodic-test-paths.cjs');
const html=fs.readFileSync(paths.game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.6.pending.html'),'utf8');
const out=path.join(paths.root,process.env.LOADING_OUTPUT||'builds/performance-b66-loading/visual');fs.mkdirSync(out,{recursive:true});
const baseline=!!process.env.LOADING_BASELINE,report={baseline,fixture:[],live:[]};
const check=(value,message)=>{if(!baseline)assert(value,message);};
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const boot=html.match(/<!-- STG-BOOTSTRAP:START -->([\s\S]*?)<!-- STG-BOOTSTRAP:END -->/)[1];
 const catalog=Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)).find(m=>m[1].includes('#MOONSHINE-mods-root .MOONSHINE-mods-launcher'))[1];
 for(const reduced of [false,true]){
  const context=await browser.newContext({viewport:{width:400,height:760},reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage();
  await page.route('https://**/*',r=>r.abort());
  await page.setContent('<!doctype html><html><head><style>button{transition:all 500ms}'+catalog+'</style>'+boot+'</head><body><div id="MOONSHINE-mods-root" style="width:400px;height:760px"><button class="MOONSHINE-mods-launcher">🧩</button></div></body></html>');
  const data=await page.evaluate(async reduced=>{
   const shell=SYNODIC_BOOTSTRAP,node=shell.node,launcher=document.querySelector('.MOONSHINE-mods-launcher');
   const wait=ms=>new Promise(ok=>setTimeout(ok,ms)),opacity=()=>Number(getComputedStyle(node).opacity),visibility=()=>getComputedStyle(launcher).visibility;
   const initial=visibility();await wait(180);shell.hide();await wait(180);
   shell.show();let entry=node.getAnimations()[0];if(entry){entry.pause();entry.currentTime=70;}
   const duration=entry&&entry.effect.getTiming().duration,entered=opacity(),same=entry;for(let i=0;i<20;i++)shell.show();const idempotent=node.getAnimations()[0]===same;
   shell.hide();const leaving=visibility();let exit=node.getAnimations().at(-1);if(exit){exit.pause();exit.currentTime=0;}
   const reversedExit=opacity(),overlap=node.getAnimations().length;
   if(exit){exit.currentTime=70;}const halfExit=opacity();shell.show();entry=node.getAnimations()[0];if(entry){entry.pause();entry.currentTime=0;}
   const reversedEntry=opacity();if(entry)entry.play();await wait(180);
   shell.hide();const duringExit={hidden:node.hidden,visibility:visibility()};await wait(180);
   return {reduced,duration,initial,entered,idempotent,reversedExit,overlap,halfExit,reversedEntry,leaving,duringExit,hidden:node.hidden,restored:visibility(),stable:node===shell.node,frames:node.querySelector('.MOONSHINE-loading-moons').children.length};
  },reduced);report.fixture.push(data);console.log('fixture',JSON.stringify(data));
  check(data.initial==='hidden'&&(reduced?data.duringExit.hidden:data.leaving==='hidden'),'Mods stays hidden until exit completes');
  check(data.hidden&&data.restored==='visible','completion restores launcher');check(data.stable&&data.frames===8,'stable moon DOM');check(data.idempotent,'repeated show must not restart fade');
  if(!reduced){check(data.duration===140,'140ms fade');check(data.entered>0&&data.entered<1,'rendered intermediate entry opacity');check(Math.abs(data.entered-data.reversedExit)<.001,'exit resumes current opacity');check(Math.abs(data.halfExit-data.reversedEntry)<.001,'re-entry resumes current opacity');check(data.overlap===1,'only one shell opacity animation');check(!data.duringExit.hidden&&data.duringExit.visibility==='hidden','launcher stays hidden for entire exit');}
  await context.close();
 }
 for(const viewport of [{width:400,height:760},{width:400,height:866}]){
  const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',async r=>{if(r.request().url().includes('/media/')){await new Promise(ok=>setTimeout(ok,450));return r.fulfill({contentType:'image/svg+xml',headers:{'Access-Control-Allow-Origin':'*'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="760"/>'});}return r.abort();});
  await page.route('http://synodic-loading.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await page.goto('http://synodic-loading.test/game');await page.waitForFunction(()=>window.LUNAR?.assets.status().state==='READY'&&SYNODIC_BOOTSTRAP.node.hidden);
  await page.locator('#MOONSHINE-root [data-ms-class~="stg-fs-no"]').click();await page.locator('#MOONSHINE-root [data-ms-class~="stg-consent-btn-accept"]').click();
  await page.locator('.MOONSHINE-mods-launcher').waitFor();await page.evaluate(()=>LUNAR.api.moonshine.timing.acquire('loading-test'));await page.waitForTimeout(250);
  await page.evaluate(()=>{window.loadingNotifies=0;window.loadingFits=0;LUNAR.api.moonshine.subscribe(()=>loadingNotifies++);const fit=MOONSHINE_GEOMETRY.invalidateAll;MOONSHINE_GEOMETRY.invalidateAll=function(){loadingFits++;return fit.apply(this,arguments);};window.savedLoading=SYNODIC_BOOTSTRAP.node;window.savedLauncher=document.querySelector('.MOONSHINE-mods-launcher');window.savedMenu=document.querySelector('#MOONSHINE-root');SYNODIC_BOOTSTRAP.show();window.immediateLoadingVisibility=getComputedStyle(savedLauncher).visibility;});
  await page.waitForTimeout(180);await page.screenshot({path:path.join(out,'loading-'+viewport.height+'.png')});
  const shown=await page.evaluate(()=>({visibility:getComputedStyle(savedLauncher).visibility,immediate:immediateLoadingVisibility,opacity:Number(getComputedStyle(savedLoading).opacity),parent:savedLoading.parentElement.tagName,hidden:savedLoading.hidden}));
  await page.evaluate(()=>SYNODIC_BOOTSTRAP.hide());const leaving=await page.evaluate(()=>getComputedStyle(savedLauncher).visibility);await page.waitForTimeout(200);
  const data=await page.evaluate(()=>({hidden:savedLoading.hidden,visibility:getComputedStyle(savedLauncher).visibility,same:savedLoading===SYNODIC_BOOTSTRAP.node&&savedLauncher===document.querySelector('.MOONSHINE-mods-launcher')&&savedMenu===document.querySelector('#MOONSHINE-root'),notifications:loadingNotifies,globalFits:loadingFits}));
  report.live.push({viewport,shown,leaving,...data});check(shown.immediate==='hidden'&&shown.visibility==='hidden'&&leaving==='hidden','real Mods hidden through Loading fade');check(data.hidden&&data.visibility==='visible'&&data.same,'real launcher and menu restored without replacement');check(data.notifications===0&&data.globalFits===0,'visual lifecycle has no game notifications/global fit');assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(baseline?'Recorded baseline':'PASS loading visual lifecycle');
}finally{await browser.close();}})().catch(e=>{console.error(e);fs.writeFileSync(path.join(out,'partial-report.json'),JSON.stringify(report,null,2));process.exitCode=1;});
