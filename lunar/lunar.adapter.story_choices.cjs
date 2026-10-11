/* Full-screen narrative choice DTOs. Rich copy is not an accessible label. */
(function(){'use strict';var L=window.LUNAR;
 L.adapter.storyChoices={
  normalize:function(source){return {
   sceneId:source.sceneId,branchId:source.id,available:true,title:source.title,
   // Never flatten HTML/CRLF with whitespace regexes. DOM serialization has
   // already normalized CRLF to LF; BR, paragraphs and inline markup survive.
   html:String(source.html||''),blocks:[],background:source.background,
   actionsAvailable:!source.consumed,viewArtAvailable:false,
   items:source.items.map(function(item){var label=L.adapter.storyActions.label(item.text);return {id:item.id,label:label,summary:label,html:String(item.html||''),category:'dialogue',activation:item.role==='menu'?'direct':'accordion',disabled:!!(source.consumed||item.disabled)};})
  };}
 };
})();
