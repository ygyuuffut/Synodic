/* Compatibility, boot decisions, persistence failure and immutable snapshots. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=require('./helpers/synodic-test-paths.cjs').root;
const entries=[{id:'lunar',core:true,apiVersion:'0.1',version:'0.1'},{id:'moonshine',core:true,version:'0.1',requiresApi:'>=0.1'},{id:'optional',version:'0.1',requiresApi:'>=0.1'},{id:'future',version:'1',requiresApi:'>=0.2'},{id:'invalid',version:'1',requiresApi:'nonsense'}];
function boot(saved={},blocked=false){const storage=new Map([['SYNODIC.mods.enabled.v1',JSON.stringify(saved)]]),ctx={window:null,LUNAR:{adapter:{},bridge:{},logger:require("./helpers/logger-stub.cjs")()},document:{getElementById:id=>id==='LUNAR-mod-catalog'?{textContent:JSON.stringify(entries)}:null,documentElement:{}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>{if(blocked)throw new Error('blocked');storage.set(k,v);}},innerWidth:400,innerHeight:760,getComputedStyle:()=>({zoom:'1'})};ctx.window=ctx;vm.createContext(ctx);for(const f of ['lunar.adapter.mods.cjs','lunar.bridge.mods.cjs'])vm.runInContext(fs.readFileSync(path.join(root,'lunar',f),'utf8'),ctx);return {ctx,storage};}
const {ctx,storage}=boot({lunar:false,moonshine:false}),A=ctx.LUNAR.adapter.mods,B=ctx.LUNAR.bridge.mods;
assert.equal(A.compare('0.10','0.2'),1);assert.equal(A.compare('0.1','0.1.0'),0);assert.equal(A.compare('bad','0.1'),null);
assert(A.satisfies('0.1','>=0.1'));assert(!A.satisfies('0.1','>=0.2'));assert(!A.satisfies('0.1','>=bad'));assert(A.satisfies('0.1','<0.2'));assert(!A.satisfies('0.1','>0.1'));
assert(B.shouldLoad('lunar'));assert(B.shouldLoad('moonshine'));assert(B.shouldLoad('optional'));assert(!B.shouldLoad('future'));assert(!B.shouldLoad('invalid'));assert(!B.shouldLoad('absent'));
assert.equal(B.setEnabled('lunar',false).ok,false);assert.equal(B.setEnabled('future',true).ok,false);assert.equal(B.setEnabled('absent',true).ok,false);
assert(B.setEnabled('optional',false).ok);assert(B.shouldLoad('optional'),'current session stays active');assert(B.read().modules.find(m=>m.id==='optional').pending);
const restarted=boot(JSON.parse(storage.get('SYNODIC.mods.enabled.v1')));assert(!restarted.ctx.LUNAR.bridge.mods.shouldLoad('optional'));
const copy=B.read();copy.modules[0].title='changed';assert.notEqual(B.read().modules[0].title,'changed');
const blocked=boot({},true).ctx.LUNAR.bridge.mods;assert.equal(blocked.setEnabled('optional',false).error,'storage-unavailable');assert(blocked.read().modules.find(m=>m.id==='optional').enabled);
// The eligibility path must avoid style/layout reads and keep the full DTO contract.
let styleReads=0,settings=false,outgoing=false,gate=false,mainPresent=true,title=true;
ctx.getComputedStyle=()=>{styleReads++;return {zoom:'1.25'};};
const main={querySelector:()=>settings?null:{querySelector:()=>title?{}:null},closest:()=>outgoing?{}:null};
ctx.document.getElementById=id=>id==='stg-menu-root'&&mainPresent?main:null;
ctx.document.querySelector=()=>gate?{}:null;
for(const key of ['eligible','settings','outgoing','gate','missing','title']){
 settings=key==='settings';outgoing=key==='outgoing';gate=key==='gate';mainPresent=key!=='missing';title=key!=='title';
 const before=styleReads,context=B.context();assert.equal(styleReads,before,'context cannot read computed style');
 assert.equal(context.mainMenu,key==='eligible');assert.equal(B.read().mainMenu,context.mainMenu);assert.equal(styleReads,before+1);assert.equal(B.read().viewport.scale,1.25);
 context.mainMenu='mutated';assert.equal(B.context().mainMenu,key==='eligible');
}
console.log('PASS numeric API versions, core lock, incompatible/unknown MODs, restart-only state, copies and blocked browser storage');
