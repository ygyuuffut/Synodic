/* Modal keyboard containment and semantic module intents. */
(function(){'use strict';
 function bind(root,handlers){
  function click(event){var button=event.target.closest('button');if(!button||button.disabled||button.closest('[inert]'))return;
   if(button.classList.contains('MOONSHINE-mods-launcher'))handlers.open();
   else if(button.classList.contains('MOONSHINE-mods-close'))handlers.close();
   else if(button.classList.contains('MOONSHINE-mods-export'))handlers.exportPrevious();
   else {var card=button.closest('[data-mod-id]');if(card)handlers.row(card.dataset.modId,button.dataset.intent==='toggle');}
  }
  function key(event){var dialog=root.querySelector('[role="dialog"]');if(!dialog)return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();handlers.close();}
   if(event.key==='Tab'){var items=Array.from(dialog.querySelectorAll('button:not(:disabled),[tabindex="0"]')).filter(function(el){return !el.closest('[inert]')&&el.getClientRects().length;});
    if(!items.length)return;var index=items.indexOf(document.activeElement),next=event.shiftKey?index-1:index+1;if(next<0||next>=items.length){event.preventDefault();items[event.shiftKey?items.length-1:0].focus();}
   }
  }
  function route(event){if(!root.contains(event.target))return;event.stopImmediatePropagation();if(event.type==='click'){event.preventDefault();click(event);}else if(event.type==='keydown')key(event);}
  var types=['click','keydown','pointerdown','pointerup','mousedown','mouseup'];types.forEach(function(type){window.addEventListener(type,route,true);});
  return function(){types.forEach(function(type){window.removeEventListener(type,route,true);});};
 }
 window.MOONSHINE_MOD_INPUT={bind:bind};
})();
