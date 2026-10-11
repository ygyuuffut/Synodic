/* Opt-in diagnostic overlay. Never imported by modules.json or shipped builds. */
const assert=require('node:assert/strict');

function browserProbe(){
 'use strict';
 const nativeRaf=window.requestAnimationFrame.bind(window),nativeTimer=window.setTimeout.bind(window);
 let enabled=false,mode='normal',stats={},events=[],frames=[],longTasks=[],removed=[],start=0,lastFrame=0;
 const depths=new Map(),stack=[],animated=new Set();let serial=0;
 const nodeIds=new WeakMap();const nodeId=n=>{if(!nodeIds.has(n))nodeIds.set(n,++serial);return nodeIds.get(n);};
 const label=n=>n?.id||n?.getAttribute?.('data-ms-class')||n?.className?.baseVal||String(n?.className||n?.nodeName||'');
 function count(name,n=1){if(enabled)stats[name]=(stats[name]||0)+n;}
 function wrap(name,fn){
  let cached;
  function measured(...args){
   if(!enabled){const value=fn.apply(this,args);if(name==='LUNAR.native.capture'||name==='LUNAR.game.capture')cached=value;return value;}
   const isolated=mode==='read-only'||mode==='no-notify';
   if(isolated&&['MOONSHINE.workspace.sync','MOONSHINE.workspace.data','MOONSHINE.workspace.partial','MOONSHINE.runtime.render','MOONSHINE.actions.refresh','MOONSHINE.mods.refresh','MOONSHINE.hud.update','MOONSHINE.chrome.updateMode','MOONSHINE.persistent.refresh','MOONSHINE.persistent.hud','MOONSHINE.persistent.state','MOONSHINE.persistent.geometry','MOONSHINE.combat.refresh'].includes(name)){count(name+'.isolated');return;}
   if(mode==='read-only'&&(name==='LUNAR.native.capture'||name==='LUNAR.game.capture')){count('LUNAR.rawRead');return cached;}
   const depth=depths.get(name)||0;depths.set(name,depth+1);count(name+'.calls');
   if(depth){try{return fn.apply(this,args);}finally{depths.set(name,depth);}}
   const t=performance.now(),parent=stack.at(-1)||null;stack.push(name);
   try{return fn.apply(this,args);}finally{
    const ms=performance.now()-t;stack.pop();depths.set(name,0);
    const s=stats[name+'.time']||(stats[name+'.time']={count:0,total:0,max:0,over4:0,over8:0,over16:0});s.count++;s.total+=ms;s.max=Math.max(s.max,ms);for(const limit of [4,8,16])if(ms>limit)s['over'+limit]++;
    if(events.length<15000)events.push({name,start:t-start,ms,parent});
   }
  }
  measured._synodicPerfName=name;return measured;
 }
 const stringify=JSON.stringify;JSON.stringify=function(...args){if(enabled){count('JSON.stringify.calls');count('JSON.stringify.owner.'+(stack.at(-1)||'unwrapped'));}return stringify.apply(this,args);};
 function deliver(fn){
  if(!enabled||mode==='normal'||mode==='no-visible-dom'){count('LUNAR.notify.delivered');return fn();}
  count('LUNAR.notify.suppressed');
  if(mode==='read-only'){
   const g=window._STG;const t=performance.now();if(g)void [g.player?.hp,g.energy,g.hand?.length,g.enemy?.hp];count('LUNAR.rawRead');events.push({name:'LUNAR.rawRead',start:t-start,ms:performance.now()-t,parent:'LUNAR.notify'});
  }else if(mode==='no-notify'){
   // Production uses pull consumers. One shadow pull per epoch keeps conversion
   // alive when subscribers are muted; this is a lower bound, not equal fan-out.
   count('LUNAR.shadowPull');window.LUNAR.api.moonshine.sources();
  }
 }
 const animate=Element.prototype.animate;
 Element.prototype.animate=function(...args){const a=animate.apply(this,args);animated.add(a);if(enabled)count('animation.created');return a;};
 new MutationObserver(records=>{
  if(!enabled)return;
  for(const r of records){const el=r.target.nodeType===1?r.target:r.target.parentElement;const owned=!!el?.closest('[data-MOONSHINE-owned]');count(owned?'DOM.owned.mutations':'DOM.native.mutations');
   for(const n of r.removedNodes){if(n.nodeType!==1)continue;
    for(const a of animated){const target=a.effect?.target;if(target&&(target===n||n.contains(target))&&(a.playState==='running'||a.playState==='paused'))removed.push({time:performance.now()-start,node:label(target),id:nodeId(target),state:a.playState,removed:label(n)});}
   }
  }
 }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});
 try{new PerformanceObserver(list=>{if(enabled)for(const e of list.getEntries())longTasks.push({start:e.startTime-start,ms:e.duration});}).observe({type:'longtask',buffered:false});}catch(_){}
 function sample(t){if(enabled){if(lastFrame)frames.push(t-lastFrame);lastFrame=t;}nativeRaf(sample);}nativeRaf(sample);
 function begin(name,nextMode='normal'){mode=nextMode;stats={};events=[];frames=[];longTasks=[];removed=[];start=performance.now();lastFrame=0;enabled=true;console.timeStamp('SYNODIC:'+name);}
 function end(){enabled=false;const sorted=frames.slice().sort((a,b)=>a-b);return {mode,elapsed:performance.now()-start,stats,events,frames:{count:frames.length,p50:sorted[Math.floor(sorted.length*.5)]||0,p95:sorted[Math.floor(sorted.length*.95)]||0,max:sorted.at(-1)||0,over25:frames.filter(x=>x>25).length,over50:frames.filter(x=>x>50).length},longTasks,removed};}
 window.SYNODIC_PERF={wrap,count,deliver,begin,end,domBlocked:()=>enabled&&mode==='no-visible-dom',nativeTimer,nodeId};
}

function instrument(html){
 const edits=new Map();
 const P='window.SYNODIC_PERF';
 const locals=(pairs)=>pairs.map(([fn,name])=>`${fn}=${P}.wrap(${JSON.stringify(name)},${fn});`).join('\n')+'\n';
 function before(code,anchor,addition){assert(code.includes(anchor),'Missing diagnostic anchor '+anchor);return code.replace(anchor,addition+anchor);}
 function tail(code,addition){const at=code.lastIndexOf('})();');assert(at>=0);return code.slice(0,at)+addition+'\n'+code.slice(at);}
 edits.set('lunar.buffer.store',c=>before(c,'  window.LUNAR=',locals([['copy','LUNAR.buffer.copy']])));
 edits.set('lunar.adapter.data',c=>tail(c,`L.adapter.data.snapshot=${P}.wrap('LUNAR.data.snapshot',L.adapter.data.snapshot);`));
 edits.set('lunar.adapter.game',c=>tail(c,`L.adapter.game.normalize=${P}.wrap('LUNAR.game.normalize',L.adapter.game.normalize);`));
 edits.set('lunar.bridge.game',c=>tail(c,`L.bridge.game.capture=${P}.wrap('LUNAR.game.capture',L.bridge.game.capture);L.bridge.game.install=${P}.wrap('LUNAR.game.install',L.bridge.game.install);`));
 edits.set('lunar.bridge.native',c=>before(c,'  var api={',locals([['snapshot','LUNAR.native.snapshot'],['capture','LUNAR.native.capture'],['styles','LUNAR.native.styles']])));
 edits.set('lunar.bridge.port',c=>{
  const start=c.indexOf('  function emit('),end=c.indexOf('  function invoke(',start);assert(start>=0&&end>start,'Missing notify function');
  let emit=c.slice(start,end);emit=emit.replace(/function emit\(([^)]*)\)\{/,(_,args)=>`function emit(${args}){${P}.count('LUNAR.emit.requests');`).replace('queueMicrotask(function(){',`queueMicrotask(${P}.wrap('LUNAR.notify',function(){`).replace('changes.forEach(function(fn){fn();});',`${P}.deliver(function(){changes.forEach(function(fn){fn();});});`).replace(/\}\);\s*\}\s*$/, '}));}\n');c=c.slice(0,start)+emit+c.slice(end);
  c=c.replace('subscribe:function(fn){changes.add(fn);',`subscribe:function(fn){fn=${P}.wrap('LUNAR.subscriber.'+(fn._synodicPerfName||fn.name||'anonymous'),fn);changes.add(fn);`);
  return before(c,'  L.bridge.port={',locals([['pack','LUNAR.port.pack'],['read','LUNAR.port.read'],['invoke','LUNAR.port.invoke']]));
 });
 edits.set('lunar.bridge.actions',c=>before(c,' L.bridge.actions={',locals([['read','LUNAR.actions.read'],['notify','LUNAR.actions.notify']])));
 edits.set('lunar.api.moonshine',c=>before(c,'  L.api.moonshine=',locals([['install','LUNAR.api.install']])));
 edits.set('moonshine.view.workspace',c=>before(c,c.includes("  if(document.fonts)document.fonts.addEventListener('loadingdone'")?"  if(document.fonts)document.fonts.addEventListener('loadingdone'":"  window.MOONSHINE_WORKSPACE=",locals([['sync','MOONSHINE.workspace.sync'],['data','MOONSHINE.workspace.data'],['update','MOONSHINE.workspace.update'],['snapshot','MOONSHINE.workspace.snapshot'],['resources','MOONSHINE.workspace.resources']])));
 edits.set('moonshine.component.catalog',c=>before(c,'  window.MOONSHINE_COMPONENTS=',locals([['patch','MOONSHINE.catalog.patch'],['fit','MOONSHINE.catalog.fit']])));
 edits.set('moonshine.component.actions',c=>before(c,' window.MOONSHINE_ACTION_COMPONENTS=',locals([['fitSymbols','MOONSHINE.symbols.fit'],['rich','MOONSHINE.rich']])));
 edits.set('moonshine.view.actions',c=>{
  c=c.replace('model=api.actions.read();',`model=api.actions.read();if(${P}.domBlocked()){${P}.count('MOONSHINE.actions.blocked');return;}`);
  return before(c,c.includes(' api.subscribe(refresh);')?' api.subscribe(refresh);':' window.MOONSHINE_ACTIONS=',locals([['refresh','MOONSHINE.actions.refresh'],['build','MOONSHINE.actions.build'],['grid','MOONSHINE.actions.grid'],...(c.includes('function createShell(')?[['createShell','MOONSHINE.actions.shell']]:[])]));
 });
 edits.set('moonshine.view.mods',c=>{
  c=c.replace('model=api.mods.read();',`model=api.mods.read();if(${P}.domBlocked()){${P}.count('MOONSHINE.mods.blocked');return;}`);
  return before(c,c.includes(' api.subscribe(refresh);')?' api.subscribe(refresh);':' window.MOONSHINE_MODS=',locals([['refresh','MOONSHINE.mods.refresh'],['foreground','MOONSHINE.mods.foreground']]));
 });
 if(html.includes('id="lunar.bridge.mods"'))edits.set('lunar.bridge.mods',c=>before(c,' L.bridge.mods=',locals([['read','LUNAR.mods.read'],...(c.includes('function context(')?[['context','LUNAR.mods.context']]:[])])));
 edits.set('moonshine.view.runtime',c=>{
  c=c.replace('if(!full){',`if(!full){if(${P}.domBlocked()){${P}.count('MOONSHINE.runtime.blocked');return;}`);
  c=c.replace('var data=workspace.data();',`var data=workspace.data();if(${P}.domBlocked()){${P}.count('MOONSHINE.runtime.blocked');return;}`);
  if(process.env.PERF_FOCUS_PROBE){
   const stages=[['MOONSHINE_DISPLAY.sync();','display'],['MOONSHINE_COMPONENTS.patch(sceneLayer,data);','patchScene'],['MOONSHINE_UPDATE_VIEWS.index(root);','index'],['MOONSHINE_GEOMETRY.flush();','geometry'],['MOONSHINE_GRAPHICS_QUALITY.refresh();','quality'],['MOONSHINE_ACTIONS.refresh();','actions'],['MOONSHINE_MODS.refresh();','mods'],['MOONSHINE_MAIN_MENU_WATERMARK.refresh();','watermark'],["MOONSHINE_LOCATION.refresh(['scene']);",'location'],['MOONSHINE_MAP.refresh(domains);','map'],['MOONSHINE_COMBAT.refresh(domains);','combat'],['MOONSHINE_CARD_PANEL.refresh(domains);','cardPanel'],['MOONSHINE_RUN_REPORT.refresh();','report'],['MOONSHINE_LAB_NOTICE.refresh();','labNotice'],['MOONSHINE_STORY.geometry();','storyGeometry'],['MOONSHINE_STORY.refresh();','story'],['MOONSHINE_STORY.hud();','hud'],['MOONSHINE_PRESENTATION.refresh();','presentation'],['MOONSHINE_STORY_PHASE.refresh();','storyPhase'],['MOONSHINE_ENCOUNTER_ASSETS.refresh();','encounterAssets'],['MOONSHINE_BACKGROUND.refresh();','background'],['MOONSHINE_PROSE_ANIMATION.sync(root);','prose']];
   for(const [call,label] of stages){assert(c.includes(call),'Missing runtime phase '+label);c=c.split(call).join(`${P}.wrap('MOONSHINE.renderStage.${label}',function(){${call}})();`);}
   c=c.replace('var data=workspace.data();',`var data=${P}.wrap('MOONSHINE.renderStage.data',function(){return workspace.data();})();`);
   c=c.replace('var next=JSON.stringify(data);',`var next=${P}.wrap('MOONSHINE.renderStage.serialize',function(){return JSON.stringify(data);})();`);
  }
  return before(c,"  window.addEventListener('resize',",locals([['render','MOONSHINE.runtime.render'],['schedule','MOONSHINE.runtime.schedule'],...(process.env.PERF_FOCUS_PROBE?[['focusDialogs','MOONSHINE.runtime.focusDialogs'],['viewportKey','MOONSHINE.runtime.viewportKey']]:[])]));
 });
 edits.set('moonshine.view.game_chrome',c=>before(c,'  updateMode();\n  surface.addEventListener',locals([['updateMode','MOONSHINE.chrome.updateMode'],...(c.includes('function updateMobileTopHud(')?[['updateMobileTopHud','MOONSHINE.hud.update'],['fitHudContents','MOONSHINE.hud.fit']]:[])])));
 if(html.includes('id="moonshine.view.story"')&&html.includes('id="moonshine.component.chrome"')){
  edits.set('lunar.bridge.chrome',c=>before(c,' L.bridge.chrome=',locals([['story','LUNAR.chrome.story']])));
  edits.set('moonshine.view.story',c=>{
   c=c.replace('var next=api.chrome.story();',`var next=api.chrome.story();if(${P}.domBlocked()){${P}.count('MOONSHINE.persistent.blocked');return;}`);
   c=c.replace('var player=api.updates.scalars().player;',`var player=api.updates.scalars().player;if(${P}.domBlocked()){${P}.count('MOONSHINE.persistent.blocked');return;}`);
   c=c.replace('function state(){if(!C)return;',`function state(){if(!C||${P}.domBlocked())return;`);
   return before(c,' window.MOONSHINE_STORY=',locals([['refresh','MOONSHINE.persistent.refresh'],['hud','MOONSHINE.persistent.hud'],['state','MOONSHINE.persistent.state'],['geometry','MOONSHINE.persistent.geometry']]));
  });
 }
 if(html.includes('id="lunar.bridge.updates"')){
  edits.set('lunar.bridge.updates',c=>tail(c,`L.bridge.updates.scalars=${P}.wrap('LUNAR.updates.scalars',L.bridge.updates.scalars);L.bridge.updates.infer=${P}.wrap('LUNAR.updates.infer',L.bridge.updates.infer);`));
  edits.set('moonshine.view.updates',c=>tail(c,`MOONSHINE_UPDATE_VIEWS.dispatch=${P}.wrap('MOONSHINE.routes.dispatch',MOONSHINE_UPDATE_VIEWS.dispatch);`));
  edits.set('moonshine.view.geometry',c=>before(c,' observer=new MutationObserver',locals([['flush','MOONSHINE.geometry.flush'],['external','MOONSHINE.geometry.external']])));
 }
 if(html.includes('id="moonshine.view.result"'))edits.set('moonshine.view.result',c=>before(c,' api.assets.subscribe',locals([['refresh','MOONSHINE.result.refresh'],['geometry','MOONSHINE.result.geometry']])));
 if(html.includes('id="moonshine.view.combat"')){
  edits.set('lunar.bridge.combat',c=>before(c,' L.bridge.combat=',locals([['read','LUNAR.combat.read'],['pile','LUNAR.combat.pile'],['details','LUNAR.combat.details'],...(c.includes('function result(')?[['result','LUNAR.combat.result']]:[])])));
  edits.set('moonshine.view.combat',c=>{
   c=c.replace('var next=api.combat.read();',`var next=api.combat.read();if(${P}.domBlocked()){${P}.count('MOONSHINE.combat.blocked');return;}`);
   return before(c,' api.timing.subscribe(buttons);',locals([['refresh','MOONSHINE.combat.refresh'],['buttons','MOONSHINE.combat.buttons']]));
  });
  edits.set('moonshine.component.combat',c=>before(c,' window.MOONSHINE_COMBAT_COMPONENT=',locals([['update','MOONSHINE.combat.patch'],['updateModal','MOONSHINE.combat.modalPatch']])));
 }
 if(html.includes('id="lunar.logger.core"'))edits.set('lunar.logger.core',c=>before(c,' L.logger=',locals([['append','LUNAR.logger.append'],['checkpoint','LUNAR.logger.checkpoint']])));
 for(const [id,edit] of edits){const start=`<script id="${id}">\n`,a=html.indexOf(start);assert(a>=0,'Missing injected module '+id);const b=html.indexOf('</script>',a);const content=html.slice(a+start.length,b);html=html.slice(0,a+start.length)+edit(content)+html.slice(b);}
 return html.replace('</head>',`<script id="SYNODIC-perf-diagnostic">(${browserProbe.toString()})();</script></head>`);
}
module.exports={instrument,browserProbe};
