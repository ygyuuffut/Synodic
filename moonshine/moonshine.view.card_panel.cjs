/* Owned deck/alignment selection, nested standard detail, pause and focus. */
(function(){'use strict';var api=LUNAR.api.moonshine,v=null,hand=null,model=null,preview=false,focus=null,log=api.logger.scope('MOONSHINE.cards');
 function buttons(){if(v)v.confirm.disabled=!hand.selected()||preview||api.assets.locked();}
 function destroy(){if(!v)return;hand.destroy();v.overlay.remove();v=null;hand=null;model=null;preview=false;api.timing.release('card-panel');if(focus&&focus.isConnected)focus.focus({preventScroll:true});focus=null;}
 function geometry(mount){if(!v)return;var viewport=api.viewport();v.root.style.setProperty('--card-panel-vh',(viewport?viewport.height:innerHeight)+'px');if(!mount){MOONSHINE_CARD_THUMBNAIL.resources(v.root);hand.layout();}}
 function refresh(domains){var next=api.mode()==='mobile'?api.cardPanel.read():null,main=document.getElementById('MOONSHINE-root');if(!next||!main){destroy();return;}var mount=!model||model.id!==next.id;if(mount){destroy();model=next;focus=document.activeElement;v=MOONSHINE_CARD_PANEL_COMPONENT.create(next);v.onSelection=buttons;hand=MOONSHINE_CARD_HAND.create(v);var host=document.getElementById('MOONSHINE-actions-root');if(host)host.append(v.overlay);else{v.overlay.style.position='fixed';v.overlay.style.zIndex='1100';v.overlay.style.zoom=String(1/api.display.viewport().scale);main.append(v.overlay);}api.timing.acquire('card-panel');geometry(true);hand.update(next.entries);(next.cancellable?v.cancel:v.confirm).focus({preventScroll:true});log.info('CARD_PANEL_MOUNT',{id:next.id,kind:next.kind});}else if(domains&&domains.includes('viewport'))geometry();
  if(preview){var backdrop=main.querySelector('[data-lunar-control-role="cards.detailBackdrop"]');if(backdrop&&!backdrop.contains(document.activeElement)){backdrop.setAttribute('role','dialog');backdrop.tabIndex=0;backdrop.focus({preventScroll:true});}}
  if(preview&&!api.cards.previewOpen()){preview=false;v.root.inert=false;hand.focus();log.info('CARD_DETAIL_RETURN',{id:model.id});}buttons();
 }
 function activate(action,key){if(!v||api.assets.locked())return;if(action==='detail-close'){var backdrop=document.querySelector('#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"]');if(backdrop)api.cards.dismissPopup(backdrop.getAttribute('data-lunar-source-key'));return;}if(preview)return;
  if(action==='card'){if(hand.selected()===key){if(api.cardPanel.inspect(model.id,key)){preview=true;v.root.inert=true;buttons();log.info('CARD_DETAIL_OPEN',{id:model.id,card:key});}}else hand.select(key,buttons);return;}
  if(action==='confirm'||action==='cancel'){if(action==='cancel'&&!model.cancellable)return;if(action==='confirm'&&v.confirm.disabled)return;var id=model.id,chosen=hand.selected();destroy();var accepted=action==='confirm'?api.cardPanel.submit(id,chosen):api.cardPanel.cancel(id);if(!accepted)refresh();return;}
  hand.clear();buttons();
 }
 window.MOONSHINE_CARD_PANEL=Object.freeze({refresh:refresh,destroy:destroy,activate:activate,active:function(){return !!v;},preview:function(){return preview;}});
})();
