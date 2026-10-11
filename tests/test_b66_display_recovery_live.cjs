/* Native browser page-scale recovery and semantic intro-SKIP presentation policy. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const paths=require('./helpers/synodic-test-paths.cjs'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},isMobile:true,hasTouch:true,deviceScaleFactor:3});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
 const cdp=await page.context().newCDPSession(page);page.setDefaultTimeout(12000);
 await page.goto(pathToFileURL(paths.game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 const own=page.locator('#MOONSHINE-root');await own.locator('[data-ms-class~="stg-fs-no"]').click();await own.locator('[data-ms-class~="stg-consent-btn-accept"]').click();
 await own.locator('[data-lunar-menu-action="settings"]').click();
 const settings=own.locator('[data-ms-class~="stg-mobile-settings-ui"]');await settings.getByRole('tab',{name:'Display & UI'}).click();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).touchAction),'manipulation');
 assert.equal(await page.locator('#MOONSHINE-viewport').getAttribute('content'),'width=device-width, initial-scale=1, viewport-fit=cover');
 // Rapid taps on non-button content are no longer a browser double-tap zoom.
 await settings.locator('h2').waitFor({state:'visible'});await sleep(350);const heading=await settings.locator('h2').boundingBox();await page.touchscreen.tap(heading.x+20,heading.y+10);await page.touchscreen.tap(heading.x+20,heading.y+10);await sleep(200);
 assert(Math.abs(await page.evaluate(()=>visualViewport.scale)-1)<.01);
 await page.evaluate(()=>{_STG_ZOOM=.8;stgApplyZoom();});
 // Force the actual browser page scale to reproduce an already zoomed page,
 // independently of whether a particular scroll region permits pinch gestures.
 await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});await sleep(350);
 assert(await page.evaluate(()=>visualViewport.scale)>1.5);
 assert(await own.evaluate(el=>el.dataset.msClass.includes('stg-mobile-portrait')));
 await settings.locator('[data-ms-action="recommended"]').click();
 await page.waitForFunction(()=>Math.abs(visualViewport.scale-1)<.01&&document.querySelector('#MOONSHINE-viewport').content==='width=device-width, initial-scale=1, viewport-fit=cover');await sleep(150);
 assert(Math.abs(await own.boundingBox().then(b=>b.width)-400)<1);
 assert.equal(await page.evaluate(()=>_STG_ZOOM),await page.evaluate(()=>stgRecommendScale().zoom));
 // Repeat clicks share a reset, and recovery UI scheduling works while paused.
 await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1.7});await sleep(150);
 await page.evaluate(async()=>{LUNAR.api.moonshine.timing.acquire('display-test');const a=MOONSHINE_DISPLAY.resetRecommended(),b=MOONSHINE_DISPLAY.resetRecommended();window.sameReset=a===b;await a;LUNAR.api.moonshine.timing.release('display-test');});
 assert(await page.evaluate(()=>sameReset));assert(Math.abs(await page.evaluate(()=>visualViewport.scale)-1)<.01);
 // Main-menu and in-game Visuals use the same reset action.
 await settings.getByRole('button',{name:'Back'}).click();await page.evaluate(()=>stgStartNewGame());await own.locator('[data-ms-class~="charsel-confirm"]').click();
 await own.locator('[data-ms-id="stg-banner-menu-btn"]').click();await own.locator('[data-ig="next"]').click();
 await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});await sleep(350);assert(await page.evaluate(()=>visualViewport.scale)>1.5);await own.locator('[data-ms-action="recommended"]').click();await page.waitForFunction(()=>Math.abs(visualViewport.scale-1)<.01);await sleep(150);assert(Math.abs(await page.evaluate(()=>visualViewport.scale)-1)<.01);
 await own.locator('[data-ig="close"]').click();
 // A native multi-part intro still has its callback source, but its semantic
 // SKIP role is absent from MOONSHINE. Reward-skip is a distinct action.
 await page.evaluate(()=>{STG_ENCOUNTER_EVENTS.display_recovery_test={id:'display_recovery_test',title:'Recovery intro',chunks:['First complete paragraph.','Second complete paragraph.'],choices:[{text:'Continue',next:'Lab'}]};_stgPendingEncounter='display_recovery_test';stgGoTo('EncounterEvent');});
 await page.waitForFunction(()=>!!document.getElementById('stg-enc-skip-btn'));await sleep(650);
 assert(await page.evaluate(()=>document.getElementById('stg-enc-skip-btn').isConnected));
 const roles=await page.evaluate(()=>{const result=[];function visit(n){if(n.attrs?.['data-lunar-control-role'])result.push(n.attrs['data-lunar-control-role']);n.children?.forEach(visit);}LUNAR.api.moonshine.sources().views.forEach(v=>visit(v.tree));return result;});assert(roles.includes('story.skipIntro'));
 assert.equal(await own.locator('[data-lunar-control-role="story.skipIntro"],[data-ms-id="stg-enc-skip-btn"]').count(),0);
 const policy=await page.evaluate(()=>{const box=document.createElement('div');box.setAttribute('data-MOONSHINE-owned','');document.body.append(box);MOONSHINE_COMPONENTS.patch(box,[{tag:'button',key:'reward-test',attrs:{'data-ms-class':'stg-reward-skip'},children:[{tag:'#text',key:'reward-label',text:'Skip rewards'}]}]);const text=box.textContent;box.remove();return text;});assert.equal(policy,'Skip rewards');
 // A reset cancelled by switching modes cannot reapply phone viewport later.
 await page.evaluate(async()=>{const reset=MOONSHINE_DISPLAY.resetRecommended();LUNAR.api.moonshine.setMode('desktop');await MOONSHINE_RUNTIME.flush();await reset;});
 assert.equal(await page.locator('#MOONSHINE-viewport').count(),0);assert.equal(await own.count(),0);assert(await page.locator('#stg-enc-skip-btn').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS native mobile page-scale recovery, rapid taps, native recommendation, pause/repeated reset, main/in-game controls, semantic SKIP exclusion, reward action and desktop/cancel restoration');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
