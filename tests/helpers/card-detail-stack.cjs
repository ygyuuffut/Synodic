/* During-detail paint order and identity, rather than restoration-only checks. */
const assert=require('node:assert/strict');
async function remember(page){await page.evaluate(()=>{
 const menu=document.querySelector('.MOONSHINE-actions-panel'),panel=document.getElementById('MOONSHINE-card-panel');
 window.nestedCardParents={menu,list:menu.querySelector('.MOONSHINE-actions-list'),row:menu.querySelector('.MOONSHINE-action-open'),panel,rail:panel.querySelector('.MOONSHINE-combat-hand-scroll'),card:panel.querySelector('[aria-pressed="true"]')};
 const p=nestedCardParents;p.menuScroll=p.list.scrollTop;p.cardScroll=p.rail.scrollLeft;
});}
async function check(page){const g=await page.evaluate(()=>{
 const p=window.nestedCardParents,detail=document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]'),main=document.getElementById('MOONSHINE-root'),actions=document.getElementById('MOONSHINE-actions-root');
 const same=p.menu===document.querySelector('.MOONSHINE-actions-panel')&&p.panel===document.getElementById('MOONSHINE-card-panel')&&p.list.isConnected&&p.row.isConnected&&p.card===p.panel.querySelector('[aria-pressed="true"]');
 // Isolate each dimmed parent for hit testing without modifying the scene or
 // its paint order. The foreground detail/shade otherwise intercept every hit.
 const visibility=detail.style.visibility,menuInert=p.menu.inert,panelInert=p.panel.inert;detail.style.visibility='hidden';p.menu.inert=p.panel.inert=false;
 function paint(target){const r=target.getBoundingClientRect(),chain=document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2),parent=chain.findIndex(el=>el===target||target.contains(el)),scene=chain.findIndex(el=>el===main||el.closest('#MOONSHINE-scene'));return {parent:parent>=0,sceneBelow:parent>=0&&scene>parent&&Number(getComputedStyle(actions).zIndex)>Number(getComputedStyle(main).zIndex)};}
 const menuPaint=paint(p.menu.querySelector('.MOONSHINE-actions-head')),panelPaint=paint(p.panel.querySelector('footer'));
 detail.style.visibility=visibility;p.menu.inert=menuInert;p.panel.inert=panelInert;
 const r=detail.getBoundingClientRect(),card=detail.querySelector('[data-ms-class~="stg-md-card"]').getBoundingClientRect();
 return {same,menuScroll:p.list.scrollTop===p.menuScroll,cardScroll:p.rail.scrollLeft===p.cardScroll,menuPaint,panelPaint,topLayer:detail.matches(':popover-open'),keyedScene:detail.closest('#MOONSHINE-scene')!==null,menuInert,panelInert,focus:detail.contains(document.activeElement),rect:r.toJSON(),cardRect:card.toJSON(),viewport:{width:innerWidth,height:innerHeight},pause:LUNAR.api.moonshine.timing.active()};
});
 for(const key of ['same','menuScroll','cardScroll','topLayer','keyedScene','menuInert','panelInert','focus','pause'])assert.equal(g[key],true,JSON.stringify(g));
 for(const key of ['menuPaint','panelPaint'])assert(g[key].parent&&g[key].sceneBelow,JSON.stringify(g));
 assert(Math.abs(g.rect.x)<1&&Math.abs(g.rect.y)<1&&Math.abs(g.rect.width-g.viewport.width)<1&&Math.abs(g.rect.height-g.viewport.height)<1,JSON.stringify(g));
 assert(g.cardRect.x>=0&&g.cardRect.y>=0&&g.cardRect.right<=g.viewport.width+1&&g.cardRect.bottom<=g.viewport.height+1,JSON.stringify(g));
 return g;
}
async function returned(page){assert(await page.evaluate(()=>{const p=nestedCardParents;return p.menu===document.querySelector('.MOONSHINE-actions-panel')&&p.panel===document.getElementById('MOONSHINE-card-panel')&&p.card===p.panel.querySelector('[aria-pressed="true"]')&&p.list.scrollTop===p.menuScroll&&p.rail.scrollLeft===p.cardScroll&&p.menu.inert&&!p.panel.inert&&document.activeElement===p.card&&!document.querySelector(':popover-open');}));}
module.exports={remember,check,returned};
