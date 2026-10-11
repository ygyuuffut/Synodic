(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer;
['presentation','ui'].forEach(function(domain){B[domain]={read:function(id){return B.read(domain,id);},write:function(id,value){return B.write(domain,id,value);},invalidate:function(id){B.invalidate(domain,id);}};});
})();
