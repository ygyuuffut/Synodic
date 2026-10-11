(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer;
B.game={read:function(id){return B.read('game',id);},write:function(id,value){return B.write('game',id,value);},invalidate:function(id){B.invalidate('game',id);}};
})();
