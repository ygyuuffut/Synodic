// Real native Compendium and shop flows; remote font QA is opt-in.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},deviceScaleFactor:3,hasTouch:true});
  const live=process.env.STG_TEST_FONTS==='1';
  await page.route('https://**/*',r=>live&&/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.request().url())?r.continue():r.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b5.html')).href);
  await page.waitForFunction(()=>typeof stgOpenCompendium==='function');
  if(await page.locator('.stg-fs-no').count())await page.locator('.stg-fs-no').click();
  await page.locator('#stg-consent-remember').check();
  await page.locator('.stg-consent-btn-accept').click();
  await page.locator('#stg-consent-overlay').waitFor({state:'detached'});
  await page.evaluate(()=>stgGoTo('Menu'));
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.evaluate(()=>stgOpenCompendium());
  await page.locator('[data-mc-action=next]').click();
  const expected=['🤍','🪫','🔥','🪷','⚔','💽','🛠','🪖','🧪','💊','🍀'];
  const source=await page.evaluate(()=>STG_BOONS.map(b=>({id:b.id,title:b.title,desc:b.desc,icon:b.icon})));
  const geometry=[];
  for(let i=0;i<source.length;i++){
   await page.locator('.stg-mc-upgrade').nth(i).click();
   const card=page.locator('.stg-md-upgrade');await card.waitFor();
   assert.equal(await card.locator('.stg-md-upgrade-art').textContent(),expected[i]);
   assert.equal(await card.locator('.stg-md-upgrade-label').textContent(),'UPGRADE');
   assert.equal(await card.locator('.stg-md-upgrade-badge').textContent(),'📀');
   assert.equal(await card.locator('.card-cost,.stg-md-uses,.stg-md-worship-count,.stg-md-once-symbol,.card-type-tag').count(),0);
   assert.equal(await card.locator('.card-name').textContent(),source[i].title);
   assert.equal(await card.locator('.card-desc').textContent(),source[i].desc);
   if(live){
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.stg-md-upgrade .stg-mu-symbol')).every(n=>n._stgNotoReady===true));
   }
   await page.waitForTimeout(550);
   const sizes=i===0?[[400,760],[360,640],[360,800],[360,780]]:[[400,760]];
   for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    const metrics=await card.evaluate(card=>{
     const rect=e=>{let b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
     return {art:rect(card.querySelector('.card-art')),glyph:rect(card.querySelector('.stg-md-upgrade-art .stg-mu-glyph')),card:rect(card),
      titleFits:card.querySelector('.card-name').scrollWidth<=card.querySelector('.card-name').clientWidth};
    });
    assert(metrics.titleFits);assert(metrics.card.y>=0&&metrics.card.y+metrics.card.height<=height);
    if(live){
     const file=`/tmp/stg-b5-upgrade-${source[i].id}-${width}x${height}.png`;
     await page.screenshot({path:file});geometry.push({id:source[i].id,width,height,file,...metrics});
    }
   }
   await page.setViewportSize({width:400,height:760});
   // An internal click cannot dismiss a reading pane; native backdrop still closes.
   await card.locator('.card-name').click();assert.equal(await card.count(),1);
   if(i===0){
    const original=await page.evaluate(()=>document.querySelector('.stg-md-card')._stgMdOriginal);
    await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
    await page.waitForFunction(()=>!document.querySelector('.stg-md-card'));
    assert.equal(await page.locator('.stg-card-popup-card').innerHTML(),original);
    await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
    await card.waitFor();
   }
   await page.locator('.stg-md-scrim').click({position:{x:5,y:5}});
   await page.locator('.stg-md-scrim').waitFor({state:'detached'});
  }
  if(live)fs.writeFileSync('/tmp/stg-b5-upgrade-geometry.json',JSON.stringify(geometry,null,2));
  // Long rich text remains readable and scrolls without changing the native HTML.
  await page.evaluate(()=>{
   _stgCompCatalog=[{name:'Reinforced Chassis',type:'power',typeLabel:'Upgrade',cost:null,
    desc:'<strong style="color:red">Original formatting</strong> '+('Long effect. '.repeat(200))}];
   stgShowCardView(0);
  });
  await page.locator('.stg-md-upgrade').waitFor();
  assert.equal(await page.locator('.stg-md-details strong').textContent(),'Original formatting');
  assert(await page.locator('.stg-md-details').evaluate(e=>e.scrollHeight>e.clientHeight));
  await page.waitForTimeout(300);
  await page.locator('.stg-md-scrim').click({position:{x:5,y:5}});
  await page.locator('.stg-md-scrim').waitFor({state:'detached'});
  await page.evaluate(()=>{stgCloseCompendium();stgDevMerlinShop();});
  await page.locator('#stg-upgrade-root .blessing-card').first().waitFor();
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.evaluate(()=>{
   _stgUpgradePicks=[STG_BOONS.find(b=>b.id==='energy'),STG_BOONS.find(b=>b.id==='draw')];
   _stgUpgradeCosts=[2,3];_stgUpgradeSelectedIdx=-1;stgUpgradeRender();
  });
  assert.deepEqual(await page.locator('#stg-upgrade-root .blessing-card-icon').allTextContents(),['🪫','💽']);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>!document.querySelector('#MOONSHINE-root'));
  assert.deepEqual(await page.locator('#stg-upgrade-root .blessing-card-icon').allTextContents(),['⚡','✦']);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  await page.waitForFunction(()=>document.querySelector('.blessing-card-icon').textContent==='🪫');
  const before=await page.evaluate(()=>({data:_STG.player.data,energy:_STG.energy,bonus:_STG.bonusEnergy||0}));
  await page.locator('#stg-upgrade-root .blessing-card').first().click();
  assert.equal(await page.evaluate(()=>_stgUpgradeSelectedIdx),0);
  assert.equal(await page.evaluate(()=>_STG.player.data),before.data);
  await page.locator('#stg-upgrade-root .blessing-continue').filter({hasText:'Buy'}).click();
  await page.locator('#stg-mapscreen-root').waitFor();
  const after=await page.evaluate(()=>({data:_STG.player.data,energy:_STG.energy,bonus:_STG.bonusEnergy,owned:_STG.ownedBoons}));
  assert.equal(after.energy,before.energy+1);assert.equal(after.bonus,before.bonus+1);assert(after.owned.includes('energy'));
  assert.equal(after.data,Math.min(before.data-2,await page.evaluate(()=>stgDataMax())));
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.locator('#stg-relic-toggle').waitFor();
  await page.waitForTimeout(300);
  await page.evaluate(()=>{if(!document.getElementById('stg-relic-tray'))stgToggleRelicTray();});
  assert.equal(await page.locator('.stg-relic-chip-icon').textContent(),'🪫');
  const stateBeforePreview=await page.evaluate(()=>JSON.stringify(_STG));
  await page.locator('.stg-relic-chip').click();
  await page.locator('.stg-md-upgrade').waitFor();
  assert.equal(await page.locator('.stg-md-upgrade-art').textContent(),'🪫');
  assert.equal(await page.locator('.stg-md-upgrade .card-name').textContent(),'Spare Power Cell');
  assert(await page.locator('.stg-md-upgrade .stg-card-popup-flavor').count());
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.locator('.stg-rs-boon-card').waitFor();
  assert.equal(await page.locator('.stg-rs-boon-icon').textContent(),'⚡');
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  await page.locator('.stg-md-upgrade').waitFor();
  await page.locator('.stg-md-upgrade .card-name').click();
  assert.equal(await page.locator('.stg-md-upgrade').count(),1);
  await page.locator('.stg-md-scrim').click({position:{x:5,y:5}});
  await page.locator('.stg-md-scrim').waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>JSON.stringify(_STG)),stateBeforePreview,'Viewing owned upgrades must not reapply effects');
  // Blessing keeps its native selection controls and uses the same visual mapping.
  await page.evaluate(()=>{_stgBlessingPicks=[STG_BOONS.find(b=>b.id==='grace_cap')];_stgBoonPicked=false;stgGoTo('Blessing');});
  await page.locator('#stg-blessing-root .blessing-card-icon').waitFor();
  await page.waitForFunction(()=>document.querySelector('#stg-blessing-root .blessing-card-icon').textContent==='🪷');
  assert.deepEqual(await page.evaluate(()=>STG_BOONS.map(b=>({id:b.id,title:b.title,desc:b.desc,icon:b.icon}))),source,'Native boon data must remain unchanged');
  assert.deepEqual(errors,[]);
  if(live)fs.writeFileSync('/tmp/stg-b5-upgrade-geometry.json',JSON.stringify(geometry,null,2));
  console.log('PASS b5 upgrades: 11 symbols, detail layout/scroll, desktop restore, native shop purchase and blessing/HUD icons'+(live?' (live Noto Emoji)':''));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
