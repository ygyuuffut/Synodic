/* Narrow main-menu presence and immutable, build-time presentation configuration. */
(function(){'use strict';var L=window.LUNAR;
 var node=document.getElementById('LUNAR-main-menu-watermark'),config=JSON.parse(node.textContent);
 Object.freeze(config.font);Object.freeze(config);
 function viewport(){var v=window.visualViewport;return {width:innerWidth,height:v?v.height:innerHeight,offsetTop:v?v.offsetTop:0,scale:parseFloat(getComputedStyle(document.documentElement).zoom)||1};}
 function read(){var main=document.getElementById('stg-menu-root'),content=main&&main.querySelector(':scope > .menu-content:not(.menu-content-settings)');
  return {mainMenu:!!(content&&content.querySelector('.menu-title-accent')&&!main.closest('.passage-out')&&!document.querySelector('#stg-fs-prompt,#stg-consent-overlay,#stg-slot-picker,#stg-compendium,#stg-credits,#stg-dev-menu,#stg-confirm-modal,#stg-defeat-cine,#stg-run-stats,#stg-tease,#stg-disp-end')),
   viewport:viewport()};
 }
 L.bridge.main_menu=Object.freeze({read:read,viewport:viewport,watermark:function(){return config;}});
})();
