/* Independent presentation runtime. Native bridge supplies plain snapshots. */
(function () {
  'use strict';
  var api=LUNAR.api.moonshine, workspace=MOONSHINE_WORKSPACE;
  var root,sceneLayer,style,queued=false,rendering=false,signature='',cssVersion=-1,modalHistory=[],pendingChromeOpener=null,pendingDomains=new Set(),waiting=[],restoreWaiting=[],fitQueued=false,pendingTargets=new Map(),pendingLocal=new Set(),lastViewportKey='',targetWaiting=[];
  function viewportKey(){var v=window.visualViewport;return [innerWidth,v?v.height:innerHeight,v?v.offsetTop:0,v?v.offsetLeft:0,v?v.width:innerWidth,v?v.scale:1,devicePixelRatio||1,api.display.viewport().scale].join('|');}
  function viewportChanged(){var key=viewportKey();if(key===lastViewportKey)return;lastViewportKey=key;schedule({domains:['viewport']});}
  function mobile(){return api.mode()==='mobile';}
  function ui(fn){api.timing.ui(fn);}
  function focusDialogs(){
      var dialogs=Array.from(root.querySelectorAll('[role="dialog"]')).filter(function(el){return !el.closest('[inert],#MOONSHINE-run-report,#MOONSHINE-combat-dialog,#MOONSHINE-result,#MOONSHINE-card-panel')&&el.getBoundingClientRect().width&&getComputedStyle(el).visibility!=='hidden';}),top=dialogs[dialogs.length-1];
      if(top){
        var key=top.dataset.msKey,index=modalHistory.findIndex(function(entry){return entry.key===key;});
        if(index>=0)modalHistory=modalHistory.slice(0,index+1);else modalHistory.push({key:key,returnKey:pendingChromeOpener?null:document.activeElement&&document.activeElement.dataset.msKey,returnChrome:pendingChromeOpener||document.activeElement&&document.activeElement.dataset.msChromeControl});
        pendingChromeOpener=null;
        if(!top.contains(document.activeElement)){var focus=Array.from(top.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')).find(function(el){return !el.closest('[inert],#MOONSHINE-run-report,#MOONSHINE-combat-dialog,#MOONSHINE-result,#MOONSHINE-card-panel')&&el.getBoundingClientRect().width&&getComputedStyle(el).visibility!=='hidden';});if(focus)focus.focus({preventScroll:true});}
      }else if(modalHistory.length){var previous=modalHistory[0].returnKey,chromeIntent=modalHistory[0].returnChrome;modalHistory=[];var target=previous?root.querySelector('[data-ms-key="'+previous+'"]'):chromeIntent&&root.querySelector('[data-ms-chrome-control="'+chromeIntent+'"]');if(target){if(chromeIntent==='info')target.setAttribute('aria-expanded','false');target.focus({preventScroll:true});}}
  }
  function render(){
    queued=false;var domains=Array.from(pendingDomains),targets=Array.from(pendingTargets.values()),locals=Array.from(pendingLocal);pendingDomains.clear();pendingTargets.clear();pendingLocal.clear();if(!document.body||api.recovery.status().phase==='RECOVERY_ACTIVE')return;
    if(!mobile()){MOONSHINE_LAB_NOTICE.destroy();MOONSHINE_RUN_REPORT.destroy();MOONSHINE_MAP.destroy();MOONSHINE_COMBAT.destroy();MOONSHINE_CARD_PANEL.destroy();if(window.MOONSHINE_LOADING)MOONSHINE_LOADING.presented('common');MOONSHINE_PROSE_ANIMATION.cleanup();api.detach();if(root)root.remove();root=null;MOONSHINE_ENCOUNTER_ASSETS.refresh();signature='';MOONSHINE_DISPLAY.sync();MOONSHINE_MAIN_MENU_WATERMARK.refresh();MOONSHINE_LOCATION.refresh(['scene']);return;}
    rendering=true;lastViewportKey=viewportKey();MOONSHINE_GEOMETRY.begin();
    var log=api.logger.scope('MOONSHINE.runtime');
    try {
      var full=!root||!signature||domains.some(function(d){return /^(scene|compatibility|sources|game)$/.test(d);});
      log.debug('VIEW_DISPATCH',{domains:domains,full:full,targets:targets.length,localTargets:locals.length});
      if(!full){
        // Only changed source subtrees pass through compatibility templates.
        workspace.fragments(targets).forEach(function(fragment){var el=root.querySelector('[data-lunar-source-key="'+CSS.escape(fragment.source.key)+'"]');if(el){if(!el.closest('#MOONSHINE-persistent-chrome'))MOONSHINE_COMPONENTS.patchTarget(el,fragment.node);MOONSHINE_UPDATE_VIEWS.indexPart(el,fragment.source.domain);}});
        locals.filter(function(el){return el.isConnected;}).forEach(function(el){var localNode=workspace.snapshot(el);if(!localNode)return;var key=el.getAttribute('data-lunar-source-key')||el._lunarActionKey,visible=key?root.querySelector('[data-lunar-source-key="'+CSS.escape(key)+'"]'):null;if(!visible)visible=root.querySelector('[data-ms-key="'+CSS.escape(localNode.key)+'"]');if(visible&&!visible.closest('#MOONSHINE-persistent-chrome'))MOONSHINE_COMPONENTS.patchTarget(visible,localNode);});
        MOONSHINE_UPDATE_VIEWS.dispatch(domains,targets);
        if(domains.some(function(d){return d==='story'||d==='dialogue';}))MOONSHINE_PROSE_ANIMATION.sync(root);
        if(domains.includes('viewport')){MOONSHINE_STORY.geometry();var v=window.visualViewport;api.viewport({width:innerWidth,height:v?v.height:innerHeight,offsetTop:v?v.offsetTop:0,dpr:devicePixelRatio||1});root.style.setProperty('--ms-visual-top',(v?v.offsetTop:0)+'px');root.dataset.msClass=workspace.body.className+' '+workspace.html.className;root.className=Array.from(workspace.body.classList).concat(Array.from(workspace.html.classList)).map(function(c){return 'MOONSHINE-mode-'+c;}).join(' ');for(var i=0;i<workspace.html.style.length;i++){var prop=workspace.html.style[i];if(prop.indexOf('--')===0)root.style.setProperty(prop,workspace.html.style.getPropertyValue(prop));}MOONSHINE_GEOMETRY.invalidateAll('viewport');if(domains.includes('viewport'))MOONSHINE_LOCATION.refresh(['viewport']);}
        if(domains.includes('viewport')){MOONSHINE_CARD_THUMBNAIL.resources(root);MOONSHINE_COMBAT.refresh(['viewport']);MOONSHINE_CARD_PANEL.refresh(['viewport']);}
        MOONSHINE_GRAPHICS_QUALITY.refresh();MOONSHINE_GEOMETRY.flush();focusDialogs();return;
      }

      if(!root){root=document.createElement('div');root.id='MOONSHINE-root';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('translate','yes');root.dataset.msKey=workspace.rootKey;document.body.appendChild(root);sceneLayer=document.createElement('div');sceneLayer.id='MOONSHINE-scene';root.append(sceneLayer);MOONSHINE_STORY.mount(root);}
      MOONSHINE_DISPLAY.sync();
      if(!style){style=document.createElement('style');style.id='MOONSHINE-runtime-style';document.head.appendChild(style);}
      if(cssVersion!==api.stylesRevision()){style.textContent=MOONSHINE_STYLE_ADAPTER.convert(api.styles())+'\n'+window.MOONSHINE_LAYOUT_CSS;cssVersion=api.stylesRevision();}
      var viewport=window.visualViewport;var height=viewport?viewport.height:innerHeight;
      api.viewport({width:innerWidth,height:height,offsetTop:viewport?viewport.offsetTop:0,dpr:devicePixelRatio||1});
      root.style.setProperty('--ms-visual-top',(viewport?viewport.offsetTop:0)+'px');
      var data=workspace.data();
      root.dataset.msClass=workspace.body.className+' '+workspace.html.className;
      root.className=Array.from(workspace.body.classList).concat(Array.from(workspace.html.classList)).map(function(c){return 'MOONSHINE-mode-'+c;}).join(' ');
      for(var i=0;i<workspace.html.style.length;i++){var prop=workspace.html.style[i];if(prop.indexOf('--')===0)root.style.setProperty(prop,workspace.html.style.getPropertyValue(prop));}
      var next=JSON.stringify(data);
      if(next!==signature){signature=next;api.exchange(data);MOONSHINE_COMPONENTS.patch(sceneLayer,data);MOONSHINE_UPDATE_VIEWS.index(root);MOONSHINE_GEOMETRY.flush();}
      MOONSHINE_GRAPHICS_QUALITY.refresh();MOONSHINE_ACTIONS.refresh();MOONSHINE_MODS.refresh();MOONSHINE_MAIN_MENU_WATERMARK.refresh();MOONSHINE_LOCATION.refresh(['scene']);
      MOONSHINE_MAP.refresh(domains);MOONSHINE_COMBAT.refresh(domains);MOONSHINE_CARD_PANEL.refresh(domains);MOONSHINE_RUN_REPORT.refresh();MOONSHINE_LAB_NOTICE.refresh();MOONSHINE_STORY.geometry();MOONSHINE_STORY.refresh();MOONSHINE_STORY.hud();MOONSHINE_PRESENTATION.refresh();MOONSHINE_STORY_PHASE.refresh();MOONSHINE_ENCOUNTER_ASSETS.refresh();MOONSHINE_BACKGROUND.refresh();
      MOONSHINE_PROSE_ANIMATION.sync(root);
      if(window.MOONSHINE_LOADING&&(sceneLayer.querySelector('button,input,[role="button"]')||api.chrome.sceneReady()||MOONSHINE_COMBAT.active()))MOONSHINE_LOADING.presented(api.assets.scene ? api.assets.scene() : 'menu');
      var completed=new Set(api.story.read().filter(function(entry){return entry.complete;}).map(function(entry){return entry.id;}));
      api.presented(Array.from(root.querySelectorAll('[data-lunar-story-id]')).filter(function(el){return completed.has(el.getAttribute('data-lunar-story-id'))&&el.getBoundingClientRect().width>0&&getComputedStyle(el).visibility!=='hidden';}).map(function(el){return el.getAttribute('data-lunar-story-id');}));
      focusDialogs();

    }catch(error){log.error('RENDER_FAILED',error,{domains:domains});throw error;}finally{MOONSHINE_GEOMETRY.end();rendering=false;resolveTargets();}
  }
  function schedule(change){
    (change&&change.domains||['presentation']).forEach(function(domain){pendingDomains.add(domain);});
    (change&&change.targets||[]).forEach(function(target){pendingTargets.set(target.key,target);});(change&&change.localTargets||[]).forEach(function(el){pendingLocal.add(el);});
    var finished=new Promise(function(resolve){waiting.push(resolve);});
    if(queued)return finished;queued=true;
    ui(function(){requestAnimationFrame(function(){if(window.MOONSHINE_ROOT_GUARD&&MOONSHINE_ROOT_GUARD.holding()){queued=false;if(window.MOONSHINE_LOADING)MOONSHINE_LOADING.prepared();return;}completeRender();});});return finished;
  }
  function targetReady(value){if(!root||!sceneLayer||!sceneLayer.childNodes.length||api.chrome.presentation().sceneId!==value.to)return false;return api.chrome.presentation().mode!=='MAP'||!!root.querySelector('.MOONSHINE-map-node');}
  function resolveTargets(){targetWaiting=targetWaiting.filter(function(entry){if(!targetReady(entry.value))return true;entry.resolve(true);return false;});}
  function whenTargetReady(value){if(targetReady(value))return Promise.resolve(true);return new Promise(function(resolve){targetWaiting.push({value:value,resolve:resolve});});}
  api.transitions.subscribe(function(value){targetWaiting=targetWaiting.filter(function(entry){if(value.id===entry.value.id&&value.kind!=='silent')return true;entry.resolve(false);return false;});});
  function completeRender(){var complete=waiting,restoreComplete=restoreWaiting;waiting=[];restoreWaiting=[];try{render();restoreComplete.forEach(function(task){task.resolve();});}catch(error){if(!restoreComplete.length)throw error;restoreComplete.forEach(function(task){task.reject(error);});}finally{complete.forEach(function(resolve){resolve();});}}
  function start(){api.subscribe(schedule);new MutationObserver(function(records){schedule(MOONSHINE_UPDATE_VIEWS.local(records));}).observe(workspace.body,{subtree:true,childList:true,characterData:true,attributes:true});schedule({domains:['scene']});}
  window.addEventListener('resize',function(){workspace.window.STG_MOBILE_UI&&workspace.window.STG_MOBILE_UI.updateMode&&workspace.window.STG_MOBILE_UI.updateMode();viewportChanged();});window.addEventListener('stg-display-config-change',function(){schedule({domains:['scene']});});
  if(window.visualViewport){visualViewport.addEventListener('resize',viewportChanged);visualViewport.addEventListener('scroll',viewportChanged);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.MOONSHINE_RUNTIME={whenTargetReady:whenTargetReady,commit:completeRender,rememberChromeOpener:function(intent){pendingChromeOpener=intent;},profileChanged:function(){cssVersion=-1;signature='';return new Promise(function(resolve,reject){restoreWaiting.push({resolve:resolve,reject:reject});schedule({domains:['viewport']});});},refresh:schedule,flush:schedule,invalidate:function(){signature='';schedule({domains:['compatibility']});},root:function(){return root;}};
})();
