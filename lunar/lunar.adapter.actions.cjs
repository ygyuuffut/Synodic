/* Translate public action names/payloads. Conversion cannot execute commands. */
(function(){'use strict';var L=window.LUNAR;
var routes=Object.freeze({'art.view':'stgToggleViewArt','run.start':'stgStartNewGame','navigation.scene':'stgGoTo','navigation.confirmMenu':'stgConfirmExitToMenu','navigation.confirmQuit':'stgConfirmQuit','character.select':'stgSelectCharacter','story.arcChoice':'stgArcChoose','story.skip':'stgSkipTypewriter','cards.inspect':'stgShowCardView','saves.open':'stgOpenSlotPicker','saves.close':'stgCloseSlotPicker','audio.toggleMute':'stgToggleMute'});
L.adapter.actions={translate:function(action,args){var name=routes[action];if(!name)throw new Error('Unsupported LUNAR action: '+action);return {nativeName:name,args:L.adapter.data.snapshot(args||[])};},list:function(){return Object.keys(routes);}};
})();
