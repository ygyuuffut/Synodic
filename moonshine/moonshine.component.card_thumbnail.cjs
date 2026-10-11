/* Reusable owned portrait face. Compatibility views pass data, never child DOM. */
(function(){'use strict';var api=LUNAR.api.moonshine,colors={Chaos:'#ff8878',Grace:'#a0c0e8',Worship:'#e85aa0',Harmony:'#50c060',Instinct:'#e8932c',Balance:'#c8a8f0',Logic:'#f4d878',Item:'#c080e8',Condition:'#c08848',Alpha:'#c9c9d4'};
 function span(name){var el=document.createElement('span');el.className='MOONSHINE-card-thumbnail-'+name;return el;}
 function text(el,value){if(el._sourceText!==value){el.textContent=value;el._sourceText=value;}}
 function resource(el){var own=el._thumbnail;if(!own)return;if(!own.dto.image){if(own.source){own.source='';own.image.removeAttribute('src');}own.image.hidden=true;return;}var viewport=api.viewport(),width=Math.max(90,(viewport?viewport.width:360)*.4),source=api.cards.art(own.dto.image,width,width*4/3);
  if(own.source!==source){own.source=source;own.image.hidden=!source;if(source)own.image.src=source;else own.image.removeAttribute('src');}
 }
 function update(el,dto){
  var own=el._thumbnail;
  if(own&&own.dto===dto){resource(el);return el;}
  if(!own){var image=document.createElement('img'),rail=span('rail'),cost=span('cost'),titleBox=span('title-box'),title=span('title'),uses=span('uses');
   image.className='MOONSHINE-card-thumbnail-image';image.alt='';image.loading='lazy';image.decoding='async';image.hidden=true;
   image.addEventListener('error',function(){image.hidden=true;});image.addEventListener('load',function(){image.hidden=false;});
   cost.translate=false;uses.translate=false;titleBox.append(title);rail.append(cost,titleBox,uses);el.append(image,rail);
   own=el._thumbnail={image:image,rail:rail,cost:cost,title:title,uses:uses,source:null};
  }
  own.dto=dto;el.dataset.msComponent='card';el.dataset.msVariant='thumbnail';el.classList.add('MOONSHINE-card-thumbnail');
  el.dataset.revealed=String(dto.revealed);el.disabled=!dto.revealed;el.style.setProperty('--ms-card-color',colors[dto.family]||'#7657a0');
  text(own.title,dto.name);own.title.title=dto.name;own.title.dataset.long=String(dto.name.length>45);
  own.cost.hidden=!dto.cost;own.uses.hidden=!dto.uses;
  if(dto.cost){text(own.cost,dto.cost.magnitude);own.cost.dataset.kind=dto.cost.kind;own.rail.style.setProperty('--ms-cost-scale',String(Math.min(1,1.5/dto.cost.magnitude.length)));own.cost.setAttribute('aria-label','Cost '+dto.cost.value);}
  if(dto.uses){var label=dto.uses.kind==='unlimited'?'∞':dto.uses.remaining+'/'+dto.uses.maximum;text(own.uses,label);own.uses.style.setProperty('--ms-uses-scale',String(Math.min(1,4/label.length)));own.uses.setAttribute('aria-label',dto.uses.kind==='unlimited'?'Unlimited uses':dto.uses.remaining+' of '+dto.uses.maximum+' uses remaining');}
  el.setAttribute('aria-label',dto.revealed?dto.name+(dto.cost?', cost '+dto.cost.value:'')+(dto.uses.kind==='unlimited'?', unlimited uses':', '+dto.uses.remaining+' of '+dto.uses.maximum+' uses remaining'):'Undiscovered card');
  resource(el);return el;
 }
 function create(dto,options){var el=document.createElement('button');el.type='button';el.setAttribute('data-MOONSHINE-owned','');update(el,dto);if(options&&options.onActivate)el.addEventListener('click',options.onActivate);return el;}
 // Empty slots only: the compatibility shell never creates a card face.
 function slots(entries,register){return entries.map(function(entry,index){var action=entry.revealed?register(entry.card):null;
  return '<button type="button" data-ms-component="card" data-ms-variant="thumbnail" class="stg-mc-card'+(entry.revealed?'':' stg-mc-card--locked')+'" data-ms-card-slot="'+index+'"'+(action===null?' disabled':' data-card-index="'+action+'"')+'></button>';
 }).join('');}
 function bindSlots(root,entries){root.querySelectorAll('[data-ms-card-slot]').forEach(function(el){el._moonshineThumbnail=entries[Number(el.dataset.msCardSlot)].thumbnail;});}
 window.MOONSHINE_CARD_THUMBNAIL=Object.freeze({create:create,update:update,slots:slots,bindSlots:bindSlots,resources:function(root){root.querySelectorAll('.MOONSHINE-card-thumbnail').forEach(resource);}});
})();
