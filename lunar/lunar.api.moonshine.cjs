/* Versioned consumer API. MOONSHINE never receives native DOM or game functions. */
(function () {
  'use strict';
  var L=window.LUNAR, sourceCycle=-1, sourceScope=null, sourceSnapshot=null,sourceProfile=null;
  function blocked(){return L.recovery.blocked()||L.assets&&L.assets.locked();}
  function command(fn){return function(){if(blocked())return false;return fn.apply(null,arguments);};}
  function install(){L.bridge.saves.install();L.bridge.chrome.install();L.bridge.native.install();L.bridge.resources.install();L.bridge.scan.install();L.bridge.collectedData.install();L.bridge.effects.install();L.bridge.combat.install();L.bridge.cardPanel.install();L.bridge.labNotice.install();}
  function immutable(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(immutable);Object.freeze(value);}return value;}
  // One converted, read-only exchange snapshot per native update cycle.
  // Neither consumers nor buffers can turn this cache into game authority.
  function sources(){
    var cycle=L.bridge.port.revision(),scope=L.buffer.getScope();
    if(sourceSnapshot&&sourceCycle===cycle&&sourceScope===scope&&sourceProfile===(L.assets&&L.assets.status().profile))return sourceSnapshot;
    install();var views=L.bridge.native.capture();
    sourceSnapshot=immutable({views:views,body:L.adapter.data.snapshot(Object.fromEntries(Array.from(document.body.attributes).map(function(a){return [a.name,a.value];}))),html:L.adapter.data.snapshot(Object.fromEntries(Array.from(document.documentElement.attributes).map(function(a){return [a.name,a.value];})))});
    sourceCycle=L.bridge.port.revision();sourceScope=L.buffer.getScope();sourceProfile=L.assets&&L.assets.status().profile;return sourceSnapshot;
  }
  L.api.moonshine=Object.freeze({
    version:1,
    labNotice:Object.freeze({read:function(){return immutable(L.bridge.labNotice.read());},close:command(L.bridge.labNotice.close),confirm:command(L.bridge.labNotice.confirm)}),
    runReport:Object.freeze({read:function(){return immutable(L.bridge.runReport.read());},valid:L.bridge.runReport.valid,proceed:command(L.bridge.runReport.proceed),inspect:command(L.bridge.runReport.inspect)}),
    recovery:Object.freeze({status:L.recovery.status,subscribe:L.recovery.subscribe,acknowledge:L.recovery.acknowledge,exportCrash:L.recovery.exportCrash,exportFailed:L.recovery.exportFailed,restart:L.recovery.restart}),
    graphicsQuality:Object.freeze({status:L.assetQuality.status,subscribe:L.assetQuality.subscribe,commit:L.assets.changeQuality,apply:L.assets.applyQuality,onPrepare:L.assets.onQualityPrepare}),
    combat:Object.freeze({result:function(id){return immutable(L.bridge.combat.result(id));},settle:command(L.bridge.combat.settle),advance:command(L.bridge.combat.advance),read:function(){return immutable(L.bridge.combat.read());},pile:function(id,mode){return immutable(L.bridge.combat.pile(id,mode));},details:function(id,who){return immutable(L.bridge.combat.details(id,who));},acknowledge:command(L.bridge.combat.acknowledge),play:command(L.bridge.combat.play),end:command(L.bridge.combat.end),inspect:command(L.bridge.combat.inspect),previewOpen:L.bridge.combat.previewOpen}),
    chrome:Object.freeze({background:function(){return immutable(L.bridge.chrome.background());},sceneReady:L.bridge.chrome.sceneReady,story:function(){return immutable(L.bridge.chrome.story());},presentation:L.bridge.chrome.presentation,subscribe:L.bridge.chrome.subscribe,viewArt:command(function(){return L.bridge.native.call('stgToggleViewArt');})}),
    fonts:L.fonts,
    assets:Object.freeze(Object.fromEntries(['readiness','presentationFallback','presentation','status','resolve','source','allow','request','cancelOwner','start','presented','scene','subscribe','keep','accept','onRestore','locked'].map(function(name){return [name,L.assets[name]];}))),
    transitions:Object.freeze({timing:L.transitions.timing,onCover:L.transitions.onCover,status:L.transitions.status,subscribe:L.transitions.subscribe,onPresent:L.transitions.onPresent}),
    scan:Object.freeze({read:function(){return immutable(L.bridge.scan.read());},inspection:function(id){return L.assets.locked()?null:immutable(L.bridge.scan.inspection(id));},token:command(L.bridge.scan.token),release:L.bridge.scan.release,hit:command(function(id,token){return immutable(L.bridge.scan.hit(id,token));}),freeze:command(L.bridge.scan.freeze),suspend:L.bridge.scan.suspend}),
    collectedData:Object.freeze({read:function(character,id){return L.assets.locked()?null:immutable(L.bridge.collectedData.read(character,id));},detail:function(id,key){return L.assets.locked()?null:immutable(L.bridge.collectedData.detail(id,key));},inspection:function(id,key){return L.assets.locked()?null:immutable(L.bridge.collectedData.inspection(id,key));},valid:L.bridge.collectedData.valid,release:L.bridge.collectedData.release}),
    effects:Object.freeze({subscribe:L.bridge.effects.subscribe}),
    logger:L.logger,
    diagnostics:L.api.diagnostics,
    display:Object.freeze({viewport:L.bridge.main_menu.viewport,resetRecommended:function(){return L.bridge.native.call('stgResetToRecommended');}}),
    cardPanel:Object.freeze({read:function(){return immutable(L.bridge.cardPanel.read());},inspect:command(L.bridge.cardPanel.inspect),submit:command(L.bridge.cardPanel.submit),cancel:command(L.bridge.cardPanel.cancel)}),
    cards:Object.freeze({previewOpen:L.bridge.cards.previewOpen,deck:function(){return immutable(L.bridge.cards.deck());},art:L.bridge.cards.art,dismissPopup:command(L.bridge.native.dismissCardPopup)}),
    compendium:Object.freeze({catalog:function(){return immutable(L.bridge.cards.catalog());},cardsUnlocked:L.bridge.compendium.unlocked,unlockCards:command(L.bridge.compendium.unlockCards)}),
    saves:Object.freeze({subscribeAutosave:L.bridge.saves.subscribeAutosave,loadAutosave:command(L.bridge.saves.loadAutosave)}),
    map:Object.freeze({read:L.bridge.map.read,enter:command(L.bridge.map.enter)}),
    location:Object.freeze({context:L.bridge.location.context,read:L.bridge.location.read}),
    mainMenu:Object.freeze({read:L.bridge.main_menu.read,watermark:L.bridge.main_menu.watermark}),
  mods:Object.freeze({context:L.bridge.mods.context,read:L.bridge.mods.read,setEnabled:L.bridge.mods.setEnabled}),
    mode:function(){return STG_DISPLAY_CONFIG.detectMode();},
    profile:function(){return L.adapter.data.snapshot(STG_DISPLAY_CONFIG.mobile);},
    setMode:function(mode){STG_DISPLAY_CONFIG.mode=mode;window.dispatchEvent(new Event('stg-display-config-change'));},
    sources:sources,
    updates:Object.freeze({domains:L.bridge.updates.domains,scalars:L.bridge.updates.scalars,partial:L.bridge.native.partial}),
    stylesRevision:L.bridge.native.stylesRevision,
    styles:function(){return L.bridge.native.styles();},
    subscribe:function(fn){return L.bridge.port.subscribe(function(){fn(L.bridge.port.change());});},
    dispatch:function(key,type,data){if(L.recovery.blocked())return L.bridge.native.acknowledgeFatal(key,type,data);if(L.assets&&L.assets.locked())return false;return L.bridge.native.dispatch(key,type,data);},
    action:function(name){if(blocked())return false;var args=Array.prototype.slice.call(arguments,1);if(L.adapter.actions.list().includes(name)){var command=L.adapter.actions.translate(name,args);return L.bridge.native.call.apply(null,[command.nativeName].concat(command.args));}return L.bridge.interfaces.call.apply(null,[name].concat(args));},
    presented:function(ids){return L.bridge.story.presented(ids);},
    detach:function(){L.bridge.native.restore();},
    snapshot:function(){L.bridge.game.refresh();return L.buffer.game.read('normalized');},
    catalogs:function(){return L.buffer.game.read('catalogs');},
    pending:function(){return L.buffer.story.pending();},
    story:Object.freeze({read:L.bridge.story.read,complete:command(L.bridge.story.complete),presentation:L.bridge.story.presentation}),
    actions:Object.freeze({inspect:command(L.bridge.actions.inspect),flags:L.bridge.actions.flags,state:L.bridge.actions.state,read:function(){install();return L.bridge.actions.read();},select:command(L.bridge.actions.select),confirm:command(L.bridge.actions.confirm),execute:command(L.bridge.actions.execute)}),
    viewport:function(value){return value?L.buffer.ui.write('viewport',value):L.buffer.ui.read('viewport');},
    exchange:function(data){return L.buffer.presentation.write('active',data);},
    resources:Object.freeze({plan:L.adapter.images.plan,reselect:L.adapter.images.reselect,backgroundImage:L.adapter.images.backgroundImage,withResolved:L.adapter.images.withResolved,resolve:L.assets.resolve,background:L.assets.background,backgroundDegraded:L.assets.backgroundDegraded,encounter:L.bridge.resources.encounter,variant:function(){return L.adapter.images.variant.apply(L.adapter.images,arguments);},art:function(){return L.adapter.images.art.apply(L.adapter.images,arguments);}}),
    timing:Object.freeze({subscribe:function(fn){return LUNAR.bridge.pause.subscribe(fn);},ui:function(fn){return LUNAR.bridge.pause.ui(fn);},acquire:function(owner){LUNAR.bridge.pause.acquire(owner);},release:function(owner){LUNAR.bridge.pause.release(owner);},active:function(){return LUNAR.bridge.pause.active();},mount:function(){LUNAR.bridge.pause.mount();}}),
    // Native-symbol compatibility is a translation adapter, not a native object.
    port:Object.freeze({read:L.bridge.port.read,write:L.bridge.port.write,invoke:L.bridge.port.invoke,route:L.bridge.port.route}),
    storage:Object.freeze({getItem:function(key){return localStorage.getItem(key);},setItem:function(key,value){localStorage.setItem(key,value);},removeItem:function(key){localStorage.removeItem(key);}}),
    resetStorage:function(){[localStorage,sessionStorage].forEach(function(store){var keys=Array.from({length:store.length},function(_,i){return store.key(i);});keys.filter(function(key){return key&&key.indexOf('stg_')===0;}).forEach(function(key){store.removeItem(key);});});if(window.SugarCube){if(SugarCube.storage)SugarCube.storage.clear();if(SugarCube.session)SugarCube.session.clear();}},
    nativeAlert:function(message){return (window._stgNativeAlert||window.alert)(message);}
  });
})();
