/* Narrow, on-demand card reads; no deck buffer or presentation ownership. */
(function(){'use strict';var L=window.LUNAR,A=L.adapter.cards,log=L.logger.scope('LUNAR.cards');
 function entry(card,group,revealed,order){return {card:revealed?L.adapter.data.snapshot(card):null,family:group,type:card.type,
  cost:Number.isFinite(card.cost)&&!card.unplayable?card.cost:null,revealed:revealed,order:order,
  thumbnail:A.thumbnail(card,group,revealed,revealed?String((window.STG_CARD_IMAGES||{})[card.name]||'').trim():null)};}
 function catalog(){
  var admin=typeof window.stgCardsAdminUnlocked==='function'&&window.stgCardsAdminUnlocked(),seen=typeof window.stgLoadSeenCards==='function'?window.stgLoadSeenCards():{},entries=[];
  function add(card,group,popup){if(card&&card.name)entries.push(entry(popup||card,group,!!(admin||card.starter||seen[card.name]),entries.length));}
  (typeof window.stgBuildCardCatalog==='function'?window.stgBuildCardCatalog():[]).forEach(function(card){add(card,card.subtype||'Alpha');});
  var items=new Set(),worship=new Set();Object.values(window.STG_CARD_TEMPLATES||{}).forEach(function(card){if(!card||!card.name)return;
   if(card.type==='tool'&&!items.has(card.name)){items.add(card.name);add(card,'Item',Object.assign({},card,{subtype:card.subtype||'Item',toolUses:card.maxUses}));}
   else if(card.subtype==='Worship'&&!worship.has(card.name)){worship.add(card.name);add(card,'Worship',Object.assign({},card,{curseLevel:0}));}
  });
  (typeof window.stgBuildConditionCatalog==='function'?window.stgBuildConditionCatalog():[]).forEach(function(card){add(card,'Condition',Object.assign({},card,{type:'curse',cost:card.unplayable?null:card.cost}));});
  log.debug('CARD_CATALOG_READ',{total:entries.length,revealed:entries.filter(function(item){return item.revealed;}).length});return entries;
 }
 function deck(){var game=window._STG;if(!game)return [];
  var cards=Array.isArray(game.masterDeck)?game.masterDeck:[].concat(game.deck||[],game.discard||[],game.exhaust||[],game.hand||[]);
  return cards.map(function(card,index){return entry(card,A.family(card),true,index);});
 }
 function art(source,width,height){if(!source)return '';if(L.assets){source=L.assets.source(source);if(source===null)return '';}
  return L.adapter.images.variant(source,width,height,STG_DISPLAY_CONFIG.mobile.cardArtResolution);
 }
 // Reuse the native pure preview and its standard detail/armed backdrop.
 // The catalog slot is temporary; no grant, receipt or deck write occurs.
 function inspect(card){if(!card||document.querySelector('.stg-card-popup-scrim')||STG_DISPLAY_CONFIG.detectMode()!=='mobile'||L.assets.locked())return false;
  var previous=window._stgCompCatalog;window._stgCompCatalog=[L.adapter.data.snapshot(card)];
  try{L.bridge.pause.ui(function(){L.bridge.native.call('stgShowCardView',0);});}finally{window._stgCompCatalog=previous;}
  L.bridge.port.emit(['cards']);return !!document.querySelector('.stg-card-popup-scrim');
 }
 L.bridge.cards=Object.freeze({catalog:catalog,deck:deck,art:art,inspect:inspect,previewOpen:function(){return !!document.querySelector('.stg-card-popup-scrim');}});
})();
