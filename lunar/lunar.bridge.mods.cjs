/* Installed module catalog and restart-only preferences; no presentation or game state. */
(function(){'use strict';var L=window.LUNAR,A=L.adapter.mods,key='SYNODIC.mods.enabled.v1';
 var node=document.getElementById('LUNAR-mod-catalog'),catalog=node?JSON.parse(node.textContent):[];
 var entries=catalog.map(A.metadata),preferences={},active=new Map(),apiVersion=(entries.find(function(e){return e.id==='lunar';})||{}).apiVersion||'';
 try{var saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))preferences=saved;}catch(_){}
 function compatible(entry){return A.satisfies(apiVersion,entry.requiresApi);}
 entries.forEach(function(entry){
  if(entry.core&&!compatible(entry))throw new Error('SYNODIC Core API requirement is incompatible: '+entry.id);
  active.set(entry.id,entry.core||compatible(entry)&&preferences[entry.id]!==false);
  L.logger.scope('LUNAR.logger').info('MOD_HOOK',{module:entry.id,active:active.get(entry.id),phase:'bootstrap'});
 });
 function row(entry){var enabled=entry.core||compatible(entry)&&preferences[entry.id]!==false;
  return Object.assign({},entry,{compatible:compatible(entry),enabled:enabled,active:active.get(entry.id),pending:enabled!==active.get(entry.id),locked:entry.core||!compatible(entry),status:compatible(entry)?enabled?'enabled':'disabled':'outdated'});
 }
 function context(){
  var main=document.getElementById('stg-menu-root'),content=main&&main.querySelector(':scope > .menu-content:not(.menu-content-settings)');
  return {schema:1,mainMenu:!!(content&&content.querySelector('.menu-title-accent')&&!main.closest('.passage-out')&&!document.querySelector('#stg-fs-prompt,#stg-consent-overlay,#stg-defeat-cine,#stg-run-stats,#stg-tease,#stg-disp-end'))};
 }
 function read(){
  var viewport=window.visualViewport;
  return {schema:1,apiVersion:apiVersion,modules:entries.map(row),mainMenu:context().mainMenu,
   viewport:{width:innerWidth,height:viewport?viewport.height:innerHeight,offsetTop:viewport?viewport.offsetTop:0,scale:parseFloat(getComputedStyle(document.documentElement).zoom)||1}};
 }
 function setEnabled(id,value){
  var entry=entries.find(function(e){return e.id===id;});if(!entry||entry.core||!compatible(entry)||typeof value!=='boolean')return {ok:false,error:'locked'};
  var next=Object.assign({},preferences);next[id]=value;
  try{localStorage.setItem(key,JSON.stringify(next));}catch(_){return {ok:false,error:'storage-unavailable'};}
  preferences=next;L.logger.scope('LUNAR.logger').info('MOD_HOOK',{module:id,enabled:value,phase:'preference'});if(L.bridge.port)L.bridge.port.emit(['mods']);return {ok:true,module:row(entry)};
 }
 L.bridge.mods=Object.freeze({context:context,read:read,setEnabled:setEnabled,shouldLoad:function(id){return active.get(id)===true;},apiVersion:apiVersion});
})();
