/* Narrative compatibility: publish whole rich text, retain native completion here. */
(function () {
  'use strict';
  var L=window.LUNAR,B=L.buffer,active=new Map(),defaultLanguage=document.documentElement.lang||'en',presentations=new WeakMap();
  // Native flow flags only. A removed interstitial flag does not make the
  // previous paragraph the next paragraph while a reveal/card receipt waits.
  function presentation(){
    var root=document.querySelector('.passage:not(.passage-out) #stg-encounter-root'),panel=root&&root.querySelector('#enc-text-panel');
    if(!panel)return {scene:null,hidden:false,art:false};
    var scope=B.getScope(),text=panel.querySelector('#enc-text'),paragraph=text&&text.getAttribute('data-lunar-story-id'),choices=root.querySelector('#enc-choices');
    var art=document.body.classList.contains('stg-body-art-entering'),interstitial=panel.classList.contains('enc-interstitial-hidden'),state=presentations.get(panel);
    if(!state||state.scope!==scope){state={scope:scope,waiting:false,paragraph:null};presentations.set(panel,state);}
    if(art||interstitial){state.waiting=true;state.paragraph=paragraph;}
    else if(paragraph!==state.paragraph||choices&&choices.style.display==='flex')state.waiting=false;
    return {scene:L.bridge.native.key(root),hidden:art||interstitial||state.waiting,art:art,interstitial:interstitial,paragraphId:paragraph};
  }
  var channels={stgArcTypewriter:'arc',stgArcTypewriterPaced:'arc',stgEncounterTypewriter:'encounter',stgTypewriter:'event'};
  function valid(record){return record.scope===B.getScope()&&record.element.isConnected&&!record.element.closest('.passage-out')&&active.get(record.element)===record;}
  function finish(record){
    if(!valid(record)||record.done||L.bridge.pause.active())return false;
    record.done=true;record.element._twSkipFn=null;
    L.logger.scope('LUNAR.story').info('STORY_FINISH',{paragraph:record.id,channel:record.channel});
    if(record.options)record.options.style.visibility='visible';
    B.story.update(record.id,{complete:true,visibleHtml:record.html});
    if(!record.hasNarrative)B.story.acknowledge(record.id);
    try{if(typeof record.callback==='function')L.bridge.pause.game(function(){record.callback();});}
    finally{L.bridge.port.emit(['story','actions'],[{key:L.bridge.native.key(record.element),domain:'dialogue',kind:'state'}]);}return true;
  }
  function read(){
    var entries=[];active.forEach(function(record,element){if(!valid(record)){active.delete(element);return;}var entry=B.story.get(record.id);if(entry)entries.push(Object.assign(entry,{scope:record.scope,channel:record.channel,presentation:'paragraph-fade',language:record.language,translatable:true,hasNarrative:record.hasNarrative}));});return entries;
  }
  L.bridge.story={read:read,presentation:presentation,complete:function(id){var record=Array.from(active.values()).find(function(r){return r.id===id;});return record?finish(record):false;}};
  L.bridge.story.captureTyping=function(){
    [['stgArcTypewriter','#arc-dlg-text'],['stgArcTypewriterPaced','#arc-dlg-text'],['stgEncounterTypewriter','#enc-text'],['stgTypewriter','#ev-text']].forEach(function(pair){var key=B.story.latest(pair[0]),text=document.querySelector('.passage:not(.passage-out) '+pair[1]),entry=key&&B.story.get(key);if(key&&entry&&text&&!active.has(text)&&!(entry.phase==='displayed'&&entry.visibleHtml===text.innerHTML))B.story.update(key,{phase:'displaying',visibleHtml:text.innerHTML,complete:!text._twSkipFn&&!(pair[1]==='#ev-text'&&window.stgTwTimer)});});
  };
  function restPublish(){var el=document.querySelector('.passage:not(.passage-out) #stg-rest-root .rest-desc,.passage:not(.passage-out) #stg-rest-root .meditate-sub');if(!el||active.has(el))return;var html=el.innerHTML,language=defaultLanguage,id=B.story.enqueue('rest',html,{scene:'RestSite',language:language,translatable:true,presentation:'paragraph-fade',complete:false}),record={id:id,element:el,channel:'rest',html:html,language:language,scope:B.getScope(),done:false,options:null,hasNarrative:!!el.textContent.trim()};active.set(el,record);el.setAttribute('data-lunar-story-id',id);el._twSkipFn=function(){return finish(record);};B.story.update(id,{phase:'displaying',visibleHtml:html});L.logger.scope('LUNAR.story').info('STORY_PUBLISH',{paragraph:id,channel:'rest',length:html.length});L.bridge.port.emit(['story','actions']);}
  L.bridge.story.install=function(){
    ['stgRestBoot','stgRestMeditateRender'].forEach(function(name){var fn=window[name];if(typeof fn!=='function'||fn._lunarParagraph)return;var wrapped=function(){var value=fn.apply(this,arguments);if(STG_DISPLAY_CONFIG.detectMode()==='mobile')restPublish();return value;};Object.assign(wrapped,fn);wrapped._lunarParagraph=true;window[name]=wrapped;});
    Object.keys(channels).forEach(function(name){
      var original=window[name];if(typeof original!=='function'||original._lunarBuffer)return;
      var wrapped=function(){
        if(STG_DISPLAY_CONFIG.detectMode()!=='mobile')return original.apply(this,arguments);
        var channel=channels[name],target=channel==='arc'?'arc-dlg-text':channel==='encounter'?'enc-text':arguments[1];
        var el=document.getElementById(target),callback=arguments[name==='stgTypewriter'||name==='stgArcTypewriterPaced'?2:1];
        if(!el){if(channel==='arc'&&typeof callback==='function')callback();return;}
        var html=String(arguments[0]||''),language=el.getAttribute('lang')||defaultLanguage;
        var id=B.story.enqueue(name,html,{scene:window.SugarCube&&SugarCube.State&&SugarCube.State.passage,language:language,translatable:true,presentation:'paragraph-fade',complete:false});
        L.logger.scope('LUNAR.story').info('STORY_PUBLISH',{paragraph:id,channel:channel,length:html.length});
        var timer=channel==='arc'?'_stgArcTwTimer':channel==='encounter'?'_stgEncTwTimer':'stgTwTimer';
        if(window[timer])clearInterval(window[timer]);window[timer]=null;
        var record={id:id,element:el,channel:channel,html:html,language:language,callback:callback,scope:B.getScope(),done:false,options:channel==='arc'?document.getElementById('arc-dlg-opts'):null};
        active.set(el,record);el.setAttribute('data-lunar-story-id',id);el.innerHTML=html;
        record.hasNarrative=!!(el.textContent.trim()||el.querySelector('img,video,audio,svg,canvas'));
        if(record.options)record.options.style.visibility='hidden';
        el._twSkipFn=function(){return finish(record);};
        B.story.update(id,{phase:'displaying',visibleHtml:html});L.bridge.port.emit(['story','actions'],[{key:L.bridge.native.key(el),domain:'dialogue',kind:'content'}]);
        if(!record.hasNarrative)queueMicrotask(function(){finish(record);});
      };
      Object.assign(wrapped,original);wrapped._lunarBuffer=true;window[name]=wrapped;
    });
    var skip=window.stgSkipTypewriter;if(typeof skip==='function'&&!skip._lunarParagraph){var wrappedSkip=function(){if(STG_DISPLAY_CONFIG.detectMode()!=='mobile')return skip.apply(this,arguments);var record=Array.from(active.values()).find(function(r){return r.channel==='event'&&valid(r)&&!r.done;});if(record)return finish(record);};Object.assign(wrappedSkip,skip);wrappedSkip._lunarParagraph=true;window.stgSkipTypewriter=wrappedSkip;}
  };
  L.bridge.story.presented=function(rendered){rendered.forEach(function(id){var entry=B.story.get(id);if(entry&&entry.phase!=='displayed')B.story.acknowledge(id);});};
  window.addEventListener('stg-display-config-change',function(){if(STG_DISPLAY_CONFIG.detectMode()!=='mobile')active.forEach(function(record){finish(record);});});
})();
