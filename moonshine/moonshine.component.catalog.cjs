/* Own DOM factories and catalog; no native game/DOM access. */
(function () {
  'use strict';
  var catalog=Object.freeze({
    pill:{shape:'pill'},symbol:{font:'emoji'},number:{font:'mono'},
    button:{selector:'button',states:['disabled','selected'],shape:'pill'},
    slider:{selector:'input[type=range]',states:['disabled'],shape:'track'},
    checkbox:{selector:'input[type=checkbox]',states:['disabled','checked']},
    panel:{variants:['settings','catalog','information','save','story','confirmation','scan']},
    card:{variants:['thumbnail','detail','upgrade','hand']},
    hud:{parts:['icon','pill','number']},
    art:{variants:['cg','combat','intermission']},
    scroll:{axis:'vertical',minSize:0}
  });
  function kind(node){
    if(node.attrs['data-ms-component'])return node.attrs['data-ms-component'];
    var c=node.attrs['data-ms-class']||'',tag=node.tag;
    if(node.attrs['data-stg-hud-value'])return 'number';
    if(/top-hud-glyph|tiny-fetish-icon|story-status/.test(c))return 'symbol';
    if(/top-hud-(?:hp|data|alignment)(?:\s|$)/.test(c))return 'pill';
    if(tag==='button') return 'button';
    if(tag==='input') return node.attrs.type==='range'?'slider':node.attrs.type==='checkbox'?'checkbox':'input';
    if(/(?:stg-md-card|stg-mc-card|blessing-card|\bcard\b)/.test(c))return 'card';
    if(tag==='img'||tag==='video'||/cg-viewport|portrait-frame/.test(c))return 'art';
    if(/(?:panel|modal|shell|dialogue|flyout)/.test(c))return 'panel';
    if(/scroll|readout|details/.test(c))return 'scroll';
    if(/top-hud/.test(c))return 'hud';
    return 'display';
  }
  function variant(node){if(node.attrs['data-ms-variant'])return node.attrs['data-ms-variant'];var c=node.attrs['data-ms-class']||'';
    if(/stg-md-upgrade|blessing-card/.test(c))return 'upgrade';
    if(/stg-md-card/.test(c))return 'detail';
    if(/stg-mc-card/.test(c))return 'thumbnail';
    if(/(?:arrow|nav-symbol|top-hud-info)/.test(c))return 'icon';
    if(/\bcard\b/.test(c))return 'hand';
    if(/quit|danger/.test(c) || node.attrs['data-ig']==='quit')return 'danger';
    return 'standard';
  }
  function element(node){
    if(node.tag==='#text')return document.createTextNode(node.text);
    var el=node.svg?document.createElementNS('http://www.w3.org/2000/svg',node.tag):document.createElement(node.tag);if(node.tag==='img'){el.loading='lazy';el.decoding='async';el.addEventListener('load',function(){if(window.MOONSHINE_GEOMETRY)MOONSHINE_GEOMETRY.mark(MOONSHINE_GEOMETRY.owner(el),'image-ready');});}return el;
  }
  function patch(parent,nodes,scrollWrites,partial){
    var complete=!scrollWrites;scrollWrites=scrollWrites||[];
    if(complete)LUNAR.api.moonshine.logger.scope('MOONSHINE.runtime').debug('DOM_PATCH',{kind:'catalog',roots:nodes.length});
    var wanted=new Set(nodes.map(function(n){return n.key;}));
    nodes=nodes.filter(function(node){return !node.attrs||node.attrs['data-lunar-control-role']!=='story.skipIntro';});
    var unkeyed=partial?[]:Array.from(parent.childNodes).filter(function(el){return !el._moonshineKey;});
    var existing=new Map(Array.from(parent.childNodes).filter(function(el){return !partial||wanted.has(el._moonshineKey);}).map(function(el){return [el._moonshineKey,el];}));
    var cursor=partial?existing.values().next().value||null:parent.firstChild;
    nodes.forEach(function(node){
      var el=existing.get(node.key);
      var fresh=!el || (node.tag!=='#text' && el.localName!==node.tag);if(fresh){el=element(node);el._moonshineKey=node.key;}
      existing.delete(node.key);
      if(el!==cursor)parent.insertBefore(el,cursor);
      if(fresh&&window.MOONSHINE_GEOMETRY)MOONSHINE_GEOMETRY.mark(node.tag==='#text'?parent:el,'structure');
      cursor=el.nextSibling;
      if(node.tag==='#text'){if(el._moonshineSourceText!==node.text){if(el.nodeValue!==node.text)el.nodeValue=node.text;if(window.MOONSHINE_GEOMETRY&&(!parent.hasAttribute('data-stg-hud-value')||String(el._moonshineSourceText||'').replace('-','').length>=3||String(node.text).replace('-','').length>=3))MOONSHINE_GEOMETRY.mark(MOONSHINE_GEOMETRY.owner(el),'content');}el._moonshineSourceText=node.text;return;}
      var attrs=Object.assign({},node.attrs,{'data-ms-key':node.key,'data-ms-component':kind(node),'data-ms-variant':variant(node)});
      // Modal semantics belong to our presentation, even when the source omitted them.
      if(/^(?:stg-confirm-modal|stg-prompt-modal|stg-slot-picker|stg-fs-prompt|stg-consent-overlay|stg-compendium|stg-credits|stg-dev-menu)$/.test(attrs['data-ms-id']||'')||/(?:^|\s)lab-overlay(?:\s|$)/.test(attrs['data-ms-class']||'')){
        attrs.role='dialog';attrs['aria-modal']='true';
      }
      attrs.class='MOONSHINE-'+kind(node);
      // HUD abbreviations and glyphs (including i and HP) are UI notation,
      // not prose. Exclude only this owned bar; dialogue/menu text still translates.
      if(kind(node)==='symbol'||kind(node)==='number'||/(?:^|\s)stg-mobile-top-hud(?:\s|$)/.test(attrs['data-ms-class']||''))attrs.translate='no';
      var prior=el._moonshineSourceAttrs||{};
      Object.keys(attrs).forEach(function(name){if(prior[name]!==attrs[name]){if(name==='style'&&attrs['data-ms-in-scene-background']!=null&&window.MOONSHINE_BACKGROUND){/* Background attributes are applied once below, including its semantic target. */}else el.setAttribute(name,name==='style'?LUNAR.api.moonshine.fonts.styles(attrs[name]):name==='font-family'?LUNAR.api.moonshine.fonts.stack(attrs[name]):attrs[name]);if(name==='style'&&attrs['data-ms-in-scene-background']==null&&attrs['data-ms-dynamic-background']==null&&window.MOONSHINE_GEOMETRY&&!el.matches('[data-ms-id^="stg-player-"],[data-ms-id^="stg-enemy-"]')&&/(?:font|height|width|padding|zoom)\s*[-\w]*\s*:/.test(attrs[name]))MOONSHINE_GEOMETRY.mark(el,'source-style');}});
      Object.keys(prior).forEach(function(name){if(!(name in attrs)&&!(name==='style'&&attrs['data-ms-in-scene-background']!=null))el.removeAttribute(name);});
      if(attrs['data-ms-in-scene-background']!=null&&window.MOONSHINE_BACKGROUND&&(fresh||prior.style!==attrs.style||prior['data-ms-background-frame']!==attrs['data-ms-background-frame']))MOONSHINE_BACKGROUND.patch(el,LUNAR.api.moonshine.fonts.styles(attrs.style||''),attrs['data-ms-background-frame']?JSON.parse(attrs['data-ms-background-frame']):null);
      el._moonshineSourceAttrs=attrs;
      if(node.attrs['data-ms-map-slot']!=null||node.attrs['data-ms-graphics-slot']!=null){/* Direct owned map is independent of compatibility children. */}
      else if(attrs['data-ms-in-scene-background']!=null){/* Background owns its two buffers, never compatibility children. */}
      else if(node.cardThumbnail)MOONSHINE_CARD_THUMBNAIL.update(el,node.cardThumbnail);
      else {var childSource=JSON.stringify(node.children);
      if(el._moonshineChildrenSource!==childSource){patch(el,node.children,scrollWrites);el._moonshineChildrenSource=childSource;}}
      if('value' in node && document.activeElement!==el)el.value=node.value;
      if('checked' in node)el.checked=node.checked;
      if(node.animations||el._moonshineAnimations){var active=new Set();if(!el._moonshineAnimations)el._moonshineAnimations=new Map();(node.animations||[]).forEach(function(a){active.add(a.key);var own=el._moonshineAnimations.get(a.key);if(!own){own=el.animate(a.frames,a.timing);el._moonshineAnimations.set(a.key,own);if(typeof a.time==='number')own.currentTime=a.time;}if(a.state==='paused')own.pause();else if(a.state==='running'&&own.playState==='paused')own.play();});el._moonshineAnimations.forEach(function(a,key){if(!active.has(key)){a.cancel();el._moonshineAnimations.delete(key);}});}
      if(node.media){el.muted=true;if(Math.abs(el.currentTime-node.media.time)>.2)try{el.currentTime=node.media.time;}catch(_){}if(node.media.paused){if(!el.paused)el.pause();}else if(el.paused)el.play().catch(function(){});}
      ['scrollTop','scrollLeft'].forEach(function(name){if(name in node&&el['_moonshineSource'+name]!==node[name]){el['_moonshineSource'+name]=node[name];scrollWrites.push(function(){el[name]=node[name];});}});
    });
    existing.forEach(function(el){if(window.MOONSHINE_BACKGROUND)MOONSHINE_BACKGROUND.release(el);el.remove();});unkeyed.forEach(function(el){if(window.MOONSHINE_BACKGROUND)MOONSHINE_BACKGROUND.release(el);el.remove();});
    if(complete)scrollWrites.forEach(function(write){write();});
  }
  function fit(root){
    var scopes=Array.isArray(root)?root:[root];
    function all(selector){var found=new Set();scopes.forEach(function(scope){if(!scope||!scope.isConnected)return;if(scope.matches&&scope.matches(selector))found.add(scope);scope.querySelectorAll(selector).forEach(function(el){found.add(el);});});return Array.from(found);}
    // Group ancestor corrections first; measure the corrected boxes together,
    // then apply the resulting styles. Never read a box after its fit write.
    var ancestors=new Set(),corrections=[];
    all('[data-ms-class~="stg-mobile-top-hud"]').forEach(function(bar){for(var p=bar.parentElement;p&&p.id!=='MOONSHINE-root';p=p.parentElement)ancestors.add(p);});
    ancestors.forEach(function(el){var s=getComputedStyle(el),transform=s.transform!=='none',hint=/transform/.test(s.willChange);if(transform||hint)corrections.push(function(){if(transform)el.style.setProperty('transform','none','important');if(hint)el.style.setProperty('will-change','auto','important');});});
    corrections.forEach(function(write){write();});
    var writes=[],boxes=new WeakMap(),viewport=LUNAR.api.moonshine.viewport();
    function box(el){var b=boxes.get(el);if(!b){var r=el.getBoundingClientRect();b={width:r.width,height:r.height,offsetWidth:el.offsetWidth,clientWidth:el.clientWidth};boxes.set(el,b);}return b;}
    if(viewport)all('[data-ms-id="stg-mobile-cg-viewer"],[data-ms-id="stg-atk-overlay"],[data-ms-id="stg-mobile-ingame-options"],[data-ms-id="stg-slot-picker"],[data-ms-id="stg-compendium"],[data-ms-id="stg-confirm-modal"],[data-ms-id="stg-fs-prompt"],[data-ms-id="stg-consent-overlay"],[data-ms-class~="lab-overlay"]').forEach(function(el){
      var r=box(el),scale=r.offsetWidth?r.width/r.offsetWidth:1;if(!r.width)return;
      if(Math.abs(r.width-viewport.width)>.5)writes.push(function(){el.style.setProperty('width',(viewport.width/scale)+'px','important');});
      if(Math.abs(r.height-viewport.height)>.5)writes.push(function(){el.style.setProperty('height',(viewport.height/scale)+'px','important');el.style.setProperty('max-height',(viewport.height/scale)+'px','important');});
    });
    all('[data-stg-hud-value="hp"],[data-stg-hud-value="data"],[data-ms-class~="arc-dlg-opt"]').forEach(function(el){
      var hud=el.hasAttribute('data-stg-hud-value');if(hud&&el.textContent.length<3)return;var b=box(el);if(!b.clientWidth||!b.width)return;
      var s=getComputedStyle(el),range=document.createRange();range.selectNodeContents(el);var zoom=b.width/b.offsetWidth||1,width=range.getBoundingClientRect().width/zoom;
      var available=hud?b.clientWidth*.76:b.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-2;
      if(width>available&&available>0){var size=parseFloat(s.fontSize)*available/width*.98;writes.push(function(){el.style.setProperty('font-size',size+'px','important');});}
    });
    writes.forEach(function(write){write();});
  }
  window.MOONSHINE_COMPONENTS={catalog:catalog,patch:patch,fit:fit,
    // Caller has proved an unchanged canonical prefix. Append only the new
    // blocks; existing translator/prose wrappers are not reconciliation input.
    append:function(parent,added,children){var writes=[];LUNAR.api.moonshine.logger.scope('MOONSHINE.runtime').debug('DOM_PATCH',{kind:'append',roots:added.length});patch(parent,added,writes,true);parent._moonshineChildrenSource=JSON.stringify(children);writes.forEach(function(write){write();});},
    patchTarget:function(el,node){LUNAR.api.moonshine.logger.scope('MOONSHINE.runtime').debug('DOM_PATCH',{kind:'partial',key:node.key});var writes=[];patch(el.parentNode,[node],writes,true);writes.forEach(function(write){write();});},
    create:function(type,options){
      options=options||{};var el=document.createElement(type==='slider'?'input':type==='button'?'button':'div');
      el.className='MOONSHINE-'+type;el.dataset.msComponent=type;el.dataset.msPure='true';el.dataset.msVariant=options.variant||'standard';if(type==='slider')el.type='range';if(type==='button')el.type='button';
      if(options.action)el.dataset.msActionKey=options.action;
      if(options.label!=null)el.textContent=options.label;
      if(options.content)el.append(...options.content);
      if(type==='slider'){el.min=options.min==null?0:options.min;el.max=options.max==null?100:options.max;el.value=options.value==null?0:options.value;}
      if(options.disabled)el.disabled=true;
      if(options.selected)el.dataset.msSelected='true';
      Object.entries(options.theme||{}).forEach(function(pair){el.style.setProperty('--ms-'+pair[0],pair[1]);});
      return el;
    }
  };
})();
