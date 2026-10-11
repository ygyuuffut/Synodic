(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer,encounterPlan=null,encounterSequence=0,lastMapRegion=null,lastMapScope=null;
var backgrounds=new WeakMap(),owners=new WeakMap(), url=L.adapter.images.url,resourceProfile='mobile';if(L.assets)L.assets.subscribe(function(value){resourceProfile=value.profile;});
 function hints(el){return {cg:!!(el&&el.dataset&&(el.dataset.msArtRole==='cg'||el.dataset.msInSceneBackground!=null||el.dataset.msDynamicBackground!=null)),intermission:!!(el&&el.closest&&el.closest('#stg-atk-overlay')),card:!!(el&&el.closest&&el.closest('.card,.stg-mc-card,.stg-md-card,[data-ms-component="card"]'))};}
 function category(el,source){return L.adapter.images.classify(hints(el),source);}
 function cgBoundary(value,el){if(!el||!el.isConnected||typeof value!=='string'||value.indexOf('https://static.wixstatic.com/media/')===-1||!el.matches('.ev-bg,.rest-bg,#blessing-bg-el,#upgrade-bg-el'))return;if(!mobile()||!el.closest('.passage:not(.passage-out)'))return;var match=value.match(/https:\/\/static\.wixstatic\.com\/media\/[^\s'"<>;)]+/),next=match&&L.adapter.images.base(match[0]);if(!next)return;var previous=backgrounds.get(el);backgrounds.set(el,next);if(previous&&previous!==next&&L.transitions.status().kind==='silent'){L.assetQuality.boundary('next_cg');}}
 function css(value,el){cgBoundary(value,el);var next=L.adapter.images.css(value,hints(el));if(mobile()&&typeof next==='string'&&next.indexOf('@import')!==-1)next=next.replace(/@import\s+url\(\s*(?:'[^']*'|"[^"]*"|[^)]*)\s*\)\s*[^;]*;/gi,function(rule){return /fonts\.googleapis\.com/.test(rule)?'':rule;});return next;}function mobile(){return STG_DISPLAY_CONFIG.detectMode()==='mobile';}
 var src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
 Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:true,enumerable:src.enumerable,get:src.get,set:function(value){var resolved=url(value,category(this,value));if(resolved||!value)src.set.call(this,resolved);}});
 var attr=Element.prototype.setAttribute;
 Element.prototype.setAttribute=function(name,value){
  if(name==='src' && this instanceof HTMLImageElement){var resolved=url(value,category(this,value));if(!resolved&&value)return;value=resolved;}
  if(name==='style')value=css(value,this);
  return attr.call(this,name,value);
 };
 var style=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'style'), proxies=new WeakMap();
 if(style && style.configurable)Object.defineProperty(HTMLElement.prototype,'style',{configurable:true,enumerable:style.enumerable,get:function(){
  var s=style.get.call(this);owners.set(s,this);var el=this;
  if(!proxies.has(s))proxies.set(s,new Proxy(s,{get:function(target,key){var value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set:function(target,key,value){if(/^(background|backgroundImage|cssText)$/.test(String(key)))value=css(value,el);return Reflect.set(target,key,value,target);}}));
  return proxies.get(s);
 },set:style.set?function(value){return style.set.call(this,css(value,this));}:undefined});
 ['backgroundImage','background','cssText'].forEach(function(name){
  var prop=Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype,name);if(!prop || !prop.set)return;
  Object.defineProperty(CSSStyleDeclaration.prototype,name,{configurable:true,enumerable:prop.enumerable,get:prop.get,set:function(value){prop.set.call(this,css(value,owners.get(this)));}});
 });
 var property=CSSStyleDeclaration.prototype.setProperty;
 CSSStyleDeclaration.prototype.setProperty=function(name,value,priority){return property.call(this,name,css(value,owners.get(this)),priority);};
 var inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,enumerable:inner.enumerable,get:inner.get,set:function(value){
  if((L.assets||mobile()) && typeof value==='string')value=value.replace(/https:\/\/static\.wixstatic\.com\/media\/[^\s'"<>;)]+/g,function(source){return url(source,category(null,source));});
  inner.set.call(this,value);
 }});
 function deferredHook(name){var original=window[name];Object.defineProperty(window,name,{configurable:true,get:function(){return typeof original==='function'?wrapped:original;},set:function(fn){original=fn;}});function wrapped(){if(L.assets?resourceProfile==='mobile':mobile())return;return original.apply(this,arguments);}}
 deferredHook('stgPreloadImages');deferredHook('stgWarmAudio');
 function registerCards(){
  [window.STG_CARD_TEMPLATES,window.STG_CARDS].forEach(function(list){Object.values(list||{}).forEach(function(card){if(!card)return;Object.entries(card).forEach(function(pair){if(/(?:art|img|image|src)/i.test(pair[0]) && typeof pair[1]==='string')L.adapter.images.registerCard(pair[1]);});});});
 }
 var sheets=new WeakMap();
 var text=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
 Object.defineProperty(Node.prototype,'textContent',{configurable:true,enumerable:text.enumerable,get:text.get,set:function(value){if(this.nodeType===1 && this.tagName==='STYLE')value=css(value);text.set.call(this,value);}});
 function install(){
  navigation();
  ['stgGoTo','stgMenuContinue'].forEach(function(name){var original=window[name];if(typeof original!=='function'||original._lunarRootGuard)return;var wrapped=function(){var self=this,args=arguments;return L.transitions.beforeSwap(name==='stgGoTo'?args[0]:'Resume',function(){return original.apply(self,args);});};Object.assign(wrapped,original);wrapped._lunarRootGuard=true;window[name]=wrapped;});
  var mapBoot=window.stgMapBoot;
  if(typeof mapBoot==='function'&&!mapBoot._lunarRegion){var wrappedMap=function(){
   var game=window._STG,region=game&&game.mapState&&game.mapState.currentSubmap,scope=B.getScope(),ctx=context();
   // Exits can rebuild MapScreen inline, without a SugarCube navigation event.
   // Ordinary node moves/HP/map refreshes retain the same region and stay silent.
   if(mobile()&&ctx.id==='MapScreen'&&lastMapScope===scope&&lastMapRegion&&region!==lastMapRegion&&L.transitions.status().kind==='silent'){
    L.transitions.scene(ctx.id,ctx.id,{scope:scope,region:region});L.assets.navigation();
   }
   lastMapRegion=region;lastMapScope=scope;
   // MapBoot's deferred work only measures/centers its rendered source map.
   // Keep that native presentation timer in the UI scheduling scope, so its
   // completion does not turn an owned-map state patch into a full capture.
   var self=this,args=arguments;
   return mobile()?L.bridge.pause.ui(function(){return mapBoot.apply(self,args);}):mapBoot.apply(self,args);
  };Object.assign(wrappedMap,mapBoot);wrappedMap._lunarRegion=true;window.stgMapBoot=wrappedMap;}

  var play=window.stgEncounterPlayChunks;
  if(typeof play==='function'&&!play._lunarAssets){var wrappedPlay=function(chunks){
   if(mobile()){var root=document.querySelector('.passage:not(.passage-out) #stg-encounter-root');encounterPlan=root?{id:++encounterSequence,scope:B.getScope(),root:root,urls:L.adapter.images.encounter(chunks)}:null;L.bridge.port.emit(['resources.encounter']);}
   return play.apply(this,arguments);
  };Object.assign(wrappedPlay,play);wrappedPlay._lunarAssets=true;window.stgEncounterPlayChunks=wrappedPlay;}
  var imageConfig=STG_DISPLAY_CONFIG.mobile,key=[mobile(),resourceProfile,innerWidth,innerHeight,devicePixelRatio,imageConfig.cgArtResolution,imageConfig.cardArtResolution,imageConfig.intermissionArtResolution,L.assetQuality.status().revision].join('|');
  document.querySelectorAll('style:not([id^="MOONSHINE"]):not(#LUNAR-font-resources)').forEach(function(sheet){var current=sheet.textContent,row=sheets.get(sheet);if(row&&row.key===key&&row.last===current)return;if(!row){row={original:current};sheets.set(sheet,row);}var next=mobile()?css(current):row.original;if(next!==current)text.set.call(sheet,next);row.last=next;row.key=key;});
  registerCards();Object.values(window.STG_CARD_IMAGES||{}).forEach(function(source){if(typeof source==='string')L.adapter.images.registerCard(source);});
  var original=window.stgShowActionOverlay;
  if(typeof original==='function' && !original._lunarResource){
   var wrapped=function(){var args=arguments,self=this;return L.adapter.images.withContext('intermission',function(){return original.apply(self,args);});};
   Object.assign(wrapped,original);wrapped._lunarResource=true;window.stgShowActionOverlay=wrapped;
  }
 }

function current(){var root=document.querySelector('.passage:not(.passage-out)'),urls=[];if(!root)return urls;var targets=Array.from(root.querySelectorAll('.menu-bg,.charsel-bg,.mapscreen-bg,.ev-bg,.rest-bg,.stg-bg,#stg-root,#upgrade-bg-el,#blessing-bg-el'));document.querySelectorAll('.stg-body-bg-layer,.stomach-bg-layer').forEach(function(el){if(el.parentElement&&getComputedStyle(el.parentElement).display!=='none')targets.push(el);});targets.slice(0,8).forEach(function(el){if(urls.length>=4)return;var value=el.style.backgroundImage||getComputedStyle(el).backgroundImage;String(value).replace(/https:\/\/static\.wixstatic\.com\/media\/[^\s'"<>;)]+/g,function(source){if(!backgrounds.has(el)&&el.matches('.ev-bg,.rest-bg,#blessing-bg-el,#upgrade-bg-el'))backgrounds.set(el,L.adapter.images.base(source));if(urls.length<4&&!urls.includes(source))urls.push(source);return source;});});return urls;}

// SugarCube passageinit precedes State.create and native background replacement.
var navigationInstalled=false,rollingBack=false,recovery=false;
function navigation(){if(navigationInstalled||!window.jQuery||!L.transitions)return;navigationInstalled=true;
 window.jQuery(document).on(':passageinit.LUNARtransitions',function(event){
  if(!mobile()||L.transitions.status().kind==='system')return;
  var state=SugarCube.State,safe={index:state.activeIndex,title:state.passage,scope:B.getScope(),recovery:recovery};recovery=false;
  if(!safe.recovery&&L.transitions.status().kind==='silent'&&continuous(event.passage.title)){
   var underlay=L.bridge.runReport&&L.bridge.runReport.retainsUnderlay(event.passage.title);
   L.logger.scope('LUNAR.transitions').info(underlay?'END_NOTICE_UNDERLAY_PARK':'STORY_CONTINUATION',{from:state.passage,to:event.passage.title});
   if(!underlay&&L.assetQuality)L.assetQuality.boundary('next_cg');L.assets.navigation();return;
  }
  L.transitions.scene(state.passage,event.passage.title,safe);if(L.assetQuality)L.assetQuality.boundary('next_scene');L.assets.navigation();
 });
 window.jQuery(document).on(':passageend.LUNARtransitions',function(event){if(!mobile())return;
  // Existing phone carousel default is scene preparation, not a player command.
  // Establish it at the native boundary so the input lock cannot deadlock Deploy.
  var first=window.STG_CHARACTERS&&STG_CHARACTERS[0];if(event.passage.title==='CharacterSelect'&&!window._stgSelectedCharId&&first&&!first.locked&&typeof window.stgSelectCharacter==='function')window.stgSelectCharacter(first.id);
  if(L.bridge.port)L.bridge.port.emit(['scene']);});
 L.transitions.onRollback(function(safe,from){
  if(rollingBack)return false;rollingBack=true;
  try{var state=SugarCube.State;
   // Native globals live outside SugarCube history. History rewind cannot
   // safely undo their effects; recover through the native safe Menu boundary.
   recovery=true;
   SugarCube.Engine.play('Menu');return true;
  }finally{rollingBack=false;}
 });
}
function context(){var passage=window.SugarCube&&SugarCube.State&&SugarCube.State.passage||'boot';return {id:passage,scope:B.getScope(),pack:/Map/.test(passage)?'map':/Combat|Battle|^Start$/.test(passage)?'combat':/Upgrade|Shop/.test(passage)?'shop':/menu|start/i.test(passage)?'menu':'story'};}
function continuous(to){
 if(L.bridge.runReport&&L.bridge.runReport.retainsUnderlay(to))return true;
 // A native re-entry into the same supported narrative family replaces its
 // hidden source, not the persistent mobile presentation. Other destinations,
 // art-view, combat, map and body-mounted endings retain the opaque barrier.
 var id=context().id,selectors={EncounterEvent:'#stg-encounter-root #enc-text-panel',BodyExploration:'#stg-body-root #enc-text-panel',Blessing:'#stg-blessing-root .arc-dialogue'};
 return to===id&&!!selectors[id]&&!document.querySelector('#stg-defeat-cine,#stg-run-stats,#stg-tease')&&!!document.querySelector('.passage:not(.passage-out) '+selectors[id])&&!(L.bridge.chrome&&L.bridge.chrome.presentation().cinematic);
}
L.bridge.resources={continuous:continuous,qualityApplied:function(){install();},install:install,current:current,context:context,encounter:function(){if(!mobile()||!encounterPlan||encounterPlan.scope!==B.getScope()||!encounterPlan.root.isConnected||encounterPlan.root.closest('.passage-out')){encounterPlan=null;return null;}return {id:encounterPlan.id,urls:encounterPlan.urls.slice()};}};if(L.assets)L.assets.start();document.addEventListener('DOMContentLoaded',install);window.addEventListener('stg-display-config-change',install);install();
})();
