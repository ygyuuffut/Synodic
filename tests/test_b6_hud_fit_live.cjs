const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

const gameFile = process.env.STG_TEST_HTML || 'STG 0.2m-b6.6.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 760 }, hasTouch: true });
    require('./helpers/moonshine-test-ui.cjs')(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**/*', route => route.abort());
    if(process.env.STG_TEST_REMOTE_EMOJI) {
      await page.addInitScript(()=>{
        const Native=window.FontFace;
        window.FontFace=function(family,source,options){return new Native(family,family==='Noto Emoji' && source.includes('local(')?'local("STG deliberately missing font")':source,options);};
        window.FontFace.prototype=Native.prototype;
      });
      await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:'@font-face {font-family:"Noto Emoji";font-weight:400;src:url(https://fonts.gstatic.com/stg-test-emoji.ttf)}'}));
      await page.route('https://fonts.gstatic.com/stg-test-emoji.ttf',route=>route.fulfill({contentType:'font/ttf',path:'/Library/Fonts/NotoEmoji-VariableFont_wght.ttf',headers:{'access-control-allow-origin':'*'}}));
    }
    await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(gameFile)).href);
    await page.waitForFunction(() => typeof stgStartNewGame === 'function');
    await page.locator('#stg-fs-prompt .stg-fs-no').click();
    await page.locator('#stg-consent-overlay .stg-consent-btn-accept').click();
    await page.locator('#stg-consent-overlay').waitFor({ state: 'detached' });
    await page.evaluate(() => stgStartNewGame());
    await page.locator('.charsel-confirm').click();
    await page.locator('.blessing-header-inner.stg-mobile-top-hud').waitFor();


    await page.evaluate(()=>MOONSHINE_WORKSPACE.window.STG_MOBILE_UI.loadNotoEmoji());
    for(const viewport of [{width:320,height:640},{width:360,height:780},{width:400,height:760}]) {
      await page.setViewportSize(viewport);await page.waitForTimeout(200);
      await page.evaluate(()=>stgArcTypewriter('Long text '.repeat(100)));
      await page.waitForTimeout(80);
      const status=await page.locator('.stg-story-status').evaluate(cell=>{
        const el=cell.firstElementChild,s=getComputedStyle(el),r=el.getBoundingClientRect(),c=cell.getBoundingClientRect();
        const ctx=document.createElement('canvas').getContext('2d');ctx.font=s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
        const m=ctx.measureText(el.textContent),z=r.height/parseFloat(s.lineHeight);
        const baseline=(parseFloat(s.lineHeight)-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent;
        const top=r.top+(baseline-m.actualBoundingBoxAscent)*z,bottom=r.top+(baseline+m.actualBoundingBoxDescent)*z;
        return {top,bottom,ct:c.top,cb:c.bottom,center:Math.abs((top+bottom-c.top-c.bottom)/2)};
      });
      assert.ok(status.top>status.ct+1 && status.bottom<status.cb-1 && status.center<1,JSON.stringify(status));
      await page.evaluate(()=>stgArcSkipTw());
      for(const value of [99,100,999,10000]) {
        await page.evaluate(value=>{_STG.player.hp=value;_STG.player.maxHp=value;_STG.player.data=value;stgUpdateBlockBars();LUNAR.bridge.port.emit(['player.hp','hud']);},value);
        await page.waitForTimeout(220);
        const metrics=await page.evaluate(()=>{
          const ctx=document.createElement('canvas').getContext('2d');
          return Array.from(document.querySelectorAll('#MOONSHINE-root [data-ms-class~="stg-mobile-top-hud-glyph"]')).map(cell=>{
            const el=cell.firstElementChild,style=getComputedStyle(el),r=el.getBoundingClientRect(),c=cell.getBoundingClientRect();
            const z=r.height/parseFloat(style.lineHeight);
            ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
            const m=ctx.measureText(el.textContent);
            const baseline=(parseFloat(style.lineHeight)-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent;
            return {top:r.top+(baseline-m.actualBoundingBoxAscent)*z,bottom:r.top+(baseline+m.actualBoundingBoxDescent)*z,cellTop:c.top,cellBottom:c.bottom};
          });
        });
        assert.ok(metrics.every(m=>m.top>=m.cellTop+1 && m.bottom<=m.cellBottom-1),JSON.stringify(metrics));
        for(const key of ['hp','data']) {
          const m=await page.locator('[data-stg-hud-value="'+key+'"]').evaluate(el=>{
            const r=document.createRange();r.selectNodeContents(el);
            return {width:r.getBoundingClientRect().width,cell:el.getBoundingClientRect().width,size:parseFloat(getComputedStyle(el).fontSize)};
          });
          if(value>99) assert.ok(m.width<m.cell*.82,JSON.stringify(m));
        }
      }
    }
    await page.locator('.stg-mobile-top-hud-info').click();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#MOONSHINE-root [data-ms-class~="stg-mobile-tiny-fetish-icon"]')).visibility==='visible');
    assert.equal(await page.locator('.stg-mobile-tiny-fetish-icon').first().textContent(),'🍑\uFE0E');
    const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
    const {root}=await cdp.send('DOM.getDocument');
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#MOONSHINE-root [data-ms-class~="stg-mobile-tiny-fetish-icon"]'});
    const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
    assert.ok(fonts.some(f=>['SYNODIC Emoji','Noto Emoji'].includes(f.familyName) && f.glyphCount>0),JSON.stringify(fonts));
    await page.screenshot({path:'/tmp/b6-mobile-font-fit.png'});
    assert.deepEqual(errors,[]);console.log('PASS HUD/ hourglass ink bounds, numeric spacing and actual Noto Emoji peach at 320/360/400 widths; '+(process.env.STG_TEST_REMOTE_EMOJI?'remote-font fixture':'local font'));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
