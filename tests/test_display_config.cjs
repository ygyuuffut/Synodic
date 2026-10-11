// Device detection and clean mobile/desktop mode switching.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  for(const phone of [false,true]){
   const page=await browser.newPage({viewport:{width:360,height:640},hasTouch:phone});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<meta name="viewport" content="width=980"><main id="passages"><section class="passage"><div id="stg-scan-overlay" class="stg-scan-overlay"><div class="stg-scan-frame"><div class="stg-scan-header"><span class="stg-scan-label">Scan</span></div></div></div></section></main>');
   await page.evaluate(()=>{window._STG_ZOOM=1.3;window.stgApplyZoom=()=>{document.documentElement.style.zoom=String(_STG_ZOOM);};});
   await page.addStyleTag({path:path.join(__dirname,'..','moonshine/moonshine.view.source_styles.css')});
   await require('./helpers/install_moonshine_fixture.cjs')(page);
   await page.waitForFunction(expected=>document.body.dataset.stgDisplayMode===expected,phone?'mobile':'desktop');
   assert.equal(await page.locator('.stg-mobile-scan-story-btn').count(),phone?1:0);
   assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'),phone?'width=device-width, initial-scale=1, viewport-fit=cover':'width=980');
   if(!phone){
    // A narrow desktop window stays desktop, and switching restores its layout.
    await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
    await page.waitForFunction(()=>document.body.dataset.stgDisplayMode==='mobile');
    assert.equal(await page.locator('.stg-mobile-scan-story-btn').count(),1);
    assert.equal(await page.evaluate(()=>_STG_ZOOM),1.3);
    await page.locator('.stg-mobile-scan-story-btn').click();
    await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
    await page.waitForFunction(()=>document.body.dataset.stgDisplayMode==='desktop');
    assert.equal(await page.locator('.stg-mobile-scan-story-btn').count(),0);
    assert.equal(await page.locator('#stg-scan-overlay').evaluate(e=>e.classList.contains('stg-scan-minimized')),false);
    assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'),'width=980');
    assert.equal(await page.evaluate(()=>_STG_ZOOM),1.3);
   }
   assert.deepEqual(errors,[]);
   console.log('PASS',phone?'touch phone auto mobile':'narrow mouse desktop / mobile override / desktop restore');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
