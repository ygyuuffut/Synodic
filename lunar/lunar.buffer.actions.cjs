/* Exchange data only: fixed offers, staged selections and transaction receipts. */
(function(){'use strict';var B=window.LUNAR.buffer;
 B.actions={
  read:function(){return B.read('presentation','actions');},
  publish:function(value){return B.write('presentation','actions',value);},
  group:function(id,create){return create?B.once('shop','actions:'+id,create):B.read('shop','actions:'+id);},
  update:function(id,patch){var value=B.actions.group(id);return value?B.write('shop','actions:'+id,Object.assign(value,patch)):null;}
 };
})();
