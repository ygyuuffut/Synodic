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

    const panel=page.locator('.stg-story-panel');
    await panel.waitFor();
    await page.screenshot({path:'/tmp/b6-story-loading.png'});
    await page.mouse.click(200,350);
    await page.waitForTimeout(900);
    await page.screenshot({path:'/tmp/b6-story-ready.png'});
    assert.equal(await panel.locator('.stg-story-status').textContent(),'✓');
    assert.equal(await page.locator('.blessing-card:visible').count(),0);
    assert.equal(await page.locator('.stg-story-actions').isVisible(),true);
    await page.evaluate(async()=>{stgArcChoose(4);stgArcSkipTw();});
    for (const viewport of [{width:400,height:760},{width:360,height:640},{width:360,height:800},{width:360,height:780}]) {
      await page.setViewportSize(viewport); await page.waitForTimeout(150);
      const before=await panel.boundingBox();
      assert.ok(Math.abs(before.height-viewport.width*.82)<2);
      assert.ok(before.y+before.height<=viewport.height && before.x>=0);
      await page.evaluate(async()=>stgArcTypewriter('<b style="color:rgb(255,0,0)">A long dialogue</b><br>'+('More text. '.repeat(150))));
      await page.waitForFunction(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-story-status"]')?.textContent==='⏳\uFE0E');
      assert.equal(await panel.locator('.stg-story-status').textContent(),'⏳\uFE0E');
      assert.equal(await panel.locator('.blessing-actions').isVisible(),false);
      await page.locator('#stg-banner-menu-btn').click();
      const paused=await page.locator('#arc-dlg-text').innerHTML();
      await page.waitForTimeout(150);
      assert.equal(await page.locator('#arc-dlg-text').innerHTML(),paused);
      await page.locator('[data-ig="close"]').click();
      await page.mouse.click(200,350);
      await page.waitForFunction(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-story-status"]')?.textContent==='✓');
      assert.equal(await panel.locator('.stg-story-status').textContent(),'✓');
      assert.equal(await panel.locator('.blessing-actions').isVisible(),false);
      assert.equal(await panel.locator('.stg-story-actions').isVisible(),true);
      const after=await panel.boundingBox(); assert.equal(after.height,before.height);
      assert.equal(await page.locator('#arc-dlg-text b').evaluate(el=>getComputedStyle(el).color),'rgb(255, 0, 0)');
      await page.locator('.stg-story-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
      await page.evaluate(async()=>{stgArcTypewriter('New line');await MOONSHINE_RUNTIME.flush();});
      await page.waitForFunction(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-story-scroll"]').scrollTop===0);
      assert.equal(await page.locator('.stg-story-scroll').evaluate(el=>el.scrollTop),0);
      await page.waitForTimeout(400);
      assert.equal(await panel.locator('.stg-story-status').textContent(),'✓');
    }
    await page.locator('.stg-story-view').click();
    assert.equal(await page.evaluate(async()=>document.body.classList.contains('stg-view-art-mode')),true);
    await page.locator('#stg-view-art-btn').click();
    assert.equal(await panel.isVisible(),true);
    await page.setViewportSize({width:400,height:760});
    await page.evaluate(async()=>{stgBlessingRender();});
    await page.waitForTimeout(150);
    await page.screenshot({path:'/tmp/b6-story-ready.png'});
    // Commit once, then revisit Arc: no upgrade candidates remain.
    await page.evaluate(async()=>{const g=LUNAR.api.moonshine.actions.read().upgrade;LUNAR.api.moonshine.actions.select(g.id,g.offers[0].id);LUNAR.api.moonshine.actions.confirm(g.id);const next=LUNAR.api.moonshine.actions.read().items.find(i=>i.label==='Explore Lab');LUNAR.api.moonshine.actions.execute(next.id);});
    await page.waitForFunction(()=>!!document.getElementById('stg-lab-root'));
    await page.evaluate(async()=>stgLabTalkToArc());
    await page.locator('.stg-story-panel').waitFor();
    assert.equal(await page.locator('.stg-story-upgrade-arrow').count(),0);
    await page.evaluate(async()=>stgBodyExplorationStart('arc'));
    await page.waitForFunction(()=>!!document.getElementById('stg-body-root'));
    await page.waitForTimeout(1000);
    await page.evaluate(async()=>{if(window.stgBodyArtEntranceLift)stgBodyArtEntranceLift();});
    await page.evaluate(async()=>stgEncounterTypewriter('A short exploration paragraph.'));
    await page.waitForFunction(()=>!document.querySelector('#enc-text')._twSkipFn);
    await page.waitForFunction(()=>document.querySelector('#MOONSHINE-root [data-ms-class~="stg-story-status"]')?.textContent==='✓');
    assert.equal(await page.locator('.stg-story-status').textContent(),'✓');
    await page.evaluate(async()=>stgEncounterTypewriter('Exploration continues '.repeat(40)));
    await page.mouse.click(200,300);
    assert.equal(await page.locator('.stg-story-status').textContent(),'✓');
    const exploreGeometry=await page.locator('.stg-story-panel').evaluate(el=>{
      const box=el.getBoundingClientRect(), scroll=el.querySelector('.stg-story-scroll').getBoundingClientRect();
      return {left:box.left,right:box.right,height:box.height,scrollTop:scroll.top,top:box.top,scrollBottom:scroll.bottom,bottom:box.bottom,nested:el.querySelectorAll('.enc-text-panel').length};
    });
    assert.equal(exploreGeometry.nested,0);
    assert.ok(exploreGeometry.left>=0 && exploreGeometry.right<=400 && Math.abs(exploreGeometry.height-328)<1);
    assert.ok(exploreGeometry.scrollTop>=exploreGeometry.top && exploreGeometry.scrollBottom<=exploreGeometry.bottom);
    await page.screenshot({path:'/tmp/b6-story-explore.png'});
    // Real encounter renderer, with a small in-memory event to isolate UI state.
    await page.evaluate(async()=>{
      stgBodyBgTeardown();
      STG_ENCOUNTER_EVENTS.mobile_test={id:'mobile_test',title:'A test encounter',chunks:['First paragraph.', 'Second paragraph.'],choices:[{label:'Stay here',desc:'One action',goto:'stay',effect:{resolve:()=>{window.storyActions=(window.storyActions||0)+1;}}}]};
      _stgPendingEncounter='mobile_test';stgGoTo('EncounterEvent');
    });
    await page.waitForFunction(()=>!!document.querySelector('#stg-encounter-root #enc-text')?!!document.querySelector('#stg-encounter-root #enc-text')._twSkipFn:false);
    await page.mouse.click(200,300);
    await page.locator('.enc-page-continue').waitFor({state:'attached'});
    assert.equal(await page.locator('#enc-text').textContent(),'First paragraph.');
    await page.evaluate(async()=>{const next=LUNAR.api.moonshine.actions.read().items.find(i=>/continue|next/i.test(i.label));LUNAR.api.moonshine.actions.execute(next.id);});
    assert.equal(await page.locator('.stg-story-status').textContent(),'⏳\uFE0E');
    await page.mouse.click(200,300);
    assert.equal(await page.evaluate(async()=>window.storyActions||0),0);
    await page.evaluate(async()=>{const next=LUNAR.api.moonshine.actions.read().items.find(i=>/stay here/i.test(i.label));LUNAR.api.moonshine.actions.execute(next.id);});
    assert.equal(await page.evaluate(async()=>window.storyActions),1);
    const hudBefore=await page.locator('.stg-mobile-top-hud').boundingBox();
    await page.locator('.stg-mobile-top-hud-info').click();
    const tiny=await page.locator('.stg-mobile-tiny-panel').boundingBox();
    assert.ok(Math.abs(tiny.x+tiny.width/2-200)<2);
    await page.locator('.stg-mobile-tiny-close').click();
    const hudAfter=await page.locator('.stg-mobile-top-hud').boundingBox();
    assert.deepEqual(hudAfter,hudBefore);
    await page.evaluate(async()=>stgGoTo('Event'));
    await page.waitForFunction(()=>!!document.getElementById('ev-text')?!!document.getElementById('ev-text')._twSkipFn:false);
    await page.mouse.click(200,300);
    assert.equal(await page.locator('.stg-story-status').textContent(),'✓');
    assert.equal(await page.locator('#ev-choices').isVisible(),false);
    assert.equal(await page.locator('.stg-story-actions').isVisible(),true);
    await page.evaluate(async()=>STG_DISPLAY_CONFIG.setMode('desktop'));
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.stg-story-panel').count(),0);
    assert.equal(await page.locator('#ev-text').count(),1);
    assert.deepEqual(errors,[]);
    console.log('PASS story fixed height, typing/ready, pause, no tap-through, scroll reset, rich text, relocated actions, committed revisit, exploration, CG and desktop restore');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
