const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true}),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>{if(r.request().url().includes('wixstatic.com'))requests.push(r.request().url());r.abort();});
page.setDefaultTimeout(8000);await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.pending.html')).href);await page.waitForFunction(()=>typeof stgStartNewGame==='function');
await page.waitForTimeout(700);await page.screenshot({path:'/tmp/moonshine-initial.png'});await page.locator('#MOONSHINE-root [data-ms-class~="stg-fs-no"]').click();
await page.locator('#MOONSHINE-root [data-ms-class~="stg-consent-btn-accept"]').click();
await page.waitForFunction(()=>!document.getElementById('stg-consent-overlay'));
await page.screenshot({path:'/tmp/moonshine-main.png'});
await page.evaluate(()=>stgStartNewGame());
await page.locator('#MOONSHINE-root [data-ms-class~="charsel-confirm"]').click();
await page.locator('#MOONSHINE-root [data-ms-class~="stg-story-panel"]').waitFor();
await page.waitForTimeout(1000);await page.screenshot({path:'/tmp/moonshine-story.png'});assert(await page.evaluate(()=>{
 const native=document.getElementById('stg-blessing-root'),owned=document.querySelector('#MOONSHINE-root [data-ms-id="stg-blessing-root"]');
 return native!==owned && !!native.closest('[data-lunar-source]') && getComputedStyle(native).visibility==='hidden' && owned.className==='MOONSHINE-display' && !owned.querySelector('[onclick]') && !native.querySelector('.stg-story-panel,.stg-mobile-top-hud') && !window.HECATE_PANEL && !LUNAR.api.hecate;
}),'Moonshine must own separate DOM and suppress native presentation');
await page.evaluate(()=>stgGoTo('Upgrade'));await page.waitForTimeout(500);
const stock=await page.evaluate(()=>{
 LUNAR.bridge.native.install();_STG.player.data=10000;stgUpgradeBoot();
 const point=LUNAR.adapter.shop.point(_STG.mapState);const initial=LUNAR.buffer.shop.read(point,'merlin');
 _stgUpgradePicks=null;_stgUpgradeCosts=null;stgUpgradeBoot();
 const recreated=LUNAR.adapter.data.shop(_stgUpgradePicks,_stgUpgradeCosts);
 const offer=initial.offers[0];if(offer)LUNAR.bridge.interfaces.call('shop.select',offer.id);
 return {initial,recreated,selected:_stgUpgradeSelectedIdx,interfaces:LUNAR.bridge.interfaces.describe('shop')};
});
assert(stock.initial.offers.length>0,'real shop boot must buffer offers');
assert.deepEqual(stock.recreated,stock.initial.offers,'same-point recreation must keep first offers/prices');assert.equal(stock.selected,0);
assert.equal(stock.interfaces.length,3);
const queued=await page.evaluate(()=>{const id=LUNAR.buffer.story.enqueue('future-panel','<em style="color:gold">Unshown story</em>',{scene:'future'});LUNAR.buffer.presentation.invalidate('active');return LUNAR.buffer.story.get(id);});
assert.equal(queued.html,'<em style="color:gold">Unshown story</em>');assert.equal(queued.phase,'pending');
await page.evaluate(()=>stgGoTo('MapScreen'));console.log('Image requests',requests.filter(url=>url.includes('/media/')).length);
assert.deepEqual(requests.filter(url=>url.includes('/media/') && !url.includes('/v1/')),[],'native-sized Wix image request escaped policy');console.log('PASS owned DOM isolation, native action bridge, actual shop reuse, pending rich text and sized Wix requests');await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));await page.waitForFunction(()=>!document.getElementById('MOONSHINE-root'));await page.evaluate(()=>LUNAR.api.moonshine.sources());assert.equal(await page.locator('[data-lunar-source]').count(),0);assert.deepEqual(errors,[]);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
