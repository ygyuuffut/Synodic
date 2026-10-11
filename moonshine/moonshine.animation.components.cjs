/* Recreate animation descriptions on owned elements; no native effects. */
(function(){'use strict';var ids=new WeakMap(),next=0;
window.MOONSHINE_ANIMATION={
 overlay:function(scrim,card,opening){
  var animations=[],duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:opening?180:120;
  if(duration&&scrim.animate)LUNAR.api.moonshine.timing.ui(function(){
   animations.push(scrim.animate([{opacity:opening?0:getComputedStyle(scrim).opacity},{opacity:opening?1:0}],{duration:duration,easing:'ease-out',fill:'both'}));
   animations.push(card.animate([{opacity:opening?0:getComputedStyle(card).opacity,transform:opening?'translateY(8px) scale(.96)':getComputedStyle(card).transform},{opacity:opening?1:0,transform:opening?'none':'translateY(6px) scale(.98)'}],{duration:duration,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'}));
  });
  var finished=Promise.all(animations.map(function(a){return a.finished.catch(function(){});}));
  return {finished:finished,cancel:function(){animations.forEach(function(a){a.cancel();});}};
 },
 apply:function(el,descriptions){var active=new Set();if(!el._moonshineAnimations)el._moonshineAnimations=new Map();(descriptions||[]).forEach(function(a){active.add(a.key);var own=el._moonshineAnimations.get(a.key);if(!own){own=el.animate(a.frames,a.timing);el._moonshineAnimations.set(a.key,own);if(typeof a.time==='number')own.currentTime=a.time;}if(a.state==='paused')own.pause();else if(a.state==='running'&&own.playState==='paused')own.play();});el._moonshineAnimations.forEach(function(a,key){if(!active.has(key)){a.cancel();el._moonshineAnimations.delete(key);}});},
 snapshot:function(el){return el.getAnimations().filter(function(a){return a.effect&&a.effect.target===el&&!(a instanceof CSSAnimation)&&!(a instanceof CSSTransition);}).map(function(a){if(!ids.has(a))ids.set(a,'MOONSHINE-animation-'+(++next));var t=a.effect.getTiming();return {key:ids.get(a),frames:a.effect.getKeyframes(),timing:{duration:t.duration,delay:t.delay,fill:t.fill,easing:t.easing,iterations:t.iterations},time:a.currentTime,state:a.playState};});}
};})();
