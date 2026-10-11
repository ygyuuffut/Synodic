/* Existing workflow tests target the owned tree; DOM evaluations still inspect
   native state deliberately. Desktop delegation is tested with native selectors. */
function convert(selector){return selector.replace(/#([\w-]+)/g,'[data-ms-id="$1"]').replace(/\.(-?[a-zA-Z_][\w-]*)/g,'[data-ms-class~="$1"]');}
module.exports=function(page){
 const native=page.locator.bind(page);
 function mark(locator){
  if(locator._msTestWrapped)return locator;locator._msTestWrapped=true;
  for(const method of ['locator','first','last','nth','filter','getByRole','getByText','getByLabel']){
   const original=locator[method].bind(locator);
   locator[method]=function(...args){if(method==='locator'&&typeof args[0]==='string'&&!args[0].startsWith('internal:'))args[0]=`:is(${convert(args[0])},${args[0]})`;return mark(original(...args));};
  }
  const evaluate=locator.evaluate.bind(locator);
  locator.evaluate=function(fn,arg){
    if(typeof fn!=='function')return evaluate(fn,arg);
    const script=`(el,arg)=>{const callback=${fn.toString()}; if(el.closest('#MOONSHINE-root')){const convert=${convert.toString()}; const all=[el,...el.querySelectorAll('*')];for(const node of all){node.querySelector=selector=>Element.prototype.querySelector.call(node,convert(selector));node.querySelectorAll=selector=>Element.prototype.querySelectorAll.call(node,convert(selector));}}return callback(el,arg);}`;
    return evaluate(new Function("return ("+script+");")(),arg);
  };
  for(const method of ['click','press']){
   const original=locator[method].bind(locator);locator[method]=async function(...args){const result=await original(...args);await page.evaluate(async()=>{if(window.MOONSHINE_RUNTIME)await MOONSHINE_RUNTIME.flush();});return result;};
  }
  return locator;
 }
 for(const method of ['getByRole','getByText','getByLabel']){const query=page[method].bind(page);page[method]=(...args)=>mark(query(...args));}
 page.locator=function(selector,...args){
  if(selector==='body'||selector==='html'||selector.startsWith('#MOONSHINE-root')||/^#stg-noto-.*font/.test(selector))return mark(native(selector,...args));
  return mark(native(`:is(#MOONSHINE-root :is(${convert(selector)}), body:not(.stg-mobile-ui):not(:has(#MOONSHINE-root)) :is(${selector}))`,...args));
 };
};
