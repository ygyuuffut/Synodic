/* Test-only crossing-line raster check: opaque shells must hide either color. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function inspect(page,{out,tag='map-opaque'}={}){
 const unavailable=page.locator('.MOONSHINE-map-node[data-current="false"][data-available="false"]');const node=(await unavailable.count()?unavailable:page.locator('.MOONSHINE-map-node[data-current="false"]')).first();await node.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
 const saved=await node.evaluate(b=>{const graph=b.closest('.MOONSHINE-map-canvas'),line=graph.querySelector('line'),svg=graph.querySelector('.MOONSHINE-map-edges'),v=svg.viewBox.baseVal,x=v.x+parseFloat(b.style.left)/100*v.width,y=v.y+parseFloat(b.style.top)/100*v.height,attrs=Array.from(line.attributes,a=>[a.name,a.value]);window.mapPaintLine={line,attrs};line.setAttribute('x1',x-500);line.setAttribute('x2',x+500);line.setAttribute('y1',y);line.setAttribute('y2',y);line.style.setProperty('stroke-width','12','important');const r=b.getBoundingClientRect();return {rect:r.toJSON(),opacity:getComputedStyle(b).opacity,canvasRect:graph.getBoundingClientRect().toJSON(),shellRect:b.querySelector('svg>rect').getBoundingClientRect().toJSON()};});
 let r,clip,pngs=[],settled=false;const movements=[],deadline=Date.now()+5000;
 const rect=()=>node.evaluate(b=>b.getBoundingClientRect().toJSON()),equal=(a,b)=>['x','y','width','height'].every(k=>Math.abs(a[k]-b[k])<.1);
 try{
 // A viewport/mount focus operation can finish after UI_READY. This visual
 // oracle samples the same painted node twice; it never gates functional ready.
 do{r=await rect();await page.waitForTimeout(150);const next=await rect();if(!equal(r,next)){movements.push({before:r,after:next});continue;}clip={x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width)+1,height:Math.ceil(r.height)+1};pngs=[];settled=true;
  for(const color of ['#ff00ff','#00ffff']){await page.evaluate(c=>mapPaintLine.line.style.setProperty('stroke',c,'important'),color);pngs.push(await page.screenshot({clip}));const after=await rect();if(!equal(r,after)){movements.push({before:r,after});settled=false;break;}}
 }while(!settled&&Date.now()<deadline);
 if(out)fs.writeFileSync(path.join(out,tag+'-geometry.json'),JSON.stringify({settled,movements,rect:r},null,2));assert(settled,'map paint comparison never reached stable node geometry within 5s');
 const pixels=await page.evaluate(async({images,r,clip})=>{const output=[];for(const src of images){const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src=src;});const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const c=canvas.getContext('2d');c.drawImage(img,0,0);const k=img.naturalWidth/clip.width;output.push([6,r.width-6].map(x=>Array.from(c.getImageData(Math.floor((r.x-clip.x+x)*k),Math.floor((r.y-clip.y+r.height/2)*k),1,1).data).slice(0,3)));}return output;},{images:pngs.map(b=>'data:image/png;base64,'+b.toString('base64')),r,clip});
 if(out){for(let i=0;i<pngs.length;i++)fs.writeFileSync(path.join(out,tag+'-'+i+'.png'),pngs[i]);}
 const difference=Math.max(...pixels[0].flatMap((p,i)=>p.map((v,j)=>Math.abs(v-pixels[1][i][j]))));assert.equal(saved.opacity,'1');assert(difference<=3,JSON.stringify({pixels,difference,saved,movements}));const result={...saved,rect:r,movements,pixels,difference,opaque:true};if(out){for(let i=0;i<pngs.length;i++)fs.writeFileSync(path.join(out,tag+'-'+i+'.png'),pngs[i]);fs.writeFileSync(path.join(out,tag+'.json'),JSON.stringify(result,null,2));}return result;
 }finally{await page.evaluate(()=>{const {line,attrs}=mapPaintLine;for(const a of Array.from(line.attributes))line.removeAttribute(a.name);for(const [k,v] of attrs)line.setAttribute(k,v);delete window.mapPaintLine;});}
}
module.exports={inspect};
