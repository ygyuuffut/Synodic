/* Generic module cards consume LUNAR metadata, never module-specific code. */
(function(){'use strict';var C=MOONSHINE_ACTION_COMPONENTS;
 function row(mod){
  var card=C.element('article','mod-card');card.classList.add('MOONSHINE-action-card');card.dataset.modId=mod.id;
  var toggle=C.button(null,'mod-summary'),title=C.element('span','mod-title',mod.title);toggle.append(C.symbol('🧩'),title);toggle.setAttribute('aria-expanded','false');
  var detail=C.element('div','mod-detail');detail.classList.add('MOONSHINE-action-detail');detail.inert=true;detail.id='MOONSHINE-mod-detail-'+mod.id;toggle.setAttribute('aria-controls',detail.id);
  var info=C.element('header','mod-info');
  info.append(C.element('div','mod-version',(mod.apiVersion?'API Version: ':'Mod Version: ')+(mod.apiVersion||mod.version)),C.element('div','mod-author','Author: '+mod.author));
  if(mod.requiresApi)info.append(C.element('div','mod-requirement','Requires API: '+mod.requiresApi));
  var description=C.element('div','mod-description',mod.description);description.tabIndex=0;description.setAttribute('aria-label','Module description');
  var footer=C.element('footer','mod-footer'),status=C.button(null,'mod-status');status.dataset.intent='toggle';footer.append(status);detail.append(info,description,footer);card.append(toggle,detail);
  var result={card:card,toggle:toggle,detail:detail,status:status};update(result,mod);return result;
 }
 function update(row,mod){
  row.card.dataset.status=mod.status;row.card.dataset.pending=String(mod.pending);row.status.disabled=mod.locked;
  var label=mod.core?'Always Enabled':mod.status==='outdated'?'Outdated':mod.enabled?'Enabled':'Disabled';
  if(row.status._label!==label){row.status.textContent=label;row.status._label=label;}
  row.status.dataset.status=mod.core?'core':mod.status;
 }
 function menu(){
  var scrim=C.element('div','mods-scrim'),panel=C.element('section','mods-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','MOONSHINE-mods-title');
  var head=C.element('header','mods-head'),title=C.element('h1','mods-title','Mods'),note=C.element('p','mods-note','To Apply Changes, Please Restart the Game');title.id='MOONSHINE-mods-title';note.setAttribute('role','status');head.append(title,note);
  var list=C.element('div','mods-list'),footer=C.element('footer','mods-footer'),close=C.button('Close','mods-close'),exportLog=C.button('Export Log','mods-export'),exportStatus=C.element('p','mods-export-status');
  footer.setAttribute('data-ms-css-layout','');exportLog.disabled=true;exportLog.setAttribute('aria-label','Export Previous Log');exportStatus.setAttribute('role','status');footer.append(exportLog,close,exportStatus);panel.append(head,list,footer);scrim.append(panel);return {scrim:scrim,panel:panel,list:list,note:note,close:close,exportLog:exportLog,exportStatus:exportStatus};
 }
 window.MOONSHINE_MOD_COMPONENTS={row:row,update:update,menu:menu};
})();
