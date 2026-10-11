/* Real owned rows in a scroll viewport: continuity, zoom units and cancellation. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=require('./helpers/synodic-test-paths.cjs').root;
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:400,height:760}});await page.route('https://**/*',r=>r.abort());await page.setContent('<html><body><div id="MOONSHINE-actions-root"><div class="MOONSHINE-actions-list" style="height:340px;margin-top:80px;pointer-events:auto"></div></div></body></html>');
 await page.addStyleTag({content:fs.readFileSync(path.join(root,'moonshine/moonshine.component.catalog.css'),'utf8')});await page.addStyleTag({path:path.join(root,'moonshine/moonshine.view.actions.css')});
 await page.evaluate(()=>window.LUNAR={api:{moonshine:{timing:{ui:fn=>fn()}}}});
 for(const name of ['component.catalog','component.actions','animation.accordion'])await page.addScriptTag({path:path.join(root,'moonshine/moonshine.'+name+'.cjs')});
 for(const zoom of [1,.8,1.25]){
  const result=await page.evaluate(async zoom=>{
   document.getElementById('MOONSHINE-actions-root').style.zoom=String(zoom);const host=document.querySelector('.MOONSHINE-actions-list');host.replaceChildren();
   const rows=Array.from({length:12},(_,i)=>MOONSHINE_ACTION_COMPONENTS.row({id:String(i),label:'Option '+i,category:'dialogue',html:'A long complete dialogue option. '.repeat(i===10||i===11?34:1)}));rows.forEach(r=>host.append(r.card));const controller=MOONSHINE_ACCORDION.controller(host);
   const sleep=ms=>new Promise(r=>setTimeout(r,ms));const settle=async()=>{while(controller.state.running)await sleep(8);};
   rows[11].full.querySelector('.MOONSHINE-action-full-label').innerHTML='<font data-translator>'+'Translated complete dialogue. '.repeat(30)+'</font>';
   controller.request(rows[11]);await settle();host.scrollTop=host.scrollHeight-host.clientHeight;
   const from=parseFloat(getComputedStyle(rows[11].card).height),samples=[];let measuring=true,keys=null;
   function sample(){samples.push({time:performance.now(),height:parseFloat(getComputedStyle(rows[11].card).height),scroll:host.scrollTop});const a=rows[11].card.getAnimations().find(a=>a.effect.getKeyframes().some(f=>'height'in f));if(a&&!keys)keys=a.effect.getKeyframes();if(measuring)requestAnimationFrame(sample);}
   sample();controller.request(null);await settle();measuring=false;await sleep(20);
   let jump=0,heightStep=0;for(let i=1;i<samples.length;i++){jump=Math.max(jump,Math.abs(samples[i].scroll-samples[i-1].scroll));heightStep=Math.max(heightStep,Math.abs(samples[i].height-samples[i-1].height));}
   controller.request(rows[11]);await settle();host.scrollTop=host.scrollHeight-host.clientHeight;let overlapping=false;controller.request(rows[10]);while(controller.state.running){const old=rows[11].card.getAnimations().some(a=>a.effect.getKeyframes().some(f=>'height'in f)),next=rows[10].card.getAnimations().some(a=>a.effect.getKeyframes().some(f=>'height'in f));overlapping=overlapping||old&&next;await sleep(8);}
   return {zoom,from,frames:keys,jump,heightStep,overlapping,inline:rows[11].card.style.height,translated:!!rows[11].card.querySelector('[data-translator]'),final:controller.ready(rows[10])};
  },zoom);
  console.log('Accordion continuity',JSON.stringify(result));assert(result.jump<=result.heightStep+4,'scroll viewport must not jump ahead of the height animation');assert(Math.abs(parseFloat(result.frames[0].height)-result.from)<.1,'height frames must use CSS units under zoom');assert(result.overlapping,'switch rows in one coordinated height phase');assert.equal(result.inline,'');assert(result.translated&&result.final);
 }
 await page.emulateMedia({reducedMotion:'reduce'});const reduced=await page.evaluate(async()=>{const host=document.querySelector('.MOONSHINE-actions-list'),row=MOONSHINE_ACTION_COMPONENTS.row({id:'reduced',label:'Reduced',category:'dialogue',html:'Full text'});host.replaceChildren(row.card);const c=MOONSHINE_ACCORDION.controller(host);c.request(row);while(c.state.running)await new Promise(r=>setTimeout(r,5));return {ready:c.ready(row),count:row.card.getAnimations().length};});assert(reduced.ready);assert.equal(reduced.count,0);
 await page.emulateMedia({reducedMotion:'no-preference'});const cancelled=await page.evaluate(async()=>{const host=document.querySelector('.MOONSHINE-actions-list'),row=MOONSHINE_ACTION_COMPONENTS.row({id:'cancel',label:'Cancel',category:'dialogue',html:'Full text '.repeat(80)});host.replaceChildren(row.card);const c=MOONSHINE_ACCORDION.controller(host);c.request(row);await new Promise(r=>setTimeout(r,180));c.destroy();host.remove();await new Promise(r=>setTimeout(r,30));return {animations:row.card.getAnimations().length,inline:row.card.style.height,running:c.state.running};});assert.equal(cancelled.animations,0);assert.equal(cancelled.inline,'');assert.equal(cancelled.running,false);
 console.log('PASS scroll/zoom continuity, coordinated accordion switching, translated DOM, auto heights, reduced motion and teardown cancellation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
