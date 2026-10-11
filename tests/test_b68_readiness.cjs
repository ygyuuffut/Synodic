/* Tier gates, stale cancellation and decode policy without remote completion. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),root=path.resolve(__dirname,'..');
const turn=()=>new Promise(r=>setImmediate(r));
function assets(rows){
 const entries=[],requests=[],timers=new Map();let seq=0,transitionFailure=null;
 const config={profiles:{mobile:{available:true}},assets:rows,initialScene:'map',timeoutMs:8000};
 const context={performance,Promise,Map,Set,Object,AbortController,DOMException,innerWidth:400,STG_DISPLAY_CONFIG:{detectMode:()=> 'mobile'},document:{getElementById:()=>({textContent:JSON.stringify(config)})},setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),addEventListener:()=>{},fetch:(url,options)=>new Promise((resolve,reject)=>{requests.push({url,options,resolve:()=>resolve({ok:true,blob:async()=>({size:10})}),reject});options.signal.addEventListener('abort',()=>reject(new DOMException('abort','AbortError')));}),LUNAR:{adapter:{},buffer:{getScope:()=>1},bridge:{resources:{current:()=>[],context:()=>({id:'map',scope:1})}},transitions:{locked:()=>false,ready:async()=>{},failed:async error=>{transitionFailure=error;}},logger:{scope:()=>Object.fromEntries(['debug','info','warn','error'].map(level=>[level,(...args)=>entries.push({level,args})]))}}};
 context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'lunar/lunar.assets.core.cjs'),'utf8'),context);
 return {api:context.LUNAR.assets,requests,entries,failure:()=>transitionFailure};
}
const row=(id,tier)=>({id,source:'https://fixture/'+id,profiles:{mobile:'https://fixture/'+id},pack:'map',critical:true,readiness:tier,failurePolicy:'continue'});
function scene(tier){
 let listener,created=0;const errors=[];
 function node(){return {style:{setProperty:()=>{}},classList:{add:()=>{},remove:()=>{}},setAttribute:()=>{},append:()=>{},getBoundingClientRect:()=>({width:400})};}
 const bg=node(),rootNode={querySelector:()=>null,querySelectorAll:selector=>selector.includes('stg-body')?[]:[bg]};
 const api={assets:{presentation:()=>({criticalURLs:tier==='critical'?['https://fixture/background']:[],unavailable:[],decodeTimeoutMs:2}),readiness:()=>({tier})},timing:{ui:fn=>fn()},logger:{scope:()=>({error:(...args)=>errors.push(args)})},transitions:{subscribe:fn=>listener=fn}};
 const context={performance,Promise,Set,Image:class{constructor(){created++;}set src(value){this.value=value;setImmediate(()=>this.onerror?.());}removeAttribute(){}},setTimeout,clearTimeout,matchMedia:()=>({matches:true}),getComputedStyle:()=>({display:'block',backgroundImage:'url("https://fixture/background")',backgroundColor:'#000',backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat',width:'400px'}),document:{createElement:node,createElementNS:node,body:{append:()=>{}}},LUNAR:{api:{moonshine:api}},MOONSHINE_RUNTIME:{root:()=>rootNode}};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'moonshine/moonshine.view.scene_transition.cjs'),'utf8'),context);return {finish:()=>context.MOONSHINE_SCENE_TRANSITION.prepare(),created:()=>created,errors};
}
(async()=>{
 const visual=assets([row('background','important'),row('cg','decorative')]);visual.api.start();await visual.api.presented('map');assert(!visual.api.locked());assert.equal(visual.api.status().pending,2);assert(visual.entries.some(e=>e.args[0]==='UI_READY'));assert(Object.isFrozen(visual.api.readiness('background')));
 assert(visual.requests.every(r=>r.options.priority==='low'));visual.requests[0].reject(Error('slow visual unavailable'));await turn();assert.equal(visual.api.status().failedVisual,1);assert.equal(visual.api.status().failedCritical,0);assert(!visual.entries.some(e=>e.level==='error'));assert(visual.entries.some(e=>e.args[0]==='ASSET_VISUAL_UNAVAILABLE'));
 const required=assets([row('essential','critical')]);required.api.start();const ready=required.api.presented('map');await turn();assert(required.api.locked());assert(!required.entries.some(e=>e.args[0]==='UI_READY'));required.requests[0].reject(Error('critical fixture failure'));await ready;assert.equal(required.failure().message,'critical fixture failure');assert.equal(required.api.status().failedCritical,1);assert(required.entries.some(e=>e.level==='error'&&e.args[0]==='PACK_LOAD_FAILED'));
 const cancelled=assets([row('essential','critical')]);cancelled.api.start();const stale=cancelled.api.presented('map');await turn();cancelled.api.navigation();await stale;assert(!cancelled.entries.some(e=>e.args[0]==='UI_READY'),'cancelled work cannot announce readiness');
 for(const tier of ['important','decorative']){const view=scene(tier);await view.finish();assert.equal(view.created(),0,'noncritical background must not create a blocking decode consumer');}
 const critical=scene('critical');await assert.rejects(critical.finish(),/Critical artwork/);assert.equal(critical.created(),1);
 const transitions=fs.readFileSync(path.join(root,'lunar/lunar.transitions.core.cjs'),'utf8');assert(transitions.includes("failed(new Error('Scene preparation timed out'));},12000)"));
 console.log('PASS UI_READY independent of important/decorative work, WARN classification/counters, genuine critical failure, stale cancellation, critical-only decode and unchanged 12s watchdog');
})().catch(e=>{console.error(e);process.exitCode=1;});
