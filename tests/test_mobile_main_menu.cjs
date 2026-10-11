// Mobile presentation over the native menu: two save states, actions, mode restore.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},deviceScaleFactor:3,hasTouch:true});
  await page.route('https://**/*',r=>r.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b4.html')).href);
  await page.waitForFunction(()=>typeof stgMenuBoot==='function');
  const fullscreen=page.locator('#stg-fs-prompt .stg-fs-no');if(await fullscreen.count())await fullscreen.click();
  const consent=page.locator('#stg-consent-overlay .stg-consent-btn-accept');
  await consent.waitFor();
  if(await consent.count()){await page.locator('#stg-consent-remember').check();await consent.click();await page.locator('#stg-consent-overlay').waitFor({state:'detached'});}
  await page.evaluate(()=>stgGoTo('Menu'));
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  const menu=page.locator('#stg-menu-root .menu-content.stg-mobile-main-menu');
  await menu.waitFor();
  await page.waitForTimeout(350);
  const assertNoMenuScroll=async label=>{
   const sizes=await page.evaluate(()=>{
    const html=document.documentElement,root=document.querySelector('#stg-menu-root');
    window.scrollTo(0,999);
    root.scrollTop=999;
    return {page:html.scrollHeight-html.clientHeight,menu:root.scrollHeight-root.clientHeight,
      pageTop:window.scrollY,menuTop:root.scrollTop};
   });
   assert(sizes.page<=1&&sizes.menu<=1&&sizes.pageTop===0&&sizes.menuTop===0,
    `${label} should have no unnecessary scrolling: ${JSON.stringify(sizes)}`);
  };
  const assertButtonsCentered=async label=>{
   const layout=await menu.evaluate(e=>{
    const root=e.parentElement.getBoundingClientRect();
    const buttons=e.querySelector('.menu-buttons').getBoundingClientRect();
    const subtitle=e.querySelector('.menu-subtitle').getBoundingClientRect();
    return {offset:(buttons.top+buttons.bottom-root.top-root.bottom)/2,
      gap:buttons.top-subtitle.bottom,top:buttons.top,bottom:buttons.bottom,
      rootTop:root.top,rootBottom:root.bottom};
   });
   assert(Math.abs(layout.offset)<=2,`${label} options should be vertically centered: ${JSON.stringify(layout)}`);
   assert(layout.gap>=20&&layout.top>=layout.rootTop&&layout.bottom<=layout.rootBottom,
    `${label} options should fit below the subtitle: ${JSON.stringify(layout)}`);
  };
  await assertNoMenuScroll('New-player menu at 400×760');
  await assertButtonsCentered('New-player menu at 400×760');
  const labels=()=>menu.locator('.menu-buttons .menu-btn').allTextContents();
  assert.deepEqual(await labels(),['Start Run','Compendium','Settings','Credits','Quit']);
  assert.equal(await menu.evaluate(e=>e.classList.contains('stg-mobile-main-menu--returning')),false);
  const visual=await page.evaluate(()=>{
   const root=document.querySelector('#stg-menu-root');
   const first=root.querySelector('.menu-btn');
   const version=root.querySelector('.menu-version');
   const title=root.querySelector('.menu-title');
   return {background:getComputedStyle(root.querySelector('.menu-bg')).backgroundImage,
    fill:getComputedStyle(first).backgroundColor,versionFont:getComputedStyle(version).fontFamily,
    versionWeight:getComputedStyle(version).fontWeight,versionBackground:getComputedStyle(version).backgroundColor,
    versionShadow:getComputedStyle(version).textShadow,titleShadow:getComputedStyle(title).textShadow,
    firstTop:first.getBoundingClientRect().top,titleTop:title.getBoundingClientRect().top,
    firstWidth:first.getBoundingClientRect().width,firstHeight:first.getBoundingClientRect().height,
    role:first.dataset.stgMobileMenuRole,bodyClass:document.body.className,htmlZoom:document.documentElement.style.zoom,
    contentZoom:getComputedStyle(root.querySelector('.menu-content')).zoom,buttonCssWidth:getComputedStyle(first).width};
  });
  assert(visual.background.includes('wixstatic.com/media'),'Native menu artwork must remain');
  assert(visual.versionFont.includes('JetBrains Mono')&&visual.versionWeight==='700');
  assert.equal(visual.versionBackground,'rgba(0, 0, 0, 0)');
  assert.notEqual(visual.versionShadow,'none');assert.notEqual(visual.titleShadow,'none');
  assert(visual.titleTop<visual.firstTop-100,'Title and menu should occupy separate upper bands');
  assert(visual.titleTop>=55&&visual.titleTop<=85,'Title should have the concept artwork’s upper breathing room');
  assert(visual.firstWidth>300&&visual.firstHeight<=42);
  assert.match(visual.fill,/rgba\(/,'Buttons should have translucent fills');
  await page.screenshot({path:'/tmp/stg-b4-main-new.png'});
  await page.evaluate(()=>{
   window._stgMenuActionCalls=[];
   stgStartNewGame=()=>_stgMenuActionCalls.push('start');
   stgMenuContinue=()=>_stgMenuActionCalls.push('continue');
   stgMenuNewRunConfirm=()=>_stgMenuActionCalls.push('new-run');
   stgOpenSlotPicker=()=>_stgMenuActionCalls.push('load');
  });
  await menu.getByRole('button',{name:'Start Run'}).click();
  assert.deepEqual(await page.evaluate(()=>_stgMenuActionCalls),['start']);
  await page.evaluate(()=>{stgHasAnySave=()=>true;stgMenuBoot();});
  assert.deepEqual(await labels(),['Continue Run','New Run','Load','Compendium','Settings','Credits','Quit']);
  assert(await menu.evaluate(e=>e.classList.contains('stg-mobile-main-menu--returning')));
  await page.waitForTimeout(250);
  await assertNoMenuScroll('Returning-player menu at 400×760');
  await assertButtonsCentered('Returning-player menu at 400×760');
  const firstSavedTop=await menu.locator('.menu-buttons .menu-btn').first().evaluate(el=>el.getBoundingClientRect().top);
  assert(firstSavedTop<visual.firstTop,'Saved-run actions should start higher so seven buttons fit');
  await page.screenshot({path:'/tmp/stg-b4-main-returning.png'});
  await menu.getByRole('button',{name:'Continue Run'}).click();
  await menu.getByRole('button',{name:'New Run'}).click();
  await menu.getByRole('button',{name:'Load',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>_stgMenuActionCalls),['start','continue','new-run','load']);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>document.body.dataset.stgDisplayMode==='desktop');
  assert.equal(await page.locator('.stg-mobile-main-menu').count(),0);
  assert((await page.locator('#stg-menu-root .menu-buttons .menu-btn').first().innerText()).includes('Continue Run'));
  assert((await page.locator('#stg-menu-root .menu-buttons .menu-btn').first().innerText()).includes('▶'));
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  await page.waitForFunction(()=>document.body.dataset.stgDisplayMode==='mobile');
  assert.deepEqual(await labels(),['Continue Run','New Run','Load','Compendium','Settings','Credits','Quit']);
  for(const height of [640,800]){
   await page.setViewportSize({width:360,height});
   await page.waitForTimeout(100);
   const layout=await menu.evaluate(e=>{
    const title=e.querySelector('.menu-title').getBoundingClientRect();
    const last=e.querySelector('.menu-buttons .menu-btn:last-child').getBoundingClientRect();
    return {titleTop:title.top,titleBottom:title.bottom,lastBottom:last.bottom,viewport:window.innerHeight};
   });
   assert(layout.titleTop>=0&&layout.lastBottom<layout.viewport-20,`Menu fits 360×${height}`);
   assert(layout.titleBottom<layout.lastBottom,`Title remains above buttons at 360×${height}`);
   await assertNoMenuScroll(`Returning-player menu at 360×${height}`);
   await assertButtonsCentered(`Returning-player menu at 360×${height}`);
  }
  await page.evaluate(()=>{stgHasAnySave=()=>false;stgMenuBoot();});
  assert.deepEqual(await labels(),['Start Run','Compendium','Settings','Credits','Quit']);
  for(const height of [640,800]){
   await page.setViewportSize({width:360,height});
   await page.waitForTimeout(100);
   await assertNoMenuScroll(`New-player menu at 360×${height}`);
   await assertButtonsCentered(`New-player menu at 360×${height}`);
  }
  await page.setViewportSize({width:320,height:480});
  await page.evaluate(()=>{stgHasAnySave=()=>true;stgMenuBoot();});
  const shortLayout=await menu.evaluate(e=>{
   const subtitle=e.querySelector('.menu-subtitle').getBoundingClientRect();
   const buttons=e.querySelector('.menu-buttons').getBoundingClientRect();
   const root=e.parentElement;
   return {gap:buttons.top-subtitle.bottom,scrollRange:root.scrollHeight-root.clientHeight,
    buttonBottom:buttons.bottom,viewport:window.innerHeight};
  });
  assert(shortLayout.gap>=15,'Short-screen fallback should keep buttons below the subtitle');
  assert(shortLayout.buttonBottom<=shortLayout.viewport+1||shortLayout.scrollRange>0,
   'Short-screen fallback should scroll if its buttons exceed the viewport');
  assert.deepEqual(errors,[]);
  console.log('PASS b4 mobile main menu: new/returning layouts, actions, background, version font, desktop restore');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
