const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),assert=require('node:assert/strict');
const gameFile=process.env.STG_TEST_HTML||'STG 0.2m-b6.html';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:384,height:832},hasTouch:true});
  require('./helpers/moonshine-test-ui.cjs')(page);
  await page.route('https://**/*',r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(gameFile)).href);
  await page.waitForFunction(()=>typeof stgGoTo==='function');
  await page.locator('#stg-fs-prompt .stg-fs-no').waitFor();
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.locator('#stg-fs-prompt .stg-fs-no').click();
  await page.locator('#stg-consent-overlay .stg-consent-btn-accept').click();
  await page.locator('#stg-consent-overlay').waitFor({state:'detached'});
  await page.evaluate(()=>stgGoTo('CharacterSelect'));
  await page.locator('.stg-mobile-character-next').waitFor();
  const viewportLayout=await page.evaluate(()=>{const r=document.querySelector('#MOONSHINE-root [data-ms-id=\"stg-charsel-root\"]').getBoundingClientRect();return {width:r.width,height:r.height,bottom:r.bottom,innerWidth,innerHeight,visualHeight:visualViewport&&visualViewport.height};});
  assert(Math.abs(viewportLayout.width-viewportLayout.innerWidth)<=1,JSON.stringify(viewportLayout));
  assert(Math.abs(viewportLayout.height-viewportLayout.visualHeight)<=1&&Math.abs(viewportLayout.bottom-viewportLayout.visualHeight)<=1,JSON.stringify(viewportLayout));
  for(const viewport of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:360,height:780}]){
   await page.setViewportSize(viewport);
   await page.waitForFunction(()=>{const r=document.querySelector('#MOONSHINE-root [data-ms-id=\"stg-charsel-root\"]').getBoundingClientRect();return Math.abs(r.width-innerWidth)<=1&&Math.abs(r.height-visualViewport.height)<=1;});
   const edges=await page.locator('.stg-mobile-character-stage, .charsel-actions').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};}));
   assert(edges.every(r=>r.left>=-1&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1),JSON.stringify({viewport,edges}));
  }
  await page.setViewportSize({width:384,height:832});
  assert.equal(await page.locator('.charsel-tile:visible').count(),1);
  assert.equal(await page.locator('.stg-mobile-character-count').textContent(),'1 of 4');
  assert.equal(await page.locator('.charsel-bg-video').count(),1);
  assert.equal(await page.locator('.charsel-bg-video').evaluate(e=>getComputedStyle(e).opacity),'1');
  assert((await page.locator('.charsel-bg').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('static.wixstatic.com'));
  const backgroundSize=await page.evaluate(()=>{const a=document.querySelector('#MOONSHINE-root [data-ms-id=\"stg-charsel-root\"]').getBoundingClientRect(),b=document.querySelector('#MOONSHINE-root [data-ms-class~=\"charsel-bg-video\"]').getBoundingClientRect();return [a.width,a.height,b.width,b.height];});
  assert(Math.abs(backgroundSize[0]-backgroundSize[2])<=1&&Math.abs(backgroundSize[1]-backgroundSize[3])<=1,JSON.stringify(backgroundSize));
  await page.screenshot({path:'/tmp/stg-b6-character-beta.png'});
  await page.locator('.stg-mobile-character-prev').click();assert(await page.locator('.charsel-confirm').isDisabled());
  assert.equal(await page.locator('.stg-mobile-character-count').textContent(),'4 of 4');
  assert(await page.locator('#stg-charsel-root').evaluate(e=>(e.dataset.msClass||e.className).split(' ').includes('stg-mobile-character-locked')));
  assert.equal(await page.locator('#stg-charsel-root').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
  assert.equal(await page.locator('.charsel-bg-video').count(),0);
  assert.equal(await page.locator('.charsel-gradient').evaluate(e=>getComputedStyle(e).opacity),'0');
  await page.locator('#stg-noto-emoji-font').waitFor({state:'attached'});
  assert((await page.locator('#stg-noto-emoji-font').getAttribute('href')).includes('family=Noto+Emoji'));
  await page.screenshot({path:'/tmp/stg-b6-character-locked.png'});
  await page.locator('.stg-mobile-character-next').click();
  const duringShake=await page.evaluate(()=>{document.body.classList.add('stg-shake');const root=document.querySelector('#MOONSHINE-root [data-ms-id=\"stg-charsel-root\"]').getBoundingClientRect(),back=document.querySelector('#MOONSHINE-root [data-ms-class~=\"charsel-back\"]').getBoundingClientRect(),deploy=document.querySelector('#MOONSHINE-root [data-ms-class~=\"charsel-confirm\"]').getBoundingClientRect();return {bodyAnimation:getComputedStyle(document.querySelector('#MOONSHINE-root')).animationName,cardAnimation:getComputedStyle(document.querySelector('#MOONSHINE-root [data-ms-class~=\"stg-mobile-character-card\"]')).animationName,root:{x:root.x,y:root.y,w:root.width,h:root.height},back:{x:back.x,y:back.y,w:back.width,h:back.height},deploy:{x:deploy.x,y:deploy.y,w:deploy.width,h:deploy.height}};});
  assert.equal(duringShake.bodyAnimation,'none','body shake must not clip the fixed mobile screen');
  assert.equal(duringShake.cardAnimation,'stg-mobile-character-card-shake');
  assert.deepEqual(duringShake.root,{x:0,y:0,w:384,h:832});
  for(const button of [duringShake.back,duringShake.deploy])assert(button.y>=0&&button.y+button.h<=832&&button.x>=0&&button.x+button.w<=384,JSON.stringify(duringShake));
  await page.screenshot({path:'/tmp/stg-b6-character-shake.png'});
  assert.equal(await page.evaluate(()=>_stgSelectedCharId),'tiny_hero');
  assert.equal(await page.locator('.charsel-bg-video').count(),1);
  await page.locator('.charsel-back').click();await page.locator('#stg-menu-root').waitFor();
  await page.evaluate(()=>stgStartNewGame());
  if(await page.locator('#stg-consent-overlay').count()){
   await page.locator('#stg-consent-overlay .stg-consent-btn-accept').click();
   await page.locator('#stg-consent-overlay').waitFor({state:'detached'});
  }
  await page.locator('.charsel-confirm').waitFor();
  await page.locator('.charsel-confirm').click();await page.locator('#stg-blessing-root').waitFor();
  assert.equal(await page.evaluate(()=>_STG.selectedCharacter),'tiny_hero');
  assert.equal(await page.locator('.stg-mobile-character-stage').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS real exported game: single character / locked / video node / Back to Menu / Deploy to Blessing');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
