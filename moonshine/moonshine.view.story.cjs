/* Stable chrome controller. Content arrives through narrow semantic API. */
(function(){'use strict';var api=LUNAR.api.moonshine,C=null,source=null,scene=null,bodySignature=null,paragraph=null,background=null,backgroundSignature=null,backgroundSource=null;
 function mount(root){if(!C){C=MOONSHINE_CHROME_COMPONENT.create();root.append(C.root);MOONSHINE_PRESENTATION.attach(C);api.fonts.load('emoji');}else if(C.root.parentNode!==root)root.append(C.root);geometry();return C;}
 function geometry(){if(!C)return;var scale=api.display.viewport().scale,zoom=String(1/scale),root=C.root.parentElement;if(root&&root.style.getPropertyValue('--ms-native-scale')!==String(scale))root.style.setProperty('--ms-native-scale',String(scale));[C.hud,C.story].forEach(function(el){if(el.style.zoom!==zoom)el.style.zoom=zoom;});}
 function hud(){if(!C)return;var player=api.updates.scalars().player;Object.keys(C.values).forEach(function(k){var text=String(Math.max(0,Math.round(Number(player[k])||0))),node=C.values[k],old=node.textContent;if(old!==text){node.firstChild.nodeValue=text;if(old.length>=3||text.length>=3)MOONSHINE_GEOMETRY.mark(node,'number-width');else node.style.removeProperty('font-size');}});var state=player.maxHp>0&&player.hp>=player.maxHp?'full':player.maxHp<=0||player.hp/player.maxHp<=.2?'critical':'normal';if(C.hp.dataset.hpState!==state)C.hp.dataset.hpState=state;var label='HP '+player.hp+' of '+player.maxHp;if(C.hp.getAttribute('aria-label')!==label)C.hp.setAttribute('aria-label',label);}
 function backgroundFor(next){var data=next.background;backgroundSource=data&&data.image||null;if(!data){if(background){MOONSHINE_BACKGROUND.release(background);background.remove();background=null;backgroundSignature=null;}return;}
  if(!background){background=document.createElement('div');background.id='MOONSHINE-story-choice-background';background.setAttribute('aria-hidden','true');background.setAttribute('data-MOONSHINE-owned','');background.setAttribute('data-ms-in-scene-background','');C.root.prepend(background);}
  background.toggleAttribute('data-ms-vignette',!!data.vignette);
  background.toggleAttribute('data-ms-story-background',!!data.storyLayer);background.dataset.msClass=data.storyLayer?'ev-bg':'';
  var shade=background.querySelector('.MOONSHINE-story-background-shade');if(data.storyLayer&&!shade){shade=document.createElement('div');shade.className='MOONSHINE-story-background-shade';shade.dataset.msClass='ev-gradient';background.append(shade);}else if(!data.storyLayer&&shade)shade.remove();
  var key=JSON.stringify(data);if(key!==backgroundSignature){MOONSHINE_BACKGROUND.patch(background,'background-color:'+data.color+';',data);backgroundSignature=key;}
 }
 function backgroundRefresh(){if(C&&source&&source.sceneId==='EncounterEvent'&&!source.branchId)backgroundFor({background:api.chrome.background()});}
 // Read only our committed plate; Encounter art is intentionally absent from
 // the legacy workspace. Pending first paint uses the same resource resolver.
 function art(){if(!background)return '';var image=background.style.backgroundImage;return image&&image!=='none'?image:backgroundSource?api.resources.backgroundImage(backgroundSource).image:'';}
 function counter(next,key,view,label){var value=next[key],visible=!!(next.available&&value);if(view.row.hidden!==!visible)view.row.hidden=!visible;if(!visible)return;MOONSHINE_COMBAT_COMPONENT.text(view.a,value.current);MOONSHINE_COMBAT_COMPONENT.text(view.b,value.maximum);label+=' '+value.current+' of '+value.maximum;if(view.row.getAttribute('aria-label')!==label)view.row.setAttribute('aria-label',label);}
 // Canonical DTO prefix comparison, never translated DOM text. Only a strict
 // append qualifies; replacing the paragraph continues to reset to its start.
 function appendPlan(before,after,parent){
  if(!before||before.length>after.length)return null;var changed=null;
  for(var i=0;i<before.length;i++){var a=before[i],b=after[i];if(JSON.stringify(a)===JSON.stringify(b))continue;
   if(changed||a.tag!==b.tag||a.key!==b.key||JSON.stringify(a.attrs)!==JSON.stringify(b.attrs)||a.text!==b.text)return null;
   changed=appendPlan(a.children||[],b.children||[],b.key);if(!changed)return null;
  }
  function prose(node){return node.tag==='#text'?!!node.text.trim():/^(img|video|audio|svg|canvas)$/.test(node.tag)||(node.children||[]).some(prose);}
  var added=after.slice(before.length),first=added.find(prose);if(first)return changed?null:{parent:parent,added:added,children:after,target:first.tag==='#text'?parent:first.key};return changed;
 }
 function revealExtension(target){if(!target||!C.scroll.contains(target))return;var box=C.scroll.getBoundingClientRect(),at=target.getBoundingClientRect(),scale=box.height/C.scroll.offsetHeight||1,top=C.scroll.scrollTop+(at.top-box.top)/scale;C.scroll.scrollTop=Math.max(0,top-8);api.logger.scope('MOONSHINE.story').debug('STORY_EXTENSION_REVEALED',{scene:scene,key:target.dataset.msKey});}
 function refresh(){if(!C)return;var next=api.chrome.story();counter(next,'hp',C.storyHp,'HP');counter(next,'love',C.love,'LOVE');backgroundFor(next);if(!next.available&&scene===next.sceneId){state();return;}C.scroll.toggleAttribute('data-ms-story-choice',!!next.branchId);var blocks=next.blocks||[],signature=JSON.stringify({blocks:blocks,html:next.html}),changed=bodySignature!==signature;
  var append=changed&&source&&scene===next.sceneId&&next.html==null&&appendPlan(source.blocks,blocks),parent=append&&(append.parent?C.scroll.querySelector('[data-ms-key="'+CSS.escape(append.parent)+'"]'):C.scroll);
  if(changed){if(next.html!=null)MOONSHINE_ACTION_COMPONENTS.rich(C.scroll,next.html);else if(parent)MOONSHINE_COMPONENTS.append(parent,append.added,append.children);else MOONSHINE_COMPONENTS.patch(C.scroll,blocks);bodySignature=signature;C.scroll.querySelectorAll('[data-lunar-story-id]').forEach(MOONSHINE_PROSE_COMPONENT.prepare);}
  var title=next.title||'Story';if(!source||source.title!==title)C.title.textContent=title;
  var current=C.scroll.querySelector('[data-lunar-story-id]'),id=next.branchId||current&&current.getAttribute('data-lunar-story-id'),same=scene===next.sceneId&&paragraph===id,target=null;
  if(!same)C.scroll.scrollTop=0;
  else if(source){
   if(next.extension&&(!source.extension||source.extension.id!==next.extension.id))target=C.scroll.querySelector('[data-ms-id="'+CSS.escape(next.extension.anchor)+'"]');
   else if(append&&append.target)target=C.scroll.querySelector('[data-ms-key="'+CSS.escape(append.target)+'"]');
  }
  paragraph=id;scene=next.sceneId;source=next;state();if(target)revealExtension(target);
 }
 function state(){if(!C)return;var phase=api.story.presentation(),entries=api.story.read(),active=entries.find(function(e){return C.scroll.querySelector('[data-lunar-story-id="'+CSS.escape(e.id)+'"]');}),typing=!!(active&&!active.complete),held=!!phase.hidden&&!(source&&source.branchId);
  C.scroll.toggleAttribute('data-ms-story-held',held);C.story.dataset.msClass='arc-dialogue stg-story-panel'+(typing?' stg-story-loading':'');var glyph=typing?'⏳\uFE0E':'✓';if(C.statusGlyph.textContent!==glyph)C.statusGlyph.textContent=glyph;C.status.setAttribute('aria-label',typing?'Text appearing':'Text complete');C.actions.hidden=typing;C.actions.disabled=held||!source||!source.available||source.actionsAvailable===false;C.view.disabled=!source||!source.available||source.viewArtAvailable===false;
  if(held&&window.MOONSHINE_ACTIONS&&document.querySelector('#MOONSHINE-actions-root .MOONSHINE-actions-panel'))MOONSHINE_ACTIONS.close();
 }
 function complete(){if(!C||api.timing.active()||MOONSHINE_PRESENTATION.status().mode!=='NORMAL')return false;var entry=api.story.read().find(function(e){return !e.complete&&C.scroll.querySelector('[data-lunar-story-id="'+CSS.escape(e.id)+'"]');});return entry?api.story.complete(entry.id):false;}
 // Own controls precede the legacy compatibility dispatcher, without new routes.
 window.addEventListener('click',function(event){if(!C)return;var el=event.target instanceof Element&&event.target.closest('[data-ms-chrome-control]');if(el&&C.root.contains(el)){event.preventDefault();event.stopImmediatePropagation();if(el.disabled||el.closest('[inert]')||api.assets.locked())return;var intent=el.dataset.msChromeControl;el.focus({preventScroll:true});if(intent==='info'||intent==='menu')MOONSHINE_RUNTIME.rememberChromeOpener(intent);api.logger.scope('MOONSHINE.presentation').info('PLAYER_INPUT',{action:intent});
   if(intent==='actions')MOONSHINE_ACTIONS.open();else if(intent==='view')api.chrome.viewArt();else if(intent==='info')MOONSHINE_WORKSPACE.window.STG_MOBILE_CHROME.openInfo(el);else if(intent==='menu')MOONSHINE_WORKSPACE.window.STG_MOBILE_CHROME.openMenu();return;
  }
  if(event.target instanceof Element&&event.target.closest('#MOONSHINE-root')&&!event.target.closest('button,input,[role="dialog"],.MOONSHINE-location-launcher,[data-lunar-control-role="cards.detailBackdrop"]')&&complete()){event.preventDefault();event.stopImmediatePropagation();state();}
 },true);
 window.MOONSHINE_STORY=Object.freeze({art:art,backgroundRefresh:backgroundRefresh,mount:mount,refresh:refresh,state:state,hud:hud,geometry:geometry,nodes:function(){return C;}});
})();
