/* Native card costs and counters are distinct; readonly normalization cannot spend uses. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={LUNAR:{adapter:{}}};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../lunar/lunar.adapter.cards.cjs'),'utf8'),context);
const a=context.LUNAR.adapter.cards,plain=x=>JSON.parse(JSON.stringify(x));
for(const value of [-123,-1,0,1,12]){const c={name:'Cost case',type:'skill',subtype:'Grace',cost:value};assert.deepEqual(plain(a.thumbnail(c,null,true,'art').cost),{value,magnitude:String(Math.abs(value)),kind:value<0?'negative':value===0?'zero':'positive'});assert.equal(c.cost,value);}
for(const cost of [undefined,null,NaN,Infinity,'1'])assert.equal(a.thumbnail({name:'No numeric cost',cost},null,true,null).cost,null);
assert.equal(a.thumbnail({name:'Unplayable',cost:1,unplayable:true},'Condition',true,null).cost,null);
const item={name:'Tool',type:'tool',subtype:'Food',cost:0,maxUses:3,toolUses:1},before=JSON.stringify(item);assert.equal(a.family(item),'Item');assert.deepEqual(plain(a.thumbnail(item,null,true,'art').uses),{kind:'limited',remaining:1,maximum:3});assert.equal(JSON.stringify(item),before);
assert.deepEqual(plain(a.thumbnail({...item,toolUses:undefined},null,true,'art').uses),{kind:'limited',remaining:3,maximum:3});assert.equal(a.thumbnail({...item,toolUses:0},null,true,'art').uses.remaining,0);
assert.equal(a.thumbnail({name:'Worship',type:'skill',subtype:'Worship',cost:-1,curseLevel:4,curseMax:5},null,true,'art').uses.kind,'unlimited','Worship risk counter is not an item use limit');
assert.equal(a.thumbnail({name:'Consume',cost:1,exhaustsOnPlay:true},null,true,'art').uses.kind,'unlimited','temporary exhaust flag must not invent a run-use counter');
assert.deepEqual(plain(a.thumbnail(item,'Item',false,'secret-art')),{schema:1,revealed:false,name:'Undiscovered',family:null,cost:null,uses:null,image:null});
console.log('PASS readonly thumbnail adapter: signed/missing/unplayable costs, current/default/depleted uses, Worship/Consume distinction, no mutation and undiscovered face redaction');
