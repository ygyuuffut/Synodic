/* Current sequence only: bounded requests/cancellation belong to LUNAR. */
(function(){'use strict';var api=LUNAR.api.moonshine,sequence=null;
 function refresh(){var plan=api.resources.encounter();if(!plan){if(sequence!==null)api.assets.cancelOwner('encounter-prefetch');sequence=null;return;}if(sequence===plan.id)return;api.assets.cancelOwner('encounter-prefetch');sequence=plan.id;plan.urls.forEach(function(url){api.assets.request(url,'story','encounter-prefetch').catch(function(){/* Existing scene fallback remains usable. */});});}
 window.MOONSHINE_ENCOUNTER_ASSETS={refresh:refresh};
})();
