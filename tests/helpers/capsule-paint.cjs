/* Inspect screenshot pixels along the inner right arc, where child fill left a seam. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function inspect(page,{out,tag='capsules',required=true}={}){
 const report=[];
 for(const [i,capsule] of (await page.locator('#MOONSHINE-combat .MOONSHINE-combat-capsule[data-split="true"]').all()).entries()){
  const g=await capsule.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,radius:Math.min(parseFloat(s.borderTopRightRadius),r.height/2,r.width/2),color:s.color,gradient:s.backgroundImage,maximum:getComputedStyle(e.lastChild).backgroundColor};});
  const clip={x:Math.floor(g.x)-2,y:Math.floor(g.y)-2,width:Math.ceil(g.width)+5,height:Math.ceil(g.height)+5},png=await page.screenshot({clip});
  if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,tag+'-'+i+'.png'),png);}
  const pixels=await page.evaluate(async({src,g,clip})=>{
   const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=src;});
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   const scale=image.naturalWidth/clip.width,expected=g.color.match(/\d+/g).slice(0,3).map(Number),radius=g.radius-1.15;
   return [-80,-65,-45,-25,0,25,45,65,80].map(angle=>{const t=angle*Math.PI/180,x=g.x+g.width-g.radius+radius*Math.cos(t),y=g.y+g.height/2+radius*Math.sin(t),rgb=Array.from(ctx.getImageData(Math.floor((x-clip.x)*scale),Math.floor((y-clip.y)*scale),1,1).data).slice(0,3);return {angle,rgb,difference:Math.max(...rgb.map((v,j)=>Math.abs(v-expected[j])))};});
  },{src:'data:image/png;base64,'+png.toString('base64'),g,clip});
  report.push({...g,pixels});
 }
 assert.equal(report.length,3);
 if(out)fs.writeFileSync(path.join(out,tag+'.json'),JSON.stringify(report,null,2));
 if(required)for(const g of report)assert(g.pixels.every(p=>p.difference<=18),JSON.stringify(g));
 return report;
}
async function notation(page){const value=await page.locator('#MOONSHINE-combat').evaluate(root=>({hp:Array.from(root.querySelectorAll('.MOONSHINE-combat-hp>.MOONSHINE-combat-icon')).map(e=>({text:e.textContent,attribute:e.getAttribute('translate'),translate:e.translate})),numbers:Array.from(root.querySelectorAll('.MOONSHINE-combat-capsule[data-split="true"]>span')).map(e=>e.translate),prose:root.querySelector('.MOONSHINE-combat-enemy-name').translate&&root.querySelector('.MOONSHINE-combat-flavor').translate&&root.querySelector('.MOONSHINE-combat-intent').translate}));assert.equal(value.hp.length,2);assert(value.hp.every(e=>e.text==='HP'&&e.attribute==='no'&&!e.translate),JSON.stringify(value));assert(value.numbers.every(v=>!v));assert(value.prose);return value;}
module.exports={inspect,notation};
