/* Battle DTOs only. Native effects and counters remain authoritative. */
(function(){'use strict';var L=window.LUNAR;
 var labels={weak:'Weak',vuln:'Vulnerable',stuck:'Stuck',str:'Heat',cool:'Cool',ritual:'Allure',fear:'Fear',wither:'Weak',slowed:'Slowed',stun:'Stun',pstun:'Stunned',might:'Might',crazed:'Crazed',phoenix:'Phoenix Form',symbiosis:'Symbiosis',heartburn:'Indigestion',corroded:'Corroded',clenched:'Clenched',patience:'Proper Patience',energized:'Energized',seduced:'Seduced',gluttony:'Feast',analyzed:'Analyzing',ward:'Ward',charm:'Charm',armor:'Armor'};
 var debuffs=new Set(['weak','vuln','stuck','fear','wither','slowed','stun','pstun','seduced','corroded','heartburn']);
 function statuses(entity){var out=Object.entries(entity.statuses||{}).filter(function(p){return Number(p[1])>0;}).map(function(p){return {id:p[0],name:labels[p[0]]||p[0],amount:Number(p[1]),kind:debuffs.has(p[0])?'debuff':'buff'};});if(entity.calm>0)out.push({id:'calm',name:'Calm',amount:entity.calm,kind:'buff'});if(entity.barrier>0)out.push({id:'barrier',name:'Essence Barrier',amount:entity.barrier,kind:'buff'});return out;}
 function objectives(g){var e=g.enemy,p=g.player,rows=[];function add(id,label,required,current,kind){rows.push({id:id,label:label,required:required,current:current,kind:kind});}
  if(g._graceBoss&&e.graceAi&&!e.graceAi.devourReady)add('phase-love','Love Threshold',e.graceAi.target||0,e.love||0,'love');else if(g._loveEscapeAt)add('love','Love Threshold',g._loveEscapeAt,e.love||0,'love');
  if(e.escapeAtDmg)add('damage','Attack Threshold',e.escapeAtDmg,Math.max(0,(e.combatStartHp||e.maxHp)-e.hp),'damage');
  if(g._playerDmgFloor)add('relent','Relent Threshold',g._playerDmgFloor,p.hp,'relent');
  if(g._averyPussy)add('player-love','Player Love Threshold',Math.round(p.maxHp*.9),p.love||0,'love');
  if(g._stuckWinActive)add('stuck','Stuck Remaining',0,(p.statuses||{}).stuck||0,'relent');
  if(e.roundLimit&&e.roundLimit.rounds)add('turns','Turn Limit',e.roundLimit.rounds,g.turn,'neutral');
  if(!rows.length)add('defeat','Enemy HP',0,e.hp,'damage');return rows;
 }
 function counter(e){return {hp:Math.max(0,e.hp),maxHp:e.maxHp,block:e.block||0,love:e.love||0};}
 function result(data,bars){return Object.assign({schema:1},data,{rewards:bars.map(function(bar){var amount=String(bar.label||'').match(/\d+/);return {kind:bar.kind,amount:amount?Number(amount[0]):0};})});}
 L.adapter.combat=Object.freeze({result:result,statuses:statuses,objectives:objectives,counter:counter,withoutEmoji:function(value){return String(value||'').replace(/[\p{Extended_Pictographic}\uFE0E\uFE0F\u200D]/gu,'').trim();}});
})();
