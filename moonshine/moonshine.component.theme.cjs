/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Shared presentation primitives. No game state or persistence ownership. */
(function () {
  "use strict";
  var families = [
    { id: "Chaos", label: "Chaotic", color: "#ff8878" },
    { id: "Grace", label: "Graceful", color: "#a0c0e8" },
    { id: "Worship", label: "Worship", color: "#e85aa0" },
    { id: "Harmony", label: "Harmonious", color: "#50c060" },
    { id: "Instinct", label: "Instinctual", color: "#e8932c" },
    { id: "Balance", label: "Balanced", color: "#c8a8f0" },
    { id: "Logic", label: "Logical", color: "#f4d878" },
    { id: "Item", label: "Item", color: "#c080e8" },
    { id: "Condition", label: "Condition", color: "#c08848" },
    { id: "Alpha", label: "Alpha", color: "#c9c9d4" }
  ];
  var familyColors = Object.fromEntries(families.map(function (family) {
    return [family.id, family.color];
  }));
  function syncZoom(element) {
    if (!element) return;
    var zoom = parseFloat(viewDocument.documentElement.style.zoom || "1") || 1;
    var inverse = String(1 / zoom);
    if (element.style.zoom !== inverse) element.style.zoom = inverse;
  }
  // Ignore descendant animations; finish once even if CSS animations are disabled.
  function afterAnimation(element, callback, timeout) {
    var finished = false;
    var timer;
    function finish(event) {
      if (event && event.target !== element) return;
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      element.removeEventListener("animationend", finish);
      callback();
    }
    element.addEventListener("animationend", finish);
    timer = setTimeout(finish, timeout == null ? 250 : timeout);
  }
  // Compatibility facades use the public logical resource API.
  function loadNotoSans() { return LUNAR.api.moonshine.fonts.load('ui'); }
  function loadNotoEmoji() { return LUNAR.api.moonshine.fonts.load('emoji'); }
  surface.STG_MOBILE_UI = { families: families, familyColors: familyColors,
    syncZoom: syncZoom, afterAnimation: afterAnimation,
    loadNotoEmoji: loadNotoEmoji, loadNotoSans: loadNotoSans };
  window.MOONSHINE_THEME=Object.freeze({familyColors:Object.freeze(familyColors)});
  // Retain the existing public alias for extensions.
  surface.STG_MOBILE_CARD_FAMILY_COLORS = familyColors;
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
