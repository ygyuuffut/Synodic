// Exercise the standalone b3 mobile Compendium in the real SugarCube export.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),path=require('node:path');

(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:3,hasTouch:true});
  await page.route('https://**/*',route=>route.abort());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const dialogs=[];let acceptConfirm=true;
  page.on('dialog',async dialog=>{
   dialogs.push({type:dialog.type(),message:dialog.message()});
   if(dialog.type()==='confirm'&&!acceptConfirm)await dialog.dismiss();else await dialog.accept();
  });
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b3.html')).href);
  await page.waitForFunction(()=>typeof stgOpenCompendium==='function');
  const fullscreen=page.locator('#stg-fs-prompt .stg-fs-no');
  if(await fullscreen.count())await fullscreen.click();
  const consent=page.locator('#stg-consent-overlay .stg-consent-btn-accept');
  await consent.waitFor();
  if(await consent.count()){
   await page.locator('#stg-consent-remember').check();
   await consent.click();
   await page.locator('#stg-consent-overlay').waitFor({state:'detached'});
  }
  await page.evaluate(()=>stgGoTo('Menu'));
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  const watermark=()=>page.evaluate(()=>{
   const style=getComputedStyle(document.body,'::after');
   return {content:style.content,opacity:style.opacity,pointerEvents:style.pointerEvents};
  });
  assert((await watermark()).content.includes("Tristone's Moonshine UI"),'Main menu should show the watermark');
  assert.equal((await watermark()).pointerEvents,'none','Watermark must not intercept taps');
  await page.evaluate(()=>stgOpenCredits());
  assert.equal((await watermark()).content,'none','Credits overlay should not show the watermark');
  await page.evaluate(()=>stgCloseCredits());
  await page.evaluate(()=>stgOpenCompendium());
  const root=page.locator('#stg-compendium'),shell=root.locator('.stg-mc-shell');
  const modal=page.locator('#stg-mc-modal');
  await shell.waitFor();
  await page.waitForTimeout(350);
  const compendiumGeometry=()=>shell.evaluate(el=>{
   const rect=selector=>{
    const {top,bottom,height}=el.querySelector(selector).getBoundingClientRect();
    return {top,bottom,height};
   };
   return {panel:rect('.stg-mc-panel'),back:rect('.stg-mc-back')};
  });
  const cardsGeometry=await compendiumGeometry();
  const assertStableGeometry=async section=>{
   const actual=await compendiumGeometry();
   for(const part of ['panel','back'])for(const dimension of ['top','bottom','height']){
    assert(Math.abs(actual[part][dimension]-cardsGeometry[part][dimension])<=1,
     `${section} ${part} ${dimension} must match Cards`);
   }
  };
  const frame=await root.boundingBox();
  assert(frame.width>=355 && frame.height>=635,'Compendium must cover the phone viewport');
  assert.equal(await shell.locator('.stg-mc-page-nav h2').textContent(),'Cards');
  assert.equal(await shell.locator('.stg-mc-card').count(),45);
  assert.equal(await shell.locator('.stg-mc-card').first().locator('.stg-mc-card-name').textContent(),'Blast');
  assert.equal(await shell.locator('.stg-mc-card').first().locator('.stg-mc-cost').textContent(),'1');
  assert(await shell.locator('.stg-mc-card').first().locator('.stg-mc-cost').evaluate(el=>el.classList.contains('stg-mc-cost--negative')),
    'The original Blast has a negative authored cost');
  await page.evaluate(()=>{
   window._stgTestOriginalCosts=STG_CARDS.map(card=>card.cost);
   const examples={Blast:2,Dodge:-1,Analyze:0,Energize:3};
   STG_CARDS.forEach(card=>{if(Object.hasOwn(examples,card.name))card.cost=examples[card.name]});
   stgRenderCompendium();
  });
  const exampleCosts=shell.locator('.stg-mc-card .stg-mc-cost');
  assert.equal(await exampleCosts.nth(0).textContent(),'2');
  assert.equal(await exampleCosts.nth(0).evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(183, 159, 223)');
  assert.equal(await exampleCosts.nth(1).textContent(),'1');
  assert(await exampleCosts.nth(1).evaluate(el=>el.classList.contains('stg-mc-cost--negative')));
  assert.equal(await exampleCosts.nth(1).evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(88, 63, 150)');
  assert.equal(await exampleCosts.nth(1).getAttribute('aria-label'),'Cost -1');
  assert.equal(await exampleCosts.nth(2).textContent(),'0');
  assert(await exampleCosts.nth(2).evaluate(el=>el.classList.contains('stg-mc-cost--zero')));
  assert.equal(await exampleCosts.nth(2).evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(103, 102, 102)');
  await page.screenshot({path:'/tmp/stg-b3-comp-signed-costs.png'});
  for(const cost of [-12,-123]){
   await page.evaluate(value=>{
    STG_CARDS.filter(card=>card.name==='Dodge').forEach(card=>{card.cost=value});
    stgRenderCompendium();
   },cost);
   assert.equal(await exampleCosts.nth(1).textContent(),String(Math.abs(cost)));
   const metrics=await exampleCosts.nth(1).evaluate(el=>{
    const circle=el.getBoundingClientRect();
    const range=document.createRange();range.selectNodeContents(el);
    const text=range.getBoundingClientRect();
    return {width:circle.width,height:circle.height,
     fontSize:parseFloat(getComputedStyle(el).fontSize),
     horizontalOffset:(text.left+text.right-circle.left-circle.right)/2,
     verticalOffset:(text.top+text.bottom-circle.top-circle.bottom)/2,
     fits:text.left>=circle.left && text.right<=circle.right};
   });
   assert.equal(metrics.width,24);
   assert.equal(metrics.height,24);
   assert(metrics.fontSize<15 && metrics.fits &&
    Math.abs(metrics.horizontalOffset)<2 && Math.abs(metrics.verticalOffset)<2,
    'Multi-digit cost must shrink and stay centered: '+JSON.stringify(metrics));
  }
  await shell.getByRole('button',{name:'Filter and sort'}).click();
  await modal.locator('[data-mc-sort="asc"]').click();
  await modal.locator('.stg-mc-done').click();
  assert.deepEqual(await shell.locator('.stg-mc-card[data-card-index] .stg-mc-card-name').allTextContents(),
    ['Dodge','Analyze','Blast','Energize'],'Cost sorting must retain negative values');
  await shell.getByRole('button',{name:'Filter and sort'}).click();
  await modal.locator('[data-mc-sort="desc"]').click();
  await modal.locator('.stg-mc-done').click();
  assert.deepEqual(await shell.locator('.stg-mc-card[data-card-index] .stg-mc-card-name').allTextContents(),
    ['Energize','Blast','Analyze','Dodge'],'Descending cost order must reverse the signed prices');
  await shell.getByRole('button',{name:'Reset card filters'}).click();
  await page.evaluate(()=>{
   STG_CARDS.forEach((card,index)=>{card.cost=window._stgTestOriginalCosts[index]});
   delete window._stgTestOriginalCosts;
   stgRenderCompendium();
  });
  assert(await shell.locator('.stg-mc-card--locked').count()>0);
  const lockedPositions=await shell.locator('.stg-mc-card').evaluateAll(cards=>cards.map((card,index)=>card.classList.contains('stg-mc-card--locked')?index:-1).filter(index=>index>=0));
  assert(lockedPositions.every((position,index)=>position===lockedPositions[0]+index),'Undiscovered cards must follow discovered cards');
  assert(await shell.locator('.stg-mc-scroll').evaluate(el=>el.scrollHeight>el.clientHeight),'Card list must scroll');
  assert((await watermark()).content.includes("Tristone's Moonshine UI"));
  assert.equal((await watermark()).opacity,'0.25');
  await page.screenshot({path:'/tmp/stg-b3-comp-cards.png'});
  await shell.locator('.stg-mc-card[data-card-index]').first().click();
  await page.locator('.stg-card-popup-scrim').waitFor();
  assert(await page.locator('.stg-card-popup-card .card-desc').isVisible());
  await page.waitForTimeout(280);
  await page.locator('.stg-card-popup-scrim').click({position:{x:5,y:5}});
  await page.locator('.stg-card-popup-scrim').waitFor({state:'detached'});

  await shell.getByRole('button',{name:'Card categories'}).click();
  await modal.waitFor();
  assert.equal(await modal.locator('[data-mc-switch]').count(),10);
  assert(await modal.locator('.stg-mc-option-list').evaluate(el=>el.scrollHeight<=el.clientHeight+1),
    'All family options should fit without scrolling when the viewport has enough height');
  await modal.locator('.stg-mc-option-list').evaluate(el=>el.scrollTop=el.scrollHeight);
  assert(await modal.locator('[data-mc-switch="Alpha"]').isVisible());
  await modal.locator('.stg-mc-option-list').evaluate(el=>el.scrollTop=0);
  await page.screenshot({path:'/tmp/stg-b3-comp-categories.png'});
  await modal.locator('[data-mc-none]').click();
  await modal.locator('[data-mc-switch="Chaos"]').click();
  await modal.locator('.stg-mc-done').click();
  assert.equal(await shell.locator('.stg-mc-card').count(),8);
  await shell.getByRole('button',{name:'Reset card filters'}).click();
  assert.equal(await shell.locator('.stg-mc-card').count(),45);

  await shell.getByRole('button',{name:'Filter and sort'}).click();
  assert.equal(await modal.locator('[data-mc-switch]').count(),3);
  await modal.locator('[data-mc-none]').click();
  await modal.locator('[data-mc-switch="attack"]').click();
  await modal.locator('[data-mc-sort="asc"]').click();
  await page.waitForTimeout(260);
  await page.screenshot({path:'/tmp/stg-b3-comp-filters.png'});
  await modal.locator('.stg-mc-done').click();
  assert(await shell.locator('.stg-mc-card').count()>0);
  assert(await shell.locator('.stg-mc-card').count()<45);
  await shell.getByRole('button',{name:'Reset card filters'}).click();
  assert.equal(await shell.locator('.stg-mc-card').count(),45);

  await shell.getByRole('button',{name:'Unlock cards'}).click();
  await modal.locator('input').fill('wrong');
  assert.equal(await modal.locator('.stg-mc-unlock-mask').textContent(),'*****');
  assert(await modal.locator('input').evaluate(el=>getComputedStyle(el).fontFamily.includes('monospace')));
  const caretAtEnd=await modal.locator('.stg-mc-unlock-caret').boundingBox();
  await modal.locator('input').press('ArrowLeft');
  const caretAfterLeft=await modal.locator('.stg-mc-unlock-caret').boundingBox();
  assert(caretAfterLeft.x<caretAtEnd.x,'Visible caret should follow the password selection');
  await modal.locator('input').press('End');
  const inputFrame=await modal.locator('input').boundingBox();
  const buttonFrame=await modal.locator('button[type=submit]').boundingBox();
  const formFrame=await modal.locator('.stg-mc-unlock-form').boundingBox();
  assert(Math.abs(inputFrame.y+inputFrame.height/2-buttonFrame.y-buttonFrame.height/2)<1,'Password input and submit button must share a vertical center');
  assert(Math.abs(buttonFrame.x+buttonFrame.width-formFrame.x-formFrame.width)<1,'Submit button must meet the input row right edge without a gap');
  assert(Math.abs(buttonFrame.y-formFrame.y)<1 && Math.abs(buttonFrame.height-formFrame.height)<1,'Submit button must match the rounded input row height');
  await page.screenshot({path:'/tmp/stg-b3-comp-unlock.png'});
  await modal.locator('button[type=submit]').click();
  assert.equal(await page.evaluate(()=>stgCardsAdminUnlocked()),false);
  assert.deepEqual(dialogs.at(-1),{type:'alert',message:'Unlock Code Incorrect'});
  assert.equal(await page.locator('#stg-confirm-modal').count(),0,'Native alert should bypass the game alert layer');
  assert.equal(await modal.locator('input').inputValue(),'');
  await modal.locator('input').fill('12345');
  await modal.locator('button[type=submit]').click();
  assert.deepEqual(dialogs.at(-1),{type:'alert',message:'Unlock Successful'});
  assert.equal(await page.locator('#stg-confirm-modal').count(),0,'Success must use the native alert too');
  await modal.waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>stgCardsAdminUnlocked()),true);
  assert.equal(await shell.locator('.stg-mc-card--locked').count(),0);
  assert.equal(dialogs.length,2);
  const unlockButton=shell.locator('.stg-mc-tool--unlock');
  assert(await unlockButton.isDisabled());
  assert(await unlockButton.evaluate(el=>getComputedStyle(el).backgroundColor==='rgb(67, 150, 77)'));
  await unlockButton.evaluate(el=>el.click());
  assert.equal(dialogs.length,2,'Completed U must not open another alert');
  assert.equal(await modal.count(),0,'Completed U must not open a code dialog');
  await page.screenshot({path:'/tmp/stg-b3-comp-all-unlocked.png'});
  await shell.getByRole('button',{name:'Filter and sort'}).click();
  await modal.locator('[data-mc-none]').click();
  await modal.locator('[data-mc-switch="attack"]').click();
  await modal.locator('[data-mc-sort="desc"]').click();
  await modal.locator('.stg-mc-done').click();
  const costs=await shell.locator('.stg-mc-cost').evaluateAll(elements=>elements.map(el=>Number(el.getAttribute('aria-label').slice(5))));
  assert(costs.length>1 && costs.every((cost,index)=>!index || Number(costs[index-1])>=Number(cost)),'Descending cost order must apply');
  await shell.getByRole('button',{name:'Filter and sort'}).click();
  await modal.locator('[data-mc-sort="asc"]').click();
  await modal.locator('.stg-mc-done').click();
  const ascendingCosts=await shell.locator('.stg-mc-cost').evaluateAll(elements=>elements.map(el=>Number(el.getAttribute('aria-label').slice(5))));
  assert(ascendingCosts.length>1 && ascendingCosts.every((cost,index)=>!index || Number(ascendingCosts[index-1])<=Number(cost)),'Ascending cost order must apply');
  await shell.getByRole('button',{name:'Reset card filters'}).click();
  assert.equal(await shell.locator('.stg-mc-card').count(),45);

  await shell.getByRole('button',{name:'Next section'}).click();
  assert.equal(await shell.locator('.stg-mc-page-nav h2').textContent(),'Upgrades');
  await assertStableGeometry('Upgrades');
  assert.equal(await shell.locator('.stg-mc-upgrade').count(),11);
  assert.equal(await shell.locator('.stg-mc-upgrade').first().locator('h3').textContent(),'Reinforced Chassis');
  assert(await shell.locator('.stg-mc-scroll').evaluate(el=>el.scrollHeight>el.clientHeight),'Upgrade list must scroll');
  await page.screenshot({path:'/tmp/stg-b3-comp-upgrades.png'});
  await shell.locator('.stg-mc-upgrade').first().click();
  await page.locator('.stg-card-popup-scrim').waitFor();
  assert(await page.locator('.stg-card-popup-card').textContent().then(text=>text.includes('Reinforced Chassis')));
  await page.waitForTimeout(280);
  await page.locator('.stg-card-popup-scrim').click({position:{x:5,y:5}});
  await page.locator('.stg-card-popup-scrim').waitFor({state:'detached'});
  await shell.getByRole('button',{name:'Next section'}).click();
  assert.equal(await shell.locator('.stg-mc-page-nav h2').textContent(),'Encounters');
  await assertStableGeometry('Encounters');
  assert.equal(await shell.locator('.stg-mc-scroll').textContent(),'');
  await page.screenshot({path:'/tmp/stg-b3-comp-encounters.png'});
  await shell.getByRole('button',{name:'Next section'}).click();
  assert.equal(await shell.locator('.stg-mc-page-nav h2').textContent(),'Cards');
  await assertStableGeometry('Cards after wrap');
  await shell.getByRole('button',{name:'Previous section'}).click();
  assert.equal(await shell.locator('.stg-mc-page-nav h2').textContent(),'Encounters');
  await shell.getByRole('button',{name:'Back'}).click();
  await root.waitFor({state:'detached'});
  await page.evaluate(()=>stgOpenSettings());
  const settings=page.locator('.stg-mobile-settings-ui');
  await settings.waitFor();
  assert((await watermark()).content.includes("Tristone's Moonshine UI"),'Main menu Settings should show the watermark');
  await page.screenshot({path:'/tmp/stg-b3-settings-watermark.png'});
  await settings.getByRole('tab',{name:'Reset'}).click();
  acceptConfirm=false;
  await settings.locator('[data-ms-action="compendium"]').click();
  assert.equal(dialogs.at(-1).type,'confirm');
  assert.equal(await page.evaluate(()=>stgCardsAdminUnlocked()),true,'Cancelling reset must preserve unlocks');
  acceptConfirm=true;
  await settings.locator('[data-ms-action="compendium"]').click();
  assert.equal(dialogs.at(-1).type,'confirm');
  assert.equal(await page.evaluate(()=>stgCardsAdminUnlocked()),false);
  assert.equal(await page.evaluate(()=>Object.keys(stgLoadSeenCards()).length),0);
  await settings.getByRole('button',{name:'Back'}).click();
  await settings.waitFor({state:'detached'});
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.locator('.stg-save-toast').waitFor({state:'detached'});
  await page.evaluate(()=>stgOpenCompendium());
  await shell.waitFor();
  assert.equal(await shell.locator('.stg-mc-card').count(),45);
  assert.equal(await shell.locator('.stg-mc-card[data-card-index]').count(),4,'Only four starter names should remain revealed');
  assert.equal(await shell.locator('.stg-mc-card--locked').count(),41);
  assert(await unlockButton.isEnabled());
  assert(!(await unlockButton.getAttribute('class')).includes('stg-mc-tool--complete'));
  await page.waitForTimeout(350);
  await page.screenshot({path:'/tmp/stg-b3-comp-after-reset.png'});
  await page.evaluate(()=>{
   const names=new Set(stgBuildCardCatalog().map(card=>card.name));
   Object.values(STG_CARD_TEMPLATES).forEach(card=>{if(card&&card.name&&(card.type==='tool'||card.subtype==='Worship'))names.add(card.name)});
   stgBuildConditionCatalog().forEach(card=>names.add(card.name));
   stgSaveSeenCards(Object.fromEntries(Array.from(names,name=>[name,true])));
   stgRenderCompendium();
  });
  assert.equal(await page.evaluate(()=>stgCardsAdminUnlocked()),false,'Normal discoveries must not set the admin flag');
  assert.equal(await shell.locator('.stg-mc-card--locked').count(),0);
  assert(await unlockButton.isDisabled(),'U must also become green after normal discovery');
  await unlockButton.evaluate(el=>el.click());
  assert.equal(await modal.count(),0);
  await page.evaluate(()=>{STG_DISPLAY_CONFIG.setMode('desktop');stgOpenCompendium();});
  await page.waitForFunction(()=>document.body.dataset.stgDisplayMode==='desktop');
  assert.equal(await root.locator('.stg-mc-shell').count(),0);
  assert(await root.locator('.compendium-header').isVisible());
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body,'::after').content),'none');
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  for(const size of [{width:320,height:568},{width:390,height:844}]){
   await page.setViewportSize(size);
   await page.evaluate(()=>stgOpenCompendium());
   await shell.waitFor();
   const bounds=await root.boundingBox();
   assert(bounds.width>=size.width-5 && bounds.height>=size.height-5,'Compendium must cover the viewport at '+size.width);
   assert(await shell.locator('.stg-mc-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Card grid must fit the viewport at '+size.width);
   await shell.getByRole('button',{name:'Card categories'}).click();
   const dialog=await modal.locator('.stg-mc-dialog').boundingBox();
   assert(dialog.x>=0 && dialog.x+dialog.width<=size.width+1,'Dialog must fit the viewport at '+size.width);
   await modal.click({position:{x:1,y:1}});
  }
  await page.evaluate(()=>stgGoTo('CharacterSelect'));
  await page.locator('#stg-charsel-root').waitFor();
  const watermarkDebug=await page.evaluate(()=>({
   menu:!!document.querySelector('#stg-menu-root .menu-title-accent'),
   settings:!!document.querySelector('#stg-menu-root .stg-mobile-settings-ui'),
   compendium:!!document.querySelector('#stg-compendium.stg-mobile-compendium'),
   compendiumOpen:document.body.classList.contains('stg-compendium-open')
  }));
  assert.equal((await watermark()).content,'none','Gameplay screens must not show the watermark: '+JSON.stringify(watermarkDebug));
  assert.deepEqual(errors,[]);
  console.log('PASS b3 Compendium: unlock/reset lifecycle, native details, 10 families, tags/cost, 11 upgrades, encounter loop, watermark, desktop restore');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
