// Native Credits/Dev Features: preservation, responsive shell, text fit and actions.
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:760},deviceScaleFactor:3,hasTouch:true});
  require('./helpers/moonshine-test-ui.cjs')(page);
  await page.route('https://**/*',route=>route.abort());
  await page.addInitScript(()=>localStorage.setItem('stg_consent_v1','accepted'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(process.env.STG_TEST_HTML||'STG 0.2m-b5.html')).href);
  await page.locator('#stg-fs-prompt .stg-fs-no').click();
  await page.locator('#stg-transition-veil').waitFor({state:'detached'});
  await page.evaluate(()=>{STG_DISPLAY_CONFIG.setMode('desktop');});
  await page.waitForFunction(()=>!document.getElementById('MOONSHINE-root'));
  const nativeCredits=await page.evaluate(()=>{
   stgOpenCredits();
   const body=document.querySelector('#stg-credits').firstElementChild.children[1];
   window._creditNodes=Array.from(body.querySelectorAll('*'));
   return {html:body.innerHTML,text:body.textContent};
  });
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  const credits=page.locator('#stg-credits.stg-mobile-tall-panel');
  await credits.waitFor();
  assert.equal(await credits.locator('.stg-mobile-tall-body').textContent(),nativeCredits.text);
  assert(await page.evaluate(()=>_creditNodes.every(node=>document.getElementById('stg-credits').contains(node))));
  assert.equal(await credits.locator('.stg-mobile-credit-default').first().evaluate(e=>getComputedStyle(e).color),'rgb(164, 140, 212)');
  assert.equal(await credits.getByText('The Masterminds',{exact:true}).evaluate(e=>getComputedStyle(e).color),'rgb(255, 207, 106)');
  assert.equal(await credits.locator('.stg-mobile-tall-body > div').last().evaluate(e=>getComputedStyle(e).fontStyle),'italic');
  await page.screenshot({path:'/tmp/stg-b5-credits.png'});
  const checkShell=async locator=>{
   for(const viewport of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:360,height:780}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(160);
    const layout=await locator.evaluate(e=>{
     const card=e.querySelector('.stg-mobile-tall-card').getBoundingClientRect();
     const close=e.querySelector('.stg-mobile-tall-close').getBoundingClientRect();
     const body=e.querySelector('.stg-mobile-tall-body');
     const before=close.y;body.scrollTop=body.scrollHeight;
     return {top:card.top,bottom:card.bottom,right:card.right,vw:innerWidth,vh:innerHeight,
      before,after:e.querySelector('.stg-mobile-tall-close').getBoundingClientRect().y,
      scroll:body.scrollHeight-body.clientHeight,closeBottom:close.bottom};
    });
    assert(layout.top>=0&&layout.bottom<=layout.vh+1&&layout.right<=layout.vw+1,JSON.stringify(layout));
    assert.equal(layout.before,layout.after);assert(layout.scroll>0);assert(layout.closeBottom<=layout.vh);
   }
  };
  await checkShell(credits);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>!document.getElementById('MOONSHINE-root'));
  assert.equal(await page.locator('#stg-credits > div > div').nth(1).textContent(),nativeCredits.text);
  assert.equal(await page.locator('#stg-credits button').textContent(),'✕');
  await page.locator('#stg-credits button').click();
  await page.evaluate(()=>{
   stgShowDevMenu();
   window._devButtons=Array.from(document.querySelectorAll('#stg-dev-menu .menu-btn'));
   window._devText=_devButtons.map(b=>b.textContent);
   window._devActions=_devButtons.map(b=>b.getAttribute('onclick'));
  });
  const count=await page.evaluate(()=>_devButtons.length);
  await page.setViewportSize({width:400,height:760});
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('mobile'));
  const dev=page.locator('#stg-dev-menu.stg-mobile-tall-panel');await dev.waitFor();
  assert.equal(await dev.locator('.stg-mobile-dev-button').count(),count);
  assert(await page.evaluate(()=>_devButtons.every((b,i)=>b.isConnected&&b.getAttribute('onclick')===_devActions[i])));
  assert(!/U0001F41E|🐞/.test(await dev.textContent()));
  const accents=await dev.locator('.stg-mobile-dev-section').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).color));
  assert.deepEqual(accents.slice(0,4),['rgb(244, 217, 117)','rgb(98, 128, 99)','rgb(80, 138, 181)','rgb(213, 94, 185)']);
  assert(accents.slice(4).every(c=>c==='rgb(164, 140, 212)'));
  await page.screenshot({path:'/tmp/stg-b5-dev-features.png'});
  for(const viewport of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:360,height:780}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(160);
   const labels=await dev.locator('.stg-mobile-dev-button').evaluateAll(nodes=>nodes.map(b=>{
    const label=b.querySelector('span'),s=getComputedStyle(label),r=b.getBoundingClientRect(),l=label.getBoundingClientRect();
    return {text:label.textContent,lines:label.scrollHeight/parseFloat(s.lineHeight),
     dx:(l.left+l.right-r.left-r.right)/2,dy:(l.top+l.bottom-r.top-r.bottom)/2,
     overflow:label.scrollWidth-label.clientWidth,align:getComputedStyle(b).textAlign};
   }));
   for(const l of labels)assert(l.lines<=2.1&&Math.abs(l.dx)<=1&&Math.abs(l.dy)<=1&&l.overflow<=1&&l.align==='center',JSON.stringify(l));
  }
  await checkShell(dev);
  await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
  await page.waitForFunction(()=>!document.getElementById('MOONSHINE-root'));
  assert(await page.evaluate(()=>_devButtons.every((b,i)=>b.textContent===_devText[i]&&b.getAttribute('onclick')===_devActions[i])));
  await page.evaluate(()=>{stgCloseDevMenu();STG_DISPLAY_CONFIG.setMode('mobile');});
  await page.waitForFunction(()=>document.getElementById('MOONSHINE-root')?.classList.contains('MOONSHINE-mode-stg-mobile-portrait'));
  await page.evaluate(()=>{localStorage.removeItem('stg_dev_warned');stgOpenDevMenu();});
  await page.locator('#stg-confirm-ok').click();
  await dev.waitFor();
  await page.evaluate(()=>{window._devCalled=false;window.stgDevStomachFateLogic=()=>_devCalled=true;});
  await dev.locator('.stg-mobile-dev-button').first().click();
  assert(await page.evaluate(()=>_devCalled));await dev.waitFor({state:'detached'});
  await page.evaluate(()=>stgOpenCredits());await credits.waitFor();
  await credits.getByRole('button',{name:'Close',exact:true}).click();await credits.waitFor({state:'detached'});
  assert.deepEqual(errors,[]);
  console.log(`PASS b5 tall panels: Credits formatting, ${count} native dev actions, four sizes, two-line centered labels, scroll/Close, warning and desktop restore`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
