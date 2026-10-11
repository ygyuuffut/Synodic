/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Upgrade presentation only. Native boon records, effects and callbacks stay intact. */
(function () {
  "use strict";
  var symbols = Object.freeze({
    max_hp: "🤍", energy: "🪫", chaos_cap: "🔥", grace_cap: "🪷",
    str: "⚔", draw: "💽", heal: "🛠", max_hp_2: "🪖",
    atk_2: "🧪", heal_2: "💊", draw_2: "🍀"
  });
  window.MOONSHINE_UPGRADE_SYMBOLS = symbols;
  var badge = "📀";
  var originals = new Map();
  var triggers = new Map();
  var glyphLoads = new Map();
  var context;
  function mobile() { return viewDocument.body && viewDocument.body.classList.contains("stg-mobile-ui"); }
  function recordForTitle(title) {
    return (surface.STG_BOONS || []).concat(surface.STG_STOMACH_BOONS || [])
      .find(function (boon) { return boon.title === title.trim(); });
  }
  function symbolForTitle(title) {
    var boon = recordForTitle(title);
    return boon && (symbols[boon.id] || boon.icon) || badge;
  }
  function loadGlyph(text) {
    if (!glyphLoads.has(text)) {
      glyphLoads.set(text, LUNAR.api.moonshine.fonts.load('emoji'));
    }
    return glyphLoads.get(text);
  }
  function fitSymbol(icon) {
    if (!icon.isConnected) return;
    var glyph = icon.firstElementChild;
    if (!glyph) return;
    var style = getComputedStyle(glyph);
    var key = style.fontSize + ":" + icon._stgNotoReady;
    if (icon._stgFitKey === key) return;
    icon._stgFitKey = key;
    if (!context) context = viewDocument.createElement("canvas").getContext("2d");
    context.font = '400 ' + style.fontSize + ' ' + style.fontFamily;
    var m = context.measureText(glyph.textContent);
    // CSS centers the line box; compensate for the glyph's actual ink bounds.
    var x = (m.width + m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
    var y = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent
      - m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 2;
    if (Number.isFinite(x) && Number.isFinite(y)) {
      glyph.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)";
    }
  }
  function createSymbol(text) {
    var icon = viewDocument.createElement("span");
    icon.className = "stg-mu-symbol";
    icon.setAttribute("aria-hidden", "true");
    var glyph = viewDocument.createElement("span");
    glyph.className = "stg-mu-glyph";
    glyph.textContent = text;
    icon.appendChild(glyph);
    requestAnimationFrame(function () { fitSymbol(icon); });
    loadGlyph(text).then(function (ready) { icon._stgNotoReady = ready; fitSymbol(icon); });
    return icon;
  }
  function decorate(icon, title) {
    var boon = recordForTitle(title);
    if (!boon || !symbols[boon.id]) return; // Unmapped future/stomach boons retain native art.
    if (!originals.has(icon)) originals.set(icon, Array.from(icon.childNodes));
    if (icon.dataset.stgUpgradeId !== boon.id) {
      icon.textContent = symbols[boon.id];
      icon.dataset.stgUpgradeId = boon.id;
      icon.classList.add("stg-mu-inline-symbol");
      loadGlyph(symbols[boon.id]);
    }
  }
  function bindPreview(chip, title) {
    var boon = recordForTitle(title);
    if (!boon || !symbols[boon.id] || triggers.has(chip)) return;
    var state = { role: chip.getAttribute("role"), tabindex: chip.getAttribute("tabindex"),
      label: chip.getAttribute("aria-label") };
    function open(event) {
      if (!mobile() || (event.type === "keydown" && event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof surface.stgForceHideTip === "function") surface.stgForceHideTip();
      if (typeof surface.stgRsBoonPopup === "function") surface.stgRsBoonPopup(boon.id);
    }
    state.open = open;
    triggers.set(chip, state);
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.setAttribute("aria-label", "View upgrade: " + boon.title);
    chip.addEventListener("click", open);
    chip.addEventListener("keydown", open);
  }
  function sync() {
    if (!mobile()) return;
    originals.forEach(function (_nodes, icon) { if (!icon.isConnected) originals.delete(icon); });
    triggers.forEach(function (_state, chip) { if (!chip.isConnected) triggers.delete(chip); });
    var pairs = [
      [".blessing-card", ".blessing-card-icon", ".blessing-card-title"],
      [".lgc-upg-card", ".lgc-upg-icon", ".lgc-upg-title"],
      [".stg-picker-card.pk-boon", ".stg-picker-art--boon", ".stg-picker-name"]
    ];
    pairs.forEach(function (pair) {
      viewDocument.querySelectorAll(pair[0]).forEach(function (card) {
        var icon = card.querySelector(pair[1]), title = card.querySelector(pair[2]);
        if (icon && title) decorate(icon, title.textContent);
      });
    });
    viewDocument.querySelectorAll(".stg-relic-chip").forEach(function (chip) {
      var icon = chip.querySelector(".stg-relic-chip-icon");
      var title = (chip.getAttribute("data-tip") || "").split(" — ")[0];
      if (icon) decorate(icon, title);
      bindPreview(chip, title);
    });
    viewDocument.querySelectorAll(".stg-rsd-boon").forEach(function (chip) {
      var icon = chip.querySelector(".stg-rsd-cost");
      var title = Array.from(chip.childNodes).filter(function (n) { return n.nodeType === 3; })
        .map(function (n) { return n.textContent; }).join("");
      if (icon) decorate(icon, title);
    });
    viewDocument.querySelectorAll(".stg-mu-symbol").forEach(fitSymbol);
  }
  function mount() {
    ["stgUpgradeRender", "stgBlessingRender", "stgStomachFateRender", "stgRenderGutVisionPicker",
      "stgShowRewardPicker", "stgToggleRelicTray", "stgShowRunStats", "stgRsBoonPopup"].forEach(function (name) {
      var original = surface[name];
      if (typeof original !== "function" || original._stgMobileUpgradeHook) return;
      var wrapped = function () {
        var result = original.apply(this, arguments);
        sync();
        return result;
      };
      wrapped._stgMobileUpgradeHook = true;
      surface[name] = wrapped;
    });
    sync();
  }
  function cleanup() {
    originals.forEach(function (nodes, icon) {
      if (!icon.isConnected) return;
      icon.replaceChildren.apply(icon, nodes);
      icon.classList.remove("stg-mu-inline-symbol");
      delete icon.dataset.stgUpgradeId;
    });
    originals.clear();
    triggers.forEach(function (state, chip) {
      chip.removeEventListener("click", state.open);
      chip.removeEventListener("keydown", state.open);
      [["role", state.role], ["tabindex", state.tabindex], ["aria-label", state.label]].forEach(function (attr) {
        if (attr[1] === null) chip.removeAttribute(attr[0]);
        else chip.setAttribute(attr[0], attr[1]);
      });
    });
    triggers.clear();
  }
  surface.STG_MOBILE_UPGRADES = { symbols: symbols, badge: badge, symbolForTitle: symbolForTitle,
    createSymbol: createSymbol, fitSymbol: fitSymbol, mount: mount, cleanup: cleanup };
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
