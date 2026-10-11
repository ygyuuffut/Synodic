/* Persistent owned shell. Legacy aliases reuse accepted artwork only. */
(function(){'use strict';
 function element(tag,classes,text){var el=document.createElement(tag);el.className='MOONSHINE-chrome-'+tag;el.dataset.msClass=classes||'';if(text!=null)el.textContent=text;return el;}
 function button(classes,label,intent){var el=element('button',classes,label);el.type='button';el.dataset.msChromeControl=intent;return el;}
 function create(){
  var root=element('section','stg-story-root');root.id='MOONSHINE-persistent-chrome';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('translate','yes');
  var hud=element('header','blessing-header-inner stg-mobile-top-hud');hud.id='MOONSHINE-top-hud';hud.setAttribute('translate','no');
  var info=button('stg-mobile-top-hud-info','i','info');info.setAttribute('aria-label','Tiny Information');info.setAttribute('aria-haspopup','dialog');info.setAttribute('aria-expanded','false');
  var stats=element('div','stg-mobile-top-hud-stats'),values={};
  var hp=element('div','stg-mobile-top-hud-hp'),hpLabel=element('span','stg-mobile-top-hud-hp-label');hpLabel.append(element('span','','HP'));hp.setAttribute('role','group');values.hp=element('span','stg-mobile-top-hud-hp-value','0');values.hp.dataset.stgHudValue='hp';hp.append(hpLabel,values.hp);
  var data=element('div','stg-mobile-top-hud-data'),align=element('div','stg-mobile-top-hud-alignment'),alignValues=element('span','stg-mobile-top-hud-align-values');data.setAttribute('aria-label','DATA');align.setAttribute('aria-label','Alignment');
  function glyph(text){var cell=element('span','stg-mobile-top-hud-glyph');cell.setAttribute('aria-hidden','true');cell.append(element('span','',text));return cell;}
  values.data=element('span','stg-mobile-top-hud-data-value','0');values.data.dataset.stgHudValue='data';data.append(glyph('📂\uFE0E'),values.data);
  ['chaos','grace'].forEach(function(k){values[k]=element('span','','0');values[k].dataset.stgHudValue=k;alignValues.append(values[k]);});align.append(glyph('🧭\uFE0E'),alignValues);stats.append(hp,data,align);
  var menuWrap=element('div','stg-banner-menu-wrap stg-mobile-top-hud-menu-wrap'),menu=button('ev-bar-btn ev-bar-icon-btn stg-banner-menu-btn','','menu');menu.dataset.msId='stg-banner-menu-btn';menu.setAttribute('aria-label','Menu');menuWrap.append(menu);hud.append(info,stats,menuWrap);
  var story=element('section','arc-dialogue stg-story-panel');story.id='MOONSHINE-story-box';var head=element('header','stg-story-head'),title=element('div','arc-dlg-name','Story'),scroll=element('div','stg-story-scroll'),footer=element('footer','stg-story-footer'),view=button('stg-story-view','VIEW CG','view'),status=element('span','stg-story-status'),statusGlyph=element('span','stg-story-status-glyph','✓'),actions=button('stg-story-actions','ACTIONS','actions');status.setAttribute('role','img');actions.classList.add('MOONSHINE-story-actions');status.append(statusGlyph);head.append(title);var storyHp=MOONSHINE_COMBAT_COMPONENT.counter(head,'HP','hp',true),love=MOONSHINE_COMBAT_COMPONENT.counter(head,"","love",true);storyHp.row.classList.add('MOONSHINE-story-hp');storyHp.row.hidden=true;love.row.classList.add("MOONSHINE-story-love");love.row.hidden=true;footer.append(view,status,actions);story.append(head,scroll,footer);root.append(hud,story);
  return {root:root,hud:hud,hp:hp,values:values,info:info,menu:menu,story:story,title:title,storyHp:storyHp,love:love,scroll:scroll,view:view,status:status,statusGlyph:statusGlyph,actions:actions};
 }
 window.MOONSHINE_CHROME_COMPONENT=Object.freeze({create:create});
})();
