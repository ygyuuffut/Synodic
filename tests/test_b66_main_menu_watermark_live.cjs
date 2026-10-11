/* Configured main-menu-only watermark, direct owned DOM and translation identity. */
const {PNG}=require('pngjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);await page.route('https://**/*',r=>r.abort());
 await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b6.6.html')).href);
 const own=page.locator('#MOONSHINE-root'),mark=page.locator('#MOONSHINE-main-menu-watermark'),text=mark.locator('span');
 await own.locator('[data-ms-class~="stg-fs-no"]').waitFor();assert(!await mark.isVisible());await own.locator('[data-ms-class~="stg-fs-no"]').click();
 await own.locator('[data-ms-class~="stg-consent-btn-accept"]').waitFor();assert(!await mark.isVisible());await own.locator('[data-ms-class~="stg-consent-btn-accept"]').click();await mark.waitFor({state:'visible'});
 async function painted(){
  // A visible bounding box alone cannot detect a covered stacking context.
  const box=await text.boundingBox(),size=page.viewportSize(),clip={x:Math.max(0,Math.floor(box.x)),y:Math.max(0,Math.floor(box.y)),width:Math.min(size.width-Math.floor(box.x),Math.ceil(box.width)),height:Math.min(size.height-Math.floor(box.y),Math.ceil(box.height))};
  const shown=PNG.sync.read(await page.screenshot({clip,animations:'disabled'}));
  const old=await text.evaluate(el=>{const old=el.style.visibility;el.style.visibility='hidden';return old;});
  let hidden;try{hidden=PNG.sync.read(await page.screenshot({clip,animations:'disabled'}));}finally{await text.evaluate((el,value)=>{el.style.visibility=value;},old);}
  let changed=0;for(let i=0;i<shown.data.length;i+=4){if(Math.abs(shown.data[i]-hidden.data[i])+Math.abs(shown.data[i+1]-hidden.data[i+1])+Math.abs(shown.data[i+2]-hidden.data[i+2])>15)changed++;}
  assert(changed>200,'Watermark must actually paint above opaque menu background; changed pixels: '+changed);
 }
 // Deterministic opaque artwork stand-in: background assets may be offline.
 await page.addStyleTag({content:'#MOONSHINE-root {background:#102030 !important;}'});await painted();
 const configured=await page.evaluate(()=>LUNAR.api.moonshine.mainMenu.watermark());
 // The author can change watermark text/size in TOML without changing the UI.
 // test_inject.py separately verifies source-to-build configuration parsing.
 assert.equal(await text.textContent(),configured.text);
 assert(configured.font.size>0);
 assert.deepEqual(await text.evaluate(el=>{const s=getComputedStyle(el);return [s.opacity,s.fontWeight,s.fontSize,s.fontFamily];}),[String(configured.opacity),String(configured.font.weight),configured.font.size+'px','"JetBrains Mono", monospace']);
 for(const size of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:748,height:1400}]){
  await page.setViewportSize(size);await page.waitForTimeout(120);
  await painted();const box=await text.boundingBox();assert(box.x>=0&&box.x<12);assert(box.x+box.width<=size.width+1);assert(Math.abs(box.y+box.height-(size.height-4))<2);
  await page.evaluate(()=>stgOpenSlotPicker('load'));const slots=own.locator('[data-ms-id="stg-slot-picker"]');await slots.waitFor();assert(!await mark.isVisible());await slots.getByRole('button',{name:'Close',exact:true}).click();await mark.waitFor({state:'visible'});
  for(const [name,id,close] of [['Compendium','stg-compendium','Back'],['Credits','stg-credits','Close']]){await own.getByRole('button',{name,exact:true}).click();const dialog=own.locator('[data-ms-id="'+id+'"]');await dialog.waitFor();assert(!await mark.isVisible());await dialog.getByRole('button',{name:close,exact:true}).click();await mark.waitFor({state:'visible'});}
 }
 // Exercise the returning-player menu through actual native save ownership.
 await page.evaluate(()=>stgStartNewGame());await own.locator('[data-ms-class~="charsel-confirm"]').click();
 assert(await page.evaluate(()=>stgWriteSaveSlot(0)));await page.evaluate(()=>stgGoTo('Menu'));await own.getByRole('button',{name:'Continue Run',exact:true}).waitFor();await mark.waitFor({state:'visible'});await painted();
 if(process.env.STG_WATERMARK_SCREENSHOT)await page.screenshot({path:process.env.STG_WATERMARK_SCREENSHOT,animations:'disabled'});
 await own.getByRole('button',{name:'Settings',exact:true}).click();await mark.waitFor({state:'hidden'});await own.getByRole('button',{name:'Back',exact:true}).click();await mark.waitFor({state:'visible'});
 await page.locator('.MOONSHINE-mods-launcher').click();await page.locator('.MOONSHINE-mods-panel').waitFor();assert(!await mark.isVisible());await page.locator('.MOONSHINE-mods-close').click();await page.locator('.MOONSHINE-mods-panel').waitFor({state:'detached'});await mark.waitFor({state:'visible'});
 await page.waitForTimeout(200);
 await page.evaluate(()=>{window.watermarkRoot=document.getElementById('MOONSHINE-main-menu-watermark');window.watermarkSpan=watermarkRoot.firstChild;const translated=document.createElement('font');translated.textContent='月相核心';watermarkSpan.replaceChildren(translated);window.watermarkTranslated=translated;window.watermarkNotifications=0;window.watermarkChanges=0;window.watermarkUnsubscribe=LUNAR.api.moonshine.subscribe(()=>watermarkNotifications++);window.watermarkObserver=new MutationObserver(records=>watermarkChanges+=records.length);watermarkObserver.observe(watermarkRoot,{subtree:true,childList:true,characterData:true,attributes:true});});
 await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>watermarkNotifications),0);
 await page.evaluate(()=>MOONSHINE_RUNTIME.refresh({domains:['player.hp']}));await page.evaluate(()=>MOONSHINE_RUNTIME.refresh({domains:['mainMenu']}));
 assert(await page.evaluate(()=>watermarkRoot===document.getElementById('MOONSHINE-main-menu-watermark')&&watermarkSpan===watermarkRoot.firstChild&&watermarkTranslated===watermarkSpan.firstChild&&watermarkTranslated.textContent==='月相核心'));
 assert.equal(await page.evaluate(()=>watermarkChanges),0);
 await page.evaluate(()=>MOONSHINE_RUNTIME.refresh({domains:['compatibility']}));assert(await page.evaluate(()=>watermarkTranslated===document.getElementById('MOONSHINE-main-menu-watermark').firstChild.firstChild));
 await page.evaluate(()=>{watermarkObserver.disconnect();watermarkUnsubscribe();LUNAR.api.moonshine.setMode('desktop');});await mark.waitFor({state:'hidden'});
 await page.evaluate(()=>LUNAR.api.moonshine.setMode('mobile'));await mark.waitFor({state:'visible'});assert.equal(await text.textContent(),'月相核心');
 await own.getByRole('button',{name:'New Run',exact:true}).click();await mark.waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);console.log('PASS b6.6 watermark: TOML font/opacity, actual painted text over opaque menu, new/returning player, bottom-left at four phone sizes, menu-only foreground, translation/node identity, no mutation feedback and desktop/game exclusion');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
