/* Reproducible, compact delivery report; raw traces remain in builds/. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=path.join(root,'builds/performance-b66-logger');
const read=name=>JSON.parse(fs.readFileSync(path.join(base,name,'report.json'),'utf8'));
const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)];
function metrics(r){const s=r.stats,top=r.events.filter(e=>e.parent===null);return {
 capture:s['LUNAR.game.capture.calls']||0,copyCalls:s['LUNAR.buffer.copy.calls']||0,jsonCopies:s['JSON.stringify.owner.LUNAR.buffer.copy']||0,stringify:s['JSON.stringify.calls']||0,
 notify:s['LUNAR.notify.calls']||0,render:s['MOONSHINE.runtime.render.calls']||0,visiblePatch:s['MOONSHINE.catalog.patch.time']?.count||0,
 scriptMs:r.cdp.ScriptDuration*1000,maxRafMs:r.frames.max,layoutMs:r.cdp.LayoutDuration*1000,
 over4:top.filter(e=>e.ms>4).length,over8:top.filter(e=>e.ms>8).length,over16:top.filter(e=>e.ms>16).length,
 loggerAppend:s['LUNAR.logger.append.calls']||0,loggerAppendMs:s['LUNAR.logger.append.time']?.total||0,loggerAppendMax:s['LUNAR.logger.append.time']?.max||0,
 loggerAppendOver4:s['LUNAR.logger.append.time']?.over4||0,loggerAppendOver8:s['LUNAR.logger.append.time']?.over8||0,loggerAppendOver16:s['LUNAR.logger.append.time']?.over16||0,
 checkpoint:s['LUNAR.logger.checkpoint.calls']||0,checkpointSyncMs:s['LUNAR.logger.checkpoint.time']?.total||0,
 longTasks:r.longTasks.map(t=>t.ms),state:r.state};}
function group(rows,n){assert.equal(rows.length,n);const raw=rows.map(metrics);return {median:Object.fromEntries(Object.keys(raw[0]).filter(k=>typeof raw[0][k]==='number').map(k=>[k,median(raw.map(r=>r[k]))])),raw,
 timings:Object.fromEntries(Object.keys(rows[0].stats).filter(k=>k.endsWith('.time')).map(k=>[k,Object.fromEntries(['count','total','max','over4','over8','over16'].map(field=>[field,median(rows.map(r=>r.stats[k]?.[field]||0))]))]))};}
const before=read('before-4x'),initial=read('after-4x'),coalesced=read('final-4x'),final=read('isolated-4x'),sanity=read('isolated-sanity-1x');
for(const r of [before,initial,coalesced,final])assert.equal(r.throttle,4);assert.equal(sanity.throttle,1);
const modes=['read-only','no-notify','no-visible-dom','normal'];
const stages=Object.fromEntries([['before',before],['initialLogger',initial],['coalescedLogger',coalesced],['finalLogger',final]].map(([name,r])=>[name,{ab:Object.fromEntries(modes.map(mode=>[mode,group(r.runs.filter(x=>x.name.startsWith('ab-card')&&x.mode===mode),3)])),
 hp:metrics(r.runs.find(x=>x.name==='controlled-hp-native-bars')),animation:r.runs.find(x=>x.name==='shop-balance-during-animation').identity,control:r.control}]));
const result={date:'2026-10-03',conditions:{chrome:'154.0.8037.95',machine:'local macOS26.7 arm64 development computer',viewport:final.viewport,throttle:4,repeats:3,headless:true,touch:true,remoteAssets:'all HTTPS aborted consistently',nativeFixture:'seed319 / stgDevCardTestCombat(dodge,1) / one native card play'},
 notes:['Raw legacy benchmark date says 2026-10-02; these runs actually took place on 2026-10-03.','Top-level wrapped work thresholds are not all browser tasks; LongTask observes only >=50ms tasks. Inclusive function timings must not be summed.','checkpoint timing covers synchronous scheduling only; CDP ScriptDuration also includes async IndexedDB callback work.','rAF gaps are main-thread scheduling gaps, not compositor or phone FPS.','copyCalls include primitive returns; jsonCopies counts actual buffer-copy stringify, total stringify also includes DOM signatures.','Public previous-only API and failure/translation/viewport assertions are in the separate real-file live tests.'],stages,
 sanity1x:{ab:Object.fromEntries(modes.map(mode=>[mode,group(sanity.runs.filter(x=>x.name.startsWith('ab-card')&&x.mode===mode),1)])),hp:metrics(sanity.runs.find(x=>x.name==='controlled-hp-native-bars')),control:sanity.control}};
fs.writeFileSync(path.join(root,'diagnostics/b66-logger-2026-10-03.json'),JSON.stringify(result,null,2)+'\n');
const round=n=>Math.round(n*10)/10,arrow=(a,b,k)=>`${round(a[k])} → ${round(b[k])}`;
let md='| 4×／三輪中位數 | capture | JSON copy | notify | render | visible patch | Script ms | 最長 rAF ms | >4/8/16ms work |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n';
for(const mode of modes){const a=stages.before.ab[mode].median,b=stages.finalLogger.ab[mode].median;md+=`| ${mode} | ${['capture','jsonCopies','notify','render','visiblePatch','scriptMs','maxRafMs'].map(k=>arrow(a,b,k)).join(' | ')} | ${a.over4}/${a.over8}/${a.over16} → ${b.over4}/${b.over8}/${b.over16} |\n`;}
md+='\n| Logger 階段／normal 4×三輪中位數 | append | append total ms | append max ms | checkpoint | checkpoint同步 ms | >4/8/16ms append |\n|---|---:|---:|---:|---:|---:|---|\n';
for(const name of ['initialLogger','coalescedLogger','finalLogger']){const b=stages[name].ab.normal.median;md+=`| ${name} | ${b.loggerAppend} | ${round(b.loggerAppendMs)} | ${round(b.loggerAppendMax)} | ${b.checkpoint} | ${round(b.checkpointSyncMs)} | ${b.loggerAppendOver4}/${b.loggerAppendOver8}/${b.loggerAppendOver16} |\n`;}
fs.writeFileSync(path.join(base,'tables.md'),md);console.log(md);
