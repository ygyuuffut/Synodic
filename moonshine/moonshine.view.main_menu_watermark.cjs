/* Owned, translation-stable menu ornament. No workspace transit or game refresh. */
(function(){'use strict';var api=LUNAR.api.moonshine,config=api.mainMenu.watermark(),root;
 function ensure(){if(root)return;root=document.createElement('div');root.id='MOONSHINE-main-menu-watermark';root.setAttribute('data-MOONSHINE-owned','');root.setAttribute('translate','yes');root.hidden=true;
  root.dataset.position=config.position;
  var text=document.createElement('span');text.textContent=config.text;text.className='MOONSHINE-main-menu-watermark-text';
  text.style.opacity=String(config.opacity);text.style.fontFamily=api.fonts.stack(config.font.name)+', monospace';text.style.fontWeight=String(config.font.weight);text.style.fontSize=config.font.size+'px';
  root.append(text);document.body.append(root);
 }
 function refresh(){if(!document.body)return;if(api.mode()!=='mobile'||!config.text){if(root)root.hidden=true;return;}
  ensure();var model=api.mainMenu.read();if(root.hidden===model.mainMenu)root.hidden=!model.mainMenu;
  if(!model.mainMenu)return;var v=model.viewport,values={zoom:String(1/v.scale),width:v.width+'px',height:v.height+'px',top:v.offsetTop+'px'};
  Object.keys(values).forEach(function(k){if(root.style[k]!==values[k])root.style[k]=values[k];});
 }
 window.MOONSHINE_MAIN_MENU_WATERMARK=Object.freeze({refresh:refresh});
})();
