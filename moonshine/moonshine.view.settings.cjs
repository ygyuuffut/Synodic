/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Portrait Settings page. Native desktop Settings remains untouched. */
(function () {
  "use strict";
  var tabs = [
    { id: "audio", icon: "AU", label: "Audio" },
    { id: "display", icon: "DS", label: "Display & UI" },
    { id: "effects", icon: "FX", label: "Effects" },
    { id: "developer", icon: "DV", label: "Developer" },
    { id: "reset", icon: "RE", label: "Reset" }
  ];
  var currentTab = "audio";

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
  }
  function call(name) {
    var fn = surface[name];
    if (typeof fn === "function") return fn.apply(surface, Array.prototype.slice.call(arguments, 1));
  }
  function slider(id, label, value, min, max, step) {
    var n = number(value, min);
    return '<label class="stg-ms-slider-group"><span class="stg-ms-row-label">' + label
      + '<output data-output="' + id + '">' + n + '</output></span>'
      + '<input type="range" data-range="' + id + '" aria-label="' + label
      + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + n + '"></label>';
  }
  function segment(id, label, choices, active, horizontal) {
    var index = choices.findIndex(function (choice) { return choice[0] === active; });
    if (index < 0) index = 0;
    var html = '<div class="stg-ms-segment-row' + (horizontal ? ' stg-ms-segment-row--inline' : '')
      + '"><span class="stg-ms-row-label">' + label + '</span>'
      + '<div class="stg-ms-segment" data-segment="' + id + '" style="--stg-ms-count:'
      + choices.length + ';--stg-ms-index:' + index + '"><span class="stg-ms-segment-indicator"></span>';
    choices.forEach(function (choice) {
      html += '<button type="button" data-choice="' + choice[0] + '" aria-pressed="'
        + (choice[0] === active) + '">' + choice[1] + '</button>';
    });
    return html + '</div></div>';
  }
  function action(id, label, danger, disabled) {
    return '<button type="button" class="stg-ms-action' + (danger ? ' stg-ms-action--danger' : '')
      + '" data-ms-action="' + id + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }
  function consentStored() {
    try { return LUNAR.api.moonshine.storage.getItem("stg_consent_v1") === "accepted"; }
    catch (error) { return false; }
  }
  function content(tab) {
    if (tab === "audio") {
      return segment("master", "Master Sound", [["off", "OFF"], ["on", "ON"]],
        surface.STG_MUTED ? "off" : "on", true)
        + slider("music", "Music", Number(surface.STG_VOLUME_MUSIC) * 100, 0, 100, 1)
        + slider("sfx", "Sound Effects", Number(surface.STG_VOLUME_SFX) * 100, 0, 100, 1);
    }
    if (tab === "display") {
      var zoom = number((surface._STG_ZOOM || 1) * 100, 100);
      var font = number((surface._STG_PROSE_SCALE || 1) * 100, 100);
      var textWidth = surface._STG_TEXT_WIDTH || "standard";
      var uiOn = viewDocument.body.getAttribute("data-tooltips-ui") !== "off";
      var cardOn = viewDocument.body.getAttribute("data-tooltips-card") !== "off";
      var condensed = typeof surface.stgGetBannerCondensed === "function"
        ? surface.stgGetBannerCondensed() : true;
      var auto = call("stgScaleMode") === "auto";
      return '<div data-ms-graphics-slot=""></div>' + slider("gradient", "Scene Gradient", call("stgGetBgiGradient"), 0, 100, 1)
        + slider("opacity", "Text Box Opacity", call("stgGetEncPanelOpacity"), 20, 100, 1)
        + '<div class="stg-ms-scale"><span class="stg-ms-row-label">UI Scale'
        + '<output data-output="scale">' + zoom + '</output></span>'
        + '<div class="stg-ms-scale-actions">'
        + '<button type="button" data-ms-action="scale-auto" class="' + (auto ? 'is-active' : '') + '">Auto</button>'
        + '<button type="button" data-ms-action="scale-up" aria-label="Increase UI Scale">+</button>'
        + '<button type="button" data-ms-action="scale-down" aria-label="Decrease UI Scale">−</button>'
        + '</div></div>'
        + slider("font", "Font Size", font, 70, 130, 5)
        + segment("width", "Text Width", [["standard", "Standard"], ["wide", "Wide"],
          ["ultrawide", "Ultra"]], textWidth, false)
        + segment("ui-tips", "UI Tooltips", [["off", "OFF"], ["on", "ON"]], uiOn ? "on" : "off", true)
        + segment("card-tips", "Card Tooltips", [["off", "OFF"], ["on", "ON"]], cardOn ? "on" : "off", true)
        + segment("banner", "Banner Icons", [["on", "Condensed"], ["off", "Expanded"]],
          condensed ? "on" : "off", true)
        + action("recommended", "Reset Scale to Recommended")
        + action("reset-ui", "Reset UI")
        + action("fullscreen", viewDocument.fullscreenElement ? "Exit Fullscreen" : "Enter Fullscreen");
    }
    if (tab === "effects") {
      var on = typeof surface.stgScreenFxEnabled === "function" ? surface.stgScreenFxEnabled() : true;
      return segment("shake", "Screen Shake", [["off", "OFF"], ["on", "ON"]],
        on ? "on" : "off", true);
    }
    if (tab === "developer") return action("dev", "Dev Features");
    return action("tutorials", "Reset Tutorials", true)
      + action("compendium", "Reset Compendium", true)
      + action("age", "Reset Age Confirmation", true, !consentStored())
      + action("factory", "Reset All to Default", true);
  }
  function setSegment(element, value) {
    var choices = Array.prototype.slice.call(element.querySelectorAll("[data-choice]"));
    choices.forEach(function (button, index) {
      var active = button.getAttribute("data-choice") === value;
      if (active) element.style.setProperty("--stg-ms-index", index);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function render(ui, preserveScroll) {
    var panel = ui.querySelector(".stg-ms-panel");
    var oldScroll = preserveScroll ? panel.scrollTop : 0;
    var index = tabs.findIndex(function (tab) { return tab.id === currentTab; });
    ui.querySelector(".stg-ms-tabs").style.setProperty("--stg-ms-tab", index);
    ui.querySelectorAll(".stg-ms-tab").forEach(function (button) {
      var selected = button.getAttribute("data-tab") === currentTab;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    panel.innerHTML = '<h2>' + tabs[index].label + '</h2><div class="stg-ms-options">'
      + content(currentTab) + '</div>';
    panel.scrollTop = oldScroll;
  }
  function handleChoice(element) {
    var id = element.getAttribute("data-segment");
    var value = element.querySelector('[aria-pressed="true"]').getAttribute("data-choice");
    if (id === "master") {
      if (!!surface.STG_MUTED !== (value === "off")) call("stgToggleMute");
    } else if (id === "width") call("stgSetTextWidth", value);
    else if (id === "ui-tips") call("stgSetTooltipKind", "ui", value);
    else if (id === "card-tips") call("stgSetTooltipKind", "card", value);
    else if (id === "banner") call("stgSetBannerCondensed", value === "on");
    else if (id === "shake") call("stgSetScreenFxEnabled", value === "on");
  }
  function resetAllToDefault() {
    try {
      LUNAR.api.moonshine.resetStorage();
    } catch (error) {
      surface.alert("Reset failed. Browser storage could not be cleared.");
      return;
    }
    // A fresh boot also resets the current in-memory run and reloads defaults.
    surface.location.reload();
  }
  function handleAction(id, ui) {
    if (id === "scale-auto") call("stgSetScaleMode", "auto");
    else if (id === "scale-up") { call("stgSetScaleMode", "manual"); call("stgZoomIn"); }
    else if (id === "scale-down") { call("stgSetScaleMode", "manual"); call("stgZoomOut"); }
    else if (id === "recommended") {
      MOONSHINE_DISPLAY.resetRecommended().then(function(){if(ui.isConnected){if(ui._stgRender)ui._stgRender();else render(ui,true);}});
      return;
    }
    else if (id === "reset-ui") call("stgResetUi");
    else if (id === "fullscreen") call("stgToggleFullscreen");
    else if (id === "dev") { call("stgOpenDevMenu"); return; }
    else if (id === "tutorials") call("stgResetTutorials");
    else if (id === "compendium") { call("stgResetCompendium"); return; }
    else if (id === "factory") {
      var title = "Reset All to Default?";
      var body = "This will delete all saved runs, Compendium discoveries, settings, and acknowledged warnings. This cannot be undone.";
      if (typeof surface.stgShowConfirmModal === "function") {
        surface.stgShowConfirmModal({ title: title, body: body,
          okLabel: "Reset All", cancelLabel: "Cancel", onConfirm: resetAllToDefault });
      } else if (surface.confirm(title + "\n\n" + body)) resetAllToDefault();
      return;
    }
    else if (id === "age") {
      if (typeof surface.stgShowConfirmModal === "function") {
        surface.stgShowConfirmModal({ title: "Reset Age Confirmation?",
          body: "The age confirmation will be requested again on the main menu.",
          okLabel: "Reset", cancelLabel: "Cancel", onConfirm: function () {
            call("stgMenuResetConsent");
          } });
      } else if (surface.confirm("Reset age confirmation?")) call("stgMenuResetConsent");
      return;
    }
    if (ui._stgRender) ui._stgRender();
    else render(ui, true);
  }
  function preserveMenuBackground(root, background) {
    var replacement = root.querySelector(":scope > .menu-bg");
    if (background && replacement) replacement.replaceWith(background);
  }
  async function returnToMenu(ui) {
    if(window.MOONSHINE_GRAPHICS_QUALITY)await MOONSHINE_GRAPHICS_QUALITY.exit();
    var root = viewDocument.getElementById("stg-menu-root");
    if (!root || !mobileMode() || surface.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      call("stgMenuBoot");
      return;
    }
    if (root.classList.contains("stg-ms-leaving")) return;
    var background = root.querySelector(":scope > .menu-bg");
    surface.STG_MOBILE_UI.afterAnimation(ui, function () {
      root.classList.remove("stg-ms-leaving");
      if (!root.isConnected || !ui.isConnected || !mobileMode()) return;
      call("stgMenuBoot");
      preserveMenuBackground(root, background);
      root.querySelectorAll(":scope > .menu-content, :scope > .menu-version").forEach(function (part) {
        part.classList.add("stg-ms-menu-arriving");
      });
    });
    root.classList.add("stg-ms-leaving");
  }
  function onClick(event) {
    var ui = event.currentTarget;
    var tab = event.target.closest(".stg-ms-tab");
    if (tab) { currentTab = tab.getAttribute("data-tab"); render(ui, false); return; }
    var choice = event.target.closest("[data-choice]");
    if (choice) {
      var group = choice.closest("[data-segment]");
      setSegment(group, choice.getAttribute("data-choice"));
      handleChoice(group);
      return;
    }
    var actionButton = event.target.closest("[data-ms-action]");
    if (actionButton) { handleAction(actionButton.getAttribute("data-ms-action"), ui); return; }
    if (event.target.closest(".stg-ms-back")) returnToMenu(ui);
  }
  function onInput(event) {
    var range = event.target.closest("[data-range]");
    if (!range) return;
    var id = range.getAttribute("data-range");
    var value = Number(range.value);
    var output = event.currentTarget.querySelector('[data-output="' + id + '"]');
    if (output) output.textContent = String(Math.round(value));
    if (id === "music") { call("stgSetVolumeMusic", value / 100); call("stgSetMuteMusic", value === 0); }
    else if (id === "sfx") { call("stgSetVolumeSfx", value / 100); call("stgSetMuteSfx", value === 0); }
    else if (id === "gradient") call("stgSetBgiGradient", value);
    else if (id === "opacity") call("stgSetEncPanelOpacity", value);
    else if (id === "font") call("stgSetProseScale", value / 100);
  }
  var syncZoom = surface.STG_MOBILE_UI.syncZoom;
  function mobileMode() {
    return !!(viewDocument.body && viewDocument.body.classList.contains("stg-mobile-ui") &&
      (!surface.STG_DISPLAY_CONFIG || surface.STG_DISPLAY_CONFIG.detectMode() === "mobile"));
  }
  function installMenuHook() {
    var original = surface.stgOpenSettings;
    if (typeof original !== "function" || original._stgMobileSettingsHook) return;
    var entering = false;
    var wrapped = function () {
      var root = viewDocument.getElementById("stg-menu-root");
      var menu = root && root.querySelector(":scope > .menu-content:not(.menu-content-settings)");
      if (!mobileMode() || !menu || surface.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        var result = original.apply(this, arguments);
        mount();
        return result;
      }
      if (entering) return;
      entering = true;
      var context = this;
      var args = arguments;
      var background = root.querySelector(":scope > .menu-bg");
      surface.STG_MOBILE_UI.afterAnimation(menu, function () {
        entering = false;
        root.classList.remove("stg-ms-entering");
        if (!root.isConnected || !menu.isConnected || !mobileMode()) return;
        original.apply(context, args);
        /* The game rebuilds the menu root; reuse its existing background so
           only the controls transition and the artwork stays uninterrupted. */
        preserveMenuBackground(root, background);
        mount();
      });
      root.classList.add("stg-ms-entering");
    };
    wrapped._stgMobileSettingsHook = true;
    surface.stgOpenSettings = wrapped;
  }
  function mount() {
    installMenuHook();
    if (!viewDocument.body || !viewDocument.body.classList.contains("stg-mobile-ui")) return;
    var root = viewDocument.querySelector("#stg-menu-root .menu-content-settings");
    if (!root) return;
    var existing = root.querySelector(".stg-mobile-settings-ui");
    if (existing) { syncZoom(existing); return; }
    root.classList.add("stg-mobile-settings-ready");
    var ui = viewDocument.createElement("div");
    ui.className = "stg-mobile-settings-ui";
    ui.innerHTML = '<h1>Settings</h1><div class="stg-ms-tabs" role="tablist" aria-label="Settings sections">'
      + '<span class="stg-ms-tab-indicator"></span>'
      + tabs.map(function (tab) {
        return '<button type="button" class="stg-ms-tab" role="tab" data-tab="' + tab.id
          + '" aria-label="' + tab.label + '">' + tab.icon + '</button>';
      }).join("")
      + '</div><div class="stg-ms-panel" role="tabpanel"></div>'
      + '<button type="button" class="stg-ms-back">Back</button>';
    ui.addEventListener("click", onClick);
    ui.addEventListener("input", onInput);
    root.appendChild(ui);
    syncZoom(ui);
    render(ui, false);
  }
  function cleanup() {
    var roots = viewDocument.querySelectorAll(".stg-mobile-settings-ready");
    roots.forEach(function (root) {
      root.classList.remove("stg-mobile-settings-ready");
      var ui = root.querySelector(".stg-mobile-settings-ui");
      if (ui) ui.remove();
    });
  }
  surface.STG_MOBILE_SETTINGS = { mount: mount, cleanup: cleanup,
    content: content, onInput: onInput, handleAction: handleAction,
    choose: function (button) {
      var group = button.closest('[data-segment]');
      setSegment(group, button.dataset.choice);
      handleChoice(group);
    } };
  installMenuHook();
})();

/* In-run mobile options: two pages, shared settings controls/native setters. */
(function () {
  'use strict';
  var root = null, page = 0, opener = null;
  function mobile() { return viewDocument.body.classList.contains('stg-mobile-ui'); }
  function close() {
    var committed=root&&window.MOONSHINE_GRAPHICS_QUALITY?MOONSHINE_GRAPHICS_QUALITY.exit():Promise.resolve();
    if (root) root.remove();
    root = null;
    if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.release('options');
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
    return committed;
  }
  function canSave() { return typeof surface.stgCanSave === 'function' && surface.stgCanSave(); }
  function confirmExit(kind) {
    var sheet = root;
    var original = surface.stgShowConfirmModal;
    // Keep the complete panel painted beneath the confirmation scrim.
    sheet.inert = true;
    surface.stgShowConfirmModal = function (options) {
      var confirm = options.onConfirm, cancel = options.onCancel;
      var result = original(Object.assign({}, options, {
        onCancel: function () {
          if (sheet.isConnected) { sheet.inert = false; sheet.querySelector('[data-ig="'+kind+'"]').focus(); }
          if (cancel) cancel();
        },
        onConfirm: async function () { await close(); if (confirm) confirm(); }
      }));
      var dialog = viewDocument.getElementById('stg-confirm-modal');
      if (dialog) dialog.classList.add('stg-ig-confirm');
      return result;
    };
    try { surface[kind === 'menu' ? 'stgConfirmExitToMenu' : 'stgConfirmQuit'](); }
    finally { surface.stgShowConfirmModal = original; }
  }
  function render() {
    if (!root) return;
    var panel = root.querySelector('.stg-ig-content');
    var api = surface.STG_MOBILE_SETTINGS;
    panel.innerHTML = '<h2>' + (page === 0 ? 'Audios' : 'Visuals') + '</h2><div class="stg-ms-options">'
      + api.content(page === 0 ? 'audio' : 'display') + (page === 1 ? api.content('effects') : '') + '</div>';
    panel.querySelectorAll('[data-segment="ui-tips"], [data-segment="card-tips"], [data-segment="banner"]')
      .forEach(function (node) { node.parentElement.remove(); });
    panel.scrollTop = 0;
    root.querySelector('[data-ig="save"]').disabled = !canSave();
    surface.STG_MOBILE_UI.syncZoom(root);
  }
  function open() {
    if (root) { close(); return; }
    opener = viewDocument.getElementById('stg-banner-menu-btn');
    page = 0;
    LUNAR.api.moonshine.fonts.load('symbol');
    root = viewDocument.createElement('div'); root.id = 'stg-mobile-ingame-options';
    root.innerHTML = '<section class="stg-ig-panel" role="dialog" aria-modal="true" aria-labelledby="stg-ig-title">'
      + '<header class="stg-ig-head"><button type="button" data-ig="prev" aria-label="Previous page"><span aria-hidden="true">◀</span></button>'
      + '<h1 id="stg-ig-title">In-Game Options</h1><button type="button" data-ig="next" aria-label="Next page"><span aria-hidden="true">▶</span></button></header>'
      + '<div class="stg-ig-content"></div><footer class="stg-ig-footer">'
      + '<div><button type="button" data-ig="menu">Main Menu</button><button type="button" data-ig="quit">Quit Game</button></div>'
      + '<button type="button" data-ig="save">Save and Load</button>'
      + '<button type="button" data-ig="close">Close</button></footer></section>';
    root._stgRender = render;
    viewDocument.body.appendChild(root);
    if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.acquire('options');
    render();
    root.addEventListener('input', surface.STG_MOBILE_SETTINGS.onInput);
    root.addEventListener('click', function (event) {
      var choice = event.target.closest('[data-choice]');
      if (choice) { surface.STG_MOBILE_SETTINGS.choose(choice); return; }
      var setting = event.target.closest('[data-ms-action]');
      if (setting) { surface.STG_MOBILE_SETTINGS.handleAction(setting.dataset.msAction, root); return; }
      var button = event.target.closest('[data-ig]');
      if (!button) { if (event.target === root) close(); return; }
      switch (button.dataset.ig) {
        case 'prev': case 'next': page = (page + 1) % 2; render(); break;
        case 'close': close(); break;
        case 'save': if (canSave()) {
          surface.stgOpenSlotPicker('save');
          if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.acquire('save');
          close();
        } else render(); break;
        case 'menu': case 'quit': confirmExit(button.dataset.ig); break;
      }
    });
    root.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
      if (event.key !== 'Tab') return;
      var nodes = Array.from(root.querySelectorAll('button:not(:disabled), input'));
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && viewDocument.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && viewDocument.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    root.querySelector('[data-ig="close"]').focus({ preventScroll: true });
  }
  function mount() {
    var original = surface.stgToggleBannerFlyout;
    if (typeof original === 'function' && !original._stgIngameOptions) {
      var wrapped = function () { if (mobile()) return open(); return original.apply(this, arguments); };
      wrapped._stgIngameOptions = true;
      surface.stgToggleBannerFlyout = wrapped;
    }
    if (root) {
      surface.STG_MOBILE_UI.syncZoom(root);
      root.querySelector('[data-ig="save"]').disabled = !canSave();
    }
  }
  viewDocument.addEventListener('fullscreenchange', function () { if (root) render(); });
  if (surface.jQuery) surface.jQuery(viewDocument).on(':passageinit.stgIngameOptions', close);
  surface.STG_MOBILE_INGAME_OPTIONS = { mount: mount, cleanup: close, open: open };
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
