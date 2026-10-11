/* Authored boundaries, decoration, expanded faction colors and stable translated rows. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 const own=page.locator('#MOONSHINE-root');await own.locator('[data-ms-class~="stg-fs-no"]').click();await own.locator('[data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(()=>stgStartNewGame());await own.locator('[data-ms-class~="charsel-confirm"]').click();
 async function until(fn,arg){for(let i=0;i<240;i++){if(await page.evaluate(fn,arg))return;await sleep(30);}throw Error('UI did not settle');}
 await page.evaluate(()=>{stgArcSkipTw();const opts=document.getElementById('arc-dlg-opts');opts.replaceChildren();window.actionExecutions=0;
  const cases=[['plain','Communicate with Arc'],['continue','<b>Continue</b> <span>▼</span>'],['attack','<div>ATTACK!</div><div>If you burn the house...</div>'],['aid','<span>Aid</span><br>Help the story continue.'],['enter','<div>Enter</div><div>Give yourself to the next chapter.</div>'],['ellipsis','Move on...']];
  for(const faction of ['grace','chaos','logic','balance','instinct','harmony','worship','alpha','void'])cases.push([faction,'<div>This is an example of expanded '+faction.toUpperCase()+' option.</div><div style="color:red">Notice the color change in text.</div>',faction]);
  cases.push(['exploreGrace','Explore this graceful branch','grace']);
  for(const [id,html,faction] of cases){const b=document.createElement('button');b.dataset.test=id;b.className='arc-dlg-opt'+(faction?' enc-choice-'+faction:'');b.innerHTML=html;b.onclick=()=>actionExecutions++;opts.append(b);}
 });
 await page.evaluate(async()=>{await MOONSHINE_RUNTIME.flush();MOONSHINE_ACTIONS.open();});
 const items=await page.evaluate(()=>LUNAR.api.moonshine.actions.read().items);const ids=Object.fromEntries(['plain','continue','attack','aid','enter','ellipsis','grace','chaos','logic','balance','instinct','harmony','worship','alpha','void','exploreGrace'].map((name,i)=>[name,items[i].id]));
 assert.deepEqual(items.slice(0,6).map(x=>x.summary),['Communicate with Arc','Continue','ATTACK!…','Aid…','Enter…','Move on...']);assert.equal(items[2].label,'ATTACK! If you burn the house...');assert.equal(items[1].html,'<b>Continue</b><span></span>');
 const row=name=>page.locator('[data-action-id="'+ids[name]+'"]');
 async function expand(name){await row(name).locator('.MOONSHINE-action-summary').click();await until(id=>{const el=document.querySelector('[data-action-id="'+id+'"]');return el.classList.contains('MOONSHINE-action-revealed')&&!el.querySelector('.MOONSHINE-action-detail').inert;},ids[name]);}
 const purple=await row('plain').evaluate(el=>getComputedStyle(el).color);
 for(const name of ['grace','chaos','logic','balance','instinct','harmony','worship','alpha','void'])assert.deepEqual(await row(name).evaluate(el=>[getComputedStyle(el).color,getComputedStyle(el).borderColor]),[purple,purple]);
 // Explore still obeys the initial mandatory-upgrade gate: its disabled
 // summary/border are grey, with an ordinary purple base affiliation palette.
 assert.deepEqual(await row('exploreGrace').evaluate(el=>[getComputedStyle(el).color,getComputedStyle(el).borderColor,el.querySelector('button').disabled]),[purple,'rgb(83, 80, 87)',true]);
 await expand('plain');const border=await row('plain').evaluate(el=>getComputedStyle(el).borderColor);
 const colors={grace:'rgb(115, 171, 239)',chaos:'rgb(240, 96, 20)',logic:'rgb(239, 204, 0)',balance:'rgb(200, 168, 240)',instinct:'rgb(232, 147, 44)',harmony:'rgb(80, 192, 96)',worship:'rgb(232, 90, 160)',alpha:'rgb(201, 201, 212)',void:'rgb(141, 141, 149)'};
 for(const [name,color] of Object.entries(colors)){
  await expand(name);assert.deepEqual(await row(name).evaluate(el=>{const full=el.querySelector('.MOONSHINE-action-full');return [getComputedStyle(el).borderColor,getComputedStyle(full).color,getComputedStyle(full.querySelector('.MOONSHINE-actions-symbol')).color,getComputedStyle(full.querySelector('[style]')).color];}),[border,color,color,color]);
  await expand('plain');assert.deepEqual(await row(name).evaluate(el=>[getComputedStyle(el).color,getComputedStyle(el).borderColor]),[purple,purple]);
 }
 await expand('aid');assert.equal(await row('aid').locator('.MOONSHINE-action-full-label').innerText(),'Aid\nHelp the story continue.');
 await expand('continue');assert.equal((await row('continue').locator('.MOONSHINE-action-full-label').textContent()).trim(),'Continue');await row('continue').locator('.MOONSHINE-action-full').click();assert.equal(await page.evaluate(()=>actionExecutions),1,'second click executes only the native callback');
 // Translate a label while it animates. Disabled state patches must not replace it.
 await row('grace').locator('.MOONSHINE-action-summary').click();
 await page.evaluate(id=>{window.stableRow=document.querySelector('[data-action-id="'+id+'"]');window.stableFull=stableRow.querySelector('.MOONSHINE-action-full-label');const font=document.createElement('font');font.textContent='翻譯的完整選項';stableFull.replaceChildren(font);window.stableTranslation=font;window.translationNotifies=0;window.stopTranslationNotify=LUNAR.api.moonshine.subscribe(()=>translationNotifies++);},ids.grace);
 await sleep(50);assert.equal(await page.evaluate(()=>translationNotifies),0,'presentation translation cannot notify LUNAR');
 await page.evaluate(()=>{stopTranslationNotify();window.localFits=0;const fit=MOONSHINE_COMPONENTS.fit;MOONSHINE_COMPONENTS.fit=function(){localFits++;return fit.apply(this,arguments);};document.querySelector('[data-test="grace"]').disabled=true;});
 await until(id=>document.querySelector('[data-action-id="'+id+'"] .MOONSHINE-action-summary').disabled,ids.grace);
 assert(await page.evaluate(()=>stableRow.isConnected&&stableFull.isConnected&&stableTranslation===stableFull.firstChild&&stableRow===document.querySelector('[data-action-id="'+stableRow.dataset.actionId+'"]')));assert.equal(await page.evaluate(()=>localFits),0,'disabled update cannot globally fit');
 // Class-only source metadata change patches color, preserving translated HTML.
 await page.evaluate(()=>{document.querySelector('[data-test="grace"]').className='arc-dlg-opt enc-choice-logic';MOONSHINE_ACTIONS.refresh();});assert(await page.evaluate(()=>stableRow.dataset.affiliation==='logic'&&stableTranslation===stableFull.firstChild));
 await until(()=>stableRow.classList.contains('MOONSHINE-action-revealed')&&!stableRow.querySelector('.MOONSHINE-action-detail').inert);
 for(const size of [{width:360,height:640},{width:360,height:800},{width:748,height:1400}]){await page.setViewportSize(size);await sleep(100);assert(await page.evaluate(()=>stableRow.isConnected&&stableTranslation===stableFull.firstChild));}
 if(process.env.STG_ACTION_LABELS_SCREENSHOT){
  // Keep a compact reference view after identity assertions have completed.
  await page.setViewportSize({width:400,height:760});await page.evaluate(()=>{MOONSHINE_ACTIONS.close();for(const b of document.querySelectorAll('#arc-dlg-opts button')){if(!['plain','grace','chaos','logic'].includes(b.dataset.test))b.remove();else if(b.dataset.test==='grace'){b.disabled=false;b.className='arc-dlg-opt enc-choice-grace';}}MOONSHINE_ACTIONS.open();});
  const chaos=row('chaos');await chaos.locator('.MOONSHINE-action-summary').click();await until(id=>{const el=document.querySelector('[data-action-id="'+id+'"]');return el.classList.contains('MOONSHINE-action-revealed')&&!el.querySelector('.MOONSHINE-action-detail').inert;},ids.chaos);await page.screenshot({path:process.env.STG_ACTION_LABELS_SCREENSHOT});
 }
 assert.deepEqual(errors,[]);console.log('PASS b6.6 action labels: decoration removed, first-line ellipsis, full rich text, nine faction text/icon colors, ordinary collapsed/selected border, translated animation identity, local disabled patch and native callback');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
