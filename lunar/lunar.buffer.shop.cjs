(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer;
 B.shop={read:function(point,id){return B.read('shop',point+'|'+id);},freeze:function(point,id,create){return B.once('shop',point+'|'+id,create);},invalidate:function(point,id){B.invalidate('shop',point+'|'+id);}};

})();
