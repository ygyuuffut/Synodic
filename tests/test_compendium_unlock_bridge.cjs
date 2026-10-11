/* A request-local lookup facade must restore native document access on every exit. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const notifications=[],nativeInput={value:'native desktop'},nativeOther={id:'other'};let observedInput,calls=0,unlocked=false,fail=false;
const lookup=function(id){return id==='comp-admin-input'?nativeInput:id==='other'?nativeOther:null;};
const context={document:{getElementById:lookup},LUNAR:{bridge:{pause:{ui:fn=>fn()},port:{emit:d=>notifications.push(d)}}},stgCardsAdminUnlocked:()=>unlocked,
 stgCompTryUnlockCards:function(){calls++;observedInput=context.document.getElementById('comp-admin-input');assert.equal(context.document.getElementById('comp-admin-msg'),null);assert.equal(context.document.getElementById('other'),nativeOther);if(fail)throw Error('native failure');unlocked=observedInput.value.trim()==='12345';if(!unlocked){observedInput.value='';observedInput.focus();}}
};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../lunar/lunar.bridge.compendium.cjs'),'utf8'),context);const api=context.LUNAR.bridge.compendium;
assert.equal(api.unlockCards(null).available,false);assert.equal(calls,0);
assert.equal(api.unlockCards('bad').success,false);assert.equal(calls,1);assert.equal(context.document.getElementById,lookup);assert.equal(observedInput.value,'');assert.equal(nativeInput.value,'native desktop');assert.equal(notifications.length,0);
assert.equal(api.unlockCards(' 12345 ').success,true);assert.equal(calls,2);assert.equal(context.document.getElementById,lookup);assert.equal(observedInput.value,'');assert.equal(notifications.length,1);assert.equal(notifications[0][0],'cards');
fail=true;assert.throws(()=>api.unlockCards('private secret'),/native failure/);assert.equal(context.document.getElementById,lookup);assert.equal(observedInput.value,'');assert.equal(nativeInput.value,'native desktop');assert.equal(notifications.length,1);
console.log('PASS unlock bridge: native authority, value-only request, narrow lookup fallthrough, no password retention, no failed notification, finally restoration on exceptions');
