/* Material Symbols use the existing SVG. Font events cannot change that slot. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../moonshine/moonshine.component.symbols.cjs'),'utf8');
const context={window:{},document:{fonts:[]},LUNAR:{api:{moonshine:{fonts:{owns:family=>['SYNODIC Mono','SYNODIC Ui'].includes(String(family).replace(/["']/g,''))}}}}};vm.createContext(context);vm.runInContext(source,context);
assert(!/googleapis|gstatic|new FontFace|fonts\.load/.test(source));assert.equal(context.window.MOONSHINE_SYMBOLS.exclusiveFontEvent({fontfaces:[{family:'SYNODIC Mono'}]}),true);assert.equal(context.window.MOONSHINE_SYMBOLS.exclusiveFontEvent({fontfaces:[{family:'Unknown'}]}),false);context.window.MOONSHINE_SYMBOLS.load().then(value=>{assert.equal(value,false);console.log('PASS SVG-only Material Symbols; registered resource ownership has no remote loader');});
