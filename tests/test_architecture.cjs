/* Dependency boundaries, data-only buffers and manifest integrity. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'modules.json'),'utf8'));
assert.equal(new Set(manifest.modules).size,manifest.modules.length);
for(const file of [...manifest.modules,...Object.values(manifest.optional).flatMap(p=>p.modules)]){
 if(!manifest.modules.includes(file)&&!fs.existsSync(path.join(root,file)))continue; // Public checkout omits private MOD sources.
 const source=fs.readFileSync(path.join(root,file),'utf8');
 if(file.startsWith('moonshine/')){assert(!/fonts\.(?:googleapis|gstatic)\.com|new FontFace|document\.fonts\.load|viewDocument\.fonts\.load/.test(source),file+' owns font resource loading');assert(!/HECATE|hecate/.test(source),file+' knows a plugin');assert(!/LUNAR\.(?:buffer|bridge|adapter)/.test(source),file+' bypasses consumer API');assert(!/(?:window|globalThis|self)\.(?:_STG|_stg|stg[A-Z]|SugarCube)/.test(source),file+' reaches native globals');assert(!/\bonclick\s*=\s*["\']/.test(source),file+' executes native inline handlers');}
 if(file.startsWith('lunar/'))assert(!/\b(?:createElement|createElementNS|createTextNode)\b|\.focus\(|\.style\.(?:setProperty|cssText\s*=)/.test(source),file+' handles UI rendering/focus');
 if(file.includes('lunar.buffer.')){assert(!/\b(?:document|setTimeout|requestAnimationFrame)\b|L\.(?:api|bridge)|B\.(?:interfaces|native)/.test(source),file+' contains commands/presentation');}
 if(file.startsWith('hecate/')){assert(!/LUNAR\.(?:buffer|bridge|adapter)|LUNAR\.api\.moonshine|\b_STG\b|\bstg[A-Z]/.test(source),file+' bypasses plugin API');}
}
assert(!manifest.modules.some(f=>f.startsWith('hecate/')),'HECATE must be optional');
assert(!manifest.modules.includes('lunar/lunar.api.hecate.cjs'),'Private MOD API must not be in Core');
assert(manifest.optional.hecate.modules.includes('lunar/lunar.api.hecate.cjs'),'Private API belongs to optional MOD install');
assert.deepEqual(manifest.project.coreParts,['LUNAR','MOONSHINE']);
for(const layer of ['lunar','moonshine'])assert(manifest.modules.some(f=>f.startsWith(layer+'/')),'Runtime lacks '+layer);
const context={};context.window=context;vm.createContext(context);
for(const file of manifest.modules.filter(f=>f.includes('lunar.buffer.')||f.includes('lunar.adapter.data')||f.includes('lunar.adapter.game')))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const L=context.LUNAR;assert.equal(L.buffer.interfaces,undefined);assert.equal(L.buffer.native,undefined);assert.deepEqual(Array.from(L.buffer.domains),['game','story','shop','presentation','ui']);
L.buffer.game.write('current',{player:{hp:50}});const copy=L.buffer.game.read('current');copy.player.hp=999;assert.equal(L.buffer.game.read('current').player.hp,50);
const normalized=L.adapter.game.normalize({player:{hp:50,chaos:2,grace:3},masterDeck:[{id:'card'}],ownedBoons:['B']},'run-1');assert.equal(normalized.schema,1);assert.equal(normalized.run,'run-1');assert.equal(normalized.inventory.deck[0].id,'card');
console.log('PASS strict layer imports, no plugin knowledge, command-free buffers, optional plugin manifest and schema copies');

// Type selector routing must preserve identifiers containing body/html.
const styleContext={LUNAR:{api:{moonshine:{fonts:{styles:value=>value}}}}};styleContext.window=styleContext;vm.createContext(styleContext);
vm.runInContext(fs.readFileSync(path.join(root,'moonshine/moonshine.view.style_adapter.cjs'),'utf8'),styleContext);
const rendered=styleContext.MOONSHINE_STYLE_ADAPTER.convert([[{type:1,selectorText:'body.stg-mobile-ui #stg-body-root .stg-mobile-tall-body, html .body-exit-btn, .html-card',style:'color:red'}]]);
assert(rendered.includes('#MOONSHINE-root.MOONSHINE-mode-stg-mobile-ui [data-ms-id="stg-body-root"] [data-ms-class~="stg-mobile-tall-body"]'));
assert(rendered.includes('#MOONSHINE-root [data-ms-class~="body-exit-btn"]'));
assert(rendered.includes('#MOONSHINE-root [data-ms-class~="html-card"]'));
console.log('PASS standalone document selectors and body/html component aliases');
