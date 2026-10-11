/* Narrow native change descriptions and scalar reads. No presentation work. */
(function(){'use strict';var L=window.LUNAR,last=null;
 var domains=['labNotice','runReport','map','combat','player','player.hp','player.status','enemy','enemy.hp','enemy.status','hand','cards','cards.panel','selection','actions','actions.state','collectedData','scan','story','story.presentation','resources.encounter','resources.background','dialogue','shop','shop.balance','shop.items','hud','scene','mods','mainMenu','location','location.nearby','location.legend','compatibility'];
 function scalars(){var g=window._STG||{},p=g.player||{},e=g.enemy||{};return {player:{hp:p.hp,maxHp:p.maxHp,data:p.data,chaos:p.chaos,grace:p.grace,block:p.block},enemy:{hp:e.hp,maxHp:e.maxHp,block:e.block},energy:g.energy};}
 function stamp(){var g=window._STG||{},v=scalars();v.location=L.bridge.location.stamp();v.mapIdentity=L.bridge.map.identity();v.game=g;v.hand=g.hand;v.enemyRef=g.enemy;v.scope=L.buffer.getScope();v.passage=window.SugarCube&&SugarCube.State&&SugarCube.State.passage;return v;}
 function infer(){var next=stamp(),out=[];if(!last||next.scope!==last.scope||next.game!==last.game||next.passage!==last.passage)out.push('scene');else{
  if(next.mapIdentity!==last.mapIdentity)out.push('scene');
  if(next.location.slice(0,3).some(function(value,i){return value!==last.location[i];}))out.push('location');
  if(next.location.slice(3).some(function(value,i){return value!==last.location[i+3];}))out.push('location.nearby');
  if(next.player.hp!==last.player.hp||next.player.maxHp!==last.player.maxHp)out.push('player.hp');
  if(next.player.block!==last.player.block)out.push('player.status');
  if(next.player.data!==last.player.data)out.push('shop.balance','hud');
  if(next.player.chaos!==last.player.chaos||next.player.grace!==last.player.grace||next.energy!==last.energy)out.push('hud');
  if(next.enemy.hp!==last.enemy.hp||next.enemy.maxHp!==last.enemy.maxHp)out.push('enemy.hp');
  if(next.enemy.block!==last.enemy.block)out.push('enemy.status');
  if(next.hand!==last.hand)out.push('hand');
  if(next.enemyRef!==last.enemyRef)out.push('enemy');
 }last=next;return out;}
 function describe(node,type,attribute,oldValue){
  var el=node&&node.nodeType===1?node:node&&node.parentElement;if(!el)return null;
  if(L.bridge.labNotice&&L.bridge.labNotice.owns(el))return {domains:['labNotice'],targets:[],full:false};
  if(el.closest('[data-MOONSHINE-owned],[data-HECATE-owned]'))return null;
  if(type==='attributes'&&attribute==='class'){
   if(el===document.body){var oldClasses=String(oldValue||'').split(/\s+/).filter(Boolean),newClasses=Array.from(el.classList),pageCues=/^(stg-shake|stg-screen-shake)$/;
    if(oldClasses.filter(function(c){return !pageCues.test(c);}).join(' ')===newClasses.filter(function(c){return !pageCues.test(c);}).join(' ')){if(L.bridge.effects)L.bridge.effects.pageCue(oldClasses,newClasses);return {domains:[],targets:[],full:false};}
   }
   var token=el===document.body?'stg-body-art-entering':el.id==='enc-text-panel'&&el.closest('#stg-encounter-root')?'enc-interstitial-hidden':null;
   if(token){var before=String(oldValue||'').split(/\s+/).filter(Boolean),after=Array.from(el.classList);
    if(before.filter(function(c){return c!==token;}).join(' ')===after.filter(function(c){return c!==token;}).join(' ')&&(el!==document.body||document.querySelector('.passage:not(.passage-out) #stg-encounter-root')))return {domains:['story.presentation'],targets:[],full:false};
   }
  }
  if((el===document.documentElement||el===document.body)&&/^(lang|dir|translate)$/.test(attribute||''))return null;
  if(/^(data-lunar-source|aria-hidden|translate)$/.test(attribute||'')&&el._lunarSourceHidden)return null;
  if(L.bridge.runReport&&L.bridge.runReport.owns(el))return {domains:['runReport'],targets:[],full:false};
  if(el.closest('#stg-defeat-cine')){
   if(type==='attributes'&&attribute==='style')return {domains:el.matches('[id^="cine-bg"],[id^="lsc-"],#cine-menu')?['story','actions']:[],targets:[],full:false};
   return {domains:['story','actions'],targets:[],full:false};
  }
  if(L.bridge.storyChoices.contains(el))return {domains:['story','actions'],targets:[],full:false};
  if(type==='attributes'&&attribute==='disabled'&&el.matches('button,input'))return {domains:['actions.state'],targets:[{key:L.bridge.native.key(el),domain:'actions.state',kind:'state'}],full:false};
  if(type==='attributes'&&/^(style|class)$/.test(attribute||'')&&el.closest('#stg-root.stg-fullbg .stg-fg'))return {domains:[],targets:[],full:false};
  if(el.closest('#stg-root.stg-fullbg .stg-fg'))return {domains:['combat','hand','hud'],targets:[],full:false};
  if(el.closest('.submap-svg-wrap'))return {domains:['map'],targets:[],full:false};
  if(type==='childList'&&el.matches('#stg-mapscreen-root,#stg-stomach-root,#stg-lab-root'))return {domains:L.bridge.map.hasScaffold(el)?['map','location','location.nearby']:['scene'],targets:[],full:!L.bridge.map.hasScaffold(el)};
  if(type==='attributes'&&attribute==='style'&&el.closest('#stg-mapscreen-root,#stg-stomach-root,#stg-lab-root')&&el.matches('.mapscreen-body,.mapscreen-fixedtop'))return {domains:[],targets:[],full:false};
  if(type==='attributes'&&attribute==='style'&&el.matches('.ev-bg,.rest-bg,#blessing-bg-el,#upgrade-bg-el,.stg-body-bg-layer,.stomach-bg-layer'))return {domains:['resources.background'],targets:el.matches('.ev-bg')&&el.closest('#stg-encounter-root')?[]:[{key:L.bridge.native.key(el),domain:'resources.background',kind:'state'}],full:false};
  if(el.closest('.stg-nearby-panel'))return {domains:['location.nearby'],targets:[],full:false};
  if(el.closest('.map-legend-inline'))return {domains:['location.legend'],targets:[],full:false};
  if(el.closest('.mapscreen-title,.header-floor-main'))return {domains:['location'],targets:[],full:false};
  var panel=el.closest('#stg-panel');if(panel&&L.bridge.cardPanel&&L.bridge.cardPanel.owns(panel))return {domains:['cards.panel'],targets:[],full:false};
  if(el.closest('#stg-rest-root'))return {domains:['story','actions'],targets:[],full:false};
  if(el.closest('#avery-love-wrap,#fate-avery-wrap,.avery-love-wrap.fate-avery-bar'))return {domains:['story'],targets:[],full:false};
  var unit=el.closest('#arc-dlg-text,#enc-text,#ev-text,#body-sense-host'),domain='dialogue';
  if(!unit){unit=el.closest('.arc-dlg-opts,.blessing-actions,.enc-choices,.ev-choices,#enc-choices');domain='actions';}
  if(!unit){unit=el.closest('.hand');domain='hand';}
  if(!unit){unit=el.closest('.enemy-stats-hp-row');domain='enemy.hp';}
  if(!unit&&/^stg-enemy-(?:hp|love|block|barrier)/.test(el.id)){unit=el;domain='enemy.hp';}
  if(!unit&&/^stg-player-(?:hp|love|block|barrier|energized)/.test(el.id)){unit=el;domain='player.hp';}
  if(!unit){unit=el.closest('.stg-mobile-top-hud,#stg-top-hud,#stg-banner');domain='hud';}
  if(!unit&&type==='attributes'&&attribute==='disabled'&&el.matches('button,input')){unit=el;domain='selection';}
  if(!unit)return {domains:['compatibility'],targets:[],full:true};
  var key=L.bridge.native&&L.bridge.native.key(unit);return {domains:[domain],targets:key?[{key:key,domain:domain,kind:type==='attributes'?'state':'content'}]:[],full:false};
 }
 L.bridge.updates={domains:Object.freeze(domains),infer:infer,seed:function(){last=stamp();},scalars:scalars,describe:describe};
})();
