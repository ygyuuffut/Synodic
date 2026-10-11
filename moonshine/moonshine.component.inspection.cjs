/* Owned read-only image inspection. The caller owns navigation and pause. */
(function(){'use strict';var C=MOONSHINE_ACTION_COMPONENTS;
 function create(value,onReturn,onFailure){
  var root=C.element('section','inspection'),viewport=C.element('div','inspection-viewport'),stage=C.element('div','inspection-stage'),image=C.element('img','inspection-image'),fallback=C.element('p','inspection-fallback','Image unavailable. You can return to the scanner.'),footer=C.element('footer','inspection-footer'),controls=C.element('div','inspection-controls');
  root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Scan background viewer');root.dataset.msCssLayout='true';image.dataset.msArtRole='cg';image.alt='Scan background artwork';image.draggable=false;image.decoding='async';image.loading='lazy';fallback.hidden=true;fallback.setAttribute('role','status');stage.append(image,fallback);viewport.append(stage);
  var back=C.button('RETURN','inspection-return'),minus=C.button('-','inspection-minus'),fit=C.button('FIT','inspection-fit'),plus=C.button('+','inspection-plus');fit._source='FIT';back.setAttribute('aria-label','Return to scanner');minus.setAttribute('aria-label','Zoom out');fit.setAttribute('aria-label','Fit artwork to screen');plus.setAttribute('aria-label','Zoom in');[minus,fit,plus].forEach(function(b){b.disabled=true;});controls.append(minus,fit,plus);footer.append(back,controls);root.append(viewport,footer);
  var ratio=1,destroyed=false,observer=null,frame=null;
  function layout(center){
   if(destroyed||!image.naturalWidth)return;
   // Read this component once, then write; no workspace or global fit.
   var vw=viewport.clientWidth,vh=viewport.clientHeight,oldW=image.offsetWidth||1,oldH=image.offsetHeight||1,cx=viewport.scrollLeft+vw/2,cy=viewport.scrollTop+vh/2;
   if(!vw||!vh)return;var scale=Math.min(vw/image.naturalWidth,vh/image.naturalHeight)*ratio,w=Math.max(1,Math.round(image.naturalWidth*scale)),h=Math.max(1,Math.round(image.naturalHeight*scale));
   image.style.width=w+'px';image.style.height=h+'px';stage.style.width=Math.max(vw,w)+'px';stage.style.height=Math.max(vh,h)+'px';
   var text=Math.abs(ratio-1)<.03?'FIT':Math.round(ratio*100)+'%';if(fit._source!==text){fit.textContent=text;fit._source=text;}
   viewport.scrollLeft=center?cx*w/oldW-vw/2:Math.max(0,(w-vw)/2);viewport.scrollTop=center?cy*h/oldH-vh/2:Math.max(0,(h-vh)/2);minus.disabled=ratio<=.75;plus.disabled=ratio>=4;
  }
  function geometry(){if(frame!==null||destroyed)return;frame=requestAnimationFrame(function(){frame=null;layout(true);});}
  function handle(event){
   if(event.type==='click'){var button=event.target.closest('button');if(!button||button.disabled)return;if(button===back){onReturn();return;}if(button===fit){ratio=1;layout(false);}else if(button===minus||button===plus){ratio=Math.max(.75,Math.min(4,ratio*(button===plus?1.25:.8)));layout(true);}}
   if(event.type==='keydown'){if(event.key==='Escape'){event.preventDefault();onReturn();}else if(event.key==='Tab'){var buttons=[back,minus,fit,plus].filter(function(b){return !b.disabled;}),i=buttons.indexOf(document.activeElement);event.preventDefault();buttons[(i+(event.shiftKey?buttons.length-1:1))%buttons.length].focus({preventScroll:true});}}
  }
  function mount(parent){MOONSHINE_PRESENTATION.enterCinematic('scan-inspection',{reason:'scan-inspection',hud:false,story:false});parent.append(root);observer=new ResizeObserver(geometry);observer.observe(viewport);image.onload=function(){if(destroyed)return;fit.disabled=false;layout(false);};image.onerror=function(){if(destroyed)return;image.hidden=true;fallback.hidden=false;onFailure();};if(value.image)image.src=value.image;else image.onerror();back.focus({preventScroll:true});}
  function destroy(){if(destroyed)return;destroyed=true;MOONSHINE_PRESENTATION.exitCinematic('scan-inspection');if(observer)observer.disconnect();if(frame!==null)cancelAnimationFrame(frame);image.onload=image.onerror=null;image.removeAttribute('src');root.remove();}
  return Object.freeze({root:root,mount:mount,handle:handle,destroy:destroy,geometry:geometry});
 }
 window.MOONSHINE_INSPECTION=Object.freeze({create:create});
})();
