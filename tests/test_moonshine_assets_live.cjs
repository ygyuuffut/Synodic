const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:360,height:780},hasTouch:true,deviceScaleFactor:2}),requests=[];
 await p.route('https://static.wixstatic.com/**',r=>{requests.push(r.request().url());r.abort();});await p.setContent('<body></body>');
 for(const f of ['lunar/lunar.buffer.store.cjs','lunar/lunar.adapter.data.cjs','display-config.js','lunar/lunar.adapter.images.cjs','lunar/lunar.bridge.resources.cjs'])await p.addScriptTag({path:path.join(__dirname,'..',f)});
 const result=await p.evaluate(()=>{
  const cg='https://static.wixstatic.com/media/test-cg.png',card='https://static.wixstatic.com/media/test-card.png',atk='https://static.wixstatic.com/media/test-atk.png';
  LUNAR.adapter.images.registerCard(card);
  const image=new Image();image.src=cg;document.body.append(image);
  const thumb=new Image();thumb.setAttribute('src',card);document.body.append(thumb);
  const div=document.createElement('div');div.style.width='100px';div.style.height='100px';div.style.backgroundImage='url("'+cg+'")';document.body.append(div);
  window.stgShowActionOverlay=()=>{const el=new Image();el.src=atk;document.body.append(el);return el.src;};LUNAR.bridge.resources.install();const intermission=stgShowActionOverlay();
  const recategorized=LUNAR.adapter.images.url(image.src,'intermission');return {cg:image.src,card:thumb.src,background:div.style.backgroundImage,intermission,recategorized};
 });
 assert(result.cg.includes('/fit/w_432,h_936/'));assert(result.card.includes('/fill/w_216,h_468/'));assert(result.background.includes('/fit/w_432,h_936/'));assert(result.intermission.includes('/fit/w_288,h_624/'));assert(result.recategorized.includes('/fit/w_288,h_624/'));
 await p.waitForTimeout(100);assert(requests.length>=3);assert(requests.every(url=>url.includes('/v1/')));
 const cache=await p.evaluate(()=>{const css=LUNAR.adapter.images.css;let calls=0;LUNAR.adapter.images.css=function(){calls++;return css.apply(this,arguments)};const style=document.createElement('style');style.textContent='.probe{background:url(\"https://static.wixstatic.com/media/test-probe.png\")}';document.head.append(style);LUNAR.bridge.resources.install();calls=0;LUNAR.bridge.resources.install();const unchanged=calls;style.textContent='.probe{color:purple}';calls=0;LUNAR.bridge.resources.install();const changed=calls;calls=0;LUNAR.bridge.resources.install();return {unchanged,changed,settled:calls};});assert.equal(cache.unchanged,0);assert(cache.changed>0);assert.equal(cache.settled,0);
 console.log('PASS 60/30/40 policies on image src, attributes, background CSS and intermission context; no bare Wix image request');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
