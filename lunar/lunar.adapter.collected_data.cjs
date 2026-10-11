/* Only unlocked labels leave the native catalog; unknown rows contain no art/reports. */
(function(){'use strict';var L=window.LUNAR;
 function list(id,character,catalog,captured){var items=catalog.map(function(entry){var complete=entry.passive||!!captured[entry.key];return {id:entry.key,label:complete?String(entry.label||'Scan'):'Undiscovered',complete:!!complete,kind:entry.passive?'passive':'scan'};});return {schema:1,id:id,character:character,collected:items.filter(function(item){return item.complete;}).length,total:items.length,items:items};}
 function passive(dialogue){function plain(value){var doc=new DOMParser().parseFromString(String(value||'').replace(/<br\s*\/?\s*>/gi,'\n'),'text/html');return doc.body.textContent.trim();}return {header:["> LOCATION : Avery's Stomach",'> STATUS : Passive sensors active'],reveals:['heat','walls','tide','scent','voice','shard'].filter(function(k){return dialogue[k];}).map(function(k){return '> '+k.toUpperCase()+' : '+plain(dialogue[k].text);}),trait:[]};}
 L.adapter.collectedData=Object.freeze({list:list,passive:passive});
})();
