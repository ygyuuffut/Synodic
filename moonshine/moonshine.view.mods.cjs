/* Owned mobile module manager. The API supplies installation and startup decisions. */
(function(){'use strict';var api=LUNAR.api.moonshine,C=MOONSHINE_ACTION_COMPONENTS,M=MOONSHINE_MOD_COMPONENTS;
 var root,launcher,menu,controller,model,motion,closing=false,rows=new Map(),unbind,background,previousInert,blocked=false,observedMain,mainObserver,exporting=false;
 var log=api.logger.scope('MOONSHINE.runtime');
 function exportState(){if(!menu)return;var state=api.diagnostics.status(),text=exporting?'Preparing previous log…':'';menu.exportLog.disabled=exporting||!state.previousAvailable;menu.exportLog.title=state.previousAvailable?'Export previous session only':state.ready?'No previous log available':'Checking previous log…';
  if(menu.exportStatus._source!==text){menu.exportStatus._source=text;menu.exportStatus.textContent=text;}}
 function exportPrevious(){if(exporting||!menu||closing||!api.diagnostics.status().previousAvailable)return;var current=menu;exporting=true;exportState();log.info('PLAYER_INPUT',{action:'exportPrevious'});
  Promise.resolve().then(function(){return api.diagnostics.exportPrevious();}).then(function(result){if(!result.available)return;
   var url=URL.createObjectURL(new Blob([result.text],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=result.filename;link.click();api.timing.ui(function(){setTimeout(function(){URL.revokeObjectURL(url);},1000);});
  }).catch(function(error){log.error('EXPORT_FAILED',error);if(menu===current){menu.exportStatus._source='Unable to export previous log';menu.exportStatus.textContent=menu.exportStatus._source;}}).finally(function(){exporting=false;if(menu===current){menu.exportLog.disabled=!api.diagnostics.status().previousAvailable;if(menu.exportStatus._source==='Preparing previous log…')exportState();}});
 }
 api.diagnostics.subscribe(exportState);
 function foreground(){
  var main=document.getElementById('MOONSHINE-root');
  if(main!==observedMain){if(mainObserver)mainObserver.disconnect();mainObserver=null;observedMain=main;
   if(main){mainObserver=new MutationObserver(function(records){if(records.some(function(r){return r.type==='attributes'?r.attributeName==='role'||r.target===main||r.target.matches('[role="dialog"]'):Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).some(function(n){return n.nodeType===1&&(n.matches('[role="dialog"]')||n.querySelector('[role="dialog"]'));});}))refresh();});mainObserver.observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['role','hidden','style','class']});}
  }
  return !!(main&&Array.from(main.querySelectorAll('[role="dialog"]')).some(function(el){var style=getComputedStyle(el);return el.getBoundingClientRect().width>0&&style.display!=='none'&&style.visibility!=='hidden'&&!el.closest('[hidden]');}));
 }
 function fit(){if(root)C.fitSymbols(root);}
 function ensure(){if(root)return;root=C.element('div','mods-root');root.id='MOONSHINE-mods-root';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('translate','yes');
  launcher=C.button(null,'mods-launcher');launcher.setAttribute('aria-label','Mods');launcher.setAttribute('aria-haspopup','dialog');launcher.append(C.symbol('🧩'));root.append(launcher);document.body.append(root);
  unbind=MOONSHINE_MOD_INPUT.bind(root,{open:open,close:close,row:interact,exportPrevious:exportPrevious});root.addEventListener('MOONSHINE-accordion-layout',fit);
 }
 function finishClose(){if(motion){motion.cancel();motion=null;}if(controller)controller.destroy();if(menu)menu.scrim.remove();menu=null;controller=null;rows.clear();closing=false;
  api.timing.release('mods');if(background&&background.isConnected)background.inert=previousInert;background=null;
  if(launcher&&launcher.isConnected){launcher.hidden=blocked;launcher.disabled=blocked;if(!blocked&&model&&model.mainMenu)launcher.focus({preventScroll:true});}
 }
 function close(immediate){if(!menu)return;if(closing&&!immediate)return;closing=true;if(motion)motion.cancel();if(immediate){finishClose();return;}
  menu.panel.inert=true;var current=menu,animation=MOONSHINE_ANIMATION.overlay(menu.scrim,menu.panel,false);motion=animation;animation.finished.then(function(){if(closing&&menu===current&&motion===animation)finishClose();});
 }
 function refresh(){
  // Eligibility has no viewport measurement. Hidden Mods must not flush
  // pending scene styles merely to discover that their UI cannot appear.
  if(api.mode()!=='mobile'||!api.mods.context().mainMenu){model=null;blocked=false;close(true);if(root){unbind();root.remove();root=null;launcher=null;}
   if(observedMain&&!observedMain.isConnected){if(mainObserver)mainObserver.disconnect();mainObserver=null;observedMain=null;}return;}
  model=api.mods.read();blocked=foreground();
  if(blocked)close(true);
  ensure();var v=model.viewport;root.style.zoom=String(1/v.scale);root.style.width=v.width+'px';root.style.height=v.height+'px';root.style.top=v.offsetTop+'px';
  launcher.hidden=blocked||!!menu;launcher.disabled=blocked||!!menu;
  if(menu)model.modules.forEach(function(mod){var row=rows.get(mod.id);if(row)M.update(row,mod);});fit();
 }
 function open(){refresh();if(!root||menu||blocked)return;menu=M.menu();root.append(menu.scrim);controller=MOONSHINE_ACCORDION.controller(menu.list);
  model.modules.forEach(function(mod){var row=M.row(mod);rows.set(mod.id,row);menu.list.append(row.card);});
  exportState();background=document.getElementById('MOONSHINE-root');if(background){previousInert=background.inert;background.inert=true;}launcher.disabled=true;launcher.hidden=true;api.timing.acquire('mods');menu.close.focus({preventScroll:true});fit();
  motion=MOONSHINE_ANIMATION.overlay(menu.scrim,menu.panel,true);var current=motion;current.finished.then(function(){if(motion===current&&!closing){current.cancel();motion=null;}});
  MOONSHINE_FONTS.emoji().then(fit);MOONSHINE_FONTS.sans();
 }
 function interact(id,toggle){if(!menu||closing)return;var row=rows.get(id),mod=model.modules.find(function(e){return e.id===id;});if(!row||!mod)return;
  if(toggle){var result=api.mods.setEnabled(id,!mod.enabled);if(!result.ok&&result.error==='storage-unavailable')menu.note.textContent='Unable to save module settings in this browser. No changes were saved.';else if(result.ok)menu.note.textContent='To Apply Changes, Please Restart the Game';refresh();}
  else controller.request(controller.state.requested===row?null:row);
 }
 window.addEventListener('resize',refresh);window.addEventListener('stg-display-config-change',refresh);if(window.visualViewport){visualViewport.addEventListener('resize',refresh);visualViewport.addEventListener('scroll',refresh);}LUNAR.api.moonshine.fonts.subscribe(function(value){if(["ui", "mono", "emoji"].includes(value.role))fit();});
 new MutationObserver(function(records){if(records.some(function(r){return Array.from(r.addedNodes).concat(Array.from(r.removedNodes)).some(function(n){return n.id==='MOONSHINE-root';});}))refresh();}).observe(document.body,{childList:true});
 window.MOONSHINE_MODS=Object.freeze({open:open,close:function(){close();},refresh:refresh});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();
