/* Sole compatibility boundary. Native controls remain callback sources only.
   No eval/onclick parsing; snapshots are plain data, never shared DOM. */
(function () {
  'use strict';
  var L=window.LUNAR;
  var snapshotCombat=false,resourceProfile='mobile';if(L.assets)L.assets.subscribe(function(value){resourceProfile=value.profile;});
  var ids=new WeakMap(), nodes=new Map(), next=0, sources=new Set(), animations=new WeakMap(), nextAnimation=0, version=0;
  var cardPopups=new WeakMap(), dismissedCardPopups=new WeakSet();
  var selector='.stg-body-bg-layer, .stomach-bg-layer, .passage:not(.passage-out), #stg-view-art-btn, #stg-prompt-modal, #stg-panel, #stg-menu-root, #stg-charsel-root, #stg-fs-prompt, #stg-consent-overlay, #stg-confirm-modal, #stg-credits, #stg-dev-menu, #stg-settings-fly, #stg-compendium, #stg-slot-picker, #stg-mc-modal, #stg-mobile-tiny-info, #stg-mobile-deck, #stg-mobile-deck-modal, .stg-mobile-deck-layer, .stg-mobile-deck-modal, #stg-mobile-ingame-options, #stg-mobile-cg-viewer, #stg-disp-end, #stg-atk-overlay, #stg-scan-overlay, .stg-card-popup-scrim, .stg-rs-boon-scrim, .lab-overlay';
  function id(node){if(!ids.has(node))ids.set(node,'LUNAR-source-'+(++next));var k=ids.get(node);nodes.set(k,node);if(node.nodeType===1)L.bridge.interfaces.register('controls.'+k,function(type,data){return dispatch(k,type,data);});return k;}
  function snapshot(node){
    if(node.nodeType===3)return {tag:'#text',key:id(node),text:node.nodeValue};
    if(node.nodeType!==1 || /^(script|style|link|noscript)$/i.test(node.tagName))return null;
    if(snapshotCombat&&L.bridge.labNotice&&L.bridge.labNotice.owns(node))return null;
    // Encounter artwork is now a semantic target of the stable Story owner.
    if(snapshotCombat&&node.matches('.ev-bg,.ev-gradient')&&node.closest('#stg-encounter-root'))return null;
    if(snapshotCombat&&(node.id==='stg-defeat-cine'||L.bridge.runReport&&L.bridge.runReport.owns(node)))return null;
    if(snapshotCombat&&L.bridge.storyChoices&&L.bridge.storyChoices.owns(node))return null;
    if(snapshotCombat&&L.bridge.cardPanel&&L.bridge.cardPanel.owns(node))return null;
    if(snapshotCombat&&(node.classList.contains('header')||node.classList.contains('portrait-frame-wrap')||node.classList.contains('stg-combat-footer'))&&node.closest('#stg-root.stg-fullbg'))return null;
    if(snapshotCombat&&node.matches('.game-over-box,#stg-rest-root .rest-content,#stg-rest-root .blessing-header,#stg-ov-next-btn'))return null;
    if(snapshotCombat&&node.matches('.map-legend-inline'))return null;
    // Deck access already belongs to persistent Tiny Information. Retain
    // native callbacks, but never project a second loose scene button.
    if(snapshotCombat&&node.matches('.stg-deck-btn-row,.stg-view-deck-btn'))return null;
    var mapSlot=snapshotCombat&&node.matches('.submap-svg-wrap')&&node.closest('#stg-mapscreen-root,#stg-stomach-root,#stg-lab-root');
    if(mapSlot)L.bridge.map.rememberScaffold(mapSlot);
    var attrs=mapSlot?{'data-ms-map-slot':'','data-ms-css-layout':''}:{};
    Array.from(node.attributes).forEach(function(a){
      if(a.name==='translate'&&node._lunarSourceHidden){if(node._lunarSourceTranslate!==null)attrs.translate=node._lunarSourceTranslate;return;}
      if(a.name==='href'&&/^\s*javascript:/i.test(a.value))return;
      if(/^on/i.test(a.name) || a.name==='data-lunar-source' || a.name==='aria-hidden' && node._lunarSourceHidden) return;
      if(a.name==='id')attrs['data-ms-id']=a.value;
      else if(a.name==='class')attrs['data-ms-class']=a.value;
      else if(a.name==='for')attrs['data-ms-for']=a.value;
      else attrs[a.name]=resourceProfile==='mobile'?a.value:a.name==='style'?L.adapter.images.css(a.value):a.name==='src'&&node.localName==='img'?L.adapter.images.url(a.value):a.value;
    });
    if(snapshotCombat&&node.matches('.ev-bg,.rest-bg,#blessing-bg-el,#upgrade-bg-el,.stg-body-bg-layer')){attrs['data-ms-in-scene-background']='';if(!node.matches('.stg-body-bg-layer'))attrs['data-ms-background-frame']=JSON.stringify({image:node.style.backgroundImage||getComputedStyle(node).backgroundImage});}
    // The native body stack has two physical plates but one semantic target.
    // Normalize the active source as data; MOONSHINE owns a stable primary
    // surface, so inactive retained art can never regain presentation ownership.
    if(snapshotCombat&&node.matches('.stg-body-bg-layer')){
      var active=node.parentElement.querySelector('.stg-body-bg-layer.is-active')||node;
      attrs['data-ms-background-frame']=JSON.stringify({image:active.style.backgroundImage||'none',size:active.style.backgroundSize,position:active.style.backgroundPosition,repeat:active.style.backgroundRepeat,secondary:node.getAttribute('data-layer')==='b'});
    }
    if(snapshotCombat&&node.matches('.stomach-bg-layer'))attrs['data-ms-dynamic-background']='map.stomach.background';
    if(node.matches('#stg-enc-skip-btn,.stg-enc-skip-btn'))attrs['data-lunar-control-role']='story.skipIntro';
    if(node.matches('.stg-card-popup-scrim:not(.stg-card-removed-scrim):not(.stg-rs-boon-scrim)')){
      attrs['data-lunar-control-role']='cards.detailBackdrop';
      if(!cardPopups.has(node))cardPopups.set(node,{scope:L.buffer.getScope(),passage:document.querySelector('.passage:not(.passage-out)')});
    }
    if(node.matches('.menu-btn')){var role=L.adapter.menu.action(node.textContent);if(role)attrs['data-lunar-menu-action']=role;}
    var properties={};if(typeof node._twSkipFn==='function')properties.typingSkip=L.bridge.port.retain(node._twSkipFn,node);
    var result={properties:properties,tag:node.localName,key:id(node),attrs:attrs,svg:node.namespaceURI==='http://www.w3.org/2000/svg',children:mapSlot?[]:Array.from(node.childNodes).map(snapshot).filter(Boolean)};
    if(node.scrollTop || node.scrollLeft || /scroll|readout|\bhand\b/.test(attrs['data-ms-class']||'')) {result.scrollTop=node.scrollTop;result.scrollLeft=node.scrollLeft;}
    if(node.getAnimations){var running=node.getAnimations().filter(function(a){return a.effect&&a.effect.target===node&&!(typeof CSSAnimation!=='undefined'&&a instanceof CSSAnimation)&&!(typeof CSSTransition!=='undefined'&&a instanceof CSSTransition);});if(running.length)result.animations=running.map(function(a){if(!animations.has(a))animations.set(a,'wa'+(++nextAnimation));var timing=a.effect.getTiming();return {key:animations.get(a),frames:a.effect.getKeyframes(),timing:{duration:timing.duration,delay:timing.delay,fill:timing.fill,easing:timing.easing,iterations:timing.iterations},time:a.currentTime,state:a.playState};});}
    if(node.localName==='video'){result.media={time:node.currentTime||0,paused:node.paused};attrs.muted='';delete attrs.autoplay;}
    if(node.matches('input,select,textarea')){result.value=node.value;result.checked=!!node.checked;}
    return result;
  }
  function ancestors(node){
    var wrappers=[];
    for(var p=node.parentElement;p && p!==document.body;p=p.parentElement){
      if(p===document.documentElement)break;
      wrappers.unshift({tag:p.localName,key:id(p)+'-context',attrs:Object.assign({},p.id?{'data-ms-id':p.id}:{},p.className?{'data-ms-class':String(p.className)}:{}),children:[]});
    }
    return wrappers;
  }
  function unhide(node){node.removeAttribute('data-lunar-source');if(node._lunarSourceHidden){if(node._lunarSourceAria===null)node.removeAttribute('aria-hidden');else node.setAttribute('aria-hidden',node._lunarSourceAria);if(node._lunarSourceTranslate===null)node.removeAttribute('translate');else node.setAttribute('translate',node._lunarSourceTranslate);delete node._lunarSourceHidden;}}
  function restore(){sources.forEach(unhide);sources.clear();}
  function suppressSource(el){if(!el._lunarSourceHidden){el._lunarSourceAria=el.getAttribute('aria-hidden');el._lunarSourceTranslate=el.getAttribute('translate');el._lunarSourceHidden=true;el.setAttribute('aria-hidden','true');el.setAttribute('translate','no');}if(!el.hasAttribute('data-lunar-source'))el.setAttribute('data-lunar-source','');sources.add(el);}
  function capture(){
    var suppress=STG_DISPLAY_CONFIG.detectMode()==='mobile';snapshotCombat=suppress;if(!suppress)restore();
    L.bridge.game.refresh();
    L.bridge.story.captureTyping();


    var candidates=Array.from(document.querySelectorAll(selector+', #stg-defeat-cine, #stg-run-stats, #stg-tease')).filter(function(el){return !el.closest('#MOONSHINE-root') && !el.closest('.passage-out') && (el.matches('.passage')||getComputedStyle(el).display!=='none');});
    candidates=candidates.filter(function(el){return !candidates.some(function(other){return other!==el && other.contains(el);});});
    var chosen=new Set(candidates);
    sources.forEach(function(el){if(!chosen.has(el)){unhide(el);sources.delete(el);}});
    var trees=candidates.map(function(el){
      var root=snapshot(el), wrappers=ancestors(el), tree=root;
      if(!root){if(suppress)suppressSource(el);return null;}
      for(var i=wrappers.length-1;i>=0;i--){wrappers[i].children=[tree];tree=wrappers[i];}
      if(suppress){if(!el._lunarSourceHidden){el._lunarSourceAria=el.getAttribute('aria-hidden');el._lunarSourceTranslate=el.getAttribute('translate');el._lunarSourceHidden=true;el.setAttribute('aria-hidden','true');el.setAttribute('translate','no');}
      if(!el.hasAttribute('data-lunar-source'))el.setAttribute('data-lunar-source','');sources.add(el);}
      return {key:id(el),tree:tree};
    }).filter(Boolean);
    nodes.forEach(function(node,k){if(!node.isConnected){nodes.delete(k);L.bridge.interfaces.unregister('controls.'+k);}});
    L.bridge.port.collect();
    if(L.bridge.updates)L.bridge.updates.seed();
    return trees;
  }
  function dispatch(key,type,data){
    var logged=/^(click|submit|change)$/.test(type);if(logged)L.logger.scope('LUNAR.native').info('COMMAND_SENT',{control:key,event:type});
    var source=nodes.get(key.replace(/-context$/,''));if(!source || !source.isConnected || source.disabled)return false;
    // The menu is a pause-safe entry even when its native passage is inert.
    // Gameplay controls in that passage remain blocked.
    if(source.closest('[inert]')&&!source.closest('#stg-banner-menu-btn'))return false;
    if(data && 'value' in data && 'value' in source)source.value=data.value;
    if(data && 'checked' in data && 'checked' in source)source.checked=data.checked;
    if(type==='scroll'){source.scrollTop=data.top;source.scrollLeft=data.left;return true;}
    if(data && data.files && source.type==='file')source.files=data.files;
    var event;
    if(type==='click'||/^mouse/.test(type))event=new MouseEvent(type,{bubbles:true,cancelable:true,clientX:data.x,clientY:data.y,ctrlKey:!!data.ctrl});
    else if(type==='keydown')event=new KeyboardEvent(type,{bubbles:true,cancelable:true,key:data.key,shiftKey:data.shift,ctrlKey:data.ctrl,altKey:data.alt,metaKey:data.meta});
    else if(/^pointer/.test(type))event=new PointerEvent(type,Object.assign({bubbles:true,cancelable:true},data));
    else event=new Event(type,{bubbles:true,cancelable:true});
    try{var oldCinema=L.bridge.chrome&&L.bridge.chrome.presentation().cinematic;var result=source.dispatchEvent(event);if(type==='click'&&source.id==='stg-view-art-btn'&&L.bridge.chrome&&oldCinema===L.bridge.chrome.presentation().cinematic)L.bridge.chrome.artCommand();if(logged)L.logger.scope('LUNAR.native').info('COMMAND_RESULT',{control:key,event:type,dispatched:true,defaultAllowed:result});return result;}catch(error){if(logged)L.logger.scope('LUNAR.native').error('COMMAND_RESULT',error,{control:key,event:type});throw error;}
  }
  // Close intent targets the actual source backdrop, bypassing presentation
  // typewriter interceptors. Native dismissal still owns onDone and navigation.
  function dismissCardPopup(key){
    var source=nodes.get(key),life=source&&cardPopups.get(source);
    if(STG_DISPLAY_CONFIG.detectMode()!=='mobile'||!life||!source.isConnected||source.closest('[inert]')||
      life.scope!==L.buffer.getScope()||life.passage!==document.querySelector('.passage:not(.passage-out)')||
      !source.classList.contains('stg-card-popup-armed')||source.classList.contains('stg-card-popup-leaving')||dismissedCardPopups.has(source))return false;
    var top=Array.from(document.querySelectorAll('.stg-card-popup-scrim')).pop();if(top!==source)return false;
    dismissedCardPopups.add(source);
    return L.bridge.pause.ui(function(){return dispatch(key,'click',{});});
  }
  function sourceSheet(sheet){var owner=sheet.ownerNode;return !owner||owner.id==='MOONSHINE-source-css'||(!/^(?:LUNAR|MOONSHINE|HECATE)/.test(owner.id)&&!(owner.closest&&owner.closest('[data-MOONSHINE-owned],[data-HECATE-owned]')));}
  function stylesRevision(){return resourceProfile+':'+Array.from(document.styleSheets).filter(sourceSheet).length;}
  function styles(){
    function read(rules){return Array.from(rules).filter(function(rule){return rule.type!==5;}).map(function(rule){return {type:rule.type,selectorText:rule.selectorText,style:rule.style&&rule.style.cssText,cssText:rule.cssText,cssRules:rule.cssRules?read(rule.cssRules):undefined};});}
    return Array.from(document.styleSheets).filter(sourceSheet).map(function(sheet){try{return read(sheet.cssRules);}catch(_){return [];}});
  }
  function call(name){if(!L.bridge.game.register(name))return;return L.bridge.interfaces.call.apply(null,['game.'+name].concat(Array.prototype.slice.call(arguments,1)));}
  var api={suppress:suppressSource,snapshot:snapshot,presented:L.bridge.story.presented,key:id,dismissCardPopup:dismissCardPopup,partial:function(targets){snapshotCombat=STG_DISPLAY_CONFIG.detectMode()==='mobile';var entries=(targets||[]).map(function(t){return {target:t,node:nodes.get(t.key)};}).filter(function(e){return e.node&&e.node.isConnected;});return entries.filter(function(e){return !entries.some(function(other){return other!==e&&other.node.contains(e.node);});}).map(function(e){return {key:e.target.key,domain:e.target.domain,kind:e.target.kind,tree:snapshot(e.node)};});},capture:capture,dispatch:dispatch,styles:styles,stylesRevision:stylesRevision,restore:restore,call:call,
    acknowledgeFatal:function(key,type,data){var source=nodes.get(key.replace(/-context$/,''));if(L.recovery.status().phase!=='AWAITING_ACKNOWLEDGMENT'||!source||!source.closest('#stg-confirm-modal')||!source.matches('#stg-alert-ok,#stg-alert-ok *,#stg-confirm-modal')||type!=='click'&&type!=='keydown')return false;return dispatch(key,type,data||{});},
    revision:function(){return version;},markChanged:function(){version++;},
    runSnapshot:function(){return L.buffer.game.read('current');}
  };
  L.bridge.native=api;
  Object.keys(api).forEach(function(name){L.bridge.interfaces.register('native.'+name,api[name]);});
  function install(){
    L.bridge.story.install();
    L.bridge.shop.install();
    L.bridge.game.install();
  }
  api.install=install;
  document.addEventListener('DOMContentLoaded',install);install();
})();
