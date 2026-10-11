/* Native visual intent only. MOONSHINE owns scheduling and all motion. */
(function(){'use strict';var L=window.LUNAR,listeners=new Set(),log=L.logger.scope('LUNAR.effects');
 function enabled(){return typeof window.stgScreenFxEnabled!=='function'||window.stgScreenFxEnabled();}
 function emit(target){var transition=L.transitions.status(),value=Object.freeze({target:target,transition:transition.id,scope:L.buffer.getScope()});if(transition.kind!=='silent')log.info('EFFECT_DEFERRED',{target:target,transition:transition.id});listeners.forEach(function(fn){fn(value);});}
 function install(){
  var select=window.stgSelectCharacter;if(typeof select==='function'&&!select._lunarEffects){var wrapped=function(id){var result=select.apply(this,arguments);if(STG_DISPLAY_CONFIG.detectMode()==='mobile'&&window._stgSelectedCharId===id&&enabled())emit('character');return result;};Object.assign(wrapped,select);wrapped._lunarEffects=true;window.stgSelectCharacter=wrapped;}
  var shake=window.stgShake;if(typeof shake==='function'&&!shake._lunarEffects){var wrapper=function(){if(STG_DISPLAY_CONFIG.detectMode()!=='mobile')return shake.apply(this,arguments);if(enabled())emit('combat');};Object.assign(wrapper,shake);wrapper._lunarEffects=true;window.stgShake=wrapper;}
 }
 // Declared page-level SFX class only; bridge emits intent, never motion.
 function pageCue(before,after){if(STG_DISPLAY_CONFIG.detectMode()==='mobile'&&enabled()&&!before.includes('stg-screen-shake')&&after.includes('stg-screen-shake'))emit('background');}
 L.bridge.effects=Object.freeze({install:install,pageCue:pageCue,subscribe:function(fn){listeners.add(fn);return function(){listeners.delete(fn);};}});
})();
