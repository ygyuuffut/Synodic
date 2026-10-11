/* Fade, coordinated height change, then reveal. Heights are local CSS units. */
(function(){'use strict';var api=LUNAR.api.moonshine;
 var heightMs=280,fadeMs=140;
 function reduced(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
 function pause(ms){return new Promise(function(resolve){api.timing.ui(function(){setTimeout(resolve,reduced()?0:ms);});});}
 function measure(el){return parseFloat(getComputedStyle(el).height)||0;}
 function radius(el,h){var style=getComputedStyle(el);return Math.min(parseFloat(style.borderTopLeftRadius)||0,h/2,(parseFloat(style.width)||h)/2);}
 async function height(el,from,options){
  options=options||{};var to=options.to==null?measure(el):options.to;
  if(!el.animate||reduced()||Math.abs(to-from)<.5)return;
  var animation;
  api.timing.ui(function(){animation=el.animate([{height:from+'px',borderRadius:(options.fromRadius==null?20:options.fromRadius)+'px'},{height:to+'px',borderRadius:(options.toRadius==null?20:options.toRadius)+'px'}],{duration:heightMs,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});});
  if(options.track)options.track.add(animation);
  try{await animation.finished;}catch(_){}
  finally{if(options.track)options.track.delete(animation);animation.cancel();}
 }
 function controller(host){
  var state={active:null,requested:null,running:false},dead=false,animations=new Set(),waits=new Set(),cleanups=new Set(),anchor=host.style.overflowAnchor;
  // Measurement must not let scroll anchoring compete with the height animation.
  host.style.overflowAnchor='none';
  function wait(ms){return new Promise(function(resolve){var timer,finish=function(){clearTimeout(timer);waits.delete(finish);resolve();};waits.add(finish);api.timing.ui(function(){timer=setTimeout(finish,reduced()?0:ms);});});}
  async function resize(row,opening){
   var el=row.card,original=el.style.height,from=measure(el),fromRadius=radius(el,from),scroll=host.scrollTop,done=false;
   function restore(){if(done)return;done=true;el.style.height=original;cleanups.delete(restore);}
   cleanups.add(restore);el.style.height=from+'px';
   el.classList.toggle('MOONSHINE-action-open',opening);
   if(!opening)el.classList.remove('MOONSHINE-action-selected','MOONSHINE-action-preparing');
   // Read natural height once. Restore the start box and viewport before paint:
   // otherwise a collapsing measurement instantly clamps scrollTop to its end.
   el.style.height=original;var to=measure(el),toRadius=radius(el,to);el.style.height=from+'px';
   var motion=height(el,from,{to:to,fromRadius:fromRadius,toRadius:toRadius,track:animations});host.scrollTop=scroll;
   try{await motion;}finally{restore();}
  }
  async function run(){if(state.running||dead)return;state.running=true;
   try{while(!dead&&host.isConnected&&state.active!==state.requested){
    var old=state.active,next=state.requested;
    if(old){old.card.classList.remove('MOONSHINE-action-revealed');old.detail.inert=true;old.toggle.setAttribute('aria-expanded','false');}
    if(next){next.card.classList.add('MOONSHINE-action-selected','MOONSHINE-action-preparing');next.detail.inert=true;next.toggle.setAttribute('aria-expanded','true');}
    await wait(fadeMs);if(dead||!host.isConnected)break;
    await Promise.all([old&&resize(old,false),next&&resize(next,true)]);if(dead||!host.isConnected)break;
    state.active=next;
    if(next){next.card.classList.remove('MOONSHINE-action-preparing');next.card.classList.add('MOONSHINE-action-revealed');await wait(fadeMs);if(!dead&&next===state.requested)next.detail.inert=false;}
   }}finally{state.running=false;if(!dead&&host.isConnected)host.dispatchEvent(new Event('MOONSHINE-accordion-layout',{bubbles:true}));}
  }
  function destroy(){if(dead)return;dead=true;waits.forEach(function(finish){finish();});animations.forEach(function(a){a.cancel();});animations.clear();cleanups.forEach(function(restore){restore();});host.style.overflowAnchor=anchor;state.active=state.requested=null;state.running=false;}
  return {state:state,request:function(row){if(dead)return;state.requested=row;if(state.active)state.active.detail.inert=true;run();},ready:function(row){return !dead&&!state.running&&state.active===row&&state.requested===row;},destroy:destroy};
 }
 window.MOONSHINE_ACCORDION={controller:controller,height:height,pause:pause,heightMs:heightMs,fadeMs:fadeMs};
})();
