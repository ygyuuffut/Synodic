/* Card receipt close intent must win over background prose and run native continuation once. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const paths=require('./helpers/synodic-test-paths.cjs');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},isMobile:true,hasTouch:true,deviceScaleFactor:3}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());page.setDefaultTimeout(8000);
 await page.goto(pathToFileURL(paths.game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 async function until(fn,arg){for(let i=0;i<320;i++){if(await page.evaluate(fn,arg))return;await new Promise(r=>setTimeout(r,25));}throw Error('Condition timed out: '+fn);}
 const own=s=>page.locator('#MOONSHINE-root '+s),actions=s=>page.locator('#MOONSHINE-actions-root '+s),popup=()=>own('[data-ms-class~="stg-card-popup-scrim"]');
 const armed=()=>popup().filter({has:page.locator('[data-ms-class~="stg-md-card"]')}).waitFor();
 async function ready(){await until(()=>!!document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-armed"]'));}
 async function execute(text){await actions('.MOONSHINE-action-summary').filter({hasText:text}).click();await until(()=>{const row=document.querySelector('#MOONSHINE-actions-root .MOONSHINE-action-selected');return row?.classList.contains('MOONSHINE-action-revealed')&&!row.querySelector('.MOONSHINE-action-detail').inert;});await actions('.MOONSHINE-action-selected .MOONSHINE-action-full').click();}
 await own('[data-ms-class~="stg-fs-no"]').click();await own('[data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(()=>stgStartNewGame());await own('[data-ms-class~="charsel-confirm"]').click();await own('[data-ms-class~="stg-story-panel"]').waitFor();await page.evaluate(()=>stgArcSkipTw());
 // Native grant + receipt. Publish another long paragraph sequence behind it
 // after arming: the old workspace typewriter capture swallowed the first tap.
 await page.evaluate(async()=>{window.receiptDone=0;window.backgroundDone=0;window.deckBefore=_STG.masterDeck.length;stgShowCardGainedPopup(stgGrantCard('cheddarCheese'),()=>{receiptDone++;stgArcTypewriter('After receipt: normal dialogue.',()=>{});});await MOONSHINE_RUNTIME.flush();});
 await armed();const early=await popup().getAttribute('data-lunar-source-key');assert.equal(await page.evaluate(key=>LUNAR.api.moonshine.cards.dismissPopup(key),early),false,'opening guard prevents tap-through');await ready();
 await page.evaluate(async()=>{stgArcTypewriter(Array.from({length:8},(_,i)=>'Background paragraph '+i).join('<br><br>'),()=>backgroundDone++);await MOONSHINE_RUNTIME.flush();});
 assert.equal(await page.evaluate(()=>backgroundDone),0);
 await page.touchscreen.tap(5,700);
 await popup().waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>receiptDone),1,'receipt must call its original continuation');
 assert.equal(await page.evaluate(()=>_STG.masterDeck.length),await page.evaluate(()=>deckBefore+1));
 assert(await own('[data-ms-class~="stg-story-scroll"]').textContent().then(t=>t.includes('After receipt: normal dialogue.')));
 assert.equal(await page.evaluate(()=>backgroundDone),0,'dismissing a receipt must not skip the obscured text');
 // A card text tap neither closes the modal nor skips the background story.
 await page.evaluate(async()=>{stgShowCardGainedPopup(stgGrantCard('cheddarCheese'),()=>receiptDone++);await MOONSHINE_RUNTIME.flush();});await ready();
 await page.evaluate(async()=>{stgArcTypewriter(Array.from({length:8},(_,i)=>'Protected paragraph '+i).join('<br><br>'),()=>backgroundDone++);await MOONSHINE_RUNTIME.flush();});
 await own('[data-ms-class~="stg-md-card"] [data-ms-class~="card-name"]').click();assert.equal(await popup().count(),1);assert.equal(await page.evaluate(()=>backgroundDone),0);
 // Ordinary HP updates retain the animated popup; repeated dismissals cannot
 // queue multiple native onDone timers or grant the next card more than once.
 // HUD notation opts out of browser translation, without opting prose out.
 const hud=await page.evaluate(()=>{const bar=document.querySelector('#MOONSHINE-root [data-ms-class~="stg-mobile-top-hud"]');window.receiptHud=bar;window.receiptInfo=bar.querySelector('[data-ms-class~="stg-mobile-top-hud-info"]');window.receiptHpLabel=bar.querySelector('[data-ms-class~="stg-mobile-top-hud-hp-label"]');return {translate:bar.getAttribute('translate'),excluded:[receiptInfo,receiptHpLabel,...bar.querySelectorAll('[data-ms-class~="stg-mobile-top-hud-glyph"],[data-stg-hud-value]')].every(el=>el.translate===false),info:receiptInfo.textContent,hp:receiptHpLabel.textContent,prose:document.querySelector('#MOONSHINE-root [data-lunar-story-id]').translate};});
 assert.equal(hud.translate,'no');assert(hud.excluded);assert.equal(hud.info,'i');assert.equal(hud.hp,'HP');assert.equal(hud.prose,true);
 const handle=await popup().getAttribute('data-lunar-source-key');
 const result=await page.evaluate(async key=>{window.secondReceiptNode=document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]');_STG.player.hp--;LUNAR.bridge.port.emit(['player.hp']);await MOONSHINE_RUNTIME.flush();return {same:secondReceiptNode===document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]'),first:LUNAR.api.moonshine.cards.dismissPopup(key),second:LUNAR.api.moonshine.cards.dismissPopup(key)};},handle);
 assert(await page.evaluate(()=>receiptHud.isConnected&&receiptInfo===receiptHud.querySelector('[data-ms-class~="stg-mobile-top-hud-info"]')&&receiptHpLabel===receiptHud.querySelector('[data-ms-class~="stg-mobile-top-hud-hp-label"]')&&!receiptInfo.translate&&!receiptHpLabel.translate),'HP patch retains HUD identity and translation exclusion');
 assert(result.same&&result.first);assert.equal(result.second,false);
 await until(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-card-popup-leaving"]'));
 assert(await popup().evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.playState==='running')),'native compatibility fade still animates owned nodes');await page.evaluate(async()=>{_STG.player.hp--;LUNAR.bridge.port.emit(['player.hp']);await MOONSHINE_RUNTIME.flush();});assert(await popup().evaluate(el=>el===secondReceiptNode&&el.isConnected),'ordinary state patches retain the closing animation node');
 await page.touchscreen.tap(5,700);await popup().waitFor({state:'detached'});assert.equal(await page.evaluate(()=>receiptDone),2);assert.equal(await page.evaluate(key=>LUNAR.api.moonshine.cards.dismissPopup(key),handle),false,'expired handles cannot continue another story');
 // A receipt with choices-only continuation reopens ACTIONS directly.
 await page.evaluate(async()=>{stgArcSkipTw();const opts=document.getElementById('arc-dlg-opts'),take=document.createElement('button');take.textContent='Take card and choose again';take.onclick=()=>{opts.style.display='none';stgShowCardGainedPopup(stgGrantCard('cheddarCheese'),()=>{const next=document.createElement('button');next.textContent='Next available choice';next.onclick=()=>stgArcTypewriter('Choice accepted.');opts.replaceChildren(next);opts.style.display='';});};opts.replaceChildren(take);await MOONSHINE_RUNTIME.flush();});
 await own('[data-ms-class~="stg-story-actions"]').click();await execute('Take card and choose again');await ready();assert.equal(await page.evaluate(()=>LUNAR.bridge.pause.active()),false);
 await page.touchscreen.tap(5,700);await popup().waitFor({state:'detached'});await actions('.MOONSHINE-action-summary').filter({hasText:'Next available choice'}).waitFor();assert.equal(await actions('.MOONSHINE-actions-panel').evaluate(el=>el.inert),false);assert(!(await actions('.MOONSHINE-action-label').allTextContents()).some(t=>t.includes('Take card')));await actions('.MOONSHINE-actions-close').click();
 // Screenshot flow: choose to share the cheese through the actual ACTIONS UI.
 await page.evaluate(()=>{_STG.player.grace=6;_stgPendingEncounter='gen_cheese_vent';stgGoTo('EncounterEvent');});await until(()=>stgCurrentEncounterEv?.id==='gen_cheese_vent'&&document.getElementById('enc-text')?.hasAttribute('data-lunar-story-id'));await page.evaluate(()=>stgEncounterSkipToEnd());await until(()=>{const m=LUNAR.api.moonshine.actions.read();return m?.ready&&m.items.some(i=>i.label.includes('Offer to Share'));});
 await own('[data-ms-class~="stg-story-actions"]').click();await execute('Offer to Share.');await ready();
 assert.equal(await page.evaluate(()=>LUNAR.api.moonshine.actions.read().ready),false,'receipt is not a completed ACTIONS cycle');
 assert.equal(await page.evaluate(()=>LUNAR.bridge.pause.active()),false,'followup must not pause receipt arming or continuation');
 assert(await own('[data-ms-class~="stg-md-uses"]').textContent().then(t=>t==='2/4'));
 await page.touchscreen.tap(200,700);await popup().waitFor({state:'detached'});
 await until(()=>document.querySelector('#MOONSHINE-root [data-lunar-story-id]')?.textContent.includes('You raise your empty hands'));
 assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'new outcome prose appears without another ACTIONS tap');await page.evaluate(()=>stgEncounterSkipToEnd());await until(()=>{const m=LUNAR.api.moonshine.actions.read();return m?.ready&&m.items.some(i=>/Move on|Continue/.test(i.label));});
 // The native continuation stays connected for LUNAR, but is never visible
 // inside MOONSHINE prose; ACTIONS is its sole mobile presentation.
 await page.evaluate(()=>MOONSHINE_RUNTIME.flush());
 assert.equal(await own('[data-ms-class~="stg-story-scroll"] button:visible').count(),0,'completed encounter actions must not leak into the chat box');
 assert(await page.evaluate(()=>{const b=document.querySelector('#stg-encounter-root button.enc-continue');return b?.isConnected&&/Move on|Continue/.test(b.textContent);}),'native continuation remains available to LUNAR');
 await own('[data-ms-class~="stg-story-actions"]').click();const outcomeLabels=await actions('.MOONSHINE-action-label').allTextContents();assert.equal(outcomeLabels.length,1);assert.match(outcomeLabels[0],/Move on|Continue/);await actions('.MOONSHINE-actions-close').click();
 // Sequential rewards use the original grant chain, once per card.
 await page.evaluate(async()=>{window.chainDone=0;window.chainDeck=_STG.masterDeck.length;stgFateGrantCards(['feralClaw','cheddarCheese'],()=>{chainDone++;stgEncounterTypewriter('Next dialogue after both rewards.');});await MOONSHINE_RUNTIME.flush();});await ready();
 const first=await popup().getAttribute('data-lunar-source-key');await page.touchscreen.tap(5,700);await until(key=>{const el=document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]');return el&&el.dataset.lunarSourceKey!==key&&el.dataset.msClass.includes('stg-card-popup-armed');},first);
 await page.touchscreen.tap(5,700);await page.touchscreen.tap(5,700);await popup().waitFor({state:'detached'});assert.equal(await page.evaluate(()=>chainDone),1);assert.equal(await page.evaluate(()=>_STG.masterDeck.length),await page.evaluate(()=>chainDeck+2));
 assert(await own('[data-lunar-story-id]').textContent().then(t=>t==='Next dialogue after both rewards.'));
 // A completed menu can be restored when the native receipt has no followup.
 await page.evaluate(async()=>{stgEncounterSkipTw();await MOONSHINE_RUNTIME.flush();});await own('[data-ms-class~="stg-story-actions"]').click();
 await page.evaluate(async()=>{stgShowCardGainedPopup(STG_CARD_TEMPLATES.cheddarCheese,null);await MOONSHINE_RUNTIME.flush();});await ready();await page.touchscreen.tap(5,700);await popup().waitFor({state:'detached'});
 await own('[data-ms-class~="stg-story-actions"]').click();assert.equal(await actions('.MOONSHINE-actions-panel').evaluate(el=>el.inert),false);await execute('Move on');await until(()=>SugarCube.State.passage==='MapScreen');assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'post-reward native exit remains executable');
 // Desktop still owns its native popup and click-to-continue.
 await page.evaluate(async()=>{LUNAR.api.moonshine.setMode('desktop');await MOONSHINE_RUNTIME.flush();stgShowCardGainedPopup(STG_CARD_TEMPLATES.cheddarCheese,()=>receiptDone++);});await until(()=>document.querySelector('.stg-card-popup-scrim')?.classList.contains('stg-card-popup-armed'));await page.locator('.stg-card-popup-scrim').click({position:{x:5,y:5}});await page.locator('.stg-card-popup-scrim').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>receiptDone),3);
 assert.deepEqual(errors,[]);console.log('PASS touch backdrop beats background prose; card text protected; native continuation once, stable animation nodes, real 2/4 Cheese outcome, chained grants, ACTIONS-only continuation, HUD translation exclusion and desktop delegation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
