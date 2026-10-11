/* Native unlock validation receives a value, never a presentation node. */
(function(){'use strict';var L=window.LUNAR;
 function unlocked(){return typeof window.stgCardsAdminUnlocked==='function'&&!!window.stgCardsAdminUnlocked();}
 function unlockCards(value){
  if(typeof value!=='string'||typeof window.stgCompTryUnlockCards!=='function')return {success:false,available:false};
  // The native synchronous validator has no argument: it reads two legacy IDs.
  // Supply a request-local data facade for those lookups, then restore even on
  // failure. No native/hidden input is created and no password is buffered.
  var input={value:value.slice(0,12),focus:function(){}},lookup=document.getElementById;
  try{
   document.getElementById=function(id){if(id==='comp-admin-input')return input;if(id==='comp-admin-msg')return null;return lookup.call(this,id);};
   L.bridge.pause.ui(function(){window.stgCompTryUnlockCards();});
  }finally{document.getElementById=lookup;input.value='';}
  var success=unlocked();
  if(success)L.bridge.port.emit(['cards']);
  return {success:success,available:true};
 }
 L.bridge.compendium=Object.freeze({unlocked:unlocked,unlockCards:unlockCards});
})();
