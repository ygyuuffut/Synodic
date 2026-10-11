/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Owned portrait card detail. LUNAR supplies source data/action handles;
   this template rearranges only MOONSHINE workspace card-face nodes. */
(function () {
  "use strict";

  function mobile() {
    return viewDocument.body && viewDocument.body.classList.contains("stg-mobile-ui");
  }
  function family(card) {
    if (card.classList.contains("card-tool")) return "Item";
    if (card.classList.contains("card-curse")) return "Condition";
    var tagged = Array.from(card.classList).find(function (name) {
      return name.indexOf("card-tag-") === 0;
    });
    if (!tagged) return "Alpha";
    var id = tagged.slice("card-tag-".length).toLowerCase();
    return { chaos: "Chaos", grace: "Grace", worship: "Worship",
      harmony: "Harmony", instinct: "Instinct", balance: "Balance",
      logic: "Logic" }[id] || "Alpha";
  }
  function fitTitle(name) {
    if (!name.isConnected) return;
    name.style.removeProperty("font-size");
    var size = parseFloat(getComputedStyle(name).fontSize);
    for (var pass = 0; pass < 5 && name.scrollWidth > name.clientWidth - 4; pass++) {
      size = Math.max(6, size * (name.clientWidth - 6) / name.scrollWidth * 0.97);
      name.style.setProperty("font-size", size.toFixed(2) + "px", "important");
      if (size === 6) break;
    }
  }
  function hasExhaustOnPlay(name) {
    return Object.values(surface.STG_CARD_TEMPLATES || {}).some(function (template) {
      return template && template.name === name && template.exhaustsOnPlay === true;
    });
  }
  function needsLightning(card, name, desc, tag) {
    return card.classList.contains("card-power") || /\bpower\b/i.test(tag.textContent) ||
      /\b(?:consume|exhaust)\b/i.test(desc.textContent) || hasExhaustOnPlay(name);
  }
  function fitVisibleArtwork(image, art) {
    if (!image.isConnected || !image.naturalWidth || !art.clientWidth || !art.clientHeight) return;
    try {
      var canvas = viewDocument.createElement("canvas");
      canvas.width = Math.min(192, image.naturalWidth);
      canvas.height = Math.min(192, image.naturalHeight);
      var context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      var pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      var left = canvas.width, top = canvas.height, right = -1, bottom = -1;
      for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
          if (pixels[(y * canvas.width + x) * 4 + 3] <= 16) continue;
          left = Math.min(left, x); top = Math.min(top, y);
          right = Math.max(right, x); bottom = Math.max(bottom, y);
        }
      }
      if (right < left || bottom < top) return;
      if (left === 0 && top === 0 && right === canvas.width - 1 && bottom === canvas.height - 1) return;
      var l = left * image.naturalWidth / canvas.width;
      var t = top * image.naturalHeight / canvas.height;
      var r = (right + 1) * image.naturalWidth / canvas.width;
      var b = (bottom + 1) * image.naturalHeight / canvas.height;
      var scale = Math.max(art.clientWidth / (r - l), art.clientHeight / (b - t)) * 1.01;
      image.style.setProperty("--stg-md-art-image-width", (image.naturalWidth * scale) + "px");
      image.style.setProperty("--stg-md-art-image-height", (image.naturalHeight * scale) + "px");
      image.style.setProperty("--stg-md-art-image-left", (art.clientWidth / 2 - (l + r) * scale / 2) + "px");
      image.style.setProperty("--stg-md-art-image-top", (art.clientHeight / 2 - (t + b) * scale / 2) + "px");
      image.classList.add("stg-md-art-trimmed");
    } catch (_error) {
      // A non-CORS image still uses the normal centered cover treatment.
    }
  }
  function loadArtwork(image, art) {
    if (!image || !image.isConnected) return;
    var original = image.src;
    var optimized = surface.STG_DISPLAY_CONFIG.wixCardDetailImageUrl(original, art.clientWidth, art.clientHeight);
    image.addEventListener("load", function () { fitVisibleArtwork(image, art); });
    image.addEventListener("error", function () { image.remove(); });
    image.decoding = "async";
    image.fetchPriority = "high";
    if (optimized !== original) {
      image.crossOrigin = "anonymous";
      image.src = optimized;
    } else if (image.complete && image.naturalWidth) fitVisibleArtwork(image, art);
  }
  // The run-report/owned-upgrade preview has a different native shell.
  // Preserve that node and the scrim's original close handler for desktop restore.
  function prepareUpgradePreview(scrim) {
    var original = scrim.querySelector(".stg-rs-boon-card");
    if (!original) return null;
    var name = original.querySelector(".stg-rs-boon-title");
    var desc = original.querySelector(".stg-rs-boon-desc");
    if (!name || !desc) return null;
    var wrap = viewDocument.createElement("div");
    wrap.className = "stg-card-popup-card-wrap";
    wrap.id = "stg-root";
    var card = viewDocument.createElement("div");
    card.className = "card card-power stg-card-popup-card";
    var heading = name.cloneNode(true), copy = desc.cloneNode(true);
    heading.className = "card-name";
    copy.className = "card-desc";
    var tag = viewDocument.createElement("div");
    tag.className = "card-type-tag";
    tag.textContent = "Upgrade";
    card.append(heading, copy, tag);
    var flavor = surface.STG_CARD_FLAVOR && surface.STG_CARD_FLAVOR[name.textContent.trim()];
    if (flavor) {
      var quote = viewDocument.createElement("div");
      quote.className = "stg-card-popup-flavor";
      quote.innerHTML = flavor;
      card.appendChild(quote);
    }
    wrap.appendChild(card);
    scrim._stgMdUpgradeOriginal = { card: original, wrap: wrap };
    original.replaceWith(wrap);
    return card;
  }
  function enhance(scrim) {
    if (!mobile() || scrim.classList.contains("stg-card-removed-scrim")) return;
    var card = scrim.querySelector(".stg-card-popup-card") || prepareUpgradePreview(scrim);
    if (!card || card.classList.contains("stg-md-card")) return;
    var name = card.querySelector(".card-name");
    var desc = card.querySelector(".card-desc");
    var tag = card.querySelector(".card-type-tag");
    if (!name || !desc || !tag) return;
    var upgrade = /^Upgrade\b/i.test(tag.textContent.trim());

    card._stgMdOriginal = card.innerHTML;
    card._stgMdOriginalStyle = card.getAttribute("style");
    card.style.removeProperty("box-shadow");
    scrim._stgMdOriginalZoom = scrim.style.zoom;
    surface.STG_MOBILE_UI.syncZoom(scrim);
    var accent = upgrade ? "#f4d975" : (surface.STG_MOBILE_CARD_FAMILY_COLORS || {})[family(card)] || "#c9c9d4";
    card.style.setProperty("--stg-md-accent", accent);
    var art = card.querySelector(".card-art");
    if (!art) {
      art = viewDocument.createElement("div");
      art.className = "card-art stg-md-art-placeholder";
    }
    if (upgrade) {
      art.className = "card-art stg-md-upgrade-art";
      art.replaceChildren(surface.STG_MOBILE_UPGRADES.createSymbol(
        surface.STG_MOBILE_UPGRADES.symbolForTitle(name.textContent)));
    }
    var image = art.querySelector("img");
    var header = viewDocument.createElement("div");
    header.className = "stg-md-header";
    if (upgrade) {
      var label = viewDocument.createElement("span");
      label.className = "stg-md-upgrade-label";
      label.textContent = "UPGRADE";
      var badge = surface.STG_MOBILE_UPGRADES.createSymbol(surface.STG_MOBILE_UPGRADES.badge);
      badge.classList.add("stg-md-upgrade-badge");
      header.append(label, badge);
    } else {
      var cost = card.querySelector(".card-cost");
      if (cost) {
        var value = Number(cost.textContent.trim());
        if (Number.isFinite(value)) {
          cost.dataset.signedCost = String(value);
          cost.textContent = String(Math.abs(value));
          cost.classList.add(value < 0 ? "stg-md-cost--negative"
            : value === 0 ? "stg-md-cost--zero" : "stg-md-cost--positive");
          var length = cost.textContent.length;
          if (length > 1) cost.style.setProperty("--stg-md-cost-size",
            Math.max(10, 22 / (length * 0.76)).toFixed(2) + "px");
        } else {
          cost.remove();
          cost = null;
        }
      }
      var uses = card.querySelector(".stg-card-uses-badge");
      var worshipUses = uses && uses.classList.contains("stg-card-curse-badge");
      var curseUses = worshipUses ? uses : null;
      if (worshipUses) uses = null;
      if (!uses) {
        uses = viewDocument.createElement("div");
        uses.className = "stg-md-uses stg-md-uses--unlimited";
        uses.textContent = "∞";
        uses.setAttribute("aria-label", "Unlimited uses");
      } else {
        uses.classList.add("stg-md-uses");
        uses.textContent = uses.textContent.replace(/\s+/g, "");
      }
      header.appendChild(uses);
      if (curseUses) {
        curseUses.classList.add("stg-md-worship-count");
        curseUses.setAttribute("aria-label", "Worship uses: " + curseUses.textContent.trim());
        header.appendChild(curseUses);
      }
      if (needsLightning(card, name.textContent.trim(), desc, tag)) {
        surface.STG_MOBILE_UI.loadNotoEmoji();
        var bolt = viewDocument.createElement("span");
        bolt.className = "stg-md-once-symbol";
        var glyph = viewDocument.createElement("span");
        glyph.className = "stg-md-once-glyph";
        glyph.textContent = "⚡︎";
        bolt.appendChild(glyph);
        bolt.setAttribute("aria-label", "Consume, Exhaust, or Power");
        header.appendChild(bolt);
      }
      if (cost) header.appendChild(cost);
    }

    var title = viewDocument.createElement("div");
    title.className = "stg-md-title";
    title.appendChild(name);
    var typeLabel = tag.firstChild;
    if (typeLabel && typeLabel.nodeType === Node.TEXT_NODE) {
      var type = typeLabel.textContent.trim();
      typeLabel.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    }
    var subtype = tag.querySelector(".card-subtype");
    if (subtype) subtype.textContent = ", " + subtype.textContent.replace(/^\s*[·,]\s*/, "").trim();
    if (!upgrade) title.appendChild(tag);

    var details = viewDocument.createElement("div");
    details.className = "stg-md-details";
    details.appendChild(desc);
    var flavor = card.querySelector(".stg-card-popup-flavor");
    if (flavor) details.appendChild(flavor);
    var multiplier = card.querySelector(".stg-card-popup-mult");
    card.replaceChildren(header, art, title, details);
    // Reuse the existing quantity node as a sibling footer, outside the artwork.
    // This is initial receipt structure, not a refresh-time DOM replacement.
    if (multiplier) {
      multiplier.setAttribute("translate", "no");
      card.parentElement.appendChild(multiplier);
      card._stgMdMultiplier = multiplier;
    }
    card.classList.add("stg-md-card");
    if (upgrade) card.classList.add("stg-md-upgrade");
    scrim.classList.add("stg-md-scrim");
    // Owned input sends backdrop dismissal to LUNAR; the native callback
    // retains continuation ownership. Card text taps never close the popup.
    card._stgMdStopClick = function (event) { event.stopPropagation(); };
    card.addEventListener("click", card._stgMdStopClick);
    requestAnimationFrame(function () { fitTitle(name); });
    if (image) requestAnimationFrame(function () { loadArtwork(image, art); });
    if (LUNAR.api.moonshine.fonts) {
      LUNAR.api.moonshine.fonts.load('ui').then(function () { fitTitle(name); });
    }
  }
  function restore(scrim) {
    var card = scrim.querySelector(".stg-md-card");
    if (!card) return;
    card.removeEventListener("click", card._stgMdStopClick);
    if (card._stgMdMultiplier) {
      card._stgMdMultiplier.remove();
      delete card._stgMdMultiplier;
    }
    card.innerHTML = card._stgMdOriginal;
    if (card._stgMdOriginalStyle === null) card.removeAttribute("style");
    else card.setAttribute("style", card._stgMdOriginalStyle);
    card.classList.remove("stg-md-card", "stg-md-upgrade");
    scrim.classList.remove("stg-md-scrim");
    scrim.style.zoom = scrim._stgMdOriginalZoom;
    if (scrim._stgMdUpgradeOriginal) {
      var original = scrim._stgMdUpgradeOriginal;
      original.wrap.replaceWith(original.card);
      delete scrim._stgMdUpgradeOriginal;
    }
  }
  function sync() {
    viewDocument.querySelectorAll(".stg-card-popup-scrim").forEach(function (scrim) {
      if (mobile()) enhance(scrim);
      else restore(scrim);
    });
  }
  function start() {
    var observer = new MutationObserver(sync);
    observer.observe(viewDocument.body, { childList: true, attributes: true,
      attributeFilter: ["class"] });
    sync();
  }
  if (viewDocument.body) start();
  else viewDocument.addEventListener("DOMContentLoaded", start, { once: true });
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
