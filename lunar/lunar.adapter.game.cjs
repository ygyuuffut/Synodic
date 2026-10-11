/* Stable downstream game schema; source-specific names stay inside this adapter. */
(function(){'use strict';var L=window.LUNAR;
L.adapter.game={normalize:function(raw,scope){if(!raw)return null;var player=raw.player||{},map=raw.mapState||{};return {schema:1,run:scope,player:L.adapter.data.snapshot(player),inventory:{deck:L.adapter.data.snapshot(raw.masterDeck||player.deck||raw.deck||[]),upgrades:L.adapter.data.snapshot(raw.ownedBoons||[])},alignment:{chaos:L.adapter.data.number(player.chaos),grace:L.adapter.data.number(player.grace)},preferences:L.adapter.data.snapshot(raw.fetish||{}),location:L.adapter.data.snapshot(map),combat:L.adapter.data.snapshot(raw.combat||null),nativeSnapshot:L.adapter.data.snapshot(raw)};}};
})();
