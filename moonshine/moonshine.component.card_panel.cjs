/* Compact shared deck/picker shell; the card hand owns selection geometry. */
(function(){'use strict';
 function create(model){var root=document.createElement('section');root.id='MOONSHINE-card-panel';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',model.title);root.dataset.msCssLayout='true';
  var scroll=document.createElement('div');scroll.className='MOONSHINE-combat-hand-scroll';var track=document.createElement('div');track.className='MOONSHINE-combat-hand-track';scroll.append(track);
  var footer=document.createElement('footer'),cancel=document.createElement('button'),title=document.createElement('span'),confirm=document.createElement('button');cancel.type=confirm.type='button';cancel.dataset.cardPanelAction='cancel';cancel.textContent=model.kind==='deck'||model.title==='Reverse Alignment'?'Close':'Cancel';cancel.hidden=!model.cancellable;title.textContent=model.title;confirm.dataset.cardPanelAction='confirm';confirm.textContent='Confirm';confirm.disabled=true;confirm.hidden=model.kind==='deck';footer.append(cancel,title,confirm);root.append(scroll,footer);var overlay=document.createElement('div');overlay.id='MOONSHINE-card-overlay';overlay.setAttribute('data-MOONSHINE-owned','');overlay.append(root);return {overlay:overlay,root:root,scroll:scroll,track:track,cancel:cancel,confirm:confirm,cardAttribute:'data-card-panel-card'};
 }
 window.MOONSHINE_CARD_PANEL_COMPONENT=Object.freeze({create:create});
})();
