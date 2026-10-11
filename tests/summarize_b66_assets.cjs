/* Compact evidence; keep raw stages/requests/traces in builds/. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=path.join(root,'builds/performance-b66-assets');
const read=name=>JSON.parse(fs.readFileSync(path.join(base,name),'utf8'));
const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)];
function startup(stage){const raw=Array.from({length:3},(_,i)=>read(`${stage}-real-${i}.json`)).map(r=>{
 assert.equal(r.cpu,9.8);const mark=name=>r.marks.find(m=>m.name==='SYNODIC.'+name)?.time??null;
 const images=r.requests.filter(x=>x.url.includes('/media/')),menu=images.filter(x=>x.url.includes('17d5f4c84a4c424'));
 return {fcpMs:r.paint.find(x=>x.name==='first-contentful-paint').time,uiControlsDOMMs:r.uiObservedTime,interactiveUIMs:r.interactiveUIObservedTime,
 lcpMs:r.lcp.at(-1).time,lcpElement:r.lcp.at(-1).element,shellCreatedMs:mark('SHELL'),profileSelectedMs:mark('PROFILE_SELECTED'),criticalReadyMs:mark('READY'),
 httpRequestEvents:r.requests.length,uniqueHttpURLs:new Set(r.requests.map(x=>x.url)).size,sceneImageRequestEvents:images.length,unrelatedImageRequests:images.length-menu.length,
 inactiveProfileRequests:r.assets?r.inactiveProfileRequests:null,completedTransferBytes:r.requests.filter(x=>typeof x.bytes==='number').reduce((sum,x)=>sum+x.bytes,0),
 pendingRequests:r.requests.filter(x=>!('bytes' in x)&&!('error' in x)).length,networkErrors:r.requests.filter(x=>'error' in x).length,
 criticalRequestCount:r.assets?.requested??null,criticalPayloadBytes:r.assets?.bytes??null,criticalEncodedBytes:menu.filter(x=>x.type==='Fetch'&&typeof x.bytes==='number').reduce((sum,x)=>sum+x.bytes,0)||null,
 criticalFailed:r.assets?.failed??null,criticalAborted:r.assets?.aborted??null,errors:r.errors};
 });return {raw,median:Object.fromEntries(Object.keys(raw[0]).filter(k=>raw.every(x=>typeof x[k]==='number')).map(k=>[k,median(raw.map(x=>x[k]))]))};}
function pipeline(report,mode,repeats=3){assert.equal(report.runs.filter(r=>r.name.startsWith('ab-card')&&r.mode===mode).length,repeats);const rows=report.runs.filter(r=>r.name.startsWith('ab-card')&&r.mode===mode),raw=rows.map(r=>{
 const s=r.stats,top=r.events.filter(e=>e.parent===null);return {capture:s['LUNAR.game.capture.calls']||0,jsonCopies:s['JSON.stringify.owner.LUNAR.buffer.copy']||0,notify:s['LUNAR.notify.calls']||0,render:s['MOONSHINE.runtime.render.calls']||0,visiblePatch:s['MOONSHINE.catalog.patch.time']?.count||0,
 scriptMs:r.cdp.ScriptDuration*1000,maxRafMs:r.frames.max,layoutMs:r.cdp.LayoutDuration*1000,over4:top.filter(e=>e.ms>4).length,over8:top.filter(e=>e.ms>8).length,over16:top.filter(e=>e.ms>16).length,state:r.state};
 });return {raw,median:Object.fromEntries(Object.keys(raw[0]).filter(k=>typeof raw[0][k]==='number').map(k=>[k,median(raw.map(x=>x[k]))])),timings:Object.fromEntries(Object.keys(rows[0].stats).filter(k=>k.endsWith('.time')).map(k=>[k,Object.fromEntries(['count','total','max','over4','over8','over16'].map(field=>[field,median(rows.map(r=>r.stats[k]?.[field]||0))]))]))};}
const stages=['before-4x','verified-4x','cached-4x','final-4x'],modes=['read-only','no-notify','no-visible-dom','normal'];
const result={date:'2026-10-03',conditions:{chrome:'154.0.8037.95',machine:'local macOS26.7 arm64',startup:{cpu:9.8,network:'400ms / 750kbps down / 250kbps up',viewport:'400x760 DPR2 touch',repeats:3},pipeline:{cpu:4,viewport:'400x760 touch',repeats:3,remote:'HTTPS aborted consistently'}},
 startup:{before:startup('before'),after:startup('after')},pipeline:Object.fromEntries(stages.map(stage=>{const r=read(stage+'/report.json');assert.equal(r.throttle,4);return [stage,{modes:Object.fromEntries(modes.map(mode=>[mode,pipeline(r,mode)])),hp:r.runs.find(x=>x.name==='controlled-hp-native-bars'),animation:r.runs.find(x=>x.name==='shop-balance-during-animation').identity,control:r.control}];})),
 notes:['Request events include browser cache hits; they are not all new wire downloads.','completedTransferBytes is a partial completed sum, not total bytes when requests remain pending. Critical Blob bytes excludes HTTP headers.','LCP element grows after the real menu art becomes available; do not call the final LCP change a speed improvement.','FIRST_UI marks controls built under Loading; interactiveUIMs is separately observed after READY and fade removal.','SHELL creation is not paint; FCP is the first visible content, with no other initial content above the shell.','No HTML download measurement (local file), actual A55/GPU/phone FPS claim, or HTTP cache-clearing product.','Earlier initial/decoded startup stages remain in builds; decoded stage includes one timeout/fallback. Native warm paths scoped, not a rewrite of all native resource consumers.']};
const sanity=read('sanity-1x/report.json');assert.equal(sanity.throttle,1);result.sanity1x=Object.fromEntries(modes.map(mode=>[mode,pipeline(sanity,mode,1)]));
fs.writeFileSync(path.join(root,'diagnostics/b66-assets-2026-10-03.json'),JSON.stringify(result,null,2)+'\n');
const round=n=>Math.round(n*10)/10;let table='| 9.8× slow network／三輪中位數 | Before | After |\n|---|---:|---:|\n';
for(const key of ['fcpMs','uiControlsDOMMs','interactiveUIMs','lcpMs','httpRequestEvents','uniqueHttpURLs','sceneImageRequestEvents','unrelatedImageRequests','pendingRequests','completedTransferBytes'])table+=`| ${key} | ${round(result.startup.before.median[key])} | ${round(result.startup.after.median[key])} |\n`;
table+='\n| 4×／三輪中位數 | capture | JSON copy | notify | render | visible patch | Script ms | max rAF ms | >4/8/16ms work |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n';
for(const mode of modes){const a=result.pipeline['before-4x'].modes[mode].median,b=result.pipeline['final-4x'].modes[mode].median;table+=`| ${mode} | ${['capture','jsonCopies','notify','render','visiblePatch','scriptMs','maxRafMs'].map(k=>`${round(a[k])} → ${round(b[k])}`).join(' | ')} | ${a.over4}/${a.over8}/${a.over16} → ${b.over4}/${b.over8}/${b.over16} |\n`;}
fs.writeFileSync(path.join(base,'tables.md'),table);console.log(table);
