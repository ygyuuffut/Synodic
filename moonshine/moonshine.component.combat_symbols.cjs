/* Combat glyphs use the common monochrome Noto Emoji logical role. */
(function(){'use strict';var glyphs={love:'💘︎',block:'🛡︎',damage:'⚔︎',energy:'🔋︎',pile:'🃏︎'};
 function create(kind){var glyph=document.createElement('span');glyph.className='MOONSHINE-combat-symbol';glyph.setAttribute('aria-hidden','true');glyph.translate=false;glyph.textContent=glyphs[kind]||'';return glyph;}
 window.MOONSHINE_COMBAT_SYMBOLS=Object.freeze({create:create});
})();
