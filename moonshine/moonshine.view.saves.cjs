/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Mobile save picker presentation. Native save serialization and actions own data. */
(function () {
  "use strict";
  var expanded = null;
  var renamePrompt = null;
  var autosaveSubscription = null;
  var onAutosave = null; // Reserved for the later in-game autosave notice.
  var HEIGHT_MS = 280;
  var FADE_MS = 140;
  function mobile() { return viewDocument.body && viewDocument.body.classList.contains("stg-mobile-portrait"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
  }); }
  function symbol(glyph, name) {
    return '<span class="stg-msave-symbol" aria-hidden="true" title="' + esc(name) + '"><span class="stg-msave-symbol-glyph">' + glyph + '</span></span>';
  }
  function nativeAction(overlay, action, index) {
    var original = overlay.querySelector('.stg-slot-modal:not(.stg-msave-panel)');
    var button = original && original.querySelector('[data-action="' + action + '"][data-slot="' + index + '"]');
    if (button) button.click();
  }
  function autoExport() {
    var payload = surface.stgReadAutosave && surface.stgReadAutosave();
    if (!payload) return false;
    var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = viewDocument.createElement("a");
    a.href = url;
    a.download = "slay-the-giantess-autosave-" + new Date(payload.ts || Date.now()).toISOString().replace(/[:.]/g,"-") + ".json";
    viewDocument.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }
  function autoLoad() { return LUNAR.api.moonshine.saves.loadAutosave(); }
  function renameNative(overlay, index) {
    nativeAction(overlay, "rename", index);
    var prompt = viewDocument.getElementById("stg-confirm-modal");
    if (!prompt || !prompt.querySelector("#stg-prompt-input")) return;
    var box = prompt.firstElementChild;
    var title = box && box.firstElementChild;
    if (!title) return;
    var input = prompt.querySelector("#stg-prompt-input");
    var okButton = prompt.querySelector("#stg-prompt-ok");
    var actions = okButton && okButton.parentElement;
    if (!input || !okButton || !actions) return;
    var entry = viewDocument.createElement("div");
    entry.className = "stg-msave-rename-entry";
    input.parentElement.insertBefore(entry, input);
    entry.appendChild(input);
    entry.appendChild(okButton);
    renamePrompt = { prompt:prompt, title:title, original:title.textContent, originalZoom:prompt.style.zoom,
      entry:entry, input:input, okButton:okButton, actions:actions, okAria:okButton.getAttribute("aria-label") };
    if (surface.STG_MOBILE_UI) surface.STG_MOBILE_UI.syncZoom(prompt);
    title.textContent = "Renaming to...";
    prompt.classList.add("stg-msave-rename");
    var ok = prompt.querySelector("#stg-prompt-ok .stg-consent-btn-label");
    if (ok) { ok.dataset.original = ok.textContent; ok.replaceChildren(MOONSHINE_TEXT_PROMPT.chevron(viewDocument)); }
    okButton.setAttribute("aria-label", "Save Name");
  }
  function restorePrompt() {
    if (!renamePrompt) return;
    var p = renamePrompt;
    if (p.prompt.isConnected) {
      p.prompt.classList.remove("stg-msave-rename");
      p.prompt.style.zoom = p.originalZoom;
      p.title.textContent = p.original;
      if (p.okAria === null) p.okButton.removeAttribute("aria-label"); else p.okButton.setAttribute("aria-label", p.okAria);
      var ok = p.prompt.querySelector("#stg-prompt-ok .stg-consent-btn-label");
      if (ok && ok.dataset.original) { ok.textContent = ok.dataset.original; delete ok.dataset.original; }
      p.entry.replaceWith(p.input);
      p.actions.insertBefore(p.okButton, p.actions.firstChild);
    }
    renamePrompt = null;
  }
  function payloadMeta(payload) {
    return payload && typeof surface.stgBuildSaveMeta === "function" ? surface.stgBuildSaveMeta(payload) : {};
  }
  function pill(icon, title, value, cls) {
    return '<div class="stg-msave-stat ' + (cls || "") + '" title="' + esc(title) + '">' + symbol(icon, title)
      + '<span class="stg-msave-value">' + esc(value) + '</span></div>';
  }
  function detail(payload, auto, index, mode) {
    if (!payload) return '<div class="stg-msave-empty-detail">No save in this slot.</div><div class="stg-msave-actions">'
      + (auto ? "" : mode === "save" ? '<button type="button" data-msave-action="overwrite" data-index="' + index + '">Save Here</button>'
        : '<button type="button" data-msave-action="importTo" data-index="' + index + '">Import</button>') + '</div>';
    var m = payloadMeta(payload), f = m.fetish || {};
    var hp = Number(m.hp) || 0, max = Number(m.maxHp) || 0;
    var chaos = Number(m.chaos) || 0, grace = Number(m.grace) || 0;
    var align = chaos > grace ? "chaos" : grace > chaos ? "grace" : "neutral";
    var alignValue = Math.abs(chaos - grace);
    var primary = mode === "save" && !auto ? "overwrite" : "load";
    var primaryText = primary === "overwrite" ? "Overwrite" : "Load";
    return '<div class="stg-msave-floor">Floor ' + esc(m.floor || 1) + '</div>'
      + '<div class="stg-msave-metrics">'
      + '<div class="stg-msave-hp"><b>HP</b><span><em>' + esc(hp) + '</em><strong>' + esc(max) + '</strong></span></div>'
      + pill("🃏", "Deck", m.deckSize || 0, "stg-msave-deck")
      + pill("🧭", "Alignment", alignValue, "stg-msave-alignment stg-msave-alignment--" + align)
      + pill("📂", "Data", m.data || 0, "stg-msave-data")
      + '</div><div class="stg-msave-fetishes">'
      + pill("🍑", "B — Butt", f.butt || 0) + pill("🫦", "M — Mouth", f.mouth || 0)
      + pill("🌸", "P — Pussy", f.pussy || 0) + pill("🦶", "F — Feet", f.feet || 0)
      + '</div><div class="stg-msave-actions' + (auto ? ' stg-msave-actions--auto' : '') + '">'
      + '<button type="button" class="stg-msave-primary" data-msave-action="' + primary + '" data-index="' + index + '">' + primaryText + '</button>'
      + (auto ? '' : '<button type="button" class="stg-msave-delete" data-msave-action="delete" data-index="' + index + '" aria-label="Delete Slot ' + (index+1) + '">' + symbol("🗑", "Delete") + '</button>')
      + '<button type="button" class="stg-msave-export" data-msave-action="export" data-index="' + index + '">Export</button>'
      + (mode === "save" && !auto ? '<button type="button" class="stg-msave-secondary-load" data-msave-action="load" data-index="' + index + '">Load</button>' : "")
      + '</div>';
  }
  function card(payload, auto, index, mode) {
    var key = auto ? "auto" : String(index);
    var open = key === expanded;
    var title = auto ? "Autosave" : payload && String(payload.saveName || "").trim() || "Slot " + (index + 1);
    var ts = payload && typeof surface.stgFormatSaveTs === "function" ? surface.stgFormatSaveTs(payload.ts) : "";
    return '<article class="stg-msave-card' + (open ? ' stg-msave-card--open stg-msave-card--selected stg-msave-card--revealed' : '') + (payload ? ' stg-msave-card--filled' : '') + '" data-msave-key="' + key + '">'
      + '<div class="stg-msave-card-head">'
      + '<button type="button" class="stg-msave-toggle" data-msave-action="toggle" data-key="' + key + '" aria-expanded="' + open + '" title="' + esc(title) + '"><span class="stg-msave-name">' + esc(title) + '</span></button>'
      + (payload && !auto ? '<button type="button" class="stg-msave-rename" data-msave-action="rename" data-index="' + index + '" aria-label="Rename Slot ' + (index+1) + '">' + symbol("✎", "Rename") + '</button>' : '')
      + (ts ? '<time class="stg-msave-time">' + esc(ts) + '</time>' : '')
      + '</div><div class="stg-msave-detail" id="stg-msave-detail-' + key + '" ' + (open ? '' : 'inert') + '><div class="stg-msave-detail-inner">'
      + detail(payload, auto, index, mode) + '</div></div></article>';
  }
  function fitNames(panel) {
    // Center the visible ink, not the emoji font's asymmetric line box.
    var context = viewDocument.createElement('canvas').getContext('2d');
    panel.querySelectorAll('.stg-msave-fetishes .stg-msave-symbol-glyph').forEach(function (glyph) {
      var style = getComputedStyle(glyph);
      context.font = '400 ' + style.fontSize + ' ' + style.fontFamily;
      var m = context.measureText(glyph.textContent);
      var x = (m.width + m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
      var y = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent
        - m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 2;
      if (Number.isFinite(x) && Number.isFinite(y)) glyph.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    panel.querySelectorAll(".stg-msave-name").forEach(function (name) {
      name.style.fontSize = "";
      if (name.scrollWidth <= name.clientWidth + 1) return;
      var base = parseFloat(getComputedStyle(name.parentElement).fontSize) || 28;
      name.style.fontSize = Math.max(17, Math.floor(base * name.clientWidth / name.scrollWidth)) + "px";
    });
  }
  function animateCardHeight(item, from) {
    var to = item.getBoundingClientRect().height;
    if (!item.animate || surface.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(to - from) < 1) return Promise.resolve();
    var frames = [{ height: from + "px" }, { height: to + "px" }];
    if (to < from) {
      // Keep the expanded outline rounded until the card reaches pill height.
      frames[0].borderRadius = frames[1].borderRadius = "20px";
    }
    var animation = item.animate(frames, {
      duration: HEIGHT_MS, easing: "cubic-bezier(.4,0,.2,1)"
    });
    item._stgMsHeightAnimation = animation;
    return new Promise(function (resolve) {
      function done() {
        if (item._stgMsHeightAnimation === animation) item._stgMsHeightAnimation = null;
        resolve();
      }
      animation.addEventListener("finish", done, { once:true });
      animation.addEventListener("cancel", done, { once:true });
    });
  }
  function fadePause() {
    if (surface.matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
    return new Promise(function (resolve) { setTimeout(resolve, FADE_MS); });
  }
  function setSelected(item, selected) {
    item.classList.toggle("stg-msave-card--selected", selected);
    item.querySelector(".stg-msave-toggle").setAttribute("aria-expanded", String(selected));
  }
  function runCardTransitions(panel, state) {
    if (state.running) return;
    state.running = true;
    (async function () {
      try {
        while (panel.isConnected && state.active !== state.requested) {
          if (state.active !== null) {
            var closing = panel.querySelector('.stg-msave-card[data-msave-key="' + state.active + '"]');
            if (!closing) { state.active = expanded = null; continue; }
            setSelected(closing, false);
            closing.querySelector(".stg-msave-detail").inert = true;
            closing.classList.remove("stg-msave-card--revealed");
            await fadePause();
            if (!panel.isConnected) break;
            var from = closing.getBoundingClientRect().height;
            closing.classList.remove("stg-msave-card--open");
            await animateCardHeight(closing, from);
            if (!panel.isConnected) break;
            state.active = expanded = null;
          } else {
            var key = state.requested;
            var opening = panel.querySelector('.stg-msave-card[data-msave-key="' + key + '"]');
            if (!opening) { state.requested = null; break; }
            state.active = expanded = key;
            var start = opening.getBoundingClientRect().height;
            setSelected(opening, true);
            opening.classList.add("stg-msave-card--open");
            await animateCardHeight(opening, start);
            if (!panel.isConnected) break;
            opening.classList.add("stg-msave-card--revealed");
            await fadePause();
            if (!panel.isConnected) break;
            opening.querySelector(".stg-msave-detail").inert = false;
          }
        }
      } catch (error) {
        state.requested = state.active;
        throw error;
      } finally {
        state.running = false;
        if (panel.isConnected && state.active !== state.requested) runCardTransitions(panel, state);
      }
    })();
  }
  function render(overlay) {
    if (!mobile() || !overlay) return;
    var original = overlay.querySelector(".stg-slot-modal:not(.stg-msave-panel)");
    if (!original) return;
    overlay.classList.add("stg-mobile-slot-picker");
    var previous = overlay.querySelector(".stg-msave-panel");
    if (previous) previous.remove();
    var mode = surface._stgSlotPickerMode || "load";
    var autosave = surface.stgReadAutosave && surface.stgReadAutosave();
    var slots = surface.stgListSaveSlots ? surface.stgListSaveSlots() : [];
    if (expanded !== "auto" && (Number(expanded) >= slots.length || expanded == null)) expanded = null;
    var panel = viewDocument.createElement("section");
    panel.className = "stg-msave-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", mode === "save" ? "Save Run" : "Load Run");
    panel.innerHTML = '<h2>' + (mode === "save" ? "Save Run" : "Load Run") + '</h2>'
      + '<div class="stg-msave-list">' + card(autosave, true, -1, mode)
      + slots.map(function (s, i) { return card(s, false, i, mode); }).join("") + '</div>'
      + '<button type="button" class="stg-msave-close" data-msave-action="close">Close</button>';
    overlay.appendChild(panel);
    var transitionState = { active:expanded, requested:expanded, running:false };
    fitNames(panel);
    if (surface.STG_MOBILE_UI) surface.STG_MOBILE_UI.syncZoom(overlay);
    if (surface.STG_MOBILE_UI && surface.STG_MOBILE_UI.loadNotoEmoji) surface.STG_MOBILE_UI.loadNotoEmoji().then(function () {
      if (panel.isConnected) fitNames(panel);
    });
    if (surface.STG_MOBILE_UI && surface.STG_MOBILE_UI.loadNotoSans) surface.STG_MOBILE_UI.loadNotoSans();
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("[data-msave-action]");
      if (!button) return;
      var action = button.dataset.msaveAction, index = Number(button.dataset.index);
      if (action === "close") { surface.stgCloseSlotPicker(); return; }
      if (action === "toggle") {
        transitionState.requested = transitionState.requested === button.dataset.key ? null : button.dataset.key;
        runCardTransitions(panel, transitionState);
        return;
      }
      if (action === "rename") { renameNative(overlay, index); return; }
      if (button.closest(".stg-msave-card") && button.closest(".stg-msave-card").dataset.msaveKey === "auto") {
        if (action === "load" && autosave) autoLoad();
        else if (action === "export") autoExport();
        return;
      }
      nativeAction(overlay, action, index);
    });
  }
  function restore() {
    restorePrompt();
    var overlay = viewDocument.getElementById("stg-slot-picker");
    if (!overlay) return;
    var panel = overlay.querySelector(".stg-msave-panel");
    if (panel) panel.remove();
    overlay.classList.remove("stg-mobile-slot-picker");
    overlay.style.zoom = "";
  }
  function mount() {
    if (!mobile()) { restore(); return; }
    var nativeOpen = surface.stgOpenSlotPicker;
    if (typeof nativeOpen === "function" && !nativeOpen._stgMobileSaves) {
      var hookedOpen = function () {
        if (!viewDocument.getElementById("stg-slot-picker")) expanded = null;
        var result = nativeOpen.apply(this, arguments);
        render(viewDocument.getElementById("stg-slot-picker"));
        return result;
      };
      hookedOpen._stgMobileSaves = true;
      surface.stgOpenSlotPicker = hookedOpen;
    }
    if (!autosaveSubscription) autosaveSubscription=LUNAR.api.moonshine.saves.subscribeAutosave(function () {
      if (mobile() && typeof onAutosave === "function") onAutosave(surface.stgReadAutosave && surface.stgReadAutosave());
      var overlay = viewDocument.getElementById("stg-slot-picker");
      if (overlay && mobile()) render(overlay);
    });

    var overlay = viewDocument.getElementById("stg-slot-picker");
    if (overlay && !overlay.classList.contains("stg-mobile-slot-picker")) render(overlay);
  }
  surface.addEventListener("resize", function () {
    var panel = viewDocument.querySelector("#stg-slot-picker .stg-msave-panel");
    if (panel) fitNames(panel);
    if (renamePrompt && renamePrompt.prompt.isConnected) surface.requestAnimationFrame(function () {
      surface.requestAnimationFrame(function () {
        if (renamePrompt && renamePrompt.prompt.isConnected && mobile() && surface.STG_MOBILE_UI) {
          surface.STG_MOBILE_UI.syncZoom(renamePrompt.prompt);
        }
      });
    });
  });
  LUNAR.api.moonshine.fonts.subscribe(function (value) {
    if(!["ui", "mono", "emoji"].includes(value.role))return;
    var panel = viewDocument.querySelector("#stg-slot-picker .stg-msave-panel");
    if (panel) fitNames(panel);
  });
  surface.STG_MOBILE_SAVES = { mount:mount, cleanup:restore,
    setAutosaveNotice: function (callback) { onAutosave = typeof callback === "function" ? callback : null; } };
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
