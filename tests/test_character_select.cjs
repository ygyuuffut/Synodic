// Offline fixture: omit remote font imports; retain all local production CSS.
/* Real STG card renderer/selection functions with inert media and action spies. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {Project}=require(process.env.STG_EDITOR_CORE || '../../card-editor/core.js');
const html=fs.readFileSync(require('./helpers/synodic-test-paths.cjs').input(),'utf8'),project=new Project(html);
const css=html.match(/<style[^>]*id="twine-user-stylesheet"[^>]*>([\s\S]*?)<\/style>/)[1];
const functions=['stgSelectCharacter','stgCharacterSelectBoot'].map(name=>{const f=project.functions.find(f=>f.name===name);return 'window.'+name+'='+project.js.slice(f.node.start,f.node.end)+';';}).join('\n');
const characters=project.tables.STG_CHARACTERS;
const charCode='window.STG_CHARACTERS='+project.js.slice(characters.start,characters.end)+';';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  for(const [width,height]of [[400,760],[360,640],[360,800],[360,780],[384,832],[320,568]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:width===360?3:1});await page.route('https://**/*',r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<style>'+css+'</style><main id="passages"><section class="passage"><div id="stg-charsel-root"></div></section></main>');
   await page.addScriptTag({content:charCode+functions});
   await page.evaluate(()=>{
    window.testState={audio:[],unlock:0,deploy:[],back:[],boot:0};window._stgSelectedCharId=null;
    window.STG_CHARSEL_SOUNDS={tiny_hero:{voice:'voice.mp3',bg:'stinger.mp3'}};
    window.stgUnlockAudio=()=>testState.unlock++;
    window.stgPlayAudio=(...args)=>testState.audio.push(args);
    window.stgConfirmCharacter=()=>testState.deploy.push(_stgSelectedCharId);
    window.stgGoTo=target=>testState.back.push(target);
    const boot=window.stgCharacterSelectBoot;window.stgCharacterSelectBoot=()=>{testState.boot++;boot();};
    const art='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#312543"/><circle cx="200" cy="185" r="95" fill="#be95d5"/><path d="M80 520L125 310H275L320 520Z" fill="#85649c"/></svg>');
    STG_CHARACTERS[0].buttonImg=art;STG_CHARACTERS[0].bgImg=art;
    STG_CHARACTERS[0].bgVideo='https://example.invalid/intro.mp4';
    stgCharacterSelectBoot();
   });
   await page.addStyleTag({content:fs.readFileSync(path.join(__dirname,'..','moonshine/moonshine.view.source_styles.css'),'utf8').replace(/^@import .*$/gm,'')});await require('./helpers/install_moonshine_fixture.cjs')(page);
   const prev=page.getByRole('button',{name:'Previous character'}),next=page.getByRole('button',{name:'Next character'});
   await next.waitFor();assert.equal(await page.locator('.charsel-tile:visible').count(),1);
   assert.equal(await page.locator('.stg-mobile-character-count').textContent(),'1 of 4');
   assert.equal(await page.locator('.charsel-back').textContent(),'Return');
   assert.equal(await page.locator('.charsel-confirm').textContent(),'Deploy');
   assert.equal(await page.evaluate(()=>_stgSelectedCharId),'tiny_hero');
   assert.equal(await page.locator('.charsel-bg-video').count(),1);
   assert(await page.locator('.charsel-bg-video').evaluate(v=>v.autoplay&&v.muted&&v.playsInline));
   assert(!(await page.locator('#stg-charsel-root').evaluate(e=>e.classList.contains('stg-mobile-character-locked'))));
   assert.equal(await page.locator('.charsel-bg-video').evaluate(e=>getComputedStyle(e).opacity),'1');
   assert.equal(await page.locator('.charsel-gradient').evaluate(e=>getComputedStyle(e).opacity),'1');
   assert((await page.locator('.charsel-bg').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('data:image/svg+xml'));
   const backdrop=await page.evaluate(()=>{const root=document.querySelector('#stg-charsel-root').getBoundingClientRect(),v=document.querySelector('.charsel-bg-video').getBoundingClientRect();return {root:{x:root.x,y:root.y,w:root.width,h:root.height},video:{x:v.x,y:v.y,w:v.width,h:v.height}};});
   assert.deepEqual(backdrop.video,backdrop.root,'animated backdrop fills the character screen');
   await page.locator('.charsel-bg-video').evaluate(e=>e.classList.add('charsel-bg-video--ended'));
   await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.charsel-bg-video')).opacity)<0.01);
   await page.locator('.charsel-bg-video').evaluate(e=>e.classList.remove('charsel-bg-video--ended'));
   await page.waitForFunction(()=>parseFloat(getComputedStyle(document.querySelector('.charsel-bg-video')).opacity)>0.99);
   assert.deepEqual(await page.evaluate(()=>testState.audio),[['voice.mp3',0.425],['stinger.mp3',0.425*0.25]]);
   const bootCount=await page.evaluate(()=>testState.boot);
   await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
   await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>testState.boot),bootCount,'resize must not restart media');
   const bounds=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};return {card:rect('.charsel-tile.stg-mobile-character-current'),image:rect('.charsel-tile.stg-mobile-character-current .charsel-tile-img'),prev:rect('.stg-mobile-character-prev'),next:rect('.stg-mobile-character-next'),back:rect('.charsel-back'),deploy:rect('.charsel-confirm')};});
   for(const [name,b]of Object.entries(bounds)){assert(b.x>=-1&&b.y>=-1&&b.right<=width+1&&b.bottom<=height+1, name+' outside '+width+'x'+height+':'+JSON.stringify(b));}
   assert(bounds.prev.right<=bounds.card.x&&bounds.card.right<=bounds.next.x);
   assert(bounds.back.x<bounds.deploy.x);assert(bounds.back.y>bounds.card.y);
   assert(Math.abs(bounds.card.w/bounds.card.h-0.755)<0.03,'card aspect ratio');
   assert(Math.abs(bounds.image.w/bounds.image.h-288/259)<0.04,'image frame aspect ratio');
   assert(Math.abs(bounds.prev.w/bounds.prev.h-103/353)<0.06,'arrow aspect ratio');
   assert(bounds.card.y/height>0.18&&bounds.card.y/height<0.27,'card vertical position');
   assert.equal(await page.locator('.stg-mobile-character-current .charsel-tile-img img').evaluate(e=>getComputedStyle(e).objectFit),'cover');
   assert.equal(await page.locator('#stg-charsel-root').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)');
   await page.screenshot({path:'/tmp/stg-charsel-'+width+'x'+height+'.png'});
   // Rotation blocks portrait controls without rebuilding or restarting media.
   await page.evaluate(()=>window.rotationVideo=document.querySelector('.charsel-bg-video'));
   await page.setViewportSize({width:height,height:width});
   await page.locator('.stg-mobile-character-orientation').waitFor({state:'visible'});
   assert(await page.locator('.charsel-content').evaluate(e=>e.inert));
   assert.equal(await page.locator('.charsel-tile:visible').count(),0);
   await page.setViewportSize({width,height});await next.waitFor();
   assert(!(await page.locator('.charsel-content').evaluate(e=>e.inert)));
   assert(await page.evaluate(()=>rotationVideo===document.querySelector('.charsel-bg-video')));
   assert.equal(await page.evaluate(()=>testState.boot),bootCount);
   assert.equal(await page.evaluate(()=>testState.audio.length),2);
   await prev.click();assert.equal(await page.locator('.charsel-tile:visible .charsel-tile-name').textContent(),'Character 4');assert(await page.locator('.charsel-confirm').isDisabled());assert.equal(await page.evaluate(()=>_stgSelectedCharId),null);
   assert(await page.locator('#stg-charsel-root').evaluate(e=>e.classList.contains('stg-mobile-character-locked')));
   assert.equal(await page.locator('.charsel-bg-video').count(),0);
   assert.equal(await page.locator('.charsel-bg').evaluate(e=>getComputedStyle(e).backgroundImage),'none');
   assert.equal(await page.locator('.charsel-gradient').evaluate(e=>getComputedStyle(e).opacity),'0');
   assert.equal(await page.locator('.stg-mobile-character-count').textContent(),'4 of 4');
   assert.equal(await page.locator('.charsel-tile:visible .charsel-tile-tag').textContent(),'Coming Soon');
   assert.equal(await page.locator('.charsel-tile:visible .charsel-lock').textContent(),'🔒︎');
   assert.equal(await page.locator('.charsel-tile:visible .charsel-lock').evaluate(e=>getComputedStyle(e).fontFamily.split(',')[0].replaceAll('"','')),'Noto Emoji');
   assert.deepEqual(await page.locator('.charsel-confirm').evaluate(e=>{const s=getComputedStyle(e);return [s.backgroundColor,s.color,s.borderTopColor]}),['rgb(39, 38, 43)','rgb(80, 75, 82)','rgb(81, 76, 85)']);
   await page.screenshot({path:'/tmp/stg-charsel-locked-'+width+'x'+height+'.png'});
   await next.press('Enter');assert.equal(await page.locator('.charsel-tile:visible .charsel-tile-name').textContent(),'Beta');assert(!(await page.locator('.charsel-confirm').isDisabled()));
   assert(!(await page.locator('#stg-charsel-root').evaluate(e=>e.classList.contains('stg-mobile-character-locked'))));
   assert.equal(await page.locator('.charsel-bg-video').evaluate(e=>getComputedStyle(e).opacity),'1');
   assert.equal(await page.evaluate(()=>testState.audio.length),4);
   for(let i=0;i<4;i++)await next.click();assert.equal(await page.evaluate(()=>_stgSelectedCharId),'tiny_hero');assert.equal(await page.locator('.charsel-tile:visible').count(),1);
   await page.locator('.charsel-confirm').click();await page.locator('.charsel-back').click();assert.deepEqual(await page.evaluate(()=>({deploy:testState.deploy,back:testState.back})),{deploy:['tiny_hero'],back:['Menu']});
   // Native renderer refresh: exactly one control pair, same selected character.
   await page.evaluate(()=>stgCharacterSelectBoot());await next.waitFor();assert.equal(await page.locator('.stg-mobile-character-stage').count(),1);
   // Desktop cleanup restores all original cards and keeps the current media node.
   await page.evaluate(()=>window.videoBeforeResize=document.querySelector('.charsel-bg-video'));
   await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('desktop'));
   await page.setViewportSize({width:1300,height:900});await page.waitForFunction(()=>!document.querySelector('#MOONSHINE-root'));
   assert.equal(await page.locator('.charsel-tile:visible').count(),4);assert.equal(await page.locator('.stg-mobile-character-stage').count(),0);assert.equal(await page.locator('.stg-mobile-character-count').count(),0);assert(await page.evaluate(()=>videoBeforeResize===document.querySelector('.charsel-bg-video')));
   assert.equal(await page.locator('.charsel-back').textContent(),'◀ Back');
   await page.evaluate(()=>STG_DISPLAY_CONFIG.setMode('auto'));
   await page.setViewportSize({width,height});await next.waitFor();assert.equal(await page.locator('.charsel-tile:visible').count(),1);
   // Single-card source disables cycling, without duplicated selection audio.
   await page.evaluate(()=>{STG_CHARACTERS=STG_CHARACTERS.slice(0,1);stgCharacterSelectBoot();});await next.waitFor();assert(await next.isDisabled());assert(await prev.isDisabled());
   assert.deepEqual(errors,[]);console.log('PASS',width+'x'+height,'one card / wrap / locked / native media and audio / Back & Deploy / desktop restore / single card');await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
