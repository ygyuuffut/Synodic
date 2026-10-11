/* Read-only native catalog handles. No scanner sessions, rewards or story commands. */
(function(){'use strict';var L=window.LUNAR,log=L.logger.scope('LUNAR.collected_data'),active=null,serial=0,passiveKey='passive.avery.stomach';
 function stomach(){var s=L.bridge.location.source();return !!(s&&s.root.id==='stg-stomach-root');}
 function eligible(character){return L.bridge.location.hasCharacter(character)||character==='avery'&&stomach();}
 function valid(id,key){var s=L.bridge.location.source(),c=L.bridge.location.context();return !!(active&&active.id===id&&STG_DISPLAY_CONFIG.detectMode()==='mobile'&&s&&s.kind==='map'&&s.root===active.root&&window._STG===active.game&&L.buffer.getScope()===active.scope&&c.available&&c.key===active.location&&((window.STG_CHARACTER_SCANS||{})[active.character]||null)===active.catalog&&eligible(active.character)&&(key===undefined||active.entries.has(key)&&(key===passiveKey&&stomach()||!!((window._STG||{}).scansCaptured||{})[key])));}
 function read(character,id){
  if(id!==undefined){if(!valid(id)||character!==active.character)return null;}
  else{var s=L.bridge.location.source(),c=L.bridge.location.context();if(!s||s.kind!=='map'||STG_DISPLAY_CONFIG.detectMode()!=='mobile'||!c.available||!eligible(character))return null;
   var catalog=(window.STG_CHARACTER_SCANS||{})[character];if(!Array.isArray(catalog))return null;
   active={id:'collected-'+(++serial),character:character,root:s.root,game:window._STG,scope:L.buffer.getScope(),location:c.key,catalog:catalog,entries:new Map(catalog.map(function(entry){return [entry.key,entry];}))};
   if(character==='avery'&&stomach())active.entries.set(passiveKey,{key:passiveKey,label:"Avery — Avery's Stomach (Passive Scan)",img:window.STG_STOMACH_SCAN,passive:true});
   log.info('COLLECTED_DATA_CONTEXT',{context:active.id,character:character,total:catalog.length});
  }
  return L.adapter.collectedData.list(active.id,character,Array.from(active.entries.values()),(window._STG||{}).scansCaptured||{});
 }
 function detail(id,key){if(typeof key!=='string'||!valid(id,key))return null;var entry=active.entries.get(key),data=key===passiveKey?L.adapter.collectedData.passive(window.STG_AVERY_STOMACH_DIALOGUE_LOGIC||{}):(window.STG_SCAN_DATA||{})[key];if(!data){log.warn('COLLECTED_DATA_MISSING_REPORT',{context:id,key:key});return null;}
  var image=L.adapter.images.scan(entry.img);log.info('COLLECTED_DATA_DETAIL',{context:id,key:key});return L.adapter.scan.archive({id:id+':'+key,collectionId:id,key:key,label:entry.label,image:image},data);
 }
 function inspection(id,key){if(typeof key!=='string'||!valid(id,key))return null;return {id:id+':'+key,image:L.adapter.images.scan(active.entries.get(key).img)};}
 function release(id){if(active&&active.id===id){log.info('COLLECTED_DATA_RELEASED',{context:id});active=null;}}
 function install(){var original=window.stgMarkScanCaptured;if(typeof original!=='function'||original._lunarCollectedData)return;var wrapped=function(key){var before=!!((window._STG||{}).scansCaptured||{})[key],result=original.apply(this,arguments);if(!before&&!!((window._STG||{}).scansCaptured||{})[key])L.bridge.port.emit(['collectedData','location.nearby']);return result;};Object.assign(wrapped,original);wrapped._lunarCollectedData=true;window.stgMarkScanCaptured=wrapped;}
 window.addEventListener('LUNAR-navigation',function(e){if(active&&e.detail&&e.detail.type===':passageinit')release(active.id);});
 L.bridge.collectedData=Object.freeze({read:read,detail:detail,inspection:inspection,valid:valid,release:release,install:install});
})();
