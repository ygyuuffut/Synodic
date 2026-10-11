// Exercise portrait Settings in the current b4 SugarCube export.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:3,hasTouch:true});
  await page.route('https://**/*',r=>r.abort());
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b4.html')).href);
  await page.waitForFunction(()=>typeof stgOpenSettings==='function');
  const fs=page.locator('#stg-fs-prompt .stg-fs-no');if(await fs.count())await fs.click();
  const consent=page.locator('#stg-consent-overlay .stg-consent-btn-accept');
  await consent.waitFor();
  if(await consent.count()){
    await page.locator('#stg-consent-remember').check();
    await consent.click();
    await page.locator('#stg-consent-overlay').waitFor({state:'detached'});
  }
  await page.evaluate(()=>stgGoTo('Menu'));
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  const background=await page.locator('#stg-menu-root > .menu-bg').elementHandle();
  await page.locator('#stg-menu-root button[onclick="stgOpenSettings()"]' ).click();
  const ui=page.locator('.stg-mobile-settings-ui'),panel=ui.locator('.stg-ms-panel');await ui.waitFor();
  assert(await page.evaluate(bg=>bg===document.querySelector('#stg-menu-root > .menu-bg'),background),
    'Settings transition must retain the original menu background');
  assert.equal(await ui.evaluate(el=>getComputedStyle(el).animationName),'stg-panel-in');
  assert.equal(await ui.getByRole('tab').count(),5);
  assert.deepEqual(await ui.getByRole('tab').allTextContents(),['AU','DS','FX','DV','RE']);
  assert.equal(await panel.locator('h2').textContent(),'Audio');
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.waitForTimeout(350);
  await page.screenshot({path:'/tmp/stg-b2-settings-audio.png'});
  await ui.locator('[data-range="music"]').evaluate(e=>{e.value='52';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>STG_VOLUME_MUSIC),0.52);
  assert.equal(await ui.locator('[data-output="music"]').textContent(),'52');
  await ui.locator('[data-segment="master"] [data-choice="off"]').click();assert.equal(await page.evaluate(()=>STG_MUTED),true);
  await ui.locator('[data-segment="master"] [data-choice="on"]').click();assert.equal(await page.evaluate(()=>STG_MUTED),false);
  await ui.getByRole('tab',{name:'Display & UI'}).click();
  assert.equal(await panel.locator('h2').textContent(),'Display & UI');
  await page.waitForTimeout(300);
  await page.screenshot({path:'/tmp/stg-b2-settings-display-top.png'});
  await ui.locator('[data-range="gradient"]').evaluate(e=>{e.value='68';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>stgGetBgiGradient()),68);
  await ui.locator('[data-range="font"]').evaluate(e=>{e.value='110';e.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>_STG_PROSE_SCALE),1.1);
  await ui.locator('[data-segment="width"] [data-choice="wide"]').click();
  assert.equal(await page.evaluate(()=>_STG_TEXT_WIDTH),'wide');
  const beforeZoom=await page.evaluate(()=>_STG_ZOOM);
  await ui.getByRole('button',{name:'Increase UI Scale'}).click();
  assert(await page.evaluate(before=>_STG_ZOOM>=before,beforeZoom));
  assert.equal(await page.evaluate(()=>stgScaleMode()),'manual');
  await ui.locator('[data-ms-action="scale-auto"]').click();assert.equal(await page.evaluate(()=>stgScaleMode()),'auto');
  await page.waitForFunction(()=>{
    var ui=document.querySelector('.stg-mobile-settings-ui');
    if(!ui)return false;
    var gameZoom=parseFloat(document.documentElement.style.zoom||'1')||1;
    var settingsZoom=parseFloat(ui.style.zoom||'1')||1;
    return Math.abs(gameZoom*settingsZoom-1)<.01;
  });
  await panel.evaluate(e=>e.scrollTop=e.scrollHeight);
  assert(await ui.locator('[data-ms-action="fullscreen"]').isVisible());
  await page.screenshot({path:'/tmp/stg-b2-settings-display-bottom.png'});
  await ui.getByRole('tab',{name:'Effects'}).click();
  await ui.locator('[data-segment="shake"] [data-choice="off"]').click();assert.equal(await page.evaluate(()=>stgScreenFxEnabled()),false);
  await page.waitForTimeout(300);
  await page.screenshot({path:'/tmp/stg-b2-settings-effects.png'});
  await ui.getByRole('tab',{name:'Developer'}).click();assert.equal(await panel.locator('[data-ms-action="dev"]').count(),1);
  await page.waitForTimeout(300);
  await page.screenshot({path:'/tmp/stg-b2-settings-developer.png'});
  await ui.getByRole('tab',{name:'Reset'}).click();assert.equal(await panel.locator('.stg-ms-action--danger').count(),4);
  assert.equal(await panel.locator('[data-ms-action="factory"]').textContent(),'Reset All to Default');
  await ui.locator('[data-ms-action="tutorials"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({path:'/tmp/stg-b2-settings-reset.png'});
  await ui.getByRole('button',{name:'Back'}).click();await page.locator('.stg-mobile-settings-ui').waitFor({state:'detached'});
  assert(await page.locator('#stg-menu-root .menu-btn').count()>0);
  assert(await page.evaluate(bg=>bg===document.querySelector('#stg-menu-root > .menu-bg'),background),
    'Returning to the menu must retain the original background');
  assert.equal(await page.locator('#stg-menu-root > .menu-content').evaluate(el=>getComputedStyle(el).animationName),
    'stg-panel-in','Main menu should fade back in');
  await page.evaluate(()=>{STG_DISPLAY_CONFIG.setMode('desktop');stgOpenSettings();});
  await page.waitForFunction(()=>document.body.dataset.stgDisplayMode==='desktop');
  assert.equal(await page.locator('.stg-mobile-settings-ui').count(),0);
  assert(await page.locator('#stg-menu-settings-panel').isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS Settings ('+(process.env.STG_TEST_HTML||'STG 0.2m-b4.html')+'): tabs, sound, sliders, numeric readouts, UI scale, effects, reset, Back, desktop restoration');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
