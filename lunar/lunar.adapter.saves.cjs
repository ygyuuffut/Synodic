/* Save confirmation text is data; native callbacks still own the operation. */
(function(){
 'use strict';
 var L=window.LUNAR;
 function intent(options){
  if(!options)return null;
  var match=/^(Load|Overwrite) Slot ([1-3])\?$/.exec(options.title||'');
  if(match&&options.okLabel===match[1]&&options.body===(match[1]==='Load'?'Your current in-memory run will be replaced.':'The existing save will be lost.'))
   return {index:Number(match[2])-1,action:match[1],field:'title'};
  if(options.title==='All Slots Full'&&options.okLabel==='Overwrite'&&options.body==='Overwrite Slot 1 with the imported save?')
   return {index:0,action:'Overwrite',field:'body'};
  return null;
 }
 function named(options,operation,name){
  name=typeof name==='string'?name.trim():'';
  if(!name)return options;
  // The existing modal consumes rich text. A player name is always literal.
  var escaped=name.replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  var result=Object.assign({},options);
  result[operation.field]=operation.field==='title'?operation.action+' '+escaped+'?':'Overwrite '+escaped+' with the imported save?';
  return result;
 }
 L.adapter.saves={intent:intent,named:named};
})();
