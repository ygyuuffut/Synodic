/* Semantic narrative/menu boundary. Native transactions own effects and payments. */
(function(){'use strict';var L=window.LUNAR,B=L.buffer,A=L.adapter.storyActions;
 var roots='#stg-blessing-root,#stg-encounter-root,#stg-body-root,#stg-event-root,#stg-upgrade-root,#stg-stomach-fate-root,#stg-rest-root';
 var controls='.arc-dlg-opts button,#enc-choices button,.enc-choices button,.ev-choices button,.enc-page-continue button,button.enc-page-continue,button.enc-continue,.blessing-actions button,.body-senses-row button,.body-exit-btn,.rest-options button';
 var scenes=new WeakMap(), buttons=new WeakMap(), contents=new WeakMap(), callbacks=new Map(), sequence=0, pending=null;
 function active(){return document.getElementById('stg-defeat-cine')||Array.from(document.querySelectorAll(roots)).find(function(el){return !el.closest('.passage-out')&&!el.closest('[data-MOONSHINE-owned]');});}
 function scene(root){if(!scenes.has(root))scenes.set(root,{id:'scene-'+(++sequence),group:null});return scenes.get(root);}
 function point(){return L.adapter.shop.point((window._STG||{}).mapState);}
 function storyFor(root,text){
  if(root.id==='stg-upgrade-root'){var html=String(window._stgMerlinLine||'');return {html:html,hasNarrative:A.hasContent(html),paragraphId:scene(root).id+':'+html,pending:false};}
  // Bind to this exact text source, not another scene's latest channel entry.
  var entryId=text&&text.getAttribute('data-lunar-story-id'),entry=entryId&&B.story.get(entryId);
  // Pending paragraphs retain the complete published copy. After completion,
  // the declared native source may append instant prose without a new typer ID.
  var html=entry&&!entry.complete?entry.html:text?text.innerHTML:entry?entry.html:'',paragraphId=entry?entry.paragraphId:text?L.bridge.native.key(text):scene(root).id,pendingStory=false;
  if(root.id==='stg-body-root'){
   // Body arrival publishes prose only AFTER the native art entrance. Read
   // this node's authored text while its source is empty, so opening ACTIONS
   // cannot freeze that timer. This is data, never an animation owned by LUNAR.
   if(!entry&&!A.hasContent(html)&&document.body.classList.contains('stg-body-art-entering')){
    var character=(window.STG_BODY_EXPLORATION||{})[window._stgBodyChar],node=character&&(window._stgBodyNode==='__intro'?{text:character.introText}:character.nodes[window._stgBodyNode]);
    html=String(node&&node.text||'');pendingStory=true;
   }
   // Instant sensory responses are prose too. Their source child identity
   // distinguishes repeated presentations of exactly the same authored text.
   var host=root.querySelector('#body-sense-host');
   if(host&&A.hasContent(host.innerHTML)){html+='\n'+host.innerHTML;paragraphId+=':sense:'+L.bridge.native.key(host.firstElementChild||host);}
  }
  return {html:html,hasNarrative:A.hasContent(html),paragraphId:paragraphId,pending:pendingStory};
 }
 function groupFor(root){
  var context=scene(root),kind=root.id==='stg-upgrade-root'?'shop':root.id==='stg-blessing-root'?'initial':root.id==='stg-stomach-fate-root'?'fate':null;
  if(root.id==='stg-rest-root'&&root.querySelector('.meditate-cards')){var picks=window._stgMeditatePicks||[],signature=JSON.stringify(picks);var id='rest:'+context.id+':'+signature;context.group=id;return B.actions.group(id,function(){return {id:id,kind:'rest',selected:null,completed:false,pending:false,offers:picks.map(function(pick,index){var card=(window.STG_CARD_TEMPLATES||{})[pick.key]||{},image=(window.STG_CARD_IMAGES||{})[card.name]||'';return {id:pick.key+':'+index,nativeIndex:index,title:card.name,price:0,requirement:{currency:pick.costCur,required:pick.cost},description:typeof window.stgCardDescHtml==='function'?window.stgCardDescHtml(card):card.desc,thumbnail:L.adapter.cards.thumbnail(card,null,true,image)};})};});}
  if(!kind)return null;
  if(context.group){var existing=B.actions.group(context.group);if(existing&&existing.completed)return existing;}
  var picked=kind==='initial'?window._stgBoonPicked:kind==='fate'?window._stgFateBoonPicked:false;
  if(picked)return null;
  var picks=kind==='initial'?window._stgBlessingPicks:kind==='shop'?window._stgUpgradePicks:typeof window.stgFateBoons==='function'?stgFateBoons():[];
  if(!picks||(!picks.length&&kind!=='shop'))return null;
  var id=kind+':'+point();context.group=id;
  return B.actions.group(id,function(){return {id:id,kind:kind,point:point(),offers:A.offers(picks,kind==='shop'?window._stgUpgradeCosts:[],window.STG_CARD_FLAVOR),selected:null,completed:false,pending:false,receipt:null};});
 }
 function gated(root,group,button){
  if(root.id==='stg-upgrade-root')return !!(group&&!group.completed&&shopExit(button));
  if(root.id!=='stg-blessing-root'&&root.id!=='stg-stomach-fate-root')return false;
  return !!(group&&!group.completed&&(/explore|embark/i.test(button.textContent)||button.closest('.blessing-actions')||button.matches('.arc-dlg-opt-stinky,.arc-dlg-opt-grace')));
 }
 function shopExit(button){return button.matches('.blessing-lab-btn')||/^(?:leave|continue|skip|pass|move on|go back|return|exit|depart|proceed|next)\b/i.test(content(button).label);}
 // Read only this control's authored text. Block/BR boundaries are semantic;
 // innerText/computed layout and the translated presentation tree are not inputs.
 function textLines(button){
  var parts=[],blocks=/^(DIV|P|LI|UL|OL|H[1-6]|SECTION|ARTICLE|BLOCKQUOTE|PRE)$/;
  function visit(node){
   if(node.nodeType===3){parts.push(node.nodeValue.replace(/\s+/g,' '));return;}
   if(node.nodeType!==1||/^(SCRIPT|STYLE)$/.test(node.tagName))return;
   if(node.tagName==='BR'){parts.push('\n');return;}
   var block=blocks.test(node.tagName)||node.matches('.rest-opt-name,.rest-opt-sub');if(block)parts.push('\n');
   for(var child=node.firstChild;child;child=child.nextSibling)visit(child);
   if(block)parts.push('\n');
  }
  for(var child=button.firstChild;child;child=child.nextSibling)visit(child);
  return parts.join('');
 }
 function content(button){
  var html=button.innerHTML,classes=button.className,old=contents.get(button);
  if(old&&old.html===html&&old.classes===classes)return old.value;
  var value;
  if(old&&old.html===html)value=Object.assign({},old.value);
  else {
   // A declared native LOVE badge is metadata, not part of the choice prose.
   // Preserve its actual disabled callback and rich/BR label boundaries.
   var lock=button.matches('.arc-dlg-opt')&&button.querySelector('.arc-dlg-lock'),copy=button,requirement=lock&&A.loveRequirement(lock.textContent,lock.classList.contains('arc-dlg-lock-met'));
   if(requirement){copy=button.cloneNode(true);copy.querySelector('.arc-dlg-lock').remove();}
   var lines=textLines(copy),label=A.label(lines);value={label:label,summary:A.summary(lines),html:A.labelHtml(copy.innerHTML),category:A.category(label),requirement:requirement||null};
  }
  value.affiliation=A.affiliation(classes);contents.set(button,{html:html,classes:classes,value:value});return value;
 }
  function read(){
  if(pending&&pending.scope!==B.getScope())pending=null;
  var choice=!document.getElementById('stg-defeat-cine')&&L.bridge.storyChoices.model();if(choice){callbacks.clear();return B.actions.publish(choice);}
  var scan=L.bridge.scan.read();
  var root=active();if(!root||STG_DISPLAY_CONFIG.detectMode()!=='mobile')return B.actions.publish(null);
  var context=scene(root),group=groupFor(root),text=root.querySelector('#arc-dlg-text,#enc-text,#ev-text,.rest-desc,.meditate-sub');
  var ready=!(root.id==='stg-stomach-fate-root'&&window._stgFateEntering)&&!(text&&(text._twSkipFn||text._twSkipFn===true||text.id==='ev-text'&&window.stgTwTimer));
  // Card receipt callbacks may still be resolving the next paragraph/choices.
  // Do not resume ACTIONS (and pause native arming/continuation) in that gap.
  var pendingCardReceipt=!!document.querySelector('.stg-card-popup-scrim,#stg-panel.stg-card-picker-overlay')||!!L.bridge.cardPanel.read();if(pendingCardReceipt)ready=false;
  if(root.id==='stg-encounter-root'&&L.bridge.story.presentation().hidden)ready=false;
  var list=Array.from(root.querySelectorAll(controls+(root.id==='stg-defeat-cine'?',#cine-menu button':''))).filter(function(el){
   // The body utility belongs to the node-choice phase, not a committed
   // response sequence. Its retained native button must not escape that phase.
   if(root.id==='stg-body-root'&&el.matches('.body-exit-btn')){var choices=root.querySelector('#enc-choices');if(!choices||choices.style.display==='none'||root.querySelector('.enc-page-continue'))return false;}
   if(root.id==='stg-defeat-cine'&&el.closest('#cine-menu')&&el.closest('#cine-menu').style.opacity!=='1')return false;
   if(el.closest('.blessing-card')||root.id==='stg-rest-root'&&group&&el.matches('.blessing-actions .blessing-continue:not(.blessing-lab-btn)'))return false;
   // Initial upgrade gates intentionally expose unavailable exit choices as
   // disabled rows; do not confuse that contract with encounter resolution.
   // Source visibility:hidden is our suppression/typing mechanism. Only
   // native explicit removal excludes a callback, in every story family.
   for(var node=el;node;node=node.parentElement){if(node.hidden||node.style.display==='none')return false;if(node===root)break;}
   return true;
  });
  callbacks.clear();
  var items=list.map(function(button){
   if(!buttons.has(button))buttons.set(button,'action-'+(++sequence));var id=buttons.get(button),value=content(button),label=value.label,category=value.category;
   var disabled=gated(root,group,button)||!!button.disabled;
   callbacks.set(id,{node:button,root:root,label:label,category:category});
   return Object.assign({id:id,disabled:disabled},value);
  }).filter(function(item){return item.label&&!(root.id==='stg-upgrade-root'&&/^buy\b/i.test(item.label));});
  // The native confirmation marks the boon picked before our deferred exit.
  // Subsequent dialogue renders now look like a Lab revisit. Keep the original
  // entry controls as data and route their intents here, never those revisit exits.
  if(root.id==='stg-blessing-root'&&group&&group.kind==='initial'){
   if(!group.completed&&!group.entryActions){
    var entryActions=items.flatMap(function(item){var source=callbacks.get(item.id).node;
     var role=source.matches('.arc-dlg-opt-explore')?'arcExplore':source.closest('.blessing-actions')?source.matches('.blessing-lab-btn')?'lab':source.matches('.blessing-continue')?'embark':null:null;
     return role?[Object.assign({},item,{role:role})]:[];
    });
    if(entryActions.length)group=B.actions.update(group.id,{entryActions:entryActions});
   }
   if(group.completed){
    items=items.filter(function(item){var source=callbacks.get(item.id).node;return !source.closest('.blessing-actions')&&!source.matches('.arc-dlg-opt-explore');});
    (group.entryActions||[]).forEach(function(entry){var disabled=entry.role==='arcExplore'&&!!((window._STG||{})._arcBlessingClaimed||window._stgArcExplored);
     callbacks.set(entry.id,{root:root,entryRole:entry.role});
     items.push({id:entry.id,label:entry.label,html:entry.html,category:entry.category,disabled:disabled});
    });
   }
  }
  if(root.id==='stg-blessing-root'&&group&&group.completed){
   var eligibility={completed:true,deferredInitialEntry:true,stinkySeen:typeof window.stgArcStinkySeen==='function'&&stgArcStinkySeen()===true,tranquilSeen:typeof window.stgArcTranquilSeen==='function'&&stgArcTranquilSeen()===true,claimed:!!(window._STG&&_STG._arcBlessingClaimed),proceed:!!window._stgArcBlessingProceed},gateKey=JSON.stringify(eligibility);
   if(context.gateKey!==gateKey){context.gateKey=gateKey;L.logger.scope('LUNAR.actions').info('INITIAL_BLESSING_ELIGIBILITY',Object.assign({scene:context.id},eligibility));}
   items.forEach(function(item){var source=callbacks.get(item.id).node,claimed=!!(window._STG&&_STG._arcBlessingClaimed);
    if(!source)return;
    if(source.matches('.arc-dlg-opt-explore'))item.disabled=claimed||!!window._stgArcExplored;
    // A claimed blessing's Proceed shares the shortcut's class; it is a new
    // native step, not a shortcut to be unlocked or blocked by this bridge.
    if(!window._stgArcBlessingProceed){
     // Native confirm normally leaves for Lab. Our retained first-entry screen
     // is not a Lab revisit, even though native boon-picked is already true.
     // Keep future-run shortcut history intact; admit it on real revisits only.
     if(source.matches('.arc-dlg-opt-stinky,.arc-dlg-opt-grace'))item.disabled=true;
    }
   });
  }
  var upgraded=group&&Object.assign({},group,{offers:group.offers.map(function(offer){return Object.assign({},offer,{affordable:offer.requirement?Number(((window._STG||{}).player||{})[offer.requirement.currency]||0)>=offer.requirement.required:offer.price<=Number(((window._STG||{}).player||{}).data||0)});})});
  var shell=root.id==='stg-upgrade-root';
  var narrative=shell?{speaker:(root.querySelector('.upgrade-merlin-name,.arc-dlg-name')||{}).textContent||'Story',html:root.id==='stg-upgrade-root'?String(window._stgMerlinLine||''):(text||{}).innerHTML||''}:null;
  if(narrative){var latest=['stgArcTypewriter','stgArcTypewriterPaced'].map(function(source){return B.story.get(B.story.latest(source));}).filter(Boolean).sort(function(a,b){return b.order-a.order;})[0];narrative.paragraphId=context.id+':'+(root.id==='stg-upgrade-root'?narrative.html:latest?latest.paragraphId:'intro');}
  var viewport=window.visualViewport;
  var story=storyFor(root,text);if(story.pending)ready=false;
  if(scan){ready=true;items=items.map(function(item){return Object.assign({},item,{disabled:true});});items.push({id:scan.id+':continue',label:'Continue',summary:'Continue',category:'continue',disabled:!scan.canContinue});}
  items.forEach(function(item){var c=callbacks.get(item.id);if(c&&c.node)c.locked=item.disabled&&!c.node.disabled;});
  return B.actions.publish({schema:1,scope:B.getScope(),scene:context.id,kind:root.id==='stg-upgrade-root'?'shop':'story',ready:ready,pendingCardReceipt:pendingCardReceipt,story:story,scan:scan,choiceOnly:!story.hasNarrative&&items.length>0,items:items,upgrade:upgraded,shell:shell,narrative:narrative,viewArt:document.body.classList.contains('stg-view-art-mode'),viewport:{width:innerWidth,height:viewport?viewport.height:innerHeight,offsetTop:viewport?viewport.offsetTop:0,scale:parseFloat(getComputedStyle(document.documentElement).zoom)||1}});
 }
 function notify(domains){L.bridge.port.emit(domains||['actions']);return read();}
 function select(groupId,offerId){
  var model=read(),group=model&&model.upgrade;
  if(!group||group.id!==groupId||group.completed||group.pending)return false;
  if(offerId==='NONE'&&group.kind==='shop')B.actions.update(groupId,{selected:offerId});
  else if(group.offers.some(function(o){return o.id===offerId;}))B.actions.update(groupId,{selected:offerId});else return false;
  L.logger.scope('LUNAR.actions').info('COMMAND_RESULT',{action:'select',group:groupId,offer:offerId,accepted:true});return notify(['selection']);
 }
 function finish(destination){
  if(!pending)return;var transaction=pending;pending=null;
  B.actions.update(transaction.group.id,{completed:true,pending:false,receipt:transaction.offer,destination:destination||null});
  if(transaction.group.kind==='fate')L.bridge.native.call('stgStomachFateRender');
  notify();
 }
 function install(){
  var go=window.stgGoTo;
  if(typeof go==='function'&&!go._lunarActions){var wrapped=function(destination){if(pending&&pending.scope!==B.getScope())pending=null;if(pending&&STG_DISPLAY_CONFIG.detectMode()==='mobile'&&active()===pending.root){finish(destination);return;}return go.apply(this,arguments);};Object.assign(wrapped,go);wrapped._lunarActions=true;window.stgGoTo=wrapped;}
 }
 function confirm(groupId){
  var model=read(),group=model&&model.upgrade,root=active();
  if(!model||!model.ready||!group||group.id!==groupId||group.completed||group.pending||group.selected==null)return false;
  var offer=group.selected==='NONE'&&group.kind==='shop'?{id:'NONE',title:'NONE',price:0}:group.offers.find(function(o){return o.id===group.selected;});
  if(!offer||offer.price>Number(((window._STG||{}).player||{}).data||0))return false;
  if(group.kind==='rest'){var pick=(window._stgMeditatePicks||[])[offer.nativeIndex],p=(window._STG||{}).player||{};if(!pick||offer.id!==pick.key+':'+offer.nativeIndex||pick.costCur!==offer.requirement.currency||pick.cost!==offer.requirement.required||Number(p[pick.costCur]||0)<pick.cost)return false;B.actions.update(group.id,{pending:true});try{L.bridge.pause.game(function(){window._stgMeditateSelectedIdx=offer.nativeIndex;L.bridge.native.call('stgRestMeditateConfirm');});return notify();}catch(error){B.actions.update(group.id,{pending:false});throw error;}}
  var current=group.kind==='initial'?window._stgBlessingPicks:group.kind==='shop'?window._stgUpgradePicks:typeof window.stgFateBoons==='function'?stgFateBoons():[];
  if(offer.id!=='NONE'&&(!current||!current[offer.nativeIndex]||String(current[offer.nativeIndex].id)!==offer.id))return false;
  if(group.kind==='shop'&&offer.id!=='NONE'&&Number((window._stgUpgradeCosts||[])[offer.nativeIndex]||0)!==offer.price)return false;
  install();pending={group:group,offer:offer,root:root,scope:B.getScope()};B.actions.update(group.id,{pending:true});
  L.logger.scope('LUNAR.actions').info('COMMAND_SENT',{action:'confirm',group:groupId,offer:offer.id});
  try{
   L.bridge.pause.game(function(){
    if(group.kind==='initial'){window._stgBlessingSelectedIdx=offer.nativeIndex;L.bridge.native.call('stgConfirmBoon','lab');}
    else if(group.kind==='shop'){if(offer.id==='NONE')L.bridge.native.call('stgUpgradeLeave');else {window._stgUpgradeSelectedIdx=offer.nativeIndex;L.bridge.native.call('stgUpgradeConfirm');}}
    else {window._stgFateSelectedIdx=offer.nativeIndex;L.bridge.native.call('stgFateEmbark');}
   });
   if(pending&&!(current&&current[offer.nativeIndex]&&current[offer.nativeIndex].effectAsync)){pending=null;B.actions.update(group.id,{pending:false});return false;}
  }catch(error){pending=null;B.actions.update(group.id,{pending:false});L.logger.scope('LUNAR.actions').error('COMMAND_RESULT',error,{action:'confirm',group:groupId});throw error;}
  return notify();
 }
 function inspect(groupId,offerId){var model=read(),group=model&&model.upgrade;if(!group||group.id!==groupId||group.kind!=='rest'||group.pending)return false;var offer=group.offers.find(function(o){return o.id===offerId;}),pick=offer&&(window._stgMeditatePicks||[])[offer.nativeIndex];if(!pick||offer.id!==pick.key+':'+offer.nativeIndex)return false;logInspect(groupId,offerId);return L.bridge.cards.inspect((window.STG_CARD_TEMPLATES||{})[pick.key]);}
 function logInspect(groupId,offerId){L.logger.scope('LUNAR.actions').info('CARD_INSPECT',{group:groupId,offer:offerId});}
 function execute(id){
  if(/^story-choice-/.test(id))return !document.querySelector('#stg-defeat-cine,#stg-run-stats,#stg-tease')&&L.bridge.storyChoices.execute(id);
  var model=read(),item=model&&model.items.find(function(v){return v.id===id;}),callback=callbacks.get(id);
  if(model&&model.scan){if(id===model.scan.id+':continue')return L.bridge.scan.proceed(model.scan.id);return false;}
  if(!model||!model.ready||!item||item.disabled||!callback||callback.root!==active()||!callback.root.isConnected||(!callback.entryRole&&!callback.node.isConnected))return false;
  L.logger.scope('LUNAR.actions').info('COMMAND_SENT',{action:'execute',id:id});
  var group=model.upgrade;
  // Shop transaction navigation is deferred until the player chooses Leave.
  return L.bridge.pause.game(function(){
   if(callback.entryRole){
    if(!group||group.kind!=='initial'||!group.completed)return false;
    if(callback.entryRole==='embark')return L.bridge.native.call('stgLabConfirmEmbark');
    if(callback.entryRole==='arcExplore')return L.bridge.native.call('stgLabExploreArcBody');
    if(callback.entryRole==='lab')return L.bridge.native.call('stgGoTo',group.destination||'Lab');
    return false;
   }
   if(group&&group.completed&&model.kind==='shop'&&shopExit(callback.node))return L.bridge.native.call('stgGoTo',group.destination||'MapScreen');
   if(group&&group.completed&&group.kind==='fate'&&callback.node.closest('.blessing-actions'))return L.bridge.native.call('stgGoTo',group.destination||'StomachMap');
   if(group&&group.completed&&callback.node.disabled){
    var name=callback.node.matches('.arc-dlg-opt-explore')?'stgLabExploreArcBody':callback.node.matches('.arc-dlg-opt-stinky')?'stgArcStinkyBlessing':callback.node.matches('.arc-dlg-opt-grace')?'stgArcTranquilBlessing':null;
    if(name)return L.bridge.native.call(name);
   }
   try{callback.node.click();L.logger.scope('LUNAR.actions').info('COMMAND_RESULT',{action:'execute',id:id,phase:'dispatched'});return notify();}catch(error){L.logger.scope('LUNAR.actions').error('COMMAND_RESULT',error,{action:'execute',id:id});throw error;}
  });
 }
 L.bridge.actions={flags:function(keys){var wanted=new Set(keys||[]),flags=[];callbacks.forEach(function(c,id){if(c.node&&c.node.isConnected&&wanted.has(L.bridge.native.key(c.node)))flags.push({id:id,disabled:!!(c.locked||c.node.disabled)});});return flags;},inspect:inspect,state:function(groupId){var group=B.actions.group(groupId);if(!group)return null;var balance=Number(((window._STG||{}).player||{}).data)||0;group.offers=group.offers.map(function(o){return Object.assign({},o,{affordable:o.requirement?Number(((window._STG||{}).player||{})[o.requirement.currency]||0)>=o.requirement.required:o.price<=balance});});return group;},read:read,select:select,confirm:confirm,execute:execute,install:install};
 ['read','select','confirm','execute'].forEach(function(name){L.bridge.interfaces.register('actions.'+name,L.bridge.actions[name]);});
})();
