/* Sole early presentation exception: no game access or external dependencies. */
(function(){'use strict';var overlay=document.createElement('div');overlay.id='MOONSHINE-loading';overlay.setAttribute('data-MOONSHINE-owned','');overlay.setAttribute('role','status');overlay.setAttribute('aria-label','Loading');overlay.setAttribute('translate','no');
 var logo=document.createElement('div');logo.className='MOONSHINE-loading-logo';var left=document.createElement('span');left.textContent='SYN';var moon=document.createElement('span');moon.className='MOONSHINE-loading-moons';moon.setAttribute('aria-hidden','true');
 Array.from('🌑🌒🌓🌔🌕🌖🌗🌘').forEach(function(glyph,i){var frame=document.createElement('span');frame.textContent=glyph;frame.style.setProperty('--moon-frame',i);moon.appendChild(frame);});var right=document.createElement('span');right.textContent='DIC';logo.append(left,moon,right);overlay.appendChild(logo);document.documentElement.appendChild(overlay);
 // One opacity owner: entry and exit must not compete with CSS animations.
 // Completion follows the rendered animation, not a game-wrapped timeout.
 var completion=Promise.resolve(),complete=null,motion=null,shown=false,reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
 function fade(visible){
  if(shown===visible)return completion;
  var from=visible&&overlay.hidden?0:motion?parseFloat(getComputedStyle(overlay).opacity):visible?0:1;
  shown=visible;if(motion){motion.cancel();motion=null;if(complete){complete();complete=null;}}
  overlay.hidden=false;overlay.classList.toggle('MOONSHINE-loading-leaving',!visible);
  if(reduced.matches||!overlay.animate){overlay.hidden=!visible;completion=Promise.resolve();return completion;}
  var current=overlay.animate([{opacity:from},{opacity:visible?1:0}],{duration:140,easing:'ease',fill:'both'});
  // Start against the current presentation clock, even if native boot delays
  // the next animation frame. Otherwise entry can remain pending at opacity 0.
  var clock=document.timeline&&document.timeline.currentTime;if(clock!=null)current.startTime=clock;
  motion=current;completion=new Promise(function(resolve){complete=resolve;});
  current.onfinish=function(){if(motion!==current)return;overlay.hidden=!shown;motion=null;current.cancel();if(complete){complete();complete=null;}};return completion;
 }
 performance.mark('SYNODIC.SHELL');fade(true);
 window.SYNODIC_BOOTSTRAP=Object.freeze({node:overlay,show:function(){return fade(true);},hide:function(){return fade(false);}});
})();
