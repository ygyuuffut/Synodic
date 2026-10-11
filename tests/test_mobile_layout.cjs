// Geometry contract: fixed-width portrait controls, flexible browsing regions.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:360,height:640},hasTouch:true,deviceScaleFactor:3});
 require('./helpers/moonshine-test-ui.cjs')(page);
 await page.route('https://**/*',r=>r.abort());
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b4.html')).href);
 await page.waitForFunction(()=>typeof stgOpenSettings==='function');
 const fs=page.locator('#stg-fs-prompt .stg-fs-no');if(await fs.count())await fs.click();
 const consent=page.locator('#stg-consent-overlay .stg-consent-btn-accept');
 await consent.waitFor();
 if(await consent.count()){await page.locator('#stg-consent-remember').check();await consent.click();await consent.waitFor({state:'detached'});}
 await page.evaluate(()=>stgGoTo('Menu'));
 await page.locator('#stg-transition-veil').waitFor({state:'detached'});
 const results=[];
 for(const [width,height] of [[360,640],[360,780],[360,800],[400,760]]){
  await page.setViewportSize({width,height});
  await page.evaluate(()=>stgOpenSettings());
  await page.locator('.stg-mobile-settings-ui').waitFor();
  await page.waitForTimeout(350);
  const rect=async selector=>page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};});
  const settings=await rect('.stg-ms-panel');
  assert((await rect('.stg-ms-back')).bottom<=height+1);
  await page.locator('.stg-ms-back').click();await page.locator('.stg-mobile-settings-ui').waitFor({state:'detached'});
  await page.evaluate(()=>stgOpenCompendium());
  await page.locator('.stg-mc-panel').waitFor();
  await page.waitForTimeout(500);
  const cards=await rect('.stg-mc-panel'),back=await rect('.stg-mc-back');
  assert(back.bottom<=height+1);
  for(let n=0;n<2;n++){
   await page.locator('[data-mc-action="next"]').click();
   await page.waitForTimeout(300);
   assert(Math.abs((await rect('.stg-mc-panel')).height-cards.height)<=1);
   assert(Math.abs((await rect('.stg-mc-back')).top-back.top)<=1);
  }
  await page.evaluate(()=>stgCloseCompendium());
  results.push({width,height,settings:settings.height,cards:cards.height});
 }
 assert(results[1].settings>results[0].settings+100);
 assert(results[1].cards>results[0].cards+100);
 assert(results[2].cards>results[1].cards);
 console.log('PASS portrait geometry',JSON.stringify(results));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
