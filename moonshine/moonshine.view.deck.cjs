/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Tiny Information's deck browser. The native masterDeck and card preview
   remain the only sources of card data and detail behavior. */
(function () {
  "use strict";

  var families = surface.STG_MOBILE_UI.families;
  var types = ["attack", "skill", "power"];
  var visibleFamilies = Object.create(null);
  var visibleTypes = Object.create(null);
  var sort = "none";
  var layer = null;
  var modal = null;
  var previousCatalog = null;
  var blockedNodes = [];
  var returnFocus = null;
  var modalReturnFocus = null;

  function trapTab(event, root) {
    if (event.key !== "Tab") return;
    var buttons = Array.from(root.querySelectorAll("button:not(:disabled)"));
    var first = buttons[0], last = buttons[buttons.length - 1];
    if (!first) return;
    if (event.shiftKey && viewDocument.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && viewDocument.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  function all(target, list) { list.forEach(function (item) { target[item] = true; }); }
  function reset() {
    all(visibleFamilies, families.map(function (family) { return family.id; }));
    all(visibleTypes, types);
    sort = "none";
  }
  reset();
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cards() {
    return LUNAR.api.moonshine.cards.deck().map(function(entry) { return entry.card; });
  }
  function family(card) {
    if (card.type === "tool") return "Item";
    if (card.subtype === "Worship") return "Worship";
    if (card.type === "curse") return "Condition";
    return card.subtype || "Alpha";
  }
  function matches(card) {
    var group = family(card);
    if (!visibleFamilies[group]) return false;
    if (types.indexOf(card.type) === -1) {
      return types.every(function (type) { return visibleTypes[type]; });
    }
    return !!visibleTypes[card.type];
  }
  function render() {
    if (!layer || !layer.isConnected) return;
    var allCards = LUNAR.api.moonshine.cards.deck();
    var shown = allCards
      .filter(function (entry) { return matches(entry.card); });
    if (sort !== "none") shown.sort(function (a, b) {
      var aCost = Number.isFinite(a.card.cost) ? a.card.cost : null;
      var bCost = Number.isFinite(b.card.cost) ? b.card.cost : null;
      if (aCost == null && bCost != null) return 1;
      if (bCost == null && aCost != null) return -1;
      return aCost != null && bCost != null && aCost !== bCost
        ? (sort === "asc" ? aCost - bCost : bCost - aCost) : a.order - b.order;
    });
    surface._stgCompCatalog = [];
    layer.querySelector(".stg-mobile-deck-total").textContent = allCards.length;
    layer.querySelector(".stg-mc-card-grid").innerHTML = shown.length
      ? MOONSHINE_CARD_THUMBNAIL.slots(shown, function(card) {
          var index = surface._stgCompCatalog.length; surface._stgCompCatalog.push(card); return index;
        })
      : '<div class="stg-mc-empty">No cards match these filters.</div>';
    MOONSHINE_CARD_THUMBNAIL.bindSlots(layer, shown);
  }
  function closeModal() {
    if (modal) modal.remove();
    modal = null;
    if (layer) layer.inert = false;
    if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus({ preventScroll: true });
    modalReturnFocus = null;
  }
  function close() {
    closeModal();
    if (layer) layer.remove();
    blockedNodes.forEach(function (entry) { entry.node.inert = entry.inert; });
    blockedNodes = [];
    layer = null;
    if (previousCatalog !== null) surface._stgCompCatalog = previousCatalog;
    previousCatalog = null;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }
  function switchMarkup(id, on) {
    return '<button type="button" class="stg-ms-segment stg-mc-toggle" role="switch" data-deck-switch="'
      + esc(id) + '" aria-checked="' + on + '" style="--stg-ms-count:2;--stg-ms-index:'
      + (on ? 1 : 0) + '"><span class="stg-ms-segment-indicator"></span><span>N</span><span>Y</span></button>';
  }
  function showOptions(kind) {
    closeModal();
    var category = kind === "categories";
    var draft = Object.assign(Object.create(null), category ? visibleFamilies : visibleTypes);
    var draftSort = sort;
    var list = category ? families.filter(function (item) {
      return item.id !== "Alpha" || cards().some(function (card) { return family(card) === "Alpha"; });
    })
      : types.map(function (type) { return { id: type, label: type[0].toUpperCase() + type.slice(1) }; });
    var rows = list.map(function (item) {
      return '<div class="stg-mc-option-row"><span class="stg-mc-option-label">'
        + (category ? '<em style="color:' + item.color + '">' + esc(item.label) + '</em> Cards'
          : esc(item.label)) + '</span>' + switchMarkup(item.id, draft[item.id]) + '</div>';
    }).join("");
    var sortHtml = category ? "" : '<div class="stg-mc-sort-row"><span>Sort By</span>'
      + '<div class="stg-ms-segment stg-mc-sort" style="--stg-ms-count:3;--stg-ms-index:'
      + ({ none: 0, asc: 1, desc: 2 }[draftSort]) + '"><span class="stg-ms-segment-indicator"></span>'
      + '<button type="button" data-deck-sort="none">None</button>'
      + '<button type="button" data-deck-sort="asc">Asc. Cost</button>'
      + '<button type="button" data-deck-sort="desc">Des. Cost</button></div></div>';
    modal = viewDocument.createElement("div");
    modal.className = "stg-mc-modal stg-mc-modal--" + kind + " stg-mobile-deck-modal";
    modal.innerHTML = '<div class="stg-mc-dialog" role="dialog" aria-modal="true" aria-label="'
      + (category ? 'Categories to Display' : 'Filter and Sort') + '">'
      + '<div class="stg-mc-dialog-head"><button type="button" data-deck-all>All</button><h2>'
      + (category ? 'Categories to Display' : 'Filter and Sort') + '</h2>'
      + '<button type="button" data-deck-none>None</button></div>'
      + '<div class="stg-mc-option-list">' + rows + sortHtml + '</div>'
      + '<button type="button" class="stg-mc-done" data-deck-done>Done</button></div>';
    viewDocument.body.appendChild(modal);
    modalReturnFocus = viewDocument.activeElement;
    layer.inert = true;
    surface.STG_MOBILE_UI.syncZoom(modal);
    modal.addEventListener("click", function (event) {
      var toggle = event.target.closest("[data-deck-switch]");
      var sortButton = event.target.closest("[data-deck-sort]");
      if (toggle) {
        var id = toggle.dataset.deckSwitch;
        draft[id] = !draft[id];
        toggle.setAttribute("aria-checked", String(draft[id]));
        toggle.style.setProperty("--stg-ms-index", draft[id] ? 1 : 0);
      } else if (sortButton) {
        draftSort = sortButton.dataset.deckSort;
        modal.querySelector(".stg-mc-sort").style.setProperty("--stg-ms-index",
          { none: 0, asc: 1, desc: 2 }[draftSort]);
      } else if (event.target.closest("[data-deck-all], [data-deck-none]")) {
        var on = !!event.target.closest("[data-deck-all]");
        (category ? families : list).forEach(function (item) { draft[item.id] = on; });
        modal.querySelectorAll("[data-deck-switch]").forEach(function (button) {
          button.setAttribute("aria-checked", String(on));
          button.style.setProperty("--stg-ms-index", on ? 1 : 0);
        });
        if (!on && !category) {
          draftSort = "none";
          modal.querySelector(".stg-mc-sort").style.setProperty("--stg-ms-index", 0);
        }
      } else if (event.target.closest("[data-deck-done]")) {
        if (category) visibleFamilies = draft;
        else { visibleTypes = draft; sort = draftSort; }
        closeModal(); render();
      } else if (event.target === modal) closeModal();
    });
    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.stopPropagation(); closeModal(); }
      else trapTab(event, modal);
    });
    modal.querySelector(".stg-mc-dialog-head button").focus({ preventScroll: true });
  }
  function open(panel) {
    if (!panel || !panel.isConnected) return;
    close();
    reset();
    previousCatalog = surface._stgCompCatalog || [];
    returnFocus = viewDocument.activeElement;
    layer = viewDocument.createElement("div");
    layer.className = "stg-mobile-deck-layer";
    layer.innerHTML = '<section class="stg-mobile-deck-browser" role="dialog" aria-modal="true" aria-label="View Deck">'
      + '<div class="stg-mobile-deck-board stg-mc-panel">'
      + '<div class="stg-mc-tools"><div class="stg-mobile-deck-counter"><span class="stg-mobile-deck-icon" aria-hidden="true">'
      + "🃏"
      + '</span><span class="stg-mobile-deck-total">0</span></div>'
      + '<div><button class="stg-mc-tool" type="button" data-deck-action="reset" aria-label="Reset card filters">R</button>'
      + '<button class="stg-mc-tool" type="button" data-deck-action="categories" aria-label="Card categories">C</button>'
      + '<button class="stg-mc-tool" type="button" data-deck-action="filters" aria-label="Filter and sort">Fs</button></div></div>'
      + '<div class="stg-mc-scroll"><div class="stg-mc-card-grid"></div></div></div>'
      + '<button type="button" class="stg-mobile-tiny-close stg-mobile-deck-close">Close</button></section>';
    blockedNodes = Array.from(panel.children).map(function (node) {
      var entry = { node: node, inert: node.inert };
      node.inert = true;
      return entry;
    });
    panel.appendChild(layer);
    layer.addEventListener("keydown", function (event) { trapTab(event, layer); });
    layer.addEventListener("click", function (event) {
      var card = event.target.closest("[data-card-index]");
      var action = event.target.closest("[data-deck-action]");
      if (card) {
        if (typeof surface.stgShowCardView === "function") {
          surface.stgShowCardView(Number(card.dataset.cardIndex));
          var previews = viewDocument.querySelectorAll(".stg-card-popup-scrim");
          var preview = previews[previews.length - 1];
          if (preview) preview.style.zIndex = "100030";
        }
      } else if (action) {
        if (action.dataset.deckAction === "reset") { reset(); render(); }
        else showOptions(action.dataset.deckAction);
      } else if (event.target.closest(".stg-mobile-deck-close") || event.target === layer) close();
    });
    render();
    layer.querySelector(".stg-mobile-deck-close").focus({ preventScroll: true });
  }
  surface.STG_MOBILE_DECK = { open: open, close: close, cards: cards,
    isOpen: function () { return !!(layer && layer.isConnected); } };

})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
