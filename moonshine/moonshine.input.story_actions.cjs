/* Standalone menu input stays on its owned surface, ahead of game shortcuts. */
(function(){'use strict';
 window.MOONSHINE_ACTION_INPUT={bind:function(root,handle){
  function route(event){if(!root.contains(event.target))return;event.stopImmediatePropagation();
   if(event.type==='click'){LUNAR.api.moonshine.logger.scope('MOONSHINE.actions').info('PLAYER_INPUT',{event:'click',action:event.target.closest('[data-action-id]')?.dataset.actionId,intent:event.target.closest('[data-intent]')?.dataset.intent});event.preventDefault();handle(event.target,event);}
   if(event.type==='keydown'&&event.key==='Escape'){event.preventDefault();handle(null,event);}
   if(event.type==='keydown'&&event.key==='Tab'){var modal=root.querySelector('.MOONSHINE-upgrade-preview')||root.querySelector('[role="dialog"]');if(!modal)return;var list=Array.from(modal.querySelectorAll('button:not(:disabled),[tabindex="0"]')).filter(function(el){return !el.closest('[inert]')&&el.getBoundingClientRect().width;});if(list.length){event.preventDefault();var index=list.indexOf(document.activeElement);list[(index+(event.shiftKey?list.length-1:1))%list.length].focus({preventScroll:true});}else {event.preventDefault();modal.focus();}}
  }
  ['click','keydown','pointerdown','pointerup','mousedown','mouseup'].forEach(function(type){window.addEventListener(type,route,true);});
  return function(){['click','keydown','pointerdown','pointerup','mousedown','mouseup'].forEach(function(type){window.removeEventListener(type,route,true);});};
 }};
})();
