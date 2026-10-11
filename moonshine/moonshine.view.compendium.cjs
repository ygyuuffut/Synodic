/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Portrait Compendium presentation. MOONSHINE owns the unlock window;
   catalog data, validation and detail callbacks cross the LUNAR API. */
(function () {
  "use strict";

  var families = surface.STG_MOBILE_UI.families;
  var types = ["attack", "skill", "power"];
  var visibleFamilies = Object.create(null);
  var visibleTypes = Object.create(null);
  var sort = "none";
  var page = 0;
  var nativeRender = null;
  var nativeOpen = null;
  var nativeClose = null;
  var unlockPrompt = null;

  function all(object, values) {
    values.forEach(function (value) { object[value] = true; });
  }
  all(visibleFamilies, families.map(function (family) { return family.id; }));
  all(visibleTypes, types);

  function mobile() {
    return !!(viewDocument.body && viewDocument.body.classList.contains("stg-mobile-ui"));
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function catalog() { return LUNAR.api.moonshine.compendium.catalog(); }
  function allDiscovered(entries) {
    entries = entries || catalog();
    return entries.length > 0 && entries.every(function (entry) { return entry.revealed; });
  }
  function matches(entry) {
    if (!visibleFamilies[entry.family]) return false;
    // Tool and condition cards have no Attack/Skill/Power tag. They remain
    // visible with the default All state and disappear under a type filter.
    var everyType = types.every(function (type) { return visibleTypes[type]; });
    if (entry.family === "Item" || entry.family === "Condition") return everyType;
    return !!visibleTypes[entry.type];
  }
  function selectedEntries(entries) {
    var selected = entries.filter(matches);
    selected.sort(function (a, b) {
      if (a.revealed !== b.revealed) return a.revealed ? -1 : 1;
      if (sort !== "none") {
        // Cards without a numeric price always follow priced cards.
        if (a.cost == null && b.cost != null) return 1;
        if (b.cost == null && a.cost != null) return -1;
        if (a.cost != null && b.cost != null && a.cost !== b.cost) {
          return sort === "asc" ? a.cost - b.cost : b.cost - a.cost;
        }
      }
      return a.order - b.order;
    });
    return selected;
  }
  var thumbnailEntries = [];
  function renderCards(snapshot) {
    surface._stgCompCatalog = [];
    thumbnailEntries = selectedEntries(snapshot);
    return '<div class="stg-mc-card-grid">' + (thumbnailEntries.length
      ? MOONSHINE_CARD_THUMBNAIL.slots(thumbnailEntries, function(card) {
          var index = surface._stgCompCatalog.length; surface._stgCompCatalog.push(card); return index;
        })
      : '<div class="stg-mc-empty">No cards match these filters.</div>') + '</div>';
  }
  function renderUpgrade(upgrade) {
    var index = surface._stgCompCatalog.length;
    surface._stgCompCatalog.push({ name: upgrade.title, type: "power",
      typeLabel: "Upgrade", subtype: "", cost: null, desc: upgrade.desc });
    var flavor = surface.STG_CARD_FLAVOR && surface.STG_CARD_FLAVOR[upgrade.title];
    return '<button type="button" class="stg-mc-upgrade" data-card-index="' + index
      + '"><h3>' + escapeHtml(upgrade.title) + '</h3>'
      + '<p>' + escapeHtml(upgrade.desc) + '</p>'
      + (flavor ? '<p class="stg-mc-upgrade-flavor">' + escapeHtml(flavor) + '</p>' : '')
      + '</button>';
  }
  function renderUpgrades() {
    surface._stgCompCatalog = [];
    return '<div class="stg-mc-upgrades">' + (surface.STG_BOONS || []).map(renderUpgrade).join("") + '</div>';
  }
  var syncZoom = surface.STG_MOBILE_UI.syncZoom;
  function render() {
    var root = viewDocument.getElementById("stg-compendium");
    if (!root || !mobile()) return;
    root.classList.add("stg-mobile-compendium");
    var snapshot = page === 0 ? catalog() : [];
    var complete = page === 0 && allDiscovered(snapshot);
    var names = ["Cards", "Upgrades", "Encounters"];
    var subtitle = ["Cards catalogued on your climb",
      "Permanent hardware<br>Arc has installed in you", "Coming Soon"][page];
    root.innerHTML = '<div class="stg-mc-shell">'
      + '<h1>Compendium</h1>'
      + '<div class="stg-mc-page-nav"><button type="button" data-mc-action="prev" aria-label="Previous section"><span class="stg-mc-nav-symbol" aria-hidden="true">◁</span></button>'
      + '<h2>' + names[page] + '</h2>'
      + '<button type="button" data-mc-action="next" aria-label="Next section"><span class="stg-mc-nav-symbol" aria-hidden="true">▷</span></button></div>'
      + '<p class="stg-mc-subtitle">' + subtitle + '</p>'
      + '<section class="stg-mc-panel">'
      + (page === 0 ? '<div class="stg-mc-tools">'
        + '<button class="stg-mc-tool stg-mc-tool--unlock' + (complete ? ' stg-mc-tool--complete' : '')
        + '" type="button"' + (complete ? ' disabled aria-label="All cards unlocked"'
          : ' data-mc-action="unlock" aria-label="Unlock cards"') + '>U</button>'
        + '<div><button class="stg-mc-tool" type="button" data-mc-action="reset" aria-label="Reset card filters">R</button>'
        + '<button class="stg-mc-tool" type="button" data-mc-action="categories" aria-label="Card categories">C</button>'
        + '<button class="stg-mc-tool" type="button" data-mc-action="filters" aria-label="Filter and sort">Fs</button></div></div>'
        + '<div class="stg-mc-scroll">' + renderCards(snapshot) + '</div>'
        : page === 1 ? '<div class="stg-mc-scroll">' + renderUpgrades() + '</div>'
          : '<div class="stg-mc-scroll"></div>')
      + '</section><button type="button" class="stg-mc-back" data-mc-action="back">Back</button></div>';
    if (page === 0) MOONSHINE_CARD_THUMBNAIL.bindSlots(root, thumbnailEntries);
    if (!root._stgMcBound) {
      root.addEventListener("click", onRootClick);
      root._stgMcBound = true;
    }
    syncZoom(root);
  }
  function clearFilters() {
    all(visibleFamilies, families.map(function (family) { return family.id; }));
    all(visibleTypes, types);
    sort = "none";
  }
  function resetFilters() {
    clearFilters();
    render();
  }
  function switchPage(delta) {
    page = (page + delta + 3) % 3;
    if (surface._stgCompState) surface._stgCompState.tab = page === 1 ? "boons" : "cards";
    render();
  }
  function onRootClick(event) {
    var card = event.target.closest("[data-card-index]");
    if (card) {
      if (typeof surface.stgShowCardView === "function") surface.stgShowCardView(Number(card.dataset.cardIndex));
      return;
    }
    var action = event.target.closest("[data-mc-action]");
    if (!action) return;
    switch (action.dataset.mcAction) {
      case "prev": switchPage(-1); break;
      case "next": switchPage(1); break;
      case "reset": resetFilters(); break;
      case "unlock": showUnlock(); break;
      case "categories": showOptions("categories"); break;
      case "filters": showOptions("filters"); break;
      case "back": closeModal(); if (typeof surface.stgCloseCompendium === "function") surface.stgCloseCompendium(); break;
    }
  }
  function closeModal() {
    if (unlockPrompt) { unlockPrompt.close(); unlockPrompt = null; }
    var modal = viewDocument.getElementById("stg-mc-modal");
    if (modal) modal.remove();
  }
  function browserAlert(message) {
    // The game replaces window.alert with its own styled overlay, but keeps
    // the browser implementation here for callers that explicitly need it.
    var nativeAlert = surface._stgNativeAlert || surface.alert;
    nativeAlert.call(surface, message);
  }
  function modalShell(content, kind) {
    closeModal();
    var modal = viewDocument.createElement("div");
    modal.id = "stg-mc-modal";
    modal.className = "stg-mc-modal stg-mc-modal--" + kind;
    modal.innerHTML = '<div class="stg-mc-dialog" role="dialog" aria-modal="true">' + content + '</div>';
    viewDocument.body.appendChild(modal);
    syncZoom(modal);
    modal.addEventListener("click", function (event) { if (event.target === modal) closeModal(); });
    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); closeModal(); }
    });
    return modal;
  }
  function showUnlock() {
    var api = LUNAR.api.moonshine.compendium;
    if (api.cardsUnlocked()) { browserAlert("Unlock Successful"); return; }
    closeModal();
    unlockPrompt = MOONSHINE_TEXT_PROMPT.open({
      title: "Enter the Unlock Code", type: "password", maxLength: 12,
      inputLabel: "Unlock code", submitLabel: "Submit unlock code", theme: "danger",
      onClose: function () { unlockPrompt = null; },
      onSubmit: function (value, prompt) {
        var result = api.unlockCards(value);
        if (result.success) prompt.close();
        else { prompt.input.value = ""; prompt.input.focus({ preventScroll: true }); }
        browserAlert(result.success ? "Unlock Successful" : "Unlock Code Incorrect");
      }
    });
  }
  function switchMarkup(id, on) {
    return '<button type="button" class="stg-ms-segment stg-mc-toggle" role="switch" data-mc-switch="'
      + escapeHtml(id) + '" aria-checked="' + on + '" style="--stg-ms-count:2;--stg-ms-index:'
      + (on ? 1 : 0) + '"><span class="stg-ms-segment-indicator"></span>'
      + '<span>N</span><span>Y</span></button>';
  }
  function showOptions(kind) {
    var isCategory = kind === "categories";
    var draft = Object.assign(Object.create(null), isCategory ? visibleFamilies : visibleTypes);
    var draftSort = sort;
    var list = isCategory ? families : types.map(function (type) {
      return { id: type, label: type.charAt(0).toUpperCase() + type.slice(1) };
    });
    var rows = list.map(function (item) {
      return '<div class="stg-mc-option-row"><span class="stg-mc-option-label">'
        + (isCategory ? '<em style="color:' + item.color + '">' + escapeHtml(item.label) + '</em> Cards'
          : escapeHtml(item.label)) + '</span>'
        + switchMarkup(item.id, draft[item.id]) + '</div>';
    }).join("");
    var sortHtml = isCategory ? "" : '<div class="stg-mc-sort-row"><span>Sort By</span>'
      + '<div class="stg-ms-segment stg-mc-sort" style="--stg-ms-count:3;--stg-ms-index:'
      + ({ none: 0, asc: 1, desc: 2 }[draftSort]) + '"><span class="stg-ms-segment-indicator"></span>'
      + '<button type="button" data-mc-sort="none">None</button>'
      + '<button type="button" data-mc-sort="asc">Asc. Cost</button>'
      + '<button type="button" data-mc-sort="desc">Des. Cost</button></div></div>';
    var modal = modalShell('<div class="stg-mc-dialog-head">'
      + '<button type="button" data-mc-all="1">All</button><h2>'
      + (isCategory ? 'Categories to Display' : 'Filter and Sort') + '</h2>'
      + '<button type="button" data-mc-none="1">None</button></div>'
      + '<div class="stg-mc-option-list">' + rows + sortHtml + '</div>'
      + '<button type="button" class="stg-mc-done">Done</button>', kind);
    function updateSwitches() {
      modal.querySelectorAll("[data-mc-switch]").forEach(function (button) {
        var on = !!draft[button.dataset.mcSwitch];
        button.setAttribute("aria-checked", String(on));
        button.style.setProperty("--stg-ms-index", on ? 1 : 0);
      });
    }
    modal.addEventListener("click", function (event) {
      var toggle = event.target.closest("[data-mc-switch]");
      if (toggle) { draft[toggle.dataset.mcSwitch] = !draft[toggle.dataset.mcSwitch]; updateSwitches(); return; }
      var sortButton = event.target.closest("[data-mc-sort]");
      if (sortButton) {
        draftSort = sortButton.dataset.mcSort;
        modal.querySelector(".stg-mc-sort").style.setProperty("--stg-ms-index", { none: 0, asc: 1, desc: 2 }[draftSort]);
        return;
      }
      if (event.target.closest("[data-mc-all]")) {
        list.forEach(function (item) { draft[item.id] = true; });
        updateSwitches();
      } else if (event.target.closest("[data-mc-none]")) {
        list.forEach(function (item) { draft[item.id] = false; });
        if (!isCategory) {
          draftSort = "none";
          modal.querySelector(".stg-mc-sort").style.setProperty("--stg-ms-index", 0);
        }
        updateSwitches();
      } else if (event.target.closest(".stg-mc-done")) {
        if (isCategory) visibleFamilies = draft;
        else { visibleTypes = draft; sort = draftSort; }
        closeModal();
        render();
      }
    });
  }
  function installHooks() {
    var resetFn = surface.stgResetCompendium;
    if (typeof resetFn === "function" && !resetFn._stgMobileCompendiumResetHook) {
      var wrappedReset = function () {
        if (!mobile()) return resetFn.apply(this, arguments);
        if (!surface.confirm("Reset the Compendium? All discovered cards, items, and conditions will be locked again. This cannot be undone.")) return;
        // The game's original reset only removes the discovery list. The
        // unlock-code flag must also go, or every card remains revealed.
        try { LUNAR.api.moonshine.storage.removeItem(surface.STG_CARDS_SEEN_KEY || "stg_cards_seen"); } catch (error) {}
        try { LUNAR.api.moonshine.storage.removeItem(surface.STG_CARDS_ADMIN_KEY || "stg_cards_admin_unlock"); } catch (error) {}
        clearFilters();
        if (viewDocument.getElementById("stg-compendium") && typeof surface.stgRenderCompendium === "function") {
          surface.stgRenderCompendium();
        }
        if (typeof surface.stgFlashSaveToast === "function") surface.stgFlashSaveToast("Compendium reset — cards locked again.");
      };
      wrappedReset._stgMobileCompendiumResetHook = true;
      surface.stgResetCompendium = wrappedReset;
    }
    var renderFn = surface.stgRenderCompendium;
    if (typeof renderFn === "function" && !renderFn._stgMobileCompendiumHook) {
      nativeRender = renderFn;
      var wrappedRender = function () {
        if (mobile()) return render();
        return nativeRender.apply(this, arguments);
      };
      wrappedRender._stgMobileCompendiumHook = true;
      surface.stgRenderCompendium = wrappedRender;
    }
    var openFn = surface.stgOpenCompendium;
    if (typeof openFn === "function" && !openFn._stgMobileCompendiumHook) {
      nativeOpen = openFn;
      var wrappedOpen = function () {
        if (mobile()) page = 0;
        return nativeOpen.apply(this, arguments);
      };
      wrappedOpen._stgMobileCompendiumHook = true;
      surface.stgOpenCompendium = wrappedOpen;
    }
    var closeFn = surface.stgCloseCompendium;
    if (typeof closeFn === "function" && !closeFn._stgMobileCompendiumHook) {
      nativeClose = closeFn;
      var wrappedClose = function () { closeModal(); return nativeClose.apply(this, arguments); };
      wrappedClose._stgMobileCompendiumHook = true;
      surface.stgCloseCompendium = wrappedClose;
    }
  }
  function mount() {
    installHooks();
    var root = viewDocument.getElementById("stg-compendium");
    if (!root || !mobile()) return;
    if (!root.classList.contains("stg-mobile-compendium")) render();
    else syncZoom(root);
    syncZoom(viewDocument.getElementById("stg-mc-modal"));
  }
  function cleanup() {
    closeModal();
    var root = viewDocument.getElementById("stg-compendium");
    if (!root || !root.classList.contains("stg-mobile-compendium")) return;
    root.classList.remove("stg-mobile-compendium");
    root.style.zoom = "";
    if (nativeRender) nativeRender();
  }
  surface.STG_MOBILE_COMPENDIUM = { mount: mount, cleanup: cleanup };
  installHooks();
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
