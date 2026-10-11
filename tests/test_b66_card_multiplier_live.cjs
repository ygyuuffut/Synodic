/* Repeated-card quantity belongs below the receipt, with native combat continuation. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const paths=require('./helpers/synodic-test-paths.cjs');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());page.setDefaultTimeout(10000);
 async function until(fn,arg){for(let i=0;i<320;i++){if(await page.evaluate(fn,arg))return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out: '+fn);}
 const own=s=>page.locator('#MOONSHINE-root '+s),popup=()=>own('[data-lunar-control-role="cards.detailBackdrop"]'),card=()=>popup().locator('[data-ms-class~="stg-md-card"]'),count=()=>popup().locator('[data-ms-class~="stg-card-popup-mult"]');
 await page.goto(pathToFileURL(paths.game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);await own('[data-ms-class~="stg-fs-no"]').click();await own('[data-ms-class~="stg-consent-btn-accept"]').click();
 await page.evaluate(()=>stgDevCardTestCombat('dodge',1));await own('[data-ms-class~="hand"] .MOONSHINE-card').first().waitFor();
 await page.evaluate(()=>{window.multiplierDone=0;window.multiplierPassage=SugarCube.State.passage;window.multiplierHands=_STG.hand.length;});
 for(const size of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:748,height:1400}]){
  await page.setViewportSize(size);
  await page.evaluate(async()=>{stgShowCardGainedPopup(_STG.hand[0],()=>multiplierDone++,2);await MOONSHINE_RUNTIME.flush();});
  await until(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-armed"]'));await page.waitForTimeout(500);
  assert.equal(await count().textContent(),'×2');assert.equal(await card().locator('[data-ms-class~="stg-card-popup-mult"]').count(),0,'quantity is outside the card border and artwork');
  const c=await card().boundingBox(),m=await count().boundingBox();assert(m.y>=c.y+c.height+4);assert(Math.abs(m.x+m.width/2-(c.x+c.width/2))<1);assert(c.y>=0&&m.y+m.height<=size.height);
  assert.deepEqual(await count().evaluate(el=>{const s=getComputedStyle(el);return [s.position,s.fontWeight,s.fontSize,s.fontFamily,s.color,el.translate];}),['static','800',Math.min(48,Math.max(28,size.width*.09))+'px','"JetBrains Mono", ui-monospace, monospace','rgb(220, 208, 237)',false]);
  await page.evaluate(async()=>{window.quantityNode=document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-mult"]');window.quantityCard=document.querySelector('#MOONSHINE-root [data-ms-class~="stg-md-card"]');window.quantityObserverChanges=0;window.quantityObserver=new MutationObserver(rs=>quantityObserverChanges+=rs.length);quantityObserver.observe(quantityNode,{subtree:true,childList:true,attributes:true,characterData:true});_STG.player.hp--;LUNAR.bridge.port.emit(['player.hp']);await MOONSHINE_RUNTIME.flush();});
  assert(await count().evaluate(el=>el===quantityNode&&el.isConnected));assert(await card().evaluate(el=>el===quantityCard));assert.equal(await page.evaluate(()=>quantityObserverChanges),0);await page.evaluate(()=>quantityObserver.disconnect());
  // Card text remains protected; external blank space resumes the same battle.
  await card().locator('[data-ms-class~="card-name"]').click();assert.equal(await popup().count(),1);
  if(process.env.STG_MULTIPLIER_SCREENSHOT&&size.width===400)await page.screenshot({path:process.env.STG_MULTIPLIER_SCREENSHOT,animations:'disabled'});
  const before=await page.evaluate(()=>multiplierDone);
  if(size.width===400){
   // Keep the close + HP commit in one browser task; assertions must run within
   // the native 400ms dismissal lifetime, not after several automation calls.
   const closing=await page.evaluate(async()=>{document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]').click();_STG.player.hp--;LUNAR.bridge.port.emit(['player.hp']);await MOONSHINE_RUNTIME.flush();return {card:quantityCard.isConnected&&quantityCard===document.querySelector('#MOONSHINE-root [data-ms-class~="stg-md-card"]'),count:quantityNode.isConnected&&quantityNode===document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-mult"]'),running:quantityNode.getAnimations().some(a=>a.playState==='running')};});
   assert(closing.card&&closing.count&&closing.running,'closing-animation HP patch preserves the quantity and card');
  }else await page.touchscreen.tap(5,Math.floor(size.height/2));
  await page.touchscreen.tap(5,Math.floor(size.height/2));await popup().waitFor({state:'detached'});assert.equal(await page.evaluate(()=>multiplierDone),before+1);
  assert.equal(await page.evaluate(()=>SugarCube.State.passage),await page.evaluate(()=>multiplierPassage));assert.equal(await page.evaluate(()=>_STG.hand.length),await page.evaluate(()=>multiplierHands));assert(await own('[data-ms-class~="hand"]').isVisible());assert.equal(await page.evaluate(()=>LUNAR.bridge.pause.active()),false);
 }
 // No badge for a single card; switching to desktop keeps one native count.
 await page.evaluate(async()=>{stgShowCardGainedPopup(_STG.hand[0],()=>multiplierDone++,1);await MOONSHINE_RUNTIME.flush();});await until(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-armed"]'));assert.equal(await count().count(),0);await page.touchscreen.tap(5,400);await popup().waitFor({state:'detached'});
 await page.evaluate(async()=>{stgShowCardGainedPopup(_STG.hand[0],()=>multiplierDone++,3);await MOONSHINE_RUNTIME.flush();});await until(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-armed"]'));assert.equal(await count().textContent(),'×3');await page.evaluate(()=>LUNAR.api.moonshine.setMode('desktop'));await until(()=>!document.querySelector('#MOONSHINE-root'));assert.equal(await page.locator('.stg-card-popup-scrim .stg-card-popup-mult').count(),1);assert.equal(await page.locator('.stg-card-popup-card .stg-card-popup-mult').textContent(),'×3');await page.locator('.stg-card-popup-scrim').click({position:{x:5,y:5}});await page.locator('.stg-card-popup-scrim').waitFor({state:'detached'});
 assert.deepEqual(errors,[]);console.log('PASS b6.6 quantity footer: 800/responsive size, four phone sizes, card/count identity across HP, protected text, touch dismissal once, native battle continuation, single-card absence and desktop ownership');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
