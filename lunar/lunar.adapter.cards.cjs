/* Card metadata only. Costs and use counters remain native game authority. */
(function(){'use strict';var L=window.LUNAR;
 function family(card){return card.type==='tool'?'Item':card.subtype==='Worship'?'Worship':card.type==='curse'?'Condition':card.subtype||'Alpha';}
 function thumbnail(card,group,revealed,image){
  if(!revealed)return {schema:1,revealed:false,name:'Undiscovered',family:null,cost:null,uses:null,image:null};
  var cost=!card.unplayable&&Number.isFinite(card.cost)?card.cost:null;
  var max=Number.isFinite(card.maxUses)&&card.maxUses>0?card.maxUses:null;
  var remaining=max===null?null:Number.isFinite(card.toolUses)?Math.max(0,card.toolUses):max;
  return {schema:1,revealed:true,name:String(card.name||''),family:group||family(card),
   cost:cost===null?null:{value:cost,magnitude:String(Math.abs(cost)),kind:cost<0?'negative':cost===0?'zero':'positive'},
   uses:max===null?{kind:'unlimited',remaining:null,maximum:null}:{kind:'limited',remaining:remaining,maximum:max},image:image||null};
 }
 L.adapter.cards=Object.freeze({family:family,thumbnail:thumbnail});
})();
