# SYNODIC（月相）硬性架構規範

生效：2026-09-30；項目定位與依賴模型更新：2026-10-01。本文件優先於舊 b5／b6 適配記錄。所有後續開發必須遵守；責任歸屬模糊時，先詢問使用者，不自行決定跨層例外。

## 項目身份與結構

《SYNODIC》（月相）是一套針對原版遊戲的**行動端兼容、資料轉接、顯示與擴展框架**，不再僅定位為手機 HUD／UI 改造。SYNODIC Core 由 LUNAR API（太陰）與 MOONSHINE UI（月華）構成：架構職責分離，但安裝與運行互為必要依賴，共同部署為 SYNODIC Runtime。安裝任一核心部分都必須同時啟用／注入另一部分；不能將它們當作可任意單獨部署的產品。

HECATE（冥月）明確歸為 **SYNODIC MOD**，是非公開的開發者調試／修改工具分支，不屬於核心。它可以與核心同步開發及在私人工作目錄中管理，但公開版本中 HECATE 本體、專用 LUNAR API 及僅供它使用的 UI 組裝內容完全不存在。

對外概念：**SYNODIC: LUNAR API**（資料、兼容與交互基礎）、**SYNODIC: MOONSHINE UI**（通用行動端顯示與交互基礎）、**SYNODIC MOD: HECATE**（非公開的開發工具）。目前實際產品範圍只有手機／行動端；通用元件不代表已支援另一個前端。逐步允許多個前端或 MOD 共用 LUNAR，但不為尚不存在的桌面端或第三方 MOD 生態過度工程化；現有 desktop 委派僅維持原版顯示。

SYNODIC 是注入項目的名稱，不是將 STG 遊戲本體改名。現階段工作目錄為 SYNODIC/；正式源檔、腳本、開發文檔和測試集中在此，b6 生成檔在 builds/，介面設計源檔與概念圖在 design/。STG 本體與已驗收 b5 作外部輸入留在上一層；遊戲輸入／生成檔沿用既有 b5／b6 名稱。

## 邊界

## SYNODIC Font Rules（LUNAR API，b6.6，2026-10-04）

完整設計：[使用者原文](diagnostics/b66-font-requirements.md)；正式契約／review checklist：[LUNAR Font API](lunar/FONTS.md)。

1. 新 UI 不得直接加入遠端 font dependency。
2. 新字體必須先註冊為 logical font role/resource。
3. MOONSHINE component 不得硬編碼 Google Fonts URL；來源、WOFF2/base64、cache 只屬 LUNAR resources。
4. Core critical UI 不得等待遠端 font 才首次 paint；Loading Shell 使用極小內嵌 face。
5. 小型 Latin/symbol WOFF2 可內嵌，大型 CJK 不得默認內嵌。
6. Browser-translated CJK 優先使用 system fallback，不回寫 canonical text。
7. Font ready 只 invalidate affected component，不得無條件 global fit/full render。
8. Inactive profile font 不得產生 network request；共同字體標記 common。
9. Font loading 不得觸發 game capture/game-state refresh。
10. 新增 font 前說明用途、實際大小、critical/deferred、是否可 subset。
11. 同一 logical purpose 不得無理由引入近似字體；已載入 face 在 session 內重用。
12. 字體最佳化屬資源 hygiene，禁止性能退化；完整性能 pass 等 UI 結構完成後再做，不擴大成本輪 native typography/startup 重構。


### 硬性翻譯隔離契約（b6.6）

Browser translation is treated as an external presentation-layer mutation. It must not modify LUNAR canonical state, trigger game-state refresh, or cause unrelated MOONSHINE components to rerender.

Translated text nodes should retain identity across unrelated state updates.

翻譯後文字／包裝只屬 MOONSHINE 可見呈現，不回寫原版、LUNAR adapter 或 buffer。可見 DOM observer 僅標記受影響元件的 geometry；不得通知遊戲資料刷新或通用 render。未變來源內容保留文字、元素及翻譯包裝身份。

頂部 HUD 的 i、HP、圖標及數值屬固定 UI 符號，不參與瀏覽器翻譯；MOONSHINE 對自有 HUD 容器設定 translate=no，不影響正文、菜單說明的可翻譯 DOM。普通資料更新保留其節點與翻譯排除屬性。

### b6.6 LUNAR Logger 邊界（2026-10-03）

正式使用／讀取規範：[lunar/LOGGER_USAGE.md](lunar/LOGGER_USAGE.md)，保留使用者30條要求。Logger 是 **LUNAR API 管轄的唯一正式診斷接口**；LUNAR、MOONSHINE、MOD／HECATE及未來 Core subsystem 都受此約束，不另建第二個正式ring／crash log或persistence系統。新功能／重大狀態切換／可恢復異常須評估重要breadcrumb，依scope ownership、級別語義、小型structured payload／ID及error/context記錄事件鏈。

普通runtime不得讀previous/current contents或Logger return value決定game/UI行為；只有正式diagnostic export、Logger maintenance或另行授權的私人developer inspection可以讀。所有跨層read/export/write使用正式LUNAR consumer接口，MOONSHINE/MOD不得讀ring、DB schema/key、checkpoint queue或其他internal shape。公版previous-only，current保護；普通MOD僅自己的MOD.<id> scope，無raw logs、別人私有內容或rotate權限。未來私人viewer/read API不因本規範自動存在。

Write必須非阻塞／memory-first／fail-soft，不等待storage，不為記錄新增capture／clone／DOM serialization／layout量測，不逐frame／mutation記錄。記error不吞原錯誤，按原功能fallback／rollback／rethrow；DEBUG/INFO/WARN/ERROR/FATAL不得濫用。Logger不是profiler、IPC或state manager；translation不是canonical error，彩蛋TOML缺失/空/錯誤不得影響核心。性能策略為禁止明顯退化、暫不精修Logger，完整pass延後；既有量測與新功能准入規則保留。任何signature／scope／export format／session semantics／MOD access改動均屬LUNAR API契約評估範圍。

以下描述目前實作；新要求與實作差距以LOGGER_USAGE的對照為準，不以規範更新冒充runtime變更。


Logger 是 LUNAR Core 的 observer-only infrastructure，有獨立有界記錄及 IndexedDB checkpoint；不屬遊戲 buffer／canonical state，不向 game port.emit 發通知，不提供遊戲或 UI 決策資料。禁止 game state → logger → runtime state。LUNAR.logger.scope(name) 統一提供五級寫入；MOONSHINE 透過 api.moonshine.logger，MOD 透過公共 scope（HECATE 專用 API 的 logger 綁 MOD.hecate）。沒有 MOD 清空、session rotate、其他模組讀取或 permissions framework。

一個 HTML bootstrap＝一個 session；原生 passage／存檔載入不 rotate。memory circular ring 每局1500 entries，header 不計入；IndexedDB 固定 current／previous 兩筆，啟動 transaction 以 current 覆寫 previous，新增 current，oldest 消失。普通 append 不 capture／clone game／DOM、不 stringify、不讀 geometry；有界 payload、快取固定 scope；checkpoint 按64條／2秒 dirty timeout 合批，ERROR／FATAL、visibility hidden／pagehide 優先嘗試，沒有 idle polling。core／storage先於bridge.pause保留原生計時器，診斷timer不進遊戲timer registry／不附加game emit，暫停遊戲不阻止checkpoint；Blob URL清理走MOONSHINE timing.ui。寫入失敗隔離降級 memory／console warning；跨頁 ownership 比對防止舊 tab 回寫新 current。

只把 `status/subscribe/exportPrevious` 放進 MOONSHINE diagnostics API；status 只供匯出可用性，不參與畫面或遊戲路由。Mods 底部左 Export Log／右 Close 用正常流 Grid，匯出 handler 取 LUNAR 已格式化的 previous text，建 Blob 下載並釋放 URL；UI 不保存、解析、管理 session 或 log rows。此 Logger availability 訂閱局部 patch 按鈕，不觸發 Mods refresh／全局 fit／game notification。公版與本輪私人版均無 current 匯出或 viewer。

error／unhandledrejection listener 不 preventDefault、不吞遊戲異常；bridge／render instrumentation catch 記錄後 rethrow，非同步 command 只記 returned，不為記錄加入 rejection handler 改 Promise 身份。normal pagehide 的 clean 标記僅在 checkpoint 真正落盤後可存活；BFCache 不結束／rotate。unclean 不等於 confirmed crash。詳細契約／限制／測試見 lunar/LOGGER.md。

### b6.6 地圖資訊邊界（第一輪）

所有 MOONSHINE Material Symbols（Rounded／Outlined／Sharp）允許使用同格 SVG 備援；字體／SVG 載入及可見性切換皆屬 presentation，不加入 LUNAR canonical state 或 game notification。等待／失敗也保留控制項、焦點、動畫與翻譯 DOM 身份，不新增全局 fit／輪詢。位置入口使用 Outlined distance（U+F6EA），只載入其子集；SVG 對應相同家族與 opsz24／wght400／FILL0／GRAD0。

location.context／read 是狹窄唯讀接口；bridge 讀目前原生位置、legend 描述與已生成的附近 metadata，adapter 產生凍結 DTO，普通池數值／Affinity／scans 從權威遊戲讀取，不初始化數值、不 capture 全遊戲。location／location.nearby／location.legend 路由到自有 location view；display.viewport 只供縮放／可見 viewport 資料。沒有新輪詢、動畫或 UI 組裝进入 LUNAR。

MOONSHINE component.location／view.location 負責按鈕、窗口、Grid/Flex、局部 patch、輸入／pause／焦點／overlay 動畫；新元件直接擁有 DOM，舊地圖僅隐藏已搬走的資訊，节点与原生操作保留。map 窗口讀 legend／附近，combat 僅位置；關閉窗口不讀附近資料。數值由 CSS container 自適應，data-ms-css-layout 根不進兼容 geometry fit；翻譯只改可見層，来源未變保留 node／tooltip。新 Outlined 圖標的單獨 font event 不擴散為全局 fit；遠端失敗不影響功能。Collected Data 留作未接線的顯示控制項，計數為原生已完成 scans。

地圖入口進場追隨自有 HUD 祖先的 opacity 時間軸，事件及 Web Animations 均由 MOONSHINE 管理，無幀輪詢。LUNAR timing.subscribe 只發布 pause 狀態，獨立於遊戲更新；bridge 控制的原生 inert／暫停 class mutation 不進入 game notification，真正 native mutation 仍按既有 dirty domains 路由。窗口退出先恢复 owned 背景，再釋放 pause，重入／scene replacement 保持身份及焦點生命周期。詳見 DEVELOPMENT 的地圖生命週期補充。

### b6.6 商店門檻／過場資料邊界

升級場景的退出意圖必須經 actions select＋confirm，零費 NONE 是明確確認的跳過選擇，單選不解鎖。bridge 保有 native effect／receipt／destination 與 execute 重新驗證；MOONSHINE 只呈現 disabled、選擇與確認，不用隱藏按鈕代替命令驗證，不改原版交易規則。

story.presentation 是當前 encounter 的窄 flow DTO，不傳動畫時序；interstitial／art entrance 及等待新 paragraph 期間禁止舊正文和 ACTIONS 推進。story.presentation domain 直接路由到 MOONSHINE 自有正文的 inactive patch（常駐外框保持 visible），保留翻譯與動畫節點，不走新 hidden-workspace 全量通路或 global fit。原生 phase class 的重複寫入／同批 remove-add 仍按局部 flow 描述，不為無文字節拍重建整頁。

resources.encounter 僅返回該 sequence 最多三張後續不同 CG 的標準縮圖 URL，不下載、不 decode、不做 rAF／計時器。MOONSHINE 擁有有界 Image 預載及清理，普通更新不重請；scene／scope／desktop 不保留舊 sequence。原版音效／CG 計時保留，預載是降低冷載入延遲，不能宣稱慢網路已獲得音畫同步保證。

### b6.6 局部更新契約

LUNAR 通知帶 revision、changed domains 及純資料 target handle；不傳遞原生 DOM、不排動畫幀。player／enemy／hand／cards／selection／actions／story／dialogue／shop／hud／scene 有明確分類；未知結構須標明 compatibility，不能偽装成局部更新。標量接口每次讀遊戲權威值，完整 snapshot 為顯式查詢；buffer 不因這條熱路徑變成第二套狀態。

MOONSHINE 的 pending batch 合併 domains／targets；只有被路由的 view 讀取、比較及 patch。content、state、structure、geometry 分離；普通狀態更新不 fit，不替換動畫元素／父節點。geometry observer 僅觀察自有可見節點，翻譯只排受影響元件的 fit；自己的 patch／fit 暫停觀察，避免回饋循環。viewport／font／scene 可擴大 geometry 範圍，普通 HP／selection 不得走同一路徑。

本輪仍保留未知原生結構、真正 scene replacement 及既有完整來源兼容路徑。它們是測量並明列的後續遷移工作；不能為了縮小計數吞掉非同步事件或改原版結算。

### 後續新功能的硬性更新規則（b6.6，2026-10-02）

從本次開發起，所有新功能及新增更新路徑必須遵守：

1. 不准無理由 full render；完整刷新須有真正 scene／結構替換等明確原因，不能作普通資料更新的預設。
2. 不准局部狀態變化觸發全局 fit；只失效、量測及調整受影響的元件。
3. 不准把瀏覽器翻譯 mutation 倒灌 LUNAR；翻譯是呈現層外部變更，不改 canonical state、不刷新遊戲資料。
4. 不准重建正在動畫／已翻譯的 DOM；來源未變時保留節點、父節點及翻譯包裝身份。
5. 不准新元件重新走 hidden-workspace 全量中轉；使用 LUNAR 標準資料／語意動作和 MOONSHINE 自有元件。
6. dirty／update domain 必須能落到對應 component；無關元件不得讀取、比較、patch 或 fit。
7. 能局部 patch 就局部 patch；普通 selected／disabled／affordable／數值變更就地更新。
8. 對 hot path 新增 O(n²) 類行為要立即攔住；檢查嵌套遍歷、重複查找／normalize 與更新放大，改用索引、快取或合併處理，不能留到穩定版才處理。

這是後續新增功能的准入要求。既有兼容路徑的优化由使用者在穩定版前另行安排；本條不授權本輪全面重構或遷移既有功能，也不放寬 LUNAR／MOONSHINE／HECATE 邊界。

### 硬性性能契約（2026-10-02）

- **LUNAR：不負責動畫、不以 frame rate 輪詢、不全量重建狀態、不直接碰大量 DOM。** bridge／adapter／buffer／API 僅處理相關變更；必要原生 DOM 兼容讀取須限定資料來源和更新範圍，不能把一般通知變成整頁掃描。
- **MOONSHINE：動畫走 requestAnimationFrame 排程及 CSS／Web Animations compositor；資料更新採 batch；正在動畫的 DOM 及其父節點不得因普通 state refresh 被重建。** 優先 opacity／transform；確實需要高度布局演出的 accordion 必須明列成本與量測，不能宣稱已走 compositor。讀取幾何與寫入樣式分階段。
- 先用可關閉的診斷 instrumentation、一次操作的通知／更新數、耗時與節點身份定位，明確區分幀期限超時和動畫 DOM 被替換。禁止因性能需求大規模重寫、把 MOONSHINE 合為 God Object，或未經證據／授權修改本體。
- 現有違規路徑是待處理技術債，不是新開發豁免。b6 的診斷和 b6.5 的逐階段修復分開記錄，不假稱已全面達成；測試專用 A/B 門控與 probe 不進正式載入清單、不在普通構建啟用。

| 層 | 擁有的責任 | 允許接觸 | 禁止 |
| --- | --- | --- | --- |
| LUNAR API（太陰） | 資料、交互、緩衝與兼容；原生橋接、標準資料／動作轉換、版本化接口 | 遊戲本體、MOONSHINE、HECATE／其他 MOD | 畫面組裝、版面、視覺樣式、演出動畫、UI 元件 |
| MOONSHINE UI（月華） | 通用行動端顯示結構；自有 DOM、元件、窗口、玩家輸入、動畫與文本呈現 | LUNAR 的消費端 API；自己的公開通用元件與物件集 | 遊戲本體／原生全域物件／原生函式／原生 DOM；任何插件實作、專屬接口或原生安裝探測（通用 Mods 管理畫面僅使用 LUNAR metadata／狀態） |
| SYNODIC MOD: HECATE（冥月） | 非公開、可選開發者工具的 panel、command、測試狀態構造與回饋 | LUNAR 的專用開發 API；MOONSHINE 公開通用元件 | 直接管理遊戲資料、呼叫原生函式、執行遊戲內部運算；將 MOD 邏輯塞入 MOONSHINE |

依賴方向：遊戲 ⇄ LUNAR；MOONSHINE ⇄ LUNAR；HECATE ⇄ LUNAR，HECATE → MOONSHINE 元件。MOONSHINE 不匯入、不偵測、不通知插件實作；通用 Mods 管理畫面只顯示 LUNAR 提供的 metadata／狀態並提交啟用偏好。沒有 HECATE 時，正常遊戲完整運行。

```text
SYNODIC Runtime（共同部署的核心）
Original Game ⇄ LUNAR API ⇄ MOONSHINE UI
                    ⇅
             HECATE MOD（可選／僅開發）
```

## 安裝與公開版本契約

2026-10-10 首個公開 RC 身份為 `1.0.0-rc1`；GPL-3.0-or-later。
公開封包與 corresponding source 匯出 `../SYNODIC-RELEASE/<version>/`，工程／
源碼／工具／測試仍在 SYNODIC。Runtime identity 與 component/API 版本分離；
Core synthetic payload 保留現行注入順序，公開源碼和 Core 均排除私人實作。
格式／可重建及 THEIA exact-byte 驗收見 [BUILD.md](BUILD.md) 與
[發行標準](../SYNODIC-RELEASE/RELEASE_STANDARD.md)。這不授權原生修復、UI／
renderer 遷移或新增 Logger／MOD 依賴；歷史 b6.9 產物保留。

- `modules.json` 的核心清單必須同時包含 LUNAR 與 MOONSHINE；注入器不提供單層部署選項，缺少任一層拒絕構建。核心缺檔是構建錯誤，不按 MOD 缺席處理。
- 一般／公開注入只載入核心，不注入 HECATE、本層的 `lunar.api.hecate.cjs` 或僅供該 MOD 使用的 UI 組裝。私人開發包透過 `--hecate` 顯式啟用；專用 API 雖歸屬 LUNAR，部署時列在 HECATE 可選組中。
- 若沒有 `hecate/`、可選清單或任一所列附屬文件，注入器整組跳過 HECATE，包括專用 API／樣式／UI 組裝。即使指定 `--hecate`，公開 checkout 仍正常注入完整核心；不得留下半套 MOD 或要求其存在的硬依賴。
- 重注入一般版必須移除舊 HECATE 注入區塊。公開源碼發布時不包含非公開 MOD 本體及其專屬文件；可選清單可保留缺席時安全跳過的路徑。通用 MOONSHINE 元件留在核心，不因 MOD 缺席被移除。

## 檔案與命名

正式來源在 `SYNODIC/`；`modules.json` 是注入順序與可選模組清單。`.cjs` 按使用者要求命名，本階段為注入 HTML 的經典 IIFE 腳本，不依賴瀏覽器支援 Node `require`。

| 形式 | 責任 |
| --- | --- |
| `lunar/lunar.buffer.*.cjs` | 純資料記憶體儲存、副本、排隊、失效；不呼叫遊戲或 bridge／API |
| `lunar/lunar.bridge.*.cjs` | 原生資料擷取、原生函式／既有回呼執行、生命週期、資源請求接管 |
| `lunar/lunar.adapter.*.cjs` | 格式、語意名稱、圖片 URL、動作參數等純轉換；不繪圖 |
| `lunar/lunar.api.moonshine.cjs` | 呈現端的版本化 API |
| `lunar/lunar.api.hecate.cjs` | HECATE MOD 專用版本化開發 API；命令有明確允許清單；僅私人 MOD 組載入 |
| `moonshine/moonshine.view.*.cjs` | 自有介面組裝與生命週期；只經 LUNAR API 取得資料／送出意圖 |
| `moonshine/moonshine.component.*.cjs` | 可設定字體、顏色、尺寸、狀態與行為的通用元件 |
| `moonshine/moonshine.input.*.cjs` | 觸摸、滑動、長按、鍵盤、雙指輸入等玩家輸入路由 |
| `moonshine/moonshine.animation.*.cjs` | 漸變、彈出、抖動、字體特效、元件動畫 |
| `hecate/hecate.panel.*.cjs` | 修改器自己的介面與視覺回饋；借用公開元件，不往 MOONSHINE 塞插件分支 |
| `hecate/hecate.command.*.cjs` | 驗證／組裝修改意圖，經 `LUNAR.api.hecate` 送出 |

CSS 的自有 id／class 分別用 `LUNAR-`、`MOONSHINE-`、`HECATE-`。LUNAR 禁止畫面處理，因此沒有 LUNAR 視覺 CSS；其命名空間用於來源識別及接口。MOONSHINE 可見根是 `#MOONSHINE-root`，元件用 `.MOONSHINE-button` 等。HECATE 根是 `#HECATE-root`。`data-ms-id`／`data-ms-class` 是資料格式中的來源別名，不是可見 UI 的原生 id／class。自有 CSS 模板也已加 `MOONSHINE-source-` 命名空間；模板轉換只在 MOONSHINE 內執行。

CJS 按元件或功能分類，所有執行期腳本／元件明確歸屬 LUNAR、MOONSHINE、HECATE；不保留語義模糊的舊命名。CSS 暫時維持現行統一樣式文件結構，不新增逐元件拆分；待元件邊界穩定後再決定是否拆分。注入器、離線工具與測試是項目工具，不冒充三層執行期元件。

開發驗證程式集中在 tests/，共用測試工具在 tests/helpers/，場景資料在 tests/fixtures/。它們不是三層的執行期模組，不進 modules.json，也不注入遊戲。Git 追蹤正式源檔及測試；生成的遊戲、快取、報告和鎖檔由項目 .gitignore 排除。

## LUNAR buffer 是交換站

- 遊戲本體是遊戲狀態的權威來源。buffer 只保存可複製／可序列化資料，不能因為改了快照就改掉遊戲。
- buffer 不持有命令路由、原生函式或 DOM，也不成為第二套遊戲狀態。僅保存顯示時序、翻譯、動畫或玩家交互所需的暫存內容／來源副本。動作識別與實際回呼留在 bridge，格式轉换留在 adapter，對外契約留在 api。
- `game` 保存來源快照、schema 1 標準快照、暫存 working、選擇及靜態目錄；標準格式包含 run、player、inventory、alignment、preferences、location、combat。`nativeSnapshot` 只供遷移／診斷；新畫面使用標準欄位。
- `story` 保留完整 HTML、已出現 HTML、來源／scene、paragraphId、order、typing completion 和呈現確認。尚未顯示的內容排隊；面板重繪或銷毀不刪除它。收到原生顯示要求不等於玩家已經看過。
- `shop` 以 run／存檔點或 node／shop 隔離，第一次原生生成後固定商品／隨機價格／文字。再打開、排序、改 viewport 不重抽；餘額、持有、可購買條件另刷新，購買最終檢查與扣款由原生處理。
- `presentation`／`ui` 只交換顯示資料、viewport 等普通資料，不處理畫面或發布命令。
- 新 run／成功載入存檔重建 scope；UI teardown 不重建 scope。記憶體緩衝不等於跨頁面載入或存檔持久化，未改原生存檔格式。

## 本次實際拆分

原 `moonshine-buffer/` 已撤除。store、game、story、shop、exchange 歸入 LUNAR buffer；原來混在 buffer 的 native calls、hook、shop 提交、DOM 擷取、資源請求拆到 bridge；普通資料／動作／URL 轉換拆到 adapter。CSS 選擇器轉換、可見 DOM、動畫及輸入在 MOONSHINE。

原 `mobile-*.js`／`mobile.js` 的手機組裝邏輯現在只加工 MOONSHINE 自己的節點。私有 workspace 在封閉 Shadow DOM 裡，用來組合既有畫面模板；原生 `document` 查詢看不到這些物件。workspace 的 `surface`／`viewDocument` 是自己的物件與 LUNAR 轉接入口，不是遊戲的 window／document。原生 getter 結果是副本，原生函式是 LUNAR 保存的不可見回呼識別；原生節點不傳到 UI。所有可見元件由 catalog 在獨立呈現樹建立。

LUNAR 目前仍須從原生 DOM 擷取部分資料，因遊戲缺少完整讀取 API；這是 LUNAR 的集中來源適配，並非 MOONSHINE 操作原生 UI。來源只加 `data-lunar-source` 識別和輔助操作標記，手機原顯示由 MOONSHINE 的樣式屏蔽。原生函式仍可生成資料／回呼來源，**不宣稱刪掉了原遊戲的所有渲染函式**。已替代的手機 render 路徑由 LUNAR route 委派自己的 UI，桌面仍委派原始函式；沒有修改輸入 HTML 的函式正文。

既有來源符號的相容轉譯只在 `api.moonshine.port` 定義，MOONSHINE 的既有模板經這個 API 取得副本與動作代理。這個相容資料格式保留舊別名以便這次遷移；**新畫面須用語意 API／標準快照，不新增來源符號依賴**。遊戲本體更新時修改 LUNAR 的 bridge／adapter，保持對外 schema 與行為契約；不把原生變動散到元件中。

圖片 URL 的縮小策略由 LUNAR adapter 計算，bridge 僅替換資源請求地址，不布局、剪裁或繪圖；MOONSHINE 決定圖片顯示、縮放與動畫。保持現行 CG／戰鬥 60%、卡牌 30%、intermission 40%，基準為手機顯示尺寸 × DPR；禁止原尺寸失敗回退。

原本一般手機 Settings 的 HP 測試工具已移到可選 HECATE，普通 MOONSHINE 不再讀寫 HP 或持有修改器 UI。現有 HECATE 只提供 Restore HP 遷移命令；任意卡牌／效果／敵人修改和鎖血等後续功能尚未實作，不把預留 API 宣稱為完整修改器。

## 原生 Dev Features 與 HECATE 的區分（使用者確認）

原遊戲內建 Dev Features 保留為本體功能，**不遷入 HECATE**。MOONSHINE 只顯示自己的菜單，所有既有開發／劇情測試動作經 LUNAR 執行原生程式和警告流程。HECATE 是另外的可選修改器；安裝或移除它不影響 Dev Features，MOONSHINE 亦不得自行探測或呼叫插件實作。

## 新功能的開發要求

1. 先確定資料／命令／呈現／插件責任；不確定先問使用者。
2. LUNAR adapter 定義標準快照和命令參數；bridge 執行原生程式；buffer 保存待呈現資料及穩定結果。
3. MOONSHINE 用共用元件建自己的畫面和輸入邏輯；排序、篩選、分頁等由自己的函式負責。
4. 原生交易、效果、進度和存讀檔仍由原生程式擁有；禁止重寫原函式正文、重複提交或 UI 重繪重抽價格。
5. 控制項用 Grid／Flex、可捲動內容、固定頭尾和安全區。保留必要的圖層 absolute／fixed，但需以自己的容器與實際 visualViewport 約束；不得任意堆疊重要度修補位置。
6. 新插件向 LUNAR 申請專用 API，從元件庫取得通用物件；不得在 MOONSHINE 加入插件專屬邏輯；通用 Mods 只接受 LUNAR 的描述和狀態。
7. 更新 modules.json、DEVELOPMENT.md、元件目錄／接口／緩衝欄位／停用路徑及 Dev_log.md b6.5；驗證有／沒有 HECATE、手機比例、桌面委派、一次提交、資料失效和原生來源未被 UI 改造。

8. 優先完成 SYNODIC Core 的穩定邊界，不替原版全面重構。只有原版技術債妨礙 LUNAR 建立穩定接口時才考慮最小必要處理；涉及額外原版修復先徵詢使用者。
9. MOONSHINE、HECATE 與未來 MOD 的原版讀寫、DOM 或 singleton 存取全部集中到 LUNAR。API 傳標準快照及語意命令，不將原版資料形狀變成新公開契約；本體更新优先只改 LUNAR adapter／bridge。
10. 文字以**可翻譯 DOM**為最終目標：LUNAR 提供原始／標準化文本，MOONSHINE 用正常可見 DOM 文字呈現並保留富文字語義，便於瀏覽器內建翻譯識別。暫存 JS 字串可以是中間格式，不可成為玩家文字唯一的呈現載體；不把正文畫成 canvas／圖片或困在不可識別結構。此規範是後續開發方向，不宣稱現有所有畫面已完成翻譯兼容驗收。
11. HECATE 的卡牌、玩家、敵人、效果、鎖血及劇情條件等測試能力只掛載專用 LUNAR API，界面重用公開通用元件；這些是 MOD 功能方向，現階段尚未實作的能力不得宣稱已可用。

只修改注入項目；不覆寫 b5，不重建工坊／ZIP／英文包。若需求必須涉及原遊戲本體的額外修復，先詢問使用者；這不限制使用者已授權的注入層拆分重構。

## 結構遷移完成後的清理（硬性規定）

完成結構大轉移並確認替代路徑後，所有不再使用的舊 CJS 必須從項目移除，不保留停用副本或舊模組樹。先核對 modules.json 的核心與可選插件清單、腳本引用及測試依賴，再刪除失效實作及更新文檔。現行回歸測試與其仍被引用的測試工具不屬於廢棄執行期模組。歷史說明保留於 Dev_log.md；正式源檔只有目前載入清單所列的實作。


## ACTIONS 的資料與交易契約（2026-10-01）

新 ACTIONS 使用 api.moonshine.actions.read/select/confirm/execute 的標準菜單資料。LUNAR actions buffer 保存交換副本、凍結 offers、暫存 selected、pending 與 receipt；它不能直接發出命令。回呼和交易期間延後的原生導航由 bridge.actions 持有，原生程式仍執行效果、扣款、節點清理和存檔。完成、可購買、可離開都必須重新檢查，預覽不能解鎖必選升級的離開動作。 初次升級的延後回執必須保留原本入口的語意資料（group.entryActions），不能因原生已領取狀態把重訪出口混入初次流程；回呼／路由及過期節點驗證只在 bridge，buffer 不執行命令。

LUNAR 提供完整正文是否存在、段落身份、story.pending（原生尚未發佈的待顯示正文）及 choiceOnly 等普通資料，首尾裝飾箭頭由純 adapter 正規化；不能以打字初始的空 DOM 誤判沒有劇情。兩轮行動間產生非空白正文（包含延後發佈或即時感官文本），MOONSHINE 必須關閉 ACTIONS、釋放暫停並先回到閱讀；完整正文完成也不自動重開。只有空白／沒有新正文才直接接續選項，保留的旧正文不當作新劇情。MOONSHINE 決定行動後接續 ACTIONS 或回到正文，接續意圖及詳情開關動畫只屬於本層，不進遊戲權威狀態、不由 buffer 發命令。

獲得手牌／卡牌預覽的背景關閉意圖透過 api.moonshine.cards.dismissPopup 交由 LUNAR 驗證來源、生命週期、頂層、armed 和一次關閉；只觸發原生已有 listener，不能以移除 MOONSHINE 畫面代替原生 onDone。pendingCardReceipt 是交換的流程資訊；MOONSHINE 在回呼尚未產生下一段／選項時保留 followup、不重新暫停進程。正文補完不能攔截卡牌 overlay；卡內文字／翻譯節點與動畫身份保留。

MOONSHINE 的 ACTIONS／詳情／商店正文是自有 DOM 和公開元件變體，只接語意 API；使用自己的輸入及手風琴動畫。舊聊天內嵌選項（包含 encounter 結果 enc-continue／Move on…）、開局輪播與原商店卡面在手機呈現端停用，原生節點仍只作 LUNAR 的資料／回呼来源。新 run／成功 load 重建 buffer scope；UI 關閉不清資料，記憶體交易回執不宣稱為存檔持久化。此擴充不改 HECATE 或要求任何插件存在。

## 完整文本、段落演出與瀏覽器翻譯（2026-10-01）

手機敘事入口由 LUNAR bridge.story 一次交付完整富文字，保留原生來源／完成回呼的最小兼容狀態，停用逐字 interval 和字元包裝。api.moonshine.story.read 提供 id／paragraphId、scope、channel、html、language、translatable、hasNarrative、complete 等普通副本；story.complete 是 bridge 命令，不是 buffer 命令，需驗證當前段落、來源生命週期、scope、暫停和重複提交。真正呈現後的 acknowledge 與完成命令分開。原版仍擁有劇情效果／導航，desktop 後續呼叫仍委派原生逐字程式。

段落分組、opacity 淡入、輸入補完、動畫暫停／取消及縮減動態處理均在 MOONSHINE；完整文本先存在正常可見 document DOM，不把演出放入 LUNAR 或私有緩衝。动画不逐字改寫、拆成單字元節點或另畫文字；新正文才替換文本，未變來源的刷新保留瀏覽器翻譯後文字與包裝節點，翻譯結果不反寫 buffer／遊戲。來源語言獨立於翻譯後的 html.lang；可见根／正文允許翻譯，符號、純數值與隱藏兼容來源排除翻譯，desktop 還原原生標記。DOM 兼容測試不代表各瀏覽器翻譯服務／真機已完成驗收。

## b6 模組清單、重啟載入與手機儲存契約（2026-10-02）

三份 `lunar/lunar.manifest.toml`、`moonshine/moonshine.manifest.toml`、`hecate/hecate.manifest.toml` 提供標題、作者、描述、版本及 LUNAR API 要求；`modules.json` 的 metadata／optional 記錄其路徑與載入順序。注入器以 Python 3.11+ 的 tomllib 在**生成 HTML 時**讀取 TOML，支援目前 `[mod]` 下 `mod.title` 的巢狀寫法，亦支援直接 `title`；移除描述的共同源碼縮排，保留段落和原文。以不可執行的 `LUNAR-mod-catalog` JSON 打包標準資料，跳脫標記字元。手機 HTML 不讀取旁邊的 TOML，不掃描目錄、不要求檔案系統或任意記憶體存取權限，也沒有遠端下載／eval 模組。

LUNAR adapter.mods 處理純版本轉換；bridge.mods 讀取已打包清單、保存偏好及固定本次啟動決策。api.moonshine.mods.read() 返回 schema 1、apiVersion、modules、mainMenu、viewport；每個模組包括 id／core／title／author／description／version／apiVersion／requiresApi／compatible／enabled／active／pending／locked／status。enabled 是下次啟動偏好，active 是此次實際載入狀態，pending 代表兩者不同。setEnabled(id, boolean) 返回 ok 或 locked／storage-unavailable；沒有任意程式路徑或遊戲命令。這是 Runtime 設定，不進 run／load scope 的 buffer，也不成為遊戲狀態。

API 發行版取自 LUNAR TOML 的 0.1，與現有資料 schema／消費 API 的數字 version:1 分開。數字版本按段比較，0.1 等同 0.1.0，0.10 大於 0.2；要求目前支援單一 >=、>、<=、<、= 比較（裸版本表示相等），不支援複合範圍／預發行字串。不符合或無法解析的 MOD 要求視為 Outdated、鎖定停用；核心要求不符在構建階段拒絕，不生成缺一層的 Runtime。格式規則僅服務當前模組，不冒充完整 SemVer 範圍解析器。

LUNAR + MOONSHINE 固定啟用；`SYNODIC.mods.enabled.v1` 只保存可選模組的布林偏好。每次 HTML／遊戲頁面重新載入時，LUNAR 在可選腳本之前取得設定，整組決定是否執行該 MOD、本層專供它使用的 API 及 UI。切換只記錄下次啟動，不在運行中卸載或重掛接口；返回主菜單不等於重新載入。私人 --hecate 包才包含完整 HECATE（包括 TOML）；一般公開包不包含其 metadata／腳本／API／CSS，缺任一附屬文件整組跳過。已打包但被停用的 MOD 保留 metadata，可在下一次重啟重新啟用。

MOONSHINE component.mods／input.mods／view.mods 只接上述 API：手機主菜單右下角常駐單色拼圖按鈕，已有／新存檔皆適用；全屏詢問、同意窗口及遊戲場景不显示，desktop 清理自有根。讀檔／圖鑑／Credits 等面板遮蓋主菜單時，MOONSHINE 以自有可見 dialog 隱藏／停用入口，關閉面板後恢復；LUNAR 不偵測下游畫面。Mods 模態共用 overlay 開／關動畫和 ACTIONS accordion；只展開目前檢視的卡片，黃色標題及外框，收合卡依啟用／停用呈綠／紅。標題和按鈕用一般 UI 字體，其餘資訊／描述用 JetBrains Mono，拼圖用 Noto Emoji 單色。描述可獨立捲動，清單可捲動，頭尾和狀態列穩定；控制項用 Grid／Flex，唯一 fixed 為 visualViewport 約束的根，沒有 absolute 像素修補。文字是正常 DOM，刷新及狀態切換不覆寫已翻譯描述。

瀏覽器保存的是自身 localStorage，沒有寫回 HTML、TOML 或遊戲存檔。某些手機檔案預覽器／file URL／隱私模式可能不提供可持久保存的儲存來源；保存失敗時顯示 Unable to save 並保留原設定，不假裝成功。刪除網站資料／更換瀏覽器／改變開啟來源可能重置偏好；離線包不保證跨來源共用設定。若需穩定持久化，使用支援腳本及網站儲存的瀏覽器開啟同一來源；當前沒有要求手機讀檔權限或額外安裝服務。

驗證入口：tests/test_mods.cjs、test_b6_mods_live.cjs、test_inject.py。後者覆蓋 TOML 打包、公開／私人清單、可選腳本門控、缺檔整組跳過、重注入冪等及原生正文不變；瀏覽器測試覆蓋重啟停用／重新啟用、過期鎖定、儲存拒絕、手機比例、翻譯保留與主菜單位置。真機仍需使用者驗收。

## b6.5 更新與動畫生命週期（2026-10-02）

LUNAR native revision／run scope 只作交換快照的失效識別，不是遊戲權威版本。sources 同 cycle 返回同一只讀資料；只有 bridge 能建立／失效該快取。game.refresh 以保守輸入比較決定是否完整 capture，未變資料不再次 normalize／buffer copy；不猜測或跳過真正的非同步結算。LUNAR 不使用 rAF 調度。

MOONSHINE 以本層 pending queue 合併 dirty domains 及一幀內可見提交；refresh／flush 不直接 render，flush 可 await 已排隊提交。普通 ACTIONS selected／affordable／disabled／price／balance 不替換 menu／accordion row／controller；新場景或結構性動作集合可以替換。布局寫入、有效幾何量測、回寫分批，快取不跨失效樣式沿用。這是現有 views/components 的小範圍穩定化，不是新 state manager 或 MOD reactive API。

## b6.6 主菜單水印邊界

設定來源 `moonshine/moonshine.main_menu_watermark.toml`（相對 SYNODIC 根目錄）；注入器編譯為轉義 JSON，手機不讀取本機文件。LUNAR bridge.main_menu／api.moonshine.mainMenu 只提供固定唯讀設定與狹窄主菜單／viewport 資料；MOONSHINE view.main_menu_watermark 自有、可翻譯 DOM 僅在主菜單前景呈現，預設左下角。舊 CSS 偽元素水印已移除。mainMenu／viewport domain 局部路由，不經 hidden-workspace、不新增 observer／輪詢／全局 fit、不回灌翻譯、不替換文字節點。具體欄位、CSS px 單位與驗收見 DEVELOPMENT.md 的「b6.6 主菜單 TOML 水印」。

重複卡牌數量是既有 MOONSHINE receipt 的呈現資料，位置／字號／正常流布局由 card_detail 與共享 CSS 處理；LUNAR 只保留原生數量及 validated dismiss command，原版仍擁有卡牌效果與後續回呼。移動數量節點只發生於初次 receipt 結構組裝；普通 HP／動畫更新不得重建卡片或數量，不新增全量中轉、全局 fit 或來源狀態副本。

## b6.6 ACTIONS 摘要與陣營資料

LUNAR actions item 的 label／html 是完整標準文字，summary 為第一行加必要省略號，affiliation 為來源明確 class 正規化的小寫陣營名稱或 null；未變 HTML／class 的轉換按原生按鈕身份快取。只讀對應 control 子樹，不讀 layout／呈現翻譯，不以文字猜陣營。MOONSHINE 收合用 summary、展開用 html；陣營只影響展開文字／图標，普通收合色及選中外框保持統一。metadata／disabled 就地 patch，不重建已翻譯／動畫 DOM、不引入全局 fit 或新的 hidden-workspace 管線。

## b6.6 存檔命名布局邊界

載入／覆寫確認中的槽位名稱屬 LUNAR 原生資料轉換：adapter.saves 識別原版確認 options，bridge.saves 在手機 port.route 交付前只讀目標槽位的最新 saveName。名稱以 literal text 跳脫後交給既有 rich-text 窗口；未命名保留 Slot N。只淺拷貝改變的文字欄位，保留原 callback／操作 index／body 警告與原生存檔權威，不緩存整份存檔、不掃全槽、不讀翻譯 DOM。MOONSHINE 沿用已有窗口布局／動畫，普通更新保留已翻譯標題，不新增 hidden-workspace 通路或更新／fit 入口；桌面及其他原生確認框不轉換。

命名介面的框線、Grid 分欄、按鈕／標籤置中、翻譯換行與安全區屬 MOONSHINE。命名布局修正僅修改既有自有介面的共享 CSS，不新增 LUNAR 狀態／命令、全量中轉、布局量測或 runtime 更新入口。來源回呼／輸入保存仍經既有 LUNAR 邊界；原版保有存檔權威及 prompt 生命周期。不得為按鈕偏移再引入 absolute／transform 補位，普通更新保留輸入與已翻譯節點。

### b6.6 圖鑑密碼窗口／原生無參數驗證邊界

MOONSHINE component.text_prompt 直接持有密碼窗口DOM和未提交輸入，不經私有workspace；顯示、遮蔽、鍵盤／焦點／取消和viewport排程均屬MOONSHINE。輸入不能觸發game-state refresh、寫buffer／exchange或通知LUNAR；外部翻譯只改標題／按鈕的呈現DOM，無關state更新保留身份。確認使用共用SVG而非字型位移補丁，存檔命名重用符號並保持既有callback。

LUNAR compendium.unlockCards(value) 僅在提交時讀原生驗證結果。舊驗證函式透過document.getElementById讀值：bridge在同步呼叫期間提供兩個特定legacy ID的request-local資料facade，其他查詢透傳；finally還原lookup並清空值，原生例外也必須還原。不得建立隱藏原生UI、把可見input傳給LUNAR、保存密碼、複製判定規則或直接改解鎖flag。原生擁有判定／持久化；成功通知限定cards。桌面仍走原版路徑。此窄兼容facade不授權其他全局DOM攔截或原版邏輯修改。


## b6.6 Asset Profile／Critical Loading（2026-10-03）

月相置中與Mods字級／圖標锚點是純MOONSHINE CSS：logo兩側等寬Grid，月相軌道minmax(0,1fr)避免大字形向右撑開；Mods圖標為固定28×28格子、start對齊，不追隨多行標題高度。沒有新增LUNAR接口／原生讀取、observer、geometry fit、逐幀計算或DOM替換，原縮放、字體、翻譯、動畫生命週期保留。

Loading 與 Mods launcher 的視覺生命週期只屬 MOONSHINE：bootstrap 使用單一140ms opacity Web Animation，反轉沿用當下透明度，finish 才隱藏；取消舊動畫，無game timer／新LUNAR狀態。shell 位於 html 下、body 前，以自有 sibling CSS 在非hidden（含淡出）期間立即隱藏／禁點launcher並取消其繼承transition。縮減動態直接完成；保留所有節點與既有Mods前景判斷。此規則不改 assets READY／命令lock／pause或HECATE。

本輪使用者性能設計落實於 [LUNAR ASSETS](lunar/ASSETS.md)，完整規格與量測見 diagnostics/b66-assets-requirements.md／b66-assets-2026-10-03.md。版本不推進。LUNAR assets.core 只管理 profile／manifest索引／受控request／system clock／scene generation／rollback；bridge.resources 窄讀目前背景與原生warm入口。MOONSHINE view.loading 自有shell接管／快速140ms淡入淡出／8fps CSS月相／input及focus／pause，profileChanged等提交完成才放行。Bootstrap為唯一極小的早期呈現例外，不讀遊戲，不等待外網字體。

正式只有mobile方案完整；desktop unavailable，原版desktop委派不當作完整新方案。750ms穩定＋700/900 hysteresis僅在有兩個可用方案時運作，KEEP同候選session不重複，ACCEPT須確認／停舊URL／abort自有pending／載入當前必要資源／恢復，失敗回舊方案並解鎖。命令API和自有UI都檢查lock，HECATE仍可選且無MOONSHINE插件分支。

只從critical＋當前scene選必要背景，不下載整個deferred索引；menu不warm未用map/combat/story/角色或整批audio。現有有界encounter下一3張CG只在實際sequence使用。profile/scene metadata有界清理；HTTP cache仍屬瀏覽器，不清除；原版已發image/CSS/media不冒充能abort。普通image load只標記affected component geometry，保留翻譯／動畫节点，無game notify／全根fit／完整render。stylesheet cache不因自有Loading／symbol字體就緒失效，unchanged native STYLE不routine重轉換。

Loading字體為內嵌JetBrains Mono（SYNDIC）＋Noto Emoji（8月相）OFL子集共5,632B（3,964＋1,668），許可打包；一般UI字體非阻塞漸進增強。不把shell mark當paint、不把rAF間隙當手機FPS。首屏以9.8×＋400ms／750kbps下載／250kbps上傳獨立三輪before/after，保留4×四模式三輪與1×sanity；遠端服務變動、HTML本機file未量下載、原版長boot仍是限制。

### Loading Presentation Policy（b6.6，2026-10-03）

LUNAR transitions.core 擁有 navigation semantic／id／事件／watchdog及安全 recovery；assets.core 保持 URL／pending／request epoch 的既有職責，普通 request 不選 Loading。resource bridge 在原生 passageinit 前捕獲語義；MOONSHINE API 僅提供 transition status/subscribe/onPresent，不暴露 scene/system 起始或私有資源取消。MOONSHINE 擁有舊背景保持、dim／crossfade／decode consumer、右下指示與 node identity。Level2=冷啟動或ACCEPT方案切換；Level1=完整scene/nav；Level0=普通素材。只有Level2可沿用全局profile pause，scene鎖不阻止原生準備或純動畫。原生 route request-local depth 只讓準備中的回呼完成，玩家 API命令仍 gate。新元件不經 hidden-workspace；演出完成不 render／capture／emit／global fit。可選MOD無專屬分支，仍受同一command gate。

原生 mutable globals 不受 SugarCube history 完整還原；critical failure／12秒watchdog使用原生 Menu 安全恢復，不能以history rewind冒充機制撤銷。失敗 recovery 有界且解鎖。細節／觸發矩陣／資產見 DEVELOPMENT 的 Loading Policy 節與 diagnostics/b66-loading-policy-2026-10-03.md。

### b6.6 裝飾背景降級／构建身份（2026-10-03）

使用者新要求允許缺裝飾圖像時繼續流程：LUNAR按manifest區分presentation failure與required readiness；MOONSHINE消費有界metadata、限時decode/fallback/crossfade，不讀Logger/native DOM決策。state/controls/watchdog及明確profile仍strict。CG皮膚與location恢复只改owned presentation；無新增workspace transit/全局更新。synodic.build.toml是唯一構建身份來源，build-time進Logger，獨立API/MOD版本；[crash].quotes只供header。詳見DEVELOPMENT與本輪診斷報告。


### b6.6 Scanner 與視覺特效契約（2026-10-04）

劇情掃描由 LUNAR 保存待執行的 native choice handle；进度權威仍是原版 temporary scanner session，buffer 不領獎／推劇情。schema1 scan DTO 是 immutable 顯示副本；scope、game/root/choice/session identity、token once-only 及 native award／callback 均在 bridge.scan。actions.execute 的 Continue 消耗一次 handle；RETURN 不結算；其他劇情分支在 pending 時不可執行。舊只讀圖鑑可使用其既有兼容呈現，不能丟失新掃描進度。沒有新增存檔或通用 state manager。

MOONSHINE 只經 api.moonshine.scan／actions／effects；自有 Scanner/report DOM 與輸入、geometry、spawn/freeze/lifetime、動畫均由 UI 持有。scan domain 局部 patch 完成標記／新報告，不 capture 或 full workspace transit，不改未變的翻譯節點／其他 moving targets。圖片按實際開啟需求解析，非 critical／global Loading。

LUNAR effects 發語意意圖，不決定影格、位置、duration 或執行動畫。UI 在 transition END 後演出，新的 transition 使舊 cue 失效；原 native body 的視覺副作用以既有「MOONSHINE 禁用原呈現」CSS 職責抑制。Logger 只作旁路，無 per-frame／geometry log 或跨層internal读取；詳見 DEVELOPMENT 與 lunar/LOGGER_USAGE.md。

掃描資源／報告補充（2026-10-04）：images.scan 專用未裁切 fit DTO；adapter.scan 提供正規化 label/body/text，UI 只組裝可見報告並保持未變文字 identity。Scanner cover、滿框 field、黃色愛心屬 MOONSHINE；沒有 API 繪圖、圖像 preload、全局 Loading 或原版經濟變更。

Loading opacity startTime 使用當前 document timeline，使原生同步 boot 延後 frame 時仍能及早呈現；無資源等待／native 排程修改，timeline 未解析則沿用 browser scheduling。

### b6.6 掃描全圖 inspection（2026-10-04）

LUNAR scan.inspection(id) 只驗證當前原生掃描完成與生命週期，交付 frozen id/image；不開原生CG、不結算或通知，不新增authority/buffer。MOONSHINE component.inspection/view.scan 擁有看圖DOM/縮放/輸入/局部geometry；保留原scanner隱藏＋inert，RETURN只回scanner，scan關閉/失效清兩層。資源沿既有images.scan fit URL、logical Mono，無原尺寸回退/preload/globalLoading/workspace新路由。Logger只記open/close/fallback小breadcrumb；詳見DEVELOPMENT最新節。

### b6.6 Collected Data 唯讀邊界（2026-10-04）

LUNAR collectedData bridge讀原版角色catalog/report/captured flags，adapter只轉DTO，API交付deep-frozen唯讀資料。bridge的有界context handle只作場景/來源有效性認證，綁root/game/scope/角色/location/catalog，不成為收集authority或持久化，不進buffer。detail/inspection需native captured旗標；未知行沒有名稱、圖片或報告。read只讀metadata，art延到detail；沿既有scan resource，不預載或critical Loading。原生flag從false→true才發collectedData＋location.nearby，普通HP不查catalog，無poll/fullcapture/全量中轉。

MOONSHINE component/view.collected_data擁有清單、A–Z排序、accordion、inert/focus/pause和局部patch；readonly detail與CG重用scan/inspection。UI以readOnly呈現，不呼叫story scanner命令或原生gallery，不給獎、不更動temporary scanner、不推劇情。ACTIONS只closeStory，gallery關閉自己的archive；navigation清完整nested樹，返回保留已翻譯DOM與scroll。Logger走正式scoped API，只記小lifecycle/fallback，不參與判定。細節見DEVELOPMENT與component/API目錄。

Inspection的owned標記保留在元件自身：destroy清image src再detach後，延後的MutationObserver record仍可辨識為MOONSHINE節點，不誤發compatibility／native capture。回歸以實際subscribe通知＋capture計數驗證，不能僅攔截exported emit（內部emit closure不經該spy）。

## b6.6 Mobile Persistent Chrome / Presentation Mode（2026-10-04）

完整使用者規範：[原文](diagnostics/b66-persistent-chrome-requirements.md)。本節取代舊的 story panel teardown／native phase 隱藏整個外框規則；舊相容／歷史記錄不能作為例外。

Mobile presentation must remain stable under slow or delayed asset delivery.

Top HUD and Story Box are persistent MOONSHINE chrome. Their lifecycle is independent from native scene DOM. They are created once where practical, updated locally, and suspended only by explicit presentation modes. Ordinary story navigation must not destroy or recreate them.

- MOONSHINE persistent owner 管理獨立 Top HUD、STORY BOX（故事文字框）及同一套 listeners；Scene Layer 只更新場景。LUNAR 只交付窄 chrome/story DTO、場景與 command 語義，不組裝 UI／排動畫。新 chrome 不經 hidden-workspace 中轉；既有 options/Tiny Information/CG 元件維持兼容路由，並非新 chrome authority。
- 唯一可見性 authority 是 MOONSHINE Presentation Mode；suspend 必須帶 reason。沒有正文、native panel/HUD 消失、passage replacement、圖片 pending／decode／failure、一般通知，不得 hide/reset/recreate chrome。
- NORMAL 包括普通故事、choices、ordinary CG、shop／upgrade 普通交互及 Level0。使用者2026-10-04後續地圖規則取代原文map＝NORMAL：MapScreen／StomachMap／Lab使用顯式 MAP（Lab依2026-10-06使用者修正加入），HUD及地圖資訊保留，STORY BOX整個suspend＋inert；不destroy，離開地圖恢復目標模式。空正文只更新內容／inactive state，保留可見 shell。原版 interstitial/art entrance flow 只遮蔽舊正文、停用 ACTIONS，不能隱藏整個 STORY BOX。
- SCENE_TRANSITION/System Loading 明確 suspend chrome、保留 nodes/controllers；Scene Loading 維持舊背景 dim/crossfade，target ready/END 後恢復目標模式。COMBAT 明確 suspend Story Box；本輪沿用現有 compact Top HUD＝visible，戰鬥美術另輪處理。
- Cinematic 僅由顯式 enter/exit（包含原生 art-view command、scan-inspection；舊 combat-art command 已由 b6.7 COMBAT 內的 Enemy Details pause modal 取代）選取 explicit HUD/Story policy；不以空正文、fullscreen img 或 native class 推測。普通 CG 的圖片更新仍是 NORMAL。
- OUTSIDE 僅指 boot/Menu/CharacterSelect，非正常 gameplay；同一 chrome 節點 suspend，進入 gameplay 恢復。不得為其他故事／地圖新增 OUTSIDE 例外。
- 內容真實改變才 patch 對應正文；HP/背景/character/asset 裝飾更新保留翻譯後 paragraph／wrapper identity。正常可見 DOM 與完整 rich text 契約保持。不新增 polling、visibility→capture、resume→full render 或 story→global fit。
- 失敗恢復 previous valid presentation；profile failure 恢復舊方案，scene 的原生 mutable globals 仍使用既有 safe Menu recovery，不能虛構 history transaction rewind。恢復同一 chrome 節點、合法 foreground／mode、解除 input lock；下一次 gameplay 再恢復同一 shell。
- 正式 LUNAR scoped Logger 記 `PRESENTATION_MODE_CHANGE/HUD_SUSPEND/HUD_RESUME/STORYBOX_SUSPEND/STORYBOX_RESUME`，小 context `from/to/reason/sceneId/transactionId`，不讀 log 作判定，不記 frame/class/text mutation。
- 範圍只含 ownership/lifecycle/visibility/node persistence/mode integration；不重畫 HUD/Story Box、不改 native story engine/mechanics/router、不做大性能重寫。四模式4×三輪 before/after＋獨立1×仍必須；極端 A55 360×800、3G、No CACHE 另行記錄，不能冒充真機 FPS/GPU/記憶體或翻譯服務測試。

| Mode | Top HUD | STORY BOX | Background |
| --- | --- | --- | --- |
| Normal Story / Choice / ordinary CG / Level0 | Visible | Visible shell | Visible |
| Map navigation (MapScreen / StomachMap / Lab) | Visible | Suspended, map-navigation | Map |
| Scene Transition | Hidden | Hidden | Old retained + dim |
| System Loading | Hidden | Hidden | Hidden |
| Combat | Visible persistent HUD | Suspended, combat | Native battle art/action callback; b6.7 owned combat UI |
| Explicit Cinematic | Explicit policy | Explicit policy | Cinematic |
| Error rollback/recovery | Previous valid policy | Same shell, previous valid policy | Previous if valid, else safe Menu |
| Outside gameplay (boot/Menu/CharacterSelect) | Suspended | Suspended | Existing menu/selection |

驗收至少包括多段、背景/角色切換、choice→story、CG返回、map雙向、combat雙向、scene/system loading、slow/failed image/background、translated paragraph＋HUD/scene更新、rollback。交付報告按原文32節的13項，最後明確列出是否仍有 native DOM visibility authority 及任何殘餘位置。

### Persistent Chrome 的操作／捲動邊界（b6.6，2026-10-04）

Scene Layer／persistent chrome外層是display:contents，必須在實際cascade中成立，不能被compatibility樣式改成全屏實體盒。外層不保留點擊／觸摸命中區或額外flow高度；HUD／Story Box自己的盒與其controllers保持。Presentation suspend＋inert不是清除外層盒的替代品。驗收需實際hit testing／touch swipe／wheel及外層scroll range，不能只驗visibility和scripted click。真正超長地圖在自己的bounded map容器、正文在Story Box內捲動；禁止新增全域preventDefault或native game state修補。詳細回歸：tests/test_b66_map_scroll_live.cjs。

MAP的owned outer root使用overflow:clip（不是hidden的可程式捲動盒），bounded map容器仍可捲；mode離開後還原既有overflow policy。短viewport需同時驗outer scrollTop保持0與真實長地圖底部可達。


## Card thumbnail boundary（b6.6，2026-10-05）

LUNAR adapter.cards／bridge.cards供唯讀目錄與deck entry和schema1 thumbnail；原版有號cost、toolUses/maxUses、masterDeck仍是authority。費用排序不能使用顯示絕對值；Worship的curseLevel不等於有限次數。cards.art按目前profile解析30%×DPR尺寸，無原始圖fallback／新UI資源來源。

MOONSHINE的card_thumbnail是唯一共用縮略圖實作，create/update直接擁有可見DOM。既有相容殼只傳empty slot＋plain DTO（cardThumbnail），catalog patch委派元件，禁止把新卡面組裝到hidden workspace再完整snapshot。局部數值更新保留翻譯title／art身份；不測量、不global fit／通知LUNAR。既有卡牌詳情回呼／compendium filters保留。全圖卡面／80%左條／旋轉文字／cost schemes屬MOONSHINE；單行title與cost/uses沿同一中央豎軸，以CSS自行處理旋轉區塊置中，不新增layout reads／LUNAR通知；Logger仍是LUNAR observer-only scope，沒有新正式logger或per-card/frame日誌。

## b6.7 Combat admission

`api.moonshine.combat` is a narrow versioned consumer contract, not game authority. Native game/root/scope validates each command and requested pile key. Native cost, status, threshold, effect, turn and action-overlay callback ownership remains. `adapter.combat` supplies data only; `bridge.combat` reads native rendered intent/portrait and delegates existing commands. No new battle buffer, UI factory, animation, layout or formal Logger reads in LUNAR.

MOONSHINE owns combat composition, monochrome Noto Emoji glyphs, stable shared thumbnails, hand geometry/selection/scroll, pile cycle, modal pause/focus and keyboard isolation in separate modules. New combat components do not transit hidden workspace. Native retired combat UI is excluded from compatibility snapshots; native background/action overlay remain explicit compatibility boundaries; settlement uses owned result UI with native callback authority. Remove old combat-art session/button and exclusively retired combat skins; ordinary CG viewer remains. Native fill animation mutations without scalar changes do not notify new combat. Source-unchanged labels/parents survive; numeric spans patch separately. Required checks cover stale keys/lifetimes, consume/negative cost, real play/end callbacks, over/continue and optional MOD independence.

本輪戰鬥手牌寬度只在mount／viewport幾何失效時讀取；同場出牌／order變化重排重用owned width／positions，不在寫counter／card後讀layout。選取與剪裁檢查使用owned slot位置及scrollLeft，有限rAF scroll不查native資料／API，不引入逐幀state refresh。Enemy文字框比例／shared capsule／pile glyphs及card rail gap均屬CSS，可見DOM和翻譯身份保持。

戰鬥補充（2026-10-05）：TURN 使用 Mono 加粗、深色外描邊與實色膠囊底，維持完整兩半外框；Enemy 方形 portrait 避開 Top HUD，body 頂線保留 location launcher 下方至少8px。位置由 CSS HUD／42px launcher／portrait 比例預留，不新增 runtime 量測、API 欄位、native 改寫或 Logger 事件。需驗320×568至748×1400的實際幾何與launcher命中，以及A55慢網路圖片decode後的間距。

戰鬥膠囊補充（2026-10-06）：敵方／玩家HP與TURN的右半填色由完整outer capsule的50% hard-stop背景漸層繪製，不再依賴maximum子節點背景的圓角裁切；子節點透明，TURN實色左底以background-color疊加，避免shorthand清掉共用漸層。保留同一外框、等分Grid及數值節點，沒有JS幾何補償。HP縮寫、counter符號及數值明確translate=no；人物名稱、flavor與intent保持可翻譯，既有scalar更新不得抹掉其翻譯wrapper。版本b6.7，revision `combat-capsule-2026-10-06`；像素／語義／身份回歸及必要性能、真實HTTP測試記錄見diagnostics/b67-combat-capsule-2026-10-06.md。

## b6.7 Rest / intermission / settlement (2026-10-05)

RestSite uses the persistent STORY BOX and semantic ACTIONS contract. LUNAR publishes the authored rest description through the existing paragraph-fade lifecycle, exposes native Rest/Meditate/Process callback handles, and preserves native Process offers/requirements. Requirement currency is checked at confirmation, never spent. MOONSHINE reuses the accordion/shared thumbnail/preview; the original rest content is excluded from mobile snapshots, while background and callbacks remain native. VIEW CG uses the existing background viewer. View Deck labels are plain text; the native callback is retained.

`api.moonshine.combat.result(id)` delivers schema1 native outcome/title/rich quote and ordered DATA/GRACE/CHAOS amounts; missing rewards normalize to zero in adapter.combat. `settle(id, claim|skip)` validates current game/root/scope, pause/assets and once-only lifetime, delegates native grant/skip functions, then clicks the validated native Continue source. No copied win formulas, grants, navigation routes or result buffer. Native result DOM remains a hidden callback source only.

MOONSHINE result component/view/input/CSS own the directly visible dialog, horizontal reward capsules, bounded rich quote, focus trap and two footer buttons. Source-unchanged text/translated wrappers survive scalar updates; geometry changes only on mount/viewport or profile readiness. Numbers use the existing Mono role and icons the existing monochrome Emoji role; no added font payload. No hidden-workspace transit, game-state polling, global fit or second Logger.

Attack intermission retains native art/colours/dismissal closure. Mobile suppresses the Next Turn snapshot, uses common UI text, and sends blank/keyboard advance through a validated narrow command. The owned input handler must yield to the source's programmatic click, protect the entire HUD/location and other dialogs, and preserve native once-only callback and exit animation.

## b6.7 Compact card panels / rest display corrections（2026-10-06）

`api.moonshine.cardPanel.read/inspect/submit/cancel` is an additive schema1 consumer boundary. bridge.card_panel retains the native picker/deck root, supplied card instances/order and native click callbacks, bound to game/passage/run scope. The original picker and deck are hidden callback sources, excluded from mobile snapshots. Selection is presentation-only; only explicit Confirm clicks the validated source card once. Cancel/Close use native controls; native shift/grant/armed receipt/onDone/navigation remain authoritative. No picker buffer/save or copied shift rules. Desktop delegates unchanged.

MOONSHINE component.card_panel/view.card_panel/input.card_panel own a centered modal card stack above the retained ACTIONS menu, with a full viewport dark backdrop, responsive footer, pause/focus, selection and nested detail lifetime. The overlay is an owned child of actions-root, reusing its viewport/zoom compensation; standard details still use the existing compatibility layer. During nested inspection, view.actions promotes that same keyed, MOONSHINE-owned detail backdrop into the browser manual top layer, retaining its scene parent and source key. Both ACTIONS and the card stack remain visibly open and inert under the existing dark scrim; the ACTIONS root must not be lowered below the opaque scene for this detail. No cloning, reparenting, native DOM change or second detail renderer is allowed. Text taps stay in the detail; Tab/Shift+Tab stay inside it, while blank taps/Escape delegate the existing armed native dismissal and return selection, scroll and focus. Removal/navigation releases the top-layer node with its existing projection lifetime. View Deck has Close only; Reverse Alignment has Close and Confirm. Return preserves the ACTIONS shell, expanded option, scroll, focus and translated row nodes; regenerated native callback IDs are rebound on semantically unchanged rows through an O(n) index. `MOONSHINE_CARD_HAND` in animation.card_hand is now the single shared stack/scroll/lift implementation used by combat and these panels; superseded animation.combat_hand is removed. 1–2 cards center, 3–8 distribute without scrolling, >8 retain eight-card density and scroll. The shared hand reserves 14 CSS px at each scroll edge for the 7px blur/2px spread halo, including first/last cards and combat. A clipped card scrolls into this reserved area before lift/glow; top/bottom clearance also survives the lift. Second tap uses the same existing standard detail projection as compendium; backdrop returns to the selected card. Only Confirm changes alignment; View Deck has Close only.

Rest button name/subtitle boundaries normalize to explicit BR, preserving expanded rich text after native class stripping. Original RestSite blessing-header is no longer projected. Process offers inspect via actions.inspect and native pure card preview, preserving the parent ACTIONS selection/translation/focus; the old CARD variant of upgrade-preview is removed. Standard detail and native receipt dismissal are reused, not duplicated. Geometry is mount/viewport only; local selection adds zero native capture/notification. cards.panel targets the owning view. Logger writes only small open/close/confirm/inspect lifecycle IDs, never data/geometry per frame.

Latest nested-detail revision: rest-card-detail-stack-2026-10-06, version b6.7 unchanged. During-detail parent paint order/identity, seven viewport sizes, required performance and real-network results: diagnostics/b67-rest-card-detail-stack-2026-10-06.md; artifacts: builds/rest-card-detail-stack-b67-2026-10-06. Prior modal/glow correction: diagnostics/b67-rest-card-modal-2026-10-06.md; original migration: diagnostics/b67-rest-cards-2026-10-06.md.

## b6.7 Lab / stomach map chrome correction（2026-10-06）

Lab 是地圖導航：LUNAR adapter.chrome 依正式 passage identity 交付 MAP，沿 MOONSHINE 唯一 Presentation Mode owner，以 map-navigation suspend＋inert 同一 STORY BOX。離開 Lab 進 Blessing 才恢復 NORMAL，不能以空正文或 native DOM 判斷可見性。此要求取代此前 Lab＝NORMAL 的範圍說明。

location bridge 增加 stg-lab-root 的窄位置來源，沿現有 context/read schema，name=The Lab、key=Lab；沒有原生 legend／nearby 就交付空陣列，owned location 元件局部隱藏空區標題，不造附近角色／地圖圖例。Lab 使用共用 compact Top HUD＋location launcher、資訊搬移與 bounded map scroll；描述保留在 HUD／位置按鈕下方，以既有 native scale 做 CSS 補償。原 SVG／節點回呼／scanner／存檔／遊戲計算仍為原生 authority。

無新 buffer、輪詢、font request、workspace transit、全局 fit 或 visibility→capture 路由。Logger 沿既有 presentation／location scoped lifecycle，不加 getter/frame 記錄。一般與 Passive Scan 胃部地圖已接 MAP/location，需維持回歸。版本維持 b6.7；目前 revision=map-background-2026-10-06。詳細驗證與限制見 diagnostics/b67-map-chrome-2026-10-06.md。

地圖背景補充：Lab的bounded scroll root以transparent background保留既有full-viewport lab-bg。不得讓root原先#0e0a14實色遮蓋fixed背景，不改圖像資源或抬高到node／HUD之前。最終慢網路測試需檢查地圖下方實際背景像素，不只CSS尺寸。

## b6.8 shared map visuals（2026-10-06）

Authoritative later user correction: all actual nodes and legend previews use one upright rounded-rectangle shell. `lunar.adapter.map` normalizes native types and exit direction; `lunar.bridge.map` reads only existing native graph/coordinates/edges and retains private native callback handles. `api.moonshine.map.read/enter` is the data/action boundary. No original generator, topology, adjacency, coordinates, forward gates or input HTML edits. Desktop keeps its original external renderer.

`moonshine.component.map_visuals` is the sole frozen geometry/icon/color registry: 16 semantic keys, 15 locally embedded official Outlined SVG assets (Void/Pylorus share a glyph). `build_map_icons.py` deterministically rebuilds the fixed path table/manifest from local licensed assets, without network access. No remote icon/font runtime dependency. `component.map`, `input.map`, `view.map`, `component.map.css` own a direct visible keyed graph inside the normalized empty map slot; legacy SVG children/legend previews are excluded from mobile compatibility transit. Existing map panel/background/scroll/HUD remain. Crop bounds and profile vertical presentation scaling (Manor1.3, stomach2.5) improve space/touch separation without reordering or changing native map-space data. Exit icon rotates independently; labels are upright normal DOM. State only changes the affected attributes/badges/marker/edges, retaining type icon and translated labels. Ordinary state updates use `map` domain, zero full capture/fit; native callback gates remain authoritative.

Location component reuses registry previews with `{id,visualKey,label,description}`, one row per item, bounded vertical legend scroll. **Keep** Nearby Giantess portrait/name/subtitle/HP/Affinity, Collected Data nested action and fixed OK; short screens can scroll the existing body without losing footer. No duplicate arbitrary SVG/swatch adapter or old data-square paint implementation. Text/description/labels remain translatable; decorative SVG/badges/marker are translate=no/aria-hidden.

Measured supporting boundary fixes: autosave completion subscription replaces its legacy command-based writer hook; original serialization unchanged. Native MapBoot's deferred source measurement/centering timers run in UI scope, old compatibility stgSyncMapFixedTop invocation removed, unchanged zoom not rewritten. Direct map input bypasses compatibility ancestor keys, avoiding swallowed taps and full refresh. These are narrowly required for the new map, not a general optimization or lifecycle rewrite. Existing animation/pause/translations and optional HECATE independence remain mandatory. Tests: test_b68_map_adapter.cjs, test_b68_map_visuals_live.cjs plus existing chrome/scroll/location/save regressions; final evidence diagnostics/b68-map-visuals-2026-10-06.md.

Map paint clarification: shell/icon colors are opaque; do not apply opacity to a complete node to indicate unavailable/cleared, because that reveals crossing route lines. Use brightness for state dimming, retain semantic fill and an opaque shell. Scene/menu scrims may still dim the assembled background. Initial owned current position is centered once per mount in the existing bounded scroller; ordinary state patches do no camera/layout work. No gameplay coordinates change.

Deferred first-map readiness: if native boot fills a previously empty map root after the initial scene projection, one structure/scene refresh creates the existing panel's empty normalized slot. LUNAR remembers source scaffold capture in a WeakSet, independently of map API reads; it is neither gameplay state nor visibility authority. Already captured same-root state rebuilds continue through map/location domains with zero full capture/fit. New graph nodes still mount directly and never traverse the workspace. This addresses the real9.8×/3G stomach-map readiness failure, without polling, native generator edits or ordinary-state rebuilds.


Slow-network readiness (b6.8): `api.moonshine.assets.readiness(id)` supplies frozen critical/important/decorative metadata. Only critical resources and actual owned controls/graph gate UI_READY; important/decorative current-scene requests do not hold input, including profile switches. Unknown required assets remain strict. Main/menu background is important; native catalog CG is decorative, requested only on demand/current scene, never whole-catalog preload. Critical decode remains bounded/strict; the existing 12s UI/state watchdog, safe Menu and Level0/1/2 transition policy stay unchanged. MOONSHINE reports MAP_UI_READY after owned nodes mount and unlock, without polling or capture/fit. Test-only visual oracle waits explicit current important capture targets to a deadline, then writes VISUAL_SETTLED or VISUAL_CAPTURE_DEGRADED screenshot + missing asset list. Slow optional assets log WARN, genuine critical failures ERROR; failedCritical/failedVisual counters are separate. No all-images-decoded functional oracle, runtime log reads, global performance/native repair or ownership changes. See lunar/ASSETS.md and tests/test_b68_readiness{,_live}.cjs.


## b6.8 Resource quality and root presentation safety（2026-10-07）

本次補充以[Resource_load_strategy.md](Resource_load_strategy.md)及[transition_seizure_proetection.md](transition_seizure_proetection.md)為使用者契約；實作／驗收範圍見[本輪要求](diagnostics/b68-map-safety-requirements.md)。

- LUNAR owns a session delivery policy and declared original-dimension 100/85/70/50% variants. Use necessary startup delivery samples; short deadline chooses conservative fallback without holding UI_READY. SaveData is respected; after selection only downgrades are permitted. Ordinary navigation cancellation is not poor-network evidence. No large speed-test payload, browser bitmap resize, whole-catalog preload or quality-triggered UI rebuild. Thresholds are centralized tuning parameters, not gameplay constants.
- MOONSHINE only requests semantic resource data. Resolution and animation are independent. Dynamic/video map resources must declare a static equivalent through LUNAR; their delivery/decode deadline may select that Level0 fallback locally without changing layout/gameplay or functional readiness. Existing rotating stomach imagery uses its first authored background as that equivalent.
- **Never destroy, hide, clear or replace the visible presentation root before a ready successor covers it or the persistent opaque transition shield has visibly committed.** LUNAR routes native root commands and supplies transition intent; MOONSHINE owns the dark shield, double-rAF commit, coverage checks and reveal. Target structure/controls/true critical resources gate reveal; optional artwork does not. Reduced motion may remove fade, never cover. Guard is independent of Level0/1/2.
- Current-map focus waits owned layout and transition unlock, once per mount/return. Stomach presentation may fit the viewport at safe touch spacing, otherwise uses existing bounded scroll; native topology and Manor arrangement do not change.
- Passive stomach data is an always-unlocked read-only catalog row in Collected Data (6 versus Manor's 5), never a new scan session/reward/save buffer. Reuse scanner/inspection/nested return, preserve parent DOM/translation/pause/focus. Retire the old mobile passive overlay.

正式原文：[資源品質策略](Resource_load_strategy.md)、[轉場安全策略](transition_seizure_proetection.md)。


## b6.8 Logger resource basic information（2026-10-07）

The previous-session log header must retain all four resource quality scales (ULTRA100%, HIGH85%, MEDIUM70%, LOW50%, original linear width/height), initial/current/pending selection, reasons/downgrade count, SaveData and independent static/decode preference. LUNAR quality owner supplies bounded observer metadata only at initialization, selection, actual downgrades or a changed static preference; unchanged samples do no logging work. Header survives bounded-ring event eviction. No public current reader, UI notification, game/DOM capture, manifest dump, runtime log reads or synchronous persistence; quality/readiness/Loading policy remains authoritative and unchanged. Pending and older sessions must identify missing selection/data honestly. See [Logger contract](lunar/LOGGER.md) and [this change's requirements](diagnostics/b68-logger-quality-requirements.md). Runtime stays b6.8.

## b6.8 Graphics Quality and adaptive presentation（2026-10-07）

本輪[完整使用者指令](diagnostics/b68-graphics-transition-requirements.md)覆蓋先前「降級立即解析」及 Level1 立即黑幕／140ms crossfade 的細節；版本仍 b6.8。Level2 bootstrap/profile switch 保持既有規則。不得擴大為全面效能、地圖 topology 或 native gameplay 重構。

- LUNAR owns persisted `Auto / Fast / Standard / Fancy / Ultra / Original`, startup delivery evidence, declared resource variants and cache revision. Fast/Standard/Fancy/Ultra map to LOW50%/MEDIUM70%/HIGH85%/ULTRA100% linear width/height; Ultra is optimized, Original is upstream and manual only. No browser bitmap resize. Small chrome/icons/fonts keep their resource contracts.
- `status()` distinguishes preference, Auto estimate, effective decision, applied profile and pending next profile. Startup uses actual existing request latency/throughput/completion and bounded timing evidence; connection hints/deadline are fallback, no speed-test payload or startup wait. Auto never selects Original or upgrades after selection within a session. Manual preferences win; individual failures/static background fallback do not change them.
- MOONSHINE owns the shared six-dot snapped control and `pendingGraphicsQuality` draft, directly in the visible tree. Existing settings templates supply an empty protected slot only. Slider input updates only its label/thumb, no storage/resource refresh, native capture or global fit. Main DS and in-game Visuals place it before Scene Gradient and keep independently scrolling content plus stable exit controls. Auto labels use the Auto estimate even when previewed from a manual preference.
- Normal settings exit compares draft and committed preference: same => no reload/change breadcrumb; changed => persist/update policy, prepare at most four current important/critical artwork consumers to a finite decode deadline, then patch only affected image/style sources under full black. Important failure retains that individual loaded source with WARN, without changing preference; critical stays strict. Decorative completion never delays functional success. Native state, map, chrome, translated/animated nodes and unrelated controls retain identity.
- Auto downgrade records a pending decision and updates the Auto label without moving its thumb. Current artwork stays unchanged; the next scene/explicit art-view/actual authored CG background boundary applies the decision. Native source preparation runs behind retained owned UI; native function bodies remain unchanged. `stgGoTo`/Continue interception announces intent without awaiting a UI fade before source preparation.
- MOONSHINE owns centralized `decisionMs=100`, `minLoadingMs=150`, `fadeToBlackMs=50`, `fadeFromBlackMs=50`. While preparing, visible UI remains retained. Ready within the decision window => short fade to opaque black, commit, short reveal, no spinner. Otherwise show retained old CG/background dimmed 50% plus the existing foreground Loading; honor minimum visibility, then fade old image and spinner together beneath the same curtain. No old-CG resurrection after black. Reduced motion removes fades, never opaque coverage/commit validation.
- The root guard uses a transparent popover backdrop and its own opaque black surface. Double-rAF and actual viewport coverage/opacity verification precede visible commit. Owned rendering queues wait; prepared native structure + true critical fetch/decode start target readiness, then owned controls/map are mounted at commit before input unlock/UI_READY. No all-images-decoded oracle, empty root paint, white flash or Level0-induced Loading.
- Logger remains observer-only and public previous-only. Basic header records six preferences, Auto estimate, effective/applied/pending plus all four linear scales, original/optimized distinction and static/decode policy. Low-frequency `GRAPHICS_QUALITY_CHANGED/AUTO_SELECTED/AUTO_DOWNGRADE/PROFILE_APPLIED`, `TRANSITION_REQUEST/FAST_PATH/LOADING_REVEALED/TARGET_READY/CURTAIN_OPAQUE/COMMIT/COMPLETE` breadcrumbs distinguish decisions and presentation; genuine coverage gaps are ERROR. No log-driven behavior, per-frame logging or synchronous diagnostic persistence.

驗收：`tests/test_b68_graphics_quality.cjs`, `test_b68_graphics_transition_live.cjs`, `test_b68_quality_log{,_live}.cjs`, `test_b68_readiness{,_live}.cjs`；同一四模式 4×N3 before/after 及獨立 1×N1 必須保留。控制式 timing/image fixtures 不是實際 CDN／手機 FPS 證據；3G stalled/failed captures 要留下 degraded screenshot 和 missing assets 清單。

## b6.8 Fatal recovery / in-scene backgrounds（2026-10-07）

本節依[使用者 fatal recovery 原文](diagnostics/b68-recovery-requirements.md)及同輪直接指令，取代舊規範中「普通 CG 變更觸發 Level1」及「轉場時間僅由 UI 硬編碼」的細節。版本仍 b6.8；API/UI ownership、Level0/1/2、UI_READY/視覺 deadline、原生 gameplay authority 不變。

- LUNAR 的 recovery controller 捕捉 uncaught、unhandled rejection、明確 unrecoverable 與 STG `stgShowAlertModal` 的精確 fatal-prefix 路徑。一般資源 ERROR/WARN 不升為 fatal。先保留 canonical name/message/stack/source、有限 scene/map/quality/context、同一 Logger 的1500條有界 recent entries，再一次性凍結字串快照；不 dump DOM、_STG、全量存檔或 asset cache。
- 正常公開 Logger 仍只 export previous。本輪明確授權的唯一例外：事故發生後經 `api.moonshine.recovery.exportCrash()` 匯出 immutable current-session **crash snapshot**；沒有 live/current viewer/getter、新 ring、DB 或 logging authority。`status/subscribe/acknowledge/exportCrash/exportFailed/restart` 是 UI 的語義接口，原生 exception internals 不跨層。
- 原版 caught fatal 先保留原提示，回應後進入獨立 MOONSHINE Recovery；如果 bootstrap 的 Loading 讓原提示不可操作，200ms 後由獨立 top-layer acknowledgment 接續，仍先確認再 Recovery。Emergency DOM/CSS 使用既有 UI/JetBrains Mono logical roles及 system fallback；不依賴普通 scene/map/story renderer、翻譯流程或遠端圖像。錯誤用 textContent、translate=no、可換行/捲動。one-shot/secondary guard 防止反覆凍結或重複彈窗；UI 自身故障保留 minimal text/restart fallback。
- Fatal 後停止普通 input/dispatch/map/combat/navigation，只有原 fatal acknowledgment 及 recovery export/restart 仍可操作。Restart 使用 document reload，保留 engine transient session history、原 STG manual/autosaves 和 preferences；暫存歷史清理尚待使用者明確授權，故不能保證損壞 restore moment 不會再現。不嘗試重置幾個 globals 後繼續執行。
- **In-scene background replacement is not a scene transition.** LUNAR 只比較 authored source identity、在 next_cg 套用 pending quality、發布 background dirty target。MOONSHINE 只讓新的背景在 deadline 內完成 decode，再 crossfade 背景層；舊背景保持可見，失敗/deadline WARN 並保留舊背景。Story Box/HUD/controls/translated nodes 不 hide、rebuild、reinitialize 或進 Level1/black curtain；背景局部 style 更新不觸發全局 fit。重大 presentation replacement 保留 full-black commit barrier。
- `lunar/lunar.transitions.toml` 是可從 LUNAR API 外部編輯的 build-time 設定，重新注入 HTML 後生效。LUNAR `api.moonshine.transitions.timing` 只發布 frozen DTO；所有 timer/animation/coverage 仍由 MOONSHINE 管理。預設 decision100ms、Loading minimum150ms、toBlack50ms、reveal50ms、backgroundCrossfade200ms；允許0–10000ms，拒絕負數、非有限數/布林/文字。
- 胃部 layout 以可見 viewport 預算與既有 topology 的觸控間距計算，不從 auto-sized 內容高度反算自身；普通 asset/DOM 更新不重新 layout。Manor topology/排列不變；過密地圖保留 bounded scroll。Read-only scan preview 以實際自然比例配置相框，無黑邊及大幅裁切，報告獨立捲動；不生成 scanner target/reward。SCAN／VIEW CG 及背景 decode consumer 明確標記 CG role；同一 source 即使在其他地方註冊為卡牌，也不能將 full-art 重新選成 viewport 比例 fill 裁切。

已知重載根因：b6.8 scan compatibility wrapper 在 SugarCube bootstrap、`SugarCube.State` 尚未建立時讀 passage。原 b5 同操作不出錯。改為安全檢查 State／当前 native stomach root，只修注入層，不修改 STG 函式正文或存檔格式。回歸 `tests/test_b68_recovery_background_live.cjs`、`test_b68_transition_config.py`；性能與限制見 `diagnostics/b68-recovery-map-background-2026-10-07.md`。


## b6.8 Background transaction race correction（2026-10-08）

此節取代2026-10-07場內背景的「先換主圖、淡出舊覆蓋層」實作；版本維持b6.8。原版刻意交替的動態CG圖序與gameplay callbacks保留，不能把正常動態背景當成錯誤禁用。驗收要對照同一段原版劇情的target與手機實際committed asset，不能只檢查畫面有圖片。

- LUNAR只讀取/正規化來源與資源選擇。`resources.backgroundImage(css)`交付凍結的logical source identity、已選CG URL及image值；品質variant不改logical identity，explicit CG不被共享card registration重裁。native body ping-pong stack的active frame交付窄frame資料，兩個物理來源沒有兩個mobile presentation authority。
- `resources.withResolved(fn)`僅是同步、有finally還原的已選資源寫入scope：UI把API已解析的target或保留的committed plate寫入自己的style/Image時，不再被兼容style/src hook二次選檔。不得跨await、預載整目錄、繞過critical readiness或讓API建立/排程UI。畫質policy、URL選擇、pending/applied boundary仍在LUNAR。
- MOONSHINE單一背景owner保留最後committed plate，offscreen decode latest target，在獨立incoming buffer上opacity0→1，動畫完成並再次驗證generation/呈現生命期/connected/recovery後才commit，隨即釋放旧plate/buffer。每個distinct target有generation；過期decode、deadline、animation completion與detach不准改目前呈現。同asset同variant的dirty patch不重開動畫。失敗/finite deadline留最後committed圖+WARN，不持有UI_READY或全局Loading。
- Host opacity固定，不再複製native fade；filter在共同host上只作用一次，gradient/dark overlay及persistent Story Box/ACTIONS/HUD不屬背景owner。保留非opacity CSS/WAAPI動作與穩定node identity。Compatibility catalog保護背景buffer子樹，teardown釋放pending lifetimes；原版body雙layer以同一stable primary mobile host呈現，inactive retained art不能復活。
- major scene/system intent開始即推進MOONSHINE呈現生命期並取消pending背景/optional dynamic decode；舊DOM在準備期間仍connected也不能提交。只訂閱API語義生命期，不輪詢、不讀native tree。被保留的同一host在owned commit/idle時以新生命期重試latest intent；新場景移除的host不重試。ready/progress通知不得重複失效同一intent。
- Graphics refresh跳過incoming buffer，重新選擇latest target intent，不從暫時保留的old painted URL重新發出請求。Auto降級不改logical target，不復活obsolete資源；大轉場仍使用原opaque barrier，普通CG仍是Level0/background-only。
- 唯一Logger在request/ready/start/commit/complete/stale ignore寫入低頻`BG_TRANSITION_*`（ready為`BG_ASSET_READY`），帶generation與assetId。不記frame、不讀Logger決定runtime、不建立新診斷存儲。

Hard invariant: background presentation progresses from the last committed plate to the latest valid target; no stale resource or completion restores an obsolete plate. 測試：`tests/test_b68_background_race_live.cjs`；完整原文與驗證邊界見`diagnostics/b68-background-race-requirements.md`與本輪交付紀錄。

## b6.8 Full-screen narrative choice ownership（2026-10-08）

LUNAR bridge.story_choices owns registered native fullscreen narrative roots, exact validated leaf routing, source/run/passage/control lifetimes and one-shot dispatch. adapter.story_choices converts immutable semantics only; callback functions remain bridge-owned, never in presentation.actions. Public existing chrome.story/actions.read accept additive branch/background/direct activation fields; no native DOM, commands or plugin knowledge crosses into MOONSHINE. Registered fullscreen foreground is omitted from mobile compatibility snapshots because the persistent Story Box/ACTIONS own its replacement. Desktop native presentation remains unchanged.

MOONSHINE story owns a local background surface and stable HUD/Story Box; direct ACTIONS rows mount in their owned menu with one wrapped rich button and no accordion detail. Native black is explicit semantic data, not loading/art inference. Unchanged HTML preserves translated nodes; canonical HTML line/block boundaries never come from normalized accessible labels. Only audited presentational sub-selectors can flatten to exact native leaves; gameplay confirmation/conditions remain mandatory. Source structure replacement may use the measured compatibility fallback; source copy/disabled changes use narrow story/actions domains without full capture/fit. Existing resource UI_READY/visual deadline, committed background generation, major root coverage and optional MOD boundaries remain authoritative.


## b6.8 Background visibility / late delivery（2026-10-08）

This clarification supersedes cancelling ordinary CG at the visual deadline: an optional visual timeout records WARN/degraded capture and keeps the latest request alive, while retaining the last committed plate. UI_READY and controls remain usable. A late decoded target may commit only under the existing generation/presentation/connected/recovery guards; genuine failure and supersession still release it. No polling, retry loop, native repair, quality-policy changes or API/UI ownership changes. Declared map dynamic-to-static fallback and true critical deadlines remain distinct. Normal CG cover and viewport geometry must hold before first paint, throughout the incoming buffer and after commit; preserve explicit camera overrides. Require actual scene pixels, not just backgroundImage equality. See [resource contract](lunar/ASSETS.md#b68-background-delivery-deadline-correction2026-10-08), `test_b68_background_visible_live.cjs` and the expanded race regression. Version remains b6.8.

## b6.8 portrait camera and missing native source families（2026-10-08）

LUNAR remains the sole native/source and resource-policy reader. `bridge.chrome` admits body-mounted `stg-defeat-cine` ahead of a retained passage; it supplies rich paragraph blocks, authored active plate, vignette and NORMAL presentation semantics. `bridge.actions` binds only current source controls, including the terminal menu once armed. Native cinematic foreground is suppressed, not copied into mobile. Ordinary story completion remains exactly once through the story API. `bridge.updates` routes cinematic content/art/control changes locally; shake/opacity decoration does not trigger capture/full fit. Existing report/teaser compatibility roots are explicitly admitted; this is not a generic document-wide source scan or renderer rewrite. Developer precondition guards belong to LUNAR command admission and use the existing alert route; they do not construct a run, alter effects or change desktop delegation.

MOONSHINE owns portrait sizing. Width-only camera percentages are zoom relative to cover, with a minimum cover baseline. The committed and incoming buffers retain separate decoded dimensions; apply incoming sizing before first paint and committed sizing before releasing the buffer. A per-host ResizeObserver follows only owned local geometry and disconnects at release/detach. Ordinary cover requires no geometry read. Generation/deadline/UI_READY and background dimming invariants remain unchanged.

Four profile percentages are validated build-time TOML data (`1..100`, finite numeric values, nondecreasing Fast→Ultra). Injection recompiles declared variants from original dimensions; the API resolver and Logger both consume this registry. UI does not read TOML, resize bitmaps or select CDN dimensions. Original remains upstream/manual; small assets and unavailable metadata keep their existing contracts.

Declared body-mounted cine/report/teaser foregrounds invalidate retained combat/location command contexts and normalized main-menu availability. LUNAR supplies source priority (cine NORMAL, report/teaser OUTSIDE); MOONSHINE's existing owners release unavailable controls. Covering old DOM visually does not confer permission to keep it interactive. Cine story/actions take priority over a retained passage fork; stale fork routes reject while a declared body foreground is active.

### b6.8 Narrative LOVE and font normalization（2026-10-08）

`chrome.story().love` 與 `actions.items[].requirement` 是 optional frozen source DTOs。LUNAR 只讀 declared Avery/Fate/arc-dlg-lock source；不初始化 pool、不計算 eligibility、不組裝 UI。原版 disabled/callback authority 不變。MOONSHINE 使用已存在 combat counter factory／半填充 capsule，在持續 heading 及 ACTIONS badge 局部 patch；源 prose 不變就保留翻譯及動畫 node，LOVE-only mutation 不 full capture/global fit。

使用者授權 mobile ending/native typography 完全依 logical font roles。LUNAR registry 管映射、離線 embedded faces 與 import gates；MOONSHINE 透過 font API 將 CSS family/shorthand、SVG presentation attribute、rich inline declarations 映射到同一角色。數值／LOVE copy=mono（JetBrains Mono），glyph=emoji（Noto Emoji）。不新增 URL、font payload跨層、native core edits、回写翻譯或 font-ready gameplay refresh。


## b6.9 End-of-run presentation contract（2026-10-09）

`RUN_REPORT` / `END_NOTICE` 是使用者授權的獨立 presentation，優先於持續的Map/Combat/Menu underlay；HUD/Story僅suspend/inert，節點不銷毀。此節取代報告/告示的暫時OUTSIDE admission，其他mode及opaque guard不变。LUNAR sole native owner保存來源/run/scope、immutable score/stat/deck/upgrade DTO及validated one-shot callback；adapter只百分比/分組轉換。MOONSHINE直接owned報告、局部background雙緩衝、既有card/upgrade檢視、fixed bar/scroll/export。不從Logger取得runtime狀態，不把native teaser兩個物理plate的opacity交给兩個UI authority，不把真正slideshow誤刪為race。來源mount/remove/style只runReport domain，無新workspace/full-fit熱路徑。詳見 DEVELOPMENT b6.9 及 lunar/README。

同日b6.9視覺補充：report live/PNG膠囊clip及contour、指定30.8px卡組pill、頂部CG向footer漸黑都由MOONSHINE既有component/export owner完成。LUNAR不取得canvas/layout/gradient職責；source和品質authority不改。Export只消費resolved committed descriptor，不用長PNG高度重新選resource或放大CG，不用截圖失敗更改functional ready。user指定卡組高度優先於舊44px guideline；主要controls仍44px。這不是新renderer或global background重構。


## b6.9 Story lifecycle repair（2026-10-09）

Native choice availability belongs to LUNAR `bridge.actions`: explicitly hidden native containers are excluded in all admitted story roots; translated/suppressed presentation visibility never establishes eligibility. Handles revalidate the latest model before the original callback. Combined prose/choice and scalar mutations route through the stronger content refresh, avoiding a reward masking removed choices. No native claims/rewards/mechanics are rewritten.

LUNAR resources admits only declared ordinary same-passage prose re-entry as continuity; transitions core bypasses its major guard only for that case with no active transition. MOONSHINE's existing background owner now also retains EncounterEvent CG across source root replacement. `chrome.background()` carries image/color/camera/dimming-family data, never nodes or animations. The mobile snapshot omits the superseded EncounterEvent plates; the UI owns the stable plate, shade, generation/decode/crossfade lifecycle and local background-only route. Its omitted native plates must not publish a compatibility target that has no normalized node. HUD/Story Box are not replaced or suspended by this continuation. True major replacements retain full-black coverage.

Lab notice: `adapter.lab_notice` pure DTO conversion; `bridge.lab_notice` exact native source/lifetime/original Close; consumer API `labNotice.read/close`; `view.lab_notice` owns dialog geometry/input/pause/focus/font/DOM. Only source-specific dirty routing is added. No new buffer, runtime state from Logger, native DOM in UI, hidden-workspace transit, global fit, polling, or plugin dependency. Normal Lab notices never use end-of-run Return-to-Menu semantics.

### b6.9 deferred initial entry and story extensions（2026-10-09）

LUNAR `bridge.actions` distinguishes its retained initial upgrade group from a genuine native Lab revisit: permanent shortcut history is preserved but cannot authorize first-entry skip controls. Current response phase excludes the retained Body utility exit; current-model validation rejects stale commands. Distinct Proceed and native branch completion still delegate to the original callback. Completed narrative uses the current declared native copy; pending copy remains complete in the existing story buffer. `chrome.story().extension={id,anchor}` is optional immutable source identity/alias data for sensory prose, never a layout directive, node or game ledger.

MOONSHINE owns append detection against canonical blocks, partial prefix-preserving component append and local STORYBOX scroll. Unchanged translated/prose prefixes are not reconciled from visible text. Scroll changes only for new same-paragraph extensions; replacement starts at top; repeated/decoration refresh cannot refocus. It uses synchronous local geometry, no timer/animation callback, full capture, new workspace or global fit. The Emoji fitter belongs to shared UI components: Canvas receives the computed logical font family, not unresolved CSS var syntax, and fits actual ink into the existing slot. Font resources, native core and injector assembly remain LUNAR/build owned and unchanged.


## b6.9 Lab confirmation, scan gate and autosave ownership（2026-10-09）

`labNotice` admits declared native notice/Embark sources, not arbitrary `.lab-overlay` controls. LUNAR alone owns registration, semantic DTO and one-shot confirm/cancel callbacks; MOONSHINE reuses its owned dialog and top-layer/input/pause/focus lifecycle. Initial ACTIONS Embark delegates to the same native Lab source. No extra buffer, native function rewrite, UI destination logic, compatibility snapshot copy, global fit or plugin dependency.

The latest user instruction supersedes the earlier partial-scanner exit policy: a positive-target story scan requires completed native-session progress. `scan.canContinue` is normalized data; both ACTIONS disabled state and command admission use it. Existing rows/checks update on scan domain only. Noninteractive zero-target compatibility exits and read-only inspection remain distinct.

Auto load is a semantic LUNAR saves command. Native payload/deserialize/navigation/audio and picker/run/scope/consumed checks stay in the bridge; MOONSHINE never reads Engine or restores game fields. Manual saves/keys/schema remain native. LOVE is a standard accordion row: compact summary, full separate requirement only in selected detail, original eligibility unchanged. Preserve translation/animated node identity across numeric updates.


### b6.9 ending selection and underlay parking（2026-10-09）

Narrative ACTIONS progression uses MOONSHINE's shared two-click accordion; LUNAR cannot force cinematic progression or flattened fork leaves to direct activation. Native leaf/callback validation and flattening remain unchanged; terminal Menu commands and standalone primary buttons may declare direct. Embark confirmation is plain text.

Only `bridge.run_report.retainsUnderlay(to)` identifies native teaser cleanup: Menu target, connected teaser source and native parked flag. The existing resources/transition admission uses this semantic predicate in both command and SugarCube boundaries. No scene curtain or foreground quality boundary is started for this hidden cleanup. Removing the notice resets admission, so actual Menu return remains a major navigation. LUNAR does not schedule or paint this transition. MOONSHINE may carry only its decoded committed plate to an owned notice, before predecessor teardown; pending resources and callbacks remain bound to the original lifetime. This extends retained foreground continuity without a generic navigation exemption or native rewrite.

## b6.9 Narrative HP / page-motion boundary（2026-10-09）

Additive optional `chrome.story().hp` is a rendered source DTO from declared native character-status markup, alongside LOVE; LUNAR does not initialize getters, own UI or change the native pool. Adapter excludes the superseded full status wrapper. MOONSHINE reuses persistent shared split counters, updates scalar cells locally and hides absent sources. Original prose/translation/animated parents remain stable; numeric changes need no whole capture or global fit.

A native page shake is semantic effects data, never authority to transform document.body, presentation root or fixed chrome. Exact body motion-only class mutations emit the existing background effect target with no snapshot; CSS blocks the native/copied page transform before paint. Only MOONSHINE's existing effects owner animates its owned background via independent translate with established preference/reduced-motion/generation/transition cancellation. No frame polling, new buffer, renderer, animation owner or logging authority. The obsolete narrative deck row is omitted from mobile compatibility and actions; Tiny Information remains the consolidated deck entry. Native mechanics/body functions, save schema and desktop delegation remain unchanged. Details: DEVELOPMENT and diagnostics/b69-story-status-2026-10-09.md.

本輪 effects 回歸亦發現戰鬥 shake 仍指向已退役的 compatibility root；同一 effects owner 改指向現有 `#MOONSHINE-combat`，保持 HUD sibling 固定，不新增 fallback renderer。舊測試的 pre-b6.7 card selector 同步到現行 owned combat。

## b6.9 發行前生命週期審計（2026-10-09）

版本維持 b6.9，revision `release-audit-2026-10-09`。先保存未修改公開構建／來源 hashes，建立當前四模式4×N3＋獨立1×N1、圖片與八輪流程基線，再做窄修；歷史性能數字不作本輪結果。完整六項交付見 [發行前審計](diagnostics/b69-release-audit-2026-10-09/README.md)。

LUNAR transport 的 Node-owned callback handle 在既有 native capture 邊界退役：已斷開或已進 passage-out 的來源失效；重新連接／重新發布可沿 WeakMap 身份重登記。已發出但退役的 handle 返回 false，未發出／未知 handle 繼續拒絕；不將晚到的合法舊回呼升為 Recovery fatal。DTO 的 optional `transient` 只描述此生命週期，不轉移遊戲權威。全局原生 routes 和普通 callback 保持原有行為。

MOONSHINE 在既有 workspace sync／snapshot 邊界刪除離場 dispatch index 的強引用，保留 WeakMap 身份；Node-owned transient callbacks 只由当前 UI 物件持有，不進全局 callback cache。這不是重建 Story、搬動原生 DOM、清空圖片快取或改 pending rich text lifetime。保留當前背景＋incoming 雙緩衝、Combat、翻譯 wrappers 和所有現有控制語義。

Tiny Information overlay 明確使用 `minmax(0,1fr)` track；panel 高度以已扣除安全區域的父容器內高為上限。Installed Upgrades 使用剩餘高度和原有捲動，Close 保持固定尾行。只改 UI CSS，不新增量測／timer／全局 fit；visualViewport 高度／offset、系統 top/bottom inset 仍由既有 display owner 處理。

不得新增全目錄強制刷新、silent reload、強制 GC 或以降低畫質／刪動畫作性能改善。Error 5 目前只確認為 A35 Chrome 的整頁崩潰；系統 LOW_MEMORY／SIGNALED 未能對應其發生時間，不能宣稱該錯誤已修復。實機長時間和 fullscreen 驗收另列限制。

### b6.9 Mods eligibility boundary (2026-10-10)

LUNAR `bridge.mods.context()` owns the same native main-menu predicate as `read()`, returning only `{schema:1,mainMenu}` without style/layout or catalog reads. MOONSHINE uses that small DTO before the full catalog/viewport read. Menu presentation, foreground modal checks, focus, pause and cleanup remain in MOONSHINE. No cache state, native DOM or viewport geometry crosses the eligibility API; the existing full DTO is unchanged. Native source visibility/capture and fill-wipe bodies remain intact. Evidence: `diagnostics/b69-perf-focus-2026-10-10.md`.

### 原版隱藏 DOM：長期技術債務（2026-10-10）

原版來源的呈現／排版依賴正式列為 [TD-001](TECHNICAL_DEBT.md)，現階段維持現狀。隨 STG 更新逐項建立穩定的 LUNAR 資料／命令接口，經功能等價與實測成本驗證後，才解除相應原版 DOM 依賴；不承諾一次性替換或指定完成版本。原版遊戲判定權、LUNAR 集中來源適配與 MOONSHINE 自有呈現邊界不變；不把既有債務作為新增全量擷取、輪詢或隱藏 workspace 中轉的理由。

### RC1 Story artwork / VIEW CG（2026-10-10）

Encounter artwork remains on the directly owned Story background, deliberately
excluded from legacy source projection. The existing CG consumer reads
`MOONSHINE_STORY.art()` inside MOONSHINE: the committed owned CSS image, or the
same normalized source resolved by the existing resource API before first paint.
It does not query native DOM, capture story or reintroduce hidden artwork. Legacy
map/body source lookup remains a fallback. It also recognizes Fate's owned
`opacity:1` target plate; do not select a retired
`opacity:0` buffer or query native layers. Scan/Collected Data use their existing
independent inspection owner and readonly descriptors, not the native art toggle.
Missing/decorative image failure must
leave RETURN available in CINEMATIC; image readiness only enables local zoom.
The native art command remains the sole enter/exit authority. Keep persistent
chrome, translated DOM, native progress, quality policy and background generations
unchanged. No new polling, whole-view capture/fit or cache clearing.
