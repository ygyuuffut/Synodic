/* Owned map buttons bypass compatibility ancestors and native shortcuts. */
(function(){'use strict';
 function button(event){return event.target instanceof Element&&event.target.closest('.MOONSHINE-map-canvas [data-map-node]');}
 window.addEventListener('click',function(event){var node=button(event);if(!node)return;event.preventDefault();event.stopImmediatePropagation();if(!node.closest('[inert]'))MOONSHINE_MAP.activate(node.dataset.mapNode);},true);
 window.addEventListener('keydown',function(event){var node=button(event);if(!node||event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();event.stopImmediatePropagation();if(!node.closest('[inert]'))MOONSHINE_MAP.activate(node.dataset.mapNode);},true);
})();
