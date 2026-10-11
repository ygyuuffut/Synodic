/* MOONSHINE owned presentation; surface and viewDocument are local ports, not native globals. */
(function(surface, viewDocument){
var setTimeout=surface.setTimeout,setInterval=surface.setInterval,requestAnimationFrame=surface.requestAnimationFrame;
/* Mobile presentation for native fullscreen, confirmation, age consent,
   Credits and Dev Features. Native buttons and callbacks stay in place. */
(function () {
  "use strict";

  function mobile() {
    return viewDocument.body && viewDocument.body.classList.contains("stg-mobile-portrait");
  }
  function setText(element, value) {
    if (!element) return;
    if (element._stgMobileOriginalText === undefined) {
      element._stgMobileOriginalText = element.textContent;
    }
    if (element.textContent !== value) element.textContent = value;
  }
  function restoreText(element) {
    if (element && element._stgMobileOriginalText !== undefined) {
      element.textContent = element._stgMobileOriginalText;
      delete element._stgMobileOriginalText;
    }
  }
  function syncOverlay(overlay) {
    if (overlay._stgMobileOriginalZoom === undefined) {
      overlay._stgMobileOriginalZoom = overlay.style.zoom;
    }
    surface.STG_MOBILE_UI.syncZoom(overlay);
  }
  function restoreOverlay(overlay) {
    if (overlay && overlay._stgMobileOriginalZoom !== undefined) {
      overlay.style.zoom = overlay._stgMobileOriginalZoom;
      delete overlay._stgMobileOriginalZoom;
    }
  }

  function fullscreen() {
    var overlay = viewDocument.getElementById("stg-fs-prompt");
    if (!overlay || !mobile()) return;
    syncOverlay(overlay);
    overlay.classList.add("stg-mobile-fs-dialog");
    setText(overlay.querySelector(".stg-fs-title"), "Enter Full Screen?");
    setText(overlay.querySelector(".stg-fs-yes"), "Yes, Fullscreen");
    setText(overlay.querySelector(".stg-fs-no"), "No, Thanks");
  }

  function confirm(options) {
    var overlay = viewDocument.getElementById("stg-confirm-modal");
    if (!overlay || !mobile()) return;
    if (overlay.classList.contains("stg-msave-rename")) return;
    if (options) overlay._stgMobileDialogTitleOnly = !!options.title && !options.body;
    var card = overlay.firstElementChild;
    if (!card) return;
    var children = Array.from(card.children);
    var actions = children.find(function (child) { return child.querySelector("button"); });
    var content = children.filter(function (child) { return child !== actions; });
    syncOverlay(overlay);
    overlay.classList.add("stg-mobile-confirm-dialog");
    card.classList.add("stg-mobile-confirm-card");
    var title = content.length > 1 || overlay._stgMobileDialogTitleOnly
      ? content[0] : null;
    var body = content.length > 1 ? content[1] : title ? null : content[0];
    if (title) title.classList.add("stg-mobile-confirm-title");
    if (body) {
      body.classList.add("stg-mobile-confirm-body");
      if (!body.querySelector(":scope > .stg-mobile-confirm-copy")) {
        var copy = viewDocument.createElement("div");
        copy.className = "stg-mobile-confirm-copy";
        while (body.firstChild) copy.appendChild(body.firstChild);
        body.appendChild(copy);
      }
    }
    if (actions) actions.classList.add("stg-mobile-confirm-actions");
    if (title && title.textContent.trim().length > 29) {
      title.classList.add("stg-mobile-confirm-long-title");
    }
    if (body) {
      body.classList.toggle("stg-mobile-confirm-overflow",
        body.scrollHeight > body.clientHeight + 1);
    }
  }

  function age() {
    var overlay = viewDocument.getElementById("stg-consent-overlay");
    if (!overlay || !mobile()) return;
    var modal = overlay.querySelector(".stg-consent-modal");
    var inner = modal && modal.querySelector(".stg-consent-modal-inner");
    if (!inner) return;
    syncOverlay(overlay);
    overlay.classList.add("stg-mobile-age-dialog");
    if (inner._stgMobileAgeOriginalNodes) return;
    inner._stgMobileAgeOriginalNodes = Array.from(inner.childNodes);
    var header = inner.querySelector(".stg-consent-header");
    var heading = inner.querySelector(".stg-consent-heading");
    var remember = inner.querySelector(".stg-consent-remember");
    var actions = inner.querySelector(".stg-consent-actions");
    var copy = viewDocument.createElement("div");
    copy.className = "stg-mobile-age-copy";
    inner.querySelectorAll(":scope > .stg-consent-section").forEach(function (section) {
      copy.appendChild(section);
    });
    inner.insertBefore(copy, remember || actions);
    setText(heading, "18+ Age Consent");
    if (remember) {
      setText(remember.querySelector("span"), "Remember My Choice");
      var checkbox = remember.querySelector("input[type=checkbox]");
      if (checkbox && !overlay._stgMobileAgeRememberInitialized) {
        checkbox.checked = false;
        overlay._stgMobileAgeRememberInitialized = true;
      }
    }
    if (actions) {
      setText(actions.querySelector(".stg-consent-btn-accept .stg-consent-btn-label"), "Consent");
      setText(actions.querySelector(".stg-consent-btn-decline .stg-consent-btn-label"), "Decline");
    }
    if (header) header.classList.add("stg-mobile-age-heading");
  }

  // Credits and developer shortcuts share a tall shell, but retain their
  // original content, button nodes, close handlers and warning entry points.
  function fitDevLabels(overlay, force) {
    var body = overlay.querySelector(".stg-mobile-tall-body");
    var widthKey = body.clientWidth + ":" + surface.innerWidth;
    if (!force && overlay._stgDevFitWidth === widthKey) return;
    overlay._stgDevFitWidth = widthKey;
    overlay.querySelectorAll(".stg-mobile-dev-label").forEach(function (label) {
      label.style.removeProperty("font-size");
      var size = parseFloat(getComputedStyle(label).fontSize);
      while (size > 10 && (label.scrollHeight > size * 2.3 + 1 || label.scrollWidth > label.clientWidth + 1)) {
        size -= 0.5;
        label.style.fontSize = size + "px";
      }
    });
  }

  function tallPanel(id, dev) {
    var overlay = viewDocument.getElementById(id);
    if (!overlay || !mobile()) return;
    syncOverlay(overlay);
    if (!overlay._stgMobileTallPanel) {
      var card = overlay.firstElementChild;
      var header = card && card.children[0];
      var body = card && card.children[1];
      var close = header && header.querySelector("button");
      var title = header && header.firstElementChild;
      if (!card || !body || !close || !title) return;
      var state = { card: card, header: header, body: body, close: close, title: title,
        buttons: [], sections: [], defaults: [] };
      overlay._stgMobileTallPanel = state;
      overlay.classList.add("stg-mobile-tall-panel", dev ? "stg-mobile-dev-panel" : "stg-mobile-credits-panel");
      card.classList.add("stg-mobile-tall-card");
      header.classList.add("stg-mobile-tall-header");
      title.classList.add("stg-mobile-tall-title");
      body.classList.add("stg-mobile-tall-body");
      close.classList.add("stg-mobile-tall-close");
      setText(title, dev ? "Dev Features" : "Credits");
      setText(close, "Close");
      card.appendChild(close);
      if (dev) {
        var accents = { "Logic Route": "#f4d975", "Gilly": "#628063",
          "Avery": "#508ab5", "Avery’s Stomach": "#d55eb9" };
        var accent = "hsl(260, 45%, 69%)";
        var uniform = false;
        Array.from(body.children).forEach(function (node) {
          if (node.tagName !== "BUTTON") {
            if (node.textContent.trim() === "Card Testing") uniform = true;
            accent = (!uniform && accents[node.textContent.trim()]) || "hsl(260, 45%, 69%)";
            node.classList.add("stg-mobile-dev-section");
            state.sections.push(node);
          } else {
            var originalNodes = Array.from(node.childNodes);
            var text = node.textContent.replace(/\\?U0001F41E|\u{1F41E}/giu, "").trim();
            var label = viewDocument.createElement("span");
            label.className = "stg-mobile-dev-label";
            var split = text.indexOf(" (");
            label.appendChild(viewDocument.createTextNode(split < 0 ? text : text.slice(0, split)));
            if (split >= 0) {
              label.appendChild(viewDocument.createElement("br"));
              label.appendChild(viewDocument.createTextNode(text.slice(split + 1)));
            }
            node.replaceChildren(label);
            node.classList.add("stg-mobile-dev-button");
            state.buttons.push({ node: node, originalNodes: originalNodes });
          }
          node.style.setProperty("--stg-dev-accent", accent);
        });
      } else {
        // Only the native default name color changes; colored nested spans,
        // section titles and the italic final thank-you keep their formatting.
        body.querySelectorAll("[style]").forEach(function (node) {
          if (node.style.color === "rgb(232, 214, 238)") {
            node.classList.add("stg-mobile-credit-default");
            state.defaults.push(node);
          }
        });
      }
    }
    if (dev) fitDevLabels(overlay);
  }

  function restoreTallPanel(id) {
    var overlay = viewDocument.getElementById(id);
    var state = overlay && overlay._stgMobileTallPanel;
    if (!state) return;
    state.header.appendChild(state.close);
    restoreText(state.close);
    restoreText(state.title);
    state.buttons.forEach(function (item) {
      item.node.replaceChildren.apply(item.node, item.originalNodes);
      item.node.classList.remove("stg-mobile-dev-button");
      item.node.style.removeProperty("--stg-dev-accent");
    });
    state.sections.forEach(function (node) {
      node.classList.remove("stg-mobile-dev-section");
      node.style.removeProperty("--stg-dev-accent");
    });
    state.defaults.forEach(function (node) { node.classList.remove("stg-mobile-credit-default"); });
    ["card", "header", "title", "body", "close"].forEach(function (part) {
      state[part].classList.remove("stg-mobile-tall-" + part);
    });
    overlay.classList.remove("stg-mobile-tall-panel", "stg-mobile-dev-panel", "stg-mobile-credits-panel");
    restoreOverlay(overlay);
    delete overlay._stgDevFitWidth;
    delete overlay._stgMobileTallPanel;
  }

  function restore() {
    restoreTallPanel("stg-credits");
    restoreTallPanel("stg-dev-menu");
    var fs = viewDocument.getElementById("stg-fs-prompt");
    if (fs) {
      fs.classList.remove("stg-mobile-fs-dialog");
      [".stg-fs-title", ".stg-fs-yes", ".stg-fs-no"].forEach(function (selector) {
        restoreText(fs.querySelector(selector));
      });
      restoreOverlay(fs);
    }
    var dialog = viewDocument.getElementById("stg-confirm-modal");
    if (dialog) {
      dialog.classList.remove("stg-mobile-confirm-dialog");
      dialog.querySelectorAll(".stg-mobile-confirm-copy").forEach(function (copy) {
        copy.replaceWith.apply(copy, Array.from(copy.childNodes));
      });
      dialog.querySelectorAll(".stg-mobile-confirm-card, .stg-mobile-confirm-title, .stg-mobile-confirm-body, .stg-mobile-confirm-actions, .stg-mobile-confirm-long-title, .stg-mobile-confirm-overflow").forEach(function (node) {
        node.classList.remove("stg-mobile-confirm-card", "stg-mobile-confirm-title",
          "stg-mobile-confirm-body", "stg-mobile-confirm-actions", "stg-mobile-confirm-long-title",
          "stg-mobile-confirm-overflow");
      });
      restoreOverlay(dialog);
    }
    var consent = viewDocument.getElementById("stg-consent-overlay");
    if (consent) {
      consent.classList.remove("stg-mobile-age-dialog");
      var inner = consent.querySelector(".stg-consent-modal-inner");
      if (inner && inner._stgMobileAgeOriginalNodes) {
        inner.replaceChildren.apply(inner, inner._stgMobileAgeOriginalNodes);
        delete inner._stgMobileAgeOriginalNodes;
        restoreText(inner.querySelector(".stg-consent-heading"));
        restoreText(inner.querySelector(".stg-consent-remember span"));
        restoreText(inner.querySelector(".stg-consent-btn-accept .stg-consent-btn-label"));
        restoreText(inner.querySelector(".stg-consent-btn-decline .stg-consent-btn-label"));
        var header = inner.querySelector(".stg-consent-header");
        if (header) header.classList.remove("stg-mobile-age-heading");
      }
      restoreOverlay(consent);
    }
  }

  function wrap(name, adapt) {
    var original = surface[name];
    if (typeof original !== "function" || original._stgMobileDialogHook) return;
    var hooked = function () {
      var result = original.apply(this, arguments);
      adapt(arguments[0]);
      return result;
    };
    hooked._stgMobileDialogHook = true;
    surface[name] = hooked;
  }
  function mount() {
    wrap("stgMaybeShowFullscreenPrompt", fullscreen);
    wrap("stgShowConfirmModal", confirm);
    wrap("stgShowAlertModal", confirm);
    wrap("stgShowConsentOverlay", age);
    wrap("stgOpenCredits", function () { tallPanel("stg-credits", false); });
    wrap("stgShowDevMenu", function () { tallPanel("stg-dev-menu", true); });
    fullscreen();
    confirm();
    age();
    tallPanel("stg-credits", false);
    tallPanel("stg-dev-menu", true);
  }
  {
    LUNAR.api.moonshine.fonts.subscribe(function (value) {
    if(!["ui", "symbol"].includes(value.role))return;
      var overlay = viewDocument.querySelector(".stg-mobile-dev-panel");
      if (overlay && mobile()) fitDevLabels(overlay, true);
    });
  }
  surface.STG_MOBILE_DIALOGS = { mount: mount, cleanup: restore };
})();

})(window.MOONSHINE_WORKSPACE.window,window.MOONSHINE_WORKSPACE.document);
