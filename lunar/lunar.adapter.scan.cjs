/* Scanner exchange data. Native session remains the progress authority. */
(function(){'use strict';var L=window.LUNAR;
 function normalize(text){return String(text).trim().split(/\n\s*\n/).map(function(p){return p.replace(/\s+/g,' ').trim();}).filter(Boolean).join('\n\n');}
 function report(text,id,unlocked){var clean=normalize(text),match=clean.match(/^>\s*([^:]+?)\s*:\s*([\s\S]*)$/);return {id:id,text:clean,label:match?match[1].trim():'',body:match?match[2].trim():clean,unlocked:unlocked};}
 function read(transaction,session,config,data,advanced,rules){
  var count=Math.max(0,Math.min(Number(config.maxClicks)||0,Number(session.clickedTotal)||0)),maximum=Number(config.maxClicks)||0;
  var reveals=(data.reveals||[]).map(function(text,i){return report(i<count?text:'> ???????? : [data locked — keep scanning]','reveal-'+i,i<count);});
  return {schema:1,id:transaction.id,scope:transaction.scope,key:transaction.key,title:'Scan — '+transaction.label.replace(/^scan\s+(?:[—–:-]\s*)?/i,''),image:transaction.image,
   count:count,maximum:maximum,complete:maximum>0&&count>=maximum,canContinue:maximum<=0||count>=maximum,whack:!!config.whackAMole,freezeAvailable:!!advanced&&!session.freezeUsed,
   header:(data.header||[]).map(normalize),headerReports:(data.header||[]).map(function(text,i){return report(text,'header-'+i,true);}),reports:reveals,trait:count>=maximum&&maximum>0?(data.trait||[]).map(normalize):[],
   spawn:rules};
 }
 function archive(transaction,data){var value=read(transaction,{clickedTotal:Math.max(1,(data.reveals||[]).length)},{maxClicks:Math.max(1,(data.reveals||[]).length)},data,false,null);value.readOnly=true;value.collectionId=transaction.collectionId;return value;}
 L.adapter.scan=Object.freeze({read:read,archive:archive});
})();
