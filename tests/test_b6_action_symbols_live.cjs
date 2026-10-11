/* Actual font ink must fit the clipping cell, regardless of advance width. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 for(const deviceScaleFactor of [1,3]){
  const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true,deviceScaleFactor}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.pending.html')).href);
  const own=s=>page.locator('#MOONSHINE-root '+s),actions=s=>page.locator('#MOONSHINE-actions-root '+s);
  async function until(fn){for(let i=0;i<150;i++){if(await page.evaluate(fn))return;await new Promise(r=>setTimeout(r,40));}throw Error('Paused UI did not settle');}
  async function checkInk(){
   const metrics=await actions('.MOONSHINE-actions-symbol').evaluateAll(cells=>cells.filter(cell=>cell.getBoundingClientRect().width).map(cell=>{
    const glyph=cell.firstElementChild,s=getComputedStyle(glyph),r=glyph.getBoundingClientRect(),c=cell.getBoundingClientRect(),ctx=document.createElement('canvas').getContext('2d');ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
    const m=ctx.measureText(glyph.textContent),scale=r.height/parseFloat(s.lineHeight),baseline=(parseFloat(s.lineHeight)-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent;
    const left=r.left-m.actualBoundingBoxLeft*scale,right=r.left+m.actualBoundingBoxRight*scale,top=r.top+(baseline-m.actualBoundingBoxAscent)*scale,bottom=r.top+(baseline+m.actualBoundingBoxDescent)*scale;
    return {text:glyph.textContent,left:left-c.left,right:c.right-right,top:top-c.top,bottom:c.bottom-bottom,x:Math.abs((left+right-c.left-c.right)/2),y:Math.abs((top+bottom-c.top-c.bottom)/2),position:s.position};
   }));
   assert.ok(metrics.some(m=>m.text.startsWith('💬')));
   assert.ok(metrics.every(m=>Math.min(m.left,m.right,m.top,m.bottom)>=.75&&m.x<.75&&m.y<.75&&m.position==='static'),JSON.stringify({deviceScaleFactor,metrics}));
  }
  await own('[data-ms-class~="stg-fs-no"]').click();await own('[data-ms-class~="stg-consent-btn-accept"]').click();
  await page.evaluate(async()=>stgStartNewGame());await own('[data-ms-class~="charsel-confirm"]').click();
  await own('[data-ms-class~="stg-story-panel"]').waitFor();await page.evaluate(async()=>{stgArcSkipTw();await MOONSHINE_RUNTIME.flush();});
  await own('[data-ms-class~="stg-story-actions"]').click();await page.evaluate(async()=>MOONSHINE_FONTS.emoji());
  const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument'),{nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#MOONSHINE-actions-root [data-category="dialogue"] .MOONSHINE-actions-glyph'}),{fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  assert.ok(fonts.some(f=>f.familyName==='Noto Emoji'&&f.glyphCount>0),JSON.stringify(fonts));
  for(const size of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:360,height:780},{width:320,height:640}]){
   await page.setViewportSize(size);await page.waitForTimeout(100);await checkInk();
  }
  await page.setViewportSize({width:400,height:760});
  const row=actions('[data-category="dialogue"]').first();
  const labelBefore=await row.locator('.MOONSHINE-action-label').boundingBox();
  await row.locator('.MOONSHINE-action-summary').click();
  await until(()=>{const el=document.querySelector('#MOONSHINE-actions-root [data-category="dialogue"]');return el.classList.contains('MOONSHINE-action-revealed')&&!el.querySelector('.MOONSHINE-action-detail').inert;});
  await checkInk();const labelAfter=await row.locator('.MOONSHINE-action-full-label').boundingBox();assert.ok(Math.abs(labelBefore.x+labelBefore.width/2-labelAfter.x-labelAfter.width/2)<1);
  await page.screenshot({path:'/tmp/b6-action-symbols-after-'+deviceScaleFactor+'.png'});
  await actions('[data-action-id="upgrade"] .MOONSHINE-action-summary').click();
  await until(()=>{const el=document.querySelector('#MOONSHINE-actions-root [data-action-id="upgrade"]');return el.classList.contains('MOONSHINE-action-revealed')&&!el.querySelector('.MOONSHINE-action-detail').inert;});
  await checkInk();await actions('.MOONSHINE-upgrade-offer').first().click();await checkInk();
  await page.mouse.click(5,200);await actions('.MOONSHINE-actions-close').click();assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS actual Noto Emoji ink containment/centering in collapsed/expanded actions, upgrade cards and preview at five phone sizes and DPR 1/3; static grid glyphs and centered labels');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
