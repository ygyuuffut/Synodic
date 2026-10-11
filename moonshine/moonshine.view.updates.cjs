/* Small domain -> owned view routes, not a game-state store. */
(function(){'use strict';var api=LUNAR.api.moonshine,root,cache={},selectors={
 hp:'[data-stg-hud-value="hp"]',data:'[data-stg-hud-value="data"]',chaos:'[data-stg-hud-value="chaos"]',grace:'[data-stg-hud-value="grace"]',
 playerFill:'[data-ms-id="stg-player-hp-fill"]',enemyFill:'[data-ms-id="stg-enemy-hp-fill"]',playerText:'[data-ms-class~="combat-bar-hp-row"] [data-ms-class~="hp-num"]',enemyText:'[data-ms-class~="enemy-stats-hp-row"] [data-ms-class~="hp-num"]',energy:'[data-ms-class~="energy-orb"]'};
 function index(main){root=main;Object.keys(selectors).forEach(function(k){cache[k]=Array.from(main.querySelectorAll(selectors[k]));});}
 function text(nodes,value){nodes.forEach(function(el){var next=String(value==null?0:value);if(el.textContent===next)return;var old=el.textContent;if(el.childNodes.length===1&&el.firstChild.nodeType===3)el.firstChild.nodeValue=next;else el.textContent=next;if(el.hasAttribute('data-stg-hud-value')&&next.replace('-','').length<3)el.style.removeProperty('font-size');if(el.hasAttribute('data-stg-hud-value')&&(old.replace('-','').length>=3||next.replace('-','').length>=3))MOONSHINE_GEOMETRY.mark(el,'number-width');});}
 function bar(fill,entity){fill.forEach(function(el){var width=Math.max(0,Math.min(100,(Number(entity.hp)||0)/Math.max(1,Number(entity.maxHp)||Number(entity.hp)||1))*100)+'%';if(el.style.width!==width)el.style.width=width;});}
 function dispatch(domains,targets){var used=[];if(!root)return used;var hp=domains.some(function(d){return d==='player'||d==='player.hp';}),enemy=domains.some(function(d){return d==='enemy'||d==='enemy.hp';}),hud=domains.some(function(d){return d==='hud'||d==='shop.balance'||d==='player';});
  if(hp||hud)MOONSHINE_STORY.hud();if(hp||enemy||hud){var value=api.updates.scalars();if(hp){used.push('playerHUD');text(cache.hp,value.player.hp);bar(cache.playerFill,value.player);text(cache.playerText,String(value.player.hp)+' / '+String(value.player.maxHp));cache.hp.forEach(function(el){var pill=el.closest('[data-ms-class~="stg-mobile-top-hud-hp"]');if(pill){var p=value.player,state=p.maxHp>0&&p.hp>=p.maxHp?'full':p.maxHp<=0||p.hp/p.maxHp<=.2?'critical':'normal';if(pill.dataset.hpState!==state)pill.dataset.hpState=state;var label='HP '+p.hp+' of '+p.maxHp;if(pill.getAttribute('aria-label')!==label)pill.setAttribute('aria-label',label);}});}if(enemy){used.push('enemyHP');bar(cache.enemyFill,value.enemy);text(cache.enemyText,String(value.enemy.hp)+' / '+String(value.enemy.maxHp));}if(hud){used.push('HUD');text(cache.energy,value.energy);text(cache.data,value.player.data);text(cache.chaos,value.player.chaos);text(cache.grace,value.player.grace);}}
  // Choice removals and new prose win over a simultaneous reward/balance patch.
  if(domains.some(function(d){return /^(actions|shop|shop\.items|story|dialogue)$/.test(d);})){used.push('actions');MOONSHINE_ACTIONS.refresh();}
  else if(domains.some(function(d){return /^(selection|shop\.balance|hud)$/.test(d);})){used.push('actions.state');MOONSHINE_ACTIONS.state();}
  if(domains.includes('actions.state')){used.push('actions.flags');MOONSHINE_ACTIONS.flags((targets||[]).filter(function(t){return t.domain==='actions.state';}).map(function(t){return t.key;}));}
  if(domains.some(function(d){return d==='mainMenu'||d==='viewport';})){used.push('mainMenu.watermark');MOONSHINE_MAIN_MENU_WATERMARK.refresh();}
  if(domains.some(function(d){return /^location(?:\.|$)/.test(d);})){used.push('location');MOONSHINE_LOCATION.refresh(domains.filter(function(d){return /^location(?:\.|$)/.test(d);}));}
  if(domains.some(function(d){return /^(story|story\.presentation|dialogue)$/.test(d);})) {used.push('story.presentation');if(domains.includes('story')||domains.includes('dialogue'))MOONSHINE_STORY.refresh();MOONSHINE_STORY_PHASE.refresh();}
  if(domains.includes('resources.background')){used.push('story.background');MOONSHINE_STORY.backgroundRefresh();}
  if(domains.includes('resources.encounter')){used.push('resources.encounter');MOONSHINE_ENCOUNTER_ASSETS.refresh();}
  if(domains.includes('collectedData')){used.push('collectedData');MOONSHINE_COLLECTED_DATA.refresh();}
  if(domains.includes('scan')){used.push('scan');MOONSHINE_SCAN.refresh();MOONSHINE_ACTIONS.scanState();}
  if(domains.some(function(d){return /^(?:combat|hand|cards|hud|presentation|player(?:\..*)?|enemy(?:\..*)?)$/.test(d);})){used.push('combat');MOONSHINE_COMBAT.refresh(domains);}
  if(domains.some(function(d){return /^(cards|cards\.panel)$/.test(d);}))MOONSHINE_CARD_PANEL.refresh(domains);
  if(domains.includes('map')){used.push('map');MOONSHINE_MAP.refresh(domains);}
  if(domains.includes('viewport'))MOONSHINE_RUN_REPORT.geometry();
  if(domains.includes('viewport'))MOONSHINE_LAB_NOTICE.geometry();
  if(domains.includes('labNotice')){used.push('labNotice');MOONSHINE_LAB_NOTICE.refresh();}
  if(domains.includes('runReport')){used.push('runReport');MOONSHINE_RUN_REPORT.refresh();MOONSHINE_PRESENTATION.refresh();}
  if(domains.includes('mods')){used.push('mods');MOONSHINE_MODS.refresh();}api.logger.scope('MOONSHINE.runtime').debug('VIEW_DISPATCH',{domains:domains,views:used});if(hp||enemy||hud)api.logger.scope('MOONSHINE.combat').debug('DOM_PATCH',{views:used,kind:'scalars'});return used;
 }
 function indexPart(scope,domain){var names=/^enemy/.test(domain)?['enemyFill','enemyText']:/^player/.test(domain)?['playerFill','playerText','hp']:/hud|top-hud/.test(domain)?['hp','data','chaos','grace']:[];names.forEach(function(k){cache[k]=(cache[k]||[]).filter(function(el){return el.isConnected&&!scope.contains(el);});if(scope.matches(selectors[k]))cache[k].push(scope);cache[k].push.apply(cache[k],Array.from(scope.querySelectorAll(selectors[k])));});}
 function local(records){var targets=new Set(),full=false,viewport=false;records.forEach(function(r){var el=r.target.nodeType===1?r.target:r.target.parentElement;if(!el)return;if(el===MOONSHINE_WORKSPACE.body||el===MOONSHINE_WORKSPACE.html){if(r.type==='attributes'){viewport=true;}else full=true;return;}var unit=el.closest('.stg-mobile-top-hud,.hand,#arc-dlg-text,#enc-text,#ev-text,#body-sense-host,.arc-dlg-opts,.blessing-actions,.enemy-stats-hp-row,[id]');if(unit)targets.add(unit);else full=true;});return {domains:full?['compatibility']:(viewport?['viewport','workspace']:['workspace']),localTargets:Array.from(targets)};}
 window.MOONSHINE_UPDATE_VIEWS={index:index,indexPart:indexPart,dispatch:dispatch,local:local};
})();
