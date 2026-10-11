/* Two fixed IndexedDB records. Async rotation/checkpoints, never per-entry localStorage. */
(function(){'use strict';var L=window.LUNAR,db=null,sessionId=null;
 var storageTimeout=window.setTimeout.bind(window),storageClear=window.clearTimeout.bind(window);
 function open(){return new Promise(function(resolve,reject){var request;try{request=indexedDB.open('SYNODIC.diagnostics.v1',1);}catch(e){reject(e);return;}
  var timeout=storageTimeout(function(){expired=true;reject(new Error('Diagnostic storage open timed out'));},3000),expired=false;
  request.onupgradeneeded=function(){try{request.result.createObjectStore('sessions');}catch(error){request.transaction.abort();reject(error);}};
  request.onblocked=function(){expired=true;storageClear(timeout);reject(new Error('Diagnostic storage blocked'));};
  request.onerror=function(){storageClear(timeout);reject(request.error);};request.onsuccess=function(){storageClear(timeout);if(expired){request.result.close();return;}db=request.result;db.onversionchange=function(){db.close();db=null;};resolve(db);};
 });}
 function start(current){sessionId=current.session.id;return open().then(function(){return new Promise(function(resolve,reject){var previous=null,tx=db.transaction('sessions','readwrite'),rows=tx.objectStore('sessions'),get=rows.get('current');
   get.onsuccess=function(){try{previous=get.result||null;if(previous)rows.put(previous,'previous');else rows.delete('previous');rows.put(current,'current');}catch(error){tx.abort();reject(error);}};
   tx.oncomplete=function(){resolve(previous);};tx.onerror=tx.onabort=function(){reject(tx.error||new Error('Diagnostic session rotation failed'));};
  });});}
 function save(current){return new Promise(function(resolve,reject){if(!db){reject(new Error('Diagnostic storage unavailable'));return;}var tx;try{tx=db.transaction('sessions','readwrite');var rows=tx.objectStore('sessions'),get=rows.get('current');
  get.onsuccess=function(){try{if(!get.result||get.result.session.id!==sessionId){tx.abort();return;}rows.put(current,'current');}catch(error){tx.abort();reject(error);}};
  tx.oncomplete=function(){resolve();};tx.onerror=tx.onabort=function(){reject(tx.error||new Error('Diagnostic session replaced by another tab'));};
 }catch(e){reject(e);}});}
 L.bridge.loggerStorage=Object.freeze({start:start,save:save});
})();
