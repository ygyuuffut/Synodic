/* Body-mounted report/notice admission, frozen run DTO and validated native callbacks. */
(function(){'use strict';var L=window.LUNAR,cache=new WeakMap(),records=new Map(),sequence=0,log=L.logger.scope('LUNAR.runreport');
 function source(){return document.getElementById('stg-tease')||document.getElementById('stg-run-stats');}
 function owns(node){return !!(node&&node.nodeType===1&&(node.matches('#stg-run-stats,#stg-tease')||node.closest('#stg-run-stats,#stg-tease')));}
 function background(root){if(root.id==='stg-tease'){var list=Array.from(root.querySelectorAll('.stg-tease-bg')),active=list.filter(function(n){return n.style.opacity==='1';}).pop()||list[0];return {image:active&&active.style.backgroundImage||'none',color:'#08040c'};}
  var story=L.bridge.chrome.story();if(story.background)return story.background;
  return L.bridge.chrome.reportBackground()||{image:root.querySelector('.stg-rs-bg').style.backgroundImage,color:'#08040c'};
 }
 function read(){var root=source();records.forEach(function(value,key){if(!value.root.isConnected)records.delete(key);});if(!root)return null;if(STG_DISPLAY_CONFIG.detectMode()==='mobile')L.bridge.native.suppress(root);
  if(cache.has(root)){var old=cache.get(root);return old.dto.kind==='notice'?Object.assign({},old.dto,{background:background(root)}):old.dto;}
  var id='run-report-'+(++sequence),kind=root.id==='stg-tease'?'notice':'report',button=root.querySelector(kind==='notice'?'.stg-tease-menu':'.stg-rs-actions button:last-child'),config=document.getElementById('LUNAR-diagnostic-config'),version=config?JSON.parse(config.textContent).build:'unknown',dto;
  if(kind==='notice'){dto={id:id,kind:kind,title:root.querySelector('.stg-tease-title').textContent,html:String(root.querySelector('.stg-tease-body').innerHTML),background:background(root),version:version};}
  else{var G=window._STG||{},refs=(window._stgRsDeckRef||[]).slice(),profile=typeof stgAlignProfile==='function'?stgAlignProfile(G):{},sig=typeof stgAlignSignature==='function'?stgAlignSignature(profile):{hex:'#888894'},title=root.querySelector('.stg-rs-title');
   dto={id:id,kind:kind,title:title.textContent.toUpperCase(),titleColor:getComputedStyle(title).color,version:version,axes:L.adapter.runReport.axes(profile,window.STG_ALIGN_LABELS||{},window.STG_ALIGN_COLORS||{}),alignmentColor:sig.hex,dominant:sig.dominant,statistics:Array.from(root.querySelectorAll('.stg-rs-row')).map(function(row){return {label:row.querySelector('.stg-rs-k').textContent,value:row.querySelector('.stg-rs-v').textContent};}),score:root.querySelector('.stg-rs-logic-score')?Array.from(root.querySelector('.stg-rs-logic-score').children).map(function(n){return n.textContent.trim();}).filter(Boolean).join('\n'):null,deckTotal:(G.masterDeck||[]).length,deck:L.adapter.runReport.deck(refs,G.masterDeck||[]),upgrades:(G.ownedBoons||[]).map(function(key,i){var b=(window.STG_BOONS||[]).concat(window.STG_STOMACH_BOONS||[]).find(function(b){return b.id===key;});return {id:key,key:'upgrade-'+i,title:b?b.title:key,description:b?String(b.desc||''):'Description unavailable.',flavor:b?String(b.flavor||(window.STG_CARD_FLAVOR||{})[b.title]||''):'',icon:b&&b.icon||'📀'};}),background:background(root)};
  }
  var record={root:root,button:button,dto:dto,refs:kind==='report'?refs:[],scope:L.buffer.getScope(),game:window._STG,used:false};cache.set(root,record);records.set(id,record);log.info(kind==='report'?'RUN_REPORT_AVAILABLE':'END_NOTICE_AVAILABLE',{id:id,kind:kind});return dto;
 }
 function valid(id){var r=records.get(id);return r&&r.root===source()&&r.root.isConnected&&(r.dto.kind==='notice'||r.scope===L.buffer.getScope()&&r.game===window._STG)?r:null;}
 function proceed(id){var r=valid(id);if(!r||r.used||!r.button||!r.button.isConnected||r.button.disabled)return false;r.used=true;log.info('COMMAND_SENT',{id:id,action:r.dto.kind==='report'?'continue-story':'return-menu'});try{L.bridge.pause.game(function(){r.button.click();});L.bridge.port.emit(['runReport','presentation']);log.info('COMMAND_RESULT',{id:id,accepted:true});return true;}catch(error){log.error('COMMAND_RESULT',error,{id:id});throw error;}}
 function inspect(id,key){var r=valid(id);if(!r||r.used||r.dto.kind!=='report')return false;var item=r.dto.deck.find(function(item){return item.id===key;}),card=item&&r.refs.find(function(c){return c&&c.name===item.name;});return card?L.bridge.cards.inspect(card):false;}
 // The native teaser parks its hidden passage on Menu after mounting. That
 // is underlay cleanup, not dismissal of the retained ending presentation.
 function retainsUnderlay(to){var root=source();return to==='Menu'&&!!window._stgTeaseParked&&!!root&&root.id==='stg-tease'&&root.isConnected;}
 L.bridge.runReport=Object.freeze({read:read,valid:function(id){return !!valid(id);},owns:owns,active:function(){return !!source();},retainsUnderlay:retainsUnderlay,proceed:proceed,inspect:inspect});
})();
