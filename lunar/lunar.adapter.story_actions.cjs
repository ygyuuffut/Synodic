/* Normalize action labels and offer data; no commands or presentation. */
(function(){'use strict';var L=window.LUNAR;
 var edge=/^[\s\uFE0E\uFE0F◀◂◁←▶►▸▷→▲△▴▵▼▽▾▿↑↓↔↕«»]+/,end=/[\s\uFE0E\uFE0F◀◂◁←▶►▸▷→▲△▴▵▼▽▾▿↑↓↔↕«»]+$/;
 function label(text){return String(text||'').replace(edge,'').replace(end,'').replace(/\s+/g,' ').trim();}
 L.adapter.storyActions={
  label:label,
  loveRequirement:function(text,met){var match=String(text||'').match(/♥\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);if(!match)return null;var current=Number(match[1]),required=Number(match[2]);return Number.isFinite(current)&&Number.isFinite(required)?{kind:'love',current:current,required:required,met:!!met}:null;},
  summary:function(lines){var values=String(lines||'').split('\n').map(label).filter(Boolean);return values.length?values[0]+(values.length>1&&!/(?:\.{3}|…)\s*$/.test(values[0])?'…':''):'';},
  affiliation:function(classes){var match=String(classes||'').match(/(?:^|\s)(?:enc-choice|arc-dlg-opt)-(chaos|grace|logic|balance|instinct|harmony|worship|alpha|void)(?=\s|$)/i);return match?match[1].toLowerCase():null;},
  labelHtml:function(html){
   var parts=String(html||'').replace(/(<\/span>)\s*(<span\b[^>]*class=["'][^"']*\brest-opt-sub\b[^"']*["'][^>]*>)/gi,'$1<br>$2').replace(/&nbsp;/gi,'\u00a0').split(/(<(?:[^>"']|"[^"]*"|'[^']*')*>)/g);
   for(var i=0;i<parts.length;i+=2){parts[i]=parts[i].replace(edge,'');if(parts[i].trim())break;}
   for(var j=parts.length-1;j>=0;j-=2){parts[j]=parts[j].replace(end,'');if(parts[j].trim())break;}
   return parts.join('');
  },
  hasContent:function(html){return /<(?:img|video|audio|svg|canvas)\b/i.test(html||'')||String(html||'').replace(/<!--[\s\S]*?-->|<[^>]*>/g,'').replace(/&(?:nbsp|#160|#xA0);/gi,' ').trim().length>0;},
  category:function(label){return /explore/i.test(label)?'explore':/embark/i.test(label)?'embark':'dialogue';},
  offers:function(items,costs,flavors){return (items||[]).map(function(item,i){return {id:String(item.id||'offer-'+i),title:String(item.title||''),description:String(item.desc||''),icon:String(item.icon||''),flavor:String((flavors||{})[item.title]||''),price:Math.max(0,Number((costs||[])[i])||0),nativeIndex:i};});}
 };
})();
