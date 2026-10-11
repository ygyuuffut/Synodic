/* Bounded append, fault isolation and write-only/public previous-only contracts. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=name=>fs.readFileSync(path.join(__dirname,'../lunar',name),'utf8');
function boot(previous=null,failure=false,quotes=['fixed quote']){let saves=0,started=0,t=0;const events={},warnings=[],timers=new Map();
 const c={console:{warn:(...v)=>warnings.push(v)},navigator:{userAgent:'test',platform:'test',language:'en'},innerWidth:400,innerHeight:760,devicePixelRatio:1,performance:{now:()=>++t},queueMicrotask,setTimeout:fn=>{const key=timers.size+1;timers.set(key,fn);return key;},clearTimeout:key=>timers.delete(key),document:{documentElement:{lang:'en'},getElementById:()=>({textContent:JSON.stringify({build:'b6.6',quotes:quotes,modules:[]})}),addEventListener:(key,fn)=>events[key]=fn},addEventListener:(key,fn)=>events[key]=fn};
 c.window=c;vm.createContext(c);vm.runInContext('Math.random=()=>{throw Error("Logger must not touch game RNG")}',c);
 vm.runInContext(read('lunar.buffer.store.cjs'),c);vm.runInContext(read('lunar.logger.core.cjs'),c);
 c.LUNAR.bridge.loggerStorage={start:async record=>{started++;if(failure)throw Error('storage denied');return previous;},save:async record=>{saves++;if(failure)throw Error('quota');}};
 vm.runInContext(read('lunar.logger.api.cjs'),c);return {c,events,warnings,timers,counts:()=>({saves,started}),evaluate:s=>vm.runInContext(s,c)};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const noQuotes=boot(null,false,[]);await settle();assert.equal(noQuotes.c.LUNAR.bridge.logger.snapshot().session.quote,'');assert.equal(noQuotes.c.LUNAR.api.diagnostics.status().ready,true);const b=boot();await settle();await b.c.LUNAR.bridge.logger.checkpoint();assert.equal(b.c.LUNAR.api.diagnostics.status().previousAvailable,false);
 const result=await b.c.LUNAR.api.diagnostics.exportPrevious();assert.equal(result.available,false);
 const baseline=b.counts().saves;
 b.evaluate("const log=LUNAR.logger.scope('MOONSHINE.actions');for(let i=0;i<2000;i++)log.debug('item '+i,{i});");
 const current=b.c.LUNAR.bridge.logger.snapshot();assert.equal(current.entries.length,1500);assert.equal(current.entries[0].message,'item 500');assert.equal(current.entries.at(-1).message,'item 1999');assert.equal(current.session.quote,'fixed quote');assert.equal(current.session.cleanShutdown,false);assert.equal(b.counts().saves,baseline,'no synchronous write per entry');
 await settle();await b.c.LUNAR.bridge.logger.checkpoint();assert(b.counts().saves-baseline<=2);
 b.evaluate("log.info('safe',{password:'hidden',state:{player:'never dump'},get trap(){throw Error('getter evaluated');},number:3});log.warn('warning');log.error('fault',new Error('unit exception'),{action:'test'});log.fatal('fatal',new Error('fatal test'));");
 let last=b.c.LUNAR.bridge.logger.snapshot().entries;assert.equal(last.at(-4).data.password,'[redacted]');assert.equal(last.at(-4).data.state,'[redacted]');assert.equal(last.at(-4).data.trap,'[accessor omitted]');assert(last.at(-2).error.stack.includes('unit exception'));assert(last.at(-1).recent.length<=12);assert(last.every((v,i,a)=>!i||v.sequence>a[i-1].sequence));
 let prevented=false;b.events.error({error:new Error('uncaught'),filename:'test.js',lineno:3,colno:4,preventDefault:()=>prevented=true});b.events.unhandledrejection({reason:new Error('rejected'),preventDefault:()=>prevented=true});assert.equal(prevented,false);assert.equal(b.c.LUNAR.bridge.logger.snapshot().entries.at(-1).level,'FATAL');await settle();assert(b.counts().saves>baseline);
 const id=current.session.id;b.events.pagehide({persisted:true});assert.equal(b.c.LUNAR.bridge.logger.snapshot().session.cleanShutdown,false);b.events.pagehide({persisted:false});assert.equal(b.c.LUNAR.bridge.logger.snapshot().session.cleanShutdown,true);b.events.pageshow({persisted:true});assert.equal(b.c.LUNAR.bridge.logger.snapshot().session.id,id);assert.equal(b.c.LUNAR.bridge.logger.snapshot().session.cleanShutdown,false);assert.equal(b.counts().started,1);
 assert.deepEqual(Object.keys(b.c.LUNAR.logger),['scope']);assert.deepEqual(Object.keys(b.c.LUNAR.api.diagnostics),['status','subscribe','exportPrevious']);assert.throws(()=>b.c.LUNAR.logger.scope('random.file'));
 const isolated=boot();await settle();await isolated.c.LUNAR.bridge.logger.checkpoint();const savedBefore=isolated.counts().saves;
 isolated.evaluate("window.gameTimers=0;window.setTimeout=function(){gameTimers++;throw Error('game timer used')};window.clearTimeout=function(){gameTimers++;throw Error('game clear used')};LUNAR.logger.scope('LUNAR.logger').info('isolated timer')");
 assert.equal(isolated.c.gameTimers,0);assert.equal(isolated.timers.size,1);const [timerKey,timerFn]=Array.from(isolated.timers)[0];isolated.timers.delete(timerKey);timerFn();await settle();assert(isolated.counts().saves>savedBefore);assert.equal(isolated.c.gameTimers,0);
 const revisionRecord=JSON.parse(JSON.stringify(current));revisionRecord.session.environment.buildRevision='cg-recovery-test';
 const exported=boot(revisionRecord);await settle();const text=(await exported.c.LUNAR.api.diagnostics.exportPrevious()).text;assert(text.includes('Previous session did not shut down cleanly'));assert(text.includes(current.session.id));assert(text.includes('SYNODIC build revision: cg-recovery-test'));assert(!text.includes(exported.c.LUNAR.bridge.logger.snapshot().session.id));
 const olderRecord=JSON.parse(JSON.stringify(current));delete olderRecord.session.environment.buildRevision;const older=boot(olderRecord);await settle();assert((await older.c.LUNAR.api.diagnostics.exportPrevious()).text.includes('SYNODIC build revision: '));
 const failed=boot(null,true);await settle();assert.equal(failed.c.LUNAR.api.diagnostics.status().persistence,'memory');assert(failed.warnings.length);failed.evaluate("LUNAR.logger.scope('MOD.example').info('still running')");assert.equal(failed.c.LUNAR.bridge.logger.snapshot().entries.at(-1).message,'still running');assert.equal(await failed.c.LUNAR.bridge.logger.checkpoint(),false);
 console.log('PASS Logger 1500 ring, stable header/RNG, five levels/order, redaction/getters, exception breadcrumbs/checkpoint, BFCache/no rotation, previous-only API and storage failure');
})().catch(error=>{console.error(error);process.exitCode=1;});
