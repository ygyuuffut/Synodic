/* Optional background delivery/decode. No functional gates or native state reads. */
(function(){'use strict';var api=LUNAR.api.moonshine,root=null,nodes=[],observer=null,pending=new Map(),decoded=new Set(),version=0,staticUrl=null;
 function cancel(){pending.forEach(function(item){clearTimeout(item.timer);item.image.onload=item.image.onerror=null;item.image.removeAttribute('src');});pending.clear();}
 function stop(){version++;cancel();if(observer)observer.disconnect();observer=null;root=null;nodes=[];decoded.clear();staticUrl=null;}
 function refresh(){var next=document.querySelector('#MOONSHINE-root [data-ms-dynamic-background]');if(next===root)return;stop();if(!next)return;root=next;var key=next.dataset.msDynamicBackground,data=api.resources.background(key);if(!data)return;nodes=Array.from(document.querySelectorAll('#MOONSHINE-root [data-ms-dynamic-background="'+key+'"]'));var generation=version;
  function apply(){nodes.forEach(function(n,i){var css='url("'+staticUrl+'")',opacity=i?'0':'1';n.dataset.msStaticBackground='true';if(n.style.backgroundImage!==css||n.style.getPropertyPriority('background-image')!=='important')n.style.setProperty('background-image',css,'important');if(n.style.opacity!==opacity||n.style.getPropertyPriority('opacity')!=='important')n.style.setProperty('opacity',opacity,'important');});}
  function fallback(reason){if(staticUrl||generation!==version)return;staticUrl=api.resources.background(key).static;cancel();apply();api.resources.backgroundDegraded(key,reason);api.logger.scope('MOONSHINE.background').warn('BACKGROUND_STATIC_FALLBACK',{key:key,reason:reason});}
  function check(){if(staticUrl){apply();return;}nodes.forEach(function(node){var match=node.style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/),url=match&&match[1];if(!url||decoded.has(url)||pending.has(url))return;var image=new Image(),item={image:image,timer:null};image.dataset.msArtRole='cg';pending.set(url,item);function finish(ok){if(generation!==version||!pending.has(url))return;clearTimeout(item.timer);image.onload=image.onerror=null;pending.delete(url);if(ok){decoded.add(url);}else fallback('delivery_decode_deadline');}image.onload=function(){image.decode().then(function(){finish(true);},function(){finish(false);});};image.onerror=function(){finish(false);};api.timing.ui(function(){item.timer=setTimeout(function(){finish(false);},data.deadlineMs);});image.src=url;});}
  observer=new MutationObserver(check);nodes.forEach(function(n){observer.observe(n,{attributes:true,attributeFilter:['style']});});if(data.preferStatic)fallback('delivery_policy');else check();
 }
 // One committed plate and one incoming buffer. Native opacity/CSS entrance
 // animations are source presentation, not owners of this visible surface.
 var plates=new WeakMap(),live=new Set(),generation=0,lifetime=0,majorId=api.transitions.status().id,log=api.logger.scope('MOONSHINE.background'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function breadcrumb(name,request,extra){log.info(name,Object.assign({generation:request.id,assetId:request.asset.assetId},extra||{}));}
 function stale(request,reason){if(request.stale)return;request.stale=true;breadcrumb('BG_TRANSITION_STALE_IGNORED',request,{reason:reason});}
 function dispose(request){clearTimeout(request.timer);request.image.onload=request.image.onerror=null;request.image.removeAttribute('src');if(request.motion){request.motion.cancel();request.motion=null;}if(request.layer){request.layer.remove();request.layer=null;}}
 function valid(state,request){return request.lifetime===lifetime&&state.request===request&&state.node.isConnected&&api.recovery.status().phase==='NORMAL';}
 function cancelPlate(state,reason){var request=state.request;if(!request)return;state.request=null;stale(request,reason);dispose(request);}
 function release(node){live.forEach(function(state){if(state.node===node||node.contains(state.node)){cancelPlate(state,'detached');if(state.geometry)state.geometry.disconnect();live.delete(state);plates.delete(state.node);}});}
 // Desktop width-only camera percentages are zoom relative to cover on a
 // portrait surface. Keep each buffer's own decoded aspect ratio: a pending
 // replacement must not resize the last committed image using its dimensions.
 function cameraSize(state,dimensions){
  var match=/^([\d.]+)%(?: auto)?$/.exec(state.size||'');
  if(!match||!dimensions||!state.width||!state.height)return state.size||'cover';
  var zoom=Math.max(1,Number(match[1])/100),scale=Math.max(state.width/dimensions.width,state.height/dimensions.height)*zoom;
  return dimensions.width*scale+'px '+dimensions.height*scale+'px';
 }
 function frameSize(state){
  if(!/^([\d.]+)%(?: auto)?$/.test(state.size||''))return;
  state.width=state.node.clientWidth;state.height=state.node.clientHeight;
  state.node.style.backgroundSize=cameraSize(state,state.dimensions);
  var request=state.request;if(request&&request.layer)request.layer.style.backgroundSize=cameraSize(state,request.dimensions);
 }
 function style(node,value,state){
  var desired=document.createElement('div').style;api.resources.withResolved(function(){desired.cssText=value;});
  // Stable host applies its filter/dimming once to both buffers. Only the
  // incoming child animates; native opacity/transition cannot expose old art.
  api.resources.withResolved(function(){desired.backgroundImage=state.committed;});
  desired.setProperty('opacity','1','important');desired.setProperty('transition','none','important');
  api.resources.withResolved(function(){node.setAttribute('style',desired.cssText);});
  frameSize(state);
 }
 function patch(node,value,frame){
  var desired=document.createElement('div').style;api.resources.withResolved(function(){desired.cssText=value;});
  if(frame&&frame.secondary){node.setAttribute('style',value);node.style.setProperty('display','none','important');return;}
  if(frame){api.resources.withResolved(function(){desired.backgroundImage=frame.image;});['size','position','repeat'].forEach(function(key){if(frame[key])desired['background'+key[0].toUpperCase()+key.slice(1)]=frame[key];});}
  var asset=api.resources.backgroundImage(desired.backgroundImage),state=plates.get(node);
  if(!state){state={node:node,committed:node.style.backgroundImage||'none',target:null,request:null,dimensions:null};plates.set(node,state);live.add(state);if(window.ResizeObserver){state.geometry=new ResizeObserver(function(){frameSize(state);});state.geometry.observe(node);}}
  state.size=desired.backgroundSize||'cover';
  state.value=desired.cssText;state.retry=false;style(node,state.value,state);
  // A dirty subtree or profile refresh cannot restart an unchanged request.
  if(state.target&&state.target.image===asset.image)return;
  cancelPlate(state,'superseded');state.target=asset;
  if(state.committed===asset.image)return;
  var image=new Image();image.dataset.msArtRole='cg';var request={id:++generation,lifetime:lifetime,asset:asset,image:image,timer:null,layer:null,motion:null,stale:false};state.request=request;
  breadcrumb('BG_TRANSITION_REQUEST',request);
  function current(reason){if(valid(state,request))return true;stale(request,reason);dispose(request);if(state.request===request)state.request=null;return false;}
  function fail(reason){if(!current(reason))return;state.request=null;dispose(request);log.warn(reason==='deadline'?'ASSET_DECODE_TIMEOUT':'BACKGROUND_REPLACEMENT_DEGRADED',{generation:request.id,assetId:asset.assetId,tier:'decorative',reason:reason});}
  async function ready(){
   if(!current('load'))return;
   try{if(asset.url)await image.decode();}catch(_){fail('decode');return;}
   if(!current('decode'))return;clearTimeout(request.timer);breadcrumb('BG_ASSET_READY',request);
   request.dimensions=image.naturalWidth?{width:image.naturalWidth,height:image.naturalHeight}:null;
   var layer=document.createElement('div');request.layer=layer;layer.dataset.msBackgroundBuffer='';layer.dataset.msArtRole='cg';layer.setAttribute('data-MOONSHINE-owned','');layer.setAttribute('aria-hidden','true');
   layer.style.cssText='position:absolute;inset:0;pointer-events:none;background-size:inherit;background-position:inherit;background-repeat:inherit;background-color:inherit;background-blend-mode:normal;mix-blend-mode:normal;opacity:0;';api.resources.withResolved(function(){layer.style.backgroundImage=asset.image;});node.append(layer);
   frameSize(state);breadcrumb('BG_TRANSITION_START',request);
   if(!reduced.matches&&layer.animate){api.timing.ui(function(){request.motion=layer.animate([{opacity:0},{opacity:1}],{duration:api.transitions.timing.backgroundCrossfadeMs,easing:'linear',fill:'forwards'});});try{await request.motion.finished;}catch(_){if(!current('animation-cancelled'))return;fail('animation');return;}}
   if(!current('animation-complete'))return;
   // Commit under the fully opaque incoming buffer, then release the old
   // image and buffer in this same task. No async work can restore old art.
   layer.style.opacity='1';state.committed=asset.image;state.dimensions=request.dimensions;api.resources.withResolved(function(){node.style.backgroundImage=asset.image;});frameSize(state);breadcrumb('BG_TRANSITION_COMMIT',request);state.request=null;dispose(request);breadcrumb('BG_TRANSITION_COMPLETE',request);
  }
  if(!asset.url){ready();return;}
  image.onload=ready;image.onerror=function(){fail('load');};
  // A visual observation deadline is not a resource cancellation deadline.
  // Optional delivery may settle after this warning, even on an unthrottled
  // connection. Keep the last plate and the bounded latest request alive;
  // supersession, navigation and genuine load/decode failure still release it.
  api.timing.ui(function(){request.timer=setTimeout(function(){if(!current('deadline'))return;request.timer=null;log.warn('ASSET_DECODE_TIMEOUT',{generation:request.id,assetId:asset.assetId,tier:'decorative',reason:'deadline',pending:true});},api.graphicsQuality.status().animationDeadlineMs);});api.resources.withResolved(function(){image.src=asset.url;});
 }
 function collect(){live.forEach(function(state){if(!state.node.isConnected){cancelPlate(state,'detached');if(state.geometry)state.geometry.disconnect();live.delete(state);plates.delete(state.node);}});}
 // A foreground successor can start from the already decoded committed
 // plate. Never carry an incoming buffer or its pending completion callbacks.
 function carry(from,to){var state=from&&plates.get(from);if(!state||state.committed==='none')return false;api.resources.withResolved(function(){to.style.backgroundImage=state.committed;});return true;}
 function resume(){collect();live.forEach(function(state){if(state.retry)patch(state.node,state.value);});refresh();}
 api.transitions.subscribe(function(value){
  if(value.kind==='silent'){resume();return;}
  if(value.phase!=='preparing'||value.id===majorId)return;
  majorId=value.id;lifetime++;stop();
  // Old UI remains connected while a major replacement prepares. Cancel its
  // requests now; a retained host may retry its latest intent after commit.
  live.forEach(function(state){if(state.request){cancelPlate(state,'presentation-replaced');state.target=null;state.retry=true;}});
 });
 window.MOONSHINE_BACKGROUND=Object.freeze({patch:patch,carry:carry,release:release,refresh:resume,reselect:function(node,fallbacks){var state=plates.get(node);if(state)patch(node,api.resources.reselect(state.value,false,fallbacks,'cg'));},refreshResources:function(){collect();stop();refresh();}});
})();
