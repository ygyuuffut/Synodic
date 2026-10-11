/* Whole paragraphs in normal DOM; no character spans or cloned text for effects. */
(function(){'use strict';
 function prepare(root){
  var id=root.getAttribute('data-lunar-story-id');if(!id||root._moonshineProseId===id)return;
  root._moonshineProseId=id;root.setAttribute('translate','yes');
  root.querySelectorAll('[data-moonshine-paragraph]').forEach(function(p){if(p.dataset.moonshineParagraphWrapper){p.replaceWith(...p.childNodes);}else p.removeAttribute('data-moonshine-paragraph');});
  var index=0;
  function split(parent){
   var nodes=Array.from(parent.childNodes),group=[];
   function flush(){if(!group.length)return;if(group.some(function(n){return n.nodeType===1||n.textContent.trim();})){var part=document.createElement('span');part.setAttribute('data-moonshine-paragraph',String(index++));part.dataset.moonshineParagraphWrapper='true';parent.insertBefore(part,group[0]);group.forEach(function(n){part.appendChild(n);});}group=[];}
   function neighbour(node,direction){var next=node[direction];while(next&&next.nodeType===3&&!next.textContent.trim())next=next[direction];return next;}
   nodes.forEach(function(node){
    if(node.nodeType===1&&node.querySelector('br + br,p,div,blockquote')){flush();split(node);return;}
    if(node.nodeType===1&&/^(P|DIV|UL|OL|BLOCKQUOTE|H[1-6])$/.test(node.tagName)){flush();node.setAttribute('data-moonshine-paragraph',String(index++));return;}
    if(node.nodeType===1&&node.tagName==='BR'){
     var prior=neighbour(node,'previousSibling'),next=neighbour(node,'nextSibling');
     if((prior&&prior.nodeName==='BR')||(next&&next.nodeName==='BR')){flush();return;}
    }
    group.push(node);
   });flush();
  }
  split(root);
 }
 window.MOONSHINE_PROSE_COMPONENT={prepare:prepare};
})();
