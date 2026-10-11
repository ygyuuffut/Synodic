/* Real delayed body prose must be read before the next ACTIONS cycle. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const paths=require('./helpers/synodic-test-paths.cjs');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());page.setDefaultTimeout(8000);
 const own=s=>page.locator('#MOONSHINE-root '+s),actions=s=>page.locator('#MOONSHINE-actions-root '+s);
 async function until(fn,arg){for(let i=0;i<240;i++){if(await page.evaluate(fn,arg))return;await new Promise(r=>setTimeout(r,30));}throw Error('Condition timed out: '+fn);}
 async function open(){await own('[data-ms-class~="stg-story-actions"]').click();}
 async function execute(prefix){const toggle=actions('.MOONSHINE-action-summary').filter({has:page.locator('.MOONSHINE-action-label',{hasText:new RegExp('^'+prefix)})});if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();await until(()=>{const row=document.querySelector('#MOONSHINE-actions-root .MOONSHINE-action-selected');return row?.classList.contains('MOONSHINE-action-revealed')&&!row.querySelector('.MOONSHINE-action-detail').inert;});await actions('.MOONSHINE-action-selected .MOONSHINE-action-full').click();}
 await page.goto(pathToFileURL(paths.game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 await own('[data-ms-class~="stg-fs-no"]').click();await own('[data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(()=>stgStartNewGame());await own('[data-ms-class~="charsel-confirm"]').click();
 await page.evaluate(()=>stgBodyExplorationStart('arc'));
 await until(()=>document.getElementById('enc-text')?.hasAttribute('data-lunar-story-id')&&LUNAR.api.moonshine.actions.read()?.ready);
 assert(await own('[data-lunar-story-id]').textContent().then(t=>t.includes('You scale the spike')));
 // Different art waits two seconds before publishing the destination prose.
 await open();await execute('Continue up onto the seat');
 assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'new authored prose closes ACTIONS before the native art delay');
 const pending=await page.evaluate(()=>LUNAR.api.moonshine.actions.read());assert(pending.story.hasNarrative&&pending.story.pending);assert.equal(pending.ready,false);assert.equal(pending.choiceOnly,false);assert.equal(await page.evaluate(()=>LUNAR.bridge.pause.active()),false,'ACTIONS must not pause the native entrance timer');
 await until(()=>_stgBodyNode==='seat'&&document.getElementById('enc-text')?.hasAttribute('data-lunar-story-id')&&LUNAR.api.moonshine.actions.read()?.ready);
 assert(await own('[data-lunar-story-id]').textContent().then(t=>t.includes('You haul yourself')));assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'prose completion does not reopen ACTIONS');
 // Instant sensory prose also requires returning to the story, including a
 // repeat of exactly the same text. It is not an animation completion event.
 // Test-only counters catch accidental whole-root patches/global geometry on
 // the local sensory update; no production instrumentation or new hot route.
 await page.evaluate(()=>{window.senseTrace={active:false,full:0,globalFit:0,domains:[],origins:[]};const describe=LUNAR.bridge.updates.describe;LUNAR.bridge.updates.describe=function(node,type,attribute){const change=describe.apply(this,arguments);if(senseTrace.active&&change?.full)senseTrace.origins.push({id:node.id,type,attribute,classes:node.className});return change;};const patch=MOONSHINE_COMPONENTS.patch,fit=MOONSHINE_GEOMETRY.invalidateAll;MOONSHINE_COMPONENTS.patch=function(parent){if(senseTrace.active&&parent===document.getElementById('MOONSHINE-root'))senseTrace.full++;return patch.apply(this,arguments);};MOONSHINE_GEOMETRY.invalidateAll=function(){if(senseTrace.active)senseTrace.globalFit++;return fit.apply(this,arguments);};LUNAR.api.moonshine.subscribe(c=>{if(senseTrace.active)senseTrace.domains.push(c.domains);});});
 const sense=await page.evaluate(()=>STG_BODY_EXPLORATION.arc.nodes.seat.senses[0].label);
 for(let repeat=0;repeat<2;repeat++){
  await open();await page.evaluate(()=>{window.bodyProse=document.querySelector('#MOONSHINE-root [data-lunar-story-id]');senseTrace.active=true;});await execute(sense.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'new sensory prose closes ACTIONS');
  assert.equal(await page.evaluate(()=>LUNAR.bridge.pause.active()),false);
  assert(await own('[data-ms-id="body-sense-host"]').textContent().then(t=>t.length>20));
  await page.evaluate(()=>MOONSHINE_RUNTIME.flush({domains:['actions']}));
  const trace=await page.evaluate(()=>{senseTrace.active=false;return {full:senseTrace.full,globalFit:senseTrace.globalFit,domains:senseTrace.domains,same:bodyProse===document.querySelector('#MOONSHINE-root [data-lunar-story-id]')&&bodyProse.isConnected};});
  // Menu pause acquire/release is an older whole-page compatibility path.
  // Record it separately; do not mistake it for the new sensory-domain route.
  console.log('Legacy menu pause transition:',JSON.stringify({full:trace.full,globalFit:trace.globalFit}));assert(trace.same);assert(trace.domains.flat().includes('dialogue'));

 }
 // Isolate the new local content route from the existing menu pause markers.
 await page.evaluate(()=>MOONSHINE_RUNTIME.flush({domains:['actions']}));await new Promise(r=>setTimeout(r,150));
 await page.evaluate(async()=>{senseTrace.full=0;senseTrace.globalFit=0;senseTrace.domains=[];senseTrace.origins=[];senseTrace.active=true;stgBodyExplorationSense(1);await new Promise(resolve=>queueMicrotask(resolve));await MOONSHINE_RUNTIME.flush({domains:['dialogue']});});
 const localTrace=await page.evaluate(()=>{senseTrace.active=false;return {full:senseTrace.full,globalFit:senseTrace.globalFit,domains:senseTrace.domains,origins:senseTrace.origins};});
 assert.equal(localTrace.full,0,'sensory-domain update must not patch the whole visible root: '+JSON.stringify(localTrace));assert.equal(localTrace.globalFit,0,'sensory-domain update must not invalidate global geometry');assert(localTrace.domains.flat().includes('dialogue'));
 // Same-image arrival starts immediately but must still return to reading.
 const immediate=await page.evaluate(()=>STG_BODY_EXPLORATION.arc.nodes.seat.choices.find(c=>c.target==='gap').label);
 await open();await execute(immediate.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 assert.equal(await actions('.MOONSHINE-actions-panel').count(),0);
 await until(()=>_stgBodyNode==='gap'&&LUNAR.api.moonshine.actions.read()?.ready);
 assert.equal(await actions('.MOONSHINE-actions-panel').count(),0);
 // Whitespace-only new prose stays in ACTIONS. These fixtures only live in
 // this test browser; the native game remains unchanged.
 await page.evaluate(async()=>{const opts=document.getElementById('enc-choices'),b=document.createElement('button');b.className='enc-choice';b.textContent='Whitespace hub';b.onclick=()=>{document.getElementById('body-sense-host').replaceChildren();stgEncounterTypewriter('<br>&nbsp;   ',()=>{});b.textContent='Next hub choice';};opts.replaceChildren(b);await MOONSHINE_RUNTIME.flush();});
 await open();await execute('Whitespace hub');await until(()=>{const m=LUNAR.api.moonshine.actions.read(),panel=document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel');return m?.ready&&panel&&!panel.inert&&m.items.some(i=>i.label==='Next hub choice');});
 assert.equal(await page.evaluate(()=>LUNAR.api.moonshine.actions.read().choiceOnly),true);await actions('.MOONSHINE-actions-close').click();
 // Main menu labels are semantic: native folder decoration never blocks Load.
 assert(await page.evaluate(()=>stgWriteSaveSlot(0)));await page.evaluate(()=>stgGoTo('Menu'));await own('[data-ms-id="stg-menu-root"]').waitFor();await until(()=>document.querySelector('#MOONSHINE-root [data-lunar-menu-action="load"]'));
 assert.equal(await own('[data-lunar-menu-action="load"]').textContent(),'Load');
 await own('[data-lunar-menu-action="load"]').click();await own('[data-ms-id="stg-slot-picker"]').waitFor();await own('[data-ms-id="stg-slot-picker"]').getByRole('button',{name:'Close',exact:true}).click();
 // Source-unchanged refresh preserves a translated Load label and its node.
 await page.evaluate(async()=>{const load=document.querySelector('#MOONSHINE-root [data-lunar-menu-action="load"]');window.loadNode=load;load.innerHTML='<font>載入</font>';window.loadTranslation=load.firstChild;await MOONSHINE_RUNTIME.flush({domains:['actions']});});
 assert(await page.evaluate(()=>loadNode.isConnected&&loadTranslation.isConnected&&loadTranslation.textContent==='載入'));
 await page.evaluate(async()=>{LUNAR.api.moonshine.setMode('desktop');await MOONSHINE_RUNTIME.flush();});assert(await page.locator('#stg-menu-root .menu-btn').allTextContents().then(labels=>labels.some(t=>t.includes('📂 Load Slot'))));
 assert.deepEqual(errors,[]);console.log('PASS delayed and immediate body prose gate ACTIONS; repeated sensory prose; whitespace hub; Load semantic role, callback, translation identity and desktop source');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
