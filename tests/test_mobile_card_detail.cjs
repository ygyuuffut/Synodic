// Check the independent b4 portrait card-detail skin in the real game.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),path=require('node:path');

(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:3,hasTouch:true});
  require('./helpers/moonshine-test-ui.cjs')(page);
 await page.route('https://**/*',route=>route.abort());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
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
  await page.evaluate(()=>{
   STG_CARD_POPUP_IMAGES.Blast='data:image/svg+xml,'+encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="#aa4030"/></svg>');
  });
  assert(await page.evaluate(()=>{
   const source=STG_CARD_IMAGES.Blast;
   const variant=STG_DISPLAY_CONFIG.wixCardImageUrl(source,120,128);
   const detail=STG_DISPLAY_CONFIG.wixCardDetailImageUrl(source,120,128);
   return variant.includes('/v1/fill/w_108,h_115/')&&variant.endsWith('/file.webp')
     && detail.includes('/v1/fill/w_108,h_115/')&&detail.endsWith('/file.webp')
     && variant===detail;
  }), 'All card formats must use the 30% Wix WebP policy');
  await page.locator('.stg-mc-card[data-card-index]').first().click();
  const scrim=page.locator('.stg-md-scrim'),card=scrim.locator('.stg-md-card');
  await card.waitFor();
  await page.waitForTimeout(650);
  assert.equal(await card.locator('.card-name').textContent(),'Blast');
  assert.equal(await card.locator('.stg-md-uses').textContent(),'∞');
  assert.equal(await card.locator('.stg-md-worship-count,.stg-md-once-symbol').count(),0,
   'Cards without a Worship counter keep their existing header');
  assert.equal(await card.locator('.card-cost').textContent(),'1');
  assert(await card.locator('.card-cost').evaluate(el=>(el.dataset.msClass||el.className).split(' ').includes('stg-md-cost--negative')));
  assert.equal(await card.locator('.card-type-tag').textContent(),'Attack, Chaos');
  assert.equal(await card.evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(255, 136, 120)');
  assert.equal(await card.locator('.card-art img').evaluate(el=>getComputedStyle(el).objectFit),'cover');
  assert.equal(await card.locator('.card-art img').evaluate(el=>getComputedStyle(el).objectPosition),'50% 50%');
  assert(await card.locator('.card-desc').innerHTML(),'Effect HTML should be preserved');
  const frame=await card.boundingBox();
  assert(frame.width>260&&frame.width<280&&frame.height>370&&frame.height<420,'Card follows portrait concept proportions: '+JSON.stringify(frame));
  await page.screenshot({path:'/tmp/stg-b4-card-detail-blast.png'});
  await scrim.click({position:{x:5,y:5}});
  await scrim.waitFor({state:'detached'});

  async function show(item,filename){
   await page.evaluate(item=>{
    window._stgSuppressNextGainSfx=true;
    if(!STG_CARD_FLAVOR[item.name])
     STG_CARD_FLAVOR[item.name]='Sample Quote <span class="stg-flavor-cite">— A famous speaker</span>';
    stgShowCardGainedPopup(item,null,1);
   },item);
   const popup=page.locator('.stg-md-scrim');
   await popup.locator('.stg-md-card').waitFor();
   await page.waitForTimeout(650);
   if(filename)await page.screenshot({path:filename});
   return popup;
  }
  const demo={name:'A Very Long Demo Item Name That Never Fits',type:'tool',subtype:'Food',
   maxUses:3,toolUses:3,cost:0,
   desc:'This item can be used <strong>3</strong> times. '.repeat(30)};
  let popup=await show(demo,'/tmp/stg-b4-card-detail-item.png');
  assert.equal(await popup.locator('.stg-md-uses').textContent(),'3/3');
  assert(await popup.locator('.stg-md-uses').evaluate(el=>getComputedStyle(el).fontFamily.includes('JetBrains Mono')));
  assert.equal(await popup.locator('.card-cost').textContent(),'0');
  assert(await popup.locator('.card-cost').evaluate(el=>(el.dataset.msClass||el.className).split(' ').includes('stg-md-cost--zero')));
  assert.equal(await popup.locator('.card-type-tag').textContent(),'Item, Food');
  assert.equal(await popup.locator('.card-desc strong').first().textContent(),'3');
  assert(await popup.locator('.stg-card-popup-flavor').count());
  const title=popup.locator('.card-name');
  await page.waitForFunction(()=>{const el=document.querySelector('#MOONSHINE-root [data-ms-class~="stg-md-card"] [data-ms-class~="card-name"]');return el&&el.scrollWidth<=el.clientWidth});
  const titleMetrics=await title.evaluate(el=>({fontSize:parseFloat(getComputedStyle(el).fontSize),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}));
  assert(titleMetrics.fontSize<18,'Long title must shrink to one line: '+JSON.stringify(titleMetrics));
  const detail=popup.locator('.stg-md-details');
  assert(await detail.evaluate(el=>el.scrollHeight>el.clientHeight),'Long effect text must scroll inside the card');
  await detail.evaluate(el=>{el.scrollTop=el.scrollHeight});
  assert(await detail.evaluate(el=>el.scrollTop>0));
  await popup.click({position:{x:5,y:5}});
  await popup.waitFor({state:'detached'});

  await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=300;canvas.height=300;
   const context=canvas.getContext('2d');context.fillStyle='#ed9b39';
   context.fillRect(0,40,300,220);
   STG_CARD_POPUP_IMAGES.Analyze=canvas.toDataURL('image/png');
  });
  popup=await show(await page.evaluate(()=>STG_CARDS.find(card=>card.name==='Analyze')),
   '/tmp/stg-b4-card-detail-analyze.png');
  assert.equal(await popup.locator('.stg-md-once-symbol').count(),1,'Power cards get a lightning symbol');
  assert.equal(await popup.locator('.stg-md-worship-count').count(),0,'Power does not imply a Worship counter');
  const artwork=await popup.locator('.card-art').evaluate(art=>{
   const outer=art.getBoundingClientRect(),inner=art.querySelector('img').getBoundingClientRect();
   return {trimmed:(art.querySelector('img').dataset.msClass||art.querySelector('img').className).split(' ').includes('stg-md-art-trimmed'),
    top:outer.top,bottom:outer.bottom,left:outer.left,right:outer.right,
    visibleTop:inner.top+inner.height*40/300,visibleBottom:inner.top+inner.height*260/300,
    imageLeft:inner.left,imageRight:inner.right};
  });
  assert(artwork.trimmed&&artwork.visibleTop<=artwork.top+2&&artwork.visibleBottom>=artwork.bottom-2&&
   artwork.imageLeft<=artwork.left+2&&artwork.imageRight>=artwork.right-2,
   'Visible artwork should cover the centered image area despite transparent bands: '+JSON.stringify(artwork));
  await popup.click({position:{x:5,y:5}});
  await popup.waitFor({state:'detached'});

  for(const [name,desc] of [['Consume Test','<span class="kw kw-exhaust">Consume</span> 2 cards.'],
   ['Exhaust Test','Exhaust.']]){
   popup=await show({name,type:'attack',subtype:'Chaos',cost:1,desc});
   assert.equal(await popup.locator('.stg-md-once-symbol').count(),1,name+' gets lightning');
   await popup.click({position:{x:5,y:5}});
   await popup.waitFor({state:'detached'});
  }
  popup=await show({...await page.evaluate(()=>STG_CARD_TEMPLATES.hotHeaded),
   desc:'Gain 3 Heat.'});
  assert.equal(await popup.locator('.stg-md-once-symbol').count(),1,'exhaustsOnPlay gets lightning without a keyword');
  await popup.click({position:{x:5,y:5}});
  await popup.waitFor({state:'detached'});

  const worship=await page.evaluate(()=>({...STG_CARD_TEMPLATES.gloriousFeast,curseLevel:3}));
  popup=await show(worship,'/tmp/stg-b4-card-detail-worship-once.png');
  assert.equal(await popup.locator('.stg-md-uses').textContent(),'∞');
  assert.equal(await popup.locator('.stg-md-worship-count').textContent(),'3');
  assert.equal(await popup.locator('.stg-md-worship-count').getAttribute('aria-label'),'Worship uses: 3');
  assert.equal(await popup.locator('.stg-md-once-symbol').textContent(),'⚡︎');
  assert(await popup.locator('.stg-md-once-symbol').evaluate(el=>getComputedStyle(el).fontFamily.startsWith('"Noto Emoji"')));
  assert.equal(await popup.locator('.stg-md-details .stg-card-curse-badge').count(),0,
   'The Worship count belongs in the header, outside the scrollable description');
  const badges=await popup.locator('.stg-md-uses,.stg-md-once-symbol,.stg-md-worship-count,.card-cost').evaluateAll(els=>els.map(el=>{
   const box=el.getBoundingClientRect();
   return {name:el.className,x:box.x,width:box.width,centerY:box.y+box.height/2};
  }));
  assert(badges[0].x+badges[0].width<badges[2].x &&
   badges[2].x+badges[2].width<badges[1].x &&
   badges[1].x+badges[1].width<badges[3].x,
   'Use capsule, once symbol, Worship count, and cost must not overlap');
  assert(Math.abs(badges[2].centerY-badges[1].centerY)<2 &&
   Math.abs(badges[3].centerY-badges[1].centerY)<2 &&
   Math.abs(badges[0].centerY-badges[1].centerY)<2,
   'The lightning symbol must share the header centerline with the other badges: '+JSON.stringify(badges));
  await popup.click({position:{x:5,y:5}});
  await popup.waitFor({state:'detached'});
  popup=await show({...worship,name:'A Repeatable Worship Test',type:'skill',
   desc:'Gain 1 Block.',curseLevel:0,exhaustsOnPlay:false},'/tmp/stg-b4-card-detail-worship-repeat.png');
  assert.equal(await popup.locator('.stg-md-worship-count').textContent(),'0');
  assert.equal(await popup.locator('.stg-md-once-symbol').count(),0);
  await popup.click({position:{x:5,y:5}});
  await popup.waitFor({state:'detached'});

  popup=await show({...demo,name:'A Negative Cost Demo',cost:-1,desc:'Sample Quote'});
  assert.equal(await popup.locator('.card-cost').textContent(),'1');
  assert(await popup.locator('.card-cost').evaluate(el=>(el.dataset.msClass||el.className).split(' ').includes('stg-md-cost--negative')));
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>!document.querySelector('#MOONSHINE-root [data-ms-class~="stg-md-card"]'));
  assert.equal(await page.locator('.stg-card-popup-scrim .card-cost').textContent(),'-1','Desktop restores the native signed cost');
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  await page.waitForFunction(()=>!!document.querySelector('#MOONSHINE-root [data-ms-class~="stg-md-card"]'));
  assert.deepEqual(errors,[]);
  console.log('PASS b4 portrait card details: Compendium/gain, lightning rules, transparent art, cost/uses, scroll, desktop restore');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
