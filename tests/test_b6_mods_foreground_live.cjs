/* The Mods launcher belongs to the foreground mobile main menu only. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);await page.route('https://**/*',r=>r.abort());
 const own=page.locator('#MOONSHINE-root'),launcher=page.locator('.MOONSHINE-mods-launcher');
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'.STG 0.2m-b6.pending.html')).href);
 await own.locator('[data-ms-class~="stg-fs-no"]').click();await own.locator('[data-ms-class~="stg-consent-btn-accept"]').click();await launcher.waitFor();
 async function blocked(){await launcher.waitFor({state:'hidden'});assert(await launcher.isDisabled());await page.evaluate(()=>MOONSHINE_MODS.open());assert.equal(await page.locator('.MOONSHINE-mods-panel').count(),0);}
 for(const size of [{width:400,height:760},{width:360,height:640},{width:360,height:800}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>stgOpenSlotPicker('load'));const slots=own.locator('[data-ms-id="stg-slot-picker"]');await slots.waitFor();await blocked();await slots.getByRole('button',{name:'Close',exact:true}).click();await slots.waitFor({state:'detached'});await launcher.waitFor();assert(!await launcher.isDisabled());
  await own.getByRole('button',{name:'Compendium',exact:true}).click();const comp=own.locator('[data-ms-id="stg-compendium"]');await comp.waitFor();await blocked();await comp.getByRole('button',{name:'Back',exact:true}).click();await comp.waitFor({state:'detached'});await launcher.waitFor();
  await own.getByRole('button',{name:'Credits',exact:true}).click();const credits=own.locator('[data-ms-id="stg-credits"]');await credits.waitFor();await blocked();await credits.getByRole('button',{name:'Close',exact:true}).click();await credits.waitFor({state:'detached'});await launcher.waitFor();
 }
 await own.getByRole('button',{name:'Settings',exact:true}).click();await launcher.waitFor({state:'hidden'});await page.evaluate(()=>MOONSHINE_MODS.open());assert.equal(await page.locator('.MOONSHINE-mods-panel').count(),0);await own.getByRole('button',{name:'Back',exact:true}).click();await launcher.waitFor();
 await launcher.click();await page.locator('.MOONSHINE-mods-close').click();await page.locator('.MOONSHINE-mods-panel').waitFor({state:'detached'});await launcher.waitFor();assert.equal(await page.evaluate(()=>LUNAR.bridge.pause.active()),false);assert.deepEqual(errors,[]);
 console.log('PASS foreground-only Mods launcher: Load, Compendium, Credits, Settings, restoration, blocked programmatic opening and three portrait sizes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
