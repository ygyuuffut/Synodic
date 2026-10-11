/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Portrait main-menu presentation. The game still creates its buttons and
   owns navigation, save detection, consent, music and background art. */
(function () {
  "use strict";

  var labels = [
    ["continue", "Continue Run", "continue"],
    ["new-run", "New Run", "new-run"],
    ["load", "Load", "load"],
    ["start", "Start Run", "start"],
    ["compendium", "Compendium", "compendium"],
    ["settings", "Settings", "settings"],
    ["credits", "Credits", "credits"],
    ["quit", "Quit", "quit"]
  ];

  function menuContent() {
    var root = viewDocument.getElementById("stg-menu-root");
    var content = root && root.querySelector(":scope > .menu-content:not(.menu-content-settings)");
    return content && content.querySelector(".menu-title-accent") ? content : null;
  }
  function restore() {
    var content = menuContent();
    if (!content || !content.classList.contains("stg-mobile-main-menu")) return;
    var version = content.parentElement.querySelector(":scope > .menu-version");
    content.classList.remove("stg-mobile-main-menu", "stg-mobile-main-menu--returning");
    content.style.zoom = content._stgMobileMenuOriginalZoom;
    delete content._stgMobileMenuOriginalZoom;
    if (version && version._stgMobileMenuOriginalZoom !== undefined) {
      version.style.zoom = version._stgMobileMenuOriginalZoom;
      delete version._stgMobileMenuOriginalZoom;
    }
    content.querySelectorAll(".menu-btn[data-stg-mobile-menu-role]").forEach(function (button) {
      if (button._stgMobileMenuOriginalHtml !== undefined) {
        button.innerHTML = button._stgMobileMenuOriginalHtml;
        delete button._stgMobileMenuOriginalHtml;
      }
      button.removeAttribute("data-stg-mobile-menu-role");
    });
  }
  function decorate() {
    var content = menuContent();
    if (!content) return;
    if (!viewDocument.body || !viewDocument.body.classList.contains("stg-mobile-portrait")) {
      restore();
      return;
    }
    var returning = false;
    var version = content.parentElement.querySelector(":scope > .menu-version");
    if (content._stgMobileMenuOriginalZoom === undefined) {
      content._stgMobileMenuOriginalZoom = content.style.zoom;
    }
    surface.STG_MOBILE_UI.syncZoom(content);
    if (version) {
      if (version._stgMobileMenuOriginalZoom === undefined) {
        version._stgMobileMenuOriginalZoom = version.style.zoom;
      }
      surface.STG_MOBILE_UI.syncZoom(version);
    }
    content.querySelectorAll(".menu-buttons .menu-btn").forEach(function (button) {
      var action = button.getAttribute("data-lunar-menu-action") || "";
      var item = labels.find(function (entry) { return action.indexOf(entry[0]) !== -1; });
      if (!item) return;
      if (button._stgMobileMenuOriginalHtml === undefined) {
        button._stgMobileMenuOriginalHtml = button.innerHTML;
      }
      button.textContent = item[1];
      button.setAttribute("data-stg-mobile-menu-role", item[2]);
      if (item[2] === "continue") returning = true;
    });
    content.classList.add("stg-mobile-main-menu");
    content.classList.toggle("stg-mobile-main-menu--returning", returning);
  }
  function installHook() {
    var original = surface.stgMenuBoot;
    if (typeof original !== "function" || original._stgMobileMainMenuHook) return;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      decorate();
      return result;
    };
    wrapped._stgMobileMainMenuHook = true;
    surface.stgMenuBoot = wrapped;
  }
  surface.STG_MOBILE_MAIN_MENU = { mount: function () { installHook(); decorate(); }, cleanup: restore };
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
