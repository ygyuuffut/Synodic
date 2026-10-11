/* Real save rename: adaptive shared input shell, centered labels and native ownership. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());page.setDefaultTimeout(10000);
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 const own=page.locator('#MOONSHINE-root'),picker=own.locator('[data-ms-id="stg-slot-picker"]'),prompt=own.locator('[data-ms-id="stg-confirm-modal"]');
 const field=prompt.locator('[data-ms-id="stg-prompt-input"]'),ok=prompt.locator('[data-ms-id="stg-prompt-ok"]'),cancel=prompt.locator('[data-ms-id="stg-prompt-cancel"]');
 async function until(fn,arg){for(let i=0;i<240;i++){if(await page.evaluate(fn,arg))return;await sleep(25);}throw Error('UI did not settle');}
 await own.locator('[data-ms-class~="stg-fs-no"]').click();await own.locator('[data-ms-class~="stg-consent-btn-accept"]').click();await page.evaluate(()=>stgStartNewGame());await own.locator('[data-ms-class~="charsel-confirm"]').click();
 assert(await page.evaluate(()=>stgWriteSaveSlot(0)));const original=await page.evaluate(()=>stgReadSaveSlot(0));await page.evaluate(()=>stgGoTo('Menu'));await page.evaluate(()=>stgOpenSlotPicker('load'));
 const card=picker.locator('[data-msave-key="0"]');await card.locator('[data-msave-action="toggle"]').click();await until(()=>document.querySelector('#MOONSHINE-root [data-msave-key="0"]')?.dataset.msClass.includes('stg-msave-card--revealed'));
 async function open(){await card.locator('[data-msave-action="rename"]').click();await prompt.waitFor();await sleep(250);}
 await open();
 assert(await ok.evaluate(el=>{const svg=el.querySelector('svg'),path=svg&&svg.querySelector('path'),b=path&&path.getBBox();return svg?.getAttribute('translate')==='no'&&svg?.getAttribute('aria-hidden')==='true'&&b&&b.x+b.width/2===12&&b.y+b.height/2===12;}),'shared chevron ink is centered independently of text font metrics');
 function geometry(){const dialog=document.querySelector('#MOONSHINE-root [data-ms-id="stg-confirm-modal"]'),entry=dialog.querySelector('[data-ms-class~="stg-msave-rename-entry"]'),box=dialog.firstElementChild,input=dialog.querySelector('[data-ms-id="stg-prompt-input"]'),confirm=dialog.querySelector('[data-ms-id="stg-prompt-ok"]'),cancel=dialog.querySelector('[data-ms-id="stg-prompt-cancel"]');
  const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};const css=el=>{const s=getComputedStyle(el);return {position:s.position,transform:s.transform,border:s.borderWidth,display:s.display,justify:s.justifyContent,align:s.alignItems,font:s.fontSize};};
  return {box:rect(box),entry:rect(entry),input:rect(input),ok:rect(confirm),okLabel:rect(confirm.firstElementChild),cancel:rect(cancel),cancelLabel:rect(cancel.firstElementChild),entryCss:css(entry),inputCss:css(input),okCss:css(confirm),cancelCss:css(cancel)};
 }
 if(process.env.STG_RENAME_BEFORE){console.log(JSON.stringify(await page.evaluate(geometry),null,2));await page.screenshot({path:process.env.STG_RENAME_BEFORE});return;}
 for(const size of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:748,height:1400},{width:320,height:568},{width:400,height:760,visibleHeight:380}]){
  await page.setViewportSize({width:size.width,height:size.height});
  // Keyboard shrinks visualViewport, not the layout viewport/orientation.
  if(size.visibleHeight)await page.evaluate(h=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>h});visualViewport.dispatchEvent(new Event('resize'));},size.visibleHeight);
  await sleep(180);const g=await page.evaluate(geometry);
  assert(g.box.x>=0&&g.box.right<=size.width+1&&g.box.y>=0&&g.box.bottom<=(size.visibleHeight||size.height)+1,JSON.stringify(g));
  assert.equal(g.entryCss.display,'grid');assert.equal(g.inputCss.border,'0px');assert.equal(g.okCss.position,'static');assert.equal(g.okCss.transform,'none');assert.equal(g.cancelCss.transform,'none');
  assert(g.input.right<=g.ok.x+1&&g.ok.right<=g.entry.right+1,'input and confirm use separate grid cells');
  for(const [button,label] of [[g.ok,g.okLabel],[g.cancel,g.cancelLabel]]){
   assert(Math.abs((button.x+button.w/2)-(label.x+label.w/2))<1,'label horizontal center');assert(Math.abs((button.y+button.h/2)-(label.y+label.h/2))<1,'label vertical center');
  }
  assert(Math.abs(g.cancel.x+g.cancel.w/2-(g.box.x+g.box.w/2))<1,'cancel centered within dialog');
 }
 await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});await page.setViewportSize({width:400,height:760});await sleep(180);
 await field.fill('Dev Save');if(process.env.STG_RENAME_SCREENSHOT)await page.screenshot({path:process.env.STG_RENAME_SCREENSHOT});
 // External translation only changes presentation. The two unchanged labels,
 // input value and native dialog callbacks must survive unrelated HP updates.
 const revision=await page.evaluate(()=>{window.renameDialog=document.querySelector('#MOONSHINE-root [data-ms-id="stg-confirm-modal"]');window.renameInput=renameDialog.querySelector('input');window.renameLabel=renameDialog.querySelector('[data-ms-id="stg-prompt-cancel"] span');window.renameTranslated=document.createElement('font');renameTranslated.textContent='取消這次重新命名並保留目前存檔名稱，返回存檔清單';renameLabel.replaceChildren(renameTranslated);window.renameNotifies=0;window.renameUnsubscribe=LUNAR.api.moonshine.subscribe(()=>renameNotifies++);return LUNAR.bridge.port.revision();});
 await sleep(80);assert.equal(await page.evaluate(()=>renameNotifies),0);assert.equal(await page.evaluate(()=>LUNAR.bridge.port.revision()),revision);
 await field.fill('A name retained while updating HP');await sleep(100);
 await page.evaluate(()=>{window.renameGlobalFits=0;const fit=MOONSHINE_GEOMETRY.invalidateAll;MOONSHINE_GEOMETRY.invalidateAll=function(){renameGlobalFits++;return fit.apply(this,arguments);};});
 await page.evaluate(()=>MOONSHINE_RUNTIME.refresh({domains:['player.hp']}));assert.equal(await page.evaluate(()=>renameGlobalFits),0,'local HP cannot globally fit');
 assert(await page.evaluate(()=>renameDialog.isConnected&&renameInput===renameDialog.querySelector('input')&&renameTranslated===renameLabel.firstChild));assert.equal(await field.inputValue(),'A name retained while updating HP');
 const translated=await page.evaluate(geometry);assert(Math.abs(translated.cancelLabel.y+translated.cancelLabel.h/2-(translated.cancel.y+translated.cancel.h/2))<1);assert(translated.cancelLabel.h>30,'long translated label wraps instead of clipping');assert(translated.cancel.x>=translated.box.x&&translated.cancel.right<=translated.box.right);
 if(process.env.STG_RENAME_SCREENSHOT)await page.screenshot({path:process.env.STG_RENAME_SCREENSHOT.replace(/\.png$/,'-translated.png')});await page.evaluate(()=>renameUnsubscribe());
 await cancel.click();await prompt.waitFor({state:'detached'});assert.deepEqual(await page.evaluate(()=>stgReadSaveSlot(0)),original,'cancel cannot change save');
 await open();await field.fill('A very long renamed save that must retain the native forty character limit');await ok.click();await prompt.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>stgReadSaveSlot(0).saveName),'A very long renamed save that must retai');
 await until(()=>document.querySelector('#MOONSHINE-root [data-msave-key="0"] [data-ms-class~="stg-msave-name"]')?.textContent==='A very long renamed save that must retai');
 await open();await field.fill('Saved with Enter');await field.press('Enter');await prompt.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>stgReadSaveSlot(0).saveName),'Saved with Enter');
 await open();await field.fill('Not saved');await field.press('Escape');await prompt.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>stgReadSaveSlot(0).saveName),'Saved with Enter');
 await open();await page.evaluate(()=>LUNAR.api.moonshine.setMode('desktop'));await until(()=>!!document.querySelector('#stg-confirm-modal #stg-prompt-ok'));assert.equal(await page.evaluate(()=>document.querySelector('#stg-confirm-modal #stg-prompt-ok').textContent),'Save Name');assert.equal(await page.evaluate(()=>document.querySelector('#stg-confirm-modal #stg-prompt-ok').parentElement.querySelector('#stg-prompt-cancel')!==null),true);
 assert.deepEqual(errors,[]);console.log('PASS b6.6 save rename: shared border/grid, no absolute confirm, centered labels, six phone/keyboard-height viewports, translation/input identity, real cancel/confirm/Enter/Escape/40-char save ownership and desktop');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
