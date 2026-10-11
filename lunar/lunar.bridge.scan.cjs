/* Deferred native choice handles. No scanner DOM, timers, motion or game fork. */
(function(){'use strict';var L=window.LUNAR,log=L.logger.scope('LUNAR.scan'),pending=null,replaying=false,sequence=0,tokens=new Set(),tokenSequence=0;
 function mobile(){return STG_DISPLAY_CONFIG.detectMode()==='mobile';}
 function root(kind){return Array.from(document.querySelectorAll(kind==='body'?'#stg-body-root':'#stg-encounter-root')).find(function(el){return !el.closest('.passage-out');});}
 function choice(kind,index){
  if(kind==='encounter'){var ev=window.stgCurrentEncounterEv;return ev&&window.stgOrderChoicesByAlignment(ev.choices||[])[index];}
  var ch=(window.STG_BODY_EXPLORATION||{})[window._stgBodyChar],node=ch&&ch.nodes&&ch.nodes[window._stgBodyNode],claims=(window._stgBodyClaims||{})[window._stgBodyChar]||{};
  return node&&window.stgOrderChoicesByAlignment((node.choices||[]).filter(function(c){return !c.claimKey||!claims[c.claimKey];}))[index];
 }
 function cancel(reason){if(!pending)return;log.info('SCAN_CANCELLED',{transaction:pending.id,reason:reason});pending=null;tokens.clear();if(typeof window.stgHeartsStop==='function')window.stgHeartsStop();L.bridge.port.emit(['scan','actions']);}
 function valid(){
  if(!pending)return false;
  if(!mobile()||pending.scope!==L.buffer.getScope()||pending.game!==window._STG||!pending.root.isConnected||pending.root!==root(pending.kind)||pending.root.closest('.passage-out')||pending.session!==window._stgHeartsSession||choice(pending.kind,pending.index)!==pending.choice){cancel('stale-context');return false;}
  return true;
 }
 function read(){if(!valid())return null;return L.adapter.scan.read(pending,pending.session,pending.config,pending.data,!!(window._STG&&_STG.advancedScans),{minimum:Number(window.STG_HEART_SPAWN_INTERVAL_MIN)||1400,maximum:Number(window.STG_HEART_SPAWN_INTERVAL_MAX)||3200,flight:Number(window.STG_HEART_FLIGHT_MS)||16000,limit:Math.max(1,Math.min(2,Number(window.STG_HEART_MAX_ON_SCREEN)||2))});}
 // A narrow read-only artwork descriptor: no reward, story or native art command.
 function inspection(id){if(!valid()||pending.id!==id||!(Number(pending.config.maxClicks)>0)||!(Number(pending.session.clickedTotal)>=Number(pending.config.maxClicks)))return null;return {id:pending.id,image:pending.image};}
 function capture(kind,original,self,args){
  if(!mobile()||replaying)return original.apply(self,args);
  if(valid())return false;
  var c=choice(kind,args[0]),key=kind==='body'?c&&c.claimKey:c&&(c.scanKey||'enc_'+((window.stgCurrentEncounterEv||{}).id||'scan'));
  var image=kind==='body'?c&&c.alignment==='logic'&&c.responseText&&((window.STG_SCAN_IMAGES||{})[window._stgBodyChar]||{})[key]:c&&c.scanImage;
  if(!image)return original.apply(self,args);
  var config=(window.STG_SCAN_HEART_CONFIG||{})[key]||{maxClicks:0},data=(window.STG_SCAN_DATA||{})[key]||{};
  // Replace only the native temporary scanner session, never a game snapshot.
  if(typeof window.stgHeartsStop==='function')window.stgHeartsStop();
  var session=window._stgHeartsSession={clickedTotal:0,heartIdCounter:0,claimKey:key,freezeUsed:false};
  pending={id:'scan-'+(++sequence),scope:L.buffer.getScope(),game:window._STG,root:root(kind),kind:kind,index:args[0],choice:c,original:original,self:self,args:Array.from(args),session:session,key:key,image:L.adapter.images.scan(image),label:c.scanLabel||c.label||'Scan',config:config,data:data};
  if(!pending.root){cancel('missing-root');return false;}
  log.info('SCAN_PENDING',{transaction:pending.id,key:key,kind:kind});L.bridge.port.emit(['scan','actions']);return true;
 }
 function token(id){var value=read();if(!value||value.id!==id||value.complete||!value.maximum||tokens.size>=value.spawn.limit)return null;var key=id+':target-'+(++tokenSequence);tokens.add(key);return key;}
 function release(id,key){if(!valid()||pending.id!==id)return false;return tokens.delete(key);}
 function feedback(name){L.bridge.pause.ui(function(){if(typeof window.stgSfx==='function')window.stgSfx(name);});}
 function hit(id,key){var value=read();if(!value||value.id!==id||value.complete||!tokens.delete(key))return false;pending.session.clickedTotal++;pending.session.heartIdCounter++;feedback('purple');
  var next=read();log.info(next.complete?'SCAN_COMPLETE':'SCAN_REPORT_UNLOCKED',{transaction:id,count:next.count,maximum:next.maximum});L.bridge.port.emit(['scan']);return next;
 }
 function freeze(id){var value=read();if(!value||value.id!==id||!value.freezeAvailable)return false;pending.session.freezeUsed=true;feedback('block');L.bridge.port.emit(['scan']);return true;}
 function suspend(id){if(!valid()||pending.id!==id)return false;tokens.clear();return true;}
 function proceed(id){var value=read();if(!value||value.id!==id)return false;if(!value.canContinue){log.info('SCAN_CONTINUE_BLOCKED',{transaction:id,count:value.count,maximum:value.maximum});return false;}var transaction=pending;pending=null;tokens.clear();replaying=true;
  log.info('SCAN_SETTLE_START',{transaction:id,count:value.count,complete:value.complete});
  try{return L.bridge.pause.game(function(){
   // Native rewards/effects, authored outcome chunks and callback chain run once.
   // The legacy overlay is suppressed only for this synchronous choice replay.
   if(value.complete){
    if(typeof window.stgMarkScanCaptured==='function')window.stgMarkScanCaptured(transaction.key);
    if(typeof transaction.config.grant==='function'&&typeof window.stgGrantFetish==='function'){
     var grant=transaction.config.grant(1);if(grant&&grant.fetish)window.stgGrantFetish('arc.'+transaction.key+'.complete',grant.fetish);
    }
    if(window._stgBodyChar==='arc'&&Array.isArray(window.STG_ARC_MOANS)&&STG_ARC_MOANS.length&&typeof window.stgPlayAudio==='function')window.stgPlayAudio(STG_ARC_MOANS[Math.floor(Math.random()*STG_ARC_MOANS.length)],.7);
   }
   transaction.original.apply(transaction.self,transaction.args);
   log.info('SCAN_SETTLED',{transaction:id,count:value.count,complete:value.complete});L.bridge.port.emit(['scan','actions','story','hud']);return true;
  });}catch(error){log.error('SCAN_SETTLE_FAILED',error,{transaction:id,count:value.count});throw error;}finally{replaying=false;}
 }
 function install(){
  // Read-only legacy gallery dismissal must not discard a pending story scan.
  var stop=window.stgHeartsStop;if(typeof stop==='function'&&!stop._lunarScan){var stopWrapper=function(){var saved=pending&&pending.scope===L.buffer.getScope()&&pending.game===window._STG&&pending.root.isConnected&&!pending.root.closest('.passage-out')?pending.session:null;var result=stop.apply(this,arguments);if(saved)window._stgHeartsSession=saved;return result;};Object.assign(stopWrapper,stop);stopWrapper._lunarScan=true;window.stgHeartsStop=stopWrapper;}
  [['stgBodyExplorationChoose','body'],['stgEncounterEventChoose','encounter']].forEach(function(entry){var original=window[entry[0]];if(typeof original!=='function'||original._lunarScan)return;var wrapped=function(){return capture(entry[1],original,this,arguments);};Object.assign(wrapped,original);wrapped._lunarScan=true;window[entry[0]]=wrapped;});
  var show=window.stgShowScanOverlay;if(typeof show==='function'&&!show._lunarScan){var wrapper=function(){try{var state=window.SugarCube&&window.SugarCube.State;if(mobile()&&(replaying||!arguments[2]&&(state&&state.passage==='StomachMap'||document.querySelector('.passage:not(.passage-out) #stg-stomach-root'))))return;return show.apply(this,arguments);}catch(error){if(L.recovery)L.recovery.remember(error);throw error;}};Object.assign(wrapper,show);wrapper._lunarScan=true;window.stgShowScanOverlay=wrapper;}
 }
 L.bridge.scan=Object.freeze({install:install,read:read,inspection:inspection,token:token,release:release,hit:hit,freeze:freeze,suspend:suspend,proceed:proceed,cancel:cancel});
 window.addEventListener('LUNAR-navigation',function(e){if(e.detail&&e.detail.type===':passageinit')cancel('navigation');});
 window.addEventListener('stg-display-config-change',function(){if(!mobile())cancel('mode-change');});
})();
