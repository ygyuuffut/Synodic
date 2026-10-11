/* Narrow native location/legend/roster queries. Never capture the game or mutate pools. */
(function(){'use strict';var L=window.LUNAR,A=L.adapter.location;
 function source(){if(document.querySelector('#stg-defeat-cine,#stg-run-stats,#stg-tease'))return null;var passage=window.SugarCube&&SugarCube.State&&SugarCube.State.passage;
  var id=passage==='MapScreen'?'stg-mapscreen-root':passage==='StomachMap'?'stg-stomach-root':passage==='Lab'?'stg-lab-root':passage==='Start'?'stg-root':null;
  var root=id&&document.getElementById(id);return root&&!root.closest('.passage-out')?{root:root,kind:passage==='Start'?'combat':'map'}:null;
 }
 function context(){var s=source();if(!s)return Object.freeze({available:false});var title=s.root.querySelector(s.kind==='map'?'.mapscreen-title':'.header-floor-main');
  return Object.freeze({available:!!title,kind:s.kind,name:title?title.textContent.trim().replace(/\s*[—–]\s*Passive Scan$/i,''):'',key:s.root.id==='stg-lab-root'?'Lab':String((window._STG||{}).mapState&&_STG.mapState.currentSubmap||'')});
 }
 function legend(root){return L.bridge.map.legend(root);}
 function nearby(root){var g=window._STG||{},scans=window.STG_CHARACTER_SCANS||{},captured=g.scansCaptured||{};
  var rows=Array.from(root.querySelectorAll('.stg-nearby-row')).map(function(row){
   var name=row.querySelector('.stg-nearby-name'),subtitle=row.querySelector('.stg-nearby-sub'),label=name?name.textContent.trim():'',id=label==='Avery'?'avery':label==='Gilly'?'gilly':null;if(!id)return null;
   var hp=g[id+'HpPool'],max=g[id+'HpPoolMax'];if(id==='gilly'){max=max||350;hp=typeof hp==='number'?hp:max;}
   return A.nearby({id:id,name:label,subtitle:subtitle&&subtitle.textContent,portrait:(window.STG_PORTRAITS||{})[label],hp:hp,maxHp:max,affinity:g[id+'LovePool'],collectedData:(id==='avery'&&root.id==='stg-stomach-root'?1:0)+(scans[id]||[]).reduce(function(n,entry){return n+(captured[entry.key]?1:0);},0)});
  }).filter(Boolean);if(root.id==='stg-stomach-root'&&!rows.some(function(r){return r.id==='avery';}))rows.push(A.nearby({id:'avery',name:'Avery',subtitle:'The Maid Girl',portrait:(window.STG_PORTRAITS||{}).Avery,hp:g.averyHpPool,maxHp:g.averyHpPoolMax,affinity:g.averyLovePool,collectedData:1+(scans.avery||[]).reduce(function(n,e){return n+(captured[e.key]?1:0);},0)}));return Object.freeze(rows);
 }
 function read(part){var c=context(),s=source();if(!c.available||c.kind==='combat')return c;
  var result={available:true,kind:c.kind,name:c.name,key:c.key};if(part!=='nearby')result.legend=legend(s.root);if(part!=='legend')result.nearby=nearby(s.root);return Object.freeze(result);
 }
 function stamp(){var g=window._STG||{},m=g.mapState||{};return [m.currentSubmap,m.currentNode,g._stomachNode,g.averyHpPool,g.averyHpPoolMax,g.averyLovePool,g.gillyHpPool,g.gillyHpPoolMax,g.gillyLovePool,g.firstEncounterDone,g.gillyMet];}
 function hasCharacter(id){var s=source(),name={avery:'Avery',gilly:'Gilly'}[id];return !!(s&&s.kind==='map'&&name&&Array.from(s.root.querySelectorAll('.stg-nearby-name')).some(function(el){return el.textContent.trim()===name;}));}
 L.bridge.location=Object.freeze({context:context,read:read,stamp:stamp,source:source,hasCharacter:hasCharacter});
})();
