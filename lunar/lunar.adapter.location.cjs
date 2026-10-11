/* Stable location DTOs. Native names and shapes stop at the bridge. */
(function(){'use strict';var L=window.LUNAR;
 function number(value){return Number.isFinite(Number(value))?Math.max(0,Math.round(Number(value))):0;}
 function nearby(value){return Object.freeze({id:value.id,name:String(value.name||''),subtitle:String(value.subtitle||''),portrait:String(value.portrait||''),hp:number(value.hp),maxHp:number(value.maxHp),affinity:number(value.affinity),collectedData:number(value.collectedData)});}
 L.adapter.location=Object.freeze({number:number,nearby:nearby});
})();
