/* Narrow chrome sources + explicit native command/navigation semantics. */
(function(){'use strict';var L=window.LUNAR,listeners=new Set(),cinematic=false,installed=false,navigationInstalled=false,lastBackground=null;
 function scene(){return window.SugarCube&&SugarCube.State&&SugarCube.State.passage||'boot';}
 function presentation(){var id=scene();return Object.freeze({sceneId:id,mode:document.getElementById('stg-defeat-cine')?'NORMAL':document.getElementById('stg-tease')?'END_NOTICE':document.getElementById('stg-run-stats')?'RUN_REPORT':L.bridge.storyChoices.read()?'NORMAL':L.adapter.chrome.mode(id),cinematic:cinematic,reason:cinematic?'art-view':'scene'});}
 function emit(){var data=presentation();listeners.forEach(function(fn){fn(data);});}
 function background(){var root=document.querySelector('.passage:not(.passage-out) #stg-encounter-root'),plate=root&&root.querySelector('.ev-bg');if(!plate||document.getElementById('stg-defeat-cine')||L.bridge.storyChoices.read())return null;return {image:plate.style.backgroundImage||'none',color:'#0e0a14',size:plate.style.backgroundSize||'cover',position:plate.style.backgroundPosition||'center top',repeat:plate.style.backgroundRepeat||'no-repeat',storyLayer:true};}
 function story(){
  var cine=document.getElementById('stg-defeat-cine');if(cine){
   var panel=cine.querySelector('#enc-text-panel'),heading=cine.querySelector('#cine-defeated'),plates=Array.from(cine.querySelectorAll('[id^="cine-bg"],[id^="lsc-"]')).filter(function(n){return n.style.backgroundImage&&n.style.opacity==='1';}),plate=plates[plates.length-1],menu=cine.querySelector('#cine-menu');
   return {sceneId:scene(),available:true,title:heading?heading.textContent+' By Avery':'Avery',blocks:panel?Array.from(panel.childNodes).map(L.bridge.native.snapshot).filter(Boolean).map(L.adapter.chrome.block).filter(Boolean):[],viewArtAvailable:false,actionsAvailable:!!(panel&&panel.querySelector('button')||menu&&menu.style.opacity==='1'),background:{color:'#08040c',image:plate?plate.style.backgroundImage:'none',vignette:true}};
  }
  var choice=L.bridge.storyChoices.read();if(choice)return choice;
  if(scene()==='RestSite'){var rest=document.querySelector('.passage:not(.passage-out) #stg-rest-root'),copy=rest&&rest.querySelector('.rest-desc,.meditate-sub'),name=rest&&rest.querySelector('.rest-title');return {sceneId:'RestSite',available:!!copy,title:name?name.textContent:'Story',blocks:copy?[L.adapter.chrome.block(L.bridge.native.snapshot(copy))]:[]};}
  if(scene()==='Upgrade'){var shop=document.querySelector('.passage:not(.passage-out) #stg-upgrade-root'),title=shop&&shop.querySelector('.upgrade-merlin-name,.arc-dlg-name');return {sceneId:'Upgrade',available:!!shop,title:title?title.textContent:'Story',html:String(window._stgMerlinLine||''),blocks:[]};}
  var passage=document.querySelector('.passage:not(.passage-out)'),root=passage&&passage.querySelector('#stg-blessing-root,#stg-encounter-root,#stg-body-root,#stg-event-root,#stg-stomach-fate-root'),panel=root&&(root.querySelector('.arc-dialogue,#enc-text-panel')||root.querySelector('#ev-content'));
  if(!panel)return {sceneId:scene(),available:false};
  var backgroundRoot=root.querySelector('.ev-bg,#blessing-bg-el,#upgrade-bg-el,.rest-bg')||document.querySelector('.stg-body-bg-layer.is-active');if(backgroundRoot){var image=backgroundRoot.style.backgroundImage||getComputedStyle(backgroundRoot).backgroundImage;if(image&&image!=='none')lastBackground={scope:L.buffer.getScope(),game:window._STG,image:image};}
  var title=panel.querySelector('.arc-dlg-name,.enc-title,.ev-title'),flow=L.bridge.story.presentation();
  var blocks=Array.from(panel.childNodes).filter(function(n){return n!==title;}).map(L.bridge.native.snapshot).filter(Boolean).map(L.adapter.chrome.block).filter(Boolean);
  var loveSource=panel.querySelector('.avery-love-wrap .avery-love-num'),hpSource=panel.querySelector('.avery-love-wrap .fate-avery-hpnum');
  var extension=root.id==='stg-body-root'&&panel.querySelector('#body-sense-host'),extensionChild=extension&&extension.firstElementChild;
  return {sceneId:scene(),available:true,title:title?title.textContent:'Story',blocks:blocks,background:background(),hp:hpSource?L.adapter.chrome.hp(hpSource.textContent):null,love:loveSource?L.adapter.chrome.love(loveSource.textContent):null,extension:extensionChild?{id:L.bridge.native.key(extensionChild),anchor:'body-sense-host'}:null,held:!!flow.hidden,paragraphId:flow.paragraphId||null};
 }
 function artBoundary(){if(L.transitions&&L.transitions.status().kind==='silent'){var id=scene();L.transitions.scene(id,id,{reason:'art_view'});if(L.assetQuality)L.assetQuality.boundary('next_cg');L.assets.navigation();}}
 function install(){
  // Command interception, never class-based cinematic inference. Existing
  // source callbacks may retain the original toggle; dispatch notes those too.
  var original=window.stgToggleViewArt;
  if(typeof original==='function'&&!installed){installed=true;var wrapped=function(){artBoundary();var result=original.apply(this,arguments);cinematic=!cinematic;emit();return result;};Object.assign(wrapped,original);wrapped._lunarChromeCommand=true;window.stgToggleViewArt=wrapped;}
  if(window.jQuery&&!navigationInstalled){navigationInstalled=true;window.jQuery(document).on(':passageinit.LUNARchrome',function(){cinematic=false;}).on(':passageend.LUNARchrome',emit);}
 }
 L.bridge.chrome={background:background,sceneReady:function(){if(L.bridge.runReport&&L.bridge.runReport.active()||L.bridge.storyChoices.read())return true;var p=document.querySelector('.passage:not(.passage-out)');return !!(p&&p.querySelector('#stg-rest-root .rest-desc,#stg-rest-root .meditate-sub,#stg-lab-root .lab-node,#stg-blessing-root .arc-dialogue,#stg-encounter-root #enc-text-panel,#stg-body-root #enc-text-panel,#stg-event-root #ev-content,#stg-stomach-fate-root .arc-dialogue,#stg-upgrade-root .upgrade-merlin-name,.mapscreen-title,.header-floor-main,#stg-menu-root button,#stg-charsel-root button,#stg-root button'));},reportBackground:function(){return lastBackground&&lastBackground.scope===L.buffer.getScope()&&lastBackground.game===window._STG?{image:lastBackground.image,color:'#08040c'}:null;},story:story,presentation:presentation,subscribe:function(fn){listeners.add(fn);return function(){listeners.delete(fn);};},artCommand:function(){artBoundary();cinematic=!cinematic;emit();},install:install};
 install();
})();
