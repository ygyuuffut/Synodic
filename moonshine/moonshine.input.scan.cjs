/* Own scanner events before native document shortcuts see them. */
(function(){'use strict';
 function bind(root,handle){function route(event){if(!root.contains(event.target))return;event.stopImmediatePropagation();if(event.type==='click'||event.type==='keydown')handle(event);}
  var events=['click','keydown','pointerdown','pointerup','mousedown','mouseup'];events.forEach(function(type){window.addEventListener(type,route,true);});return function(){events.forEach(function(type){window.removeEventListener(type,route,true);});};
 }
 window.MOONSHINE_SCAN_INPUT=Object.freeze({bind:bind});
})();
