/* Owned ACTIONS surface. Only semantic LUNAR snapshots/actions cross the boundary. */
(function(){'use strict';var api=LUNAR.api.moonshine,C=MOONSHINE_ACTION_COMPONENTS;
 var root,menu,model,controller,unbind,overlayObserver,rows=new Map(),signature='',structuralSignature='',preview=null,nativePreview=false,returnFocus=null,opened=false,scene=null,expanded=null,scroll=0,followup=null;
 function stack(){if(!root)return;var main=document.getElementById('MOONSHINE-root'),detail=main&&main.querySelector('[data-lunar-control-role="cards.detailBackdrop"]');
  // Elevate the existing owned projection, without moving/copying it or hiding
  // either parent. Manual top-layer presentation leaves native dismissal in LUNAR.
  if(detail&&(opened||MOONSHINE_CARD_PANEL.active())&&typeof detail.showPopover==='function'&&!detail.matches(':popover-open')){detail.popover='manual';detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true');detail.tabIndex=0;detail.showPopover();api.logger.scope('MOONSHINE.actions').debug('CARD_DETAIL_LAYER',{key:detail.dataset.msKey});}
  var selector='#MOONSHINE-card-panel,[data-ms-id="stg-mobile-tiny-info"],[data-ms-id="stg-mobile-ingame-options"],[data-ms-id="stg-confirm-modal"],[data-ms-id="stg-slot-picker"],[data-ms-id="stg-mobile-deck"],[data-ms-class~="stg-card-popup-scrim"],[data-ms-id="stg-panel"]';var above=!!(main&&Array.from(main.querySelectorAll(selector)).some(function(el){return !(el.hasAttribute('popover')&&el.matches(':popover-open'))&&el.getBoundingClientRect().width&&getComputedStyle(el).visibility!=='hidden';}));root.style.zIndex=above?'2147483645':'2147483647';if(menu)menu.inert=above||!!detail||!!preview||!!followup||MOONSHINE_SCAN.isOpen();}
 function ensure(){if(root)return;root=C.element('div','actions-root');root.id='MOONSHINE-actions-root';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('translate','yes');root.addEventListener('MOONSHINE-accordion-layout',function(){C.fitSymbols(root);});document.body.append(root);unbind=MOONSHINE_ACTION_INPUT.bind(root,handle);var main=document.getElementById('MOONSHINE-root');if(main){var modal='[role="dialog"],[data-lunar-control-role="cards.detailBackdrop"]';overlayObserver=new MutationObserver(function(records){if(records.some(function(r){return Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).some(function(n){return n.nodeType===1&&(n.matches(modal)||n.querySelector(modal));});}))stack();});overlayObserver.observe(main,{childList:true,subtree:true});}}
 function dismissPreview(immediate){
  if(!preview||preview._closing&&!immediate)return;var current=preview,focus=returnFocus;returnFocus=null;
  if(current._motion)current._motion.cancel();
  function finish(){current.remove();if(preview===current){preview=null;stack();if(focus&&focus.isConnected)focus.focus({preventScroll:true});}}
  if(immediate){finish();return;}current._closing=true;
  current._motion=MOONSHINE_ANIMATION.overlay(current,current.firstElementChild,false);current._motion.finished.then(finish);
 }
 function close(){MOONSHINE_SCAN.closeStory();followup=null;nativePreview=false;if(!opened)return;dismissPreview(true);if(controller)expanded=controller.state.requested&&controller.state.requested.card.dataset.actionId;scroll=menu.querySelector('.MOONSHINE-actions-list').scrollTop;if(controller)controller.destroy();menu.remove();menu=null;controller=null;rows.clear();opened=false;signature='';structuralSignature='';api.timing.release('actions');var button=document.querySelector('#MOONSHINE-root [data-ms-class~="stg-story-actions"]');if(button)button.focus({preventScroll:true});}
 function grid(row,group){
  var holder=C.element('div','upgrade-grid');holder.dataset.msComponent='scroll';holder.dataset.kind=group.kind;var offers=offersFor(group);row.offerIds=offers.map(function(o){return o.id;}).join('|');
  offers.filter(Boolean).forEach(function(offer){var card=C.offer(offer);C.updateOffer(card,offer,!group.completed&&group.selected===offer.id);holder.append(card);});
  var bar=C.element('footer','upgrade-choice-bar'),confirm=C.button(group.completed?'Upgrade Selected':group.pending?'Applying…':'Confirm Choice','upgrade-confirm');confirm.dataset.intent='confirm';
  var selected=offers.find(function(offer){return offer.id===group.selected;});confirm.disabled=!!(group.completed||group.pending||!selected||selected.affordable===false);bar.append(confirm);row.detail.replaceChildren(holder,bar);
  if(group.completed){row.card.dataset.completed='true';if(!row.toggle.querySelector('.MOONSHINE-upgrade-complete')){row.toggle.append(C.symbol('✔'));row.toggle.lastChild.classList.add('MOONSHINE-upgrade-complete');}}
 }
 function offersFor(group){return (group.completed?[group.receipt]:group.offers.concat(group.kind==='shop'?[{id:'NONE',title:'NONE',price:0}]:[])).filter(Boolean);}
 function itemsFor(){var rank={dialogue:0,explore:1,embark:2,continue:3};return (model.scan?[{id:model.scan.id,label:'Scanning Module',category:'scan',complete:model.scan.complete}]:[]).concat(model.upgrade?[{id:'upgrade',label:model.upgrade.kind==='rest'?'Select a Card':'Select Upgrade',category:'upgrade'}]:[]).concat(model.items.slice().sort(function(a,b){return (rank[a.category]||0)-(rank[b.category]||0);}));}
 function structureKey(){return JSON.stringify({scene:model.scene,group:model.upgrade&&model.upgrade.id,items:itemsFor().map(function(item){return [item.id,item.category,item.activation];})});}
 function patchGrid(row,group){
  var offers=offersFor(group);if(row.offerIds!==offers.map(function(o){return o.id;}).join('|')){grid(row,group);return;}
  offers.forEach(function(offer){var card=row.detail.querySelector('[data-offer-id="'+CSS.escape(offer.id)+'"]');C.updateOffer(card,offer,!group.completed&&group.selected===offer.id);});
  var confirm=row.detail.querySelector('.MOONSHINE-upgrade-confirm'),label=group.completed?'Upgrade Selected':group.pending?'Applying…':'Confirm Choice';
  if(confirm._sourceLabel!==label){if(confirm.textContent!==label)confirm.textContent=label;confirm._sourceLabel=label;}
  var selected=offers.find(function(offer){return offer.id===group.selected;});confirm.disabled=!!(group.completed||group.pending||!selected||selected.affordable===false);
 }
 function patchRows(){api.logger.scope('MOONSHINE.actions').debug('DOM_PATCH',{kind:'rows',count:rows.size});itemsFor().forEach(function(item){var row=rows.get(item.id);if(item.category==='upgrade')patchGrid(row,model.upgrade);else C.updateRow(row,item);});}
 function build(keepShell){
  api.logger.scope('MOONSHINE.actions').debug('DOM_PATCH',{kind:'structure',scene:scene});
  var previousTop=menu?menu.querySelector('.MOONSHINE-actions-list').scrollTop:scroll;
  if(controller)expanded=controller.state.requested&&controller.state.requested.card.dataset.actionId;
  var oldExpanded=rows.get(expanded),expandedSource=oldExpanded&&oldExpanded.source;
  if(controller)controller.destroy();var retained=keepShell&&menu,list=retained&&menu.querySelector('.MOONSHINE-actions-list'),reusable=new Map();
  function rowKey(item){return JSON.stringify([item.category,item.label,item.html,item.activation]);}
  if(retained)rows.forEach(function(row){var key=rowKey(row.source),group=reusable.get(key);if(!group){group={rows:[],index:0};reusable.set(key,group);}group.rows.push(row);});
  else{if(menu)menu.remove();menu=C.element('section','actions-panel');menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-labelledby','MOONSHINE-actions-title');
  var header=C.element('header','actions-head'),title=C.element('h1','actions-title','Actions');title.id='MOONSHINE-actions-title';header.append(title);
  list=C.element('div','actions-list');list.dataset.msComponent='scroll';
  var footer=C.element('footer','actions-footer'),closeButton=C.button('Close','actions-close');closeButton.dataset.intent='close';footer.append(closeButton);menu.append(header,list,footer);root.append(menu);}
  rows.clear();var items=itemsFor();if(retained&&expandedSource){var equivalent=items.find(function(item){return item.category===expandedSource.category&&item.label===expandedSource.label&&item.html===expandedSource.html;});if(equivalent)expanded=equivalent.id;}
  items.forEach(function(item,index){var group=retained&&item.category!=='upgrade'&&reusable.get(rowKey(item)),row=group&&group.rows[group.index++];if(row){row.card.dataset.actionId=item.id;C.updateRow(row,item);}else row=C.row(item);rows.set(item.id,row);if(item.category==='upgrade')grid(row,model.upgrade);if(list.children[index]!==row.card)list.insertBefore(row.card,list.children[index]||null);});
  while(list.children.length>items.length)list.lastChild.remove();
  controller=MOONSHINE_ACCORDION.controller(list);
  var current=rows.get(expanded);if(current&&current.detail){current.card.classList.add('MOONSHINE-action-open','MOONSHINE-action-selected','MOONSHINE-action-revealed');current.toggle.setAttribute('aria-expanded','true');current.detail.inert=false;controller.state.active=controller.state.requested=current;}
  structuralSignature=structureKey();list.scrollTop=previousTop;C.fitSymbols(menu);stack();
 }
 function refresh(){var keepMenu=false,cardReturnFocus=null;
  if(api.mode()!=='mobile'){close();if(root){unbind();if(overlayObserver)overlayObserver.disconnect();root.remove();root=null;}model=null;return;}
  model=api.actions.read();
  if(!model){close();scene=null;return;}
  ensure();root.style.zoom=String(1/model.viewport.scale);root.style.width=model.viewport.width+'px';root.style.height=model.viewport.height+'px';root.style.top=model.viewport.offsetTop+'px';root.style.setProperty('--ms-view-height',model.viewport.height+'px');
  if(followup&&followup.scope!==model.scope)close();
  if(scene!==model.scene){if(!followup)close();scene=model.scene;expanded=null;scroll=0;signature='';}
  if(nativePreview){if(api.cards.previewOpen()){var backdrop=document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]');if(backdrop&&!backdrop.contains(document.activeElement)){backdrop.setAttribute('role','dialog');backdrop.tabIndex=0;backdrop.focus({preventScroll:true});}stack();return;}nativePreview=false;stack();if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;}
  if(followup){
   if(model.pendingCardReceipt){stack();return;}
   var newNarrative=model.story.hasNarrative&&(!followup.cardPanel&&model.story.paragraphId!==followup.story.paragraphId||model.story.html!==followup.story.html);
   // Pending nonempty prose must be read before acquiring the menu pause,
   // including native art entrances that have not published a text node yet.
   if(newNarrative||!followup.cardPanel&&model.story.pending&&model.story.hasNarrative||!model.items.length){close();}
   else if(model.ready&&!model.story.pending){var keepPanel=followup.cardPanel;keepMenu=!!keepPanel;cardReturnFocus=keepPanel&&followup.focus;followup=null;if(!keepPanel){if(controller)controller.destroy();controller=null;expanded=null;scroll=0;signature='';if(menu)menu.querySelector('.MOONSHINE-actions-list').scrollTop=0;}api.timing.acquire('actions');}
   else {stack();return;}
  }
  stack();if(opened&&!model.ready){close();return;}
  if(opened){var next=JSON.stringify({items:model.items,upgrade:model.upgrade});if(next!==signature){signature=next;if(!controller||structureKey()!==structuralSignature)build(keepMenu);else patchRows();}}
  if(keepMenu&&menu&&!menu.inert){var current=rows.get(expanded),target=cardReturnFocus&&cardReturnFocus.isConnected?cardReturnFocus:current&&current.full;if(target)target.focus({preventScroll:true});}
 }
 function open(){refresh();if(!model||!model.ready||opened)return;opened=true;api.timing.acquire('actions');build();signature=JSON.stringify({items:model.items,upgrade:model.upgrade});menu.querySelector('button:not(:disabled)').focus({preventScroll:true});MOONSHINE_FONTS.emoji().then(function(){if(root)C.fitSymbols(root);});MOONSHINE_FONTS.sans();}
 function showPreview(offer,button){if(offer.thumbnail){returnFocus=button;nativePreview=!!api.actions.inspect(model.upgrade.id,offer.id);stack();return;}dismissPreview(true);returnFocus=button;preview=C.preview(offer);menu.inert=true;root.append(preview);preview.focus({preventScroll:true});C.fitSymbols(preview);var current=preview,motion=MOONSHINE_ANIMATION.overlay(current,current.firstElementChild,true);current._motion=motion;motion.finished.then(function(){if(preview===current&&!current._closing)motion.cancel();});}
 function handle(target,event){
  if(event.type==='keydown'){if(preview)dismissPreview();else close();return;}
  if(preview){if(target===preview)dismissPreview();return;}
  var button=target&&target.closest('button');if(!button||button.disabled||button.closest('[inert]'))return;
  var intent=button.dataset.intent;
  if(intent==='close'){close();return;}if(intent==='open'){open();return;}if(intent==='art'){api.action('art.view');return;}
  if(intent==='confirm'){
   var before=model.upgrade.id,result=api.actions.confirm(before);refresh();
   if(result===false){button.title='The selection is no longer available or affordable.';}
   else if(model&&model.upgrade&&model.upgrade.pending)close();
   return;
  }
  if(button.dataset.offerId){
   var group=model.upgrade,id=button.dataset.offerId,offer=(group.completed?[group.receipt]:group.offers).find(function(o){return o&&o.id===id;});
   if(!group.completed){api.actions.select(group.id,id);state();}
   if(id!=='NONE'&&offer)showPreview(offer,menu.querySelector('[data-offer-id="'+CSS.escape(id)+'"]'));return;
  }
  var card=button.closest('[data-action-id]'),row=card&&rows.get(card.dataset.actionId);if(!row)return;
  if(card.dataset.category==='scan'){if(MOONSHINE_SCAN.open(function(){scanState();stack();}))stack();return;}
  if(card.dataset.category==='upgrade'){controller.request(controller.ready(row)?null:row);return;}
  if(row.source.activation==='direct'||controller.ready(row)){
   var id=card.dataset.actionId;followup={scope:model.scope,story:model.story,focus:button};menu.inert=true;api.timing.release('actions');
   try{if(api.actions.execute(id)===false){followup=null;api.timing.acquire('actions');}else if(followup&&api.cardPanel.read())followup.cardPanel=true;refresh();}
   catch(error){followup=null;api.timing.acquire('actions');stack();throw error;}
  }
  else controller.request(row);
 }
 function flags(keys){if(!opened)return;api.actions.flags(keys).forEach(function(item){var row=rows.get(item.id);if(row&&row.source)C.updateRow(row,Object.assign({},row.source,{disabled:item.disabled}));});}
 function scanState(){if(!model)return;var value=api.scan.read();if(!value){if(model.scan)refresh();return;}model.scan=value;var row=rows.get(value.id);if(row)C.updateRow(row,Object.assign({},row.source,{complete:value.complete}));var id=value.id+':continue',next=model.items.find(function(item){return item.id===id;});if(next){next.disabled=!value.canContinue;row=rows.get(id);if(row)C.updateRow(row,Object.assign({},row.source,{disabled:next.disabled}));}}
 function state(){if(!model||!model.upgrade||!root)return;var group=api.actions.state(model.upgrade.id);if(!group)return;model.upgrade=group;if(opened){var row=rows.get('upgrade');if(row)patchGrid(row,group);}signature=JSON.stringify({items:model.items,upgrade:model.upgrade});}
window.addEventListener('resize',function(){refresh();if(root)C.fitSymbols(root);});window.addEventListener('stg-display-config-change',refresh);
 LUNAR.api.moonshine.fonts.subscribe(function(value){if(!["emoji"].includes(value.role))return;if(root)C.fitSymbols(root);});
 window.MOONSHINE_ACTIONS={open:open,close:close,refresh:refresh,state:state,flags:flags,scanState:scanState};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
