/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
(function () {
  "use strict";

  var root = viewDocument.documentElement;
  var body;
  var displayConfig = surface.STG_DISPLAY_CONFIG;
  if (!displayConfig || typeof displayConfig.detectMode !== "function") return;
  var touchPointer = surface.matchMedia(displayConfig.mobile.pointerQuery);
  var scheduled = false;
  var activeMode = null;
  var desktopZoom = null;
  var originalViewport = null;
  var zoomGuardInstalled = false;
  var viewArtGuardInstalled = false;
  var mobileLockApplied = false;
  var previousUiLock = null;
  function viewportHeight() {
    return surface.visualViewport && surface.visualViewport.height
      ? surface.visualViewport.height
      : surface.innerHeight;
  }

  function isMobile() {
    return !!(viewDocument.body && viewDocument.body.classList.contains("stg-mobile-ui"));
  }

  function clampMobileZoom() {
    if (!isMobile()) return false;
    var selected = typeof surface._STG_ZOOM === "number"
      ? surface._STG_ZOOM
      : parseFloat(root.style.zoom || "1");
    /* Portrait already receives an 18px mobile reading font.  Scaling the
       whole html element as well shrinks the logical fixed viewport and is
       especially prone to clipping the dense top HUD on Android. */
    var portrait = viewDocument.body.classList.contains("stg-mobile-portrait");
    var maxMobileZoom = portrait
      ? displayConfig.mobile.portraitZoom : displayConfig.mobile.landscapeZoom;
    var clamped = Math.max(displayConfig.mobile.minZoom,
      Math.min(maxMobileZoom, selected || 1));
    if (typeof surface._STG_ZOOM === "number" && selected !== clamped) surface._STG_ZOOM = clamped;
    root.style.zoom = String(clamped);
    if (viewDocument.body) viewDocument.body.style.setProperty("--stg-zoom", String(clamped));
    return selected !== clamped;
  }

  /* The game's scaler zooms the entire html element. Keep mobile scaling
     within the display profile's bounds, while the dedicated Settings page
     compensates for that zoom so its portrait controls remain reachable. */
  function installZoomGuard() {
    if (zoomGuardInstalled || typeof surface.stgApplyZoom !== "function") return;
    var original = surface.stgApplyZoom;
    surface.stgApplyZoom = function () {
      if (isMobile() && typeof surface._STG_ZOOM === "number") {
        var portrait = viewDocument.body.classList.contains("stg-mobile-portrait");
        var maxZoom = portrait
          ? displayConfig.mobile.portraitZoom : displayConfig.mobile.landscapeZoom;
        surface._STG_ZOOM = Math.max(displayConfig.mobile.minZoom,
          Math.min(maxZoom, surface._STG_ZOOM));
      }
      var result = original.apply(this, arguments);
      clampMobileZoom();
      scheduleUpdate();
      return result;
    };
    surface.stgApplyZoom._stgMobileGuard = true;
    zoomGuardInstalled = true;
    if (clampMobileZoom()) surface.stgApplyZoom();
  }

  /* Desktop drag coordinates are not meaningful on a phone.  Temporarily
     force the game's existing UI-lock mode without overwriting its saved
     preference, then restore the prior state if the viewport becomes desktop. */
  function applyMobileUiLock(mobile) {
    if (!body) return;
    if (mobile && displayConfig.mobile.lockUi) {
      if (!mobileLockApplied) {
        previousUiLock = body.getAttribute("data-ui-locked");
        mobileLockApplied = true;
      }
      body.setAttribute("data-ui-locked", "on");
      body.setAttribute("data-stg-mobile-lock", "on");
    } else if (mobileLockApplied) {
      if (previousUiLock === null) body.removeAttribute("data-ui-locked");
      else body.setAttribute("data-ui-locked", previousUiLock);
      body.removeAttribute("data-stg-mobile-lock");
      mobileLockApplied = false;
      previousUiLock = null;
    }
  }

  function addMobileTutorialNote(tutorial, kind) {
    if (!tutorial || tutorial.getAttribute("data-stg-mobile-optimized") === "1") return;
    tutorial.setAttribute("data-stg-mobile-optimized", "1");
    var lines = tutorial.querySelectorAll(kind === "scan" ? ".stg-scan-tutorial-line" : ".stg-portrait-tut-line");
    /* Drag, resize and reset instructions are desktop-only.  Keep the scan
       heart/DATA or FX instruction, plus an explicit mobile explanation. */
    for (var i = 0; i < lines.length - 1; i += 1) lines[i].classList.add("stg-mobile-desktop-hint");
    var inner = tutorial.querySelector(kind === "scan" ? ".stg-scan-tutorial-inner" : ".stg-portrait-tut-inner");
    var close = tutorial.querySelector(kind === "scan" ? ".stg-scan-tutorial-close" : ".stg-portrait-tut-close");
    if (inner && close) {
      var note = viewDocument.createElement("div");
      note.className = "stg-mobile-tutorial-note";
      note.textContent = kind === "scan"
        ? "Mobile layout is fitted automatically. Open DATA, then swipe inside the readout to see every line."
        : "Mobile layout is fitted and locked automatically so the combat HUD stays reachable.";
      inner.insertBefore(note, close);
    }
  }

  function closeMobileSettings(panel) {
    if (!panel) return;
    if (panel.parentNode) panel.parentNode.removeChild(panel);
    if (typeof surface.stgCloseSettingsFlyoutOnce === "function") {
      viewDocument.removeEventListener("click", surface.stgCloseSettingsFlyoutOnce, true);
    }
  }

  function openMobileSave() {
    if (typeof surface.stgOpenSlotPicker !== "function") return;
    if (typeof surface.stgCanSave === "function" && !surface.stgCanSave()) {
      surface.alert("Saving is available on the Map, Rest Site, and Blessing screens. Finish the current combat or scene first.");
      return;
    }
    surface.stgOpenSlotPicker("save");
  }

  function makeMobileSaveButton(className) {
    var button = viewDocument.createElement("button");
    button.type = "button";
    button.className = className + " stg-mobile-save-btn";
    button.setAttribute("aria-label", "Save game");
    button.setAttribute("title", "Save game");
    button.innerHTML = typeof surface.stgIconSaveSvg === "function"
      ? surface.stgIconSaveSvg() + '<span class="stg-mobile-save-label">SAVE</span>'
      : "SAVE";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openMobileSave();
    });
    return button;
  }

  /* Several source screens intentionally request showSave:false.  Mobile
     still needs a stable affordance, so place one at the beginning of every
     active HUD row.  Existing source save buttons are moved forward instead
     of duplicated. */
  function ensureMobileSaveButtons() {
    var hosts = viewDocument.querySelectorAll("#stg-root.stg-fullbg .header-right, .ev-player-bar");
    for (var i = 0; i < hosts.length; i += 1) {
      var host = hosts[i];
      var existing = host.querySelector(".stg-save-bar-btn, .stg-mobile-save-btn");
      if (existing) {
        existing.classList.add("stg-mobile-save-priority");
        continue;
      }
      var className = host.classList.contains("ev-player-bar")
        ? "ev-bar-btn ev-bar-icon-btn stg-save-bar-btn"
        : "mute-btn stg-save-bar-btn";
      host.insertBefore(makeMobileSaveButton(className), host.firstChild);
    }
  }

  /* Source layout placeholders only; the visible HUD belongs to persistent chrome. */
  var topHudSelector = ".ev-player-bar, .blessing-header-inner, .mapscreen-player, #stg-root.stg-fullbg .header-right";
  function hudNumber(value) { return String(Math.max(0, Math.round(Number(value) || 0))); }
  function closeMobileTinyInformation() {
    var overlay = viewDocument.getElementById("stg-mobile-tiny-info");
    if (surface.STG_MOBILE_DECK) surface.STG_MOBILE_DECK.close();
    if (overlay) overlay.remove();
    if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.release('information');
    viewDocument.removeEventListener("keydown", onTinyInformationKeydown);
    viewDocument.querySelectorAll(".stg-mobile-top-hud-info").forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
  }
  function onTinyInformationKeydown(event) {
    if (event.key !== "Escape") return;
    if (viewDocument.querySelector(".stg-card-popup-scrim.stg-md-scrim")) return;
    if (surface.STG_MOBILE_DECK && surface.STG_MOBILE_DECK.isOpen()) {
      event.preventDefault();
      surface.STG_MOBILE_DECK.close();
      return;
    }
    closeMobileTinyInformation();
  }
  function openMobileTinyInformation(button) {
    if (!isMobile() || !surface._STG) return;
    closeMobileTinyInformation();
    var overlay = viewDocument.createElement("div");
    overlay.id = "stg-mobile-tiny-info";
    overlay.className = "stg-mobile-tiny-info";
    overlay.setAttribute("role", "presentation");
    var panel = viewDocument.createElement("section");
    panel.className = "stg-mobile-tiny-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "stg-mobile-tiny-title");
    panel.innerHTML = '<h2 id="stg-mobile-tiny-title">Tiny Information</h2>'
      + '<div class="stg-mobile-tiny-label">Fetishes</div>'
      + '<div class="stg-mobile-tiny-fetishes"></div>'
      + '<button type="button" class="stg-mobile-tiny-deck" aria-label="View Deck"><span>View Deck</span><span class="stg-mobile-tiny-deck-count"></span></button>'
      + '<div class="stg-mobile-tiny-label stg-mobile-tiny-upgrades-label">Installed Upgrades</div>'
      + '<div class="stg-mobile-tiny-upgrades" role="list"></div>'
      + '<button type="button" class="stg-mobile-tiny-close">Close</button>';
    var fetishes = (surface._STG && surface._STG.fetish) || {};
    var deckButton = panel.querySelector(".stg-mobile-tiny-deck");
    deckButton.querySelector(".stg-mobile-tiny-deck-count").textContent = surface.STG_MOBILE_DECK
      ? surface.STG_MOBILE_DECK.cards().length : 0;
    deckButton.addEventListener("click", function () {
      if (surface.STG_MOBILE_DECK) surface.STG_MOBILE_DECK.open(panel);
    });
    var fetishHost = panel.querySelector(".stg-mobile-tiny-fetishes");
    [["butt", "🍑"], ["mouth", "🫦"], ["pussy", "🌸"], ["feet", "🦶"]].forEach(function (pair) {
      var pill = viewDocument.createElement("div");
      pill.className = "stg-mobile-tiny-fetish";
      pill.setAttribute("aria-label", pair[0] + ": " + hudNumber(fetishes[pair[0]]));
      var glyph = viewDocument.createElement("span");
      glyph.className = "stg-mobile-tiny-fetish-icon";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = pair[1] + "\uFE0E";
      glyph.style.visibility = "hidden";
      surface.STG_MOBILE_UI.loadNotoEmoji().then(function(ready){
        if(!ready) glyph.textContent = ({butt:"B",mouth:"M",pussy:"P",feet:"F"})[pair[0]];
        glyph.style.visibility = "";
      });
      var count = viewDocument.createElement("span");
      count.className = "stg-mobile-tiny-fetish-count";
      count.textContent = hudNumber(fetishes[pair[0]]);
      pill.append(glyph, count);
      fetishHost.appendChild(pill);
    });
    var upgrades = typeof surface.stgOwnedBoonRecords === "function"
      ? surface.stgOwnedBoonRecords() : [];
    var upgradeHost = panel.querySelector(".stg-mobile-tiny-upgrades");
    upgrades.forEach(function (boon) {
      var tile = viewDocument.createElement("button");
      tile.type = "button";
      tile.className = "stg-mobile-tiny-upgrade";
      tile.setAttribute("role", "listitem");
      tile.setAttribute("aria-label", "View upgrade: " + boon.title);
      var symbols = surface.STG_MOBILE_UPGRADES;
      tile.appendChild(symbols.createSymbol(symbols.symbols[boon.id] || boon.icon || symbols.badge));
      tile.addEventListener("click", function () {
        if (typeof surface.stgForceHideTip === "function") surface.stgForceHideTip();
        if (typeof surface.stgRsBoonPopup === "function" &&
            (surface.STG_BOONS || []).some(function (record) { return record.id === boon.id; })) {
          surface.stgRsBoonPopup(boon.id);
        } else {
          // The native preview only indexes STG_BOONS. Use its same preview
          // shell for owned boons from the other native pool.
          var scrim = viewDocument.createElement("div");
          scrim.className = "stg-card-popup-scrim stg-rs-boon-scrim";
          scrim.style.zIndex = "100020";
          var card = viewDocument.createElement("div");
          card.className = "stg-rs-boon-card";
          [["stg-rs-boon-icon", boon.icon || "✦"],
            ["stg-rs-boon-title", boon.title],
            ["stg-rs-boon-desc", boon.desc || ""]].forEach(function (part) {
            var child = viewDocument.createElement("div");
            child.className = part[0]; child.textContent = part[1]; card.appendChild(child);
          });
          scrim.appendChild(card);
          scrim.addEventListener("click", function () { scrim.remove(); });
          viewDocument.body.appendChild(scrim);
        }
        var previews = viewDocument.querySelectorAll(".stg-card-popup-scrim");
        var preview = previews[previews.length - 1];
        if (preview) preview.style.zIndex = "100020";
      });
      upgradeHost.appendChild(tile);
    });
    panel.querySelector(".stg-mobile-tiny-close").addEventListener("click", closeMobileTinyInformation);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeMobileTinyInformation();
    });
    overlay.appendChild(panel);
    viewDocument.body.appendChild(overlay);
    if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.acquire('information');
    if (surface.STG_MOBILE_UI) {
      surface.STG_MOBILE_UI.syncZoom(overlay);
      surface.STG_MOBILE_UI.loadNotoEmoji();
    }
    button.setAttribute("aria-expanded", "true");
    viewDocument.addEventListener("keydown", onTinyInformationKeydown);
    panel.querySelector(".stg-mobile-tiny-close").focus({ preventScroll: true });
  }
  // Compatibility header class only. The native map sizes its source header;
  // the owned map uses CSS. Reinvoking a native layout command here would
  // route a local map state update through full compatibility capture.
  function ensureMobileTopHud() {
    viewDocument.querySelectorAll(topHudSelector).forEach(function(bar){bar.classList.add('stg-mobile-top-hud');});
  }
  function cleanupMobileTopHud(){closeMobileTinyInformation();}
  surface.STG_MOBILE_CHROME={openInfo:openMobileTinyInformation,openMenu:function(){surface.STG_MOBILE_INGAME_OPTIONS.open();}};

  /* Desktop settings are a small flyout anchored under the gear.  On a
     phone it becomes a viewport-bound scroll sheet with its own close row.
     The game rebuilds flyout.innerHTML after every option change, so watch
     that one panel and restore the mobile header after each rebuild. */
  function optimizeMobileSettings(panel) {
    if (!panel || !isMobile()) return;
    panel.classList.add("stg-mobile-settings-sheet");
    if (!panel.querySelector(".stg-mobile-settings-head")) {
      var head = viewDocument.createElement("div");
      head.className = "stg-mobile-settings-head";
      var title = viewDocument.createElement("strong");
      title.textContent = "Interface settings";
      var actions = viewDocument.createElement("div");
      actions.className = "stg-mobile-settings-actions";
      actions.appendChild(makeMobileSaveButton("stg-mobile-settings-save"));
      var close = viewDocument.createElement("button");
      close.type = "button";
      close.className = "stg-mobile-settings-close";
      close.setAttribute("aria-label", "Close interface settings");
      close.textContent = "CLOSE";
      close.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeMobileSettings(panel);
      });
      actions.appendChild(close);
      head.appendChild(title);
      head.appendChild(actions);
      panel.insertBefore(head, panel.firstChild);
    }

    if (!panel._stgMobileSettingsObserver) {
      panel._stgMobileSettingsObserver = new MutationObserver(function () {
        if (panel.isConnected && isMobile()) optimizeMobileSettings(panel);
      });
      panel._stgMobileSettingsObserver.observe(panel, { childList: true });
    }
  }

  function updateMobileScanButton(overlay, button) {
    if (!overlay || !button) return;
    var minimized = overlay.classList.contains("stg-scan-minimized");
    var complete = !!overlay.querySelector(".stg-scan-status--complete");
    var label = minimized
      ? "SCAN \u2191"
      : (complete ? "DONE \u00b7 STORY \u2193" : "STORY \u2193");
    if (button.textContent !== label) button.textContent = label;
    button.setAttribute("aria-expanded", minimized ? "false" : "true");
    var showComplete = complete && !minimized;
    if (button.classList.contains("stg-mobile-scan-story-btn--complete") !== showComplete) {
      button.classList.toggle("stg-mobile-scan-story-btn--complete", showComplete);
    }
  }

  /* The scanner is deliberately non-modal on mobile.  Its transparent
     positioning shell must not own the page; only the visible frame may
     receive touches.  Add an explicit compact/restore action rather than
     relying on the desktop-only minus glyph buried among header controls. */
  function optimizeMobileScan(overlay) {
    if (!overlay || !isMobile()) return;
    if (overlay._stgOriginalMinimized === undefined) {
      overlay._stgOriginalMinimized = overlay.classList.contains("stg-scan-minimized");
    }
    if (!overlay.classList.contains("stg-mobile-scan-window")) {
      overlay.classList.add("stg-mobile-scan-window");
    }
    var header = overlay.querySelector(".stg-scan-header");
    var button = overlay.querySelector(".stg-mobile-scan-story-btn");
    if (header && !button) {
      button = viewDocument.createElement("button");
      button.type = "button";
      button.className = "stg-mobile-scan-story-btn";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        overlay.classList.toggle("stg-scan-minimized");
        updateMobileScanButton(overlay, button);
      });
      header.appendChild(button);
    }
    updateMobileScanButton(overlay, button);
    /* The source cancels the heart's Web Animation before starting the
       pop animation.  Its base position is left:0/top:0, so cancellation
       otherwise makes the pop jump to the scan window's upper-left.  A
       capture listener freezes the currently painted coordinates first. */
    if (!overlay._stgMobileHeartAnchor) {
      overlay._stgMobileHeartAnchor = true;
      overlay.addEventListener("click", function (event) {
        if (!isMobile()) return;
        var heart = event.target && event.target.closest
          ? event.target.closest(".stg-heart")
          : null;
        if (!heart || !overlay.contains(heart)) return;
        var wrap = heart.parentElement;
        if (!wrap) return;
        var heartRect = heart.getBoundingClientRect();
        var wrapRect = wrap.getBoundingClientRect();
        heart.style.left = (heartRect.left - wrapRect.left + wrap.scrollLeft) + "px";
        heart.style.top = (heartRect.top - wrapRect.top + wrap.scrollTop) + "px";
        heart.style.transform = "none";
      }, true);
    }
    if (!overlay._stgMobileScanObserver) {
      overlay._stgMobileScanObserver = new MutationObserver(function () {
        if (overlay.isConnected && isMobile()) {
          updateMobileScanButton(overlay, overlay.querySelector(".stg-mobile-scan-story-btn"));
        }
      });
      overlay._stgMobileScanObserver.observe(overlay, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class"]
      });
    }
  }

  function extractBackgroundUrl(element) {
    if (!element) return "";
    var value = element.style.backgroundImage || surface.getComputedStyle(element).backgroundImage;
    if (!value || value === "none") return "";
    var match = value.match(/url\((['"]?)(.*?)\1\)/i);
    return match ? match[2] : "";
  }

  function currentCgUrl() {
    // The persistent Story owner holds Encounter artwork outside this legacy
    // workspace. Reuse its selected URL instead of restoring hidden native art.
    var owned = window.MOONSHINE_STORY && MOONSHINE_STORY.art();
    var match = owned && owned.match(/url\((['"]?)(.*?)\1\)/i);
    if (match) return match[2];
    var selectors = [
      ".stg-body-bg-layer.is-active",
      ".stomach-bg-layer.is-active",
      ".ev-bg",
      ".blessing-bg",
      ".rest-bg",
      ".mapscreen-bg",
      "#stg-root.stg-fullbg .stg-bg"
    ];
    for (var i = 0; i < selectors.length; i += 1) {
      var url = extractBackgroundUrl(viewDocument.querySelector(selectors[i]));
      if (url) return url;
    }
    // Fate's owned workspace buffers declare their target via inline opacity,
    // unlike the map's is-active class. Ignore the retired (opacity 0) plate.
    var fateLayers = viewDocument.querySelectorAll(".stomach-bg-layer");
    for (var j = 0; j < fateLayers.length; j += 1) {
      if (fateLayers[j].style.opacity !== "1") continue;
      var fateUrl = extractBackgroundUrl(fateLayers[j]);
      if (fateUrl) return fateUrl;
    }
    var image = viewDocument.querySelector(".ev-image-panel img, .portrait-frame img");
    return image ? (image.currentSrc || image.src || "") : "";
  }

  // Fullscreen art must cancel the game's html zoom, like menu overlays do.
  function syncArtOverlayZoom(overlay) {
    if (!overlay) return;
    if (overlay._stgMobileArtOriginalZoom === undefined) overlay._stgMobileArtOriginalZoom = overlay.style.zoom;
    var zoom = parseFloat(surface.getComputedStyle(viewDocument.documentElement).zoom) || 1;
    var inverse = String(1 / zoom);
    if (overlay.style.zoom !== inverse) overlay.style.zoom = inverse;
  }

  function fitMobileCg(viewer, preserveCenter) {
    if (!viewer) return;
    syncArtOverlayZoom(viewer);
    if (!viewer._stgImage || !viewer._stgImage.naturalWidth) return;
    var viewport = viewer._stgViewport;
    var image = viewer._stgImage;
    var oldWidth = image.offsetWidth || 1;
    var oldHeight = image.offsetHeight || 1;
    var centerX = viewport.scrollLeft + viewport.clientWidth / 2;
    var centerY = viewport.scrollTop + viewport.clientHeight / 2;
    var fit = Math.min(
      viewport.clientWidth / image.naturalWidth,
      viewport.clientHeight / image.naturalHeight
    );
    viewer._stgFitScale = fit;
    if (!viewer._stgScale) viewer._stgScale = fit;
    viewer._stgScale = Math.max(fit * 0.75, Math.min(fit * 4, viewer._stgScale));
    var width = Math.max(1, Math.round(image.naturalWidth * viewer._stgScale));
    var height = Math.max(1, Math.round(image.naturalHeight * viewer._stgScale));
    image.style.width = width + "px";
    image.style.height = height + "px";
    viewer._stgStage.style.width = Math.max(viewport.clientWidth, width) + "px";
    viewer._stgStage.style.height = Math.max(viewport.clientHeight, height) + "px";
    var ratio = viewer._stgScale / fit;
    viewer._stgReadout.textContent = Math.abs(ratio - 1) < 0.03
      ? "FIT"
      : Math.round(ratio * 100) + "%";
    if (preserveCenter) {
      viewport.scrollLeft = centerX * (width / oldWidth) - viewport.clientWidth / 2;
      viewport.scrollTop = centerY * (height / oldHeight) - viewport.clientHeight / 2;
    } else {
      viewport.scrollLeft = Math.max(0, (width - viewport.clientWidth) / 2);
      viewport.scrollTop = Math.max(0, (height - viewport.clientHeight) / 2);
    }
  }

  function changeMobileCgZoom(viewer, factor) {
    if (!viewer || !viewer._stgFitScale) return;
    viewer._stgScale *= factor;
    fitMobileCg(viewer, true);
  }

  function makeMobileCgViewer(url) {
    var viewer = viewDocument.createElement("div");
    viewer.id = "stg-mobile-cg-viewer";
    viewer.setAttribute("role", "region");
    viewer.setAttribute("aria-label", "Scrollable CG viewer");

    var viewport = viewDocument.createElement("div");
    viewport.className = "stg-mobile-cg-viewport";
    var stage = viewDocument.createElement("div");
    stage.className = "stg-mobile-cg-stage";
    var image = viewDocument.createElement("img");
    image.className = "stg-mobile-cg-image";
    image.alt = "CG artwork";
    image.draggable = false;
    image.dataset.msArtRole = "cg";
    image.hidden = !url;
    stage.appendChild(image);
    var unavailable = viewDocument.createElement("p");
    unavailable.className = "stg-mobile-cg-unavailable";
    unavailable.setAttribute("role", "status");
    unavailable.textContent = "Artwork unavailable. You can return to the scene.";
    unavailable.hidden = !!url;
    if (!url) LUNAR.api.moonshine.logger.scope('MOONSHINE.art').warn('CG_ART_UNAVAILABLE', {reason:'missing-source'});
    stage.appendChild(unavailable);
    viewport.appendChild(stage);

    var controls = viewDocument.createElement("div");
    controls.className = "stg-mobile-cg-controls";
    var minus = viewDocument.createElement("button");
    minus.type = "button";
    minus.className = "stg-mobile-cg-zoom-out";
    minus.setAttribute("aria-label", "Zoom out");
    minus.textContent = "-";
    var readout = viewDocument.createElement("button");
    readout.type = "button";
    readout.className = "stg-mobile-cg-fit";
    readout.setAttribute("aria-label", "Fit artwork to screen");
    readout.textContent = "FIT";
    var plus = viewDocument.createElement("button");
    plus.type = "button";
    plus.className = "stg-mobile-cg-zoom-in";
    plus.setAttribute("aria-label", "Zoom in");
    plus.textContent = "+";
    controls.appendChild(minus);
    controls.appendChild(readout);
    controls.appendChild(plus);
    minus.disabled = readout.disabled = plus.disabled = true;
    viewer.appendChild(viewport);
    var toolbar = viewDocument.createElement("footer");
    toolbar.className = "stg-mobile-cg-toolbar";
    viewer.appendChild(toolbar);
    toolbar.appendChild(controls);

    viewer._stgViewport = viewport;
    viewer._stgStage = stage;
    viewer._stgImage = image;
    viewer._stgReadout = readout;
    viewer._stgSource = url;
    var back = viewDocument.createElement("button");
    back.type = "button";
    back.className = "stg-mobile-cg-return";
    back.textContent = "RETURN";
    back.setAttribute("aria-label", "Return to scene");
    back.addEventListener("click", function (event) {
      event.preventDefault();event.stopPropagation();
      if (typeof surface.stgToggleViewArt === "function") surface.stgToggleViewArt();
    });
    toolbar.prepend(back);
    minus.addEventListener("click", function (event) {
      event.stopPropagation();
      changeMobileCgZoom(viewer, 0.8);
    });
    plus.addEventListener("click", function (event) {
      event.stopPropagation();
      changeMobileCgZoom(viewer, 1.25);
    });
    readout.addEventListener("click", function (event) {
      event.stopPropagation();
      viewer._stgScale = viewer._stgFitScale;
      fitMobileCg(viewer, false);
    });
    image.addEventListener("load", function () {
      unavailable.hidden = true;
      minus.disabled = readout.disabled = plus.disabled = false;
      image.hidden = false;
      viewer._stgScale = 0;
      fitMobileCg(viewer, false);
    });
    image.addEventListener("error", function () {
      image.hidden = true;
      unavailable.hidden = false;
      minus.disabled = readout.disabled = plus.disabled = true;
      LUNAR.api.moonshine.logger.scope('MOONSHINE.art').warn('CG_ART_UNAVAILABLE', {reason:'image-error'});
    });
    syncArtOverlayZoom(viewer);
    if (url) image.src = url;
    return viewer;
  }

  function syncMobileCgViewer() {
    var existing = viewDocument.getElementById("stg-mobile-cg-viewer");
    var active = isMobile() && body && body.classList.contains("stg-view-art-mode");
    if (!active) {
      if (existing) existing.remove();
      return;
    }
    var url = currentCgUrl();
    // An absent or failed decorative image must never remove the exit route.
    if (existing && existing._stgSource === url) {
      fitMobileCg(existing, true);
      return;
    }
    if (existing) existing.remove();
    body.appendChild(makeMobileCgViewer(url));
  }

  function installViewArtGuard() {
    if (viewArtGuardInstalled || typeof surface.stgToggleViewArt !== "function") return;
    var original = surface.stgToggleViewArt;
    surface.stgToggleViewArt = function () {
      var result = original.apply(this, arguments);
      surface.requestAnimationFrame(syncMobileCgViewer);
      return result;
    };
    surface.stgToggleViewArt._stgMobileGuard = true;
    viewArtGuardInstalled = true;
  }

  function cleanupMobileChrome() {
    var attackOverlay = viewDocument.getElementById("stg-atk-overlay");
    if (attackOverlay && attackOverlay._stgMobileArtOriginalZoom !== undefined) {
      attackOverlay.style.zoom = attackOverlay._stgMobileArtOriginalZoom;
      delete attackOverlay._stgMobileArtOriginalZoom;
    }
    cleanupMobileTopHud();
    if (surface.STG_MOBILE_MAIN_MENU) surface.STG_MOBILE_MAIN_MENU.cleanup();
    if (surface.STG_MOBILE_DIALOGS) surface.STG_MOBILE_DIALOGS.cleanup();
    if (surface.STG_MOBILE_SETTINGS) surface.STG_MOBILE_SETTINGS.cleanup();
    if (surface.STG_MOBILE_INGAME_OPTIONS) surface.STG_MOBILE_INGAME_OPTIONS.cleanup();
    if (surface.STG_MOBILE_COMPENDIUM) surface.STG_MOBILE_COMPENDIUM.cleanup();
    if (surface.STG_MOBILE_SAVES) surface.STG_MOBILE_SAVES.cleanup();
    if (surface.STG_MOBILE_UPGRADES) surface.STG_MOBILE_UPGRADES.cleanup();
    var cgViewer = viewDocument.getElementById("stg-mobile-cg-viewer");
    if (cgViewer) cgViewer.remove();
    var heads = viewDocument.querySelectorAll(".stg-mobile-settings-head");
    for (var i = 0; i < heads.length; i += 1) heads[i].remove();
    var scanButtons = viewDocument.querySelectorAll(".stg-mobile-scan-story-btn");
    for (var j = 0; j < scanButtons.length; j += 1) scanButtons[j].remove();
    var scans = viewDocument.querySelectorAll(".stg-mobile-scan-window");
    for (var s = 0; s < scans.length; s += 1) {
      scans[s].classList.remove("stg-mobile-scan-window");
      if (scans[s]._stgOriginalMinimized !== undefined) {
        scans[s].classList.toggle("stg-scan-minimized", scans[s]._stgOriginalMinimized);
        delete scans[s]._stgOriginalMinimized;
      }
    }
    var sheets = viewDocument.querySelectorAll(".stg-mobile-settings-sheet");
    for (var h = 0; h < sheets.length; h += 1) sheets[h].classList.remove("stg-mobile-settings-sheet");
    var tutorialNotes = viewDocument.querySelectorAll(".stg-mobile-tutorial-note");
    for (var t = 0; t < tutorialNotes.length; t += 1) tutorialNotes[t].remove();
    var tutorialHints = viewDocument.querySelectorAll(".stg-mobile-desktop-hint");
    for (var u = 0; u < tutorialHints.length; u += 1) tutorialHints[u].classList.remove("stg-mobile-desktop-hint");
    var optimizedTutorials = viewDocument.querySelectorAll('[data-stg-mobile-optimized="1"]');
    for (var v = 0; v < optimizedTutorials.length; v += 1) {
      optimizedTutorials[v].removeAttribute("data-stg-mobile-optimized");
    }
    var injectedSaves = viewDocument.querySelectorAll(".stg-mobile-save-btn");
    for (var m = 0; m < injectedSaves.length; m += 1) injectedSaves[m].remove();
    var prioritizedSaves = viewDocument.querySelectorAll(".stg-mobile-save-priority");
    for (var n = 0; n < prioritizedSaves.length; n += 1) {
      prioritizedSaves[n].classList.remove("stg-mobile-save-priority");
    }
  }

  /* Single-card character chooser. Native selection owns media, audio and
     deployment; only the mobile presentation and browsing index live here. */
  var characterLockFontReady;
  function loadCharacterLockFont() {
    if (characterLockFontReady || !surface.STG_MOBILE_UI || !surface.STG_MOBILE_UI.loadNotoEmoji) return;
    characterLockFontReady = LUNAR.api.moonshine.fonts.load('emoji');
  }
  function ensureCharacterCarousel() {
    var screen = viewDocument.getElementById("stg-charsel-root");
    var characters = surface.STG_CHARACTERS;
    if (!isMobile() || !screen || !Array.isArray(characters) || !characters.length) return;
    var tiles = screen.querySelectorAll(".charsel-tile");
    if (tiles.length !== characters.length) return;
    var state = screen._stgMobileCharacters;
    if (!state) {
      state = screen._stgMobileCharacters = { index: 0 };
      for (var n = 0; n < characters.length; n += 1) {
        if (characters[n].id === surface._stgSelectedCharId) state.index = n;
      }
      /* Enter with an actual selection so its original intro and backdrop
         appear immediately. Start New Game already unlocks audio on a gesture. */
      if (!surface._stgSelectedCharId && !characters[state.index].locked &&
          typeof surface.stgSelectCharacter === "function") {
        surface.stgSelectCharacter(characters[state.index].id);
        tiles = screen.querySelectorAll(".charsel-tile");
      }
    }
    for (var i = 0; i < characters.length; i += 1) {
      if (characters[i].id === surface._stgSelectedCharId) state.index = i;
    }
    state.index = Math.max(0, Math.min(state.index, characters.length - 1));
    screen.classList.add("stg-mobile-charsel");
    screen.classList.toggle("stg-mobile-character-locked", !!characters[state.index].locked);
    if (screen._stgMobileOriginalZoom === undefined) screen._stgMobileOriginalZoom = screen.style.zoom;
    clampMobileZoom();
    if (surface.STG_MOBILE_UI && surface.STG_MOBILE_UI.syncZoom) surface.STG_MOBILE_UI.syncZoom(screen);
    screen.style.setProperty("--stg-character-visual-width", surface.innerWidth + "px");
    for (var j = 0; j < tiles.length; j += 1) {
      tiles[j].classList.toggle("stg-mobile-character-current", j === state.index);
    }
    var list = screen.querySelector(".charsel-tiles");
    if (!list) return;
    var stage = screen.querySelector(".stg-mobile-character-stage");
    if (!stage) {
      stage = viewDocument.createElement("div");
      stage.className = "stg-mobile-character-stage";
      stage.setAttribute("role", "group");
      stage.setAttribute("aria-label", "Character selection");
      list.parentNode.insertBefore(stage, list);
      var card = viewDocument.createElement("div");
      card.className = "stg-mobile-character-card";
      card.setAttribute("role", "group");
      card.setAttribute("aria-label", "Character card");
      stage.appendChild(card);
      card.appendChild(list);
      function addArrow(direction, label, symbol) {
        var button = viewDocument.createElement("button");
        button.type = "button";
        button.className = "stg-mobile-character-arrow stg-mobile-character-" + direction;
        button.setAttribute("aria-label", label);
        button.textContent = symbol;
        button.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          var next = (state.index + (direction === "prev" ? -1 : 1) + characters.length) % characters.length;
          state.index = next;
          if (characters[next].locked) {
            /* Browsing a locked slot must never deploy the previous character. */
            surface._stgSelectedCharId = null;
            if (typeof surface.stgCharacterSelectBoot === "function") surface.stgCharacterSelectBoot();
          } else if (typeof surface.stgSelectCharacter === "function") {
            surface.stgSelectCharacter(characters[next].id);
          }
          ensureCharacterCarousel();
          var focus = screen.querySelector(".stg-mobile-character-" + direction);
          if (focus) focus.focus({ preventScroll: true });
        });
        stage.appendChild(button);
      }
      addArrow("prev", "Previous character", "◀");
      addArrow("next", "Next character", "▶");
    }
    var count = screen.querySelector(".stg-mobile-character-count");
    if (!count) {
      count = viewDocument.createElement("div");
      count.className = "stg-mobile-character-count";
      count.setAttribute("aria-live", "polite");
      stage.insertAdjacentElement("afterend", count);
    }
    count.textContent = (state.index + 1) + " of " + characters.length;
    var content = screen.querySelector(".charsel-content");
    if (content) {
      var back = content.querySelector(".charsel-back");
      var deploy = content.querySelector(".charsel-confirm");
      if (back) {
        if (back._stgMobileOriginalText === undefined) back._stgMobileOriginalText = back.textContent;
        back.textContent = "Return";
      }
      if (deploy) {
        if (deploy._stgMobileOriginalText === undefined) deploy._stgMobileOriginalText = deploy.textContent;
        deploy.textContent = "Deploy";
      }
      var lockedTags = content.querySelectorAll(".charsel-tile.locked .charsel-tile-tag");
      for (var lt = 0; lt < lockedTags.length; lt += 1) {
        if (lockedTags[lt]._stgMobileOriginalText === undefined) lockedTags[lt]._stgMobileOriginalText = lockedTags[lt].textContent;
        lockedTags[lt].textContent = "Coming Soon";
      }
      var locks = content.querySelectorAll(".charsel-lock");
      for (var li = 0; li < locks.length; li += 1) {
        if (locks[li]._stgMobileOriginalText === undefined) locks[li]._stgMobileOriginalText = locks[li].textContent;
        locks[li].textContent = "🔒︎";
      }
    }
    if (surface.STG_MOBILE_UI && surface.STG_MOBILE_UI.loadNotoSans) surface.STG_MOBILE_UI.loadNotoSans();
    loadCharacterLockFont();
    var landscape = viewDocument.body.classList.contains("stg-mobile-landscape");
    if (content) {
      if (content._stgOriginalInert === undefined) content._stgOriginalInert = content.inert;
      content.inert = landscape || content._stgOriginalInert;
    }
    var orientationNote = screen.querySelector(".stg-mobile-character-orientation");
    if (!orientationNote) {
      orientationNote = viewDocument.createElement("div");
      orientationNote.className = "stg-mobile-character-orientation";
      orientationNote.setAttribute("role", "status");
      orientationNote.textContent = "Please rotate your device. Character selection is available in portrait mode.";
      screen.appendChild(orientationNote);
    }
    orientationNote.hidden = !landscape;
    var arrows = stage.querySelectorAll(".stg-mobile-character-arrow");
    for (var k = 0; k < arrows.length; k += 1) arrows[k].disabled = characters.length < 2;
  }

  function cleanupCharacterCarousel() {
    var screen = viewDocument.getElementById("stg-charsel-root");
    if (!screen || !screen.classList.contains("stg-mobile-charsel")) return;
    var stage = screen.querySelector(".stg-mobile-character-stage");
    var list = screen.querySelector(".charsel-tiles");
    if (stage && list) { stage.parentNode.insertBefore(list, stage); stage.remove(); }
    var tiles = screen.querySelectorAll(".stg-mobile-character-current");
    for (var i = 0; i < tiles.length; i += 1) tiles[i].classList.remove("stg-mobile-character-current");
    var content = screen.querySelector(".charsel-content");
    if (content && content._stgOriginalInert !== undefined) {
      content.inert = content._stgOriginalInert;
      delete content._stgOriginalInert;
    }
    var note = screen.querySelector(".stg-mobile-character-orientation");
    if (note) note.remove();
    var count = screen.querySelector(".stg-mobile-character-count");
    if (count) count.remove();
    var changedText = screen.querySelectorAll(".charsel-back, .charsel-confirm, .charsel-tile-tag, .charsel-lock");
    for (var j = 0; j < changedText.length; j += 1) {
      if (changedText[j]._stgMobileOriginalText === undefined) continue;
      changedText[j].textContent = changedText[j]._stgMobileOriginalText;
      delete changedText[j]._stgMobileOriginalText;
    }
    screen.classList.remove("stg-mobile-charsel");
    screen.classList.remove("stg-mobile-character-locked");
    if (screen._stgMobileOriginalZoom !== undefined) {
      screen.style.zoom = screen._stgMobileOriginalZoom;
      delete screen._stgMobileOriginalZoom;
    }
    screen.style.removeProperty("--stg-character-visual-width");
    delete screen._stgMobileCharacters;
  }

  function optimizeMobileWidgets() {
    if (!isMobile()) return;
    /* Some passages reload the saved desktop preference after our initial
       viewport pass.  Reassert the temporary phone lock for every widget
       mutation so a late load cannot make panels draggable again. */
    applyMobileUiLock(true);
    if (surface.STG_MOBILE_MAIN_MENU) surface.STG_MOBILE_MAIN_MENU.mount();
    if (surface.STG_MOBILE_DIALOGS) surface.STG_MOBILE_DIALOGS.mount();
    if (surface.STG_MOBILE_SETTINGS) surface.STG_MOBILE_SETTINGS.mount();
    if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.mount();
    if (surface.STG_MOBILE_COMPENDIUM) surface.STG_MOBILE_COMPENDIUM.mount();
    if (surface.STG_MOBILE_INGAME_OPTIONS) surface.STG_MOBILE_INGAME_OPTIONS.mount();
    if (surface.STG_MOBILE_SAVES) surface.STG_MOBILE_SAVES.mount();
    if (surface.STG_MOBILE_UPGRADES) surface.STG_MOBILE_UPGRADES.mount();
    syncArtOverlayZoom(viewDocument.getElementById("stg-atk-overlay"));
    installZoomGuard();
    ensureCharacterCarousel();
    installViewArtGuard();
    clampMobileZoom();
    addMobileTutorialNote(viewDocument.querySelector(".stg-scan-tutorial"), "scan");
    addMobileTutorialNote(viewDocument.querySelector(".stg-portrait-tut"), "portrait");
    optimizeMobileSettings(viewDocument.getElementById("stg-settings-fly"));
    optimizeMobileScan(viewDocument.getElementById("stg-scan-overlay"));
    ensureMobileSaveButtons();
    ensureMobileTopHud();
    syncMobileCgViewer();
  }

  function updateMode() {
    scheduled = false;
    body = viewDocument.body;
    if (!body) return;

    var mode = displayConfig.detectMode();
    var mobile = mode === "mobile";
    if (mobile && activeMode !== "mobile") {
      desktopZoom = typeof surface._STG_ZOOM === "number" ? surface._STG_ZOOM : null;
    }
    // Browser zoom/keyboard can shrink visualViewport without a rotation.
    var landscape = surface.innerWidth > surface.innerHeight;
    var viewportShort = Math.min(surface.innerWidth, viewportHeight());
    var viewportLong = Math.max(surface.innerWidth, viewportHeight());
    var screenShort = Math.min(surface.screen.width || viewportShort, surface.screen.height || viewportLong);
    var screenLong = Math.max(surface.screen.width || viewportShort, surface.screen.height || viewportLong);
    var tallRatio = Math.max(viewportLong / viewportShort, screenLong / screenShort);
    /* Galaxy A35 profile: its 1080x2340 panel is normally exposed to a
       browser as roughly 384x832 CSS px.  A dimensional profile survives
       One UI display-size changes and browsers that omit the model name. */
    var a35 = displayConfig.mobile.a35;
    var a35Profile = mobile && viewportShort >= a35.minShort
      && viewportShort <= a35.maxShort && tallRatio >= a35.minTallRatio;
    body.dataset.stgDisplayMode = mode;
    body.classList.toggle("stg-mobile-ui", mobile);
    body.classList.toggle("stg-mobile-portrait", mobile && !landscape);
    body.classList.toggle("stg-mobile-landscape", mobile && landscape);
    body.classList.toggle("stg-a35-profile", a35Profile);
    if (mobile) root.style.setProperty("--stg-mobile-vh", viewportHeight() + "px");
    else root.style.removeProperty("--stg-mobile-vh");
    setViewportMode(mobile);
    applyMobileUiLock(mobile);
    if (mobile) optimizeMobileWidgets();
    else {
      cleanupMobileChrome();
      cleanupCharacterCarousel();
      if (activeMode === "mobile" && desktopZoom !== null) {
        surface._STG_ZOOM = desktopZoom;
        if (typeof surface.stgApplyZoom === "function") surface.stgApplyZoom();
        desktopZoom = null;
      }
    }
    activeMode = mode;
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    if (surface.STG_MOBILE_PAUSE) surface.STG_MOBILE_PAUSE.ui(function () { surface.requestAnimationFrame(updateMode); });
    else surface.requestAnimationFrame(updateMode);
  }

  function markPassage(event) {
    var passage = event && event.content;
    if (passage && passage.nodeType === 1) {
      passage.classList.add("stg-mobile-ready");
    } else {
      var current = viewDocument.querySelector(".passage:last-child");
      if (current) current.classList.add("stg-mobile-ready");
    }
    scheduleUpdate();
  }

  function setViewportMode(mobile) {
    var meta = viewDocument.querySelector('meta[name="viewport"]');
    if (mobile) {
      if (!originalViewport) {
        originalViewport = { existed: !!meta, content: meta && meta.getAttribute("content") };
      }
      if (!meta) {
        meta = viewDocument.createElement("meta");
        meta.name = "viewport";
        viewDocument.head.appendChild(meta);
      }
      meta.content = displayConfig.mobile.viewport;
    } else if (originalViewport) {
      if (meta && !originalViewport.existed) meta.remove();
      else if (meta && originalViewport.content === null) meta.removeAttribute("content");
      else if (meta) meta.setAttribute("content", originalViewport.content);
      originalViewport = null;
    }
  }

  updateMode();
  surface.addEventListener("resize", scheduleUpdate, { passive: true });
  surface.addEventListener("orientationchange", scheduleUpdate, { passive: true });
  if (surface.visualViewport) {
    surface.visualViewport.addEventListener("resize", scheduleUpdate, { passive: true });
  }
  if (touchPointer.addEventListener) touchPointer.addEventListener("change", scheduleUpdate);
  surface.addEventListener("stg-display-config-change", scheduleUpdate);

  viewDocument.addEventListener("DOMContentLoaded", updateMode, { once: true });

  /* SugarCube 2 navigation hooks.  Use jQuery when present, while the
     MutationObserver below keeps the layer useful if a later export changes
     event timing or replaces the story format internals. */
  if (surface.jQuery) {
    surface.jQuery(viewDocument).on(
      ":storyready.stgMobile :passagedisplay.stgMobile :passageend.stgMobile",
      markPassage
    );
  }

  var observer = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i += 1) {
      if (records[i].target.nodeType===1 && records[i].target.closest('#arc-dlg-text,#enc-text,#ev-text,#body-sense-host')) continue;
      if ([...records[i].addedNodes,...records[i].removedNodes].some(function(n){return n.nodeType===1;})) {
        markPassage();
        break;
      }
    }
  });

  /* Settings and scanner windows are appended directly to body rather than
     to SugarCube's passage container.  Observe only direct body children so
     heart animations and story subtree changes do not cause global churn. */
  var chromeObserver = new MutationObserver(function (records) {
    if (!isMobile()) return;
    for (var i = 0; i < records.length; i += 1) {
      for (var j = 0; j < records[i].addedNodes.length; j += 1) {
        var node = records[i].addedNodes[j];
        if (!node || node.nodeType !== 1) continue;
        if (node.id === "stg-settings-fly") optimizeMobileSettings(node);
        if (node.id === "stg-scan-overlay") optimizeMobileScan(node);
        if (node.id === "stg-atk-overlay") { syncArtOverlayZoom(node); }
      }
    }
  });

  /* The original eye button may keep a listener reference created before
     our wrapper is installed.  Watching the body class catches that path
     as well as view-art changes made by future exports. */
  var artModeObserver = new MutationObserver(function () {
    syncMobileCgViewer();
  });

  function observePassages() {
    var passages = viewDocument.getElementById("passages");
    if (passages) {
      observer.observe(passages, { childList: true, subtree: true });
      markPassage();
    }
    if (viewDocument.body) {
      chromeObserver.observe(viewDocument.body, { childList: true });
      artModeObserver.observe(viewDocument.body, {
        attributes: true,
        attributeFilter: ["class"]
      });
      optimizeMobileWidgets();
    }
  }

  surface.addEventListener("MOONSHINE-sources-change", function(){observePassages();scheduleUpdate();});
  if (viewDocument.readyState === "loading") {
    viewDocument.addEventListener("DOMContentLoaded", observePassages, { once: true });
  } else {
    observePassages();
  }
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
