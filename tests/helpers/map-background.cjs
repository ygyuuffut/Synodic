/* Actual background pixels below the bounded Lab map, not just CSS geometry. */
const assert=require('node:assert/strict'),{PNG}=require('pngjs');
exports.check=async function(page,{deadlineMs=45000}={}){
 const geometry=await page.evaluate(()=>{const root=document.querySelector('#MOONSHINE-root [data-ms-id="stg-lab-root"]'),bg=root.querySelector('[data-ms-class~="lab-bg"]');return {colour:getComputedStyle(root).backgroundColor,background:bg.getBoundingClientRect().toJSON()};});
 const viewport=page.viewportSize();assert.equal(geometry.colour,'rgba(0, 0, 0, 0)');assert(geometry.background.height>=viewport.height-1);
 // A native decorative Lab background is not a critical Loading asset. Wait
 // for its actual paint in this real-network test, without another fetch.
 const start=Date.now(),deadline=start+deadlineMs;let pixels;
 for(;;){const image=PNG.sync.read(await page.screenshot());
  pixels=[.85,.9,.95].map(fraction=>{const x=Math.round(image.width*.5),y=Math.round(image.height*fraction),offset=(y*image.width+x)*4;return {x:viewport.width*.5,y:viewport.height*fraction,rgba:Array.from(image.data.subarray(offset,offset+4))};});
  if(pixels.every(p=>p.rgba.slice(0,3).some((v,i)=>Math.abs(v-[14,10,20][i])>3)))return {pixels,geometry,waitMs:Date.now()-start};
  if(Date.now()>=deadline)return {status:'VISUAL_CAPTURE_DEGRADED',reason:'background-paint-deadline',pixels,geometry,waitMs:Date.now()-start};await page.waitForTimeout(250);
 }
};
