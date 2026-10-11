(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer;
 var visualFallbacks=new Map(),approved=new Map(),cardSources=new Set(), context='cg',qualityRevision=0,resolvedDepth=0,resourceProfile='mobile',resourcePhase='BOOT';
 if(L.assets)L.assets.subscribe(function(value){if(resourceProfile!==value.profile)approved.clear();resourceProfile=value.profile;resourcePhase=value.state;});
 function qualityKey(){return L.assetQuality?L.assetQuality.status().revision:0;}
 function fallback(source){if(!visualFallbacks.size)return null;var row=visualFallbacks.get(base(source));if(!row)return null;var q=L.assetQuality&&L.assetQuality.status();return q&&row.revision===q.revision&&row.boundary===q.boundaryRevision?row.source:null;}
 function remember(source,ratio){if(approved.size>=256&&!approved.has(source))approved.delete(approved.keys().next().value);approved.set(source,{ratio:ratio,profile:resourceProfile,quality:qualityKey()});}
 function mobile(){return L.assets?resourceProfile==='mobile':STG_DISPLAY_CONFIG.detectMode()==='mobile';}
 function base(url){return String(url).replace(/\/v1\/.*$/,'').replace(/[?#].*$/,'');}
 function category(hints,url){
  // An explicit full-art consumer overrides the same source's card registration.
  if(hints && hints.cg)return 'cg';
  if(context==='intermission' || hints && hints.intermission)return 'intermission';
  if(cardSources.has(base(url)) || hints && hints.card)return 'card';
  return 'cg';
 }
 function url(source,kind){
  if(resolvedDepth)return source;
  if(resourcePhase==='SWITCHING')return '';
  var retained=fallback(source);if(retained)return retained;var target=kind||context,ratio=resolution(target),cached=approved.get(source);if(cached&&cached.ratio===ratio&&cached.profile===resourceProfile&&cached.quality===qualityKey())return source;
  if(L.assets){source=L.assets.source(source);if(source===null)return '';}
  if(!mobile() || !/^https:\/\/static\.wixstatic\.com\/media\//i.test(source))return source;
  // A sized Moonshine request is already authoritative; do not compound scaling.
  cached=approved.get(source);if(cached&&cached.ratio===ratio&&cached.profile===resourceProfile&&cached.quality===qualityKey())return source;
  return L.adapter.images.art(source,target);
 }
 function resolution(kind){var config=STG_DISPLAY_CONFIG.mobile;return kind==='card'?config.cardArtResolution:kind==='intermission'?config.intermissionArtResolution:config.cgArtResolution;}
 function css(value,el){if(resolvedDepth)return value;return typeof value==='string'?value.replace(/url\(\s*(['"]?)(https:\/\/static\.wixstatic\.com\/media\/[^)'"\s]+)\1\s*\)/g,function(_,q,source){return 'url("'+url(source,category(el,source))+'")';}):value;}

 L.adapter.images={variant:function(source,width,height,resolution){
  if(!/^https:\/\/static\.wixstatic\.com\/media\/[^/]+\.(?:png|jpe?g|webp)(?:\/|[?#]|$)/i.test(source))return source;
  if(L.assetQuality&&L.assetQuality.status().appliedProfile==='ORIGINAL')return base(source);
  var density=Math.max(1,devicePixelRatio||1)*resolution;
  var w=Math.min(1600,Math.max(24,Math.round(width*density))),h=Math.min(1600,Math.max(24,Math.round(height*density)));
  var result=base(source)+'/v1/fill/w_'+w+',h_'+h+'/file.webp';remember(result,resolution);return result;
 },art:function(source,kind,width,height){kind=kind||context;var retained=fallback(source);if(retained)return retained;var declared=mobile()&&L.assetQuality&&(kind!=='card'||L.assetQuality.status().appliedProfile==='ORIGINAL')&&L.assetQuality&&L.assetQuality.resolve(source);if(declared){remember(declared,resolution(kind));return declared;}var result=this.variant(source,width||innerWidth,height||innerHeight,resolution(kind));if(kind!=='card')result=result.replace('/v1/fill/','/v1/fit/');remember(result,resolution(kind));return result;},approve:function(source,kind){remember(source,resolution(kind||context));},url:url,css:css,registerCard:function(source){cardSources.add(base(source));}};
L.adapter.images.scan=function(source){if(resourcePhase==='SWITCHING')return '';if(L.assets){source=L.assets.source(base(source));if(source===null)return '';}return mobile()?L.adapter.images.art(base(source),'cg',innerWidth,innerWidth):source;};
L.adapter.images.reselect=function(value,next,fallbacks,role){return String(value).replace(/https:\/\/static\.wixstatic\.com\/media\/[^\s'"<>;)]+/g,function(source){var key=base(source),q=L.assetQuality,original=q&&(next?q.status().profile:q.status().appliedProfile)==='ORIGINAL',kind=role==='cg'?'cg':category(null,key);var declared=kind!=='card'&&q&&q.resolve(key,next),result=original?key:declared||L.adapter.images.art(key,kind);var held=(fallbacks||[]).slice(0,4).find(function(item){return item.target===result&&base(item.source)===key;});if(held){result=held.source;if(visualFallbacks.size>=4&&!visualFallbacks.has(key))visualFallbacks.delete(visualFallbacks.keys().next().value);visualFallbacks.set(key,{source:result,revision:qualityKey(),boundary:q.status().boundaryRevision});}else if(!next){result=fallback(source)||result;}remember(result,resolution(kind));return result;});};
L.adapter.images.plan=function(values){var urls=[];(values||[]).forEach(function(value){String(value||'').replace(/https:\/\/static\.wixstatic\.com\/media\/[^\s'"<>;)]+/g,function(source){if(!urls.includes(source))urls.push(source);return source;});});return Object.freeze(urls.map(function(source){return {source:source,target:L.adapter.images.reselect(source,true),tier:L.assets.readiness(source).tier};}).filter(function(row){return row.tier!=='decorative';}).sort(function(a,b){return (a.tier==='critical'?0:1)-(b.tier==='critical'?0:1);}).slice(0,4).map(Object.freeze));};
// Pure consumer descriptor: logical identity is independent of quality variant.
L.adapter.images.backgroundImage=function(value){var match=String(value||'').match(/url\(\s*(["']?)(.*?)\1\s*\)/i),source=match&&match[2];var selected=source?url(source,'cg'):null;return Object.freeze({assetId:source?base(source):'background.none',url:selected,image:selected?'url("'+selected+'")':'none'});};
L.adapter.images.withResolved=function(fn){resolvedDepth++;try{return fn();}finally{resolvedDepth--;}};
L.adapter.images.classify=category;L.adapter.images.base=base;L.adapter.images.withContext=function(kind,fn){var before=context;context=kind;try{return fn();}finally{context=before;}};
// Once per native sequence, only the next three distinct background URLs.
L.adapter.images.encounter=function(chunks){var urls=[],seen=new Set(),first=chunks&&chunks[0];if(first&&first.bg)seen.add(base(first.bg));
 for(var i=1;i<(chunks||[]).length&&urls.length<3;i++){var source=chunks[i]&&chunks[i].bg;if(!source||!/^https:\/\/static\.wixstatic\.com\/media\//i.test(source)||seen.has(base(source)))continue;seen.add(base(source));urls.push(L.adapter.images.art(source,'cg'));}return urls;};
})();
