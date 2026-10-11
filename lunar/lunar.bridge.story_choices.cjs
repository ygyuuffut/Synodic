/* Registered full-screen source families; exact native leaf commands only.
   No onclick parsing, synthetic game state, or generic confirmation bypass. */
(function(){'use strict';var L=window.LUNAR,lives=new WeakMap(),sequence=0,log=L.logger.scope('LUNAR.story');
 function mobile(){return STG_DISPLAY_CONFIG.detectMode()==='mobile';}
 function passage(){return document.querySelector('.passage:not(.passage-out)');}
 function source(){var p=passage(),root=document.querySelector('#stg-disp-end');
  // Native finale is a body-mounted foreground above any retained passage.
  if(root)return {root:root,family:'finale',p:p,heading:'.stg-void-end-title',copy:'.stg-void-end-sub',buttons:'.stg-disp-end-inner button'};
  root=p&&p.querySelector('#stg-encounter-root .stg-void-end,#stg-root .stg-void-end');return root?{root:root,family:'void',p:p,heading:'.stg-void-end-title',copy:'.stg-void-end-sub',buttons:'.stg-void-end-actions button'}:null;
 }
 function entries(s){var controls=Array.from(s.root.querySelectorAll(s.buttons));
  if(s.family==='void')return controls.flatMap(function(button){
   if(button.matches('.stg-void-end-btn--more'))return [
    {role:'proceed',node:button,command:'stgDisposalProceed',text:'Proceed (Scat Warning)',html:'Proceed (Scat Warning)'},
    {role:'soft',node:button,command:'stgDisposalProceedSoft',text:'Proceed (No Scat)',html:'Proceed (No Scat)'}];
   return button.matches('.stg-void-end-btn')?[{role:'skip',node:button,command:'stgVoidTunnelSkip',text:button.textContent,html:button.innerHTML}]:[];
  }).sort(function(a,b){var ranks={proceed:0,soft:1,skip:2};return ranks[a.role]-ranks[b.role];});
  // The terminal family has one authored Main Menu command, no nested gate.
  return controls.length===1?[{role:'menu',node:controls[0],command:'stgDisposalToMenu',text:controls[0].textContent,html:controls[0].innerHTML}]:[];
 }
 function context(){if(!mobile())return null;var s=source();if(!s||!s.root.isConnected||s.root.hidden||s.root.style.display==='none')return null;
  var items=entries(s),scope=L.buffer.getScope(),life=lives.get(s.root),controls=items.map(function(item){return item.node;});
  if(!life||life.scope!==scope||life.p!==s.p||controls.length!==life.controls.length||controls.some(function(n,i){return n!==life.controls[i];})){
   life={id:'story-choice-'+(++sequence),scope:scope,p:s.p,controls:controls,consumed:false};lives.set(s.root,life);
   log.info('STORY_CHOICE_SOURCE',{id:life.id,family:s.family,leaves:items.length});
  }
  s.life=life;s.items=items;return s;
 }
 function read(){var s=context();if(!s)return null;var title=s.root.querySelector(s.heading),copy=s.root.querySelector(s.copy),text=title?title.textContent:'Story';
  return L.adapter.storyChoices.normalize({id:s.life.id,sceneId:window.SugarCube&&SugarCube.State&&SugarCube.State.passage||'boot',title:text==='ONE WITH AVERY'?'One With Avery':text,html:copy?copy.innerHTML:'',consumed:s.life.consumed,
   // Both registered native presentations explicitly use black. Future
   // families must declare their authored background, never borrow stale CG.
   background:{color:'#000',image:'none'},items:s.items.map(function(item){return {id:s.life.id+':'+item.role,role:item.role,text:item.text,html:item.html,disabled:item.node.disabled||typeof window[item.command]!=='function'};})});
 }
 function model(){var value=read();if(!value)return null;var viewport=window.visualViewport;return {schema:1,scope:L.buffer.getScope(),scene:value.branchId,kind:'story',ready:value.actionsAvailable,story:{html:value.html,hasNarrative:L.adapter.storyActions.hasContent(value.html),paragraphId:value.branchId,pending:false},items:value.items,upgrade:null,scan:null,shell:false,viewArt:false,viewport:{width:innerWidth,height:viewport?viewport.height:innerHeight,offsetTop:viewport?viewport.offsetTop:0,scale:parseFloat(getComputedStyle(document.documentElement).zoom)||1}};}
 function execute(id){var s=context(),item=s&&s.items.find(function(v){return s.life.id+':'+v.role===id;});
  if(!s||s.life.consumed||!item||item.node.disabled||!item.node.isConnected||typeof window[item.command]!=='function')return false;
  s.life.consumed=true;log.info('COMMAND_SENT',{action:'story-choice',id:id,command:item.command});
  try{L.bridge.pause.game(function(){L.bridge.native.call(item.command);});log.info('COMMAND_RESULT',{action:'story-choice',id:id,phase:'dispatched'});L.bridge.port.emit(['story','actions']);return true;}
  catch(error){log.error('COMMAND_RESULT',error,{action:'story-choice',id:id});throw error;}
 }
 L.bridge.storyChoices={read:read,model:model,execute:execute,owns:function(node){return mobile()&&node.matches('.stg-void-end,#stg-disp-end');},contains:function(node){return mobile()&&!!node.closest('.stg-void-end,#stg-disp-end');}};
})();
