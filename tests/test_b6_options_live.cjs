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
    await page.route('https://**/*', route => route.abort());
    await page.goto(pathToFileURL(require('./helpers/synodic-test-paths.cjs').game(gameFile)).href);
    await page.waitForFunction(() => typeof stgStartNewGame === 'function');
    await page.locator('#stg-fs-prompt .stg-fs-no').click();
    await page.locator('#stg-consent-overlay .stg-consent-btn-accept').click();
    await page.locator('#stg-consent-overlay').waitFor({ state: 'detached' });
    await page.evaluate(() => stgStartNewGame());
    await page.locator('.charsel-confirm').click();
    await page.locator('.blessing-header-inner.stg-mobile-top-hud').waitFor();
    await page.locator('#stg-banner-menu-btn').click();
    const root = page.locator('#stg-mobile-ingame-options');
    await root.waitFor();
    assert.equal(await page.locator('#stg-banner-fly').count(), 0);
    assert.equal(await root.locator('h2').textContent(), 'Audios');
    assert.equal(await root.locator('[data-ig="save"]').isDisabled(), false);
    await root.locator('[data-segment="master"] [data-choice="off"]').click();
    assert.equal(await page.evaluate(() => STG_MUTED), true);
    await root.locator('[data-range="music"]').evaluate(el => { el.value = 45; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await page.evaluate(() => STG_VOLUME_MUSIC), .45);
    await page.screenshot({path:'/tmp/stg-b6-options-audio.png'});
    await root.locator('[data-ig="next"]').click();
    assert.equal(await root.locator('h2').textContent(), 'Visuals');
    assert.equal(await root.locator('[data-segment="banner"], [data-segment="ui-tips"], [data-segment="card-tips"]').count(), 0);
    await root.locator('[data-range="gradient"]').evaluate(el => { el.value = 75; el.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await page.evaluate(() => stgGetBgiGradient()), 75);
    await root.locator('[data-segment="shake"] [data-choice="off"]').click();
    assert.equal(await page.evaluate(() => stgScreenFxEnabled()), false);
    await root.locator('[data-ms-action="scale-up"]').click();
    assert.equal(await root.locator('h2').textContent(), 'Visuals');
    for (const viewport of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:360,height:780}]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(120);
      const box = await root.locator('[data-ig="close"]').boundingBox();
      assert(box.y + box.height <= viewport.height);
    }
    await page.setViewportSize({width:400,height:760}); await page.waitForTimeout(120);
    await page.screenshot({path:'/tmp/stg-b6-options-visuals.png'});
    await root.locator('[data-ig="next"]').click();
    assert.equal(await root.locator('h2').textContent(), 'Audios');
    await root.locator('[data-ig="prev"]').click();
    assert.equal(await root.locator('h2').textContent(), 'Visuals');
    await root.locator('[data-ig="save"]').click();
    await page.locator('#stg-slot-picker').waitFor();
    await page.evaluate(() => stgCloseSlotPicker());
    await page.evaluate(() => stgGoTo('Lab'));
    await page.locator('#stg-lab-root #stg-banner-menu-btn').click();
    await root.waitFor();
    assert.equal(await root.locator('[data-ig="save"]').isDisabled(), true);
    await root.locator('[data-ig="menu"]').click();
    await page.locator('#stg-confirm-modal').waitFor();
    assert.equal(await root.count(), 1);
    await page.locator('#stg-confirm-modal button').filter({hasText:'Cancel'}).click();
    await root.waitFor({state:'visible'});
    await page.evaluate(() => STG_DISPLAY_CONFIG.setMode('desktop'));
    await page.waitForFunction(() => !document.querySelector('#MOONSHINE-root'));
    assert.equal(await root.count(), 0);
    await page.evaluate(() => stgToggleBannerFlyout());
    assert.equal(await page.locator('#stg-banner-fly').count(), 1);
    assert.deepEqual(errors, []);
    console.log('PASS b6 in-game options pages, native setters, save gating, confirmations, viewports, desktop');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
