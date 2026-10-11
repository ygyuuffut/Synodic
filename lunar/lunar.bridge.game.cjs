(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer,log=L.logger.scope('LUNAR.game');
var nativeFunctions=new Map(), catalogScope, catalogRefs=[],scopeSequence=0, checkedCycle=-1, checkedScope=null, inputSignature=null, captured=null;
function inputs(){
    var working={};Object.keys(window).filter(function(name){return /^_stg[A-Z]|^_STG_/.test(name)&&typeof window[name]!=='function';}).forEach(function(name){working[name]=window[name];});
    return {game:L.adapter.data.snapshot(window._STG)||null,working:L.adapter.data.snapshot(working),selection:{character:window._stgSelectedCharId,blessing:L.adapter.data.snapshot(window._stgBlessingPicks||window._stgBlessingOptions||[]),blessingIndex:window._stgBlessingSelectedIdx}};
}
L.bridge.game={
  // DOM/style notifications need sources refreshed, but do not necessarily
  // change game data. A conservative value check avoids repeated normalize /
  // buffer copies without guessing which native callbacks mutate mechanics.
  refresh:function(){
    var cycle=L.bridge.port.revision(),scope=B.getScope();
    if(checkedCycle===cycle&&checkedScope===scope)return captured;
    var value=inputs(),signature=JSON.stringify(value);
    if(scope!==checkedScope||signature!==inputSignature){captured=L.bridge.game.capture(value);inputSignature=signature;}
    checkedCycle=cycle;checkedScope=scope;return captured;
  },capture:function(value){
    log.debug('GAME_CAPTURE');
    value=value||inputs();var snapshotGame=value.game;
    B.game.write('current',snapshotGame);B.game.write('normalized',L.adapter.game.normalize(snapshotGame,B.getScope()));
    B.game.write('working',value.working);B.game.write('selection',value.selection);
    var refs=[window.STG_CARD_TEMPLATES,window.STG_CARD_IMAGES,window.STG_BOONS,window.STG_CHARACTERS];
    if(catalogScope!==B.getScope()||refs.some(function(ref,i){return ref!==catalogRefs[i];})){B.game.write('catalogs',L.adapter.data.snapshot({cards:refs[0],cardImages:refs[1],boons:refs[2],characters:refs[3]}));catalogRefs=refs;catalogScope=B.getScope();}
return B.game.read('current');},install:function(){
    ['stgStartNewGame','stgDeserializeRun'].forEach(function(name){
      var original=window[name];if(typeof original!=='function' || original._lunarBuffer)return;
      var wrapped=function(){if(name==='stgStartNewGame')B.setScope(name+':'+Date.now()+':'+(++scopeSequence));var result=original.apply(this,arguments);if(name==='stgDeserializeRun' && result!==false)B.setScope(name+':'+Date.now()+':'+(++scopeSequence));return result;};
      Object.assign(wrapped,original);wrapped._lunarBuffer=true;window[name]=wrapped;
    });
    // These native tests assume an existing run/fight and otherwise throw
    // from their own logging/render helpers. Reject before any side effect;
    // do not invent a run or rewrite the original developer function.
    ['stgDevForceChyme4','stgDevForceChyme6','stgDevArcBlessingsLock','stgDevArcBlessingsUnlock','stgDevVoidEnding'].forEach(function(name){
      var original=window[name];if(typeof original!=='function'||original._lunarDevGuard)return;
      var wrapped=function(){var fight=/ForceChyme/.test(name),game=window._STG;if(STG_DISPLAY_CONFIG.detectMode()==='mobile'&&(!game||!game.player||fight&&!game.enemy)){
        log.warn('DEV_TEST_UNAVAILABLE',{action:name,reason:fight?'combat_required':'run_required'});
        L.bridge.pause.ui(function(){window.stgShowAlertModal({title:'Developer test unavailable',body:fight?'Start a combat before forcing Melting.':name==='stgDevVoidEnding'?'Start a run before testing a Void Ending.':'Start a run before testing Arc blessings.'});});return false;
      }return original.apply(this,arguments);};Object.assign(wrapped,original);wrapped._lunarDevGuard=true;window[name]=wrapped;
    });
    Object.keys(window).filter(function(name){return /^stg[A-Z]/.test(name);}).forEach(L.bridge.game.register);
},register:function(name){var fn=window[name];if(typeof fn!=='function')return false;if(nativeFunctions.get(name)!==fn){nativeFunctions.set(name,fn);L.bridge.interfaces.register('game.'+name,function(){var result=fn.apply(window,arguments);function normalize(value){var converted=L.adapter.data.snapshot(value);if(converted!==undefined)B.game.write('result:'+name,converted);return converted;}return result&&typeof result.then==='function'?result.then(normalize):normalize(result);},{source:name,returns:'buffered snapshot'});}return true;}};
})();
