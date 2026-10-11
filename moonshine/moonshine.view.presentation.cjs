/* Sole visibility authority. Presentation state is UI state, never game authority. */
(function(){'use strict';var api=LUNAR.api.moonshine,log=api.logger.scope('MOONSHINE.presentation'),chrome=null,base=api.chrome.presentation(),mode=null,reason=null,cinematics=new Map(),transition=api.transitions.status();
 var modes=new Set(['OUTSIDE','NORMAL','MAP','SCENE_TRANSITION','SYSTEM_LOADING','COMBAT','CINEMATIC','RUN_REPORT','END_NOTICE']);
 function policy(name,explicit){if(name==='NORMAL')return {hud:true,story:true};if(name==='COMBAT'||name==='MAP')return {hud:true,story:false};if(name==='CINEMATIC')return {hud:!!(explicit&&explicit.hud),story:!!(explicit&&explicit.story)};return {hud:false,story:false};}
 function setMode(next,why,context,explicit){
  if(!modes.has(next)||!why)throw new Error('Presentation mode and reason required');context=context||{};
  var previous=mode,old=chrome?{hud:!chrome.hud.hasAttribute('data-ms-suspended'),story:!chrome.story.hasAttribute('data-ms-suspended')}:policy(mode),target=policy(next,explicit),changed=next!==mode||why!==reason;
  mode=next;reason=why;if(chrome){chrome.root.parentElement.dataset.presentationMode=next;chrome.root.dataset.presentationMode=next;chrome.root.dataset.presentationReason=why;chrome.hud.toggleAttribute('data-ms-suspended',!target.hud);chrome.story.toggleAttribute('data-ms-suspended',!target.story);chrome.hud.inert=!target.hud;chrome.story.inert=!target.story;}
  var data={from:previous,to:next,reason:why,sceneId:context.sceneId||base.sceneId,transactionId:context.transactionId||transition.id||0};
  if(changed)log.info('PRESENTATION_MODE_CHANGE',data);
  if(chrome&&old.hud!==target.hud)log.info(target.hud?'HUD_RESUME':'HUD_SUSPEND',data);
  if(chrome&&old.story!==target.story)log.info(target.story?'STORYBOX_RESUME':'STORYBOX_SUSPEND',data);
 }
 function reconcile(){var context={sceneId:base.sceneId,transactionId:transition.id};
  if(transition.kind==='system'){setMode('SYSTEM_LOADING',transition.reason||'system-loading',context);return;}
  if(transition.kind==='scene'){var guard=window.MOONSHINE_ROOT_GUARD&&MOONSHINE_ROOT_GUARD.status();if(!guard||guard.phase==='idle'||guard.holding&&!guard.loading)return;if(guard.loading&&guard.holding){setMode('SCENE_TRANSITION','scene-transition',context);return;}base=api.chrome.presentation();}
  var entries=Array.from(cinematics.values()),cinema=entries[entries.length-1];if(cinema){setMode('CINEMATIC',cinema.reason,context,cinema);return;}
  if(base.cinematic){setMode('CINEMATIC','art-view',context,{hud:false,story:false});return;}
  setMode(base.mode,base.mode==='COMBAT'?'combat':base.mode==='MAP'?'map-navigation':base.mode==='RUN_REPORT'?'run-report':base.mode==='END_NOTICE'?'end-notice':base.mode==='OUTSIDE'?'outside-gameplay':'normal-gameplay',context);
 }
 function refresh(){base=api.chrome.presentation();reconcile();}
 api.chrome.subscribe(function(value){var sceneChanged=base.sceneId!==value.sceneId;base=value;if(sceneChanged)cinematics.clear();reconcile();});
 api.transitions.subscribe(function(value){transition=value;if(value.kind==='silent')base=api.chrome.presentation();reconcile();});
 window.MOONSHINE_PRESENTATION=Object.freeze({attach:function(value){chrome=value;reconcile();},refresh:refresh,setMode:setMode,status:function(){return Object.freeze({mode:mode,reason:reason,sceneId:base.sceneId,transactionId:transition.id||0});},enterCinematic:function(owner,explicit){if(!owner||!explicit||!explicit.reason)throw new Error('Cinematic owner/policy/reason required');cinematics.set(owner,explicit);reconcile();},exitCinematic:function(owner){cinematics.delete(owner);reconcile();}});
 reconcile();
})();
