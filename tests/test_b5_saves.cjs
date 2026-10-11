const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),assert=require('node:assert/strict');
const b6SaveLayout=/b6/.test(process.env.STG_TEST_HTML||'');

(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},deviceScaleFactor:3,hasTouch:true});
  require('./helpers/moonshine-test-ui.cjs')(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>process.env.STG_TEST_FONTS && /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.request().url())?r.continue():r.abort());
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b5.pending.html')).href);
  await page.waitForFunction(()=>typeof stgOpenSlotPicker==='function');
  if(await page.locator('.stg-fs-no').count())await page.locator('.stg-fs-no').click();
  const consent=page.locator('#stg-consent-overlay');
  if(await consent.count()){
   await page.locator('#stg-consent-remember').check();
   await page.locator('.stg-consent-btn-accept').click();
   await consent.waitFor({state:'detached'});
  }
  await page.evaluate(()=>{
   const snap=(chaos,grace)=>({v:STG_SAVE_VERSION,ts:Date.now(),resume:'MapScreen',state:{
    player:{hp:50,maxHp:80,chaos,grace,data:5},masterDeck:Array(10).fill({id:'test'}),
    fetish:{butt:1,mouth:2,pussy:3,feet:4},mapState:{currentSubmap:{currentFloor:0,name:'Test'}}
   }});
   const auto=snap(0,5),one=snap(0,0),two=snap(5,0);auto.auto=true;
   one.state.player.maxHp=50;one.state.player.data=0;
   one.state.fetish={butt:0,mouth:0,pussy:0,feet:0};
   localStorage.setItem('stg_save_auto',JSON.stringify(auto));
   localStorage.setItem(STG_SAVE_KEY_PREFIX+'0',JSON.stringify(one));
   localStorage.setItem(STG_SAVE_KEY_PREFIX+'1',JSON.stringify(two));
   window._stgTestSource=[auto,one,two];
   stgOpenSlotPicker('load');
  });
  const picker=page.locator('#stg-slot-picker');
  await picker.locator('.stg-msave-panel').waitFor();
  await page.waitForTimeout(350);
  if(process.env.STG_TEST_FONTS){
   const loaded=await Promise.race([
    page.evaluate(async()=>{
     await Promise.all([MOONSHINE_WORKSPACE.window.STG_MOBILE_UI.loadNotoSans(),MOONSHINE_WORKSPACE.window.STG_MOBILE_UI.loadNotoEmoji()]);
     await document.fonts.load('400 24px "Noto Emoji"','🍑👄🫦🌸🦶✎🗑🃏🧭📂');
     await document.fonts.load('400 20px "Noto Sans"','Load Run Renaming to...');
     const faceLoaded=name=>Array.from(document.fonts).some(face=>face.family===name&&face.status==='loaded');
     return {sans:faceLoaded('Noto Sans'),emoji:faceLoaded('Noto Emoji')};
    }),new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),20000))
   ]);
   console.log('Live fonts:',loaded);
   assert.deepEqual(loaded,{sans:true,emoji:true});
  }
  assert.equal(await picker.locator('.stg-msave-card').count(),4);
  assert.equal(await picker.locator('.stg-msave-card--open').count(),0);
  assert.deepEqual(await picker.locator('.stg-msave-name').allTextContents(),['Autosave','Slot 1','Slot 2','Slot 3']);
  const autoCard=picker.locator('[data-msave-key="auto"]');
  const animationState=()=>autoCard.evaluate(el=>({
   height:el.getBoundingClientRect().height,
   opacity:Number(getComputedStyle(el.querySelector('[data-ms-class~="stg-msave-detail"]')).opacity),
   visibility:getComputedStyle(el.querySelector('[data-ms-class~="stg-msave-detail"]')).visibility,
   radius:parseFloat(getComputedStyle(el).borderTopLeftRadius),
   titleColor:getComputedStyle(el.querySelector('[data-ms-class~="stg-msave-toggle"]')).color,
   titleTop:el.querySelector('[data-ms-class~="stg-msave-name"]').getBoundingClientRect().top,
   titleSize:getComputedStyle(el.querySelector('[data-ms-class~="stg-msave-name"]')).fontSize
  }));
  const closedState=await animationState();
  await picker.locator('[data-msave-key="auto"] .stg-msave-toggle').click();
  await page.waitForTimeout(80);
  const stretchingState=await animationState();
  await page.screenshot({path:'/tmp/stg-b5-save-stretching-400x760.png'});
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#MOONSHINE-root [data-msave-key="auto"] [data-ms-class~="stg-msave-detail"]')).opacity)>.99);
  const revealedState=await animationState();
  if(process.env.STG_DEBUG_ANIMATION) console.log('Animation:',{closedState,stretchingState,revealedState});
  assert(stretchingState.height>closedState.height+10&&stretchingState.height<revealedState.height-10);
  assert.equal(stretchingState.visibility,'hidden');
  assert(stretchingState.opacity<.05&&revealedState.opacity>.95);
  assert(stretchingState.radius<=25,'Opening card must retain a rounded rectangle rather than an ellipse');
  assert(Math.abs(stretchingState.titleTop-closedState.titleTop)<1&&Math.abs(revealedState.titleTop-closedState.titleTop)<1,'Save title moved while its card expanded');
  assert.equal(revealedState.titleSize,closedState.titleSize,'Save title changed size while its card expanded');
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-name').textContent(),'Autosave');
  assert.equal(await picker.locator('.stg-msave-card--open').count(),1);
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-rename,[data-msave-key="auto"] .stg-msave-delete,[data-msave-key="auto"] .stg-msave-disabled-delete').count(),0);
  assert.deepEqual(await picker.locator('[data-msave-key="auto"] .stg-msave-actions button').allTextContents(),['Load','Export']);
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-actions').evaluate(el=>el.textContent.includes('🗑')),false);
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-fetishes .stg-msave-value').allTextContents().then(a=>a.join(',')),'1,2,3,4');
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-alignment--grace').count(),1);
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-data .stg-msave-value').textContent(),'5');
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-hp em').textContent(),'50');
  assert.equal(await picker.locator('[data-msave-key="auto"] .stg-msave-hp strong').textContent(),'80');
  assert.equal(await page.evaluate(()=>localStorage.getItem('stg_save_auto')),
    JSON.stringify(await page.evaluate(()=>window._stgTestSource[0])));
  await autoCard.locator('.stg-msave-toggle').click();
  await page.waitForTimeout(65);
  const fadingState=await animationState();
  assert(Math.abs(fadingState.height-revealedState.height)<2,'Collapse started before the details faded');
  assert(fadingState.opacity>0&&fadingState.opacity<1,'Details should fade while the card remains full height');
  await page.waitForTimeout(135);
  const shrinkingState=await animationState();
  await page.screenshot({path:'/tmp/stg-b5-save-shrinking-400x760.png'});
  await page.waitForFunction(()=>{
   const el=document.querySelector('[data-msave-key="auto"]');
   return !el.classList.contains('stg-msave-card--open')&&parseFloat(getComputedStyle(el).borderTopLeftRadius)>100;
  });
  const collapsedState=await animationState();
  if(process.env.STG_DEBUG_ANIMATION) console.log('Collapse:',{revealedState,fadingState,shrinkingState,collapsedState});
  assert(shrinkingState.height<revealedState.height-10&&shrinkingState.height>collapsedState.height+10);
  assert(shrinkingState.radius<=25,'Closing card must retain a rounded rectangle while tall');
  assert.notEqual(shrinkingState.titleColor,revealedState.titleColor,'Title must change toward its collapsed color during shrink');
  assert.equal(shrinkingState.visibility,'hidden');
  assert.equal(shrinkingState.opacity,0);
  assert.equal(collapsedState.radius,closedState.radius,'Collapsed card must regain its pill radius');
  assert.equal(collapsedState.titleColor,closedState.titleColor,'Collapsed title must regain its default color');
  assert(Math.abs(shrinkingState.titleTop-closedState.titleTop)<1&&Math.abs(collapsedState.titleTop-closedState.titleTop)<1,'Save title moved while its card collapsed');
  await autoCard.locator('.stg-msave-toggle').click();
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('#MOONSHINE-root [data-msave-key="auto"] [data-ms-class~="stg-msave-detail"]')).opacity)>.99);
  await page.evaluate(()=>{
   const old=document.querySelector('[data-msave-key="auto"]'),next=document.querySelector('[data-msave-key="0"]');
   const frames=[];let recording=true;
   window._stgSaveSwitchTrace=()=>{recording=false;return frames};
   (function sample(){
    if(!recording)return;
    frames.push({oldHeight:old.getBoundingClientRect().height,oldOpen:old.dataset.msClass.split(/\s+/).includes('stg-msave-card--open'),
     oldOpacity:Number(getComputedStyle(old.querySelector('[data-ms-class~="stg-msave-detail"]')).opacity),
     newOpen:next.dataset.msClass.split(/\s+/).includes('stg-msave-card--open')});
    requestAnimationFrame(sample);
   })();
   document.querySelector('[data-msave-key="1"] [data-ms-class~="stg-msave-toggle"]').click();
   document.querySelector('[data-msave-key="0"] [data-ms-class~="stg-msave-toggle"]').click();
  });
  assert.equal(await picker.locator('[data-msave-key="auto"].stg-msave-card--open').count(),1);
  assert.equal(await picker.locator('[data-msave-key="0"].stg-msave-card--open').count(),0);
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[data-msave-key="0"] [data-ms-class~="stg-msave-detail"]')).opacity)>.99);
  const switchTrace=await page.evaluate(()=>window._stgSaveSwitchTrace());
  const firstShrink=switchTrace.find(frame=>frame.oldHeight<revealedState.height-10);
  assert(firstShrink&&firstShrink.oldOpacity<.02,'Old details must fade before their card shrinks');
  assert(switchTrace.every(frame=>!frame.oldOpen||!frame.newOpen),'Two save cards expanded at once');
  assert(switchTrace.filter(frame=>frame.newOpen).every(frame=>frame.oldHeight<closedState.height+4),'New card expanded before the old card finished shrinking');
  assert.equal(await picker.locator('.stg-msave-card--open').count(),1);
  assert.equal(await picker.locator('[data-msave-key="0"].stg-msave-card--open .stg-msave-detail').evaluate(el=>getComputedStyle(el).visibility),'visible');
  await picker.locator('[data-msave-key="1"] .stg-msave-toggle').click();
  await picker.locator('[data-msave-key="1"].stg-msave-card--revealed').waitFor();
  assert.equal(await picker.locator('.stg-msave-card--open').count(),1);
  assert.equal(await picker.locator('[data-msave-key="1"] .stg-msave-alignment--chaos').count(),1);
  await picker.locator('[data-msave-key="0"] .stg-msave-toggle').click();
  await picker.locator('[data-msave-key="0"].stg-msave-card--revealed').waitFor();
  assert.equal(await picker.locator('[data-msave-key="0"] .stg-msave-alignment--neutral').count(),1);
  await page.waitForTimeout(150);
  await page.screenshot({path:'/tmp/stg-b5-save-reference-400x760.png'});
  if(b6SaveLayout){
   assert.equal(await picker.locator('[data-msave-key="0"] .stg-msave-fetishes .stg-msave-stat:nth-child(2) .stg-msave-symbol-glyph').textContent(),'🫦');
   const saveLayout=await picker.locator('[data-msave-key="0"]').evaluate(el=>{
    const box=selector=>el.querySelector(selector).getBoundingClientRect();
    const card=box('.stg-msave-card-head'),edit=box('.stg-msave-rename');
    const stat=el.querySelector('[data-ms-class~="stg-msave-fetishes"] [data-ms-class~="stg-msave-stat"]');
    const icon=stat.querySelector('[data-ms-class~="stg-msave-symbol"]').getBoundingClientRect();
    const value=stat.querySelector('[data-ms-class~="stg-msave-value"]').getBoundingClientRect();
    return {editTop:edit.top-card.top,editWidth:edit.width,editHeight:edit.height,
     iconHeight:icon.height,valueHeight:value.height,overlap:icon.right-value.left};
   });
   assert(saveLayout.editTop>=6&&saveLayout.editWidth>saveLayout.editHeight*1.3,
    JSON.stringify(saveLayout));
   assert(saveLayout.iconHeight>=24&&Math.abs(saveLayout.iconHeight-saveLayout.valueHeight)<=2&&
    Math.abs(saveLayout.overlap)<=1,JSON.stringify(saveLayout));
  }
  const typography=await picker.locator('[data-msave-key="0"]').evaluate(el=>{
   const names=['.stg-msave-hp b','.stg-msave-hp em','.stg-msave-hp strong','.stg-msave-deck .stg-msave-value','.stg-msave-alignment .stg-msave-value','.stg-msave-data .stg-msave-value','.stg-msave-fetishes .stg-msave-value'];
   return names.map(name=>getComputedStyle(el.querySelector(name)).fontFamily);
  });
  assert(typography.every(name=>name.includes('JetBrains Mono')),typography.join(' | '));
  const otherFonts=await picker.locator('[data-msave-key="0"]').evaluate(el=>({
   button:getComputedStyle(el.querySelector('[data-ms-class~="stg-msave-primary"]')).fontFamily,
   icon:getComputedStyle(el.querySelector('[data-ms-class~="stg-msave-fetishes"] [data-ms-class~="stg-msave-symbol-glyph"]')).fontFamily
  }));
  assert(otherFonts.button.includes('Noto Sans')&&otherFonts.icon.includes('Noto Emoji'),JSON.stringify(otherFonts));
  const iconFit=await picker.locator('[data-msave-key="0"] .stg-msave-fetishes .stg-msave-symbol').evaluateAll(els=>els.map(el=>{
   const outer=el.getBoundingClientRect(),glyph=el.firstElementChild.getBoundingClientRect();
   return glyph.left>=outer.left-1&&glyph.right<=outer.right+1&&glyph.top>=outer.top-1&&glyph.bottom<=outer.bottom+1;
  }));
  assert(iconFit.every(Boolean),'Fetish symbol glyph overflowed its circular background');
  const palette=await picker.locator('[data-msave-key="0"]').evaluate(el=>{
   const color=sel=>getComputedStyle(el.querySelector(sel)).color;
   return {deck:color('.stg-msave-deck .stg-msave-value'),neutral:color('.stg-msave-alignment .stg-msave-value'),data:color('.stg-msave-data .stg-msave-value'),fetish:color('.stg-msave-fetishes .stg-msave-value')};
  });
  assert.deepEqual(palette,{deck:'rgb(174, 149, 211)',neutral:'rgb(191, 191, 191)',data:'rgb(244, 217, 117)',fetish:'rgb(174, 149, 211)'});
  await picker.locator('[data-msave-key="0"] .stg-msave-rename').click();
  const prompt=page.locator('#stg-confirm-modal.stg-msave-rename');await prompt.waitFor();
  await page.waitForTimeout(350);
  for(const [width,height] of [[400,760],[360,640],[360,800],[360,780]]){
   await page.setViewportSize({width,height});
   await page.waitForTimeout(100);
   const box=await prompt.locator(':scope > div').evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,vw:innerWidth,vh:innerHeight};
   });
   if(process.env.STG_DEBUG_ANIMATION) console.log('Rename geometry:',box);
   assert(box.left>=0&&box.right<=box.vw&&box.top>=0&&box.bottom<=box.vh,JSON.stringify(box));
   assert(box.width/box.vw>=.93&&box.width/box.vw<=.99,JSON.stringify(box));
   assert(box.height/box.width>=.25&&box.height/box.width<=.29,JSON.stringify(box));
   await page.screenshot({path:`/tmp/stg-b5-rename-${width}x${height}.png`});
  }
  await page.setViewportSize({width:400,height:760});
  await page.waitForTimeout(100);
  const renameGeometry=await prompt.evaluate(el=>{
   const input=el.querySelector('#stg-prompt-input').getBoundingClientRect();
   const button=el.querySelector('#stg-prompt-ok').getBoundingClientRect();
   return {input:{left:input.left,right:input.right,top:input.top,bottom:input.bottom},button:{left:button.left,right:button.right,top:button.top,bottom:button.bottom}};
  });
  assert(renameGeometry.button.left>=renameGeometry.input.left&&renameGeometry.button.right<=renameGeometry.input.right);
  assert(renameGeometry.button.top>=renameGeometry.input.top&&renameGeometry.button.bottom<=renameGeometry.input.bottom);
  assert(await prompt.locator(':scope > div').evaluate(el=>el.getBoundingClientRect().width>=innerWidth*.9));
  assert.equal(await prompt.locator('#stg-prompt-ok .stg-consent-btn-label').textContent(),'>');
  assert.equal(await prompt.locator('div').first().textContent().then(t=>t.includes('Renaming to...')),true);
  await prompt.locator('#stg-prompt-input').fill('A very long name for this save that requires horizontal scrolling');
  await prompt.locator('#stg-prompt-ok').click();
  assert.equal(await page.evaluate(()=>stgReadSaveSlot(0).saveName.length),40);
  assert(await picker.locator('[data-msave-key="0"] .stg-msave-name').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=17));
  assert.equal(await picker.locator('[data-msave-key="0"].stg-msave-card--open').count(),1);
  for(const [width,height] of [[400,760],[360,640],[360,800],[360,780]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(310);
   const g=await picker.evaluate(el=>{
    const p=el.querySelector('[data-ms-class~="stg-msave-panel"]').getBoundingClientRect();
    const l=el.querySelector('[data-ms-class~="stg-msave-list"]').getBoundingClientRect();
    const c=el.querySelector('[data-ms-class~="stg-msave-close"]').getBoundingClientRect();
    return {p:{left:p.left,right:p.right,top:p.top,bottom:p.bottom},l:{top:l.top,bottom:l.bottom},c:{top:c.top,bottom:c.bottom},vw:innerWidth,vh:innerHeight};
   });
   assert(g.p.left>=0&&g.p.right<=width&&g.p.top>=0&&g.p.bottom<=height,JSON.stringify(g));
   assert(g.l.bottom<g.c.top&&g.c.bottom<=height,JSON.stringify(g));
   await page.screenshot({path:`/tmp/stg-b5-saves-${width}x${height}.png`});
  }
  await page.setViewportSize({width:400,height:760});
  await picker.locator('[data-msave-key="1"] .stg-msave-toggle').click();
  await picker.locator('[data-msave-key="1"] .stg-msave-delete').click();
  await page.locator('#stg-confirm-cancel').click();
  assert(await page.evaluate(()=>!!stgReadSaveSlot(1)));
  await picker.locator('[data-msave-key="1"] .stg-msave-delete').click();
  await page.locator('#stg-confirm-ok').click();
  assert.equal(await page.evaluate(()=>stgReadSaveSlot(1)),null);
  assert(await page.evaluate(()=>!!stgReadAutosave()));
  await picker.locator('[data-msave-key="auto"] .stg-msave-toggle').click();
  const download=page.waitForEvent('download');
  await picker.locator('[data-msave-key="auto"] [data-msave-action="export"]').click();
  assert((await download).suggestedFilename().includes('autosave'));
  await picker.locator('[data-msave-key="1"] .stg-msave-toggle').click();
  const chooser=page.waitForEvent('filechooser');
  await picker.locator('[data-msave-key="1"] [data-msave-action="importTo"]').click();
  await (await chooser).setFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(await page.evaluate(()=>window._stgTestSource[2])))});
  await page.waitForFunction(()=>!!stgReadSaveSlot(1));
  assert(await page.evaluate(()=>!!stgReadAutosave()));
  await page.evaluate(()=>STG_SAVE_SLOT_COUNT=10);
  await page.evaluate(()=>stgOpenSlotPicker('load'));
  assert.equal(await picker.locator('.stg-msave-card').count(),11);
  assert(await picker.locator('.stg-msave-list').evaluate(el=>el.scrollHeight>el.clientHeight));
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>!document.getElementById('MOONSHINE-root'));
  assert.equal(await picker.locator('.stg-msave-panel').count(),0);
  assert.equal(await picker.locator('.stg-slot-modal').count(),1);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  await picker.locator('.stg-msave-panel').waitFor();
  await picker.locator('.stg-msave-close').click();
  assert.equal(await picker.count(),0);
  const autoLoad=await page.evaluate(()=>{
   const prior=window.stgDeserializeRun,priorGoTo=window.stgGoTo;
   const priorInit=window.stgInitAudio,priorUnlock=window.stgUnlockAudio,priorBgm=window.stgStartBgm;
   let deserialized=false,played='';
   window.stgDeserializeRun=p=>{deserialized=p.auto===true;return true};
   window.stgGoTo=p=>{played=p};
   window.stgInitAudio=window.stgUnlockAudio=window.stgStartBgm=()=>{};
   stgOpenSlotPicker('load');
   MOONSHINE_WORKSPACE.document.querySelector('[data-msave-key="auto"] .stg-msave-toggle').click();
   MOONSHINE_WORKSPACE.document.querySelector('[data-msave-key="auto"] [data-msave-action="load"]').click();
   window.stgDeserializeRun=prior;window.stgGoTo=priorGoTo;
   window.stgInitAudio=priorInit;window.stgUnlockAudio=priorUnlock;window.stgStartBgm=priorBgm;
   return {deserialized,played,closed:!document.getElementById('stg-slot-picker')};
  });
  assert.deepEqual(autoLoad,{deserialized:true,played:'MapScreen',closed:true});
  // Native map autosave writer stays the owner; mobile hook exposes only an optional notice.
  const notice=await page.evaluate(()=>{
   const prior=window.stgSerializeRun;
   const run=window._STG;
   window._STG={player:{hp:50,maxHp:80}};
   window.stgSerializeRun=()=>window._stgTestSource[1];
   let seen=0;MOONSHINE_WORKSPACE.window.STG_MOBILE_SAVES.setAutosaveNotice(()=>seen++);
   const ok=stgWriteAutosave();
   MOONSHINE_WORKSPACE.window.STG_MOBILE_SAVES.setAutosaveNotice(null);
   window.stgSerializeRun=prior;
   window._STG=run;
   return {ok,seen,stored:!!stgReadAutosave()};
  });
  assert.deepEqual(notice,{ok:true,seen:1,stored:true});
  await page.evaluate(()=>{
   window._stgWriteSaveSlotOriginal=window.stgWriteSaveSlot;
   window._stgWriteSaveSlotCalled=0;
   window.stgWriteSaveSlot=()=>{window._stgWriteSaveSlotCalled++;return true};
   stgOpenSlotPicker('save');
  });
  assert.equal(await picker.locator('.stg-msave-panel h2').textContent(),'Save Run');
  await picker.locator('[data-msave-key="0"] .stg-msave-toggle').click();
  assert.equal(await picker.locator('[data-msave-key="0"] [data-msave-action="overwrite"]').textContent(),'Overwrite');
  assert.equal(await picker.locator('[data-msave-key="0"] [data-msave-action="load"]').count(),1);
  await picker.locator('[data-msave-key="0"] [data-msave-action="overwrite"]').click();
  await page.locator('#stg-confirm-ok').click();
  assert.equal(await page.evaluate(()=>window._stgWriteSaveSlotCalled),1);
  assert.equal(await picker.count(),0);
  await page.evaluate(()=>{window.stgWriteSaveSlot=window._stgWriteSaveSlotOriginal;delete window._stgWriteSaveSlotOriginal;});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>stgOpenSlotPicker('load'));
  const reducedCard=picker.locator('[data-msave-key="auto"]');
  await reducedCard.locator('.stg-msave-toggle').click();
  await page.waitForFunction(()=>document.querySelector('#MOONSHINE-root [data-msave-key="auto"]').dataset.msClass.split(' ').includes('stg-msave-card--revealed'));
  assert.equal(await reducedCard.locator('.stg-msave-detail').evaluate(el=>getComputedStyle(el).opacity),'1');
  await reducedCard.locator('.stg-msave-toggle').click();
  await page.waitForFunction(()=>!document.querySelector('#MOONSHINE-root [data-msave-key="auto"]').dataset.msClass.split(' ').includes('stg-msave-card--open'));
  assert.equal(await reducedCard.locator('.stg-msave-detail').evaluate(el=>getComputedStyle(el).opacity),'0');
  await picker.locator('.stg-msave-close').click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert.deepEqual(errors,[]);
  console.log('PASS b5 save UI: native slots, Autosave, metadata/fonts, rename, ratios, future slots, desktop, hook');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
