/* Read only the requested slot at confirmation time, without retaining a run. */
(function(){
 'use strict';
 var L=window.LUNAR,listeners=new Set(),installed=false,log=L.logger.scope('LUNAR.saves');
 function install(){if(installed||typeof window.stgWriteAutosave!=='function')return;installed=true;var original=window.stgWriteAutosave;
  // A completed save is not a game/scene refresh. Native serialization stays
  // authoritative; notices query the saved payload only when actually needed.
  var wrapped=function(){var result=original.apply(this,arguments);if(result)listeners.forEach(function(fn){fn(Object.freeze({success:true}));});return result;};Object.assign(wrapped,original);window.stgWriteAutosave=wrapped;
 }
 function confirmOptions(options){
  var operation=L.adapter.saves.intent(options);
  if(!operation||typeof window.stgReadSaveSlot!=='function')return options;
  var payload=window.stgReadSaveSlot(operation.index);
  return L.adapter.saves.named(options,operation,payload&&payload.saveName);
 }
 function loadAutosave(){
  var picker=document.getElementById('stg-slot-picker'),payload=typeof window.stgReadAutosave==='function'&&window.stgReadAutosave();
  if(!picker||!payload||typeof window.stgDeserializeRun!=='function'||typeof window.stgGoTo!=='function')return false;
  var scope=L.buffer.getScope(),game=window._STG,used=false;
  log.info('AUTOSAVE_LOAD_REQUEST',{resume:payload.resume||'MapScreen'});
  function load(){
   if(used||!picker.isConnected||scope!==L.buffer.getScope()||game!==window._STG)return false;used=true;
   return L.bridge.pause.game(function(){
    if(!window.stgDeserializeRun(payload)){log.warn('AUTOSAVE_LOAD_REJECTED',{reason:'native-deserialize'});L.bridge.native.call('stgShowAlertModal',{body:'Load failed. The save may be corrupt or from a different version.'});return false;}
    L.bridge.native.call('stgCloseSlotPicker');
    ['stgInitAudio','stgUnlockAudio','stgStartBgm'].forEach(function(name){if(typeof window[name]==='function')L.bridge.native.call(name);});
    L.bridge.native.call('stgGoTo',payload.resume||'MapScreen');
    log.info('AUTOSAVE_LOAD_COMMIT',{resume:payload.resume||'MapScreen'});return true;
   });
  }
  if(game){L.bridge.native.call('stgShowConfirmModal',{title:'Load Autosave?',body:'Your current in-memory run will be replaced.',okLabel:'Load',cancelLabel:'Cancel',onConfirm:load,onCancel:function(){used=true;}});return true;}
  return load();
 }
 L.bridge.saves={confirmOptions:confirmOptions,install:install,loadAutosave:loadAutosave,subscribeAutosave:function(fn){install();listeners.add(fn);return function(){listeners.delete(fn);};}};
})();
