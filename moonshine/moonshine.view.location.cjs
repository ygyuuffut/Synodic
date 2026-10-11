/* Owned location lifecycle. Reads only relevant API domains; layout reads are grouped. */
(function(){'use strict';var api=LUNAR.api.moonshine,C=MOONSHINE_LOCATION_COMPONENTS,root,launcher,menu,model,motion,closing=false,background,previousInert,hud,entrance;
 function geometry(){if(!root)return;var v=api.display.viewport(),main=document.getElementById('MOONSHINE-root'),currentHud=main&&main.querySelector('[data-ms-class~="stg-mobile-top-hud"]'),rect=currentHud&&currentHud.getBoundingClientRect();
  syncHud(hud=currentHud);
  root.style.zoom=String(1/v.scale);root.style.width=v.width+'px';root.style.height=v.height+'px';root.style.top=v.offsetTop+'px';
  root.style.setProperty('--hud-bottom',(rect?rect.bottom-v.offsetTop+8:80)+'px');root.style.setProperty('--hud-left',(rect?rect.left:14)+'px');
 }
 // Observe owned HUD entrance events; copy its compositor clock, never poll frames.
 function syncHud(source){
  if(entrance){entrance.cancel();entrance=null;}if(!launcher)return;
  var opacity=source?1:0,animated=null,base=1;
  for(var node=source;node&&node.id!=='MOONSHINE-root';node=node.parentElement){var paint=getComputedStyle(node),value=Number(paint.opacity);opacity*=value;
   var animation=node.getAnimations().find(function(a){return a.effect&&a.effect.target===node&&a.playState==='running'&&a.effect.getKeyframes().some(function(f){return f.opacity!=null;});});
   if(animation&&!animated)animated=animation;else base*=value;
   if(paint.visibility==='hidden'||paint.display==='none')opacity=base=0;
  }
  launcher.style.opacity=String(opacity);launcher.style.pointerEvents=opacity===0?'none':'';
  if(animated&&base>0){var frames=animated.effect.getKeyframes().map(function(f){return {offset:f.offset,opacity:Number(f.opacity)*base,easing:f.easing};}),timing=animated.effect.getTiming();
   api.timing.ui(function(){entrance=launcher.animate(frames,timing);if(typeof animated.startTime==='number')entrance.startTime=animated.startTime;else entrance.currentTime=animated.currentTime;});
   launcher.style.pointerEvents='';var follow=entrance;animated.ready.then(function(){if(entrance===follow&&typeof animated.startTime==='number')follow.startTime=animated.startTime;}).catch(function(){});
  }
 }
 ['transitionrun','transitionend','transitioncancel','animationstart','animationend','animationcancel'].forEach(function(type){document.addEventListener(type,function(event){if(hud&&event.target instanceof Element&&event.target.contains(hud)&&(event.propertyName==null||event.propertyName==='opacity'))syncHud(hud);},true);});
 function ensure(){if(root)return;root=C.element('div','root');root.id='MOONSHINE-location-root';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('data-ms-css-layout','');root.setAttribute('translate','yes');launcher=C.element('button','launcher');launcher.type='button';launcher.setAttribute('aria-label','Current location');launcher.setAttribute('aria-haspopup','dialog');launcher.append(MOONSHINE_SYMBOLS.location());root.append(launcher);root.classList.toggle('MOONSHINE-location-suspended',api.timing.active());document.body.append(root);root.addEventListener('click',function(event){event.stopPropagation();});launcher.addEventListener('click',open);}
 function finishClose(){if(motion){motion.cancel();motion=null;}if(menu)menu.scrim.remove();menu=null;closing=false;if(background){background.inert=previousInert;background=null;}api.timing.release('location');if(launcher&&!menu){launcher.hidden=false;launcher.disabled=false;if(launcher.isConnected&&!api.timing.active())launcher.focus({preventScroll:true});}}
 function close(immediate){if(!menu)return;MOONSHINE_COLLECTED_DATA.close(false);if(closing&&!immediate)return;api.logger.scope('MOONSHINE.map').info('PLAYER_INPUT',{action:'location.close',immediate:!!immediate});closing=true;if(motion)motion.cancel();if(immediate){finishClose();return;}menu.panel.inert=true;var current=menu,animation=MOONSHINE_ANIMATION.overlay(menu.scrim,menu.panel,false);motion=animation;animation.finished.then(function(){if(menu===current&&motion===animation)finishClose();});}
 function open(){if(menu||!root||api.mode()!=='mobile'||api.timing.active())return;background=document.getElementById('MOONSHINE-root');if(background&&background.inert){background=null;return;}
  var data=api.location.read();if(!data.available)return;api.logger.scope('MOONSHINE.map').info('PLAYER_INPUT',{action:'location.open',kind:data.kind});model=data;menu=C.menu(data.kind);C.patch(menu,data);root.append(menu.scrim);previousInert=background&&background.inert;if(background)background.inert=true;launcher.hidden=true;launcher.disabled=true;api.timing.acquire('location');menu.ok.focus({preventScroll:true});
  menu.ok.addEventListener('click',function(){close();});menu.panel.addEventListener('click',function(event){var button=event.target.closest('.MOONSHINE-location-data');if(!button||button.disabled||menu.scrim.inert)return;if(MOONSHINE_COLLECTED_DATA.open(button.dataset.character,function(){if(menu)menu.scrim.inert=false;}))menu.scrim.inert=true;});menu.scrim.addEventListener('click',function(event){event.stopPropagation();if(menu&&event.target===menu.scrim)close();});
  menu.scrim.addEventListener('keydown',function(event){event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();}else if(event.key==='Tab'){event.preventDefault();var controls=Array.from(menu.panel.querySelectorAll('button:not(:disabled)')),i=controls.indexOf(document.activeElement);controls[(i+(event.shiftKey?-1:1)+controls.length)%controls.length].focus();}});
  motion=MOONSHINE_ANIMATION.overlay(menu.scrim,menu.panel,true);var animation=motion;animation.finished.then(function(){if(motion===animation&&!closing){animation.cancel();motion=null;}});
 }
 function refresh(domains){domains=domains||['scene'];var scene=domains.includes('scene'),position=scene||domains.includes('location'),layout=scene||domains.includes('viewport');
  if(api.mode()!=='mobile'){close(true);if(entrance){entrance.cancel();entrance=null;}hud=null;if(root)root.remove();root=null;launcher=null;model=null;return;}
  if(position||!model){var next=api.location.context();if(!next.available){close(true);if(entrance){entrance.cancel();entrance=null;}hud=null;if(root)root.remove();root=null;launcher=null;model=null;return;}if(menu&&(next.kind!==model.kind||next.name!==model.name))close(true);model=next;ensure();}
  if(MOONSHINE_COLLECTED_DATA.isOpen()&&(scene||position))MOONSHINE_COLLECTED_DATA.refresh();
  if(layout)geometry();
  if(menu&&!closing&&(scene||position||model.kind==='map'&&(domains.includes('location.nearby')||domains.includes('location.legend')))){var nearby=domains.includes('location.nearby'),legend=domains.includes('location.legend'),part=!scene&&!position&&nearby&&!legend?'nearby':!scene&&!position&&legend&&!nearby?'legend':undefined;C.patch(menu,api.location.read(part));}
 }
 // Scene hiding can suppress computed HUD visibility without a native animation event.
 // Resync once after all transition listeners reveal the owned tree.
 api.chrome.subscribe(function(){queueMicrotask(function(){if(hud&&launcher)syncHud(hud);});});
 api.transitions.subscribe(function(value){if(value.kind==='silent')queueMicrotask(function(){if(hud&&hud.isConnected&&launcher)syncHud(hud);});});
 api.timing.subscribe(function(paused){if(root)root.classList.toggle('MOONSHINE-location-suspended',paused);});
 window.addEventListener('LUNAR-navigation',function(){close(true);});
 window.MOONSHINE_LOCATION=Object.freeze({refresh:refresh,open:open,close:close});
})();
