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
    const initial = await page.evaluate(() => JSON.stringify(_STG.masterDeck));
    const size = await page.evaluate(() => _STG.masterDeck.length);
    await page.locator('.stg-mobile-top-hud-info').click();
    assert.equal(Number(await page.locator('.stg-mobile-tiny-deck-count').textContent()), size);
    if (process.env.STG_CAPTURE_DECK) await page.screenshot({ path: '/tmp/stg-b6-tiny-deck.png' });
    await page.locator('.stg-mobile-tiny-deck').click();
    assert.equal(Number(await page.locator('.stg-mobile-deck-total').textContent()), size);
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), size);
    assert.equal(await page.locator('.stg-mobile-deck-browser [data-mc-action="unlock"]').count(), 0);
    for (const viewport of [
      { width: 400, height: 760 }, { width: 360, height: 640 },
      { width: 360, height: 800 }, { width: 360, height: 780 }
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(120);
      const layout = await page.locator('.stg-mobile-deck-browser').evaluate(node => {
        const browser = node.getBoundingClientRect();
        const scroll = node.querySelector('.stg-mc-scroll');
        const close = node.querySelector('.stg-mobile-deck-close').getBoundingClientRect();
        return { browser: browser.toJSON(), close: close.toJSON(),
          canScroll: scroll.scrollHeight > scroll.clientHeight };
      });
      assert(layout.browser.left >= 0 && layout.browser.right <= viewport.width &&
        layout.browser.top >= 0 && layout.browser.bottom <= viewport.height &&
        layout.close.bottom <= viewport.height && layout.canScroll, JSON.stringify({ viewport, layout }));
    }
    await page.setViewportSize({ width: 400, height: 760 });
    await page.waitForTimeout(120);
    if (process.env.STG_CAPTURE_DECK) await page.screenshot({ path: '/tmp/stg-b6-deck.png' });
    await page.locator('[data-deck-action="categories"]').click();
    if (process.env.STG_CAPTURE_DECK) await page.screenshot({ path: '/tmp/stg-b6-deck-categories.png' });
    await page.locator('.stg-mobile-deck-modal [data-deck-none]').click();
    await page.locator('.stg-mobile-deck-modal [data-deck-done]').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), 0);
    await page.locator('[data-deck-action="reset"]').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), size);
    await page.locator('[data-deck-action="filters"]').click();
    await page.locator('.stg-mobile-deck-modal [data-deck-sort="desc"]').click();
    if (process.env.STG_CAPTURE_DECK) {
      await page.waitForTimeout(350);
      await page.screenshot({ path: '/tmp/stg-b6-deck-filters.png' });
    }
    await page.locator('.stg-mobile-deck-modal [data-deck-done]').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), size);
    const sortedCosts = await page.evaluate(() => MOONSHINE_WORKSPACE.window._stgCompCatalog.map(card => card.cost));
    assert.deepEqual(sortedCosts, [...sortedCosts].sort((a, b) => b - a));
    await page.locator('[data-deck-action="reset"]').click();
    assert.equal(await page.evaluate(() => JSON.stringify(MOONSHINE_WORKSPACE.window._stgCompCatalog)), initial);
    await page.locator('[data-deck-action="filters"]').click();
    await page.locator('.stg-mobile-deck-modal [data-deck-none]').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), size,
      'Escape cancels filter drafts and keeps the deck open');
    await page.locator('.stg-mobile-deck-browser .stg-mc-card').first().click();
    await page.locator('.stg-card-popup-scrim.stg-md-scrim').waitFor();
    assert(await page.locator('.stg-card-popup-scrim').evaluate(node =>
      Number(node.style.zIndex) > 100010), 'card preview must appear above the deck browser');
    await page.waitForTimeout(process.env.STG_CAPTURE_DECK ? 700 : 300);
    if (process.env.STG_CAPTURE_DECK) await page.screenshot({ path: '/tmp/stg-b6-deck-detail.png' });
    await page.locator('.stg-card-popup-scrim').click({ position: { x: 5, y: 5 } });
    await page.locator('.stg-card-popup-scrim').waitFor({ state: 'detached' });
    assert.equal(await page.locator('.stg-mobile-deck-browser').count(), 1);
    await page.locator('.stg-mobile-deck-close').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser').count(), 0);
    assert.equal(await page.locator('.stg-mobile-tiny-panel').count(), 1);
    await page.locator('.stg-mobile-tiny-close').click();
    await page.locator('.blessing-header-inner #stg-banner-menu-btn').click();
    assert.equal(await page.locator('#stg-banner-fly .stg-banner-fly-row').filter({ hasText: /^Deck$/ }).count(), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(_STG.masterDeck)), initial);
    await page.locator('#stg-mobile-ingame-options [data-ig="close"]').click();
    await page.evaluate(() => {
      window.deckBeforeEmptyTest = _STG.masterDeck;
      const base = _STG.masterDeck[0];
      _STG.masterDeck = [
        ['Attack fixture', 'attack', 'Chaos', -1], ['Skill fixture', 'skill', 'Grace', 2],
        ['Power fixture', 'power', 'Logic', 0], ['Item fixture', 'tool', 'Food', 4],
        ['Condition fixture', 'curse', 'Condition', null]
      ].map(([name, type, subtype, cost]) => ({ ...base, name, type, subtype, cost }));
    });
    await page.locator('.stg-mobile-top-hud-info').click();
    await page.locator('.stg-mobile-tiny-deck').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), 5);
    await page.locator('[data-deck-action="filters"]').click();
    await page.locator('[data-deck-sort="desc"]').click();
    await page.locator('[data-deck-done]').click();
    assert.deepEqual(await page.evaluate(() => MOONSHINE_WORKSPACE.window._stgCompCatalog.map(card => card.cost)), [4, 2, 0, -1, null]);
    await page.locator('[data-deck-action="reset"]').click();
    await page.locator('[data-deck-action="filters"]').click();
    await page.locator('[data-deck-none]').click();
    await page.locator('[data-deck-switch="skill"]').click();
    await page.locator('[data-deck-done]').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), 1);
    assert.equal(await page.locator('.stg-mobile-deck-total').textContent(), '5');
    await page.locator('[data-deck-action="reset"]').click();
    await page.locator('[data-deck-action="categories"]').click();
    await page.locator('[data-deck-none]').click();
    await page.locator('[data-deck-switch="Item"]').click();
    await page.locator('[data-deck-done]').click();
    assert.equal(await page.locator('.stg-mobile-deck-browser [class~="MOONSHINE-card-thumbnail-title"]').textContent(), 'Item fixture');
    await page.locator('.stg-mobile-deck-close').click();
    await page.locator('.stg-mobile-tiny-close').click();
    await page.evaluate(() => { _STG.masterDeck = []; });
    await page.locator('.stg-mobile-top-hud-info').click();
    await page.locator('.stg-mobile-tiny-deck').click();
    assert.equal(await page.locator('.stg-mobile-deck-total').textContent(), '0');
    assert.equal(await page.locator('.stg-mobile-deck-browser .stg-mc-card').count(), 0);
    await page.evaluate(() => { _STG.masterDeck = window.deckBeforeEmptyTest; STG_DISPLAY_CONFIG.setMode('desktop'); });
    await page.waitForFunction(() => !document.querySelector('#MOONSHINE-root'));
    assert.equal(await page.locator('.stg-mobile-deck-browser, .stg-mobile-deck-modal').count(), 0);
    await page.evaluate(() => stgToggleBannerFlyout());
    assert.equal(await page.locator('#stg-banner-fly .stg-banner-fly-row').filter({ hasText: /^Deck$/ }).count(), 1);
    assert.deepEqual(errors, []);
    console.log('PASS b6 Tiny Information View Deck, filters, detail, menu, portrait layouts');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
