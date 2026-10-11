/* Upstream vocabulary ends here. Geometry and paint belong to MOONSHINE. */
(function(){'use strict';var L=window.LUNAR;
 var types={spawn:'nav.entry',entry:'nav.entry',vent:'nav.vent',exit:'nav.exit',combat:'combat.normal',boss:'combat.boss',event:'event.normal',special:'event.special',chest:'upgrade',upgrade:'upgrade',rest:'rest',void:'void',ev_grace:'logic.safe',ev_chaos:'logic.dangerous',ev_harmony:'logic.restorative',ev_balance:'logic.gamble',pyl:'logic.pylorus',pylorus:'logic.pylorus',arc:'event.special',merlin:'upgrade',explore:'event.normal'};
 var labels={'nav.entry':'Entrance','nav.exit':'Door','nav.vent':'Vent / Tunnel','combat.normal':'Encounter','combat.boss':'Boss','event.normal':'Event','event.special':'Special Event',rest:'Rest',upgrade:'Upgrade',void:'Void','logic.safe':'Safe','logic.dangerous':'Dangerous','logic.restorative':'Restorative','logic.gamble':'Gamble','logic.pylorus':'Pylorus',unknown:'Undefined'};
 function visual(type,boss,profile,key){if(profile==='stomach.logic'&&key==='pyl')return 'logic.pylorus';return type==='combat'&&boss?'combat.boss':types[type]||'unknown';}
 function direction(value,x,width){return /^(left|right|up|down)$/.test(value)?value:x>width/2?'right':'left';}
 L.adapter.map=Object.freeze({visual:visual,direction:direction,label:function(key){return labels[key]||labels.unknown;}});
})();
