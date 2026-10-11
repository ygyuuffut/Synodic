/* Emergency compatibility/evidence owner. No DOM construction or animations. */
(function(){'use strict';var L=window.LUNAR,phase='NORMAL',incident=null,frozen=null,listeners=new Set(),secondary=false,remembered=null;
 function safe(fn,fallback){try{return fn();}catch(_){return fallback;}}
 function string(value,limit){return safe(function(){return String(value==null?'':value).slice(0,limit);},'[unreadable]');}
 function log(level,event,error,data){safe(function(){var scope=L.logger.scope('LUNAR.recovery');if(level==='fatal'||level==='error')scope[level](event,error,data);else scope[level](event,data);});}
 function status(){return Object.freeze({phase:phase,fatalId:incident&&incident.id,displayMessage:incident&&incident.display,crashSnapshotAvailable:!!frozen});}
 function emit(){var value=status();listeners.forEach(function(fn){safe(function(){fn(value);});});}
 function context(){return {presentation:safe(function(){return L.bridge.chrome.presentation().mode;},'unknown'),scene:safe(function(){return string(window.SugarCube.State.passage,120);},'unavailable'),map:safe(function(){var g=window._STG||{},m=g.mapState||{};return {submap:string(m.currentSubmap||m.submap,80),node:string(g._stomachNode||m.currentNode,80),route:string(g._stomachRoute,40)};},'unavailable'),graphics:safe(function(){return L.assetQuality.status();},'unavailable'),resources:safe(function(){return L.assets.status().profile;},'unavailable')};}
 function capture(error,meta){if(phase!=='NORMAL'){if(!secondary){secondary=true;log('warn','RECOVERY_SECONDARY_EXCEPTION',null,{message:string(error&&error.message||error,500)});}return status();}
  phase='RECOVERY_ENTERING';meta=meta||{};var name=string(safe(function(){return error.name;},'Error')||'Error',100),message=string(safe(function(){return error.message;},error)||error,8192),stack=string(safe(function(){return error.stack;},''),16384);
  incident={id:'fatal-'+Date.now().toString(36),timestamp:new Date().toISOString(),name:name,message:message,stack:stack,source:string(meta.source,512),line:meta.line||null,column:meta.column||null,origin:string(meta.origin||'unrecoverable',80),rejection:meta.rejection?string(meta.rejection,8192):null,display:name+': '+message,context:context()};
  log('fatal','FATAL_EXCEPTION_CAPTURED',error,{fatalId:incident.id,origin:incident.origin,source:incident.source,line:incident.line,column:incident.column});
  log('info','CRASH_SNAPSHOT_FROZEN',null,{fatalId:incident.id});
  // Exceptional one-shot current-session export. Never expose a live log getter.
  var record=safe(function(){return L.bridge.logger.snapshot();},null),config=safe(function(){return JSON.parse(document.getElementById('LUNAR-diagnostic-config').textContent);},{});
  frozen=safe(function(){return Object.freeze({available:true,filename:'SYNODIC-crash-'+incident.id+'.log',text:'SYNODIC Crash Log\n'+JSON.stringify({schema:1,fatal:incident,session:record&&record.session||{environment:{build:config.build,buildRevision:config.buildRevision,gameVersion:config.gameVersion,gameFingerprint:config.gameFingerprint}},checkpoint:record&&record.checkpoint,entries:record&&record.entries||[],loggerAvailable:!!record},null,2)+'\n'});},null);
  if(!frozen)frozen=Object.freeze({available:true,filename:'SYNODIC-crash-'+incident.id+'.log',text:'SYNODIC Crash Log\n'+incident.display+'\n'+incident.stack+'\n'});
  if(meta.acknowledge){phase='AWAITING_ACKNOWLEDGMENT';emit();}else activate();return status();
 }
 function activate(){if(!incident||phase==='RECOVERY_ACTIVE')return;phase='RECOVERY_ACTIVE';log('info','RECOVERY_UI_ENTER',null,{fatalId:incident.id});emit();}
 function acknowledge(){if(phase!=='AWAITING_ACKNOWLEDGMENT')return false;safe(function(){var button=document.getElementById('stg-alert-ok');if(button)button.click();});activate();return true;}
 function exportCrash(){if(!frozen)return Promise.resolve({available:false});log('info','CRASH_LOG_EXPORT',null,{fatalId:incident.id});return Promise.resolve(frozen);}
 function exportFailed(error){log('error','CRASH_LOG_EXPORT_FAILED',error,{fatalId:incident&&incident.id});}
 function restart(){if(!incident)return false;log('info','GAME_RESTART_REQUEST',null,{fatalId:incident.id});
  // A document reload leaves the engine history intact until cleanup is authorized.
  window.location.reload();return true;}
 function remember(error){remembered={name:string(safe(function(){return error.name;},'Error'),100),message:string(safe(function(){return error.message;},error),8192),stack:string(safe(function(){return error.stack;},''),16384),time:performance.now()};}
 function upstream(body){var text=String(body),split=text.indexOf('\n\nStack Trace:\n'),summary=(split>=0?text.slice(0,split):text).replace(/^A fatal error has occurred\. Aborting\.\s*/,'').replace(/^Error(?: \[[^\]]*\])?:\s*/,''),stack=split>=0?text.slice(split+15):'',name=(stack.match(/^([\w]*Error):/)||[])[1]||'Error';var message=summary.replace(/\.$/,'');if(remembered&&performance.now()-remembered.time<1000&&remembered.message===message){name=remembered.name;stack=remembered.stack||stack;}remembered=null;return {name:name,message:message,stack:stack};}
 // STG routes SugarCube's caught fatal to this single existing alert presenter.
 // Assignment wrapping also covers bootstrap restore before ordinary UI exists.
 var original=window.stgShowAlertModal,wrapped;
 function install(fn){original=fn;if(typeof fn!=='function'||fn._lunarRecovery){wrapped=fn;return;}wrapped=function(opts){if(!opts||!/^A fatal error has occurred\. Aborting\./.test(String(opts.body)))return fn.apply(this,arguments);capture(upstream(opts.body),{origin:'upstream-fatal',acknowledge:true});var close=opts.onClose,value=Object.assign({},opts,{onClose:function(){try{if(typeof close==='function')close();}finally{activate();}}});try{return fn.call(this,value);}catch(error){activate();log('warn','UPSTREAM_FATAL_PRESENTATION_FAILED',null,{message:string(error.message,500)});}};Object.assign(wrapped,fn);wrapped._lunarRecovery=true;}
 install(original);Object.defineProperty(window,'stgShowAlertModal',{configurable:true,get:function(){return wrapped;},set:install});
 window.addEventListener('error',function(event){if(event.error||event.target===window&&event.message)capture(event.error||{name:'Error',message:event.message},{origin:'uncaught',source:event.filename,line:event.lineno,column:event.colno});});
 window.addEventListener('unhandledrejection',function(event){capture(event.reason,{origin:'unhandled-rejection',rejection:typeof event.reason==='object'?safe(function(){return event.reason.message;},''):event.reason});});
 L.recovery=Object.freeze({capture:capture,remember:remember,status:status,blocked:function(){return phase!=='NORMAL';},activate:activate,acknowledge:acknowledge,exportCrash:exportCrash,exportFailed:exportFailed,restart:restart,subscribe:function(fn){listeners.add(fn);return function(){listeners.delete(fn);};}});
})();
