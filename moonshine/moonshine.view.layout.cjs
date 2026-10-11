/* Compatibility selectors retain relative specificity; layout priority stays in the owned tree. */
window.MOONSHINE_LAYOUT_CSS = `
#MOONSHINE-root#MOONSHINE-root {display:block;position:fixed;inset:0;z-index:2147483646;pointer-events:auto;--ms-font:var(--SYNODIC-font-ui);--ms-color:#aa92cf;--ms-panel:#2c2537;--ms-hud-top:max(10px,env(safe-area-inset-top,0px));--ms-hud-left:max(14px,env(safe-area-inset-left,0px));--ms-hud-right:max(14px,env(safe-area-inset-right,0px));--ms-safe-top:env(safe-area-inset-top,0px);--ms-safe-bottom:env(safe-area-inset-bottom,0px);}
#MOONSHINE-root#MOONSHINE-root.MOONSHINE-mode-stg-a35-profile {--ms-hud-top:max(20px,env(safe-area-inset-top,0px));--ms-hud-left:max(16px,env(safe-area-inset-left,0px));--ms-hud-right:max(16px,env(safe-area-inset-right,0px));}
#MOONSHINE-root#MOONSHINE-root [data-ms-view] {display:contents;}
#MOONSHINE-root#MOONSHINE-root [data-ms-component] {box-sizing:border-box;pointer-events:auto;}
#MOONSHINE-root#MOONSHINE-root [data-ms-component="button"] {touch-action:manipulation;}
#MOONSHINE-root#MOONSHINE-root [data-ms-component="slider"] {min-width:0;max-width:100%;touch-action:pan-x;}
#MOONSHINE-root#MOONSHINE-root [data-ms-component="scroll"] {min-height:0;min-width:0;overscroll-behavior:contain;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-footer"] {display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-view"] {justify-self:start;max-width:100%;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-actions"] {justify-self:end;max-width:100%;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-status"] {position:static !important;grid-column:2;left:auto;top:auto;transform:none !important;justify-self:center;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-panel"] {bottom:calc(10px + var(--ms-safe-bottom)) !important;max-height:calc(var(--stg-mobile-vh,100dvh) - var(--ms-safe-top) - var(--ms-safe-bottom) - 100px) !important;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-ig-panel"],#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-mc-shell"],#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-msave-panel"],#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-mobile-tall-card"] {max-height:calc(var(--stg-mobile-vh,100dvh) - var(--ms-safe-top) - var(--ms-safe-bottom) - 16px) !important;min-height:0;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-root"] {min-height:var(--stg-mobile-vh,100dvh) !important;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-mobile-top-hud"] {position:fixed !important;top:calc(var(--ms-hud-top) + 6px) !important;left:var(--ms-hud-left) !important;right:var(--ms-hud-right) !important;width:auto !important;max-width:none !important;}
#MOONSHINE-root#MOONSHINE-root [data-ms-component="card"] {min-width:0;}
/* A nested card detail stays in its keyed scene projection and escapes the
   scene stacking context. Neutralize only popover defaults; retain its skin. */
#MOONSHINE-root#MOONSHINE-root [data-lunar-control-role="cards.detailBackdrop"][popover] {margin:0;border:0;width:100vw;height:var(--stg-mobile-vh,100dvh);max-width:none;max-height:none;overflow:visible;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-mobile-cg-viewport"] {width:100% !important;height:auto !important;max-height:100%;}
#MOONSHINE-root#MOONSHINE-root :is([data-ms-id="stg-mobile-ingame-options"],[data-ms-id="stg-mobile-cg-viewer"],[data-ms-id="stg-atk-overlay"],[data-ms-id="stg-confirm-modal"],[data-ms-id="stg-prompt-modal"],[data-ms-id="stg-consent-overlay"],[data-ms-id="stg-fs-prompt"],[data-ms-id="stg-slot-picker"],[data-ms-id="stg-compendium"],[data-ms-id="stg-credits"],[data-ms-id="stg-dev-menu"],[data-ms-class~="lab-overlay"]) {height:var(--stg-mobile-vh,100dvh) !important;max-height:var(--stg-mobile-vh,100dvh) !important;bottom:auto !important;top:var(--ms-visual-top,0px) !important;}
#MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-banner-menu-btn"]::after {content:"☰" !important;display:block !important;opacity:1 !important;font:400 clamp(19px,5.3vw,31px)/1 var(--SYNODIC-font-symbol2);position:static !important;transform:translateY(.10em);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="button"] {display:flex;align-items:center;justify-content:center;min-height:36px;padding:6px 12px;border:1px solid var(--ms-color);border-radius:999px;background:var(--ms-background,transparent);color:var(--ms-color);font:400 var(--ms-font-size,16px)/1.2 var(--ms-font);text-align:center;}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="button"]:disabled {opacity:.4;cursor:default;}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="panel"] {display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:0;padding:12px;border:1px solid var(--ms-color);border-radius:18px;background:var(--ms-panel);color:var(--ms-color);max-height:calc(var(--stg-mobile-vh,100dvh) - 16px);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="scroll"] {overflow:auto;}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="card"] {display:grid;min-width:0;width:var(--ms-width,100%);aspect-ratio:var(--ms-aspect,3/4);border:1px solid var(--ms-color);border-radius:12px;overflow:hidden;background:var(--ms-panel);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="pill"] {display:flex;align-items:center;justify-content:center;min-height:28px;padding:4px 10px;border:1px solid var(--ms-color);border-radius:999px;background:var(--ms-background,var(--ms-panel));color:var(--ms-color);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="symbol"] {display:grid;place-items:center;min-width:0;min-height:0;overflow:hidden;color:var(--ms-color);font:400 var(--ms-font-size,24px)/1 var(--SYNODIC-font-emoji);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="number"] {min-width:0;text-align:center;white-space:nowrap;color:var(--ms-color);font:600 var(--ms-font-size,24px)/1 var(--SYNODIC-font-mono);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-component="slider"] {width:100%;min-height:24px;accent-color:var(--ms-color);}
#MOONSHINE-root#MOONSHINE-root [data-ms-pure="true"][data-ms-selected="true"] {background:var(--ms-color);color:var(--ms-panel);}
@media(max-height:580px){
 #MOONSHINE-root#MOONSHINE-root [data-ms-class~="stg-story-panel"] {height:min(82vw,calc(var(--stg-mobile-vh,100dvh) - 80px)) !important;}
}
`;
