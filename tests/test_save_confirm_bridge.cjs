/* Narrow slot-name normalization, callback identity and mobile-only routing. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),reads=[],names=[' Dev Save ','','第二份存檔 <b>& "測試"'];
const c={LUNAR:{adapter:{},bridge:{},logger:require('./helpers/logger-stub.cjs')()},stgReadSaveSlot:i=>{reads.push(i);return {saveName:names[i]};}};c.window=c;vm.createContext(c);
for(const f of ['lunar.adapter.saves.cjs','lunar.bridge.saves.cjs'])vm.runInContext(fs.readFileSync(path.join(root,'lunar',f),'utf8'),c);
const normalize=c.LUNAR.bridge.saves.confirmOptions,callback=()=>{},cancel=()=>{};
const load=i=>({title:`Load Slot ${i+1}?`,body:'Your current in-memory run will be replaced.',okLabel:'Load',cancelLabel:'Cancel',onConfirm:callback,onCancel:cancel});
const overwrite=i=>({...load(i),title:`Overwrite Slot ${i+1}?`,body:'The existing save will be lost.',okLabel:'Overwrite'});
for(const input of [load(0),overwrite(0)]){
 const out=normalize(input);assert.equal(out.title,`${input.okLabel} Dev Save?`);assert.equal(input.title,`${input.okLabel} Slot 1?`);
 assert.equal(out.onConfirm,callback);assert.equal(out.onCancel,cancel);assert.equal(out.body,input.body);
}
assert.equal(normalize(load(2)).title,'Load 第二份存檔 &lt;b&gt;&amp; &quot;測試&quot;?');
const blank=load(1);assert.equal(normalize(blank),blank);names[0]='New Name';assert.equal(normalize(load(0)).title,'Load New Name?');
const imported={title:'All Slots Full',body:'Overwrite Slot 1 with the imported save?',okLabel:'Overwrite',onConfirm:callback};
assert.equal(normalize(imported).body,'Overwrite New Name with the imported save?');
reads.length=0;
for(const other of [undefined,{},load(3),{...load(0),body:'Unrelated message'},{title:'Load Autosave?',okLabel:'Load'},{title:'Delete Slot 1?',okLabel:'Delete'}])assert.equal(normalize(other),other);
assert.equal(reads.length,0,'unrelated dialogs never read storage');
c.stgReadSaveSlot=()=>null;const missing=overwrite(0);assert.equal(normalize(missing),missing);
// Exercise the actual compatibility route, including desktop delegation.
let mode='mobile',nativeCalls=0,deliveries=0;
c.STG_DISPLAY_CONFIG={detectMode:()=>mode};c.Node=class{};c.document={readyState:'loading',addEventListener(){}};
c.LUNAR.logger=require('./helpers/logger-stub.cjs')();c.LUNAR.adapter.data={snapshot:v=>v};c.stgReadSaveSlot=i=>{reads.push(i);return {saveName:'Current Name'};};
c.stgShowConfirmModal=options=>{nativeCalls++;return options;};
vm.runInContext(fs.readFileSync(path.join(root,'lunar/lunar.bridge.port.cjs'),'utf8'),c);
c.LUNAR.bridge.port.route('stgShowConfirmModal',args=>{deliveries++;return args[0];});
assert.equal(c.stgShowConfirmModal(load(0)).title,'Load Current Name?');assert.equal(reads.length,1);assert.equal(nativeCalls,0);assert.equal(deliveries,1);
mode='desktop';assert.equal(c.stgShowConfirmModal(load(0)).title,'Load Slot 1?');assert.equal(reads.length,1);assert.equal(nativeCalls,1);assert.equal(deliveries,1);
console.log('PASS save confirmation bridge: one-slot current name, literal escaping, fallback, unchanged callbacks/options, unrelated dialogs and desktop');
