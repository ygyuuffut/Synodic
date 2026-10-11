/* Retired native callbacks must neither retain detached nodes nor trip recovery. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class SourceNode { constructor(){this.nodeType=1;this.isConnected=true;this.retired=false;} closest(){return this.retired?this:null;} }
const context={Node:SourceNode,Map,WeakMap,Set,queueMicrotask,document:{readyState:'loading',addEventListener(){}},LUNAR:{logger:require('./helpers/logger-stub.cjs')(),adapter:{data:{snapshot:v=>v}},bridge:{pause:{game:f=>f(),ui:f=>f()}}}};
context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','lunar','lunar.bridge.port.cjs'),'utf8'),context);
const port=context.LUNAR.bridge.port,node=new SourceNode();let calls=0;
function callback(){assert.equal(this,node);calls++;return calls;}
const value=port.pack(callback,node);assert.equal(value.transient,true);assert.equal(port.invoke(value.LUNARcall,[]),1);
node.isConnected=false;port.collect();assert.equal(port.invoke(value.LUNARcall,[]),false);assert.equal(calls,1);
// A detached/reinserted source can publish the same function again.
node.isConnected=true;assert.equal(port.retain(callback,node),value.LUNARcall);assert.equal(port.invoke(value.LUNARcall,[]),2);
node.retired=true;port.collect();assert.equal(port.invoke(value.LUNARcall,[]),false);assert.equal(calls,2);
const globalValue=port.pack(()=>42,context);assert.equal(globalValue.transient,undefined);port.collect();assert.equal(port.invoke(globalValue.LUNARcall,[]),42);
assert.throws(()=>port.invoke('LUNAR-call-99999',[]),/Expired LUNAR action/);assert.throws(()=>port.invoke('unknown',[]),/Expired LUNAR action/);
console.log('PASS live/reinserted/global callbacks, retired source no-op and unknown action rejection');
