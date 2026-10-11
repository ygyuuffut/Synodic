/* Animate opacity only: translation owns its text nodes after source publication. */
(function(){'use strict';var api=LUNAR.api.moonshine,active=new Map(),deferredRoot=null;
 function cleanup(record){record.cancelled=true;record.animations.forEach(function(a){a.cancel();});active.delete(record.id);}
 function sync(root){
  if(api.transitions.status().kind==='scene'){deferredRoot=root;return;}deferredRoot=null;
  var entries=api.story.read(),ids=new Set();
  entries.forEach(function(entry){
   ids.add(entry.id);var node=root&&root.querySelector('[data-lunar-story-id="'+CSS.escape(entry.id)+'"]'),record=active.get(entry.id);
   if(!entry.hasNarrative&&!entry.complete){if(!api.timing.active())api.story.complete(entry.id);return;}
   if(!node||!node.getBoundingClientRect().width)return;
   if(record&&record.node!==node){cleanup(record);record=null;}
   if(!record){
    record={id:entry.id,node:node,animations:[],cancelled:false,ended:!!entry.complete};active.set(entry.id,record);
    node.setAttribute('translate','yes');node.setAttribute('lang',entry.language||'en');
    if(!entry.complete&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
     var parts=Array.from(node.querySelectorAll('[data-moonshine-paragraph]'));if(!parts.length)parts=[node];
     api.timing.ui(function(){parts.forEach(function(part,i){record.animations.push(part.animate([{opacity:0},{opacity:1}],{duration:280,delay:Math.min(i,6)*80,easing:'ease-out',fill:'both'}));});});
    }
    Promise.all(record.animations.map(function(a){return a.finished.catch(function(){});})).then(function(){if(record.cancelled)return;record.ended=true;record.animations.forEach(function(a){a.cancel();});if(!api.timing.active()){api.presented([entry.id]);api.story.complete(entry.id);}});
   }
   if(entry.complete){record.ended=true;record.animations.forEach(function(a){a.cancel();});}
   else if(record.ended&&!api.timing.active()){api.presented([entry.id]);api.story.complete(entry.id);}
   else record.animations.forEach(function(a){if(api.timing.active()&&a.playState==='running')a.pause();else if(!api.timing.active()&&a.playState==='paused')a.play();});
  });
  active.forEach(function(record,id){if(!ids.has(id)||!root||!record.node.isConnected)cleanup(record);});
 }
 api.transitions.subscribe(function(value){if(value.kind==='silent'&&deferredRoot){var root=deferredRoot;deferredRoot=null;if(root.isConnected)sync(root);}});
 window.MOONSHINE_PROSE_ANIMATION={sync:sync,cleanup:function(){active.forEach(cleanup);}};
})();
