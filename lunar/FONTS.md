# LUNAR Font Resource API（b6.6，2026-10-04）

字體資源歸 LUNAR 管理。MOONSHINE 只透過 `LUNAR.api.moonshine.fonts` 消費 logical roles、family stack 與非阻塞 readiness；不得知道 Google URL、woff2 檔名、base64 或 cache。完整使用者設計保留於 [requirements](../diagnostics/b66-font-requirements.md)，本輪量測與盤點見 [report](../diagnostics/b66-fonts-scan-2026-10-04.md)。

## 接口

- `resolve(role)` → frozen `{role, family, classification, state, profile}`。role 為 `ui / display / mono / emoji / symbol / symbol2 / system`。未知 role 回退 system；state 為 unrequested/loading/ready/fallback。
- `load(role)` → Promise<boolean>，按需求開始、去重、session 重用；失敗回退，UI 不等待它才 paint。inactive resource 不載入。
- `subscribe(fn)` → unsubscribe。只通知相關 role readiness；消費者只 invalidate 使用該 role 的當前元件。
- `stack(family)`、`styles(declarations)`：既有兼容資料的實體名稱 → logical CSS variable。未知 family 保留；b6.8 使用者授權將已盤點原版 family／ending typography 全部映射到現有 logical roles（見下節）。
- `roles()`、`owns(family)`：logical role 列表及 font event ownership。無資源 payload、檔名、日誌內容或遊戲 refresh 接口。

`lunar.fonts.manifest.json` 是唯一資源註冊表；五個共同子集只有一份，不複製 mobile/desktop。Bootstrap 兩個 tiny face 及原版 tme-fa-icons 登記為 externalResources：原有 bootstrap/原版載入點維持，沒有重複封包。native style consumer DTO 排除所有 font-face／LUNAR resource stylesheet，WOFF/base64 不跨層傳入 MOONSHINE，也不複製到 workspace。首屏必要 UI 為 critical；其他資源 deferred，CSS 首次真正使用或 load(role) 才解碼。所有新增 face 為 swap，絕不阻塞月相 Shell。当前 injector 拒絕未實作 gate 的 profile-specific face；未來支援時必須先實作 inactive 註冊門控。

## 構建／門控

`build_fonts.py` 使用 fontTools / Brotli 在構建時從 `assets/fonts/sources/` 產生小型 WOFF2。source 與 subset 大小、SHA-256、glyph 數保留在 `diagnostics/b66-font-subsets.json`。標準 injector 只讀已產生的子集，不需要 runtime subset 或 fontTools。源字體與授權留在項目內，不把完整源字體打包到 HTML。新 family 內部 name 改為 SYNODIC，遵守 OFL Reserved Font Name。

使用者已授權阻斷新 UI 未顯示的原版字體：injector 僅在生成檔的 native STYLE 中，以可逆標記替換 Cinzel／Crimson Pro Google @import。exact 原文存為 inert JSON；reinjection 先精確還原，再去除注入區塊、計算原版 fingerprint。完整 integrity test 先還原再逐字比較，並驗證標記一對一，沒有放寬 native JS／遊戲機制比較。LUNAR resources bridge 也門控後續 native STYLE 中的 Google font imports。原始 b5 不改動，不通用封鎖任意網絡；mobile consumer declarations 依 b6.8 授權映射 typography，原版輸入本身保持不變。

Distance 保留既有同家族、同軸 SVG 槽；不再下載 Material Symbols font。二級 Loading arrow 已是 SVG。Rounded／Sharp 沒有正式 active face，不預載整套 icon family。

## Fallback、lifetime、Logger

Latin/UI/Mono 未涵蓋的 CJK 直接走 system-ui／OS fallback；不帶完整 CJK 字庫，不改寫 translated DOM。font ready 沒有 game capture、state refresh、root render 或 global fit。原有依賴 role 的 HUD、ACTIONS、Mods、Save/Dev labels 局部 fit 保留；font event 不再排 runtime font-domain 通用 render。Bootstrap 最早期 family 名稱是唯一獨立殼層例外：在 LUNAR API 尚未啟動前使用內嵌 tiny face，來源仍由構建資源註冊。

載入完的 face 不在 scene transition 卸載／重載。Logger 用 `LUNAR.fonts` 記 FONT_PROFILE_RESOLVED、FONT_CRITICAL_READY；失敗記 FONT_LOAD_FAILED／FONT_FALLBACK_USED（role/resource/fallback/elapsed），原始 exception 透過正式 error 接口保存。不記 lookup/glyph/layout/frame，不讀 log 作 runtime 狀態。

## 新字體 review

- [ ] 現有 logical role 是否已足够？是否真的需要新 font？
- [ ] 用途／實際 WOFF2 bytes／critical 或 deferred／subset glyph／fallback 已說明？
- [ ] 沒有新增 Google waterfall、Core remote dependency 或完整 CJK？
- [ ] 首次 paint 不等 font ready；translated CJK fallback 正常？
- [ ] readiness 只 local fit，無 capture/state refresh/整根 render/fit？
- [ ] inactive profile 不產生請求，session 重用，不在場景卸載？

子集工具與 readiness 行為依據：[fontTools subset](https://fonttools.readthedocs.io/en/latest/subset/index.html)、[FontFaceSet loadingdone](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/loadingdone_event)。

固定 LUNAR-font-resources 不進 bridge.resources 的 routine native STYLE 轉換／textContent 檢查；font payload 不在每次 actions／workspace 更新讀取或拷貝。瀏覽器回歸覆蓋零次讀取。

## b6.7 戰鬥字形補充

common/deferred `font.emoji`（Noto Emoji單色）納入💘／⚔／🛡／🔋／🃏。既有coverage只有🔋缺失，29,808→29,852B，+44B；沒有color font tables。MOONSHINE沿logical emoji role，固定slot不需font ready fit／game refresh；不新增family／遠端字體。build_fonts.py仍從正式module Unicode產生可重現子集，詳細bytes/hash保持在diagnostics/b66-font-subsets.json這個現行資源盤點中。

## b6.8 Native ending typography retirement（2026-10-08）

Cinzel／Crimson Pro／Georgia／Helmet／Freesans／serif／sans-serif aliases 指向既有 ui face；Consolas／Courier New／monospace 指向 mono。font-family 與 font shorthand 經 styles，同時保留 weight/style/size/line-height/important；SVG presentation attribute 經 stack，rich inline declarations 經 styles。Unknown/icon families 保留，embedded tme-fa-icons 不退役。沒有新字體、subset rebuild、網絡依賴或 font-ready game refresh。build_fonts.py 保存同一 alias policy，之後離線再生不丟失映射。LOVE glyph用Noto Emoji logical role，copy/數值用JetBrains Mono；既有五份嵌入字庫及 bytes 不變。

## b6.9 report roles（2026-10-09）

Report statistics/header/footer use existing mono, title/button/announcement use UI, upgrades use Emoji. No new face/subset/source or remote dependency. Long PNG export paints computed owned families and browser-translated wrappers at explicit user request; it neither reads font resource bytes nor loads remote font providers, never writes translation into LUNAR. Existing standard card/upgrade detail typography remains shared.

## b6.9 shared Emoji measurement correction（2026-10-09）

The common ACTIONS/upgrade-preview/scanner-row fitter measures `getComputedStyle(glyph).fontFamily`, resolved from the logical Emoji role. Canvas font parsing does not resolve CSS custom properties: assigning `400 35px var(--SYNODIC-font-emoji)` leaves `10px sans-serif` in Chrome. Measuring that fallback while DOM paints Noto produced wrong size/centering and clipped ink. Reuse embedded family/coverage, local readiness and cached cell fits; no face/subset/network payload or injector font-import change. Real slot ink is verified against an otherwise identical unclipped rendering at DPR1/3; these are host-browser pixels, not A35 measurements.


The b6.9 Lab confirm reuses UI role and Emoji arrow. LOVE collapsed summary retains mono but ordinary one-line/ellipsis geometry; its expanded detail alone shows the mono numeric badge with Emoji heart. No font bytes, resources, subset, imports or readiness policy change.
