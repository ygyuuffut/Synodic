// C/Fs use available height, preserving a scrollable list on short screens.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true,deviceScaleFactor:3});
  await page.route('https://**/*',route=>route.abort());
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b4.html')).href);
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
  await page.evaluate(()=>stgOpenCompendium());
  await page.locator('#stg-compendium .stg-mc-shell').waitFor();
  const categories=page.getByRole('button',{name:'Card categories'});
  const filters=page.getByRole('button',{name:'Filter and sort'});
  const modal=page.locator('#stg-mc-modal');
  const geometry=()=>modal.evaluate(el=>{
   const rect=node=>{const r=node.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};
   const dialog=el.querySelector('.stg-mc-dialog');
   const list=el.querySelector('.stg-mc-option-list');
   return {dialog:rect(dialog),list:rect(list),done:rect(el.querySelector('.stg-mc-done')),
    first:rect(list.firstElementChild),last:rect(list.lastElementChild),
    scrollHeight:list.scrollHeight,clientHeight:list.clientHeight,viewport:innerHeight};
  });
  await categories.click();
  assert.equal(await modal.locator('[data-mc-switch]').count(),10);
  const full=await geometry();
  assert(full.scrollHeight<=full.clientHeight+1,'400×760 should show all ten category rows without scrolling: '+JSON.stringify(full));
  assert(full.last.bottom<=full.list.bottom+1 && full.first.top>=full.list.top-1);
  assert(full.dialog.height>400,'Dialog should grow beyond its former 226px cap');
  assert(full.done.bottom<=full.viewport-12 && full.dialog.top>=12);
  await page.screenshot({path:'/tmp/stg-b4-category-full.png'});
  for(const size of [[360,780],[360,640]]){
   await page.setViewportSize({width:size[0],height:size[1]});
   await page.waitForFunction(height=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stg-mobile-vh'))-height)<1,size[1]);
   const g=await geometry();
   assert(g.scrollHeight<=g.clientHeight+1,`${size.join('×')} should fit the entire category list`);
   assert(g.done.bottom<=size[1]-12 && g.dialog.top>=12);
  }
  await page.setViewportSize({width:320,height:400});
  await page.waitForFunction(height=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stg-mobile-vh'))-height)<1,400);
  const short=await geometry();
  assert(short.scrollHeight>short.clientHeight+1,'Short display should scroll the list: '+JSON.stringify(short));
  assert(short.done.bottom<=short.viewport-12 && short.dialog.top>=12,'Done must stay visible');
  assert(await modal.locator('.stg-mc-dialog-head h2').evaluate(el=>el.scrollWidth<=el.clientWidth+1),
    'Narrow titles must wrap inside the space between All and None');
  await page.screenshot({path:'/tmp/stg-b4-category-short.png'});
  await modal.locator('.stg-mc-option-list').evaluate(el=>el.scrollTop=el.scrollHeight);
  assert(await modal.locator('[data-mc-switch="Alpha"]').isVisible());
  await modal.locator('.stg-mc-done').click();
  await page.setViewportSize({width:400,height:760});
  await page.waitForFunction(height=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stg-mobile-vh'))-height)<1,760);
  await filters.click();
  const filter=await geometry();
  assert(filter.scrollHeight<=filter.clientHeight+1,'Filter should fit without scrolling');
  assert(filter.dialog.height<full.dialog.height,'Shorter filter content should produce a shorter panel');
  assert(filter.done.bottom<=filter.viewport-12);
  await page.setViewportSize({width:320,height:240});
  await page.waitForFunction(height=>Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--stg-mobile-vh'))-height)<1,240);
  const shortFilter=await geometry();
  assert(shortFilter.scrollHeight>shortFilter.clientHeight+1,'Very short display should scroll filter rows');
  assert(shortFilter.done.bottom<=shortFilter.viewport-12,'Filter Done must stay reachable');
  console.log('PASS b4 C/Fs adaptive dialogs: full lists on long displays, scrolling on short displays, fixed Done');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
