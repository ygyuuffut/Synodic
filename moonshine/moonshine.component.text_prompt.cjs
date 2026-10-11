/* Small owned text/password dialog. Editing is local presentation state. */
(function(){'use strict';var api=LUNAR.api.moonshine,active=null;
 function element(tag,name){var el=document.createElement(tag);el.className='MOONSHINE-text-prompt-'+name;return el;}
 function chevron(doc){
  var svg=doc.createElementNS('http://www.w3.org/2000/svg','svg'),path=doc.createElementNS('http://www.w3.org/2000/svg','path');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','24');svg.setAttribute('height','24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('translate','no');
  path.setAttribute('d','M6 5 L18 12 L6 19');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','3');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
 }
 function open(options){
  if(active)active.close();if(api.mode()!=='mobile')return null;
  var root=element('div','scrim'),box=element('div','box'),title=element('h2','title'),form=element('form','entry'),input=element('input','input'),ok=element('button','confirm'),cancel=element('button','cancel');
  root.id='MOONSHINE-text-prompt';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('translate','yes');root.dataset.theme=options.theme||'normal';
  box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');title.id='MOONSHINE-text-prompt-title';title.textContent=options.title;box.setAttribute('aria-labelledby',title.id);
  input.type=options.type||'text';input.maxLength=options.maxLength||40;input.autocomplete='off';input.setAttribute('aria-label',options.inputLabel||options.title);input.setAttribute('translate','no');input.spellcheck=false;
  ok.type='submit';ok.setAttribute('aria-label',options.submitLabel||'Confirm');ok.append(chevron(document));cancel.type='button';cancel.textContent=options.cancelLabel||'Cancel';
  form.append(input,ok);box.append(title,form,cancel);root.append(box);
  var background=document.getElementById('MOONSHINE-root'),previousInert=background&&background.inert,previousFocus=document.activeElement,queued=false,closed=false,submitting=false;
  function fit(){if(closed)return;var v=api.mainMenu.read().viewport;root.style.zoom=String(1/v.scale);root.style.width=v.width+'px';root.style.height=v.height+'px';root.style.top=v.offsetTop+'px';}
  function resize(){if(queued||closed)return;queued=true;api.timing.ui(function(){requestAnimationFrame(function(){queued=false;fit();});});}
  function close(){if(closed)return;closed=true;root.remove();input.value='';if(background)background.inert=previousInert;api.timing.release('text-prompt');
   window.removeEventListener('resize',resize);window.removeEventListener('stg-display-config-change',mode);window.removeEventListener('LUNAR-navigation',close);
   if(window.visualViewport){visualViewport.removeEventListener('resize',resize);visualViewport.removeEventListener('scroll',resize);}
   if(active===handle)active=null;if(previousFocus&&previousFocus.isConnected&&!previousFocus.closest('[inert]'))previousFocus.focus({preventScroll:true});if(options.onClose)options.onClose();
  }
  function mode(){if(api.mode()!=='mobile')close();else resize();}
  var handle={close:close,root:root,input:input};active=handle;
  root.addEventListener('click',function(event){event.stopPropagation();if(event.target===root)close();});cancel.addEventListener('click',close);
  root.addEventListener('keydown',function(event){event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();}
   else if(event.key==='Tab'){event.preventDefault();var controls=[input,ok,cancel],index=controls.indexOf(document.activeElement);controls[(index+(event.shiftKey?2:1))%3].focus();}
  });
  form.addEventListener('submit',function(event){event.preventDefault();event.stopPropagation();if(submitting||closed)return;submitting=true;try{options.onSubmit(input.value,handle);}finally{submitting=false;}});
  ['input','change','keyup'].forEach(function(type){root.addEventListener(type,function(event){event.stopPropagation();});});
  if(background)background.inert=true;document.body.append(root);api.timing.acquire('text-prompt');fit();input.focus({preventScroll:true});
  window.addEventListener('resize',resize);window.addEventListener('stg-display-config-change',mode);window.addEventListener('LUNAR-navigation',close);
  if(window.visualViewport){visualViewport.addEventListener('resize',resize);visualViewport.addEventListener('scroll',resize);}
  return handle;
 }
 window.MOONSHINE_TEXT_PROMPT=Object.freeze({open:open,chevron:chevron});
})();
