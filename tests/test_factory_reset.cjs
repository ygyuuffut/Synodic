// Real b6 export: confirmation, scoped deletion, clean boot and warning reset.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true,deviceScaleFactor:3});
  require('./helpers/moonshine-test-ui.cjs')(page);
  await page.route('https://**/*',route=>route.abort());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.pending.html')).href);
  await page.waitForFunction(()=>typeof stgOpenSettings==='function');
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
  await page.evaluate(()=>{
   localStorage.setItem('stg_dev_warned','true');
   localStorage.setItem('stg_consent_v1','accepted');
   localStorage.setItem('stg_cards_admin_unlock','true');
   localStorage.setItem('stg_cards_seen','["Blast","Dodge","Analyze","ResetDeletionProbe"]');
   localStorage.setItem('stg_save_slot_0','dummy manual save');
   localStorage.setItem('stg_save_auto','dummy autosave');
   localStorage.setItem('stg_scan_tutorial_seen','true');
   localStorage.setItem('stg_audio_volume_music','0.2');
   sessionStorage.setItem('stg_fs_asked','1');
   localStorage.setItem('other_app_probe','keep');
   sessionStorage.setItem('other_app_probe','keep');
   SugarCube.storage.set('factory_probe','delete');
   SugarCube.session.set('factory_probe','delete');
  });
  await page.evaluate(()=>stgOpenSettings());
  const ui=page.locator('.stg-mobile-settings-ui');await ui.waitFor();
  await ui.getByRole('tab',{name:'Reset'}).click();
  assert.equal(await ui.locator('.stg-ms-action--danger').count(),4);
  await ui.getByRole('button',{name:'Reset All to Default'}).click();
  assert.match(await page.locator('#stg-confirm-modal').innerText(),/saved runs.*Compendium.*warnings/i);
  await page.locator('#stg-confirm-cancel').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('stg_save_slot_0')),'dummy manual save');
  assert.equal(await page.evaluate(()=>localStorage.getItem('stg_dev_warned')),'true');
  await ui.getByRole('button',{name:'Reset All to Default'}).click();
  await Promise.all([page.waitForEvent('load'),page.locator('#stg-confirm-ok').click()]);
  await page.waitForFunction(()=>typeof stgOpenDevMenu==='function');
  const state=await page.evaluate(()=>({
   consent:localStorage.getItem('stg_consent_v1'),
   developer:localStorage.getItem('stg_dev_warned'),
   cardsAdmin:localStorage.getItem('stg_cards_admin_unlock'),
   seen:localStorage.getItem('stg_cards_seen'),
   manual:localStorage.getItem('stg_save_slot_0'),
   autosave:localStorage.getItem('stg_save_auto'),
   tutorial:localStorage.getItem('stg_scan_tutorial_seen'),
   music:localStorage.getItem('stg_audio_volume_music'),
   sugarcube:SugarCube.storage.get('factory_probe'),
   sugarcubeSession:SugarCube.session.get('factory_probe'),
   otherLocal:localStorage.getItem('other_app_probe'),
   otherSession:sessionStorage.getItem('other_app_probe'),
   hasSave:stgHasAnySave(),allCards:stgCardsAdminUnlocked()
  }));
  for(const key of ['consent','developer','cardsAdmin','manual','autosave','tutorial','music','sugarcube','sugarcubeSession'])assert.equal(state[key],null,key);
  assert(!state.seen || !JSON.parse(state.seen).includes('ResetDeletionProbe'),'Old discovery entries must be cleared; native getters may seed starter cards after reboot');
  assert.equal(state.otherLocal,'keep');assert.equal(state.otherSession,'keep');
  assert.equal(state.hasSave,false);assert.equal(state.allCards,false);
  assert(await page.locator('#stg-consent-overlay').count()>0,'age confirmation should reappear');
  const fullscreenAgain=page.locator('#stg-fs-prompt .stg-fs-no');
  if(await fullscreenAgain.count())await fullscreenAgain.click();
  await page.locator('#stg-consent-overlay .stg-consent-btn-accept').click();
  await page.locator('#stg-consent-overlay').waitFor({state:'detached'});
  await page.evaluate(()=>stgOpenDevMenu());
  assert(await page.locator('#stg-confirm-modal').count()>0,'developer warning should reappear');
  assert.equal(await page.locator('#stg-dev-menu').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS b6 factory reset: cancel, all game data, foreign data preserved, age and developer warnings restored');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
