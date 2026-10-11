/* Browser presentation only. Native scale preferences go through LUNAR. */
(function(){'use strict';var api=LUNAR.api.moonshine,meta=null,pending=null;
 function visible(){return api.mode()==='mobile'&&!!document.getElementById('MOONSHINE-root');}
 function sync(){
  if(!visible()){if(meta){meta.remove();meta=null;}return false;}
  if(!meta){meta=document.createElement('meta');meta.name='viewport';meta.id='MOONSHINE-viewport';meta.setAttribute('data-MOONSHINE-owned','');meta.content=api.profile().viewport;document.head.appendChild(meta);}
  return true;
 }
 function frame(fn){api.timing.ui(function(){requestAnimationFrame(fn);});}
 function resetRecommended(){
  if(pending)return pending;
  if(!sync()){api.display.resetRecommended();return Promise.resolve();}
  var current=meta,base=api.profile().viewport;
  // Assigning the same initial-scale does not reset an already zoomed page.
  // Commit a different initial scale first, then restore exactly 1; the clamp
  // is temporary, so normal pinch zoom is available again after the reset.
  var options=base.split(',').filter(function(s){return !/^\s*(?:initial-scale|minimum-scale|maximum-scale|user-scalable)\s*=/.test(s);}).join(',');
  pending=new Promise(function(resolve,reject){
   current.content=options+', initial-scale=1.001, minimum-scale=1.001, maximum-scale=1.001';
   frame(function(){
    if(!visible()||meta!==current){sync();resolve();return;}
    current.content=base;
    frame(function(){
     try{if(visible()){api.display.resetRecommended();MOONSHINE_RUNTIME.refresh({domains:['viewport']});}resolve();}catch(error){reject(error);}
    });
   });
  }).finally(function(){if(meta===current)current.content=base;pending=null;});
  return pending;
 }
 // manipulation prevents double-tap zoom without cancelling genuine clicks,
 // horizontal/vertical scrolling or the CG viewer's pinch gesture.
 window.addEventListener('dblclick',function(event){if(visible()&&event.target instanceof Element&&event.target.closest('[data-MOONSHINE-owned]'))event.preventDefault();},true);
 window.MOONSHINE_DISPLAY=Object.freeze({sync:sync,resetRecommended:resetRecommended});
})();
