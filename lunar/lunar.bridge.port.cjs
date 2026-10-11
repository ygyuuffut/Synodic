/* Native handles and route installation stay here, never in the data buffer. */
(function () {
  'use strict';
  var nativeRouteDepth=0;
  var L=window.LUNAR, handles=new Map(), ids=new WeakMap(), sequence=0;
  var log=L.logger.scope('LUNAR.updates'),nativeLog=L.logger.scope('LUNAR.native');
  var changes=new Set(), routes=new Map(), queries=new Set(), uiActions=new Set(), notificationQueued=false, updateRevision=0, observer=null, dirtyDomains=new Set(), lastChange={revision:0,domains:[],targets:[]}, dirtyTargets=new Map();
  var writable=new Set(['_STG_ZOOM','_STG_PROSE_SCALE','_STG_TEXT_WIDTH','_stgSelectedCharId','_stgBlessingSelectedIdx','_stgCompCatalog','_stgCompState']);
  function retain(fn,owner){if(!ids.has(fn))ids.set(fn,'LUNAR-call-'+(++sequence));var id=ids.get(fn);if(!handles.has(id))handles.set(id,{fn:fn,owner:owner});return id;}
  // Node-owned compatibility callbacks expire with their source, unlike global
  // native routes. Sweep at the existing capture boundary, never on a timer.
  function collectRetired(){var count=0;handles.forEach(function(entry,id){var node=entry.owner;if(node instanceof Node&&(!node.isConnected||node.nodeType===1&&node.closest('.passage-out'))){handles.delete(id);queries.delete(id);uiActions.delete(id);count++;}});if(count)nativeLog.debug('RETIRED_HANDLES_RELEASED',{count:count});}
  function pack(value,owner,seen){
    if(typeof value==='function'){var call={LUNARcall:retain(value,owner),flags:L.adapter.data.snapshot(Object.assign({},value))};if(owner instanceof Node)call.transient=true;return call;}
    if(value instanceof Node)return {LUNARnode:value.id||null};
    if(!value||typeof value!=='object')return value;
    seen=seen||new Set();if(seen.has(value))return null;seen.add(value);
    var out=Array.isArray(value)?value.map(function(v){return pack(v,owner,seen);}):Object.fromEntries(Object.entries(value).map(function(p){return [p[0],pack(p[1],value,seen)];}));seen.delete(value);return out;
  }
  function emit(domains,targets){
    var inferred=L.bridge.updates?L.bridge.updates.infer():[];
    if(domains&&domains.length===0&&inferred.length===0&&!(targets&&targets.length))return;
    (domains|| (inferred.length?inferred:['compatibility'])).concat(domains?inferred:[]).forEach(function(domain){dirtyDomains.add(domain);});
    (targets||[]).forEach(function(target){dirtyTargets.set(target.key,target);});
    updateRevision++;if(notificationQueued)return;notificationQueued=true;
    queueMicrotask(function(){notificationQueued=false;lastChange=Object.freeze({revision:updateRevision,domains:Object.freeze(Array.from(dirtyDomains)),targets:Object.freeze(Array.from(dirtyTargets.values()))});dirtyDomains.clear();dirtyTargets.clear();log.debug('DOMAIN_DIRTY',{cycle:updateRevision,domains:lastChange.domains,targets:lastChange.targets.length});log.debug('STATE_NOTIFICATION',{cycle:updateRevision,domains:lastChange.domains,targets:lastChange.targets.length,subscribers:changes.size});changes.forEach(function(fn){fn();});});
  }
  function invoke(id,args){if(L.recovery&&L.recovery.blocked()&&!(L.recovery.status().phase==='AWAITING_ACKNOWLEDGMENT'&&uiActions.has(id)))return false;var entry=handles.get(id);if(!entry){var issued=/^LUNAR-call-([1-9]\d*)$/.exec(id);if(issued&&Number(issued[1])<=sequence)return false;throw new Error('Expired LUNAR action: '+id);}var command=!queries.has(id);if(command&&L.assets&&L.assets.locked()&&!nativeRouteDepth)return false;if(command)nativeLog.info('COMMAND_SENT',{handle:id});var run=function(){return entry.fn.apply(entry.owner,args);};try{var result=uiActions.has(id)?LUNAR.bridge.pause.ui(run):LUNAR.bridge.pause.game(run);if(command){nativeLog.info('COMMAND_RESULT',{handle:id,phase:'returned'});emit();}return pack(result);}catch(error){if(L.recovery)L.recovery.remember(error);if(command)nativeLog.error('COMMAND_RESULT',error,{handle:id,ok:false});throw error;}}
  function read(name){
    if(!/^(?:stg[A-Z]|_stg|_STG|STG_)/.test(name))throw new Error('Unavailable game field: '+name);
    var value=pack(window[name],window);if(value&&value.LUNARcall&&/^stg(?:Get|Load|Build|Read|List|Can|Format|CardsAdmin|ScreenFx|Owned|Icon)/.test(name)){queries.add(value.LUNARcall);value.query=true;}if(value&&value.LUNARcall&&/^stg(?:ShowCardView|RsBoonPopup|ForceHideTip|ShowConfirmModal|ShowPromptModal|ShowAlertModal|OpenSlotPicker|CloseSlotPicker|RenderCompendium|OpenCompendium|CloseCompendium)/.test(name))uiActions.add(value.LUNARcall);return value;
  }
  function write(name,value){if(L.recovery&&L.recovery.blocked())return false;if(!writable.has(name))throw new Error('Native state write requires a dedicated LUNAR command: '+name);window[name]=L.adapter.data.snapshot(value);emit(/^_STG_(?:ZOOM|PROSE_SCALE|TEXT_WIDTH)$/.test(name)?['viewport']: /^_stg(?:SelectedCharId|BlessingSelectedIdx)$/.test(name)?['selection']:['cards']);}
  function route(name,handler,flags){
    if(!/^stg[A-Z]/.test(name)||typeof window[name]!=='function')throw new Error('Unavailable native route: '+name);
    var original=window[name];
    var wrapped=function(){if(STG_DISPLAY_CONFIG.detectMode()!=='mobile')return original.apply(this,arguments);var self=this,args=Array.from(arguments);if(name==='stgShowConfirmModal')args[0]=L.bridge.saves.confirmOptions(args[0]);nativeRouteDepth++;try{return handler(pack(args,self));}finally{nativeRouteDepth--;}};
    Object.assign(wrapped,original,flags||{});window[name]=wrapped;routes.set(name,wrapped);return pack(wrapped,window);
  }
  function relevant(records){return records.filter(function(r){if(L.bridge.pause.controlMutation(r))return false;var el=r.target.nodeType===1?r.target:r.target.parentElement;if(el&&el.closest('[data-MOONSHINE-owned],[data-HECATE-owned]'))return false;if(r.type==='attributes'&&/^(data-lunar-source|aria-hidden|translate)$/.test(r.attributeName)&&r.target._lunarSourceHidden)return false;if(r.type==='attributes'&&(r.target===document.documentElement||r.target===document.body)&&/^(lang|dir|translate)$/.test(r.attributeName))return false;return !(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].every(function(n){return n.nodeType===1&&/^(MOONSHINE|HECATE)/.test(n.id);}));});}
  function collect(records){var list=relevant(records);if(!list.length)return;var domains=new Set(),targets=[];list.forEach(function(r){if(r.type==='childList'&&L.bridge.labNotice&&[...r.addedNodes,...r.removedNodes].length&&[...r.addedNodes,...r.removedNodes].every(function(n){return L.bridge.labNotice.owns(n);})){domains.add('labNotice');return;}if(r.type==='childList'&&L.bridge.runReport&&[...r.addedNodes,...r.removedNodes].length&&[...r.addedNodes,...r.removedNodes].every(function(n){return L.bridge.runReport.owns(n);})){domains.add('runReport');return;}if(r.type==='childList'&&L.bridge.cardPanel&&[...r.addedNodes,...r.removedNodes].length&&[...r.addedNodes,...r.removedNodes].every(function(n){return L.bridge.cardPanel.owns(n);})){domains.add('cards.panel');return;}var change=L.bridge.updates&&L.bridge.updates.describe(r.target,r.type,r.attributeName,r.oldValue);if(!change){domains.add('compatibility');return;}change.domains.forEach(function(d){domains.add(d);});targets.push.apply(targets,change.targets);});emit(Array.from(domains),targets);}
  // Drain native records before reads. Owned translated DOM never enters here.
  function revision(){if(observer)collect(observer.takeRecords());return updateRevision;}
  function observe(){
    observer=new MutationObserver(function(records){collect(records);});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeOldValue:true});
    if(window.jQuery)window.jQuery(document).on(':passageinit.LUNAR :passagedisplay.LUNAR :passageend.LUNAR :storyready.LUNAR',function(e){if(e.type.replace(/^:/,'')==='passagedisplay')log.info('SCENE_CHANGE',{passage:e.passage&&e.passage.title});window.dispatchEvent(new CustomEvent('LUNAR-navigation',{detail:{type:e.type}}));});
  }
  L.bridge.port={retain:retain,collect:collectRetired,pack:pack,read:read,write:write,invoke:invoke,route:route,subscribe:function(fn){changes.add(fn);return function(){changes.delete(fn);};},emit:emit,revision:revision,change:function(){return lastChange;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();
