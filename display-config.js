/* Display mode policy for the standalone STG mobile injector.
   auto: phones and primary touch devices use mobile; mouse/trackpad
   browsers keep the game's desktop layout even in a narrow window. */
(function () {
  "use strict";

  var config = {
    mode: "auto", // auto | mobile | desktop
    mobile: {
      pointerQuery: "(hover: none) and (pointer: coarse)",
      viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
      minZoom: 0.5,
      portraitZoom: 1.5,
      landscapeZoom: 1.5,
      lockUi: true,
      cardArtResolution: 0.30, // All mobile card art
      cardDetailArtResolution: 0.30,
      cgArtResolution: 0.60,
      intermissionArtResolution: 0.40,
      a35: { minShort: 350, maxShort: 440, minTallRatio: 2 }
    },
    desktop: { useNativeGameLayout: true },

    wixCardVariantUrl: function (source, cssWidth, cssHeight, resolution) {
      if(window.LUNAR && LUNAR.adapter.images)return LUNAR.adapter.images.variant(source,cssWidth,cssHeight,resolution);
      if (!/^https:\/\/static\.wixstatic\.com\/media\/[^/]+\.(?:png|jpe?g|webp)(?:\/|$)/i.test(source)) {
        return source;
      }
      source = source.replace(/\/v1\/.*$/, "");
      var density = Math.max(1, window.devicePixelRatio || 1) * resolution;
      var width = Math.min(1600, Math.max(24, Math.round(cssWidth * density)));
      var height = Math.min(1600, Math.max(24, Math.round(cssHeight * density)));
      var result=source + "/v1/fill/w_" + width + ",h_" + height + "/file.webp";
      if(window.LUNAR && LUNAR.adapter.images)LUNAR.adapter.images.approve(result);
      return result;
    },
    wixCardImageUrl: function (source, cssWidth, cssHeight) {
      return this.wixCardVariantUrl(source, cssWidth, cssHeight, this.mobile.cardArtResolution);
    },
    wixCardDetailImageUrl: function (source, cssWidth, cssHeight) {
      return this.wixCardVariantUrl(source, cssWidth, cssHeight, this.mobile.cardDetailArtResolution);
    },

    wixArtImageUrl: function(source,kind,width,height) {
      if(window.LUNAR && LUNAR.adapter.images)return LUNAR.adapter.images.art(source,kind,width,height);
      var ratio=kind==='card'?this.mobile.cardArtResolution:kind==='intermission'?this.mobile.intermissionArtResolution:this.mobile.cgArtResolution;
      var result=this.wixCardVariantUrl(source,width||window.innerWidth,height||window.innerHeight,ratio);
      if(kind!=="card")result=result.replace("/v1/fill/","/v1/fit/");
      if(window.LUNAR && LUNAR.adapter.images)LUNAR.adapter.images.approve(result);
      return result;
    },

    detectMode: function () {
      if (this.mode === "mobile" || this.mode === "desktop") return this.mode;
      var touchPointer = window.matchMedia(this.mobile.pointerQuery).matches;
      var mobileHint = !!(navigator.userAgentData && navigator.userAgentData.mobile);
      var mobileAgent = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent || "");
      return touchPointer || mobileHint || mobileAgent ? "mobile" : "desktop";
    },

    setMode: function (mode) {
      if (mode !== "auto" && mode !== "mobile" && mode !== "desktop") {
        throw new TypeError("Display mode must be auto, mobile, or desktop");
      }
      this.mode = mode;
      window.dispatchEvent(new Event("stg-display-config-change"));
    }
  };

  window.STG_DISPLAY_CONFIG = config;
})();
