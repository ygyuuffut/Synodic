/* Pure end-of-run normalization. Native score/signature/ordering remain authority. */
(function(){'use strict';var L=window.LUNAR;
 function axes(profile,labels,colors){var keys=['logic','instinct','harmony','balance','grace','chaos'],total=keys.reduce(function(sum,k){return sum+Math.max(0,Number(profile[k])||0);},0);return keys.map(function(k){var score=Math.max(0,Number(profile[k])||0);return {id:k,label:labels[k]||k,score:score,percent:total?score/total*100:0,color:colors[k]||'#a992cf'};});}
 function deck(refs,cards){var counts=new Map();cards.filter(Boolean).forEach(function(c){counts.set(c.name,(counts.get(c.name)||0)+1);});var seen=new Set();return refs.filter(function(c){if(!c||seen.has(c.name)||!counts.has(c.name))return false;seen.add(c.name);return true;}).map(function(c,i){return {id:'card-'+i,name:String(c.name),count:counts.get(c.name),family:L.adapter.cards.family(c)};});}
 L.adapter.runReport=Object.freeze({axes:axes,deck:deck});
})();
