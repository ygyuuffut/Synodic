/* Geometry acceptance of the painted halo, after finite scroll/lift settles. */
const assert=require('node:assert/strict');
async function clearance(root){const g=await root.locator('.MOONSHINE-combat-selected').evaluate(e=>{const card=e.firstChild,r=card.getBoundingClientRect(),rail=e.parentElement.parentElement.getBoundingClientRect();return {left:r.left-rail.left,right:rail.right-r.right,top:r.top-rail.top,bottom:rail.bottom-r.bottom,shadow:getComputedStyle(card).boxShadow,scroll:e.parentElement.parentElement.scrollLeft};});for(const side of ['left','right','top','bottom'])assert(g[side]>=13,JSON.stringify(g));assert.notEqual(g.shadow,'none');return g;}
module.exports={clearance};
