const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.pending.html')).href);
 const own=s=>page.locator('#MOONSHINE-root '+s),actions=s=>page.locator('#MOONSHINE-actions-root '+s);
 async function until(fn){for(let i=0;i<180;i++){if(await page.evaluate(fn))return;await new Promise(r=>setTimeout(r,40));}throw Error('UI state did not settle');}
 async function execute(label){
  // Match normalized text in the displayed component, independent of source ids.
  const toggle=actions('.MOONSHINE-action-summary').filter({has:page.locator('.MOONSHINE-action-label',{hasText:new RegExp('^'+label+'$')})});
  await toggle.click();await until(()=>{const el=document.querySelector('#MOONSHINE-actions-root .MOONSHINE-action-selected');return el?.classList.contains('MOONSHINE-action-revealed')&&!el.querySelector('.MOONSHINE-action-detail').inert;});
  await actions('.MOONSHINE-action-selected .MOONSHINE-action-full').click();
 }
 await own('[data-ms-class~="stg-fs-no"]').click();await own('[data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(async()=>stgStartNewGame());await own('[data-ms-class~="charsel-confirm"]').click();
 await own('[data-ms-class~="stg-story-panel"]').waitFor();await page.evaluate(async()=>{stgArcSkipTw();await MOONSHINE_RUNTIME.flush();});await own('[data-ms-class~="stg-story-actions"]').click();
 await page.evaluate(async()=>{window.actionsGaps=[];new MutationObserver(()=>actionsGaps.push(!!document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel'))).observe(document.getElementById('MOONSHINE-actions-root'),{childList:true});});
 await execute('Communicate with Arc');
 await until(()=>_stgArcCurrent==='talk'&&LUNAR.api.moonshine.actions.read().ready&&!document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel').inert);
 assert.equal(await actions('.MOONSHINE-actions-panel').count(),1);assert.ok((await actions('.MOONSHINE-action-label').allTextContents()).includes('About the mission'));
 assert.equal(await page.evaluate(async()=>LUNAR.api.moonshine.actions.read().choiceOnly),true);assert.equal(await page.evaluate(async()=>LUNAR.bridge.pause.active()),true);assert.ok(await page.evaluate(async()=>actionsGaps.every(Boolean)),'choice-only transition must not paint an empty dialogue interval');
 await execute('About the mission');assert.equal(await actions('.MOONSHINE-actions-panel').count(),0);assert.equal(await page.evaluate(async()=>LUNAR.api.moonshine.actions.read().story.hasNarrative),true);
 assert.equal(await page.evaluate(async()=>LUNAR.bridge.pause.active()),false);
 await page.evaluate(async()=>{stgArcSkipTw();await MOONSHINE_RUNTIME.flush();});assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'new prose must wait for an explicit ACTIONS request');
 // Decorated back text retains formatting but no edge navigation glyph.
 await page.evaluate(async()=>{const button=Array.from(document.querySelectorAll('#arc-dlg-opts button')).find(b=>b.textContent.includes('Go back'));button.innerHTML='<b style="color:rgb(170,146,207)">◂ Go back</b>';});
 await page.evaluate(async()=>{const b=document.createElement('button');b.textContent='More Topics';b.onclick=()=>{b.textContent='Topic A';const next=document.createElement('button');next.textContent='Topic B';next.onclick=()=>{};b.parentElement.append(next);};document.getElementById('arc-dlg-opts').append(b);});
 await own('[data-ms-class~="stg-story-actions"]').click();const previousParagraph=await page.evaluate(async()=>LUNAR.api.moonshine.actions.read().story);
 await execute('More Topics');await until(()=>!!document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel')&&!document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel').inert);
 assert.deepEqual(await page.evaluate(async()=>LUNAR.api.moonshine.actions.read().story),previousParagraph);assert.ok((await actions('.MOONSHINE-action-label').allTextContents()).includes('Topic B'),'retained old prose is not newly produced dialogue');
 const back=actions('.MOONSHINE-action-summary').filter({has:page.locator('.MOONSHINE-action-label',{hasText:/^Go back$/})});await back.click();
 await until(()=>document.querySelector('#MOONSHINE-actions-root .MOONSHINE-action-selected')?.classList.contains('MOONSHINE-action-revealed')&&!document.querySelector('#MOONSHINE-actions-root .MOONSHINE-action-selected .MOONSHINE-action-detail').inert);
 assert.equal(await actions('.MOONSHINE-action-selected .MOONSHINE-action-full-label').textContent(),'Go back');assert.equal(await actions('.MOONSHINE-action-selected .MOONSHINE-action-full-label b').count(),1);
 await actions('.MOONSHINE-action-selected .MOONSHINE-action-full').click();await until(()=>_stgArcCurrent==='talk'&&LUNAR.api.moonshine.actions.read().ready&&!document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel').inert);
 assert.equal(await actions('.MOONSHINE-action-selected').count(),0);assert.ok((await actions('.MOONSHINE-action-label').allTextContents()).includes('About the mission'));
 await actions('.MOONSHINE-actions-close').click();await page.waitForTimeout(80);assert.equal(await actions('.MOONSHINE-actions-panel').count(),0,'manual close cancels automatic continuation');
 await page.evaluate(async()=>{_stgUpgradePicks=STG_BOONS.slice(0,3);_stgUpgradeCosts=[0,1,2];_stgUpgradeSelectedIdx=-1;stgGoTo('Upgrade');});await until(()=>!LUNAR.assets.locked()&&LUNAR.api.moonshine.actions.read()?.kind==='shop'&&LUNAR.api.moonshine.actions.read()?.ready);await own('[data-ms-class~="stg-story-actions"]').click();await actions('[data-action-id="upgrade"] .MOONSHINE-action-summary').click();
 await until(()=>{const el=document.querySelector('#MOONSHINE-actions-root [data-action-id="upgrade"]');return el.classList.contains('MOONSHINE-action-revealed')&&!el.querySelector('.MOONSHINE-action-detail').inert;});
 const before=await page.evaluate(async()=>({data:_STG.player.data,owned:(_STG.ownedBoons||[]).slice(),index:_stgUpgradeSelectedIdx}));
 await actions('.MOONSHINE-upgrade-offer').first().click();
 assert.ok(await actions('.MOONSHINE-upgrade-preview').evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.playState==='running'&&a.effect.getTiming().duration===180)),'preview must animate while the game is paused');
 assert.equal(await page.evaluate(async()=>LUNAR.bridge.pause.active()),true);assert.deepEqual(await page.evaluate(async()=>({data:_STG.player.data,owned:(_STG.ownedBoons||[]).slice(),index:_stgUpgradeSelectedIdx})),before);
 await page.keyboard.press('Escape');assert.ok(await actions('.MOONSHINE-upgrade-preview').evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.effect.getTiming().duration===120)));await actions('.MOONSHINE-upgrade-preview').waitFor({state:'detached'});
 assert.equal(await actions('.MOONSHINE-upgrade-offer[data-selected="true"]').count(),1);assert.equal(await actions('.MOONSHINE-actions-panel').evaluate(el=>el.inert),false);
 await actions('.MOONSHINE-upgrade-offer').first().click();await page.waitForTimeout(220);await page.mouse.click(5,200);await actions('.MOONSHINE-upgrade-preview').waitFor({state:'detached'});
 await page.emulateMedia({reducedMotion:'reduce'});await actions('.MOONSHINE-upgrade-offer').first().click();assert.equal(await actions('.MOONSHINE-upgrade-preview').evaluate(el=>el.getAnimations({subtree:true}).length),0);await page.mouse.click(5,200);await actions('.MOONSHINE-upgrade-preview').waitFor({state:'detached'});
 await actions('.MOONSHINE-upgrade-offer').first().click();await page.evaluate(async()=>STG_DISPLAY_CONFIG.setMode('desktop'));await until(()=>!document.getElementById('MOONSHINE-actions-root'));assert.equal(await page.evaluate(async()=>LUNAR.bridge.pause.active()),false);assert.deepEqual(errors,[]);
 console.log('PASS real empty Arc hubs continue directly in ACTIONS, new prose returns to story, rich back labels lose only edge arrows, animated previews close safely without transactions, reduced motion and desktop cleanup');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
