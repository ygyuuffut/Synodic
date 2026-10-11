/* Private presentation workspace. Every node below belongs to MOONSHINE.
   The shadow boundary prevents native selectors from finding these objects. */
(function () {
  'use strict';
  var api=LUNAR.api.moonshine, platform=window, browserDocument=document;
  var host=document.createElement('div');host.id='MOONSHINE-workspace';host.setAttribute('data-MOONSHINE-owned','');
  host.style.cssText='position:fixed;inset:0;width:100vw;height:100dvh;opacity:0;pointer-events:none;z-index:-2147483647;overflow:hidden;';
  document.body.appendChild(host);
  var shadow=host.attachShadow({mode:'closed'}),html=document.createElement('div'),body=document.createElement('div'),head=document.createElement('div'),style=document.createElement('style');
  html.id='MOONSHINE-workspace-html';body.id='MOONSHINE-workspace-body';head.id='MOONSHINE-font-resources';head.setAttribute('data-MOONSHINE-owned','');document.head.appendChild(head);shadow.append(style,html);html.append(body);
  var bases=new Map(), sourceKeys=new Map(), previousKeys=new Set(), keys=new WeakMap(), nodes=new Map(), next=0, syncing=false, last='',styleSignature='',previousBodyClasses=[],previousHtmlStyle={},sourceRoots='',resourcesRevision=-1,incomingSnapshot=null;
  var callbacks=new Map(), local={}, scratch=new Map(), subscriptions=new Map();
  function decode(value){
    if(!value||typeof value!=='object')return value;
    if(value.LUNARcall){var id=value.LUNARcall;if(!value.transient&&callbacks.has(id))return Object.assign(callbacks.get(id),value.flags||{});var call=function(){syncScratch();var result=api.port.invoke(id,Array.from(arguments));if(!value.query)sync();return decode(result);};if(value.transient)return Object.assign(call,value.flags||{});callbacks.set(id,call);return Object.assign(call,value.flags||{});}
    if(value.LUNARnode)return getId(value.LUNARnode);
    return Array.isArray(value)?value.map(decode):Object.fromEntries(Object.entries(value).map(function(p){return [p[0],decode(p[1])];}));
  }
  function syncScratch(){scratch.forEach(function(v,k){api.port.write(k,v);});}
  function key(node){if(!keys.has(node))keys.set(node,'MOONSHINE-node-'+(++next));var id=keys.get(node);nodes.set(id,node);return id;}
  // Only the dispatch index owns strong references. Weak identity survives a
  // detach/reinsert; active/translated DOM is never removed by this census.
  function collect(){nodes.forEach(function(node,id){if(!node.isConnected)nodes.delete(id);});}
  function getId(id){return id==='MOONSHINE-workspace-html'?html:id==='MOONSHINE-workspace-body'?body:shadow.querySelector('#'+CSS.escape(id))||head.querySelector('#'+CSS.escape(id));}
  function attrs(data){var out=Object.assign({},data);if(out['data-ms-id'])out.id=out['data-ms-id'];if(out['data-ms-class'])out.class=out['data-ms-class'];if(out['data-ms-for'])out.for=out['data-ms-for'];['aria-labelledby','aria-describedby','aria-controls'].forEach(function(k){if(out[k])out[k]=out[k].replace(/MOONSHINE-/g,'');});delete out['data-ms-id'];delete out['data-ms-class'];delete out['data-ms-for'];return out;}
  function update(node,parent,seen,scrollWrites){
    seen.add(node.key);var el=sourceKeys.get(node.key),old=bases.get(node.key),fresh=!el;
    if(!el){el=node.tag==='#text'?document.createTextNode(node.text):node.svg?document.createElementNS('http://www.w3.org/2000/svg',node.tag):document.createElement(node.tag);sourceKeys.set(node.key,el);parent.appendChild(el);}
    if(node.tag==='#text'){if(!old||old.text!==node.text)el.nodeValue=node.text;bases.set(node.key,node);return el;}
    el._lunarActionKey=node.key.replace(/-context$/,'');
    var current=attrs(node.attrs),before=old?attrs(old.attrs):{};
    Object.keys(before).forEach(function(k){if(k in current)return;if(k==='class'){(before.class||'').split(/\s+/).filter(Boolean).forEach(function(c){el.classList.remove(c);});}else if(k==='style'){var prior=document.createElement('div').style;prior.cssText=before.style;for(var i=0;i<prior.length;i++){var name=prior[i];if(el.style.getPropertyValue(name)===prior.getPropertyValue(name))el.style.removeProperty(name);}}else el.removeAttribute(k);});
    Object.entries(current).forEach(function(p){if(before[p[0]]===p[1])return;
      if(p[0]==='class'){var incoming=p[1].split(/\s+/).filter(Boolean);(before.class||'').split(/\s+/).filter(Boolean).forEach(function(c){if(!incoming.includes(c))el.classList.remove(c);});el.classList.add(...incoming);}
      else if(p[0]==='style'){var raw=document.createElement('div').style,prior=document.createElement('div').style;raw.cssText=p[1];prior.cssText=before.style||'';for(var i=0;i<prior.length;i++){var k=prior[i];if(!raw.getPropertyValue(k))el.style.removeProperty(k);}for(var j=0;j<raw.length;j++){var k=raw[j];if(prior.getPropertyValue(k)!==raw.getPropertyValue(k)||prior.getPropertyPriority(k)!==raw.getPropertyPriority(k))el.style.setProperty(k,raw.getPropertyValue(k),raw.getPropertyPriority(k));}}
      else el.setAttribute(p[0],p[1]);});
    if('value' in node&&(!old||old.value!==node.value))el.value=node.value;
    if('checked' in node&&(!old||old.checked!==node.checked))el.checked=node.checked;
    if(node.properties&&node.properties.typingSkip)el._twSkipFn=decode({LUNARcall:node.properties.typingSkip,transient:true});else delete el._twSkipFn;
    if(node.animations)MOONSHINE_ANIMATION.apply(el,node.animations);
    node.children.forEach(function(child){update(child,el,seen,scrollWrites);});
    if('scrollTop'in node&&(!old||old.scrollTop!==node.scrollTop))scrollWrites.push(function(){el.scrollTop=node.scrollTop;});
    if('scrollLeft'in node&&(!old||old.scrollLeft!==node.scrollLeft))scrollWrites.push(function(){el.scrollLeft=node.scrollLeft;});
    if(node.media){el.muted=true;if(Math.abs(el.currentTime-node.media.time)>.2)try{el.currentTime=node.media.time;}catch(_){}}
    bases.set(node.key,node);return el;
  }
  function resources(){
    var revision=api.stylesRevision();if(revision===resourcesRevision)return;resourcesRevision=revision;
    var data=api.styles(),signature=JSON.stringify(data);if(signature===styleSignature)return;styleSignature=signature;
    function rules(list){return list.map(function(rule){if(rule.type===1)return rule.selectorText.replace(/MOONSHINE-source-/g,'').replace(/\.MOONSHINE-document-body/g,'body').replace(/\.MOONSHINE-document-html/g,'html').replace(/:root/g,'#MOONSHINE-workspace-html').replace(/(^|[\s>+~,])html(?=[.#:[\s>+~,]|$)/g,'$1#MOONSHINE-workspace-html').replace(/(^|[\s>+~,])body(?=[.#:[\s>+~,]|$)/g,'$1#MOONSHINE-workspace-body')+'{'+rule.style+'}';if(rule.type===4||rule.type===12)return rule.cssText.slice(0,rule.cssText.indexOf('{')+1)+rules(rule.cssRules)+'}';return rule.type===5||rule.type===7?rule.cssText:'';}).join('\n');}
    style.textContent=data.map(rules).join('\n')+'\n#MOONSHINE-workspace-html{height:100%;}#MOONSHINE-workspace-body{margin:0;min-height:100%;}';
  }
  function viewport(){
    var h=platform.visualViewport?platform.visualViewport.height:platform.innerHeight,w=platform.innerWidth,p=api.profile().a35;
    var short=Math.min(w,h),long=Math.max(w,h),screenShort=Math.min(platform.screen.width||short,platform.screen.height||long),screenLong=Math.max(platform.screen.width||short,platform.screen.height||long),mobile=api.mode()==='mobile';
    body.classList.toggle('stg-mobile-ui',mobile);body.classList.toggle('stg-mobile-portrait',mobile&&w<=platform.innerHeight);body.classList.toggle('stg-mobile-landscape',mobile&&w>platform.innerHeight);
    body.classList.toggle('stg-a35-profile',mobile&&short>=p.minShort&&short<=p.maxShort&&Math.max(long/short,screenLong/screenShort)>=p.minTallRatio);
    if(mobile)html.style.setProperty('--stg-mobile-vh',h+'px');
  }
  function sync(){
    if(syncing)return;syncing=true;
    try{
      var incoming=api.sources();resources();if(incoming===incomingSnapshot){viewport();return;}incomingSnapshot=incoming;var signature=JSON.stringify(incoming);
      if(signature!==last){api.logger.scope('MOONSHINE.workspace').debug('DOM_PATCH',{roots:incoming.views.length});last=signature;queueMicrotask(function(){body.dispatchEvent(new Event('MOONSHINE-data-change'));});
        var classes=(incoming.body.class||'').split(/\s+/).filter(Boolean);
        previousBodyClasses.forEach(function(c){if(!classes.includes(c))body.classList.remove(c);});body.classList.add(...classes);previousBodyClasses=classes;
        Object.entries(incoming.body).forEach(function(p){if(p[0]!=='class')body.setAttribute(p[0],p[1]);});
        var nativeStyle=document.createElement('div').style;nativeStyle.cssText=incoming.html.style||'';var nextStyle={};for(var j=0;j<nativeStyle.length;j++){var property=nativeStyle[j],value=nativeStyle.getPropertyValue(property);nextStyle[property]=value;if(previousHtmlStyle[property]!==value)html.style.setProperty(property,value,nativeStyle.getPropertyPriority(property));}Object.keys(previousHtmlStyle).forEach(function(property){if(!(property in nextStyle))html.style.removeProperty(property);});previousHtmlStyle=nextStyle;
        var seen=new Set(),scrollWrites=[];incoming.views.forEach(function(v){update(v.tree,body,seen,scrollWrites);});
        previousKeys.forEach(function(k){if(!seen.has(k)){var el=sourceKeys.get(k);if(el)el.remove();sourceKeys.delete(k);bases.delete(k);}});previousKeys=seen;scrollWrites.forEach(function(write){write();});var roots=[];function structural(node){if(node.tag!=='#text'){var id=node.attrs['data-ms-id']||'';if(/(?:-root$|^stg-root$)/.test(id))roots.push(node.key);node.children.forEach(structural);}}incoming.views.forEach(function(v){roots.push(v.key);structural(v.tree);});var rootSignature=roots.join('|');if(rootSignature!==sourceRoots){sourceRoots=rootSignature;queueMicrotask(function(){platform.dispatchEvent(new Event('MOONSHINE-sources-change'));});}
      }
      viewport();host.style.zoom=String(1/(parseFloat(browserDocument.documentElement.style.zoom)||1));
    }finally{collect();syncing=false;}
  }
  // Forward only unhandled source actions. New buttons have their own listeners.
  ['click','submit','input','change','keydown','pointerdown','pointermove','pointerup','mousedown','mouseup'].forEach(function(type){body.addEventListener(type,function(e){var el=e.target.closest('[data-MOONSHINE-native-control]')||e.target;while(el&&!el._lunarActionKey)el=el.parentElement;if(!el||el===body)return;if(type==='pointermove'&&!e.buttons)return;var data={x:e.clientX,y:e.clientY,clientX:e.clientX,clientY:e.clientY,key:e.key,shift:e.shiftKey,ctrl:e.ctrlKey,alt:e.altKey,meta:e.metaKey,pointerId:e.pointerId,pointerType:e.pointerType,buttons:e.buttons,button:e.button,value:e.target.value,checked:e.target.checked};if(e.target.type==='file')data.files=e.target.files;var accepted=api.dispatch(el._lunarActionKey,type,data);if(accepted===false)e.preventDefault();sync();});});
  var ownDocument={body:body,documentElement:html,head:head,fonts:browserDocument.fonts,readyState:'complete',getElementById:getId,querySelector:function(s){if(s==='html')return html;if(s==='body')return body;return shadow.querySelector(s)||head.querySelector(s);},querySelectorAll:function(s){return shadow.querySelectorAll(s);},createElement:browserDocument.createElement.bind(browserDocument),createElementNS:browserDocument.createElementNS.bind(browserDocument),createComment:browserDocument.createComment.bind(browserDocument),createTextNode:browserDocument.createTextNode.bind(browserDocument),createRange:browserDocument.createRange.bind(browserDocument),addEventListener:function(type,fn,options){if(type==='DOMContentLoaded'){queueMicrotask(fn);return;}body.addEventListener(type,fn,options);},removeEventListener:body.removeEventListener.bind(body),getAnimations:function(){return html.getAnimations({subtree:true});},exitFullscreen:browserDocument.exitFullscreen.bind(browserDocument)};
  Object.defineProperties(ownDocument,{activeElement:{get:function(){return shadow.activeElement;}},fullscreenElement:{get:function(){return !!browserDocument.fullscreenElement;}}});
  var ownWindow=new Proxy(local,{get:function(_,name){
    if(name==='STG_DISPLAY_CONFIG')return config;
    if(name==='STG_MOBILE_PAUSE')return api.timing;
    if(name==='jQuery')return function(){return {on:function(events,fn){events.split(/\s+/).forEach(function(e){body.addEventListener(e.split('.')[0],fn);});}};};
    if(name in local)return local[name];
    if(scratch.has(name))return scratch.get(name);
    if(/^(?:stg[A-Z]|_stg|_STG|STG_)/.test(String(name)))return decode(api.port.read(name));
    if(name==='localStorage')return api.storage;
    if(name==='alert')return api.nativeAlert;
    if(name==='addEventListener')return function(type,fn,options){if(/^(click|keydown|pointer|mouse|touch|input|change|scroll|submit)/.test(type))body.addEventListener(type,fn,options);else platform.addEventListener(type,fn,options);};
    if(name==='removeEventListener')return function(type,fn,options){body.removeEventListener(type,fn,options);platform.removeEventListener(type,fn,options);};
    if(['setTimeout','setInterval','requestAnimationFrame'].includes(name))return function(){var args=arguments;return api.timing.ui(function(){return platform[name].apply(platform,args);});};
    if(['getComputedStyle','matchMedia','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame','confirm'].includes(name))return platform[name].bind(platform);
    if(['innerWidth','innerHeight','visualViewport','devicePixelRatio','screen','navigator','location'].includes(name))return platform[name];
    return undefined;
  },set:function(_,name,value){
    if(/^stg[A-Z]/.test(name)){api.port.route(name,function(args){return value.apply(ownWindow,decode(args));},Object.assign({},value));return true;}
    if(name==='_stgCompCatalog'||name==='_stgCompState'){scratch.set(name,value);return true;}
    if(/^_stg|^_STG/.test(name)){api.port.write(name,value);return true;}
    local[name]=value;return true;
  }});
  var config={mode:api.mode(),mobile:api.profile(),detectMode:api.mode,wixCardVariantUrl:api.resources.variant,wixCardImageUrl:function(s,w,h){return api.resources.variant(s,w,h,this.mobile.cardArtResolution);},wixCardDetailImageUrl:function(s,w,h){return api.resources.variant(s,w,h,this.mobile.cardDetailArtResolution);},wixArtImageUrl:api.resources.art};
  function snapshot(node){
    if(node.nodeType===3)return {tag:'#text',key:key(node),text:node.nodeValue};
    if(node.nodeType!==1||/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(node.tagName))return null;
    // Superseded chrome sources are data/callback origins only. They never
    // enter the player-facing scene tree; persistent chrome bypasses transit.
    if(node.matches('.arc-dialogue,#enc-text-panel,#ev-content,.stg-mobile-top-hud'))return null;
    if(node.matches('.game-over-box,#stg-rest-root .rest-content,#stg-rest-root .blessing-header,#stg-ov-next-btn'))return null;
    if(node.closest('#stg-root.stg-fullbg')&&node.matches('.header,.portrait-frame-wrap,.stg-combat-footer'))return null;
    var a={};if(node._lunarActionKey)a['data-lunar-source-key']=node._lunarActionKey;Array.from(node.attributes).forEach(function(p){if(/^on/i.test(p.name))return;if(p.name==='id')a['data-ms-id']=p.value;else if(p.name==='class')a['data-ms-class']=p.value;else if(p.name==='for')a.for='MOONSHINE-'+p.value;else a[p.name]=p.value;});
    if(a['data-ms-id'])a.id='MOONSHINE-'+a['data-ms-id'];['aria-labelledby','aria-describedby','aria-controls'].forEach(function(k){if(a[k])a[k]=a[k].split(/\s+/).map(function(x){return 'MOONSHINE-'+x;}).join(' ');});
    var n={tag:node.localName,key:key(node),attrs:a,svg:node.namespaceURI==='http://www.w3.org/2000/svg',children:Array.from(node.childNodes).map(snapshot).filter(Boolean)};
    // Card face DOM is created only in the visible tree by its component.
    // A legacy catalog/deck shell carries a plain DTO across this boundary.
    if(node._moonshineThumbnail){n.cardThumbnail=node._moonshineThumbnail;n.children=[];}
    var animations=MOONSHINE_ANIMATION.snapshot(node);if(animations.length)n.animations=animations;
    if(node.matches('input,select,textarea')){n.value=node.value;n.checked=node.checked;}
    if(node.scrollTop||node.scrollLeft||/scroll|readout|\bhand\b/.test(a['data-ms-class']||'')){n.scrollTop=node.scrollTop;n.scrollLeft=node.scrollLeft;}
    return n;
  }
  function partial(change){
    var fragments=api.updates.partial(change.targets||[]),writes=[];
    fragments.forEach(function(fragment){var el=sourceKeys.get(fragment.key);if(!el||!el.parentNode)return;var seen=new Set(),old=bases.get(fragment.key);update(fragment.tree,el.parentNode,seen,writes);function prune(node){if(!node)return;if(!seen.has(node.key)){var gone=sourceKeys.get(node.key);if(gone&&gone.isConnected)gone.remove();sourceKeys.delete(node.key);bases.delete(node.key);}if(node.children)node.children.forEach(prune);}prune(old);});
    writes.forEach(function(write){write();});
    // Instant sensory text has no typewriter/layout lifecycle to rebuild.
    // Its owned fragment is already patched above; don't run every legacy
    // template hook (which writes zoom and invalidates the whole viewport).
    var sensoryOnly=fragments.length&&fragments.every(function(fragment){return fragment.tree.attrs&&fragment.tree.attrs['data-ms-id']==='body-sense-host';});
    if(!sensoryOnly&&(change.domains||[]).some(function(d){return d==='story'||d==='dialogue';}))body.dispatchEvent(new Event('MOONSHINE-data-change'));
  }
  function fragments(targets){var value=(targets||[]).map(function(t){var el=sourceKeys.get(t.key),node=el&&el.isConnected?snapshot(el):null;return node?{source:t,node:node}:null;}).filter(Boolean);collect();return value;}
  function data(){sync();var value=Array.from(body.childNodes).map(snapshot).filter(Boolean);collect();return value;}
  function dispatch(id,type,value){var el=nodes.get(id);if(!el||!el.isConnected||el.disabled||el.closest('[inert]'))return false;if('value'in value&&'value'in el)el.value=value.value;if('checked'in value&&'checked'in el)el.checked=value.checked;if(value.files&&el.type==='file')el.files=value.files;if(type==='scroll'){el.scrollTop=value.top;el.scrollLeft=value.left;return true;}var options=Object.assign({bubbles:true,cancelable:true,composed:false},value),event=type==='keydown'?new KeyboardEvent(type,Object.assign(options,{shiftKey:value.shift,ctrlKey:value.ctrl,altKey:value.alt,metaKey:value.meta})):type==='click'||/^mouse/.test(type)?new MouseEvent(type,Object.assign(options,{ctrlKey:value.ctrl})): /^pointer/.test(type)?new PointerEvent(type,options):new Event(type,options);return el.dispatchEvent(event);}
  api.subscribe(function(change){if(change.domains.some(function(d){return /^(scene|compatibility|sources|game)$/.test(d);}))sync();else if(change.targets.length)partial(change);});
  platform.addEventListener('LUNAR-navigation',function(e){sync();var event=new Event(':'+e.detail.type);event.content=body.querySelector('.passage');body.dispatchEvent(event);});
  window.MOONSHINE_WORKSPACE={rootKey:key(body),window:ownWindow,document:ownDocument,sync:sync,data:data,partial:partial,fragments:fragments,snapshot:snapshot,dispatch:dispatch,body:body,html:html};
  sync();
})();
