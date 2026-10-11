const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

const gameFile = process.env.STG_TEST_HTML || '.STG 0.2m-b6.pending.html';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true
  });
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 760 }, hasTouch: true });
    require('./helpers/moonshine-test-ui.cjs')(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://**/*', route => process.env.STG_TEST_CRITICAL_FIXTURE&&/^(image|fetch)$/.test(route.request().resourceType())&&route.request().url().includes('/media/')?route.fulfill({contentType:'image/svg+xml',headers:{'Access-Control-Allow-Origin':'*'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="760"><rect width="400" height="760" fill="#302035"/></svg>'}):route.abort());
    await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(gameFile)).href);
    await page.waitForFunction(() => typeof stgStartNewGame === 'function');
    await page.locator('#stg-fs-prompt .stg-fs-no').click();
    await page.locator('#stg-consent-overlay .stg-consent-btn-accept').click();
    await page.locator('#stg-consent-overlay').waitFor({ state: 'detached' });
    await page.evaluate(() => stgStartNewGame());
    await page.locator('.charsel-confirm').click();
    await page.locator('.blessing-header-inner.stg-mobile-top-hud').waitFor();
    if(process.env.STG_TEST_CRITICAL_FIXTURE)await page.waitForFunction(()=>!LUNAR.assets.locked());

    await page.evaluate(() => {
      window.probe = {ticks:0, once:0, frame:0, media:0};
      window.probeInterval = setInterval(() => probe.ticks++, 40);
      // Detached audio events can advance narration: hold their callbacks as well.
      window.probeAudio = new Audio();
      probeAudio.addEventListener('ended', () => probe.media++);
    });
    await page.evaluate(async () => {
      const bytes = new Uint8Array(44+16000), view = new DataView(bytes.buffer);
      const str = (offset,text) => [...text].forEach((c,i) => bytes[offset+i]=c.charCodeAt(0));
      str(0,'RIFF');view.setUint32(4,bytes.length-8,true);str(8,'WAVE');str(12,'fmt ');
      view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
      view.setUint32(24,8000,true);view.setUint32(28,8000,true);view.setUint16(32,1,true);view.setUint16(34,8,true);
      str(36,'data');view.setUint32(40,16000,true);bytes.fill(128,44);
      window.probeBgm = new Audio(URL.createObjectURL(new Blob([bytes],{type:'audio/wav'})));
      probeBgm.loop=true; probeBgm.volume=0; await probeBgm.play();
      window.probeSfx = new Audio(probeBgm.src); probeSfx.volume=0; await probeSfx.play();
    });
    await page.evaluate(async()=>{window.probeOnce=setTimeout(()=>probe.once++,1100);document.querySelector('#MOONSHINE-root [data-ms-id="stg-banner-menu-btn"]').click();await MOONSHINE_RUNTIME.flush();});
    const root = page.locator('#stg-mobile-ingame-options');
    const audioBefore = await page.evaluate(() => ({bgm:probeBgm.currentTime,sfx:probeSfx.currentTime}));
    const snapshot = await page.evaluate(() => ({...probe, elapsed:stgRunElapsedMs()}));
    await page.evaluate(() => {
      requestAnimationFrame(() => probe.frame++);
      probeAudio.dispatchEvent(new Event('ended'));
      window.cancelledProbe = setTimeout(() => probe.once+=100,20);
      clearTimeout(cancelledProbe);
      // A fade interval already owned by background music continues during pause.
      LUNAR.bridge.pause.ui(() => { window._stgMapBgmFadeIv = setInterval(() => { window.musicTicks=(window.musicTicks||0)+1; },30); });
    });
    await page.waitForTimeout(1200);
    assert.deepEqual(await page.evaluate(() => ({...probe})), {ticks:snapshot.ticks,once:0,frame:0,media:0});
    assert.ok(Math.abs(await page.evaluate(() => stgRunElapsedMs())-snapshot.elapsed)<50);
    assert.ok(await page.evaluate(() => musicTicks>10));
    const audioAfter = await page.evaluate(() => ({bgm:probeBgm.currentTime,sfx:probeSfx.currentTime}));
    const bgmDuration=await page.evaluate(async()=>probeBgm.duration);
    assert.equal(await page.evaluate(async()=>probeBgm.paused),false);
    assert.ok((audioAfter.bgm-audioBefore.bgm+bgmDuration)%bgmDuration>.7,'BGM playback continues across loop boundaries');
    assert.ok(Math.abs(audioAfter.sfx-audioBefore.sfx)<.08,'narration/audio playback pauses');
    await root.locator('[data-ig="next"]').click();
    for (const action of ['menu','quit']) {
      await root.locator(`[data-ig="${action}"]`).click();
      await page.locator('#stg-confirm-modal').waitFor();
      // Sample the first painted frames, not just the settled dialog.
      const frames = await page.evaluate(() => new Promise(resolve => {
        const samples=[];
        function sample() {
          const sheet=document.querySelector('#MOONSHINE-root [data-ms-id="stg-mobile-ingame-options"]');
          const dialog=document.querySelector('#MOONSHINE-root [data-ms-id="stg-confirm-modal"]');
          const panel=getComputedStyle(sheet), scrim=getComputedStyle(dialog);
          samples.push({visible:panel.visibility,opacity:scrim.opacity,animation:scrim.animationName,
            above:Number(scrim.zIndex)>Number(panel.zIndex),inert:sheet.inert});
          if(samples.length===12) resolve(samples); else LUNAR.bridge.pause.ui(()=>requestAnimationFrame(sample));
        }
        sample();
      }));
      assert.ok(frames.every(frame => frame.visible==='visible' && frame.opacity==='1' && frame.animation==='none' && frame.above && frame.inert));

      await page.keyboard.press('Escape');
      await root.waitFor({state:'visible'});
      assert.equal(await root.locator('h2').textContent(),'Visuals');
      assert.equal(await page.evaluate(() => LUNAR.bridge.pause.active()),true);
    }
    await root.locator('[data-ig="save"]').click();
    assert.equal(await page.evaluate(() => LUNAR.bridge.pause.active()),true);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !LUNAR.bridge.pause.active());
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => probe.once),0,'remaining timeout is preserved');
    assert.equal(await page.evaluate(() => probe.media),1);
    assert.equal(await page.evaluate(() => probe.frame),1);
    await page.waitForTimeout(1100);
    assert.equal(await page.evaluate(() => probe.once),1);
    assert.ok(await page.evaluate(() => probe.ticks)>snapshot.ticks);
    await page.locator('.blessing-header-inner .stg-mobile-top-hud-info').click();
    const before = await page.evaluate(() => probe.ticks);
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => probe.ticks),before);
    await page.locator('.stg-mobile-tiny-close').click();
    await page.waitForTimeout(100);
    assert.ok(await page.evaluate(() => probe.ticks)>before);
    await page.evaluate(() => {clearInterval(probeInterval);clearInterval(_stgMapBgmFadeIv);});
    assert.deepEqual(errors,[]);
    console.log('PASS pause/resume remaining timers, intervals, frames, narration events, BGM scheduling, elapsed time, both confirmation cancellations, nested saves and Tiny Information');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
