/* Read the already-rendered graph, never generate routes or copy click rules. */
(function(){'use strict';var L=window.LUNAR,A=L.adapter.map,life=null,serial=0,scaffolds=new WeakSet(),log=L.logger.scope('LUNAR.map');
 function identity(){var scene=window.SugarCube&&SugarCube.State&&SugarCube.State.passage,g=window._STG||{};
  if(scene==='MapScreen')return 'manor:'+String(g.mapState&&g.mapState.currentSubmap||'');
  if(scene==='StomachMap')return 'stomach:'+String(g._stomachRoute||'')+':'+!!window.STG_STOMACH_FORCED_PATH;
  return scene==='Lab'?'lab':null;
 }
 function source(){var scene=window.SugarCube&&SugarCube.State&&SugarCube.State.passage,id={MapScreen:'stg-mapscreen-root',StomachMap:'stg-stomach-root',Lab:'stg-lab-root'}[scene],root=id&&document.getElementById(id),svg=root&&root.querySelector('.submap-svg');return root&&svg&&!root.closest('.passage-out')?{root:root,svg:svg,scene:scene}:null;}
 function num(el,name){return Number(el.getAttribute(name))||0;}
 function metadata(s){var g=window._STG||{};
  if(s.scene==='Lab')return window.STG_LAB_NODES||{};
  if(s.scene==='MapScreen'){var m=g.mapState||{},sm=(m.submaps&&m.submaps[m.currentSubmap])||(window.STG_SUBMAPS||{})[m.currentSubmap];return sm&&sm.nodes||{};}
  var types=g._stomachLayout||{},layout=g._stomachRoute==='logic'?window.STG_STOMACH_LAYOUT_LOGIC:window.STG_STOMACH_LAYOUT,out={};
  if(window.STG_STOMACH_FORCED_PATH){['entry','f1','f2','fv','f3','boss'].forEach(function(key){out[key]={type:types[key]||'event'};});}
  else Object.keys(layout||{}).forEach(function(key){out[key]={x:layout[key].x,y:layout[key].y,type:types[key]||'event'};});
  return out;
 }
 function ensure(s){var id=identity(),game=window._STG,scope=L.buffer.getScope();if(!life||life.identity!==id||life.root!==s.root||life.game!==game||life.scope!==scope){life={id:'map-'+(++serial),identity:id,root:s.root,game:game,scope:scope,handles:new Map(),warned:new Set(),topology:null,signature:null};log.info('MAP_CONTEXT',{id:life.id,identity:id});}return life;}
 function read(){var s=source();if(!s)return Object.freeze({available:false});var ctx=ensure(s),g=window._STG||{},profile=s.scene==='StomachMap'?(g._stomachRoute==='logic'?'stomach.logic':'stomach.normal'):s.scene==='Lab'?'lab':'manor',meta=metadata(s),keys=Object.keys(meta),vb=s.svg.viewBox.baseVal,width=vb.width;
  var groups=Array.from(s.svg.querySelectorAll('.submap-node,.lab-node')),nodes=[],states=[],handles=new Map();
  groups.forEach(function(el,i){var origin=el.style.transformOrigin.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/),x=origin?Number(origin[1]):0,y=origin?Number(origin[2]):0,key=keys[i],raw=meta[key]||{},type=raw.type||Array.from(el.classList).find(function(c){return /^submap-node-(?!current|adj)/.test(c);});if(type&&type.indexOf('submap-node-')===0)type=type.slice(12);
   var visual=A.visual(type,raw.boss,profile,key);if(visual==='unknown'&&!ctx.warned.has(String(type))){ctx.warned.add(String(type));log.warn('MAP_UNKNOWN_TYPE',{type:String(type||''),identity:ctx.identity});}
   var id=String(key==null?x+':'+y:key),current=el.classList.contains('submap-node-current')||s.scene==='Lab'&&key==='arc',available=typeof el.onclick==='function',cleared=s.scene==='MapScreen'?!!(g.mapState&&g.mapState.clearedNodes&&g.mapState.clearedNodes[g.mapState.currentSubmap+'|'+key]):s.scene==='StomachMap'?!!(g._stomachCleared&&g._stomachCleared[key]):false;
   // Original labels are text, never the old SVG icon/check symbol.
   var label=raw.label||'';if(s.scene==='MapScreen'&&visual!=='nav.exit'&&visual!=='nav.entry')label='';
   nodes.push(Object.freeze({id:id,x:x,y:y,visualKey:visual,direction:visual==='nav.exit'?A.direction(raw.direction,x,width):null,label:String(label),name:A.label(visual)}));
   states.push(Object.freeze({id:id,current:current,available:available,cleared:cleared}));handles.set(id,el);
  });ctx.handles=handles;
  var edges=[],edgeStates=[];Array.from(s.svg.children).filter(function(el){return el.localName==='line';}).forEach(function(el,i){var id='edge-'+i;edges.push(Object.freeze({id:id,x1:num(el,'x1'),y1:num(el,'y1'),x2:num(el,'x2'),y2:num(el,'y2'),dash:String(el.getAttribute('stroke-dasharray')||'')}));edgeStates.push(Object.freeze({id:id,emphasized:num(el,'stroke-width')>=5}));});
  var signature=JSON.stringify([profile,nodes,edges]);if(signature!==ctx.signature){ctx.signature=signature;ctx.topology=Object.freeze({nodes:Object.freeze(nodes),edges:Object.freeze(edges)});}
  // Existing portrait resolver is pure; no new image fetch or resource source.
  var portrait=typeof window.stgPlayerPortraitUrl==='function'&&g.player?window.stgPlayerPortraitUrl(g.player):'';
  return Object.freeze({schema:1,available:true,id:ctx.id,identity:ctx.identity,profile:profile,topology:ctx.topology,state:Object.freeze({nodes:Object.freeze(states),edges:Object.freeze(edgeStates),portrait:String(portrait||'')})});
 }
 function enter(id,key){var s=source(),ctx=life;if(!s||!ctx||ctx.id!==id||ctx.root!==s.root||ctx.game!==window._STG||ctx.scope!==L.buffer.getScope()||ctx.identity!==identity()||L.assets.locked()||L.bridge.pause.active())return false;
  // Refresh handles if the native renderer has replaced its SVG; retain its gate.
  read();var el=ctx.handles.get(String(key));if(!el||!el.isConnected||!s.root.contains(el)||typeof el.onclick!=='function')return false;
  log.info('MAP_ENTER',{id:id,node:String(key)});el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true;
 }
 function legend(root){var data=read();if(!data.available)return Object.freeze([]);var byLabel={Vent:'nav.vent',Encounter:'combat.normal',Event:'event.normal',Upgrade:'upgrade',Rest:'rest',Boss:'combat.boss',Door:'nav.exit',Entry:'nav.entry','Special Event':'event.special',Special:'event.special',Void:'void',Safe:'logic.safe',Dangerous:'logic.dangerous',Restorative:'logic.restorative',Gamble:'logic.gamble',Pylorus:'logic.pylorus'},seen=new Set(),rows=[];
  Array.from(root.querySelectorAll('.map-legend-inline > .mlg-item')).forEach(function(el){var label=el.textContent.trim(),key=byLabel[label];if(!key||seen.has(key))return;seen.add(key);rows.push(Object.freeze({id:key,visualKey:key,label:label,description:String(el.getAttribute('data-tip')||'')}));});
  data.topology.nodes.forEach(function(n){if(seen.has(n.visualKey))return;seen.add(n.visualKey);rows.push(Object.freeze({id:n.visualKey,visualKey:n.visualKey,label:A.label(n.visualKey),description:''}));});return Object.freeze(rows);
 }
 // A deferred native boot can replace an initially empty scene root. That
 // first graph needs its scene scaffold; same-root state rebuilds do not.
 L.bridge.map=Object.freeze({read:read,enter:enter,identity:identity,legend:legend,rememberScaffold:function(root){scaffolds.add(root);},hasScaffold:function(root){return scaffolds.has(root);}});
})();
