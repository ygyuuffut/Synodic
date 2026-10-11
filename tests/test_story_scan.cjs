// Offline fixture: omit remote font imports; retain all local production CSS.
// Regression: real export CSS, neutral prose and many choices, saved scan geometry.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const source=fs.readFileSync(require('./helpers/synodic-test-paths.cjs').game('STG 0.2m-b5.html'),'utf8');
const css=source.match(/<style[^>]*id="twine-user-stylesheet"[^>]*>([\s\S]*?)<\/style>/)[1];
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
for(const [width,height] of [[360,640],[384,832],[320,568]]){
 const page=await browser.newPage({viewport:{width,height},hasTouch:true});await page.route('https://**/*',r=>r.abort());
 await page.setContent(`<style>${css}</style><main id="passages"><section class="passage"><div id="stg-body-root"><div class="ev-content enc-content"><div class="enc-text-panel" id="enc-text-panel"><div class="enc-title">Exploration</div><div class="ev-text" id="enc-text">${'<p>A long passage of readable story text. Explore the room and choose where to go next.</p>'.repeat(12)}</div><div id="enc-choices" class="enc-choices-inner">${Array.from({length:10},(_,i)=>`<button class="ev-choice" onclick="window.choice=${i}">Explore destination ${i}</button>`).join('')}</div></div></div></div></section></main>`);
 await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'..','moonshine/moonshine.view.source_styles.css'),'utf8').replace(/^@import .*$/gm,'')});await require('./helpers/install_moonshine_fixture.cjs')(page);
 await page.waitForFunction(()=>document.body.classList.contains('stg-mobile-ui'));
 const sizes=await page.evaluate(()=>{const p=document.querySelector('.enc-text-panel'),t=document.querySelector('#enc-text');return {panel:p.clientHeight,text:t.clientHeight,scroll:p.scrollHeight,inner:t.scrollHeight};});
 assert(sizes.panel>240,JSON.stringify(sizes));assert(sizes.text>sizes.panel);assert.equal(sizes.text,sizes.inner);assert(sizes.scroll>sizes.panel);
 await page.locator('.ev-choice').last().click();assert.equal(await page.evaluate(()=>window.choice),9);
 await page.evaluate(()=>{document.querySelector('.enc-text-panel').scrollTop=0;document.body.insertAdjacentHTML('beforeend',`<div id="stg-scan-overlay" class="stg-scan-overlay" style="left:8px;right:auto;max-width:30vw"><div class="stg-scan-frame" style="width:200px"><div class="stg-scan-header"><span class="stg-scan-label">Scanner</span><button class="stg-scan-databtn">DATA</button><span class="stg-scan-status">Complete</span></div><div class="stg-scan-image-wrap"><div class="stg-scan-data-readout stg-scan-data-readout--visible">${'<p>Scanner information to read and scroll.</p>'.repeat(20)}</div></div></div></div>`);});
 const toggle=page.locator('.stg-mobile-scan-story-btn');await toggle.waitFor();await page.waitForTimeout(400);
 const scan=await page.locator('.stg-scan-frame').boundingBox();assert(scan.width>=width-32,JSON.stringify(scan));assert(scan.x>=0&&scan.x+scan.width<=width);
 assert(await page.locator('.stg-scan-data-readout').evaluate(e=>{e.scrollTop=100;return e.scrollTop>0;}));
 await toggle.click();assert(await page.locator('#stg-scan-overlay').evaluate(e=>e.classList.contains('stg-scan-minimized')));await toggle.click();
 console.log('PASS',width+'x'+height,'readable prose / last choice reachable / full-width scan / DATA scrolling / collapse');await page.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
