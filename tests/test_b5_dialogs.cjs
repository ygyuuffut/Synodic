// Real-game browser checks for the b5 mobile fullscreen, confirm, and age dialogs.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},deviceScaleFactor:3,hasTouch:true});
  await page.route('https://**/*',route=>route.abort());
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b5.html')).href);
  await page.waitForFunction(()=>window.STG_MOBILE_DIALOGS&&document.body.classList.contains('stg-mobile-portrait'));
  const fs=page.locator('#stg-fs-prompt.stg-mobile-fs-dialog');
  await fs.waitFor();
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.waitForTimeout(250);
  assert.equal(await fs.locator('.stg-fs-title').textContent(),'Enter Full Screen?');
  assert.equal(await fs.locator('.stg-fs-yes').textContent(),'Yes, Fullscreen');
  assert.equal(await fs.locator('.stg-fs-no').textContent(),'No, Thanks');
  const fsLayout=await fs.evaluate(e=>{
   const o=e.getBoundingClientRect(),c=e.querySelector('.stg-fs-card').getBoundingClientRect();
   return {overlayWidth:o.width,overlayHeight:o.height,offset:(c.top+c.bottom-o.top-o.bottom)/2,
    cardWidth:c.width,cardHeight:c.height};
  });
  assert(Math.abs(fsLayout.overlayWidth-400)<=1&&Math.abs(fsLayout.overlayHeight-760)<=1,JSON.stringify(fsLayout));
  assert(Math.abs(fsLayout.offset)<=2&&fsLayout.cardWidth>300&&fsLayout.cardHeight>200,JSON.stringify(fsLayout));
  await page.screenshot({path:'/tmp/stg-b5-fullscreen.png'});
  await fs.locator('.stg-fs-no').click();
  await fs.waitFor({state:'detached'});

  const age=page.locator('#stg-consent-overlay.stg-mobile-age-dialog');
  await age.waitFor();
  assert.equal(await age.locator('.stg-consent-heading').textContent(),'18+ Age Consent');
  assert.equal(await age.locator('.stg-mobile-age-copy .stg-consent-section').count(),5);
  const ageLayout=await age.evaluate(e=>{
   const o=e.getBoundingClientRect(),m=e.querySelector('.stg-consent-modal').getBoundingClientRect();
   const copy=e.querySelector('.stg-mobile-age-copy');
   return {overlayWidth:o.width,overlayHeight:o.height,panelHeight:m.height,
    copyClient:copy.clientHeight,copyScroll:copy.scrollHeight};
  });
  assert(Math.abs(ageLayout.overlayWidth-400)<=1&&Math.abs(ageLayout.overlayHeight-760)<=1,JSON.stringify(ageLayout));
  assert(ageLayout.panelHeight>700&&ageLayout.copyScroll>ageLayout.copyClient,JSON.stringify(ageLayout));
  const remember=age.locator('#stg-consent-remember');
  assert.equal(await remember.isChecked(),false);
  assert.equal(await age.locator('.stg-consent-remember span').textContent(),'Remember My Choice');
  await page.screenshot({path:'/tmp/stg-b5-age-unchecked.png'});
  await remember.check();
  assert(await remember.isChecked());
  await page.screenshot({path:'/tmp/stg-b5-age-checked.png'});
  for(const viewport of [{width:400,height:760},{width:360,height:640},{width:360,height:800}]){
   await page.setViewportSize(viewport);
   await page.waitForTimeout(250);
   const alignment=await age.locator('.stg-consent-actions .stg-consent-btn').evaluateAll(buttons=>buttons.map(button=>{
    const outer=button.getBoundingClientRect(),label=button.querySelector('.stg-consent-btn-label').getBoundingClientRect();
    return {dx:(label.left+label.right-outer.left-outer.right)/2,
     dy:(label.top+label.bottom-outer.top-outer.bottom)/2,
     right:outer.right,viewportWidth:window.innerWidth,bottom:outer.bottom,viewportHeight:window.innerHeight};
   }));
   assert.equal(alignment.length,2);
   for(const item of alignment){
    assert(Math.abs(item.dx)<=2&&Math.abs(item.dy)<=2,JSON.stringify({viewport,item}));
    assert(item.right<=item.viewportWidth&&item.bottom<=item.viewportHeight,JSON.stringify({viewport,item}));
   }
  }
  await page.setViewportSize({width:400,height:760});
  const warningHTML=await age.locator('.stg-consent-section').evaluateAll(nodes=>nodes.map(node=>node.innerHTML));
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>!document.querySelector('.stg-mobile-age-dialog'));
  assert.equal(await page.locator('.stg-mobile-age-copy').count(),0);
  assert.deepEqual(await page.locator('#stg-consent-overlay .stg-consent-section').evaluateAll(nodes=>nodes.map(node=>node.innerHTML)),warningHTML);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  await age.waitFor();
  assert(await remember.isChecked(),'Remember choice must survive display-mode changes');
  await age.getByRole('button',{name:'Consent'}).click();
  await age.waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('stg_consent_v1')),'accepted');

  await page.evaluate(()=>{
   window._b5DialogAnswer='';
   stgShowConfirmModal({title:'This is a Sample Warning',body:'You will see the warning message here',
    okLabel:'Consent',cancelLabel:'Decline',onConfirm:()=>_b5DialogAnswer='yes',onCancel:()=>_b5DialogAnswer='no'});
  });
  const confirm=page.locator('#stg-confirm-modal.stg-mobile-confirm-dialog');
  await confirm.waitFor();
  await page.waitForTimeout(250);
  const shortLayout=await confirm.evaluate(e=>{
   const card=e.querySelector('.stg-mobile-confirm-card').getBoundingClientRect();
   const title=e.querySelector('.stg-mobile-confirm-title').getBoundingClientRect();
   const body=e.querySelector('.stg-mobile-confirm-body').getBoundingClientRect();
   const actions=e.querySelector('.stg-mobile-confirm-actions').getBoundingClientRect();
   return {center:(card.top+card.bottom)/2,viewport:window.innerHeight/2,
    bodyCenter:(body.top+body.bottom)/2,slotCenter:(title.bottom+actions.top)/2};
  });
  assert(Math.abs(shortLayout.center-shortLayout.viewport)<=2,JSON.stringify(shortLayout));
  assert(Math.abs(shortLayout.bodyCenter-shortLayout.slotCenter)<=3,JSON.stringify(shortLayout));
  await page.screenshot({path:'/tmp/stg-b5-confirm-short.png'});
  await confirm.getByRole('button',{name:'Decline'}).click();
  assert.equal(await page.evaluate(()=>_b5DialogAnswer),'no');

  await page.evaluate(()=>stgShowConfirmModal({title:'A Much Longer Warning Title That Needs To Fit',
   body:'<strong>Warning</strong><br>'+Array(30).fill('This warning explains the consequences in detail.').join(' '),
   onConfirm:()=>_b5DialogAnswer='long'}));
  await confirm.waitFor();
  assert.equal(await confirm.locator('.stg-mobile-confirm-long-title').count(),1);
  const overflow=await confirm.locator('.stg-mobile-confirm-body').evaluate(e=>e.scrollHeight-e.clientHeight);
  assert(overflow>0,'Long warning body must scroll inside the card');
  assert.equal(await confirm.locator('.stg-mobile-confirm-overflow').count(),1);
  assert.equal(await confirm.locator('.stg-mobile-confirm-copy strong').textContent(),'Warning');
  await confirm.locator('.stg-mobile-confirm-body').evaluate(e=>e.scrollTop=e.scrollHeight);
  await confirm.getByRole('button',{name:'OK'}).click();
  assert.equal(await page.evaluate(()=>_b5DialogAnswer),'long');
  assert.deepEqual(errors,[]);
  console.log('PASS b5 mobile dialogs: fullscreen, short/long confirms, age copy/remember/actions');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
