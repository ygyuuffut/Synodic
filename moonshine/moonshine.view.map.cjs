/* Map composition reads only the semantic consumer boundary, never native DOM. */
(function(){'use strict';var api=LUNAR.api.moonshine,C=MOONSHINE_MAP_COMPONENTS,model=null,context=null,slot=null,readyId=null,centerPending=false,layoutQueued=false;
 function destroy(){if(model)model.root.remove();model=null;context=null;slot=null;readyId=null;centerPending=false;}
 function reportReady(){if(!model||!context||!model.nodes.size||readyId===context.id||api.assets.locked())return;readyId=context.id;api.logger.scope('MOONSHINE.map').info('MAP_UI_READY',{id:context.id,profile:context.profile});}
 function refresh(domains){if(api.mode()!=='mobile'){destroy();return;}var data=api.map.read();if(!data.available){destroy();return;}
  var next=document.querySelector('#MOONSHINE-root [data-ms-map-slot]');if(!next){destroy();return;}
  var mounted=!model||!context||context.id!==data.id||slot!==next;
  if(mounted){destroy();slot=next;slot.setAttribute('data-MOONSHINE-owned','');model=C.create();slot.append(model.root);api.logger.scope('MOONSHINE.map').info('MAP_MOUNT',{id:data.id,profile:data.profile});}
  context=data;C.structure(model,data);C.state(model,data);reportReady();
  if(mounted)centerPending=true;if(mounted||(domains||[]).includes('viewport'))layout();

 }
 function layout(){if(layoutQueued||!model)return;layoutQueued=true;var own=model;api.timing.ui(function(){requestAnimationFrame(function(){requestAnimationFrame(function(){layoutQueued=false;if(model!==own||!own.root.isConnected)return;C.geometry(own,context);if(centerPending&&!api.assets.locked()){centerPending=false;var current=own.root.querySelector('[data-current="true"]');if(current)current.scrollIntoView({block:'center',inline:'nearest'});}});});});}
 function activate(key){if(!model||!context)return false;var node=model.nodes.get(key);return !!(node&&node.button.getAttribute('aria-disabled')!=='true'&&api.map.enter(context.id,key));}
 api.assets.subscribe(function(){reportReady();if(centerPending&&!api.assets.locked())layout();});
 window.MOONSHINE_MAP=Object.freeze({refresh:refresh,destroy:destroy,activate:activate});
})();
