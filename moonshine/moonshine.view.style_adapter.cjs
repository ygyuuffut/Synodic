(function(){'use strict';
  function styles(resources){
    var css='';
    function split(selector){var parts=[],level=0,start=0,quote='';for(var i=0;i<selector.length;i++){var c=selector[i];if(quote){if(c===quote && selector[i-1]!=='\\')quote='';continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='('||c==='[')level++;if(c===')'||c===']')level--;if(c===','&&!level){parts.push(selector.slice(start,i).trim());start=i+1;}}parts.push(selector.slice(start).trim());return parts;}

    function convert(selector){
      selector=selector.replace(/MOONSHINE-source-/g,'').replace(/\.MOONSHINE-document-body/g,'body').replace(/\.MOONSHINE-document-html/g,'html');
      selector=selector.replace(/(^|[\s>+~,(])(?:body|html)((?:[.#][\w-]+)*)(?=[:\s>+~,)\[]|$)/g,function(_,prefix,suffix){return prefix+'#MOONSHINE-root'+suffix.replace(/\.([\w-]+)/g,'.MOONSHINE-mode-$1');});
      selector=selector.replace(/#([\w-]+)/g,function(_,id){return id==='MOONSHINE-root'?'#MOONSHINE-root':'[data-ms-id="'+id+'"]';}).replace(/\.(-?[a-zA-Z_][\w-]*)/g,function(_,name){return name.indexOf('MOONSHINE-mode-')===0?'.'+name:'[data-ms-class~="'+name+'"]';});
      selector=selector.replace(/#MOONSHINE-root\s+#MOONSHINE-root/g,'#MOONSHINE-root');
      if(selector.indexOf('#MOONSHINE-root')===0)return selector;
      if(selector.indexOf(':root')===0)return selector.replace(':root','#MOONSHINE-root');
      return '#MOONSHINE-root '+selector;
    }
    function rules(list){return Array.from(list).map(function(rule){
      if(rule.type===1)return split(rule.selectorText).map(function(s){return convert(s);}).join(',')+'{'+LUNAR.api.moonshine.fonts.styles(rule.style)+'}';
      if(rule.type===4 || rule.type===12)return rule.cssText.slice(0,rule.cssText.indexOf('{')+1)+rules(rule.cssRules)+'}';
      if(rule.type===7)return rule.cssText;
      if(rule.type===5){var family=rule.cssText.match(/font-family\s*:\s*([^;]+)/i);return family&&LUNAR.api.moonshine.fonts.owns(family[1])?'':rule.cssText;} // Known embedded face already exists.
      return '';
    }).join('\n');}
    (resources||[]).forEach(function(sheet){css+=rules(sheet);});
    return css;
  }
window.MOONSHINE_STYLE_ADAPTER={convert:styles};})();
