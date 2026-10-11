/* Observer-only diagnostic ring. Never a source of game or presentation state. */
(function(){'use strict';var L=window.LUNAR,capacity=1500,ring=new Array(capacity),head=0,size=0,sequence=0,threshold=0;
 // Loaded before bridge.pause: diagnostics must never enter its game timer registry/emit.
 var diagnosticTimeout=window.setTimeout.bind(window),diagnosticClear=window.clearTimeout.bind(window);
 var levels={DEBUG:0,INFO:1,WARN:2,ERROR:3,FATAL:4},listeners=new Set(),scopes=new Map(),store,previous=null,ready=false,persistent=false,dirty=0,timer=null,queued=false,writing=null,urgent=false;
 function bounded(value,max){return typeof value==='string'?value.slice(0,max):typeof value==='number'||typeof value==='boolean'?String(value):'';}
 // Bounded, descriptor-only payload copy: no getters, DOM, snapshots or arbitrary toJSON.
 function small(value,depth,budget){
  if(!budget.left--)return '[truncated]';if(value==null||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;if(typeof value==='string')return value.slice(0,240);
  if(typeof value!=='object'||depth>=3)return '[omitted]';
  var proto=Object.getPrototypeOf(value);if(!Array.isArray(value)&&proto!==Object.prototype&&proto!==null)return '[unsupported]';
  var out=Array.isArray(value)?[]:{};
  // Bound iteration itself: Object.keys on a huge game object is forbidden too.
  var count=0;for(var key in value){if(!Object.prototype.hasOwnProperty.call(value,key))continue;if(count++>=8)break;
   if(/password|passphrase|token|secret|saveName|userInput|html|snapshot|gameState|^_STG$|^state$|^dom$/i.test(key)){out[key]='[redacted]';continue;}
   var descriptor=Object.getOwnPropertyDescriptor(value,key);out[key.slice(0,60)]=descriptor&&'value' in descriptor?small(descriptor.value,depth+1,budget):'[accessor omitted]';
  }return out;
 }
 function payload(value){try{return small(value,0,{left:32});}catch(_){return '[unreadable payload]';}}
 function errorData(error){var result={};try{result.message=bounded(error&&error.message||error,500);result.stack=bounded(error&&error.stack,4096);}catch(_){result.message='Unreadable exception';}return result;}
 function entries(){var result=new Array(size);for(var i=0;i<size;i++)result[i]=ring[(head+i)%capacity];return result;}
 var node=document.getElementById('LUNAR-diagnostic-config'),config={};try{config=node?JSON.parse(node.textContent):{};}catch(_){}
 var quotes=Array.isArray(config.quotes)?config.quotes.filter(function(q){return typeof q==='string'&&q.trim();}):[],catalog=config.modules||[];
 // Never consume the game's Math.random stream for observer infrastructure.
 function word(){try{return crypto.getRandomValues(new Uint32Array(1))[0];}catch(_){return Date.now()%4294967296;}}
 function sessionId(){try{if(crypto.randomUUID)return crypto.randomUUID();}catch(_){}return Date.now().toString(36)+'-'+word().toString(36)+'-'+Math.floor(performance.now()*1000).toString(36);}
 var session={id:sessionId(),started:new Date().toISOString(),ended:null,cleanShutdown:false,
  quote:quotes.length?quotes[word()%quotes.length].slice(0,500):'',environment:{gameVersion:config.gameVersion||'unknown',gameFingerprint:config.gameFingerprint||'unknown',build:config.build||'unknown',buildRevision:config.buildRevision||'',lunarApi:(catalog.find(function(m){return m.id==='lunar';})||{}).apiVersion||String(L.version),lunarProtocol:L.version,lunarSchema:config.lunarSchema||1,moonshine:(catalog.find(function(m){return m.id==='moonshine';})||{}).version||'unknown',modules:catalog.map(function(m){return {id:m.id,version:m.apiVersion||m.version};}),browser:navigator.userAgent,platform:navigator.platform,viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio||1,language:navigator.language,documentLanguage:document.documentElement.lang||''}};
 function snapshot(){return {session:session,entries:entries(),lastSequence:sequence,checkpoint:new Date().toISOString()};}
 function announce(){listeners.forEach(function(fn){try{fn(status());}catch(e){console.warn('LUNAR Logger status listener failed',e);}});}
 function status(){return Object.freeze({ready:ready,previousAvailable:!!previous,persistence:persistent?'indexeddb':'memory'});}
 function degrade(error){if(!persistent&&ready)return;persistent=false;ready=true;if(timer!==null){diagnosticClear(timer);timer=null;}console.warn('LUNAR Logger persistence unavailable; using bounded memory logging.',error);append('WARN','LUNAR.logger','STORAGE_UNAVAILABLE',{mode:'memory'});announce();}
 function checkpoint(){
  if(!ready||!persistent||!dirty)return writing||Promise.resolve(false);
  if(writing){urgent=true;return writing.then(function(){return checkpoint();});}
  if(timer!==null){diagnosticClear(timer);timer=null;}dirty=0;urgent=false;
  var saved=snapshot();writing=Promise.resolve().then(function(){return store.save(saved);}).then(function(){return true;},function(e){degrade(e);return false;}).then(function(ok){writing=null;if(dirty&&persistent)request(urgent);return ok;});return writing;
 }
 function request(immediate){if(!ready||!persistent)return;if(immediate){urgent=true;if(queued)return;queued=true;queueMicrotask(function(){queued=false;checkpoint();});}else if(timer===null){timer=diagnosticTimeout(function(){timer=null;checkpoint();},2000);}}
 // LUNAR resource ownership supplies a tiny diagnostic header, never a manifest.
 // Header metadata survives ring eviction; writes share the existing async queue.
 function assetQuality(value){try{var names=['ULTRA','HIGH','MEDIUM','LOW'];if(!value||!names.concat('ORIGINAL').includes(value.profile))return;var scales={};for(var i=0;i<names.length;i++){var n=names[i],scale=value.resolutionScales&&value.resolutionScales[n];if(typeof scale!=='number'||!Number.isFinite(scale)||scale<=0||scale>1)return;scales[n]=scale;}
  session.environment.assetQuality={schema:2,preference:['Auto','Fast','Standard','Fancy','Ultra','Original'].includes(value.preference)?value.preference:'Auto',autoEffective:['Fast','Standard','Fancy','Ultra'].includes(value.autoEffective)?value.autoEffective:null,effective:bounded(value.effective||value.profile,20),appliedProfile:names.concat('ORIGINAL').includes(value.appliedProfile)?value.appliedProfile:value.profile,pendingProfile:names.concat('ORIGINAL').includes(value.pendingProfile)?value.pendingProfile:null,profile:value.profile,selected:value.selected===true,initialProfile:names.concat('ORIGINAL').includes(value.initialProfile)?value.initialProfile:null,selectionReason:bounded(value.selectionReason,80),lastChangeReason:bounded(value.lastChangeReason,80),resolutionScales:scales,saveData:value.saveData===true,staticPreferred:value.staticPreferred===true,animationDeadlineMs:Number.isFinite(value.animationDeadlineMs)?Math.max(0,Math.min(60000,value.animationDeadlineMs)):null,downgrades:Number.isFinite(value.downgrades)?Math.max(0,Math.min(3,Math.floor(value.downgrades))):0};dirty++;request(false);
 }catch(_){/* A diagnostic header update must not affect resource policy. */}}
 function append(level,scope,message,data,error){
  try{if(!(level in levels)||levels[level]<threshold)return;var item={timestamp:new Date().toISOString(),elapsed:performance.now(),sequence:++sequence,level:level,scope:scope,message:bounded(message,240)};
   if(data!==undefined)item.data=payload(data);
   if(levels[level]>=levels.ERROR){if(error!==undefined)item.error=errorData(error);item.sessionId=session.id;item.recent=[];for(var i=Math.max(0,size-12);i<size;i++){var old=ring[(head+i)%capacity];item.recent.push({sequence:old.sequence,scope:old.scope,message:old.message});}}
   if(size<capacity){ring[(head+size)%capacity]=item;size++;}else{ring[head]=item;head=(head+1)%capacity;}dirty++;request(levels[level]>=levels.ERROR||dirty>=64);
  }catch(_){/* Diagnostics must not throw into game code, including hostile payloads. */}
 }
 function scope(name){if(typeof name!=='string'||name.length>80||! /^(?:LUNAR\.[a-z_]+|MOONSHINE\.[a-z_]+|MOD\.[a-z0-9_-]+)$/.test(name))throw new TypeError('Invalid diagnostic scope');if(scopes.has(name))return scopes.get(name);var result=Object.freeze({debug:function(m,d){append('DEBUG',name,m,d);},info:function(m,d){append('INFO',name,m,d);},warn:function(m,d){append('WARN',name,m,d);},error:function(m,e,d){append('ERROR',name,m,d,e);},fatal:function(m,e,d){append('FATAL',name,m,d,e);}});if(scopes.size<64)scopes.set(name,result);return result;}
 function start(storage){if(store)return;store=storage;append('INFO','LUNAR.logger','SESSION_START',{session:session.id});
  Promise.resolve().then(function(){return store.start(snapshot());}).then(function(old){previous=old;persistent=true;ready=true;dirty++;announce();request(true);},degrade);
 }
 function shutdown(event){if(!event.persisted){session.cleanShutdown=true;session.ended=new Date().toISOString();append('INFO','LUNAR.logger','SESSION_END');}dirty++;checkpoint();}
 window.addEventListener('error',function(event){scope('LUNAR.logger').error('UNCAUGHT_EXCEPTION',event.error||event.message,{file:bounded(event.filename,240),line:event.lineno,column:event.colno});});
 window.addEventListener('unhandledrejection',function(event){scope('LUNAR.logger').fatal('UNHANDLED_REJECTION',event.reason);});
 window.addEventListener('pagehide',shutdown);window.addEventListener('pageshow',function(event){if(event.persisted){session.cleanShutdown=false;session.ended=null;dirty++;request(true);}});
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')checkpoint();});
 L.logger=Object.freeze({scope:scope});
 L.bridge.logger={assetQuality:assetQuality,start:start,snapshot:snapshot,status:status,previous:function(){return previous;},checkpoint:checkpoint,subscribe:function(fn){listeners.add(fn);return function(){listeners.delete(fn);};},setThreshold:function(level){if(level in levels)threshold=levels[level];}};
})();
