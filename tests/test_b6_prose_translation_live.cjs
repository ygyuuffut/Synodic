/* Whole-text publication, opacity-only paragraphs and translation DOM preservation. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);await page.route('https://**/*',r=>r.abort());
 const until=async fn=>{for(let i=0;i<160;i++){if(await page.evaluate(fn))return;await sleep(25);}throw Error('Condition timed out');};
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.pending.html')).href);
 await page.locator('#MOONSHINE-root [data-ms-class~="stg-fs-no"]').click();await page.locator('#MOONSHINE-root [data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(async()=>stgStartNewGame());await page.locator('#MOONSHINE-root [data-ms-class~="charsel-confirm"]').click();
 await until(()=>!!document.querySelector('#MOONSHINE-root [data-lunar-story-id]'));await page.evaluate(async()=>stgArcSkipTw());await until(()=>LUNAR.api.moonshine.actions.read().ready);
 await page.evaluate(async()=>{
  window.proseDone=0;stgArcTypewriter('<b style="color:gold">First whole paragraph &amp; rich text.</b><br><br><em>Second whole paragraph.</em><br><br>Third whole paragraph.',()=>{window.phaseAtCallback=LUNAR.api.moonshine.story.read().find(e=>e.channel==='arc').phase;proseDone++;});await MOONSHINE_RUNTIME.flush();
  const native=document.getElementById('arc-dlg-text'),own=document.querySelector('#MOONSHINE-root [data-lunar-story-id]');
  window.proseWrites=0;new MutationObserver(records=>proseWrites+=records.filter(r=>r.type==='childList'||r.type==='characterData').length).observe(native,{subtree:true,childList:true,characterData:true});
  window.ownTextWrites=0;new MutationObserver(records=>ownTextWrites+=records.filter(r=>r.type==='characterData').length).observe(own,{subtree:true,childList:true,characterData:true});
 });
 const start=await page.evaluate(async()=>{const entry=LUNAR.api.moonshine.story.read().find(e=>!e.complete),el=document.querySelector('#MOONSHINE-root [data-lunar-story-id="'+entry.id+'"]');return {count:el.querySelectorAll('[data-moonshine-paragraph]').length,text:el.textContent,timer:_stgArcTwTimer,chars:el.querySelectorAll('.tw-c,.ev-cursor').length,translate:el.translate,language:el.lang,animations:el.getAnimations({subtree:true}).map(a=>a.effect.getKeyframes()),nativeTranslate:document.querySelector('.passage').getAttribute('translate')};});
 assert.equal(start.count,3);assert(start.text.includes('Second whole paragraph.'));assert.equal(start.timer,null);assert.equal(start.chars,0);assert.equal(start.translate,true);assert.equal(start.language,'en');assert.equal(start.nativeTranslate,'no');assert.equal(start.animations.length,3);assert(start.animations.every(frames=>frames.every(f=>!('transform'in f))));
 // Pause midway; the paragraph animation and its native completion must wait.
 await page.evaluate(async()=>LUNAR.api.moonshine.timing.acquire('translation-test'));await until(()=>document.querySelector('#MOONSHINE-root [data-lunar-story-id]').getAnimations({subtree:true}).every(a=>a.playState==='paused'));
 const time=await page.evaluate(async()=>document.querySelector('#MOONSHINE-root [data-lunar-story-id]').getAnimations({subtree:true}).map(a=>a.currentTime));await sleep(180);
 assert.deepEqual(await page.evaluate(async()=>document.querySelector('#MOONSHINE-root [data-lunar-story-id]').getAnimations({subtree:true}).map(a=>a.currentTime)),time);assert.equal(await page.evaluate(async()=>proseDone),0);
 await page.evaluate(async()=>{LUNAR.api.moonshine.timing.release('translation-test');await MOONSHINE_RUNTIME.flush();});
 await until(()=>proseDone===1);assert.equal(await page.evaluate(async()=>proseWrites),0);assert.equal(await page.evaluate(async()=>ownTextWrites),0);assert.equal(await page.evaluate(async()=>phaseAtCallback),'displayed');
 // Simulate browser translation replacing text with FONT wrappers; preserve the
 // translated DOM through HUD changes, resize, font refresh and finish/skip.
 await page.evaluate(async()=>{
  const el=document.querySelector('#MOONSHINE-root [data-lunar-story-id]');window.translatedNode=el;const bold=el.querySelector('b');bold.innerHTML='<font class="translator-wrapper">第一段已翻譯</font>';window.translatedFont=bold.firstChild;
  _STG.player.hp++;MOONSHINE_RUNTIME.invalidate();
 });
 await page.setViewportSize({width:360,height:800});await page.evaluate(async()=>{await MOONSHINE_RUNTIME.flush();stgArcSkipTw();MOONSHINE_RUNTIME.invalidate();});await sleep(220);
 const translated=await page.evaluate(async()=>({same:translatedNode===document.querySelector('#MOONSHINE-root [data-lunar-story-id]'),font:translatedFont.isConnected,text:translatedFont.textContent,done:proseDone,original:LUNAR.api.moonshine.story.read()[0].html}));
 assert(translated.same&&translated.font);assert.equal(translated.text,'第一段已翻譯');assert.equal(translated.done,1);assert(translated.original.includes('First whole paragraph'));
 // New content resets source, scroll and translation naturally, callback once.
 await page.evaluate(async()=>{stgArcTypewriter('Fresh source',()=>proseDone++);await MOONSHINE_RUNTIME.flush();});await page.mouse.click(180,300);await until(()=>proseDone===2);assert.equal(await page.locator('#MOONSHINE-root [data-lunar-story-id]').textContent(),'Fresh source');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(async()=>{stgArcTypewriter('Reduced motion paragraph.',()=>proseDone++);await MOONSHINE_RUNTIME.flush();});await until(()=>proseDone===3);assert.equal(await page.locator('#MOONSHINE-root [data-lunar-story-id]').evaluate(el=>el.getAnimations({subtree:true}).length),0);
 // Empty choices-only paragraphs don't wait for an invisible presentation.
 await page.evaluate(async()=>{LUNAR.api.moonshine.timing.acquire('empty-prose');stgArcTypewriter('',()=>proseDone++);await MOONSHINE_RUNTIME.flush();});await sleep(100);assert.equal(await page.evaluate(async()=>proseDone),3);await page.evaluate(async()=>{LUNAR.api.moonshine.timing.release('empty-prose');await MOONSHINE_RUNTIME.flush();});await until(()=>proseDone===4);
 await page.evaluate(async()=>{document.documentElement.lang='zh-TW';stgArcTypewriter('<span style="color:gold">Nested paragraph.<br>\n<br>Nested second paragraph.</span><p>Block paragraph.</p>',()=>proseDone++);await MOONSHINE_RUNTIME.flush();});await until(()=>proseDone===5);
 const nested=await page.evaluate(async()=>{const el=document.querySelector('#MOONSHINE-root [data-lunar-story-id]');return {count:el.querySelectorAll('[data-moonshine-paragraph]').length,text:el.textContent,language:el.lang,rich:el.querySelector('span[style]').style.color};});assert.equal(nested.count,3);assert(nested.text.includes('Nested second paragraph.'));assert.equal(nested.language,'en');assert.equal(nested.rich,'gold');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(async()=>{stgArcTypewriter('Cancelled paragraph',()=>proseDone++);await MOONSHINE_RUNTIME.flush();stgArcTypewriter('Replacement paragraph',()=>proseDone++);await MOONSHINE_RUNTIME.flush();});await until(()=>proseDone===6);await sleep(400);assert.equal(await page.evaluate(async()=>proseDone),6);
 await page.evaluate(async()=>STG_DISPLAY_CONFIG.setMode('desktop'));await until(()=>!document.getElementById('MOONSHINE-root'));assert.equal(await page.locator('.passage').getAttribute('translate'),null);
 await page.evaluate(async()=>stgArcTypewriter('Desktop retains native typing.'));assert(await page.evaluate(async()=>!!_stgArcTwTimer));await page.evaluate(async()=>stgArcSkipTw());assert.deepEqual(errors,[]);
 console.log('PASS complete rich-text publication, paragraph opacity, pause/skip/exactly-once callbacks, reduced motion, translation wrappers survive refresh, new/empty/replaced prose and desktop delegation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
