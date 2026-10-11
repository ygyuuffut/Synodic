/* Plain chrome content normalization; no visibility, layout or animation. */
(function(){'use strict';var L=window.LUNAR;
 function block(node,path){path=String(path==null?'0':path);var key='MOONSHINE-chrome-content-'+path;
  if(node.tag==='#text')return {tag:'#text',key:key,text:node.text};
  var attrs=Object.assign({},node.attrs),classes=attrs['data-ms-class']||'';
  if(node.tag==='button'||/\b(?:arc-dlg-name|enc-title|ev-title|arc-dlg-opts|enc-choices|ev-choices|blessing-actions|body-senses-row|body-exit-btn|enc-collapse-btn|enc-page-continue|enc-continue|avery-love-wrap|avery-love-num|avery-love-track|fate-avery-hpnum)\b/.test(classes))return null;
  // Content identity is semantic position, independent of native node replacement.
  // Narrative commands use the formal story ID; these blocks carry no controls.
  if(attrs['data-ms-id'])attrs.id='MOONSHINE-'+attrs['data-ms-id'];
  return {tag:node.tag,key:key,attrs:attrs,svg:node.svg,children:node.children.map(function(child,index){return block(child,path+'.'+index);}).filter(Boolean)};
 }
 function love(text){var match=String(text||'').match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*♥\s*LOVE\s*$/i);if(!match)return null;var current=Number(match[1]),maximum=Number(match[2]);return Number.isFinite(current)&&Number.isFinite(maximum)&&maximum>0?{current:current,maximum:maximum}:null;}
 function hp(text){var match=String(text||'').match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*HP\s*$/i);if(!match)return null;var current=Number(match[1]),maximum=Number(match[2]);return Number.isFinite(current)&&Number.isFinite(maximum)&&maximum>0?{current:current,maximum:maximum}:null;}
 L.adapter.chrome={block:block,love:love,hp:hp,mode:function(scene){return scene==='Start'?'COMBAT':/^(?:MapScreen|StomachMap|Lab)$/.test(scene)?'MAP':/^(?:boot|Menu|CharacterSelect)$/.test(scene)?'OUTSIDE':'NORMAL';}};
})();
