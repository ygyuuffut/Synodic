/* Presentation consumes logical families only; resource ownership stays in LUNAR. */
(function(){'use strict';var fonts=LUNAR.api.moonshine.fonts,style=document.createElement('style');style.id='MOONSHINE-font-roles';style.setAttribute('data-MOONSHINE-owned','');style.textContent=':root{'+fonts.roles().map(function(role){return '--SYNODIC-font-'+role+':'+fonts.resolve(role).family+';';}).join('')+'}';document.head.append(style);
 window.MOONSHINE_FONTS=Object.freeze({emoji:function(){return fonts.load('emoji');},sans:function(){return fonts.load('ui');},mono:function(){return fonts.load('mono');}});
})();
