/* Reusable action rows, icon/price cards and rich-text preview; presentation only. */
(function(){'use strict';var C=window.MOONSHINE_COMPONENTS;
 function element(tag,name,text){var el=document.createElement(tag);el.className='MOONSHINE-'+name;el.dataset.msComponent=tag==='article'?'card':tag==='section'?'panel':/grid|prose|description/.test(name)?'scroll':/symbol/.test(name)?'symbol':'display';if(text!=null)el.textContent=text;return el;}
 function rich(el,html){el.setAttribute('translate','yes');el.innerHTML=html||'';el.querySelectorAll('script,style,iframe,object').forEach(function(n){n.remove();});el.querySelectorAll('*').forEach(function(n){Array.from(n.attributes).forEach(function(a){if(/^on/i.test(a.name)||a.name==='id'||a.name==='href'&&/^javascript:/i.test(a.value))n.removeAttribute(a.name);if(a.name==='style')n.setAttribute('style',LUNAR.api.moonshine.fonts.styles(a.value));if(a.name==='class'){n.dataset.msRichClass=a.value;n.removeAttribute('class');}});});return el;}
 function symbol(text,name){var cell=element('span','actions-symbol'),glyph=element('span','actions-glyph',text+'\uFE0E');cell.append(glyph);cell.dataset.glyph=text;cell.setAttribute('aria-hidden','true');cell.setAttribute('translate','no');if(name)cell.title=name;return cell;}
 var symbolContext=null,symbolFontRevision=0;
 LUNAR.api.moonshine.fonts.subscribe(function(value){if(['emoji','symbol'].includes(value.role))symbolFontRevision++;});
 function fitSymbols(root){
  if(!symbolContext)symbolContext=document.createElement('canvas').getContext('2d');var context=symbolContext,changed=[],writes=[];
  // Read each cell box once. Cached fits survive ordinary balance/selection
  // updates; reset all changed glyphs before measuring any computed font.
  var cells=Array.from(root.querySelectorAll('.MOONSHINE-actions-symbol'));if(root.matches&&root.matches('.MOONSHINE-actions-symbol'))cells.unshift(root);
  cells.forEach(function(cell){if(cell.closest('.MOONSHINE-action-requirement'))return;var glyph=cell.firstElementChild,w=cell.clientWidth,h=cell.clientHeight;if(!glyph||!w||!h)return;var key=[w,h,innerWidth,symbolFontRevision,glyph.textContent].join('|');if(glyph._moonshineSymbolFit!==key)changed.push({glyph:glyph,w:w,h:h,key:key});});
  changed.forEach(function(item){item.glyph.style.transform='';item.glyph.style.fontSize='';});
  // Canvas has no CSS custom-property resolution. Use the resolved logical
  // family actually painting this glyph, including its registered fallbacks.
  changed.forEach(function(item){var glyph=item.glyph,s=getComputedStyle(glyph),base=parseFloat(s.fontSize),family=s.fontFamily;context.font='400 '+base+'px '+family;var m=context.measureText(glyph.textContent),size=base*Math.min(1,item.w*.84/Math.max(1,m.actualBoundingBoxLeft+m.actualBoundingBoxRight),item.h*.84/Math.max(1,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent));context.font='400 '+size+'px '+family;m=context.measureText(glyph.textContent);var x=(m.width+m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,y=(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent-m.fontBoundingBoxAscent+m.fontBoundingBoxDescent)/2;writes.push(function(){glyph.style.fontSize=size+'px';if(Number.isFinite(x)&&Number.isFinite(y))glyph.style.transform='translate('+x+'px,'+y+'px)';glyph._moonshineSymbolFit=item.key;});});
  writes.forEach(function(write){write();});
 }
 function button(label,name){var el=C.create('button',{label:label});el.classList.add('MOONSHINE-'+name);return el;}
 function icon(offer){return (window.MOONSHINE_UPGRADE_SYMBOLS||{})[offer.id]||offer.icon||'📀';}
 function requirement(row,item){
  var data=item.requirement,active=!!(data&&data.kind==='love');row.card.toggleAttribute('data-ms-love-requirement',active);
  [row.full||row.toggle].forEach(function(control){var line=control.querySelector('.MOONSHINE-action-requirement');if(!active){if(line)line.remove();return;}
   if(!line){line=element('span','action-requirement');line.setAttribute('translate','no');line.append(symbol('♥'),element('span','action-requirement-value'));control.append(line);}
   var text=data.current+'/'+data.required,value=line.lastElementChild;if(value.textContent!==text)value.textContent=text;line.dataset.met=String(data.met);
   control.setAttribute('aria-label',item.label+' — LOVE '+data.current+' / '+data.required);row.toggle.setAttribute('aria-label',item.label+' — LOVE '+data.current+' / '+data.required);
  });
 }
 function row(item){
  var card=element('article','action-card');card.dataset.actionId=item.id;card.dataset.category=item.category;if(item.activation)card.dataset.activation=item.activation;if(item.affiliation)card.dataset.affiliation=item.affiliation;
  var toggle=button(null,'action-summary'),label=element('span','action-label',item.summary==null?item.label:item.summary);
  toggle.append(symbol(item.category==='scan'?'📡':item.category==='upgrade'?'📀':item.category==='explore'?'🔍':item.category==='embark'?'✈':'💬'),label);
  if(item.activation==='direct'){card.dataset.activation='direct';rich(label,item.html||'');if(!label.textContent.trim())label.textContent=item.label;toggle.disabled=!!item.disabled;toggle.setAttribute('aria-label',item.label);card.append(toggle);var direct={card:card,toggle:toggle,detail:null,full:null,source:item};requirement(direct,item);return direct;}
  toggle.disabled=!!item.disabled;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label',item.label);
  var detail=element('div','action-detail');detail.inert=true;
  var full=button(null,'action-full'),fullLabel=rich(element('span','action-full-label'),item.html||'');if(!fullLabel.textContent.trim())fullLabel.textContent=item.label;
  full.append(symbol(item.category==='explore'?'🔍':item.category==='embark'?'✈':'💬'),fullLabel);
  if(item.category==='scan'){var check=symbol('✔','Capture complete');check.classList.add('MOONSHINE-scan-row-complete');check.hidden=!item.complete;toggle.append(check);}
  full.disabled=!!item.disabled;detail.append(full);card.append(toggle,detail);var result={card:card,toggle:toggle,detail:detail,full:full,source:item};requirement(result,item);return result;
 }
 function offerCard(offer){
  if(offer.thumbnail){var card=MOONSHINE_CARD_THUMBNAIL.create(offer.thumbnail);card.classList.add('MOONSHINE-rest-offer');card.dataset.offerId=offer.id;var requirement=element('span','rest-requirement',offer.requirement.currency.toUpperCase()+' '+offer.requirement.required);card.append(requirement);card._sourceOffer=offer;return card;}
  var card=button(null,'upgrade-offer');card.dataset.offerId=offer.id;card.setAttribute('aria-label',offer.id==='NONE'?'NONE — skip purchase':offer.title+' — '+offer.price+' DATA');
  if(offer.id==='NONE')card.append(element('span','upgrade-none','NONE'));
  else {card.append(symbol(icon(offer)));card.append(symbol('📀','Upgrade'));card.lastElementChild.classList.add('MOONSHINE-upgrade-badge');}
  var price=element('span','upgrade-price');price.append(element('span','upgrade-price-value',offer.price),symbol('📂','DATA'));card.append(price);
  card._sourceOffer=offer;return card;
 }
 function updateRow(row,item){
  var old=row.source||{};
  if(item.activation==='direct'){if(old.html!==item.html||old.label!==item.label){var direct=row.toggle.querySelector('.MOONSHINE-action-label');rich(direct,item.html||'');if(!direct.textContent.trim())direct.textContent=item.label;}}
  else if((old.summary==null?old.label:old.summary)!==(item.summary==null?item.label:item.summary))row.toggle.querySelector('.MOONSHINE-action-label').textContent=item.summary==null?item.label:item.summary;
  if(old.label!==item.label)row.toggle.setAttribute('aria-label',item.label);
  if(old.affiliation!==item.affiliation){if(item.affiliation)row.card.dataset.affiliation=item.affiliation;else delete row.card.dataset.affiliation;}
  if(row.full&&(old.html!==item.html||old.label!==item.label)){var text=row.full.querySelector('.MOONSHINE-action-full-label');rich(text,item.html||'');if(!text.textContent.trim())text.textContent=item.label;}
  if(row.toggle.disabled!==!!item.disabled)row.toggle.disabled=!!item.disabled;
  if(row.full&&row.full.disabled!==!!item.disabled)row.full.disabled=!!item.disabled;
  var check=row.toggle.querySelector('.MOONSHINE-scan-row-complete');if(check)check.hidden=!item.complete;
  if(item.category==='scan'&&old.complete!==item.complete)row.toggle.setAttribute('aria-label',item.label+(item.complete?' — Capture complete':''));
  requirement(row,item);row.source=item;
 }
 function updateOffer(card,offer,selected){
  var old=card._sourceOffer||{};
  if(!offer.thumbnail&&old.price!==offer.price)card.querySelector('.MOONSHINE-upgrade-price-value').textContent=offer.price;
  if(old.title!==offer.title||old.price!==offer.price)card.setAttribute('aria-label',offer.id==='NONE'?'NONE — skip purchase':offer.title+' — '+offer.price+' DATA');
  var value=String(!!selected);if(card.dataset.selected!==value){card.dataset.selected=value;card.setAttribute('aria-pressed',value);}
  value=String(offer.affordable!==false);if(card.dataset.affordable!==value)card.dataset.affordable=value;
  card._sourceOffer=offer;
 }
 function preview(offer){
  var scrim=element('div','upgrade-preview'),card=element('article','upgrade-preview-card');scrim.setAttribute('role','dialog');scrim.setAttribute('aria-modal','true');scrim.setAttribute('aria-label',offer.title);scrim.tabIndex=-1;
  var head=element('header','upgrade-preview-head');head.append(element('span','upgrade-preview-tag','UPGRADE'),symbol('📀'));
  var art=element('div','upgrade-preview-art');art.append(symbol(icon(offer)));
  var description=element('div','upgrade-preview-description');description.append(rich(element('div','upgrade-preview-copy'),offer.description),rich(element('em','upgrade-preview-flavor'),offer.flavor));
  card.append(head,art,element('h2','upgrade-preview-title',offer.title),description);scrim.append(card);return scrim;
 }
 window.MOONSHINE_ACTION_COMPONENTS={element:element,rich:rich,symbol:symbol,fitSymbols:fitSymbols,button:button,row:row,updateRow:updateRow,offer:offerCard,updateOffer:updateOffer,preview:preview,upgradeIcon:icon};
})();
