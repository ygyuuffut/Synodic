(function () {
  'use strict';
  var L=window.LUNAR, B=L.buffer;
L.bridge.shop={};
 L.bridge.shop.install=function(){
    var shopBoot=window.stgUpgradeBoot;
    if(typeof shopBoot==='function' && !shopBoot._lunarBuffer){
      var wrappedShop=function(){
        if(STG_DISPLAY_CONFIG.detectMode()!=='mobile')return shopBoot.apply(this,arguments);
        var g=window._STG||{},map=g.mapState||{};
        var point=L.adapter.shop.point(map);
        var cached=B.shop.read(point,'merlin');
        if(cached && !window._stgUpgradePicks){
          window._stgUpgradePicks=cached.offers.filter(function(offer){return (g.ownedBoons||[]).indexOf(offer.id)<0;}).map(function(offer){return (window.STG_BOONS||[]).find(function(boon){return boon.id===offer.id;});});
          window._stgUpgradeCosts=cached.offers.filter(function(offer){return (g.ownedBoons||[]).indexOf(offer.id)<0;}).map(function(offer){return offer.price;});
          window._stgUpgradeSelectedIdx=-1;window._stgMerlinLine=cached.line;
        }
        var result=shopBoot.apply(this,arguments);
        B.shop.freeze(point,'merlin',function(){return {offers:L.adapter.data.shop(window._stgUpgradePicks||[],window._stgUpgradeCosts||[]),point:point,line:window._stgMerlinLine};});
        return result;
      };
      Object.assign(wrappedShop,shopBoot);wrappedShop._lunarBuffer=true;window.stgUpgradeBoot=wrappedShop;
    }

};
  L.bridge.interfaces.register('shop.select',function(boonId){var index=(window._stgUpgradePicks||[]).findIndex(function(boon){return boon.id===boonId;});if(index>=0)return L.bridge.native.call('stgUpgradeSelect',index);});
  L.bridge.interfaces.register('shop.confirm',function(){return L.bridge.native.call('stgUpgradeConfirm');});
  L.bridge.interfaces.register('shop.view',function(point,shop){var fixed=B.shop.read(point,shop);if(!fixed)return null;var game=B.game.read('current')||{};return {point:point,line:fixed.line,offers:fixed.offers.map(function(offer){return Object.assign({},offer,{owned:(game.ownedBoons||[]).indexOf(offer.id)>=0,affordable:((game.player||{}).data||0)>=offer.price});})};});
})();
