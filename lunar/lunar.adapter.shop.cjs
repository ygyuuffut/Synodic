/* Pure save-point identity conversion. */
(function(){'use strict';var L=window.LUNAR;L.adapter.shop={};
L.adapter.shop.point=function(map){map=map||{};var node=map.currentNode==null?'merlin':map.currentNode;return String(map.currentSubmap||'lab')+':'+(typeof node==='object'?JSON.stringify(node):String(node));};
})();
