/* Touch, pointer, keyboard and owned-control routing. */
(function(){'use strict';var api=LUNAR.api.moonshine,workspace=MOONSHINE_WORKSPACE;function ui(fn){return api.timing.ui(fn);}
  // Intercept before the legacy typewriter/global shortcuts see the new target.
  ['click','submit','input','change','keydown','pointerdown','pointermove','pointerup','mousedown','mouseup'].forEach(function(type){
    window.addEventListener(type,function(event){
      // Direct map controls are owned by their semantic input/API path.
      if(event.target instanceof Element&&event.target.closest('.MOONSHINE-map-canvas'))return;
      if(event.target instanceof Element&&event.target.closest('.MOONSHINE-graphics-quality')&&!(type==='keydown'&&['Tab','Escape'].includes(event.key)))return;
      var el=event.target instanceof Element && event.target.closest('#MOONSHINE-root :is([data-ms-key],[data-ms-action-key],[data-ms-pure])');
      if(!el)return;
      if(type==='click'||type==='submit')api.logger.scope('MOONSHINE.runtime').info('PLAYER_INPUT',{event:type,key:el.dataset.msKey,action:el.dataset.msActionKey});
      if(type==='click'){
        var popup=event.target.closest('[data-lunar-control-role="cards.detailBackdrop"]');
        if(popup&&!event.target.closest('[data-ms-class~="stg-card-popup-card"]')){
          event.preventDefault();event.stopImmediatePropagation();
          api.cards.dismissPopup(popup.getAttribute('data-lunar-source-key'));MOONSHINE_RUNTIME.refresh();return;
        }
      }
      // Capture the displayed hand before an overlay changes focus or makes it inert.
      MOONSHINE_RUNTIME.root().querySelectorAll('[data-ms-class~="hand"][data-ms-key]').forEach(function(hand){workspace.dispatch(hand.dataset.msKey,'scroll',{top:hand.scrollTop,left:hand.scrollLeft});});
      // Owned focus/scroll stay in the presentation tree; only actions cross.
      if(type==='keydown' && event.key==='Tab'){
        var dialogs=Array.from(MOONSHINE_RUNTIME.root().querySelectorAll('[role="dialog"]')).filter(function(d){return d.getBoundingClientRect().width && !d.closest('[inert]');});
        var modal=dialogs[dialogs.length-1];if(modal){var controls=Array.from(modal.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter(function(c){return c.getBoundingClientRect().width && getComputedStyle(c).visibility!=='hidden';});if(!controls.length&&modal.matches('[data-lunar-control-role="cards.detailBackdrop"]'))controls=[modal];if(controls.length){event.preventDefault();event.stopImmediatePropagation();var index=controls.indexOf(document.activeElement);controls[(index+(event.shiftKey?controls.length-1:1))%controls.length].focus({preventScroll:true});}}return;
      }
      if(type==='keydown' && event.key==='Escape'){
        var backdrop=event.target.closest('[data-lunar-control-role="cards.detailBackdrop"]');if(backdrop){event.preventDefault();event.stopImmediatePropagation();api.cards.dismissPopup(backdrop.getAttribute('data-lunar-source-key'));return;}
        var dialogs=Array.from(MOONSHINE_RUNTIME.root().querySelectorAll('[role="dialog"]')).filter(function(d){return d.getBoundingClientRect().width&&!d.closest('[inert]');});
        var modal=dialogs[dialogs.length-1],close=modal&&modal.querySelector('[data-ms-id="stg-confirm-cancel"],[data-ms-id="stg-prompt-cancel"],[data-msave-action="close"],[data-ig="close"],[data-ms-class~="stg-mobile-tiny-close"],[data-ms-class~="stg-mobile-cg-return"]');
        if(close){event.preventDefault();event.stopImmediatePropagation();close.click();MOONSHINE_RUNTIME.refresh();return;}
      }
      if(type==='pointermove' && !event.buttons)return;
      event.stopImmediatePropagation();
      if(type==='click' && el.type==='file')return;
      var toggle=/^(checkbox|radio)$/.test(el.type);
      if(/^(input|change)$/.test(type)&&el._moonshineToggle)return;
      if(type==='submit'||type==='click'&&!toggle)event.preventDefault();
      if(type==='click'&&toggle){el._moonshineToggle=true;ui(function(){requestAnimationFrame(function(){el._moonshineToggle=false;});});}
      if(type==='click' && el.closest('[disabled],[inert]')){event.preventDefault();return;}
      var data={x:event.clientX,y:event.clientY,clientX:event.clientX,clientY:event.clientY,key:event.key,shift:event.shiftKey,ctrl:event.ctrlKey,alt:event.altKey,meta:event.metaKey,pointerId:event.pointerId,pointerType:event.pointerType,buttons:event.buttons,button:event.button};
      if(/^(input|change)$/.test(type)){data.value=el.value;data.checked=el.checked;if(el.type==='file')data.files=el.files;}
      var forwarded;if(el.dataset.msActionKey)forwarded=api.action(el.dataset.msActionKey,type,data);else if(el.dataset.msKey)forwarded=workspace.dispatch(el.dataset.msKey,type,data);if(forwarded===false&&(type==='keydown'||type==='click'&&toggle))event.preventDefault();MOONSHINE_RUNTIME.refresh();
      if(type==='click'&&/^(checkbox|radio)$/.test(el.type)){MOONSHINE_RUNTIME.invalidate();}
    },true);
  });
  window.addEventListener('scroll',function(event){var el=event.target instanceof Element && event.target.closest('#MOONSHINE-root [data-ms-key]');if(el)workspace.dispatch(el.dataset.msKey,'scroll',{top:el.scrollTop,left:el.scrollLeft});},true);
})();
