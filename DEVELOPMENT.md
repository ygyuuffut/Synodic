# SYNODIC（月相）開發指南（1.0.0-rc2）

## RC2 發行準備（2026-10-10）

使用者授權把下述 CG 修正候選提升為 `1.0.0-rc2`，revision
`rc2-cg-return-2026-10-10`。Runtime CJS／CSS 與已完成四模式性能對照的最終
修正候選相同；版本、水印、發行 metadata 同步，不改 LUNAR／MOONSHINE 1.0。
公開文件在 `../SYNODIC-RELEASE/1.0.0-rc2/`；原版、工坊、RC1 封包不覆寫。
`RELEASE_NOTES.md` 是公開對應源碼，builder 驗當前標題後原樣交付。
RC2 Core ZIP 再經 THEIA 1.0.1 安全 PC／C2、Force Deck 安裝及既有回歸；
證據入口 `builds/release-1.0.0-rc2/acceptance.json`，新檔 A35／真 CDN 仍需複驗。

## RC1 故事 CG 返回修正候選（2026-10-10）

`rc1-cg-return-2026-10-10` 是未發布的修正 revision；既有公開 RC1 封包保持
原 bytes。Encounter 的圖片已由 persistent Story owner 持有，兼容 workspace
刻意不投影 `.ev-bg`，因此既有 VIEW CG 不得只從 workspace 找圖。
`MOONSHINE_STORY.art()` 只讀自有 committed plate；首次圖片尚未 commit 時，
使用已保留的 source image 經既有 LUNAR resource resolver 解析。它不重新
擷取 story，不讀原版 DOM，也不增加輪詢／預載／畫質規則。

既有 CG viewer 優先使用這個窄的同層圖片入口；Map／Blessing／Body 等兼容
來源保持 fallback。Stomach Fate 未使用 `is-active`，額外辨識自有 workspace
中 `opacity:1` 的目標層，排除退役的 `opacity:0` 緩衝。圖片缺失或失敗仍建立固定 RETURN，顯示普通狀態文字、
停用無效縮放；成功圖片維持原 FIT 的等比例水平／垂直置中及捲動縮放。
RETURN 繼續走既有 LUNAR native art command，不提交劇情／戰鬥操作。
缺失／載入錯誤只寫 `MOONSHINE.art/CG_ART_UNAVAILABLE` 小型 WARN。

回歸必須涵蓋實際 `EncounterEvent` 的 VIEW CG 按鈕，不能只測 MapScreen。
入口：`tests/test_rc1_story_cg_live.cjs`、`tests/test_rc1_cg_theia_live.cjs`；
核對 persistent chrome／翻譯 identity、原版進度、固定 RETURN、置中／比例、
缺失／失敗圖片、普通 PC／C2 及真實工坊 Force export 的 Python byte equality。
同時驗 Blessing、Body Exploration、Upgrade、Rest Site、Stomach Fate 兩個
緩衝、generic Event、MapScreen／StomachMap／Combat 的既有 art command。
掃描完成／Collected Data 仍由獨立 `MOONSHINE_INSPECTION` 持有；回歸必驗
完成前不可檢視、兩次點擊 archive、六種直向尺寸、置中／縮放、RETURN／Esc、
父頁翻譯／捲動／焦點保留、失敗後可返回，以及不新增 capture／global fit／reward。
本輪診斷：[RC1 CG 故障與修正](diagnostics/rc1-cg-return-2026-10-10.md)。

## 首個公開 RC 封包（2026-10-10）

公開發行身份 `1.0.0-rc1`，延續 b6.9 的已驗收 Runtime 源碼；本輪只增加
發行工具、GPL-3.0-or-later 授權與版本身份，不改遊戲機制／UI 邏輯。
`synodic.build.toml`、`release.toml` 和主菜單水印一致；組件版本仍取實際
TOML：LUNAR API 1.0、MOONSHINE 1.0／requires >=1.0。歷史 0.1 與 b6.9
記錄不作當前發行 metadata。

工具在本項目，公開產物在 `../SYNODIC-RELEASE/1.0.0-rc1/`；格式見
[統一發行標準](../SYNODIC-RELEASE/RELEASE_STANDARD.md)，生成與驗收入口見
[BUILD.md](BUILD.md)。只從 synthetic seed 編譯 payload，公開源碼排除 HECATE
和專用 API；原版 PC／C2 各自按 raw SHA 驗入、比較 THEIA 最終匯出與 Python
oracle，並跑既有 story/actions、retained-history 回歸。原版和 b6.9 已有產物
不覆寫；測試輸出／證據在 builds/release-1.0.0-rc1/。

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

## SYNODIC Logger Rules（LUNAR API，2026-10-03）

Logger 的架構、接口、讀取權限與 lifecycle 歸 LUNAR API 管轄。以下為硬性摘要，完整30條及 review checklist 見 [LUNAR Logger 使用與讀取規範](lunar/LOGGER_USAGE.md)，目前實作見 [LOGGER.md](lunar/LOGGER.md)。適用 LUNAR、MOONSHINE、所有 MOD／私人開發模組及未來 Core subsystem。

1. LUNAR Logger 是唯一正式診斷日誌接口，不另建第二套正式系統。
2. Logger 只觀察，不參與 runtime state，不作 event bus／IPC／save system。
3. 新功能必須留下足以重建重要事件鏈的 breadcrumb。
4. 使用小型 structured payload 與穩定 ID，不 dump 完整 game／DOM state。
5. DEBUG／INFO／WARN／ERROR／FATAL 必須符合語義；捕獲 exception 傳原始 error/context，記錄後按原契約恢復、rollback 或 rethrow。
6. 所有跨層使用只經正式 Logger API；MOONSHINE 使用 api.moonshine，不讀 Logger internals／storage。
7. 公版只允許讀取／匯出 previous session，不提供 current viewer/export；普通 runtime 不讀任何日誌內容作決策。
8. MOD 使用 MOD.<id> scope，不冒充其他 ownership、不控制 Logger lifecycle，預設不讀 raw logs。
9. Logger failure 必須 fail-soft，普通 write 非阻塞、memory-first；核心不等待 disk persistence、不以 Logger return value 決定遊戲行為。
10. 日誌不得引入 capture、layout、同步 storage、完整序列化或明顯 hot-path 放大。
11. 不記 frame、不逐個 DOM／translation mutation 記錄、不把 Logger 當 profiler；最小化敏感／無關資訊，quote TOML 只是可選裝飾。
12. 目前性能策略為「禁止退化、暫不精修」；完整性能 pass 待主要結構完成後進行，未證實瓶頸不為 Logger 大型重構。

此更新不取消既有功能變更的性能比較及節點身份契約。Logger method／scope／export／session／MOD access 修改需按 LUNAR API contract 評估兼容性。新規範不是對現有全部實作已符合的聲明；含點 MOD scope 及 error name/cause 的目前差距詳見完整規範。


《SYNODIC》（月相）是一套針對原版遊戲的行動端兼容、資料轉接、顯示與擴展框架。SYNODIC Runtime 由互相要求共同部署的 LUNAR API 與 MOONSHINE UI 組成；HECATE 是非公開、可選的 SYNODIC MOD，不屬於核心。MOONSHINE 是通用行動端顯示與交互基礎，不能代稱整體項目；STG 是目前接入的遊戲本體。當前產品僅服務手機，不為尚不存在的桌面端或第三方 MOD 生態提前擴建。

b5 已驗收；b4 已移除。b6 從已驗收的 b5 遊戲檔建立獨立版本，改造直向手機的角色選擇畫面與各遊戲場景頂部 HUD。遊戲邏輯仍由原生函式負責。

## 先讀這一頁

LUNAR 與 MOONSHINE 是 SYNODIC Core 的兩個職責獨立、安裝與運行互為必要依賴的部分，不是可任意單獨部署的產品。MOONSHINE 擁有通用行動端 DOM、UI 元件、窗口、動畫、輸入及文本呈現；HECATE 的邏輯與界面組裝由 MOD 自己擁有。原遊戲核心保持封存，不在原文件內修補或重構其 UI／物件處理機制；與本體的交互全部經 LUNAR bridge／adapter／API。可以按手機需求調整顯示邏輯、轉場、HUD、劇情與互動呈現；戰鬥規則、卡牌效果、交易與存檔仍由原生程式負責。正式來源是 modules.json 中的 CJS／CSS 及 display-config.js；外部 b5 與 builds/ 中的 b6 HTML 都是生成檔，不要直接修它們。當渲染圖明確指名為改善版時，版面、色彩、對齊及相對位置以渲染圖為準，原生長警告文字與功能仍需保留。

- 找既有元件或新功能的搜尋入口，先看 [b5 UI 元件目錄](#b5-ui-catalog)。
- PC 對照來源：`../STG 0.2PC.html`。
- b2 是早期遊戲基底；**b6 以已驗收的 `../STG 0.2m-b5.html` 為輸入**，不要回頭覆寫為 b2 或 PC 檔。
- 當前輸出：`builds/STG 0.2m-b6.9.html`。保留 b5 與 b6；不覆寫輸入。
- 工坊、ZIP、英文整合包是既有快照，本輪不整合。
- Demo item 只存在測試瀏覽器的記憶體，不得加進正式模板。

正式項目目錄為 SYNODIC/：lunar／moonshine／hecate 保存三部分來源，builds/ 保存 b6 生成檔，design/ 保存 UI 設計源檔與概念圖。注入腳本、文檔與測試都在項目內；以下指令從上一層工作目錄執行，未指定 --output 時生成檔預設寫入 SYNODIC/builds/。

```sh
python3 SYNODIC/inject_mobile.py 'STG 0.2m-b5.html' -o 'SYNODIC/builds/.STG 0.2m-b6.6.pending.html'
python3 SYNODIC/tests/test_inject.py
# 確認待交付的變更後：
mv 'SYNODIC/builds/.STG 0.2m-b6.6.pending.html' 'SYNODIC/builds/STG 0.2m-b6.6.html'
```

### b6.6 LUNAR Logger／Mods 上一局匯出（2026-10-03）

新增 observer-only Logger：core 負責1500條 circular ring、scope／有界小型 payload、header、exception／dirty checkpoint；storage 用 IndexedDB 的 current／previous 兩筆 transaction；api 提供 previous-only export。LUNAR.api.moonshine 暴露同一 write-only logger 與 diagnostics；HECATE 經自己的 API 用 MOD.hecate scope，不加入公版插件分支。session 只在一次 HTML bootstrap 啟動，passage／存檔載入不 rotate。版本維持 b6.6。

Mods 底部按示意圖左 Export Log／右 Close，正常流雙欄 Grid、自適應同高；沒有 previous 時停用，aria-label 說明 Export Previous Log。MOONSHINE 只請求 LUNAR 格式化文字、建 Blob 下載及釋放 URL；可用性訂閱局部 patch，不 full render／global fit／遊戲通知，不重建翻譯／動畫節點。沒有 current 匯出、viewer 或 filters。

Logger append 不 capture／讀 DOM／geometry／stringify，不消耗 game Math.random；core／storage在pause bridge之前保留原生timeout／clear，checkpoint不進遊戲timer registry、不因計時回呼造成game emit，UI下載清理走timing.ui；checkpoint 在64條／dirty 2秒、ERROR／FATAL／hidden／pagehide 合併，無 idle polling。例外記錄後原錯誤仍可見；儲存不可用降級 memory／console warning。正常 shutdown 是 best effort；unclean 不是 confirmed crash，native renderer crash 不能由 JS 攔截，尚未checkpoint尾端可能遺失。quotes TOML 可缺失／空／malformed，注入器直接嵌入，不 fetch。

開發 API／生命周期／十項交付及限制見 [lunar/LOGGER.md](lunar/LOGGER.md)；完整需求見 [Logger requirements](diagnostics/b66-logger-requirements.md)。主要事件入口覆蓋 command／domain／view／patch／geometry／scene／story／MOD，不把 Logger 作 runtime state；精確性能統計仍是 test-only instrumentation。公開／私人真實 IndexedDB、異常、匯出與 viewport／翻譯驗證及同四模式4×三輪對照記於 [Logger 診斷報告](diagnostics/b66-logger-2026-10-03.md)。

### b6.6 全屏提示與地圖 Distance 圖標（2026-10-03）

全屏提示的窄螢幕 media rule 把 actions 改成 column，但較高優先级的 button width:0 仍生效，導致按鈕只剩邊框與 padding，文字溢到窗口外。根因屬 MOONSHINE CSS，不是 LUNAR 資料或網速；fullscreen 專屬 actions 改用正常流 Grid，360px 以下單欄，較寬兩欄，按鈕填滿自己的格子並允許換行。不加 absolute 位移、DOM 重建或 fit，保留原生 Yes／No 回呼及已翻譯按鈕身份。

位置圖標修正為 Material Symbols Outlined 的 distance（U+F6EA；本機字形索引 G+00DF），不是 person_pin_circle。component.symbols 僅請求 distance 子集，軸為 opsz24／wght400／FILL0／GRAD0；備援 SVG 使用同一 distance 字形在相同軸的輪廓。等待 CSS／字體或載入失敗時即顯示 SVG，成功時僅切換同格可見性，保留 slot／SVG／glyph／按鈕身份，不觸發 capture、LUNAR notification 或 global fit。Chrome 字體下載失敗時的 loadingdone.fontfaces 為空，早於 loadingerror；exclusiveFontEvent 對空列表檢查已失敗 face，僅全為此圖標家族才阻止舊全局 fit。空且無失敗 face、其他家族／混合失敗仍走既有路由；只在字體事件讀一次小型 FontFaceSet，不新增幀輪詢。SVG viewBox 是向量座標，不是 UI 絕對定位。

測試及 before／after 幾何報告見 diagnostics/b66-fullscreen-symbols-2026-10-03.md；六種 portrait 尺寸、延遲 UI 字體與正常回呼、圖標 CSS／font 失敗及實際 Google 字體成功均單獨驗證。慢網路明確設為400ms／750kbps下載／250kbps上傳，並非使用者 Chrome 3G preset 的精確複製。全屏測試以本機字體替代遠端 UI 字體製造載入／metrics 變化，不將它稱為真實 Noto Sans 或真機驗收。LUNAR API、本體邏輯及版本號不變。

### b6.6 存檔確認使用玩家命名（2026-10-03）

原版 slot picker 的 Load／Overwrite 確認標題寫死 Slot N，與 MOONSHINE 清單顯示的 saveName 不一致。LUNAR adapter.saves 識別既有確認文字／操作／body，bridge.saves 只在該確認建立時讀取指定槽位的最新 saveName；port.route 在手機 stgShowConfirmModal 參數交付前套用轉換。Load／Overwrite 改為玩家名稱，未命名／空白／讀不到存檔仍用 Slot N；滿槽匯入的覆寫 body 同樣使用目標現有名稱。

名稱是純文字，經既有 rich-text modal 之前跳脫 HTML 字元；不改儲存值、存檔格式、原生 callback／取消／實際 slot index，也不讀可見或翻譯後標籤。MOONSHINE 沿用現有確認窗口、自適應長標題和局部 patch，不新增畫面、hidden-workspace 中轉、輪詢、observer、刷新或 fit；既有兼容窗口路徑未作全面遷移。桌面委派及其他確認框保持原版。

tests/test_save_confirm_bridge.cjs 驗每次只讀目標槽位、名稱時效、純文字跳脫、callback／options 身份、不相關窗口零讀取、匯入提示與 desktop 委派；test_b66_save_confirm_live.cjs 驗真實 rename／load／overwrite／cancel、未命名回退、特殊字元／長名稱、五種直向比例、翻譯零回灌／HP 更新保留標題身份且無 global fit、原生載入／寫入各一次。公開／私人 b6.6 與既有命名回歸、分層及注入完整性驗證；瀏覽器測試不替代真機驗收。

### 測試環境：Chrome CPU profile（b6.6，2026-10-03）

依使用者提供的 Chrome「CPU throttling presets」校準截圖，目前這台開發電腦採用以下測試方案：

| Profile | CPU slowdown | 用途 |
| --- | --- | --- |
| 無 throttle | 1× | 獨立的正常速度 sanity check |
| Mid-tier mobile device | 2.8× | 目前電腦校準的中階手機 CPU 情境 |
| 歷史 A/B 基準 | 4× | 保留 b6／b6.5／b6.6 分階段 before／after 比較條件 |
| Low-tier mobile device | 9.8× | 目前電腦校準的低階手機 CPU 壓力情境 |

2.8×／9.8× 是本機 Chrome 校準值，不是指定手機的實測效能，也不模擬手機的 GPU、記憶體或網路。新增情境不取代既有 4× 基線，不將不同限速的絕對耗時混比，也不將 rAF 間隔宣稱為真機 FPS。

before／after 必須使用相同 profile、倍率、Chrome／電腦、viewport、fixture、媒體策略及重複次數；各 profile 分開保存報告與 trace。記錄校準日期、Chrome 版本、測試機識別及實際倍率。更換電腦或按 Recalibrate 後重新記錄倍率，建立獨立比較基線，保留舊報告。新增 profile 的 benchmark 指令及記錄要求見 [測試指南](tests/README.md#chrome-cpu-profile測試環境)。本次僅補充測試方案，未新增 benchmark 結果。

### b6.6 升級商店與無文字過場（2026-10-03）

- bridge.actions 以原生升級場景與離開意圖（Leave／Continue／Skip 等，以及原生 lab exit control）識別必選門檻。未確認的退出項為 disabled，execute 重新驗證，僅 select 不解鎖；使用既有零費 NONE 或實際商品，confirm 委派原生結算／清節點，再提供 receipt 與延後離開。已確認的退出意圖統一委派已記錄 destination，不能再次執行交易。沒有修改原版交易或桌面邏輯。
- story.presentation() 只讀目前 encounter 的 interstitial／art entrance、paragraph id 與 choices flow，並在 WeakMap 保留「等待下一段文字」的流程狀態。原生 remove hidden 與下一段 prose／card receipt 之間，不將舊正文誤認為新內容；新 paragraph 或原生最後 choices 開放才結束等待。資料與 flow validation 屬 LUNAR，opacity／visibility、動畫與自有節點屬 MOONSHINE。
- story.presentation domain 由原生局部 class 變更產生，不擷取 panel 子樹、不經 hidden workspace 全量中轉。view.story_phase 直接 patch 常駐 STORY BOX 正文的 held attribute；不再複製 native class 控制外框；CSS visibility 同時阻止既有 opacity animation 露出舊字。不替換正文、翻譯包裝、panel 或其父節點，不量測／全局 fit、不新增 observer／輪詢；同幀仍走現有 visual queue。story／dialogue 更新亦同步 phase，使新正文可讀。ACTIONS ready 同時檢查此 flow gate；phase-only 不再讀完整 actions／重新安裝樣式，僅在已有菜單時關閉。非 encounter 的 Arc 進場保留原兼容路由。
- 原版 interstitial 在 250ms 定時後才寫背景 URL，音效 delay=0 可先播，沒有等待下載／decode；此原生時序保留。resources.encounter() 只交付目前 sequence 最多三張後續不同 CG 的已降解析度 URL；adapter 單次順序掃描至三張即停，無熱路徑全量掃描。MOONSHINE view.encounter_assets 在開場正文仍可讀時發起 async／low-priority Image 請求，每 sequence 一次，普通刷新不重請。最多保留三個 Image，scene／scope／desktop 清理，不留歷史 cache、不用原尺寸備援、不預載全部 CG／音訊。網路很慢、快速跳轉或圖片請求失敗時，預載不能保證原版音畫同步。
- test_b66_shop_cinematic_live 對照原生 Hungry Maid 流程與 450ms 可控圖片延遲，驗證商店 UI/API 門檻、NONE 不扣 DATA／不加 owned、原生 continuation／card receipt、新段落恢復、後續圖片提前請求及去重。完整過場正常運行；純 phase 成本測試暫停原生背景 timers，保留 animated／translated identity。1×與4×報告見 diagnostics/b66-shop-cinematic-2026-10-03.md。
- Chrome 地圖資訊關閉再次偶發崩潰已記於 diagnostics/b66-known-issues.md：新增「反覆載入存檔後進出資訊窗口」線索，資源爆衝仍是假說；依使用者要求待穩定重現再追查。

### b6.6 地圖窗口生命週期／HUD 同步（2026-10-03）

- 地圖入口獨立於 passage，原先不繼承 HUD 父頁面的約 0.4 秒 opacity 進場，因此提前顯示。view.location 只查自有 HUD 的祖先透明度、opacity effect／timing；依 transition／animation 開始與結束事件，複製同一 document timeline 的 startTime（pending 時等 ready 一次），由 Web Animations 合成器播放。按鈕關閉 CSS transition，避免全局 button 樣式再增加一輪淡入。scene／viewport 才量測 anchor；普通 state 不重建入口、不全局 fit、不做逐幀讀取。
- timing.subscribe(fn) 傳遞獨立的 pause boolean，取消訂閱函式由 API 返回。不是 game subscriber／dirty domain，不 capture／normalize／buffer、不傳動畫資訊。MOONSHINE 同步切換自己的 suspended class，在其他窗口開始開啟、尚未 visible commit 時遮蔽入口；nested owner 仍暫停時保持遮蔽。自有 main inert／dialog／transition veil／View CG 提供補充 CSS 遮蔽。
- pause bridge 寫入 native inert／body 暫停 class 原先被 port 當作 compatibility 更新，每輪約兩次全量 capture。控制寫入以 WeakMap／Map 記錄 attribute 的 oldValue 與次數；開始控制 transaction 前先 drain 原生 records，port 既有 observer 帶 attributeOldValue，僅消費匹配的控制 records，不忽略同批真正的遊戲／body class／inert 變更。沒有新增 observer／輪詢，紀錄查找 O(1)，消費後刪除。不改原版核心或其背景 timer 通知。
- 地圖窗口先還原 MOONSHINE 背景 inert，再 release 暫停；離場中重複 close、navigation、釋放後 callback 重入不恢復或聚焦已移除／新窗口的 launcher。原有 media／timer／elapsed／nested pause 行為保留。
- 新回歸 test_b66_location_lifecycle_live 驗真實 passage 首幀同步、Info／Options 同事件即隱藏、同 attribute 真實變更仍通知、map／combat 各 20 次開關、重複 close、離場中 scene 更換及零純控制刷新。CPU_RATE=4 為 4×；STG_LOCATION_REMOTE=1 為真實遠端資源；STG_LOCATION_REPORT 保存數據，STG_LOCATION_BEFORE=1 只供舊版比較。before／after 和限制見 diagnostics/b66-location-lifecycle-2026-10-03.md。
- Chrome 截圖是 renderer 崩潰。當地前兩筆 dump 同一 Chrome 154.0.8037.57 renderer／同一 framework 位置中斷；沒有可讀 native stack，不能證明 OOM、JS 循環或本次 UI 是根因。離線／遠端及 4× 連續開關未重現；僅確認並修復上述更新放大及演出問題，不宣稱已完全排除冷啟動崩潰。

### b6.6 地圖第一輪：位置／附近資訊窗口（2026-10-02）

MapScreen／StomachMap 將原位置標題、legend、附近巨人的頭像／名稱／副標題／HP／Affinity／Collected Data 移到 HUD 下方左側的位置按鈕。原地圖 SVG 節點、連線、排序、圖形和原生點擊動作保留；只整理資訊入口及地圖內容上方留白。本輪不重新設計 legend，不改關卡生成或移動邏輯。Start 戰鬥沿用同位置的按鈕，窗口只顯示原生位置名稱及 OK。

- LUNAR adapter.location／bridge.location 提供 location.context() 與 location.read(part?)；只讀目前位置及需要的原生 legend／附近 metadata 小區域，HP／Affinity／scan count 讀權威遊戲值，不呼叫會初始化／遷移數值的 pool getter，不使用 game.capture／整份 _STG／JSON copy。附近名單沿用原生已產生的名單，沒有複製 Gilly 出現條件。
- location、location.nearby、location.legend 有獨立更新路由。關閉窗口時，附近數值變更不讀 legend／附近列表；戰鬥窗口忽略 nearby／legend domain。混合 domain 同批處理，普通數值不全頁刷新、不量測／fit。display.viewport() 只查 viewport／zoom，不附帶主菜單查詢。
- MOONSHINE component.location 組裝穩定 Grid／Flex／有界捲動窗口，view.location 管理輸入、焦點、暫停權、離場與 overlay 動畫；直接建立自有 sibling DOM，沒有新增 hidden-workspace 全量中轉。附近資料以 id 就地 patch，legend 以 id 保留文字及圖形；來源未變保留翻譯包裝、tooltip、窗口／行／父節點身份。
- 所有數值用 JetBrains Mono 700、translate=no；HP 兩格／Affinity／Collected Data 數值使用各格的 inline-size container 與字數縮字，長值不溢出。標題、名稱、副標題、legend、按鈕文字仍可翻譯；Grid/Flex 自然換行與 CSS 自適應，不需要翻譯 observer 或 JS fit。
- 新根 data-ms-css-layout 表示由 CSS 自行適配；既有 geometry observer 不將它送入兼容 fit。位置按鈕只在 scene／viewport 改變後局部讀一次自有 HUD 邊界；先更新根的尺寸／模式，再量測，之後集中寫入自有根。沒有 absolute 定位修補、輪詢或 LUNAR 動畫。
- Material Symbols Outlined 的 distance（U+F6EA），opsz24／wght400／FILL0／GRAD0，Google Fonts CSS2 僅一個請求／單字形。符號 translate=no／aria-hidden，按鈕另有可讀名稱；字體載入前及失敗時使用同格、同字形 SVG 備援。字形載入完成只切換該 slot，單獨的此字體 loadingdone 不觸發現有 ACTIONS／HUD／其他頁面的全局 fit。
- Collected Data 的計數是該角色已 capture-completed scans 數量，不是玩家 DATA。原第一輪按鈕保留為未接線呈現；2026-10-04已接自有Collected Data子菜單，見本文件最新節。沒有附近巨人時省略該區。

測試 test_b66_location_live 涵蓋 map／stomach／真實戰鬥、原地圖保留、五種 viewport、大數值、原生池唯讀、翻譯／動畫身份、兩通知合併一次提交、已關閉／戰鬥不讀附近資訊、pause／Escape／OK／desktop／字體失敗。Distance 現沿logical font規則使用SVG／零Material font請求，舊remote-font測試開關已移除；STG_LOCATION_SCREENSHOT 保存畫面。既有 HUD 回歸改為驗新位置入口後的內容邊界，Lab 保持舊 band 條件。瀏覽器與網路驗證不代表真機驗收。

### MOONSHINE 可用符號字體：Material Symbols（b6.6，2026-10-02）

Material Symbols Rounded／Outlined／Sharp 可作圖標來源，軸為opsz/wght/FILL/GRAD，起始24/400/0/0；UI依具體icon選擇家族和變體。不預載完整family，不替換正文／數值字體。2026-10-04 Font Rules已取代舊直接Google CSS loader示例：新font先註冊LUNAR logical resource，Core不依賴Google Fonts waterfall；MOONSHINE只選圖標、佈局和呈現。

所有Material Symbols均允許使用同icon／family／axes的SVG。当前位置distance（U+F6EA）常駐已有Outlined SVG（26px格子、24/400/0/0）；二級Loading sync arrow是SVG；Rounded／Sharp沒有active字體或預載。網絡失敗不影響操作。

- 圖標槽維持Grid／Flex與可自適應尺寸，控制項／焦點／動畫／translated DOM identity不替換。
- 裝飾圖標translate=no／aria-hidden=true，可操作控制項另保留可讀名稱；正常標籤和說明仍可翻譯。
- 字體ready或圖標變化只失效使用該資源的局部geometry，不通知LUNAR game refresh、full render／fit或輪詢。
- 字體resource/source/cache屬LUNAR，字形對照／SVG／動畫／geometry屬MOONSHINE；不得在每個icon／普通state refresh重新load。

來源家族／icon參考：[Material Symbols官方指南](https://developers.google.com/fonts/docs/material_symbols)、[圖標庫](https://fonts.google.com/icons?icon.set=Material+Symbols)；正式font API與review見[lunar/FONTS.md](lunar/FONTS.md)。

### b6.6 圖鑑密碼窗口的責任與輸入（2026-10-02）

圖鑑 Unlock 窗口由 MOONSHINE component.text_prompt 直接建立／管理自有前景 DOM，view.compendium 只提供標題、紅色主題和提交意圖。標準 password input 使用瀏覽器遮蔽，不再覆蓋自製 mask 或游標；輸入只留在可見欄位，無每鍵 workspace 中轉、LUNAR update、canonical state／buffer／exchange寫入或 fit。窗口共用存檔命名的正常流 Grid／單一圓角外框、圓形確認鍵、自然高度取消、安全區和可捲動面板格式。

確認符號由 component.text_prompt.chevron 提供對稱 SVG；存檔命名也使用它。UI字型的 > 墨跡偏移不能用文字框中心驗收，測試同時驗SVG path中心和實際截圖。SVG aria-hidden／translate=no；按鈕保留可讀 aria-label，桌面重命名恢復原文字。無 absolute／transform補位／JS fit。

LUNAR api.moonshine.compendium.cardsUnlocked()／unlockCards(value) 是唯一新驗證邊界。bridge只在提交時傳入最多12字字串，於原版同步驗證期間用 request-local 資料物件適配 comp-admin-input／comp-admin-msg lookup，其他lookup原樣委派，finally必須還原及清空值，包含原生拋錯情境。不得建立原生隱藏輸入或重寫／複製密碼判斷，不得在log／buffer保留密碼。成功才發 cards domain；原生繼續擁有驗證、解鎖flag、持久化及既有圖鑑刷新。這是既有無參數原生函式的窄兼容修正，不是新的DOM／UI責任。

MOONSHINE負責真實焦點、Tab／Escape、Enter表單提交、取消、背景inert及pause owner释放；viewport變化用UI rAF合併該窗口幾何，普通state更新不碰它。翻譯的標題／Cancel包裝保持身份。桌面切換／離場／圖鑑關閉撤銷窗口。測試見 test_b66_compendium_unlock_live／test_compendium_unlock_bridge；原有存檔 callback／40字上限維持，rename的回歸繼續執行。

### b6.6 存檔重新命名的自適應布局（2026-10-02）

本次為 MOONSHINE 共享 source_styles 的窄範圍呈現修正；LUNAR 的 prompt／存檔 callback 轉接沒有問題，不修改 API 或本體。既有 saves.renameNative 已把自有 input／確認按鈕置於 rename-entry，保持該 DOM 和回呼，不新增元件或 hidden-workspace 管線。

舊布局將圓形確認鍵 absolute 疊在獨立圓角 input 上，右側形成不均勻新月縫隙；Cancel 繼承原生按鈕的 column Flex／頂端對齊，31px 控制項中的標籤向上偏6.5px（400×760 的修復前量測）。改為 rename-entry 共用單一圓角外框／底色，Grid 的 minmax(0,1fr)＋auto 分配 input 和確認鍵；input 無獨立外框、確認鍵正常流，aspect-ratio 保持圓形且按手機寬度 clamp 尺寸。两個按鈕都用 Grid place-items:center，label 繼承字體並清除額外 letter-spacing，沒有 transform／absolute 文字補位。

Cancel 以 min-width／max-width 和自然高度容納翻譯，標籤可換行；輸入文字可沿原生 input 水平捲動，欄位 min-width:0。面板按可用寬度及安全區限制，過短可見高度可捲動，overlay 仍沿用既有 visualViewport 約束。鍵盤不能用横向 layout viewport 冒充：測試保留400×760的 layout，只將 visualViewport 高度模擬為380。

純 CSS 不增加 refresh／DOM 重建／fit／observer／輪詢／量測／更新管線；不相關 HP 更新保持 dialog、input value 和翻譯標籤 identity，global fit=0。原生繼續擁有取消、確認、Enter／Escape、40字限制和 localStorage 保存，desktop 保持原版 prompt。

回歸 tests/test_b66_save_rename_live.cjs：真實開局／寫存檔／讀檔頁重新命名，400×760、360×640、360×800、748×1400、320×568及模擬鍵盤高度；外框／Grid／非absolute、標籤中心、翻譯零回灌與輸入身份、原生取消／保存／鍵盤／長名稱限制及 desktop。STG_RENAME_BEFORE 保存修復前幾何與截圖，STG_RENAME_SCREENSHOT 保存修復後；測試只模擬翻譯和可見高度，真機鍵盤仍待使用者驗收。舊 b5 的「確認鍵包含於 input 範圍」斷言是歷史 absolute 規格，不適用此 b6.6 正常流布局。

### b6.6 ACTIONS 摘要／陣營文字色（2026-10-02）

LUNAR bridge.actions 只讀目前原生按鈕的 authored HTML、文字和 class；依 BR／區塊標籤辨識第一行，不用 innerText 或量測 layout。adapter.story_actions 提供完整 label、收合 summary 與小寫 affiliation；摘要只保留第一個非空行，有後續行才加省略號，既有 …／... 不重複添加。首尾水平／垂直箭頭、三角與 variation selector 去除，內文標點／中間箭頭／交易數值及完整富文字仍保留。每個來源按鈕用 WeakMap 快取未變的 HTML／class 轉換，disabled 變化不重走文字正規化，沒有掃描其他場景或翻譯後 DOM。

MOONSHINE ACTION_COMPONENTS.row／updateRow 使用 summary 建立單行收合文字；展開繼續顯示完整 HTML。只有展開文字和左側圖標套 affiliation 色：Grace #73abef、Chaos #f06014、Logic #efcc00；Balance／Instinct／Harmony／Worship／Alpha 使用既有家族色，Void 使用原生灰色。收回後同一般對話紫色，展開外框維持標準淡紫高亮；顏色不進遊戲狀態、不以翻譯後文字猜陣營。

摘要、完整正文、陣營 metadata 和 disabled 分開比較／就地 patch；class-only 陣營變更只修改 dataset，普通狀態不替換動畫中的 row／完整正文／翻譯包裝。沿用既有 ACTIONS domain 和 accordion，不新增全局 fit、observer、polling、full render、hidden-workspace 中轉或大型管理物件。原生 callback 的兩次點擊選擇流程不變。

使用者最新水印 TOML 的字號為24 CSS px；注入器沿用已有格式驗證與四角布局，必須重新生成 HTML 才會套用，手機不讀 TOML。回歸入口 tests/test_b66_action_labels_live.cjs，另保留 actions_followup／main_menu_watermark／stabilization 的流程及身份測試；DOM 翻譯模擬不能代替真機翻譯服務。

### b6.6 重複卡牌數量標記（2026-10-02）

獲得多張同款卡牌的 `×N` 從圖片上方移到卡片外、下方置中；沿用既有數量節點，初次 detail 組裝時移到自有 card-wrap，不建立第二份數量資料或新的 hidden-workspace 管線。MOONSHINE card_detail 與共享 source_styles 處理位置／字型，LUNAR 仍讀原生數量與轉接既有 cards.dismissPopup，原版擁有發牌、armed guard、音效、離場動畫與 onDone。

依使用者最新要求，數量是 JetBrains Mono **800**；依最新渲染圖調整為 `clamp(28px, 9vw, 48px)`（400px寬為36px），淡紫色，translate=no；共用 Google Fonts import 補官方800字重。Flex 直向排列、正常流定位，不用 absolute 移位；CSS 在有數量時為目前字號／間距保留高度，必要時縮小卡片整體，保持可捲動詳情，不做 JS 全局 fit。數量 pointer-events:none，卡內文字仍受保護，空白處沿用已驗證的 API 關閉並回到原戰鬥。desktop 恢復時移除外移節點再還原原布局，避免同一份工作區數量重複。

普通 HP 更新及關閉動畫期間保留卡片／數量 node identity；沒有新增 observer、polling、full render、全局量測、遊戲核心修改或 God Object。回歸 `tests/test_b66_card_multiplier_live.cjs` 覆蓋四種直向尺寸、800／渲染圖比例字號、圖片外位置、單張不顯示、×3、快速空白連點、動畫中的局部更新、原戰鬥接續與 desktop；原本 `test_b66_card_receipt_live` 維持劇情獲卡／連續獎勵／ACTIONS 驗證。

### b6.6 主菜單 TOML 水印（2026-10-02）

`moonshine/moonshine.main_menu_watermark.toml` 是水印唯一設定來源，保留使用者新增的文字、bottom left、opacity 0.5、JetBrains Mono 400／24px。接受 `[watermark] watermark.text=...` 的既有點號格式，也接受 `[watermark] text=...`／`[watermark.font]`。position 支援 bottom left、bottom right、top left、top right；opacity 限 0～1、weight 限 1～1000、size 必須為正數，單位為實際 CSS px，不自動當成1080參考圖像素。空文字可隱藏水印，長文字按可用手機寬度換行，不縮字或做全局 fit。

注入器讀取／驗證 TOML，將轉義的純 JSON 嵌入 HTML；修改設定後重新注入生成遊戲，手機執行時不 fetch 本機 TOML、不要求檔案／儲存存取權限。LUNAR bridge.main_menu／api.moonshine.mainMenu.watermark() 提供固定唯讀設定，read() 僅提供語意 mainMenu 與 viewport；不建立 UI、不 capture 整份遊戲，也不把設定放進 authoritative game state。

MOONSHINE view.main_menu_watermark 建立獨立自有 DOM，不經 hidden-workspace／catalog 全量中轉。只在主菜單前景顯示，原 WATERMARK QUICK EDIT／CSS ::after 水印已廢除；Settings、Load、Compendium、Credits、確認／同意／全屏窗口、Mods、遊戲及 desktop 不顯示。使用安全區 padding、Flex 對齊及與既有主頁相同的 zoom 補償，不攔截觸控。文字只在建立時寫入，翻譯包裝／節點可在不相關更新與前景切換間保留。

水印是 MOONSHINE-root 外的 sibling overlay，圖層必須高於主畫面 root（2147483646）；使用既有獨立 overlay 的 2147483647，並保留前景窗口的 CSS 抑制。僅有 isVisible／bounding box 不代表實際未被背景遮擋，驗收須加入 opaque background 下的截圖像素差異。

mainMenu／viewport domain 局部更新只路由到水印；真正 scene／既有 compatibility 更新同步其可見性，不由水印觸發任何完整刷新。前景窗口以自有呈現 CSS 抑制，沒有新增 MutationObserver、輪詢、動畫、尺寸量測、全局 fit 或遊戲通知。

回歸入口：`tests/test_b66_main_menu_watermark_live.cjs`；注入設定驗證在 `tests/test_inject.py`。歴史 b3 的 Compendium 水印斷言描述舊版行為，不作 b6.6 水印驗收。

## LUNAR API／MOONSHINE UI／HECATE MOD 硬性規範（2026-10-01）

必讀：[完整架構規範](ARCHITECTURE.md)。LUNAR 是遊戲資料／命令／待顯示資料的交換站，禁止畫面處理；buffer 只保存資料，沒有遊戲狀態權威或命令能力。MOONSHINE 只負責自己的介面、元件、動畫與玩家輸入，只接 LUNAR API，不匯入、偵測或呼叫插件實作；通用 Mods 管理介面僅顯示 LUNAR 提供的標準 metadata／狀態及送出偏好，不含任何插件專屬分支。HECATE 是非公開可選 MOD，只接專用 LUNAR API 和公開 MOONSHINE 通用元件；SYNODIC Core 不要求它存在。**歸屬模糊，先詢問使用者。**

本次全面撤除舊手機模組對原生 DOM 的介面加工：顯示算法搬到 MOONSHINE 私有 workspace，自己的物件／DOM 與可見元件樹；只有 LUNAR 能擷取原生來源和執行回呼。原生畫面由 MOONSHINE 的命名空間樣式屏蔽；沒有刪除或重寫原遊戲全部渲染函式。現有來源格式仍有兼容別名，由 LUNAR 維持 API 契約；新畫面用標準快照／語意動作，禁止新增來源符號依賴。

正式注入順序及可選插件見 `modules.json`；分類資料見 [LUNAR 目錄](lunar/README.md)，可重用顯示見 [元件庫](moonshine-components/CATALOG.md)，定位見 [定位盤點](moonshine-components/LAYOUT_AUDIT.md)。CJS 檔案為瀏覽器 IIFE 注入腳本，不在瀏覽器執行 Node require。

| 模組 | 歸屬與責任 |
| --- | --- |
| lunar.buffer.store/game/story/shop/actions/exchange | 記憶體 scope、副本、標準／来源資料、待顯示富文字、首次商品價格、交換資料；沒有命令 |
| lunar.adapter.data/game/actions/story_actions/menu/shop/images/mods | 純格式／schema／動作／語意／資源 URL 轉換 |
| lunar.bridge.interfaces/game/story/shop/actions/port/native/resources/pause/mods | 原生函式與回呼、來源資料擷取、通知、run／load、商店提交、圖片請求、遊戲暫停 |
| lunar.api.moonshine | 呈現端 API：快照、目錄、待顯示內容、操作、viewport／交換、來源格式適配及 UI 計時 |
| lunar.api.hecate | 僅 HECATE MOD 組載入的開發 API：資料副本、能力清單、明確命令；目前遷移 Restore HP |
| moonshine.component.catalog/theme/upgrades/mods | 通用 DOM 工廠、主題／字型、符號、卡片／數值／控制項 |
| moonshine.view.workspace/style_adapter/layout/runtime/display | 自有資料組裝、命名空間樣式、手機尺寸、焦點及呈現生命週期 |
| moonshine.view.main_menu/dialogs/settings/compendium/saves/deck/card_detail/story/actions/game_chrome/mods | 既有手機畫面顯示算法；只加工自有節點，原生行為透過 API |
| moonshine.input.actions/story_actions/mods / moonshine.animation.components/accordion | 玩家输入路由／模態關閉／觸控、自己的動畫 |
| hecate.command.player / hecate.panel.tools | 可選的修改器命令／獨立面板；不進一般遊戲包 |

圖片策略維持 CG／戰鬥 60%、卡牌 30%、敵方 intermission 40%，基準為手機顯示尺寸 × DPR（24～1600px），LUNAR 轉換及接管請求，MOONSHINE 決定顯示。禁止原尺寸失敗回退；不下載原圖探測尺寸，百分比不代表原圖固有尺寸百分比。

商店以 run／node／shop 鎖定首次原生成果；固定商品／價格與動態餘額／持有分開。新 run／成功讀檔重建記憶體 scope；面板銷毀不刪 buffer；未改存檔格式，跨重新載入持久化仍待設計。

既有模板中的 `STG_MOBILE_*` 名稱現在是 MOONSHINE 私有 workspace 的物件別名，不是真實 window 的公開 API；模板中的 `surface`／`viewDocument` 都只指自己的物件。下方較早的接口和布局條目用於查找功能與來源，不授權直接存取遊戲。正式公開元件入口為 `MOONSHINE_COMPONENTS`，遊戲資料與動作入口為 `LUNAR.api.moonshine`。

原生 Dev Features 的歸屬已由使用者確認：保留原遊戲內建功能，以 MOONSHINE 自有菜單呈現、LUNAR 轉接既有動作；HECATE 為另外的可選修改器，兩者互不依賴。

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

## SYNODIC b6.6 — Update domains / translation isolation

Browser translation is treated as an external presentation-layer mutation. It must not modify LUNAR canonical state, trigger game-state refresh, or cause unrelated MOONSHINE components to rerender.

Translated text nodes should retain identity across unrelated state updates.

本輪以 domain → view/component 路由及 component-level fit 取代普通變更的通用更新。content/state/structure/geometry 分開：selected、disabled、affordable、顏色不 fit；內容、翻譯、字體、尺寸、viewport 及結構變更才失效相應幾何。可見 observer 不回送 LUNAR、不讀 canonical state、不刷新無關 view。

實作入口：lunar.bridge.updates 提供小型標量讀取／變更描述；port.subscribe 傳 revision、domains、targets，未知原生結構顯式標記 compatibility。api.moonshine.updates 提供 scalars／partial；workspace 僅更新 target 子樹，view.updates 路由 playerHUD／enemyHP／HUD／ACTIONS／Mods。geometry queue 只觀察自有可見 DOM，外部文字变更不送到 LUNAR。sources 同 revision 快照共享不變；完整 snapshot() 是明確的完整查詢，不用於 HP 等熱路徑。

普通 selected／disabled／affordable 更新不量測。文字／結構／數值位數变化標記本元件；viewport／font 可以較廣但按元件合併 fit。讀寫分批及單元素尺寸快取沿用 b6.5。全來源 fallback、命令驗證副本、原生整塊戰鬥 replacement 仍列為債務，不能據此新增全局刷新。

測試：tests/test_b66_domains_live.cjs（八項局部更新與翻譯身份），test_b65_stabilization_live（共享快照／同幀提交／動畫身份），test_b6_performance_live（四模式3輪4×及獨立1×）。整理工具 tests/summarize_b66_performance.cjs；完整數據和 routing trace 在 builds/performance-b6.6/，可追蹤報告在 diagnostics/b66-performance-2026-10-02.md／json。不以未下降的 viewport／dialogue 或原生戰鬥布局成本宣稱全面提速。

完整階段一要求及八項驗收見 [b6.6 要求](diagnostics/b66-stage1-requirements.md)。沿用 b6.5 的 capture reuse、rAF coalesce、ACTIONS 身份及 buffer 邊界；不移除全部 workspace、不建立大型 manager、不修改原版核心。每項保存 routing trace、before/after、fit 範圍、copy/stringify 分布及剩餘 full fallback。

### b6.6 ACTIONS 的正文閱讀門檻／主菜單 Load（2026-10-02）

兩輪行動之間產生非空白正文，就關閉 ACTIONS、釋放其暫停並回到劇情；正文完成後仍需玩家主動開啟 ACTIONS。沒有新正文或只有空白／換行的選項接續仍在同一菜單進行，不能僅因原本保留的舊正文非空白就反覆關閉。

LUNAR bridge.actions 的 story 使用當前 text 節點的 data-lunar-story-id 取得完整標準正文，不能抓同頻道最新但屬其他來源的 entry。BodyExploration 的原生插圖展示會延後填入正文：在空來源且原生 art-entering 的窗口，讀取當前角色／節點的 authored text，提供 story.pending=true、ready=false。這是資料及流程狀態，不是 LUNAR 的動畫排程；不縮短／重写原生展示。MOONSHINE 在待顯示正文非空白時先返回閱讀，不能提前 acquire ACTIONS 的 pause 阻塞原生 timer。

body-sense-host 的即時感官描述也納入 story.html；以新來源子節點身份區分再次產生的相同文字，未重產生的旧正文身份不變。其原生／workspace 更新路由到 dialogue target，局部 patch 本正文元件；純感官 fragment 不再派發全套模板 data-change，game_chrome 的場景 observer 也排除該局部正文。避免重設 zoom 與全局 fit，不新增 full render、observer 或輪詢。 partial prune 只移除仍 connected 的旧節點，已移除父節點的離線後裔只清理索引，避免無效的重複 DOM removal 觸發全頁兼容刷新。既有選單暫停的 inert／body marker 兼容更新仍是舊技術債，與本次局部描述路由分開驗證，按使用者要求留待後續優化。

LUNAR adapter.menu 分類忽略資料夾裝飾及 variation selector，將原生 📂 Load Slot 正確識別為 load；MOONSHINE 沿用既有純文字 Load 變體與原生 slot picker 回呼，不改原版／desktop 文案。

回歸：tests/test_b66_story_gate_live.cjs（真實 Arc leg→seat 的延遲正文、seat→gap 的即時正文、重複感官描述、空白選項 hub、Load callback、翻譯節點與 desktop 委派）；保留 tests/test_b6_actions_followup_live 的纯選項／保留舊正文反例，以及獲卡／初次升級／正文翻譯回歸。

### b6.6 聊天選項單一呈現／HUD 翻譯隔離（2026-10-02）

原生 encounter 結果的 button.enc-continue（包括 Move on…）已由 LUNAR actions 轉接。MOONSHINE 的手機 story-root 抑制規則必須同時包含其來源別名，避免原生回呼控制項又在正文區显示。保留原生節點與回呼給 LUNAR；ACTIONS 是這類行動的唯一手機可見入口。不要用文字匹配刪除任意按鈕，也不要隱藏正文 footer 的 VIEW CG／ACTIONS。

MOONSHINE.component.catalog 在建立／patch 自有頂部 HUD 時設定 translate=no；i、HP、圖標與數值繼承排除。只限 HUD，正常正文及菜單說明繼續允許瀏覽器翻譯。來源沒變時既有屬性不重寫；普通 HP 更新保留 HUD／標籤身份。無新增全局 observer、refresh、fit、輪詢或 hidden-workspace 中轉；本次無須改 LUNAR API 或原生邏輯。

回歸擴充 tests/test_b66_card_receipt_live.cjs：真實乳酪分享分支完成後正文零可見按鈕、原生 continuation 仍 connected、ACTIONS 僅一項且能回 MapScreen；HUD 及其標籤／圖標／數值排除翻譯，正文仍 translate=yes，HP patch 不替換 HUD。另以 test_b6_prose_translation_live 保留已翻譯正文包裝。Chrome 驗證的是標準翻譯屬性與節點身份，不代替手機內建翻譯的真機驗收。

### b6.6 手機縮放與對話控制項

MOONSHINE.view.display 管理真正頁面的 MOONSHINE-viewport meta；原來 private workspace 的 meta 只是兼容模板資料。touch-action:manipulation 套於可見 UI 的頁面／根，避免正文／空白區双擊放大。推薦重設先短暫調整 initial-scale，再還原1，之後透過 api.moonshine.display.resetRecommended 呼叫原生推薦；不試圖直接寫唯讀 visualViewport.scale。操作在 UI rAF 排程，暫停不阻塞；重複點擊共用pending，離開mobile清理metadata，原生viewport不改寫。一般狀態刷新不重讀profile或重設viewport。

portrait／landscape 使用 layout viewport；visualViewport 僅提供可見高度／offset，不能將縮放或鍵盤誤判為旋轉。dialogue SKIP 的原生身份由 LUNAR 標準化為 story.skipIntro，MOONSHINE 不組裝該控制項；不得用文字「SKIP」全局刪除Skip rewards、NONE或其他有意義的選項。段落跳過／完成及Continue回呼不變，desktop仍用原版控制。

回歸 tests/test_b66_display_recovery_live.cjs；瀏覽器頁面比例與原生_STG_ZOOM分開驗證，不能只確認設定數字改變就宣稱恢復。參考：[MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)、[MDN VisualViewport.scale](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport/scale)、[viewport metadata](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport)。手機瀏覽器對viewport metadata可能有差異，真機仍需驗收。

### b6.6 獲得手牌詳情與接續契約

獲卡背景是獨立的關閉意圖：MOONSHINE.input.actions 依 LUNAR 提供的 `cards.detailBackdrop` 角色及 source handle，呼叫 `api.moonshine.cards.dismissPopup(key)`，不經正文的點擊補完監聽。卡內文字／圖像點擊與捲動不關閉；story 捕獲排除卡牌彈窗。LUNAR 驗證 mobile、來源 connected、scope／passage、頂層、armed／leaving 與一次關閉，僅觸發原生 backdrop listener；原版仍擁有獲卡、音效、淡出後的 onDone、順序獎勵及下一段／導航。MOONSHINE 播放原有自有淡出，不新增 absolute 補位或重寫獲卡邏輯。

ACTIONS snapshot 的 `pendingCardReceipt`／ready 表示原生接續仍在等待卡牌確認。MOONSHINE 保留 followup 意圖，不能在這個空窗重新暫停原生 arming／接續；有新正文返回閱讀，只有下一组選項直接更新 ACTIONS。Encounter 已 `display:none`／hidden 的舊選項不再被轉接；結果 `enc-continue` 納入語意動作。初次升級的灰色離開 gate 保留原契約，不把原生隱藏當成普遍刪除規則。

回歸：`tests/test_b66_card_receipt_live.cjs`；檢查背景與正文事件衝突、卡內保護、開場防誤觸／過期與重複關閉、原生一次回呼、連續卡牌、乳酪2/4手牌、下一段／下一組選項、關閉動畫節點身份及 desktop 委派。測試為 Chrome 手機 viewport，真機仍需驗收。

## SYNODIC b6.5 — Performance stabilization

本輪只處理 b6 已實測的 capture/render 放大、ACTIONS 動畫節點銷毀及 layout thrashing。按 snapshot reuse → rAF coalesce → 同場景 ACTIONS patch → 布局讀寫分階段逐步修改；每階段完成即跑原四模式、4× CPU、三輪 benchmark 並保存獨立數據，不能全部改完才測。另做 1× sanity，兩種限速絕對時間不混比。

目標為普通出牌完整 game.capture ≤2（同 revision 一次）、普通資料不換動畫節點、同一 frame 多領域只提交一次主要可見 patch、降低主執行緒 rAF stall；不是宣稱 60 FPS。JSON copy／通知／render／patch／ScriptDuration／max rAF／>4、8、16ms 工作必須保存，並檢查原生遊戲結果一致。

- api.sources 在 native revision／scope 內共用只讀交換快照，不暴露原生 singleton。同步讀取先收集待送達原生 MutationObserver 記錄，避免同一 task 的新 DOM 被舊快取遮住。game.refresh 保守檢查輸入是否真的變更，再 capture／normalize／寫 buffer；兼容輸入 fingerprint 仍有成本，不冒充完整 delta framework。
- MOONSHINE_RUNTIME.refresh／flush 均排入 rAF；flush 返回提交完成的 Promise，測試或需要讀取新畫面的操作應 await，不新增同步 visible render 旁路。dirty domains 在待提交批次合併；原生結果與 callback 仍同步處理，只有顯示提交排程。
- 普通 ACTIONS 屬性／價碼／餘額在原 row／offer 就地更新；scene、action id／類別或 upgrade group 身份改變才視為结构替換。交易完成改變卡片集合時只替換相應 grid，保留 accordion row／controller；來源未變的文字保留翻譯包裝。
- catalog.patch／workspace.update 延後 scroll 寫入至子樹寫入完成，未變來源不讀寫 scroll。fit／symbols／HUD 按批次量測及回寫，尺寸只在同一有效量測批次共用，樣式變更後不能沿用失效幾何。
- 本輪不引入 framework／virtual DOM／大型 manager、不改原生 fill-wipe、不拓展 MOD reactive API，不追擊新次要瓶頸。150ms HUD ticker 留待後續。

工具：tests/test_b6_performance_live.cjs、tests/test_b65_stabilization_live.cjs。PERF_OUTPUT 指定每階段輸出目录；PERF_IDENTITY_REQUIRED=1 強制動畫節點身份驗收。stage 生成 HTML 和數據保存在 builds/performance-b6.5/ 及 builds/，最终生成檔為 builds/STG 0.2m-b6.5.html（私人包加 .hecate）。API 發行版／schema 不因構建標籤 b6.5 自動變動。詳細 before/after 維護於 diagnostics/。

## 後續開發側重

### 硬性性能要求（2026-10-02）

LUNAR 不負責動畫、不以 frame rate 輪詢、不全量重建狀態、不直接碰大量 DOM。MOONSHINE 動畫走 requestAnimationFrame／CSS compositor，資料更新採 batch，正在動畫的 DOM／父節點不因普通 state refresh 被重建。新工作必須沿用 bridge／buffer／API 與 presentation／input 邊界；不得將其改為一個 God Object。accordion 高度等不可只靠 compositor 的布局動畫須有量測和範圍限制，不用「用了 Web Animations」等同「不耗主執行緒」。幾何讀／樣式寫分階段。

目前全量來源擷取、快照、HUD 兼容輪詢及 ACTIONS 整板重建需按診斷證據分批處理；這是既有技術債，不表示本次已修好，也不授權新增同類路徑。先定位瓶頸，最小修正順序為 batch/coalesce → delta update → 保留動畫 DOM → rAF 合併視覺提交 → 避免 forced layout。禁止先做架構重寫或直接修本體。

性能診斷用 tests/test_b6_performance_live.cjs 與 tests/helpers/performance-probe.cjs：在測試端將計時 wrapper 加入注入腳本副本，正常模式保留返回值／異常／原時序；A/B 只在明確開啟的測試模式生效。普通 HTML、modules.json 與正式 CJS 均無 probe／門控。每次報告記錄操作、CPU 限速、remote assets、inclusive 計時、>4／8／16ms 工作、通知／擷取／render／patch 次數、動畫節點身份及未插樁對照，不能把 rAF 排程間隔當成合成器 FPS。輸出在 builds/performance-b6/，整理後的結論在 diagnostics/。

- 先完成核心邊界；不替原版全面重構。原版技術債只有妨礙 LUNAR 的穩定接口時才考慮最小處理，額外本體修復仍先詢問使用者。
- LUNAR 是擴展與原版的唯一交互邊界；標準 API 避免暴露原版資料形狀。本體更新先改 adapter／bridge，不把原版 DOM／singleton／內部變量依賴擴散到 UI 或 MOD。
- buffer 只保存顯示時序、翻譯、動畫、交互需要的副本和待呈現內容，不成為第二套遊戲狀態。
- 文本以可翻譯 DOM 為最終目標：LUNAR 提供原始／標準化文本，MOONSHINE 用正常 DOM 文字和富文字呈現，供瀏覽器內建翻譯識別。JS 字串僅作中間格式；目前不宣稱所有画面已通過翻譯驗收。
- CJS 按元件／功能及層級分類，CSS 暫時維持現行統一樣式文件結構，待元件邊界穩定再決定是否拆分；不保留歸屬不明的舊命名。
- HECATE 的卡牌／玩家／敵人／效果／鎖血／劇情條件等是獨立 MOD 的開發方向；現有 Restore HP 不代表其他能力已完成。

## b6 段落淡入與瀏覽器翻譯契約（2026-10-01）

本節取代下方歷史條目中的手機逐字演出方式；原版桌面仍委派原生逐字函式。LUNAR 攔截既有敘事入口後一次保存／交付完整富文字，維持來源節點與完成回呼的兼容狀態，不建立字元 interval、不生成 tw-c 或游標。`api.moonshine.story.read()` 回傳 id／paragraphId、完整 html、channel、scope、language、translatable、presentation、hasNarrative 和 complete 的副本；`story.complete(id)` 由 bridge 驗證當前節點、scope、暫停及已完成狀態，再執行一次原生完成回呼。buffer 仍無命令能力；場景或段落被替代時，舊完成命令失效。空正文不等待不可見動畫，沿用 ACTIONS 直接接續。

MOONSHINE component.prose 將完整文本組成普通 DOM 段落，保留富文字、單換行、空行及原有版面；支持 p／div 等區塊和含富文字的雙 br 分段。animation.prose 只對段落 opacity 做 280ms 淡入，相鄰段落延後 80ms，延後最多 480ms，不逐字更改正文、不用 canvas 畫字或新 absolute 定位。淡入期間 ACTIONS 尚未點亮；點屏幕只補完當段並吞掉此點擊。HUD／菜單暫停時凍結淡入，恢復後繼續；縮減動態直接顯示，離場／替代／切 desktop 清理動畫。完成和真正呈現分開確認，舊段落不重跑效果。

翻譯適配：可見正文及 UI 根用 translate=yes，來源語言由 LUNAR 保留，不因翻譯器改 html.lang 而把新原文誤標成目標語言；單色符號／純數值用 translate=no。隱藏原版來源只作資料／回呼兼容端，標記 translate=no，LUNAR 擷取時不把這個暫時抑制標記傳到可見端，桌面還原原属性。可見根是正常 document DOM；私有 Shadow workspace 不是玩家文本的最終載體。

通用 catalog.patch 記錄上次來源文字、屬性和子樹；只有來源改變才更新相應部分，不拿翻譯後的 DOM 與原文反覆比對／重建。HUD 更新、resize、字體／UI 刷新不覆寫翻譯器修改的文字或包裝節點，翻譯結果不回寫 LUNAR 或遊戲。新劇情確實改變時才用新來源重建。動畫不以文字長度或翻譯後内容決定完成回呼，不更改正文內容；ACTION 商店抬頭也只在來源名字改變時更新。

驗證：tests/test_b6_prose_translation_live.cjs 模擬翻譯文字及 FONT 包裝，檢查淡入／暫停／完成／刷新後保留、來源副本不被污染、新段落替換、nested 富文字、縮減動態、空段落和 desktop 原生委派；搭配 story、actions、followup、pause、架構／buffer／注入測試。這是 DOM 兼容及動畫行為驗證，不冒充 Chrome／Safari 翻譯服務或 Android／iOS 真機實測。HTML 翻譯標記參考 [MDN translate](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/translate)。

新核心變更記錄寫入 Dev_log.md 的 **SYNODIC b6.6** 標題；舊 STG 0.2m-b6 記錄保留為歷史。

## 尺寸與版面契約

以 1080×1920／9:16 的直向概念圖設計；這是比例參考，不是要求瀏覽器固定成 1080 CSS 像素。手機同寬而變長時，優先把額外高度交給可捲動內容區，維持控制項及文字的寬度尺度。不要把整張 9:16 畫面拉長，也不要把返回按鈕放進內容清單內。

主要驗證：Chrome 400×760 CSS viewport；另驗 360×640（9:16）、360×800（9:20）、360×780（A35 實體比例）。Samsung A35 的 1080×2340 是實體解析度；瀏覽器工具列、DPR、系統顯示縮放會改變實際 CSS 可視高度。360×780 只是比例測試，不能宣稱等同真機可用範圍。

`moonshine/moonshine.view.game_chrome.cjs:updateMode` 讀取 `visualViewport.height`（無此 API 則用 `innerHeight`），寫入 `--stg-mobile-vh`。Settings 使用 `auto auto minmax(0,1fr) auto`；Compendium 使用 `auto auto auto minmax(0,1fr) auto`。中間區域可捲動，底部 Back 是獨立列。Compendium 三頁共用同一 shell/panel，不依清單長度決定整頁高度。

主頁 Settings 的頂部仍保留原設計的 `8vh` 留白。直向手機主選單的標題／副標題保留較寬鬆的頂部空間；整組按鈕以畫面垂直中線定位，新玩家五項與回歸玩家七項共用同一中心，毋須個別的固定上方間距。背景仍是遊戲原生圖片。主選單出現時移除外層 `#story` margin 與 passage padding，避免全高選單外再多出可捲動空白；高度不超過 540px 的短螢幕讓按鈕回到正常排版，內容確實超出時由 `#stg-menu-root` 捲動。卡牌詳情是定比例卡面、底部文字區捲動，不能直接套用清單頁的伸長規則。

## 模組與載入順序

`modules.json` 是唯一載入清單：LUNAR store／pure adapters／buffer → 原生 bridge／pause／資源 → api → MOONSHINE 元件／動畫／workspace／views → runtime／input。LUNAR 與 MOONSHINE 必須一起注入。一般／公開版完全不載入 HECATE 或專用 API／UI／樣式；私人 `--hecate` 包在目錄及所有附屬文件完整時，追加 lunar.api.hecate 和 MOD command／panel／CSS，缺席或缺檔則整組跳過。通用 MOONSHINE 元件仍屬核心；重注入公開版會移除舊 MOD 注入。公開源碼發布不包含 MOD 本體及專屬文件。文件或測試不得另列已撤除的舊 JS。

結構大轉移完成後，必須移除所有已被替代或不再使用的 CJS 實作，不留停用副本。以 modules.json（包含可選 HECATE）核對正式源檔，清理失效引用；現行回歸測試與被引用的測試工具保留為開發資源。舊檔案只可在歷史開發紀錄中提及，不能作為另一套開發入口。

注入器去掉既有具名注入區塊後按清單重建；原生核心不變、重複注入結果一致、CSS 和 CJS 標記分開。`story_text_tool.py` 是離線文字工具。

## b6 前台入口、初次升級分支與 accordion（2026-10-02）

LUNAR bridge.actions 在初次 group 保存 entryActions 的標準 id／文字／category／disabled／role；確認升級後原生已領取狀態會讓對話重繪走向實驗室重訪，bridge 必須以初次入口資料保留 Explore Arc／Explore Lab／Embark，排除錯誤的 Return to Lab。真正從 Lab 返回的聊天不帶初次 group，保留合法原生出口。執行檢查場景、完成狀態與節點壽命，升級不重複套用；buffer 只存資料。Lab 的 .lab-overlay 也在 native bridge 擷取清單中，MOONSHINE catalog 組裝自有 dialog，Arc 選單／Vent 確認仍委派原生回呼。

MOONSHINE Mods 入口只有主菜單位於前台才顯示；其自有根有可見 dialog 時隱藏／停用，面板關閉後恢復。mainMenu 資料不代表背後主菜單仍在就可覆蓋 Load／Compendium／Credits；LUNAR 不介入下游畫面判斷。自有 DOM 觀察補足資料通知和介面建立的先後差異，Settings／遊戲場景／desktop 移除入口。

accordion 先淡出，兩張卡的收合／展開高度同時演出，再淡入。高度是局部 CSS 單位；自然高度量測後立即恢復起始盒與捲動位置，避免動畫前縮短 scrollHeight 強制跳位。菜單更新／關閉呼叫 controller.destroy 取消動畫、等待和暫時高度／scroll anchoring，不碰翻譯文字。新增 initial_actions_live、accordion_live、mods_foreground_live 為本節的流程／幾何回歸；實際手機 FPS 仍由真機驗收。

## 分層後的驗證入口

每次變更依範圍執行相關檢查；下方 b5 目錄保留歷史搜尋入口，不能把舊原生 DOM 斷言當作新呈現契約。現行實際畫面測試使用 tests/helpers/moonshine-test-ui.cjs 定位 MOONSHINE 自有元件；只有驗證橋接和來源保留時才查原生節點。

| 範圍 | 現行測試 |
| --- | --- |
| 依賴邊界、純資料緩衝、標準副本、樣式別名 | tests/test_architecture.cjs、tests/test_moonshine_buffer.cjs |
| 注入冪等、順序、核心不變、可選插件移除 | tests/test_inject.py |
| 自有 DOM、來源未加工、真實商店穩定價格、待顯示內容、桌面還原 | tests/test_moonshine_live.cjs |
| 圖片比例與禁止原尺寸請求 | tests/test_moonshine_assets_live.cjs |
| 可選修改器 API、操作隔離、暫停與解除 | tests/test_hecate_live.cjs（需 --hecate 測試包） |
| ACTIONS／選卡／交易、聊天／探索、Options、暫停與 BGM、HUD／字形、牌堆 | tests/test_b6_actions_live.cjs、tests/test_b6_story_live.cjs、tests/test_b6_options_live.cjs、tests/test_b6_pause_live.cjs、tests/test_b6_top_hud_live.cjs、tests/test_b6_hud_fit_live.cjs、tests/test_b6_deck_live.cjs |
| 原生功能轉接與布局 | tests/test_character_select_live.cjs、tests/test_mobile_layout.cjs、tests/test_mobile_card_detail.cjs、tests/test_b5_saves.cjs、tests/test_b5_tall_panels.cjs、tests/test_b67_combat_flow.cjs、tests/test_factory_reset.cjs |

使用 builds/ 中的 b6 pending 測試檔；tests/helpers/synodic-test-paths.cjs 統一解析生成檔與外部輸入。部分歷史腳本預設指向 b5，應設定 STG_TEST_HTML=.STG 0.2m-b6.pending.html，也可傳入項目相對路徑或絕對路徑。瀏覽器比例檢查不替代真機驗收。HECATE 現階段只實作 Restore HP 與接口骨架。

## 原生開發地圖的閱讀範圍

以下 PC／b5 對照仍記錄原生接口、來源 DOM 別名及舊介面算法，供 **LUNAR 維護者** 查找來源。表格中裝飾、搬移、重排、renderer 等顯示動作，現階段全部在 MOONSHINE 自有 workspace／元件樹上執行，不是在原生 DOM 上操作；遊戲資料和動作必須經 LUNAR 轉接。不要把原生入口名稱視為 MOONSHINE 可直接呼叫的全域函式。

## PC 與現用手機遊戲接口對照

早期靜態比對 PC 與 b2 的 `window.stg… = function` 宣告，各有 835 個唯一名稱，名稱集合一致。這只證明這種宣告形式的接口名稱一致，**不代表函式內容、資料或兩份遊戲相同**。本輪以 b5 為 b6 輸入，測試確認去掉手機注入區塊後與輸入核心一致。

| 畫面／入口 | PC 行為與 DOM | 現用手機接法 | 遊戲仍擁有的部分 |
| --- | --- | --- | --- |
| 主選單：`stgMenuBoot` | 依 `stgHasAnySave()` 建立新玩家／回歸玩家按鈕、背景、標題、版本號 | `moonshine/moonshine.view.main_menu.cjs` 裝飾原生按鈕文字及手機樣式；接回 LUNAR 動作識別，直向手機補償 HTML zoom；切回 desktop 還原原文案 | 存檔判斷、按鈕行為、背景圖片與版本字串 |
| 主頁 Settings：`stgOpenSettings` | 重建 `#stg-menu-root`；`stgRenderSettingsFlyoutInner({menu:true})` 產生原生控制項 | hook；保留 `.menu-bg` 節點，追加 `.stg-mobile-settings-ui`，隱藏原控制項 | 設定值、持久化、全螢幕 API |
| 返回主頁：`stgMenuBoot` | 重建主頁 | UI 淡出後呼叫原函式，重新使用既有背景 | 主頁建立與遊戲導航 |
| 圖鑑：`stgOpenCompendium` / `stgRenderCompendium` / `stgCloseCompendium` | `#stg-compendium`；分頁按鈕、原生目錄 | 手機 renderer 取代內容；三頁循環、相同 shell、Back 固定 | 開關 overlay、頁面滾動鎖 |
| 存讀檔：`stgOpenSlotPicker(mode)`／`stgCloseSlotPicker` | `#stg-slot-picker`、三個原生手動槽，`STG_SAVE_SLOT_COUNT` | `moonshine/moonshine.view.saves.cjs` 隱藏但保留 LUNAR 來源資料，展示 Auto Save＋手動槽的單列摺疊清單；手動操作點原按鈕；桌面還原原生 modal | `stgReadSaveSlot`、`stgWriteSaveSlot`、`stgDeleteSaveSlot`、`stgImportToSlot`、`stgExportSaveSlot`、`stgShowPromptModal` 的資料、確認和回呼 |
| 滾動 Auto Save | 原生 `stgWriteAutosave`／`stgReadAutosave`；`stgMapBoot`、`stgStomachMapBoot` 到達地圖時寫 `stg_save_auto` | 只顯示及提供 Auto Save 載入／匯出；`setAutosaveNotice(callback)` 預留往後提示，預設不顯示 | 原生安全時點、序列化、版本與獨立鍵；設定 RE 恢復出廠清除它 |
| 圖鑑資料 | `stgBuildCardCatalog`、`STG_CARD_TEMPLATES`、`stgBuildConditionCatalog`、`STG_BOONS` | 建單次快照，篩選後寫 `_stgCompCatalog` 索引 | 卡牌/升級內容、已發現狀態 |
| 解鎖 | `stgCompTryUnlockCards`、`stgCardsAdminUnlocked`、`stgLoadSeenCards` | MOONSHINE 自有 password 窗口，經 compendium.unlockCards 提交；結果沿用瀏覽器 alert；全解鎖 U 綠色停用 | 密碼判斷及解鎖記錄 |
| 重設：`stgResetCompendium` | PC 只清 seen 記錄 | 手機確認後同時移除 seen/admin 記錄，清本地篩選；desktop 委派原函式 | 原生 key 常數、原生 toast |
| 恢復出廠：Settings → RE | PC 無此總重設入口 | 手機確認後清遊戲自有 `stg_` 資料與 SugarCube 故事儲存，再重新載入 | 原生年齡確認、開發者警告與遊戲初始設定在新頁面重新啟動 |
| 預覽：`stgShowCardView(idx)` | 從 `_stgCompCatalog` 建 `.stg-card-popup-scrim` | 觀察新增 scrim，移動既有卡面節點 | 描述 HTML、卡片來源、關閉行為 |
| 獲卡：`stgShowCardGainedPopup(card,onDone,count)` | 原生彈窗、音效、完成回呼 | 共用同一詳情適配器，不重新實作獲卡流程 | `onDone`、音效、牌組變更 |
| 遊戲內設定：`stgToggleSettingsFlyout` | `#stg-settings-fly` | `moonshine/moonshine.view.game_chrome.cjs:optimizeMobileSettings` | 與主頁 Settings 不同生命週期，勿誤合併 |
| 掃描：`stgShowScanOverlay` | `#stg-scan-overlay` | `optimizeMobileScan` | 掃描資料與回呼 |
| 圖像查看：`stgToggleViewArt`、戰鬥 overlay | 原生顯示／關閉 | 手機 CG 平移縮放、戰鬥圖像按鈕 | 不可用戰鬥 overlay 的完成回呼關閉純看圖，會推進戰鬥 |
| 縮放：`stgApplyZoom` | 縮放 html | 手機 guard 限制 zoom；手機面板反向補償 | desktop 切回時恢復原縮放 |

### b5 原生對話框接口

| 入口與原生節點 | 手機呈現 | 必須保留 |
| --- | --- | --- |
| `stgMaybeShowFullscreenPrompt` → `#stg-fs-prompt` | 純深色全屏遮罩、中央紫色圓角框、標題／正文／兩個並排膠囊按鈕；可見文案為 Enter Full Screen?、Yes, Fullscreen、No, Thanks | 原生全螢幕請求和視窗模式選擇回呼 |
| `stgShowConfirmModal(opts)`／`stgShowAlertModal(opts)` → `#stg-confirm-modal` | 背景暗化；長標題縮字；短正文居中於標題與按鈕之間，長正文在界內捲動 | 原始 `opts` 文字／HTML、按鈕及確認／取消／關閉回呼；Settings RE 總重設仍走此入口 |
| `stgShowConsentOverlay` → `#stg-consent-overlay` | 滿高紅色年齡確認框，原有警告節點移入中間獨立捲動區；頂部 18+ Age Consent，底部記住選項與 Consent／Decline 圓角按鈕 | 原警告的色彩／粗體／斜體、原生核准／拒絕函式、`stg_consent_v1` 儲存規則 |
| `stgOpenCredits` → `#stg-credits` | 紫色滿高框、固定 Credits 標題及底部 Close；中間原始鳴謝內容獨立捲動，普通文字 HSL(260,45%,69%) | 全部鳴謝內容、特殊文字顏色、粗體／斜體、原生關閉按鈕與回呼 |
| `stgShowDevMenu` → `#stg-dev-menu` | 共用滿高框；79 個既有測試按鈕改成彩色外框膠囊，移除 U0001F41E／🐞 字樣；標籤最多兩行並整組雙向居中 | 原生分類、順序、全部按鈕及 onclick；`stgOpenDevMenu` 仍負責初次進入警告，不能繞過 |

以上介面均由 `moonshine/moonshine.view.dialogs.cjs` 在 LUNAR 回傳後組裝自有 DOM，使用 `STG_MOBILE_UI.syncZoom` 抵消原始 HTML 縮放；切回桌面模式會恢復原始節點、文案與 zoom。年齡同意書手機版「Remember My Choice」預設未勾選，勾選後才依原生流程記住同意。按鈕文字在水平與垂直方向均對齊按鈕中心，需在 400×760、360×640、360×800 等尺寸驗證。

Credits／Dev Features 共用 `tallPanel`／`restoreTallPanel` 與 `.stg-mobile-tall-*` 樣式：`auto minmax(0,1fr) auto` 三列，原有右上關閉按鈕移到最後一列並改為 Close，原生動作經 LUNAR 轉接，正文以普通資料在自有節點呈現。桌面模式還原原始文案和節點位置。Credits 只對自有來源格式中的普通色 `#e8d6ee` 的文字節點套新顏色，不改寫正文 HTML，也不覆蓋其內的特殊色彩。

Dev Features 前四類依渲染圖配色：Logic Route `#f4d975`、Gilly `#628063`、Avery `#508ab5`、Avery’s Stomach `#d55eb9`；從 Card Testing 起（包括後續分類）固定 `hsl(260,45%,69%)`。括號補充文字另起一行；`fitDevLabels` 按實際行高縮字，僅在面板寬度／viewport 改變或字體載入完成後重新量測。新增分類或改文案時，需確認沒有刪除原有功能，文字不超過兩行、按鈕置中，底部 Close 不隨清單捲動。

設定控制項直接呼叫 `stgSetVolumeMusic/Sfx`、`stgSetMuteMusic/Sfx`、`stgToggleMute`、`stgSetBgiGradient`、`stgSetEncPanelOpacity`、`stgSetProseScale`、`stgSetTextWidth`、`stgSetTooltipKind`、`stgSetBannerCondensed`、`stgSetScreenFxEnabled` 等原生 API。新增設定先找原生 setter，不另存一份同名 localStorage 值。

<a id="b5-ui-catalog"></a>

## b5 UI 元件目錄（依功能與結構分類）

本目錄於 2026-09-26 靜態核對本目錄執行期 JS、`moonshine/moonshine.view.source_styles.css`、注入器及 b5 原生接口。涵蓋目前手機層已建立或適配的元件；原生遊戲中尚未重新設計的畫面列為搜尋入口，不宣稱已完成。這次只整理文件，以下測試是後續修改時的回歸入口，不代表本次重新跑過全部遊戲流程。

**使用宗旨：已知範圍內，快速找到可重用樣本並做出穩定成品；全新物件，快速鎖定應讀的原生區域。目錄不能代替必要的原生程式閱讀。** 新畫面仍須追查資料來源、事件／回呼、遊戲狀態、重繪及關閉流程，尤其是戰鬥、存檔和劇情跳轉；已有樣本也不能只複製外觀而漏掉這些契約。

分類直達：[共用支援與容器](#b5-ui-foundations) · [通知與同意](#b5-ui-notifications) · [交互控制](#b5-ui-controls) · [顯示與複合元件](#b5-ui-displays) · [劇情流程](#b5-ui-flow) · [維護與擴充](#b5-ui-maintenance)

### 快速選型與狀態標記

| 想做的 UI | 先找哪一組 | 再讀哪個擁有者 |
| --- | --- | --- |
| 警告、同意、全螢幕提示 | N01／N02 | `moonshine/moonshine.view.dialogs.cjs` 與原生 `stgShow…` 函式 |
| 固定標題、內容捲動、底部 Close／Back | B02；內容用 D04／D05 | 原頁面的建立／關閉流程 |
| 按鈕、開關、滑塊、分頁、輸入 | I01–I07 | Settings 或 Compendium 對應事件處理器 |
| 瀏覽牌表、純文字卡、卡牌詳情 | D01–D03；抬頭用 D06 | 原生目錄資料／卡牌彈窗 |
| 圖片平移縮放、角色輪播 | D07／D08 | `moonshine/moonshine.view.game_chrome.cjs` 與原生角色選取／看圖流程 |
| 掃描、冒險分支、HUD／戰鬥 | D09–D12 | 該列原生搜尋入口，先確認遊戲進行方式 |
| 劇情防誤觸、逐段呈現、選項出現 | F01／F02 | 原生打字、分段、選項、導航流程；尚無完成的新流程模組 |

狀態採用「**已建樣本**」「**局部適配**」「**原生沿用**」「**待設計**」。已建樣本表示 b5 已有實際使用位置，**不等於通用 API，也不等於已覆蓋所有遊戲情境**。局部適配表示目前主要調整版面、觸控或少數控制；後續仍可整體重設計。待設計項目保留固定編號，實作後更新同一列。

相同功能及結構歸在同一組，顏色、圓角、單／雙行、危險色是變體。例如確認框的紫色與年齡框的紅色不能單憑色彩分成兩套按鈕系統；但單次確認與帶持久化選項的長同意書仍有不同容器／狀態契約。**同組不表示現有程式已共用同一個建構函式。**

下列 `檔案:函式` 是可搜尋的程式錨點，CSS 錨點全部位於 [moonshine/moonshine.view.source_styles.css](moonshine/moonshine.view.source_styles.css)。優先搜尋函式／選擇器，不依賴生成 HTML 中會變動的行號。標示「局部」的函式封閉於 IIFE，不能用 `window.slider()`、`window.tallPanel()` 等方式呼叫；在原模組內擴充，或在出現第二個實際用途時連同生命週期抽出。

<a id="b5-ui-foundations"></a>

### B．共用支援與容器骨架

| 編號／組件 | 可搜尋入口／接口範圍 | 重用契約 |
| --- | --- | --- |
| B01 模式、安全區、縮放及生命週期 | [display-config.js](display-config.js)：公開 `STG_DISPLAY_CONFIG.detectMode()`／`setMode(mode)`；[moonshine/moonshine.view.game_chrome.cjs](moonshine/moonshine.view.game_chrome.cjs)：局部 `updateMode`、`optimizeMobileWidgets`、`scheduleUpdate`、`cleanupMobileChrome`；CSS `--stg-mobile-vh`、`--stg-mobile-pad-*` | 新面板服從手機模式與可視高度；b5 主選單／對話框以 `.stg-mobile-portrait` 為條件，其他舊適配可能涵蓋橫向。`STG_MOBILE_MAIN_MENU`、`STG_MOBILE_DIALOGS`、`STG_MOBILE_SETTINGS`、`STG_MOBILE_COMPENDIUM`、`STG_MOBILE_SAVES`、`STG_MOBILE_UPGRADES` 各公開 `mount/cleanup`，由此生命週期協調，不能每次 render 重複安裝 hook。 |
| B02 固定頭尾＋獨立捲動內容（已建樣本） | [moonshine/moonshine.view.dialogs.cjs](moonshine/moonshine.view.dialogs.cjs)：局部 `tallPanel`／`restoreTallPanel`，`.stg-mobile-tall-*`；[moonshine/moonshine.view.settings.cjs](moonshine/moonshine.view.settings.cjs)：`mount`／`render`，`.stg-mobile-settings-ui`／`.stg-ms-panel`；[moonshine/moonshine.view.compendium.cjs](moonshine/moonshine.view.compendium.cjs)：`render`，`.stg-mc-shell`／`.stg-mc-panel`／`.stg-mc-scroll` | Credits／Dev 真正共用同一個 tallPanel；Settings／Compendium 是相同布局模式的不同實作。中段 `minmax(0,1fr)`、`min-height:0`；只讓內容捲動，頭尾保留。不能把其伸長規則套到定比例詳情卡 D03。 |
| B03 共用色表（公開 API） | [moonshine/moonshine.component.theme.cjs](moonshine/moonshine.component.theme.cjs)：`STG_MOBILE_UI.families`／`familyColors` | 十家族 id／label／color 單一來源。`STG_MOBILE_CARD_FAMILY_COLORS` 是相容別名；新增卡面沿用，勿另複製色表。Dev 分類色是 D05 的另一種資料語意。 |
| B04 zoom 補償與動畫收尾（公開 API） | `moonshine/moonshine.component.theme.cjs`：`STG_MOBILE_UI.syncZoom(element)`、`afterAnimation(element, callback, timeout=250)` | 前者只在值變更時寫 style；需自行保存／還原舊 zoom。後者忽略子節點 animationend、只完成一次並清 listener／timeout；callback 仍需確認節點連線及模式。Settings `returnToMenu`／`installMenuHook` 是完整轉場樣本。 |
| B05 卡圖資源（公開 API） | `display-config.js`：`STG_DISPLAY_CONFIG.wixCardVariantUrl`、`wixCardImageUrl`、`wixCardDetailImageUrl`；載入端 `moonshine/moonshine.component.card_thumbnail.cjs:resource`（`api.moonshine.cards.art`）、`moonshine/moonshine.view.card_detail.cjs:loadArtwork` | 所有卡牌圖 30% 是 CSS 顯示尺寸×DPR 的請求像素比例；各自 URL，失敗不回原圖。詳情 alpha 留邊處理由 D03 負責。這不是所有 CG 的通用壓縮器。 |
| B06 文字、縮字與水印（已建局部樣本） | CSS `--stg-mobile-font`、`moonshine.main_menu_watermark.toml`／自有 view.main_menu_watermark；`moonshine/moonshine.view.card_detail.cjs:fitTitle`；`moonshine/moonshine.view.dialogs.cjs:fitDevLabels`、`.stg-mobile-confirm-long-title` | 詳情標題單行、Dev 標籤兩行、確認框長標題 CSS 縮字是不同策略；尚無統一文字量測 API。保留富文字節點，水印不可攔截觸控。字體未全部落實新規範，見下方「字體規範」的實作狀態。 |
| B07 按需 Noto Emoji（公開 API） | `moonshine/moonshine.component.theme.cjs`：`STG_MOBILE_UI.loadNotoEmoji()` → Promise<boolean>；首次符合閃電條件時由 `moonshine/moonshine.view.card_detail.cjs:enhance` 呼叫 | 先以 FontFace 載入本機 Noto Emoji 400；缺少才加入一次 Google Fonts CSS API 請求，並載入閃電所需字形。共用同一 Promise，成功為 true、失敗為 false 並沿用 CSS fallback；不改遊戲狀態。新符號可共用此載入入口，不重複插入 stylesheet。 |
| B08 按需 Noto Sans（公開 API） | `moonshine/moonshine.component.theme.cjs`：`STG_MOBILE_UI.loadNotoSans()` → Promise<boolean>；`moonshine/moonshine.view.saves.cjs:render` 呼叫 | 優先載入本機 Noto Sans 400；缺少才加入一次 Google Fonts CSS API（400／500／600／700），供存檔頁一般文字與重命名提示使用。共用 Promise，失敗保留 CSS fallback；不代表整個手機 UI 已切換為 Noto Sans。 |

<a id="b5-ui-notifications"></a>

### N．通知、警告與同意

| 編號／狀態／組件 | 樣本、程式與 CSS 錨點 | 原生接口、狀態與關閉責任 |
| --- | --- | --- |
| N01 已建樣本：短／長正文確認框、單按鈕通知、全螢幕邀請 | `moonshine/moonshine.view.dialogs.cjs:confirm`／`fullscreen`（局部）；`.stg-mobile-confirm-card`、`-title`、`-body`、`-copy`、`-actions`；`.stg-mobile-fs-dialog` 下 `.stg-fs-card` | 原生 `stgShowConfirmModal(opts)`／`stgShowAlertModal(opts)` → `#stg-confirm-modal`；`stgMaybeShowFullscreenPrompt` → `#stg-fs-prompt`。保留原按鈕及 callbacks；短正文置中，長正文界內捲動。全螢幕用純深色全屏遮罩，一般確認暗化後方內容。不是 Compendium 的草稿表單。 |
| N02 已建樣本：長篇同意書＋記住選項 | `moonshine/moonshine.view.dialogs.cjs:age`（局部）；`.stg-mobile-age-dialog`、`.stg-mobile-age-copy`、`.stg-consent-remember`、`.stg-consent-actions` | `stgShowConsentOverlay` → `#stg-consent-overlay`。移動自有警告資料節點、保留特殊格式；頭尾固定。核准／拒絕及 `stg_consent_v1` 仍由原生處理；remember 首次手機顯示未勾選，切模式不重設當次選擇。布林控制見 I03，按鈕見 I01。 |
| N03 局部適配：首次操作教學 | `moonshine/moonshine.view.game_chrome.cjs:addMobileTutorialNote`；`.stg-scan-tutorial`、`.stg-portrait-tut`、`.stg-mobile-tutorial-note`、`.stg-mobile-desktop-hint` | 保留原生教學與關閉按鈕，隱藏桌面拖拉提示，補手機說明；內容可捲動、Close 不被裁掉。首次顯示／已讀記錄仍需讀各原生教學入口，不可視為通用 b5 同意書。 |
| N04 原生沿用／局部定位：toast、解鎖結果及 tooltip | CSS `.stg-save-toast`／`.stg-rescale-toast`；`moonshine/moonshine.view.compendium.cjs:browserAlert`；Settings 的 tooltip 選項 | 原生 `stgFlashSaveToast`／`stgRsToast`；解鎖結果優先使用 `_stgNativeAlert`。手機層僅局部調 toast 位置／層級，未建立通用新 toast 或 tooltip renderer；不要以 N01 的存在推論所有通知已統一。 |

回歸入口：[tests/test_b5_dialogs.cjs](tests/test_b5_dialogs.cjs)、[tests/test_factory_reset.cjs](tests/test_factory_reset.cjs)、[tests/test_story_scan.cjs](tests/test_story_scan.cjs)。N04 缺少獨立的完整提示元件測試，改它時需覆蓋實際來源。

<a id="b5-ui-controls"></a>

### I．交互控制（外觀變體放在同組）

| 編號／組件 | 已有樣本與可搜尋入口 | 結構、事件及重用界線 |
| --- | --- | --- |
| I01 動作按鈕：膠囊、圓形、文字／符號、單／雙行 | `moonshine/moonshine.view.settings.cjs:action` → `.stg-ms-action`／`--danger`；`moonshine/moonshine.view.main_menu.cjs:decorate` → `.menu-btn[data-stg-mobile-menu-role]`；Compendium `.stg-mc-tool`、`-page-nav`、`-back`、`-done`；對話框 `.stg-consent-btn-label`、`.stg-mobile-dev-button`／`-label` | 已建各畫面變體，通用工廠見 MOONSHINE_COMPONENTS.create。主選單／b5 對話框裝飾原 button 並保留 LUNAR 動作接線；Settings／Compendium 新建 button 用 data 屬性委派事件。標籤區水平、垂直整組置中；disabled／aria-label 不能省略。危險色不自帶確認功能，要明確接 N01。 |
| I02 分段單選與滑動指示器 | `moonshine/moonshine.view.settings.cjs:segment`／`setSegment`／`handleChoice`；`.stg-ms-segment`、`-segment-indicator`、`--stg-ms-count`、`--stg-ms-index`；`moonshine/moonshine.view.compendium.cjs:showOptions` → `.stg-mc-sort` | 已建局部樣本；例如文字寬度三選一、排序三選一。Settings 每個 choice 是 button，以 aria-pressed＋index 更新，直接呼叫 setter；排序用相同 CSS，但 `draftSort` 到 Done 才套用。不是可拖動 range，不能只改滑塊位置而漏狀態。 |
| I03 布林選擇：OFF/ON、N/Y、記住選項 | Settings `segment` 的兩選項變體；Compendium `switchMarkup` → `.stg-mc-toggle[role=switch]`；年齡 `input[type=checkbox]` | 已建樣本，按布林用途歸一組，保留三種 DOM 結構。Settings 兩個按鈕即時生效；N/Y 是一個 button、aria-checked、只改草稿；Remember 是原生 checkbox，直到同意流程才決定是否持久化。不能只換視覺而互換事件語意。 |
| I04 連續滑塊＋數字讀值 | `moonshine/moonshine.view.settings.cjs:slider`／`onInput`；`.stg-ms-slider-group`、`input[data-range]`、`output[data-output]`；CSS 含 WebKit／Firefox track/thumb | 已建局部樣本：音量、背景漸層、文字框透明度、字級。傳入 min/max/step；input 即時更新讀值與原生 setter。各欄單位不同，例如音量／字級百分數轉比例，不能共用同一換算。原生 range 負責拖曳及鍵盤。 |
| I05 數值步進／自動／還原到合適尺寸 | Settings `.stg-ms-scale`／`-scale-actions`、`handleAction`；CG `moonshine/moonshine.view.game_chrome.cjs:changeMobileCgZoom`／`fitMobileCg`、`.stg-mobile-cg-controls` | 按鈕＋讀值的既有複合樣本。UI Scale 呼叫遊戲縮放接口；看圖的 −／FIT／＋只改 viewer 圖像尺寸及捲動中心。兩者都呈現縮放，但數值、限制與儲存責任不同，不可共用設定狀態。 |
| I06 頁面／項目選擇：滑動分頁條與循環箭頭 | Settings `tabs`／`render` → `.stg-ms-tabs`、`-tab`、`-tab-indicator`、`.stg-ms-panel`；Compendium `switchPage` → `.stg-mc-page-nav`；角色 `ensureCharacterCarousel` → `.stg-mobile-character-arrow`／`-count` | Settings 五分頁使用 tablist/tab/tabpanel、aria-selected 和 tabIndex；這些現有屬性不代表已實作完整方向鍵 tab 模式。Compendium 三頁循環；b6 角色箭頭循環選人、顯示 `n of total` 且牽涉鎖定狀態。共用「選擇目前頁／項」分類，不能複製角色選取回呼作普通分頁。 |
| I07 文字／密碼輸入＋提交／取消 | `moonshine/moonshine.component.text_prompt.cjs`；`view.compendium:showUnlock`；`LUNAR.api.moonshine.compendium.unlockCards` | b6.6圖鑑窗口直接自有DOM／標準password，12字上限，Enter／共用SVG確認，Cancel／Escape／焦點與背景隔離。無mask／hidden-workspace輸入中轉；提交才由LUNAR轉原生驗證。Save rename仍沿用既有原生prompt回呼和40字限制，僅共用符號／布局規格，未全面遷移其他prompt。 |
| I08 顯示／收合控制 | `moonshine/moonshine.view.game_chrome.cjs:updateMobileScanButton`／`optimizeMobileScan`；`.stg-mobile-scan-story-btn`、`.stg-scan-minimized` | 局部適配：SCAN ↑／STORY ↓／DONE·STORY ↓，依 minimized／完成狀態同步 aria-expanded；切回桌面恢復原 minimized。劇情原生折疊另見 F01，這不是通用 accordion API。 |
| I09 順序式摺疊卡動畫 | `moonshine/moonshine.view.saves.cjs:runCardTransitions`／`animateCardHeight`／`fadePause`；`.stg-msave-card--open`／`--selected`／`--revealed`；D14 | 已建局部樣本，尚非共用動畫 API。展開「高度完成→細節淡入」；收合「細節淡出→高度完成」；換選必須舊卡完全收合後才展開新卡。名稱位置／字號固定，只切顏色；內部操作在隱藏階段 inert；最後一次點選決定目標。套用變種時可借階段與狀態機，但需重新量測各自的展開高度、焦點、可操作時點、取消／重繪及減少動態效果。 |

I01–I06 主要回歸：[tests/test_mobile_settings.cjs](tests/test_mobile_settings.cjs)、[tests/test_mobile_main_menu.cjs](tests/test_mobile_main_menu.cjs)、[tests/test_mobile_compendium.cjs](tests/test_mobile_compendium.cjs)、[tests/test_b5_tall_panels.cjs](tests/test_b5_tall_panels.cjs)。I07 用 Compendium 測試；I08 用 Story/Scan 測試；I09 用 [tests/test_b5_saves.cjs](tests/test_b5_saves.cjs) 驗兩段動畫和換選順序。文字自適應需等字體及動畫穩定後驗證，長標籤不能只驗字串有出現。

<a id="b5-ui-displays"></a>

### D．顯示控制、內容面板與複合元件

| 編號／狀態／組件 | 樣本、程式與 CSS 錨點 | 資料來源／重用界線 |
| --- | --- | --- |
| D01 已建樣本：圖片卡縮略圖與牌表 | `lunar/lunar.bridge.cards.cjs:catalog`、`lunar/lunar.adapter.cards.cjs:thumbnail`；`moonshine/moonshine.component.card_thumbnail.cjs`／同名CSS；`selectedEntries`／`renderCards`；`.stg-mc-card-grid`保留為容器 | 使用原生 cards／conditions 目錄；每次 render 產生快照及 `_stgCompCatalog` 索引，點擊接 `stgShowCardView(index)`。鎖定卡為不可點的 `.stg-mc-card--locked`；無結果為 `.stg-mc-empty`。不把 renderer 的索引快取跨越重繪。 |
| D02 已建樣本：純文字內容卡 | `moonshine/moonshine.view.compendium.cjs:renderUpgrade`／`renderUpgrades`；`.stg-mc-upgrades`、`-upgrade`、`-upgrade-flavor` | `STG_BOONS`＋`STG_CARD_FLAVOR`；標題／正文／可選引言放一個 button。此列表輸出 escapeHtml；點擊仍由原生建立 Upgrade 預覽，再套 D03 的升級卡面變體。Encounters 頁目前只有 Coming Soon，不能當已有遭遇目錄。 |
| D03 已建樣本：詳情／獲卡大卡面 | [moonshine/moonshine.view.card_detail.cjs](moonshine/moonshine.view.card_detail.cjs)：局部 `enhance`／`restore`／`fitTitle`／`loadArtwork`／`fitVisibleArtwork`；`.stg-md-scrim`、`-card`、`-header`、`-title`、`-details`、`.card-art` | 自啟動 observer，無公開 `enhance` API；適配 `stgShowCardView`／`stgShowCardGainedPopup` 的原生 scrim，仍跳過 removed scrim；Upgrade 改用同框架的標籤／符號變體。`prepareUpgradePreview` 將遊戲內 `stgRsBoonPopup` 的不同原生節點接入同一卡面，保留原節點供桌面還原。描述與引言移動自有模板 DOM 保留富文字，底部獨立捲動；內部點擊不誤關閉，原 backdrop 與獲卡 onDone／音效仍由原生擁有。置中 cover＋alpha 留邊分析，非跨域可讀時退普通 cover。 |
| D04 已建樣本：長篇富文字閱讀面板 | `moonshine/moonshine.view.dialogs.cjs:tallPanel(id,false)`／`restoreTallPanel`；`.stg-mobile-credits-panel`、`.stg-mobile-tall-body`、`.stg-mobile-credit-default` | Credits 是 B02 的內容樣本，保留特殊色彩／粗斜體；只替原普通色文字加新樣式。原生 `stgOpenCredits` 建立、原 Close 關閉。N02／D03 也用可捲動富文字，但容器與退出流程不同。 |
| D05 已建樣本：分類標題＋動作列表 | `moonshine/moonshine.view.dialogs.cjs:tallPanel(id,true)`／`fitDevLabels`；`.stg-mobile-dev-panel`、`-section`、`-button`、`-label`、`--stg-dev-accent` | Dev Features 套 B02＋I01；保留 79 個原生按鈕及順序，按分類配色、清 U0001F41E／🐞 顯示字樣，括號文字另起一行。入口仍為 `stgOpenDevMenu` 的警告流程，再由 `stgShowDevMenu` 建頁；不能直接繞過警告。 |
| D06 已建局部樣本：數值／狀態角標與卡面抬頭 | `MOONSHINE_CARD_THUMBNAIL.update` → owned cost／uses；`moonshine/moonshine.view.card_detail.cjs:enhance`／`needsLightning` → `.card-cost`、`.stg-md-cost--*`、`-uses`、`-worship-count`、`-once-symbol` | 費用正負零顏色、絕對值文字及縮字是同組的不同尺寸；排序仍用有號值。有限次數／∞、Worship 計數、一次性閃電是不同欄位，不可互相推導；沒有 Worship 計數的卡不造假數值。閃電依 Power／Consume／Exhaust／exhaustsOnPlay；使用單色 Noto Emoji，`.stg-md-once-symbol` 固定 32px 置中槽，內層 `.stg-md-once-glyph` 下移 0.14em 補償字形基線，字號 clamp(22px,6.4vw,28px)。 |
| D07 CG／戰鬥詳情 | 普通 CG：`moonshine.view.game_chrome:makeMobileCgViewer/syncMobileCgViewer/fitMobileCg`；戰鬥：`MOONSHINE_COMBAT_COMPONENT.modal/updateModal` | 普通 CG 保留 RETURN、平移、FIT、縮放。戰鬥圖像改由 Enemy Details 顯示，不再使用舊 combat-art session/footer button；EXIT 只關閉詳情，不能呼叫 `stgShowActionOverlay` 完成回呼。 |
| D08 已建 b6 直向角色選擇卡 | `moonshine/moonshine.view.game_chrome.cjs:ensureCharacterCarousel`／`cleanupCharacterCarousel`／`loadCharacterLockFont`；`.stg-mobile-character-stage`／`-card`／`-arrow`／`-count`／`-orientation`；原生 `#stg-charsel-root`、`.charsel-tile` | 以原生角色卡重排紫框、圖像／名稱／說明、左右箭頭、頁碼及底部 Return／Deploy。可用角色顯示原生背景影片、播畢後的靜態背景及漸層；未推出角色為黑底，上鎖卡保留原生不可部署狀態，圖像區置中顯示單色 Noto Emoji 鎖頭與 Coming Soon。讀 `STG_CHARACTERS`、`stgCharacterSelectBoot`、`stgSelectCharacter`、`stgConfirmCharacter`，保留解鎖、選擇、媒體及部署判定；desktop 清理還原原生文字與結構。 |
| D09 局部適配：掃描小遊戲與 DATA 閱讀層 | `moonshine/moonshine.view.game_chrome.cjs:optimizeMobileScan`／`updateMobileScanButton`；`#stg-scan-overlay`、`.stg-scan-frame`、`-image-wrap`、`-data-readout`、`.stg-mobile-scan-story-btn` | 原生 `stgShowScanOverlay`／`stgHideScanOverlay`／`stgScanCaptured`／`stgMarkScanCaptured`；非模態工具窗，外殼不擋底下劇情操作，實際 frame 可操作。已調整點中心形的動畫位置、DATA 捲動及收合；新外觀仍不可改獲取／完成規則，不能直接套 N01 全屏遮罩。 |
| D10 局部適配；冒險分支新元件待設計 | CSS 註解 `Maps, lab, rest, blessing and card pickers`；`.stg-map-wrap`／`-row`／`-node`、`.rest-panel`、`.blessing-cards`／`.meditate-cards`／`.stg-picker-cards` | 現有只有尺寸、捲動、橫向卡列及 touch 排版。優先讀原生 `stgMapBoot`、`stgEnterNode`、`stgStomachMapBoot`、`stgLabOpenArcChoice`；`stgOpenMap` 是另一個唯讀地圖 overlay，勿和可選路線混淆。新增分支卡／節點元件時在此補資料契約及測試。 |
| D11 共用遊戲頂部 HUD（b6）；戰鬥其餘部分待設計 | `moonshine/moonshine.view.game_chrome.cjs:ensureMobileTopHud`／`installMobileTopHudHooks`／`updateMobileTopHud`／`syncTopHudTicker`／`openMobileTinyInformation`、`moonshine/moonshine.component.upgrades.cjs`；CSS `.stg-mobile-top-hud`、`.stg-mobile-tiny-*`。原有 `ensureMobileSaveButtons`／`applyMobileUiLock`、戰鬥 `.combat-bar`／`.enemy-stats`／`.hand .card`／`.stg-combat-footer` 仍在各自路徑 | 原生 HUD 是多份實體：祝福／同型升級頁 `.blessing-header-inner`、事件頁 `.ev-player-bar`、一般地圖／胃部地圖／Lab `.mapscreen-player`、戰鬥 `#stg-root .header-right`。手機層在各原生渲染函式返回後重接相同外觀，六類場景都錨定遊戲開始時祝福頁的頂部座標；地圖／Lab 標題與戰鬥地點名暫移到 HUD 下方。保留原生菜單按鈕／飛窗回呼；地圖固定頭欄改高後再呼叫 `stgSyncMapFixedTop()` 對齊內容。表面顯示 i、三段膠囊（僅目前 HP、DATA、上下排列的 Chaos／Grace）及原菜單入口；HP 顏色由未四捨五入的 `hp/maxHp` 決定：≥100% 藍、≤20% 紅，其餘紫。上限不顯示，但保留在 HP 的無障礙名稱；數據從 `_STG.player` 讀取，原生節點變動或原生渲染時即時同步，150ms 比較式同步補足只改狀態、不重繪頂欄的效果，不反寫數值。i 開 Tiny Information：`_STG.fetish` 四項、`stgOwnedBoonRecords()` 四欄升級、獨立縱向捲動；升級借用 D03 卡面，點卡外返回面板。戰鬥只重排頂欄，其餘戰鬥 UI 未改；後續先讀原生 `stgRender`、`stgPlayCard`、`stgUpdateBlockBars`、`stgCanSave`／`stgOpenSlotPicker`。不能用圖鑑 `data-card-index` 取代戰鬥手牌索引。 |
| D12 局部適配：戰鬥動作／過場圖文層 | CSS `Combat action overlays`、`#stg-atk-overlay`、`.stg-ov-art-wrap`、`.stg-ov-banner`、`.stg-ov-next`；原生 `stgShowActionOverlay` | 手機層固定全屏外殼，只讓內圖／影像動畫，正文有界捲動；這是可能觸發戰鬥結算的原生流程，不是 D07 看圖工具。重新設計時追查 cb、resolveText、鍵盤及下一步觸發點。 |
| D13 局部適配：遊戲內 Settings 與卡牌選擇器 | `moonshine/moonshine.view.game_chrome.cjs:optimizeMobileSettings`／`openMobileSave`；`#stg-settings-fly.stg-mobile-settings-sheet`、`.stg-mobile-settings-head`；CSS `.stg-card-picker-box` | 遊戲內設定是原生 `stgToggleSettingsFlyout`／`stgRenderSettingsFlyoutInner` 的重建式飛窗，不是主頁五分頁。Save 入口沿用原生 `stgOpenSlotPicker`，進入 D14；卡牌選擇器仍只套基礎尺寸規則。此處另有 `ensureMobileTestTools`／`healPlayerForTesting`：會實際修改 HP 的既有測試工具，不能當純顯示元件移植。 |
| D14 已建樣本：存讀檔摺疊卡與詳細數據 | [moonshine/moonshine.view.saves.cjs](moonshine/moonshine.view.saves.cjs)：`card`／`detail`／`fitNames`／`nativeAction`／`autoLoad`；`.stg-msave-panel`、`-list`、`-card`、`-detail`、`-metrics`、`-fetishes`、`-actions` | Save／Load 共用 B02 與 I01 外殼，卡片開關遵守 I09 順序動畫；Auto Save＋`STG_SAVE_SLOT_COUNT` 手動槽，預設全收合，僅一張展開。中段捲動，底部 Close 固定；原生 modal 隱藏而保留供原操作按鈕點擊。資料讀 `stgReadAutosave`／`stgListSaveSlots` 和 `stgBuildSaveMeta`，不可從顯示反寫生命值、陣營或 fetish；Auto Save 無重命名與刪除。 |

回歸入口：D01／D02／D06 用 [tests/test_mobile_compendium.cjs](tests/test_mobile_compendium.cjs)、[tests/test_mobile_card_detail.cjs](tests/test_mobile_card_detail.cjs)；D03 用詳情測試；D04／D05 用 Tall Panels 測試；D07 用 [tests/test_b67_combat_flow.cjs](tests/test_b67_combat_flow.cjs)；D08 用 [tests/test_character_select.cjs](tests/test_character_select.cjs)、[tests/test_character_select_live.cjs](tests/test_character_select_live.cjs)；D09 用 Story/Scan 測試；D11 用 [tests/test_b6_top_hud_live.cjs](tests/test_b6_top_hud_live.cjs)；D14 用 [tests/test_b5_saves.cjs](tests/test_b5_saves.cjs)。D10／D12／D13 與戰鬥 HUD 尚無涵蓋全部分支和遊戲進行狀態的完整回歸；現有 fixture／局部布局檢查不能代替新增流程的驗證。

### 祝福／事件頁頂部 HUD 與 Tiny Information（b6）

`ensureMobileTopHud` 接手 `.blessing-header-inner`（《The Professor's Upgrade》等同型頁）和 `.ev-player-bar` 的手機外觀，保留原生欄位和 `#stg-banner-menu-btn` 的設定／菜單飛窗回呼；其餘頁面的戰鬥頂欄與設定內部項目不變。頂欄 `i` 使用一般 UI 字體，菜單符號使用 Google Fonts API 提供的 `Noto Sans Symbols 2`，DATA／指南針與四項 fetish 符號使用單色 `Noto Emoji`。HP 標籤及 HP／DATA／Chaos／Grace 所有數值節點均須明確設 `JetBrains Mono`：前段的全域手機文字規則會覆蓋單靠父節點繼承的字體。HP 標籤與兩個圖標共用相同的上列 grid 中線；菜單符號另補光學基線。整列參照 1080×1920 畫面設計，保留頂部安全區；完整遊戲的 html zoom 也須檢查實際尺寸。

祝福頁 `stgSelectBoon` 會呼叫 `stgBlessingRender`，以 `root.innerHTML` 重建整個 HUD，但不切換 passage；因此僅靠 passage observer 會漏掉這次重建。`installMobileTopHudHooks` 在原生渲染器返回後同步補上手機頂欄，也涵蓋同型升級頁的重繪。與 `moonshine/moonshine.component.upgrades.cjs` 共用渲染器時須保留既有 hook 標記，避免每次 viewport／介面更新都重複包裝函式。回歸需點選與切換祝福升級，確認頂欄仍是單一手機版節點。

Tiny Information 使用 b5 面板色系，升級外框填滿標題與固定 Close 之間的剩餘高度，只讓縮略卡區縱向捲動。格子固定四欄，四項 fetish 的 mouth 符號與 D14 存檔卡共用單色 `🫦`；`STG_MOBILE_UPGRADES.createSymbol` 共用升級圖示與字形置中。點擊已持有升級呼叫原生 `stgRsBoonPopup`（其他原生升級池使用同構預覽外殼），交由 `moonshine/moonshine.view.card_detail.cjs` 顯示 D03 詳情卡；預覽不修改 boon 效果或 ownedBoons，點卡外只關閉大卡，保留資訊面板。離開手機模式還原原生 HUD，切換 passage 時關閉資訊面板。回歸入口為完整遊戲測試 `tests/test_b6_top_hud_live.cjs`。

### Tiny Information：View Deck（b6）

`moonshine/moonshine.view.deck.cjs` 提供 `STG_MOBILE_DECK.open/close/cards`，Tiny Information 在 Fetishes 與 Installed Upgrades 之間放置 View Deck／總張數膠囊。資料以 `_STG.masterDeck` 為準（空陣列即空牌堆，只有缺少 masterDeck 才合併暫存 piles），每張卡保留自己的實例與原順序，不合併同名牌。總數不隨篩選改變。縮圖與COMPENDIUM重用 `MOONSHINE_CARD_THUMBNAIL`，資料由 `api.moonshine.cards.deck()`／`compendium.catalog()`交付；費用仍為原卡有號費用，有限卡使用 `toolUses/maxUses`；詳情仍呼叫 `stgShowCardView`，由 D03 適配。開關瀏覽器時保存／還原原 `_stgCompCatalog`，不反寫牌堆。

R 全開分類／類型並清除排序；C 和 Fs 使用圖鑑相同的分段控制與草稿提交方式，Done 才生效，背景／Escape 取消草稿。一般牌堆的 C 列出渲染圖九類；有 Alpha 牌時追加對應類別。牌堆與篩選面板各自捲動，底部 Close／Done 固定；子面板開啟時暫停下層按鈕鍵盤操作，返回恢復焦點。手機 HUD 菜單只移除舊 Deck 列，桌面保留原入口。注入器在 upgrades 之後、detail 之前載入新模組。回歸入口：[tests/test_b6_deck_live.cjs](tests/test_b6_deck_live.cjs)，同時保留 D11 全場景 HUD 回歸。

### 角色選擇直向卡（b6）

`ensureCharacterCarousel` 重用原生 `.charsel-tile`、角色資料與 Return／Deploy 按鈕，只加兩側循環箭頭、`n of total` 計數及手機顯示文案；不另存角色選擇狀態。正常卡使用原生角色圖像並填滿圓角圖像區；可用角色的 `bgVideo` 保持原生一次播放、播畢淡出並露出 `bgImg`，背景層只適配手機根節點大小。上鎖卡保留不可部署判定，以純黑畫面背景代替尚未推出的角色背景，圖像區中央顯示 `🔒︎`（文字變體）。字體正式家族名為 `Noto Emoji`；`loadCharacterLockFont` 委派 logical emoji，鎖頭字形已在 LUNAR 內嵌子集。離線測試可查驗實際 face；真機仍需視覺驗收。未選／不可用角色的 Deploy 使用暗灰停用色，原生 `disabled` 判定不變。手機模式退出時還原原生按鈕／標籤文案和卡片結構。

卡面以寬度和固定比例決定尺寸；更高的直向螢幕將多餘空間留在頁碼與底部按鈕之間。狹窄機型仍保持箭頭至少 44px 的可觸控寬度。完整遊戲的 `html` 可能有 0.8 縮放，角色根節點使用 B04 `syncZoom` 局部抵消，視覺寬度跟隨 `innerWidth`，離開手機模式還原原始 zoom；單在沒有遊戲縮放的 fixture 看版面不夠。原生選角會將 `stg-shake` 加到 body；b6 在角色頁阻止 body 位移，僅讓卡片輕微震動，避免固定滿屏背景與底部按鈕短暫裁切。回歸入口：[tests/test_character_select.cjs](tests/test_character_select.cjs)（400×760、9:16、9:20、A35 比例與狹窄尺寸、背景影片淡出）和 [tests/test_character_select_live.cjs](tests/test_character_select_live.cjs)（完整 b6 遊戲的 viewport 填滿、切換震動、選角／返回／部署）。

### 升級大卡面與符號對照（b5）

這是 D03 的卡面變體，沿用相同高度比例、單行標題縮字與底部富文字捲動。卡面寬 80vw，上限沿用既有卡框；金色外框、左上 UPGRADE 膠囊、右上 `📀` 圓形角標；中間深色圓角矩形顯示單色 Noto Emoji，使用 HSL(260,45%,69%)。升級不顯示費用、∞、Worship 或閃電欄位。

圖鑑與遊戲內查看已持有升級共用此詳情樣式。已持有升級托盤 `.stg-relic-chip` 在手機模式加上點擊／Enter／Space 預覽入口，沿用 `stgRsBoonPopup(id)`；預覽不執行 effect、不扣 DATA、不添加 ownedBoons。該原生預覽與圖鑑的節點結構不同，`moonshine/moonshine.view.card_detail.cjs:prepareUpgradePreview` 保留原生 `.stg-rs-boon-card`，建立共用卡框並補回原有 `STG_CARD_FLAVOR` 引言；關閉仍由原 scrim 處理，切 desktop 還原原節點。

[moonshine/moonshine.component.upgrades.cjs](moonshine/moonshine.component.upgrades.cjs) 輸出 `STG_MOBILE_UPGRADES`：`symbols`（唯讀 id 對照）、`badge`、`symbolForTitle(title)`、`createSymbol(text)`、`fitSymbol(element)`、`mount()`／`cleanup()`。先於 `moonshine/moonshine.view.card_detail.cjs` 注入。`createSymbol` 共用 B07 的本機優先 Noto Emoji 載入，再載入所需字形；用 Canvas TextMetrics 的實際字形邊界補償文字框基線及左右留白，在 resize／字體完成後重新計算，並快取未變動的字號／載入狀態。CSS：`.stg-md-upgrade`、`-upgrade-label`、`-upgrade-badge`、`-upgrade-art`、`.stg-mu-symbol`／`-glyph`／`-inline-symbol`。

| 原生 boon id | 升級名稱 | Noto Emoji 字元／用途 |
| --- | --- | --- |
| `max_hp` | Reinforced Chassis | `🤍` U+1F90D，純空心愛心；不要用 `❤`，後者在此字體帶有條紋 |
| `energy` | Spare Power Cell | `🪫` U+1FAAB，依渲染圖選用有底部蓄電區的電池；不是動態電量狀態 |
| `chaos_cap` | Chaotic Warrior | `🔥` U+1F525 |
| `grace_cap` | Graceful Hero | `🪷` U+1FAB7 |
| `str` | Combat Subroutine | `⚔` U+2694 |
| `draw` | Parallel Processor | `💽` U+1F4BD |
| `heal` | Field Repair | `🛠` U+1F6E0 |
| `max_hp_2` | Overbuilt Frame | `🪖` U+1FA96 |
| `atk_2` | Hot Sauce Vial | `🧪` U+1F9EA |
| `heal_2` | Field Distiller | `💊` U+1F48A |
| `draw_2` | Lucky Bauble | `🍀` U+1F340 |

右上角標 `📀`（U+1F4C0）對應渲染圖的大部分填色光碟；不要換成主要為外框的 `💿`。所有符號使用字體顯示，沒有新增 Wix 圖像請求。未知升級的詳情使用光碟 fallback；未列出的遊戲內升級保留原符號，後續應在此表明確登錄。

遊戲流程現階段只同步已知升級的符號與字體，選擇／購買卡片的版面仍待另行設計。`sync` 處理祝福／商店 `.blessing-card`、Logic 內嵌 `.lgc-upg-card`、獎勵 `.pk-boon`、已持有托盤 `.stg-relic-chip`、結算 `.stg-rsd-boon`。`mount` 對原生渲染函式加冪等的完成後同步 hook，並接既有 passage 更新；`cleanup` 還原原文字、屬性與查看事件。不要直接修改 `STG_BOONS[].icon`，也不要改 boon 效果、價格或存檔。

回歸：[tests/test_b5_upgrades.cjs](tests/test_b5_upgrades.cjs) 驗 11 種符號、圖鑑詳情、富文字長描述、已持有升級預覽、desktop 還原及真實原生商店購買／祝福流程。預設封鎖網路；正式字體已內嵌，可在離線檢查 actual font；舊 `STG_TEST_FONTS` 遠端 fixture 不代表现行載入入口。

### 存讀檔摺疊清單與 Auto Save（b5）

`moonshine/moonshine.view.saves.cjs` 的 `STG_MOBILE_SAVES.mount/cleanup` 在原生 `stgOpenSlotPicker` 回傳後適配 `#stg-slot-picker`。原生 `.stg-slot-modal` 留在 DOM 中，只在直向手機隱藏；手動存檔的讀取、覆寫、刪除、匯出、匯入與重命名仍點擊它的原生按鈕，沿用確認／輸入框、localStorage 鍵、存檔版本與導航。切 desktop 移除新面板並顯示原面板。Save 與 Load 用同一清單，但 Save 模式保留 Overwrite／Save Here 及 Load 入口。新的主面板採 B02 固定標題／底部 Close＋中央獨立捲動區，槽位數直接讀 `STG_SAVE_SLOT_COUNT`／`stgListSaveSlots()`；增加至 10 槽時清單可以捲動，無須拉長面板。

預設所有條目只顯示名稱；點選後單一條目平滑展開。自動存檔在收合／展開狀態都拼作 `Autosave`。手動存檔優先顯示既有 `saveName`，否則顯示 Slot N；原生上限 40 字，長名稱先縮至 17px，仍超出時允許名稱本身橫向捲動，按鈕、其他 UI 和底部 Close 不被遮住。I09 是此處的順序動畫樣本：展開先以 WAAPI 在 280ms 內將同一外框由一條伸長成完整卡片，時間、鉛筆、數值與操作仍不可見／不可操作；完成後才以 120ms 淡入。收合先在完整高度將細節淡出，再縮短外框；收縮時保留 20px 圓角，到縮略高度才恢復膠囊圓角。名稱在卡內維持相同位置和字號，只依選中狀態變為粉色或縮略紫色。換選存檔時，舊卡完整淡出及縮回後才開始新卡展開；快速連點以最後一次要求的目標為準。`prefers-reduced-motion` 直接呈現最終狀態。

展開的手動槽有原生重新命名入口；重命名仍觸發 `stgShowPromptModal`，只把它的手機外觀適配為圖中的 `Renaming to...`，不另造一份儲存寫入。重命名框按新示意圖採較緊的標題／輸入／Cancel 垂直間距；送出箭頭在輸入欄右側圓形背景置中。提示沿用 B04 的 zoom 補償，尺寸變動後重新同步 zoom，關閉時還原原值；其外框高度依 `--stg-mobile-vh` 跟隨可視區。`moonshine/moonshine.view.dialogs.cjs:confirm` 必須略過 `.stg-msave-rename`，否則 viewport 或鍵盤觸發重新 mount 時，通用確認框的固定高度會把此提示拉大。Auto Save 詳情只顯示 Load／Export，中央刪除格留空，不渲染垃圾桶符號、佔位節點或重命名入口；清除它的玩家入口只有 Settings → RE → Reset All to Default。

資料讀取使用 `stgBuildSaveMeta(payload)`：HP 淺色為目前值、深色為最大值；Deck、DATA 和下方四項皆取快照。HP 標籤及兩個數值、牌組數、陣營數、DATA 數與四項 B／M／P／F 數值一律用 JetBrains Mono。四個小格按原生 `fetish.butt`／`mouth`／`pussy`／`feet` 對應 B／M／P／F；mouth 使用與 D11 Tiny Information 相同的單色 `🫦`。Deck 與 B／M／P／F 數字為淺紫，DATA 黃色。指南針及數值的色調依 `chaos - grace` 的正負切換橘／藍，零使用 HSL(0,0%,75%)；不拿圖例數字當成遊戲狀態。四個小格的單色圖形置於淺紫圓底、深色字形，圓底與數值區共用單一膠囊外框，數字按右側空間置中。`moonshine/moonshine.view.saves.cjs:fitNames` 同時借用升級圖標的 Canvas 字形量測方式，按可見輪廓校正四個圖標；字體載入完成與 resize 時重算。手動存檔鉛筆按鈕在卡片右上、標題右側，呈橫向橢圓。截圖所稱的「Noto Sans Emoji」單色圖示以 logical emoji 400 的 Noto Emoji 子集實作；一般文字使用 logical ui，圖鑑翻頁使用 logical symbol 的 `◁`／`▷`。新字形需驗證實際載入及退回字體的版面。

原生 `stgMapBoot`／`stgStomachMapBoot` 在到達安全地圖時已呼叫 `stgWriteAutosave()`，包含戰鬥返回地圖；手機層不重寫這個時點，也不改存檔格式。`STG_MOBILE_SAVES.setAutosaveNotice(callback)` 供日後掛接提示：只有手機模式、原生寫入成功才以新 `stgReadAutosave()` payload 呼叫 callback；傳 `null` 取消。目前預設無 callback，不顯示任何提示。Auto Save 載入沿用 `stgDeserializeRun`、可用時的音效初始化及 `Engine.play(resume)`；匯出下載同一原生 payload 的 JSON，不刪除本地副本。

回歸：[tests/test_b5_saves.cjs](tests/test_b5_saves.cjs) 驗真實 b5 頁的高度→淡入、淡出→高度及舊卡收合→新卡展開順序、名稱位置／色彩、快速切換、四種比例下的重命名框，及 Auto Save 保護／載入／匯出、原生手動重命名／刪除／匯入、HP／alignment／B-M-P-F 來源、10 槽捲動、desktop 還原及預留提示回呼。另用 [tests/test_factory_reset.cjs](tests/test_factory_reset.cjs) 驗 RE 總重設；不把測試用存檔注入正式頁面。

<a id="b5-ui-flow"></a>

### F．劇情流程控制（保留擴充入口）

| 編號／目前狀態 | 已有適配與原生搜尋區域 | 新設計必須補上的契約 |
| --- | --- | --- |
| F01 局部適配：正文＋選項＋收合 | CSS 註解 `Narrative encounter/body exploration`；`.enc-text-panel`、`#enc-text`、`#enc-choices`、`.enc-choice`、`.arc-dlg-panel`／`-opt`；原生 `stgEncounterEventBoot`、`stgEncounterToggleCollapse`、`stgRefreshEncounterChoices`、`stgLabOpenArcChoice` | 目前只讓正文與選項可讀、可捲動、可觸控；動態選項仍會重建。新元件記錄正文、選項、收合各自狀態來源，保留 dynamicLabel／disabledIf／選項排序，不把初次 DOM 當永久內容。 |
| F02 待設計：逐段故事及防誤觸推進 | 原生 `stgEncounterPlayChunks`、`stgEncounterTypewriter`、`stgEncounterSkipTw`、`stgEncounterSkipToEnd`、`stgEncounterEventChoose`、`stgEncounterChoiceContinue`、`stgGoTo`；另查 `.enc-page-continue` 及原生 keydown 綁定 | 尚未實作新的防誤觸狀態流程。先追「完成當段打字 → 下一段 → 顯示選項 → 選項效果 → 場景／戰鬥導航」；查清同一次 click／Enter／Space 是否會穿透到新出現的控制、舊 listener 如何退出、效果是否只執行一次。借 I01 外觀不代表可以重用其普通導航回呼。 |

現有 [tests/test_story_scan.cjs](tests/test_story_scan.cjs) 是布局／掃描 fixture，**不能證明劇情防誤觸需求已完成**。新設計時需覆蓋閱讀中、打字完成、選項被停用／重建、進出掃描、導航及回到頁面的實際狀態；新元件和測試在這裡補登錄。

### 組裝樣本與搜尋方法

常見組裝：Settings 頁＝B02＋I02/I03/I04/I05/I06；Compendium＝B02＋D01/D02＋I01；C/Fs 篩選＝局部 `modalShell`＋I03/I02＋草稿提交；Credits＝B02＋D04；Dev＝B02＋D05；年齡同意＝N02＋I03＋I01；卡牌詳情＝D03＋D06＋B03/B05。這些是查找關係，不是要求新增一套元件框架。

C/Fs 的 `modalShell` 是 `moonshine/moonshine.view.compendium.cjs` 內部方法：body sibling 遮罩、Escape／背景點擊關閉。`showOptions` 複製草稿，All／None 也只改草稿，Done 才提交；清單 `.stg-mc-option-list` 依可視高度捲動，頭尾保留。它沒有通用的焦點鎖定／還原 API，不能因為帶 aria-modal 就假定具備 D07 戰鬥看圖的焦點管理。重用它建立新對話框時，需要按新場景補完鍵盤與焦點契約。

在專案根目錄先限縮到擁有者，再讀命中位置的上下文。例如：

```sh
# 已知控制：先看建構、狀態提交，再查樣式，無須掃整份遊戲。
rg -n 'function (slider|segment|setSegment|handleChoice|onInput)' SYNODIC/moonshine/moonshine.view.settings.cjs
rg -n 'stg-ms-slider-group|stg-ms-segment' SYNODIC/moonshine/moonshine.view.source_styles.css
# 新故事元件：先定位原生定義，再讀呼叫者、事件、狀態及清理流程。
rg -n '^window\.stg(EncounterPlayChunks|EncounterTypewriter|EncounterEventChoose|EncounterChoiceContinue|GoTo)\s*=' 'STG 0.2m-b5.html'
rg -n 'stgEncounterEventChoose|enc-page-continue|keydown' 'STG 0.2m-b5.html'
```

b5 HTML 在這裡用於閱讀原生邏輯，修改仍回到手機層來源。若 PC 文件同名接口與現用遊戲不同，以現用 b5 核心核對回呼，不把 PC 行為假定為完全相同。

<a id="b5-ui-maintenance"></a>

### 目錄維護規則與新增記錄模板

1. 修改既有外觀變體時更新同一組；只有功能／結構或狀態契約不同才新增組別。不要為每種顏色、每顆按鈕另建商品。
2. 新功能先確認原生資料與回呼擁有者，記錄可重用的範圍及不能借用的副作用；尤其不可讓畫面關閉意外結算戰鬥、寫入選項或跳過劇情。
3. 接口寫明公開或局部；新增公開 API／檔案才更新「模組與載入順序」及注入測試。保持 hook 冪等、observer 範圍有限、桌面模式可還原；重建型頁面需重接顯示而不疊加 listener。
4. 說明狀態初始化、即時或 Done 提交、取消、disabled、焦點、捲動／點擊傳遞及關閉／清理。對未實作或未驗證的能力明確標記，不補寫成已完成。
5. 選相關測試驗原生回呼、重開／重繪、模式切換、長短螢幕與長文字；全新流程加實際狀態測試，不能只沿用外觀 fixture。測試入口及範圍同步登錄，變更寫入對應版本 Dev_log。

新增條目最少保留以下欄位，可在本分類內繼續擴充：

```text
編號／名稱／功能分類：
狀態（已建樣本／局部適配／原生沿用／待設計）：
現有畫面及外觀變體：
來源檔／函式／CSS 選擇器／公開或局部：
原生入口／資料、回呼與副作用擁有者：
輸入 → 顯示狀態 → 提交／取消／關閉：
重用限制、重繪／清理及鍵盤／觸控行為：
相關測試／尚未覆蓋的情境：
```

## 本輪整理與效能判斷

1. 原本 Cards 重繪為判斷 U 狀態及篩選各建一次目錄；現在共用一次快照。沒有跨重繪長期快取，因此遊玩解鎖與 reset 不會拿到過期 seen/admin。
2. passage observer 原本直接 optimize、再 markPassage optimize、再排程 updateMode optimize；現在 markPassage 只標記頁面並排程。同一幀多次導航／DOM 通知由既有 RAF gate 合併。未移除真正不同職責的 body、scan、flyout 觀察器。
3. 移除 Settings 雙向轉場中重複的 animationend/timeout 收尾；圖鑑、Settings、詳情共用 zoom 原語；色表從圖鑑移至共用模組，詳情不再依靠圖鑑提供色表。
4. 手機 reset hook 原本也攔截 desktop；現在 desktop 委派原 reset。這是作用範圍修正，不是替 PC 修 reset 缺陷。
5. CSS 的舊介面適配和新獨立頁面有不同選擇器／覆寫順序，不能僅因屬性相似就刪除。本輪未大規模重寫 CSS，也沒有變更遊戲核心。

尚未有真機 CPU／記憶體 profiler 資料，不宣稱提升某個百分比。透明圖 alpha 分析每次最多 192×192 像素，僅在詳情圖載入後執行；本輪沒有證據顯示它是嚴重瓶頸，因此未增加複雜快取失效機制。

## 字體規範（b6.6，2026-10-04）

保留原來的一般文字／等寬／單色 Emoji 視覺用途；資源來源與載入政策以本頁開頭 Font Rules 及 [LUNAR FONTS](lunar/FONTS.md) 為準。b5 的本機 FontFace／Google CSS loader 已撤除，不能再當作新元件範例。

| 用途 | logical role | 現有資源／fallback |
| --- | --- | --- |
| 一般文字：標題、正文、選項、按鈕及說明 | ui／display | Noto Sans 衍生 SYNODIC Ui Latin subset／system-ui |
| 需要等寬文字的位置 | mono | JetBrains Mono 衍生 SYNODIC Mono subset／monospace |
| 單色 Emoji | emoji | Noto Emoji 衍生 subset／symbol／OS fallback |
| 單色補充符號 | symbol／symbol2 | Noto Sans Symbols／Symbols 2 衍生 subset／OS fallback |
| Browser translated CJK、普通系統字形 | system／各 role fallback | OS 字體，零下載 |

等寬規則適用於版本號、次數、代碼、輸入欄、CG 控制及 Scanner Reports；既有字重需求保留。四個原設計符號家族中的 Noto Color Emoji 沒有正式 active dependency，不新增／預載彩色字庫；將來需要時先通過 font review。Material Symbols 使用既有 SVG 槽，沒有為 Distance 或 Loading arrow 下載 font。

MOONSHINE 使用 `var(--SYNODIC-font-<role>)` 和 `api.moonshine.fonts.resolve/load/subscribe`。URL、WOFF2、base64、cache 只屬 LUNAR。Critical 為小型 embedded swap；deferred 只在實際使用時解碼，fallback 先呈現，ready 只 local fit。Browser translated CJK 用 OS fallback，不回寫 canonical text。所有資源在 manifest 登記，詳見完整 audit／實際大小與本輪報告。

## 保持的顯示規則與易踩坑

- 費用保存有號數值供排序；角標顯示絕對值。正淺紫、負深紫、零灰色；多位數縮字、雙向居中。
- 已發現卡優先；在同一已發現狀態內按有號費用排序。R 只重設篩選；Reset Compendium 才清發現/管理解鎖記錄。
- 閃電：Power 標籤／class、Consume 或 Exhaust 描述、模板 `exhaustsOnPlay===true`；與 Worship 計數器無關。現階段由原生 DOM 與按名字查模板判斷，若未來遊戲改成結構化關鍵字，應改此轉接點，不擴大文字猜測。
- Worship badge 移至抬頭；保留原生數值。普通卡不產生假的計數器。
- 保留原生描述內粗體、顏色；禁止把描述 `textContent` 寫回 HTML。
- 詳情插圖需要 `cover` 及透明留邊處理；只寫 object-fit 不能消除素材自帶 alpha 邊。CORS 不允許讀 canvas 時只能退回普通置中 cover。
- WebP 變體失敗只嘗試原圖一次。縮圖 0.35、詳情 0.5 指請求像素尺寸比例，不代表檔案大小固定減少相同比例，也不是即時網速偵測；詳情和縮圖使用不同 Wix URL。
- 主選單只改原生按鈕的可見文案與樣式，不重新建立按鈕；新玩家顯示 Start Run，已有存檔顯示 Continue Run／New Run／Load。原生 `onclick` 繼續處理動作。版本號由遊戲提供字串，手機 CSS 用 logical mono 700 顯示，內嵌子集及系統等寬 fallback。
- 一般文字、Mono 與符號／Emoji 都保留系統 fallback；新字體遵循 LUNAR logical role／resource review，不新增直接遠端 loader。
- b6.6 水印改由 `moonshine/moonshine.main_menu_watermark.toml` 設定，僅在主菜單前景顯示，預設左下角。舊 CSS WATERMARK QUICK EDIT 已撤除；注入後的純資料由 LUNAR API 提供，MOONSHINE 自有 DOM 呈現，不攔截觸控。詳見本頁「b6.6 主菜單 TOML 水印」。
- Hooks 用標記防重複安裝；切 desktop 時回復原生畫面。新增 observer 要限縮範圍，避免監看整個 body subtree 導致動畫觸發全頁掃描。

## 驗證與後續操作

JavaScript 測試需要 Node、Playwright 與本機 Chrome。部分舊測試預設讀 b4 或 b3；驗 b6 時設定 `STG_TEST_HTML='STG 0.2m-b6.html'`。角色 live 測試預設讀正式 b6，交付前可用同一變數指向 pending 檔。需要時用 `NODE_PATH` 指向已有的 Playwright 安裝，不必在遊戲目錄加入 node_modules。

| 測試 | 驗證範圍 |
| --- | --- |
| `tests/test_inject.py` | b5 輸入（b2 若存在也驗）、載入順序、冪等性、去除注入後核心不變 |
| `tests/test_b5_dialogs.cjs` | 三種原生對話框、回呼、長正文捲動、原始警告內容、勾選儲存、多尺寸按鈕文字雙向居中 |
| `tests/test_b5_tall_panels.cjs` | Credits 內容／色彩／斜體保留、79 個原生測試按鈕、四種手機比例、兩行內置中文字、捲動與 Close、開發者警告及桌面還原 |
| `tests/test_mobile_settings.cjs` | 五分頁、音效/顯示 setter、縮放、雙向轉場、背景保留、desktop 還原 |
| `tests/test_mobile_main_menu.cjs` | 新／回歸玩家按鈕以螢幕中線對齊、標題頂部留白、無多餘捲動、原生動作、背景保留、desktop 還原 |
| `tests/test_factory_reset.cjs` | 總重設的取消／確認、存檔與提示清理、外部資料保留、重載後警告恢復 |
| `tests/test_mobile_compendium.cjs` | 解鎖與重設、三頁同尺寸、家族與費用篩選、原生詳情、水印、desktop |
| `tests/test_compendium_options_layout.cjs` | C/Fs 對話框在長短螢幕的完整顯示、捲動與 Done 位置 |
| `tests/test_b5_upgrades.cjs` | 11 個升級符號、共用詳情、長文字、已持有預覽不改狀態、原生購買及 desktop 還原；可選實際字體視覺檢查 |
| `tests/test_b5_saves.cjs` | Auto Save、手動槽摺疊／重命名／刪除／匯入、匯出／載入、狀態數據、四種尺寸、10 槽捲動、桌面還原及未來提示接口 |
| `tests/test_mobile_card_detail.cjs` | 預覽/獲卡、閃電、透明圖、費用與使用次數、長描述、desktop |
| `tests/test_mobile_layout.cjs` | 360×640/780/800、400×760，長螢幕內容區增高、三頁 Back 不跳動 |
| `tests/test_display_config.cjs` | 模式與縮放 |
| `tests/test_character_select.cjs` | 角色輪播 fixture |
| `tests/test_b67_combat_flow.cjs` | b6.7 序言、選牌、詳情、原生出牌／回合／結算及 lifetime |
| `tests/test_story_scan.cjs` | 劇情/掃描 fixture |

量版面要等過渡動畫結束；轉場中的 transform 座標不能當成最終 Back 位置。瀏覽器測試封鎖遠端資源以便穩定驗邏輯；另需人工真機驗 Chrome 工具列收合、鍵盤開關、安全區、低速網路與遠端字體。本輪未操作實體 A35。

### 本輪量測記錄

Chrome headless／DPR 3；下列高度為 CSS px，數值四捨五入。

| viewport | Settings 可捲動面板 | Compendium 面板 |
| --- | ---: | ---: |
| 360×640 | 420.8 | 439.5 |
| 360×780 | 533.6 | 573.5 |
| 360×800 | 552.0 | 593.5 |
| 400×760 | 528.0 | 556.4 |

四組尺寸均通過三個 Compendium 分頁面板高度及 Back 座標一致（誤差 ≤1 CSS px）、Back 位於 viewport 內的檢查。既有 Settings、Compendium、卡牌詳情、模式切換及注入完整性測試亦已通過。舊角色／掃描／戰鬥 fixture 曾指向已不存在的 b1，本輪更新到現用 b2 輸入；離線 fixture 注入 CSS 時省略遠端字體 @import，正式樣式仍保留字體載入。

角色選擇、戰鬥圖像、劇情／掃描的離線 fixture 回歸亦全部通過；戰鬥圖像涵蓋直向與橫向、desktop 排除及 resize 清理。

## b4 總重設的操作邊界

Settings → RE 的「Reset All to Default」只在手機設定頁顯示。確認框使用遊戲既有的 `stgShowConfirmModal`；取消時不清除資料。確認後清除 `stg_` 前綴的 localStorage/sessionStorage 資料，並呼叫 `SugarCube.storage.clear()`、`SugarCube.session.clear()` 清除本故事的資料，再重新載入。SugarCube 的 clear 已在隔離瀏覽器中驗證會保留其他應用的鍵。重載後遊戲可能立即重新建立預設 UI 縮放鍵，這是正常初始化，不代表重設失敗。年齡確認與開發者警告要在重新進入相應流程時再度顯示。

變更紀錄見 [Dev_log.md](Dev_log.md)。

### b6 遊戲內 In-Game Options

`STG_MOBILE_INGAME_OPTIONS` 在手機模式接手 `stgToggleBannerFlyout`，桌面仍呼叫原生菜單。Audios／Visuals 左右循環；共用 `moonshine/moonshine.view.settings.cjs` 的控制項與 setter，排除遊戲內 tooltip、banner、developer 等未列於新版渲染圖的項目，主選單 Settings 不受影響。翻頁字形透過 logical symbol2，使用 LUNAR 管理的小型內嵌子集。

內容區獨立捲動，Main Menu／Quit Game／Save and Load／Close 固定在底部。Save and Load 依 `stgCanSave()` 停用並在點擊時再次檢查，入口仍為 `stgOpenSlotPicker('save')`；離開與退出沿用原生確認函式。關閉、passage 切換及 desktop 還原清理面板；縮放時以共用 `syncZoom` 補償。回歸：`tests/test_b6_options_live.cjs`。


### b6 遊戲內暫停與取消離開

`lunar/lunar.bridge.pause.cjs` 在遊戲啟動前接管計時器與動畫幀排程，Tiny Information 與 In-Game Options 分別取得暫停權；所有暫停權釋放後才恢復。Tiny Information 的牌堆、篩選及詳情繼承外層暫停；Options 轉入存讀檔時將暫停權交給 save，原生 `stgCloseSlotPicker` 釋放它。不要只移除 DOM 而不經各面板的 close 清理。

暫停保留 timeout／interval 剩餘時間，封鎖背景操作、暫停背景動畫和非 BGM 媒體，延後敘事音訊事件及播放 Promise 回呼；恢復時不補跑 interval 次數。BGM 播放及原生淡入淡出排程、選單內操作保持執行。遊戲 elapsed time 排除暫停時段。新增 UI 自行排程時可用 `LUNAR.api.moonshine.timing.ui(callback)` 標記；不要把遊戲推進回呼放入 UI context。

離開／退出仍呼叫原生確認函式；確認期間保留可見的完整選項面板並設 inert，確認遮罩以較高層級立即變暗（不淡入），避免露出遊戲背景；取消恢復同一面板的頁碼、捲動與焦點；確定後才關閉並執行原生動作。測試 `tests/test_b6_pause_live.cjs` 驗證計時、音訊實際播放、媒體事件、elapsed、兩類取消、Tiny Information 及存讀檔暫停接續；搭配 options／deck／HUD 回歸。測試音訊使用本機產生的靜音 WAV，不依賴遠端音樂檔。


### b6 聊天／探索固定高度面板

底部 VIEW CG 膠囊按鈕固定使用 logical mono 400，資源歸 LUNAR，保留等寬 fallback。`.MOONSHINE-source-stg-story-view` 明確設定字體家族優先級，避免共用手機文字規則將它覆蓋為一般 UI 字體；此規則同時轉換到自有呈現樹，不改按鈕尺寸、位置或 LUNAR 動作接口。

`moonshine/moonshine.view.story.cjs` 現為Persistent Chrome controller；component.chrome一次建立自有shell，LUNAR chrome.story窄讀Blessing/Encounter/Body/Event/StomachFate的rich content。源panel消失不destroy shell。標題、正文、狀態局部更新，選項經ACTIONS語意API；原生正文只作資料來源，不再移動來源模板panel建立shell。版本b6.6新規範覆蓋本節舊生命周期。

面板高度按直向設計寬度固定為 82vw，極短畫面以上方保留 100px 限制；高度不隨文字量和選項數改變。同寬長手機將多出空間留給背景。新打字／節點內容回到捲動頂端，打字過程不持續搶回捲動位置。完成回呼、即時補完及原生動態 Continue 都更新狀態；所有交互選項、Explore Lab／Embark 與升級卡面在正文區持續隱藏，完成打字後才顯示 ACTIONS 入口。觸控 click 在捕獲階段只補完當段並停止傳遞；HUD 暫停入口及已開菜單除外，仍由 LUNAR pause bridge 保留打字剩餘時間。

開局升級已遷入 ACTIONS，舊單張輪播、默認選中和縮字路徑已移除。LUNAR 保存暫存選中，確認才委派原生交易；未完成交易時 Explore Lab／Embark 停用，詳情預覽不解鎖離開。CG 入口仍委派原生看圖接口。

所有新增樣式以 stg-story-root／stg-story-active 限定；桌面仍委派原版；手機常駐shell保留身份，離場只更新內容和正式Presentation Mode，切換 CG 清理舊 tooltip。`tests/test_b6_story_live.cjs` 驗四比例固定高度、自然完成／補完、暫停、富文字、捲動歸頂、ACTIONS 轉接、確認後重訪、探索框邊界、分段 Continue、行動一次提交、一般事件、CG、Tiny Information 置中及桌面還原；HUD／options／pause／deck live tests 為相鄰回歸。離線瀏覽器封鎖遠端圖像／字體，不等同真機資源驗收。


b6 CG 全屏補償：`moonshine/moonshine.view.game_chrome.cjs:syncArtOverlayZoom` 對 `#stg-mobile-cg-viewer` 和 `#stg-atk-overlay` 局部抵消 html 的 computed zoom；viewer 在量測 FIT 前補償，攻擊遮罩新增時即補償，desktop 清理還原。避免只設 100vw／100vh，否則根元素 0.8 倍縮放仍會露出背景。`tests/test_b67_combat_flow.cjs` 包含 0.8 倍縮放下 View CG／戰鬥 CG／攻擊遮罩的 viewport 邊界檢查。

### b6 手機字形邊界與大數值維護

HUD 的 `fitHudContents` 與對話的 `fitStatus` 使用 Canvas TextMetrics 的字形可見邊界來縮放／置中，grid 行使用 `minmax(0,1fr)` 避免字型行高反向撐大外框。不要再疊加固定像素的字形位移；HUD 在字體載入後重新量測，沙漏在載入完成／尺寸改變時重算。HP／DATA 三位數以上按可用寬度縮小，兩位數恢復原字號。

兼容 `loadNotoEmoji` 現在僅委派 logical emoji，沒有本機／Google 分叉。Tiny Information 使用文字變體，失敗時沿用 B／M／P／F。字形邊界、大數值及 CDP fallback 仍需驗證；正式資源流程以 `tests/test_b66_fonts_live.cjs` 為準。舊 HUD 測試的遠端 fixture 選項不再代表現行載入方式，真機仍需驗收。


### b6 ACTIONS／手風琴選項與升級交易（2026-10-01）

遊戲中的 Arc 聊天、探索／Encounter、一般 Event、Stomach Fate 與 Merlin 升級商店，使用 ACTIONS 集中互動選項。固定高度的正文區只顯示非互動文字；保留富文字、插入段落與打字暫停。VIEW CG／ACTIONS 入口使用 JetBrains Mono 400；加載期間隱藏 ACTIONS。此輪未改戰鬥手牌、地圖節點、Rest 的獨立卡牌選擇器或原生 Dev Features 等不同用途介面。

- LUNAR：lunar.adapter.story_actions.cjs 正規化標籤、類別及 offers；lunar.bridge.actions.cjs 集中擷取原生來源及回呼，actions.read/select/confirm/execute 是新的呈現端接口。UI 不讀來源 DOM 或函式。回呼和延後導航保留在 bridge；buffer 無命令能力。
- lunar.buffer.actions.cjs 的 presentation.actions 保存 schema 1 菜單副本；shop 的 actions:groupId 保存 kind／point／offers／selected／pending／completed／receipt／destination。offers 是原生已產生的資料，按 run scope、節點、選擇組凍結；餘額、affordable、disabled 與 typing ready 重新讀取。選中是暫存意圖，不能當成交易成功。關閉／重繪不清空；新 run／成功載入由既有 scope 清除，未改原生存檔格式。
- MOONSHINE：component.actions 提供動作列、圖標／價碼卡和詳情；view.actions 擁有獨立 #MOONSHINE-actions-root、菜單／商店正文／詳情 DOM；input.story_actions 只路由自有輸入；animation.accordion 共用 280ms 高度、140ms 淡出／淡入及縮減動態偏好。新界面只使用 LUNAR 的語意 API。
- 對話選項第一次點擊展開並點亮，縮略文字淡出、高度完成後全文淡入；第二次點擊才執行原生回呼。短選項只點亮。標籤不縮字，收合時單行省略；完整內容保留粗斜體及內嵌顏色。切換選項先收合上一張，快速操作以最後選擇為準。
- 行動後只要求下一組選項、沒有新正文時，直接在 ACTIONS 更新清單，不先退回空白對話框。LUNAR actions.read 新增 scope、story.html／hasNarrative／paragraphId 及 choiceOnly；正文判斷使用緩衝的完整富文字和目前正文，不能把打字初始的零字畫面當成沒有對話。MOONSHINE 執行後短暫停用當前清單、釋放自己的暫停權讓原生空段落完成，ready 後重建清單並重新取得暫停；只保留舊段落而換選項時也接續，若有新正文、離場、切換 scope／模式或手動 Close，結束接續。只有玩家正在 ACTIONS 執行行動才接續，不因空段落全域自動開啟。
- LUNAR story_actions adapter 同時正規化 label 及 html 的首尾裝飾箭頭。展開前後均只顯示文字，保留內嵌格式／顏色和文字中間有意義的方向符號；原生按鈕和回呼不改。
- 顯示順序由 MOONSHINE 按類別分組：升級、對話、所有含 Explore 的選項、Embark；同組保持原順序，不能重排原生資料或改回呼。相同符號相鄰，Explore 不散落在其他選項之間。
- 圖示固定：對話 💬、含 Explore 的選項 🔍、Embark ✈、升級 📀、完成 ✔，均用 Noto Emoji 單色。升級卡只顯示圖標與 JetBrains Mono 價碼；一行四張，八張以上僅卡片區捲動，組抬頭及確認列不動。
- .MOONSHINE-actions-symbol 的內部 Grid 行／列必須用 minmax(0,1fr)，禁止被字形的文字前進寬度撐大；可見輪廓與文字框寬度不同，僅縮字不能保證不裁切。保留 place-items:center 與既有字形適配，不用 absolute 或固定像素挪動補救。tests/test_b6_action_symbols_live.cjs 驗實際 Noto Emoji、五種尺寸、DPR 1／3、收合／展開及卡片／詳情的輪廓邊界和中心。
- 點卡在 LUNAR 暫存選中並顯示自有詳情；點空白／Escape 返回。免費起始／Fate 必選升級沒有 NONE，Merlin 有 NONE（不扣款的跳過意圖）。確認重新檢查來源、價格、餘額與 pending／completed，委派既有 stgConfirmBoon／stgUpgradeConfirm／stgUpgradeLeave／stgFateEmbark；不複製效果、扣款或存檔程式。確認時只延後原生導航，保留交易回執及單張已選卡，確認列停用；非同步 Fate 效果先讓原生選擇流程完成。
- 自有升級詳情使用 MOONSHINE_ANIMATION.overlay：開啟 180ms 淡入／輕微縮放，關閉 120ms 淡出；動畫期間背景清單 inert，關閉完成才還原焦點與操作。快速 Escape 可接續關閉動畫，模式切換／離場立即清理；prefers-reduced-motion 省略動畫。只演出自有 Grid 卡面，不新增 absolute 定位或觸發交易。
- ACTIONS 取得自己的暫停權，音樂與 UI 動畫繼續。HUD 開啟的 Tiny Information／Options／確認／存讀檔可在其上層顯示，關閉後回到原 ACTIONS 狀態；所有暫停權釋放才恢復遊戲。LUNAR dispatch 僅允許 HUD 菜單入口穿過暫停來源 passage 的 inert，其他遊戲控制項仍封鎖。菜單由實際 visualViewport 與 LUNAR 提供的整體縮放資料約束，桌面模式清理自有物件並恢復原生委派。

回歸入口：[tests/test_b6_actions_live.cjs](tests/test_b6_actions_live.cjs)、tests/test_b6_story_live.cjs、tests/test_b6_top_hud_live.cjs、tests/test_b6_pause_live.cjs、tests/test_moonshine_buffer.cjs、tests/test_architecture.cjs 與 tests/test_inject.py。瀏覽器測試在宿主等待暫停中的 UI 狀態，不能讓遊戲被暫停的 requestAnimationFrame 承擔測試輪詢。離線字體／比例測試仍不代表 Android 真機驗收。

## b6 模組清單、重啟載入與手機儲存契約（2026-10-02）

三份 `lunar/lunar.manifest.toml`、`moonshine/moonshine.manifest.toml`、`hecate/hecate.manifest.toml` 提供標題、作者、描述、版本及 LUNAR API 要求；`modules.json` 的 metadata／optional 記錄其路徑與載入順序。注入器以 Python 3.11+ 的 tomllib 在**生成 HTML 時**讀取 TOML，支援目前 `[mod]` 下 `mod.title` 的巢狀寫法，亦支援直接 `title`；移除描述的共同源碼縮排，保留段落和原文。以不可執行的 `LUNAR-mod-catalog` JSON 打包標準資料，跳脫標記字元。手機 HTML 不讀取旁邊的 TOML，不掃描目錄、不要求檔案系統或任意記憶體存取權限，也沒有遠端下載／eval 模組。

LUNAR adapter.mods 處理純版本轉換；bridge.mods 讀取已打包清單、保存偏好及固定本次啟動決策。api.moonshine.mods.read() 返回 schema 1、apiVersion、modules、mainMenu、viewport；每個模組包括 id／core／title／author／description／version／apiVersion／requiresApi／compatible／enabled／active／pending／locked／status。enabled 是下次啟動偏好，active 是此次實際載入狀態，pending 代表兩者不同。setEnabled(id, boolean) 返回 ok 或 locked／storage-unavailable；沒有任意程式路徑或遊戲命令。這是 Runtime 設定，不進 run／load scope 的 buffer，也不成為遊戲狀態。

API 發行版取自 LUNAR TOML 的 0.1，與現有資料 schema／消費 API 的數字 version:1 分開。數字版本按段比較，0.1 等同 0.1.0，0.10 大於 0.2；要求目前支援單一 >=、>、<=、<、= 比較（裸版本表示相等），不支援複合範圍／預發行字串。不符合或無法解析的 MOD 要求視為 Outdated、鎖定停用；核心要求不符在構建階段拒絕，不生成缺一層的 Runtime。格式規則僅服務當前模組，不冒充完整 SemVer 範圍解析器。

LUNAR + MOONSHINE 固定啟用；`SYNODIC.mods.enabled.v1` 只保存可選模組的布林偏好。每次 HTML／遊戲頁面重新載入時，LUNAR 在可選腳本之前取得設定，整組決定是否執行該 MOD、本層專供它使用的 API 及 UI。切換只記錄下次啟動，不在運行中卸載或重掛接口；返回主菜單不等於重新載入。私人 --hecate 包才包含完整 HECATE（包括 TOML）；一般公開包不包含其 metadata／腳本／API／CSS，缺任一附屬文件整組跳過。已打包但被停用的 MOD 保留 metadata，可在下一次重啟重新啟用。

MOONSHINE component.mods／input.mods／view.mods 只接上述 API：手機主菜單右下角常駐單色拼圖按鈕，已有／新存檔皆適用；全屏詢問、同意窗口及遊戲場景不显示，desktop 清理自有根。Mods 模態共用 overlay 開／關動畫和 ACTIONS accordion；只展開目前檢視的卡片，黃色標題及外框，收合卡依啟用／停用呈綠／紅。標題和按鈕用一般 UI 字體，其餘資訊／描述用 JetBrains Mono，拼圖用 Noto Emoji 單色。描述可獨立捲動，清單可捲動，頭尾和狀態列穩定；控制項用 Grid／Flex，唯一 fixed 為 visualViewport 約束的根，沒有 absolute 像素修補。文字是正常 DOM，刷新及狀態切換不覆寫已翻譯描述。

瀏覽器保存的是自身 localStorage，沒有寫回 HTML、TOML 或遊戲存檔。某些手機檔案預覽器／file URL／隱私模式可能不提供可持久保存的儲存來源；保存失敗時顯示 Unable to save 並保留原設定，不假裝成功。刪除網站資料／更換瀏覽器／改變開啟來源可能重置偏好；離線包不保證跨來源共用設定。若需穩定持久化，使用支援腳本及網站儲存的瀏覽器開啟同一來源；當前沒有要求手機讀檔權限或額外安裝服務。

驗證入口：tests/test_mods.cjs、test_b6_mods_live.cjs、test_inject.py。後者覆蓋 TOML 打包、公開／私人清單、可選腳本門控、缺檔整組跳過、重注入冪等及原生正文不變；瀏覽器測試覆蓋重啟停用／重新啟用、過期鎖定、儲存拒絕、手機比例、翻譯保留與主菜單位置。真機仍需使用者驗收。


## b6.6 Asset Profile／Critical Loading（2026-10-03）

月相置中補充：logo使用等寬兩側的Grid，中間月相格使用minmax(0,1fr)軌道，容許字形本身在格子中心對稱溢出。內嵌Noto Emoji的advance為2600／2048em，超過原1.13em格子；預設auto最小軌道會向右撐開。以Grid限制軌道修正，保留既有尺寸／自有zoom補償，不使用absolute／固定像素平移／canvas runtime量測／新API或每幀JS。六種portrait實際月相像素水平偏移由3.5–4px降至0（DPR1）；DPR2最大水平栅格誤差0.25px，垂直誤差不超過1px。

Mods標題由21→19px，Mono metadata／description由13→12px，控制項高度不縮小。summary保留28px＋彈性文字＋28px的Grid；圖標28×28px固定格子對齊起始端，不再以100%高度追隨兩行標題。長標題收合仍單行省略，展開自然換行；圖標fit尺寸／文字和翻譯身份保持，沒有API資料或accordion流程改動。詳見diagnostics/b66-adaptive-centering-2026-10-03.md。

Loading 視覺修正：bootstrap 保持同一 shell／logo／月相 DOM，以單一 140ms Web Animation 擁有透明度；首次及再次顯示皆淡入，重複 show/hide 不重啟，反向切換只讀目前 opacity 並接續，finish 才 hidden／取消動畫。移除競爭的 CSS entry animation／exit transition 及160ms timeout；縮減動態直接完成。動畫不進原生 game timer，不輪詢或通知 LUNAR。

早期 shell 固定為 html 子節點、位於 body 前；自有 CSS 根據 shell 的 hidden 狀態隱藏 Mods launcher，涵蓋 entry／loading／exit，finish 才恢復。隱藏期間 transition:none，避免原版通用 button transition:all 將 visibility 延後；不改 Mods hidden／disabled／主菜單判斷、不寫 html/body runtime class，不增加 observer、refresh、全局 fit 或重建。測試涵蓋繼承500ms button transition、快速反轉、20次重複 show、reduced-motion及真實公／私人主菜單。

本輪使用者性能設計落實於 [LUNAR ASSETS](lunar/ASSETS.md)，完整規格與量測見 diagnostics/b66-assets-requirements.md／b66-assets-2026-10-03.md。版本不推進。LUNAR assets.core 只管理 profile／manifest索引／受控request／system clock／scene generation／rollback；bridge.resources 窄讀目前背景與原生warm入口。MOONSHINE view.loading 自有shell接管／快速140ms淡入淡出／8fps CSS月相／input及focus／pause，profileChanged等提交完成才放行。Bootstrap為唯一極小的早期呈現例外，不讀遊戲，不等待外網字體。

正式只有mobile方案完整；desktop unavailable，原版desktop委派不當作完整新方案。750ms穩定＋700/900 hysteresis僅在有兩個可用方案時運作，KEEP同候選session不重複，ACCEPT須確認／停舊URL／abort自有pending／載入當前必要資源／恢復，失敗回舊方案並解鎖。命令API和自有UI都檢查lock，HECATE仍可選且無MOONSHINE插件分支。

只從critical＋當前scene選必要背景，不下載整個deferred索引；menu不warm未用map/combat/story/角色或整批audio。現有有界encounter下一3張CG只在實際sequence使用。profile/scene metadata有界清理；HTTP cache仍屬瀏覽器，不清除；原版已發image/CSS/media不冒充能abort。普通image load只標記affected component geometry，保留翻譯／動畫节点，無game notify／全根fit／完整render。stylesheet cache不因自有Loading／symbol字體就緒失效，unchanged native STYLE不routine重轉換。

Loading字體為內嵌JetBrains Mono（SYNDIC）＋Noto Emoji（8月相）OFL子集共5,632B（3,964＋1,668），許可打包；一般UI字體非阻塞漸進增強。不把shell mark當paint、不把rAF間隙當手機FPS。首屏以9.8×＋400ms／750kbps下載／250kbps上傳獨立三輪before/after，保留4×四模式三輪與1×sanity；遠端服務變動、HTML本機file未量下載、原版長boot仍是限制。

## b6.6 Loading Presentation Policy（2026-10-03）

本節覆蓋舊的「所有 CRITICAL_LOADING 都顯示月相」映射。使用者完整規則：[Loading Policy requirements](diagnostics/b66-loading-policy-requirements.md)；交付／測試／限制：[Loading Policy report](diagnostics/b66-loading-policy-2026-10-03.md)。版本維持 b6.6。

- Level 2：HTML cold start，以及玩家 ACCEPT 後的完整 profile 切換。保持早期黑底 SYNODIC／8fps 月相／140ms 雙向淡入淡出；沒有新增第三種全局重建操作。
- Level 1：原生 SugarCube `:passageinit` 完整導航，包括地圖進出、同一 passage 的區域重入、場景／商店／戰鬥邊界。`lunar.transitions.core` 提供 id／kind／phase／from／to／reason；resource bridge 在 State.create／背景替換之前發 start。同一頁的普通 CG、圖片、局部組件及預載不是導航。
- Level 0：`assets.request`／encounter prefetch／icon／lazy image／局部小遊戲素材保持 silent；資源 start/ready 不選擇 Loading、不做全局 input lock。原有局部可用性門檻繼續由相關功能處理。

MOONSHINE `view.scene_transition` 直接管理自有三層 Grid：凍結舊背景樣式、新背景、黑色 dim；背景取自自有 UI 的最多8個已知背景節點（不讀原生 DOM、不重新處理圖像）。dim opacity 0→0.5／140ms；必要資源及新 passage 控制項建立後，以最多4個短期 Image consumer 驗證目標背景 decode，無 ImageBitmap／持久 Blob cache，退出釋放引用及 src。新背景 opacity crossfade140ms，隨後舊背景層淡出140ms呈現前景。不使用 filter／canvas／每幀量測。原生 HTML/CSS 圖像本來就由瀏覽器共享 cache 管理；不能保證受控 fetch 取消原生請求。

右下 `L`＋`sync`＋`ading`，translate=no；Mono 子集直接內嵌，sync 為本機 Google Material Symbols Outlined G+0269／U+E627／opsz24 wght220 FILL0 GRAD0 的 SVG輪廓。1.25s／圈逆時針 CSS transform，只轉箭頭；200ms CSS reveal threshold，ready 前未達門檻不閃。Grid end alignment＋正常 margin，包括 env safe-area 與 native HTML zoom 補償；不靠 absolute 像素位移。建置資產見 design/loading-policy；動畫自身無新增網路依賴。

可復用根／global chrome／Loading glyph保持 node identity；前景隱藏不 destroy。真正 scene 結構仍走既有 patch／scene route，Loading 完成不增加 render、capture、notification、global fit。profile 是唯一可擴大 geometry 的全局方案操作，純背景演出不失效 geometry。

Scene state machine：preparing → ready（critical payload＋目標 passage／控制項已提交）→ MOONSHINE decode／crossfade completion → idle；失敗 → failed → recovery navigation（native Menu）→ ready/idle。transition id／asset epoch 取消舊工作及舊動畫；12秒獨立 system-clock watchdog 處理場景結構未完成／decode卡住，8秒 fetch timeout沿用。失敗 recovery 本身不再遞迴 recovery，解除 lock。

Level 2 全局 command/input lock 並保留既有 profile pause；Level 1 只阻擋玩家 scene/game commands，原生 boot／純動畫繼續。bridge.port native route 內部回呼不被玩家鎖誤擋，finally 回復 request-local depth；API.action/dispatch、普通 invoke 與可選 MOD command 仍 gate。CharacterSelect 的既有第一個未鎖定 carousel 預選在原生準備邊界建立，避免鎖下 Deploy 永遠 disabled。Level 0 不全局鎖。前景 prose sync 在scene期間保留待啟動root，idle時直接啟動既有局部淡入；不在隱藏/鎖定期間提交story.complete，不新增render/fit。

本體 _STG 等 mutable globals 不全屬 SugarCube State；history rewind 不等於遊戲效果 rollback。本輪不建立第二套 game snapshot、不假稱可完整撤回交易／戰鬥，因此 critical failure／timeout 經原生 Menu 安全恢復；原來就在 Menu 時可恢復其前景。舊背景保留到安全新畫面 ready；不放行半完成目標場景。這是已知原生結構限制，並非月相回退。成功之後的存檔／機制由原生掌管。

Logger 分開 SYSTEM_TRANSITION_START/READY/END、SCENE_TRANSITION_START/SCENE_CRITICAL_READY/END/FAILED、TRANSITION_RECOVERY 與 ASSET_LOAD_START/READY/ERROR；只記小型 id/from/to/elapsed/request/failure/rollback 欄位，不記幀、不讀 snapshot/DOM。ASSET debug breadcrumbs 可按現有 threshold 省略，不把記錄作狀態。

地圖出口的region切換可能只呼叫stgMapBoot、不發SugarCube導航。resource bridge只讀run scope＋currentSubmap，在MapScreen內region實際變更時發scene semantic；同區waypoint／HP／普通重繪不觸發。native inline exit回歸使用stgEnterNode，不以改passage冒充區域切換。

System的onPresent acknowledgement等待原有140ms shell fade completion後才END/解除input lock，包括profile失敗退場；Bootstrap show/hide回傳同一冪等完成Promise，反轉resolve舊意圖，onfinish才hidden。無新timeout／遊戲事件／每幀處理。

## b6.6 CG／背景失敗可繼續／構建身份（2026-10-03）

使用者本輪「至少讓流程繼續」覆蓋舊的所有背景失敗均回Menu規則。提供的日誌52/144/270/301記錄主頁/地圖受控fetch固定8秒abort，271導致MapScreen回Menu；沒有原生mechanics exception證據。僅據此不能判定網路、CORS或原生CSS圖像是否已載入。

LUNAR manifest failurePolicy=continue僅授權presentation artwork降級，menu/map及build-time收集的原生CG registry使用此策略。未指定/真正required默認strict，state/controls/watchdog失敗仍safe Menu；profile ACCEPT使用critical(true)，失敗仍恢复舊方案。request本身仍reject，只有scene pack依分類處理，舊epoch不污染新工作。每epoch最多4筆unavailable URL；API assets.presentation/presentationFallback只提供準備結果及許可，不透過Logger決策。

MOONSHINE背景decode最長1.5秒，取消清timer/src/handler；明確可降級圖像失敗使用黑色held layer完成原有crossfade，顯示已ready UI，底下原生CSS/image稍後到達照常呈現。fetch仍8秒，不重試/清HTTP cache/預載未來場景。此策略允許沒有裝飾背景的可用場景，並不忽略required/state/UI錯誤。

Scene終止後location一次microtask同步owned HUD opacity，避免scene-hidden導致opacity0/pointer-events none永久殘留。不通知LUNAR、不全局fit/每frame polling。CG沿用既有scroll/fit/zoom元件，normal-flow Grid分image與footer，左RETURN右-／FIT／+，黑底／紫pill／safe area，JetBrains Mono＋僅必要glyph的本地fallback。非戰鬥Return只經既有LUNAR命令退出art；戰鬥Return只關自有插圖，不推進mechanics。没有為未來scan新增結構或workspace transit。

Mods收縮title獨立中間grid track居中block／left-align文字，icon28px獨立格子，ellipsis/max-width不重疊；展开仍保持icon頂部錨點。Scene Loading（正式Level1）文字與SVG改#ab92d2，速度/threshold/System moon不變。

synodic.build.toml的[build] version為唯一Runtime构建版本來源，b6.6不變，revision区分同版產物；modules.json只指向此檔。build-time驗證後嵌入diagnostic config，Logger固定header保存/匯出，手機不讀TOML；API/MOD版本仍在各manifest。lunar.logger.quotes.toml保留使用者[crash].quotes及新增原文，injector兼容舊root quotes，缺檔/錯誤/空值不阻擋core，不使用遊戲RNG。

本輪測試與限制：diagnostics/b66-cg-recovery-2026-10-03.md。


## b6.6 劇情掃描待結算與特效時序（2026-10-04）

此段覆蓋舊 D09／I08 的「劇情選擇立即顯示原版掃描窗」描述。劇情內 body／encounter scan choice 先成為待結算意圖：ACTIONS 頂部 Scanning Results（Noto Emoji 單色 📡），原劇情分支停用並保留，末尾 Continue 可在0／部分／全部報告狀態選擇。RETURN 只回 ACTIONS，不清進度、不領獎、不跑 response／outcome。Continue 才委派原版選項的效果、Data、claims、回呼與劇情；Data 沿用該選項原數量（例如 gap_scan +1），不是每顆心新增固定貨幣。完整掃描另走原版 captured／fetish completion grant；兩處單色 ✔ 標記依標準 complete 資料局部更新。

LUNAR：adapter.scan 轉 schema1；bridge.scan 保管一次 native choice handle、scope／root／game／choice／session 驗證及最多2個有效 target token。進度寫原版 temporary _stgHeartsSession，沒有新增 authoritative buffer、save schema 或自動回呼；導航／load／run replacement／mode change 失效。read-only 舊圖鑑關閉不重置待結算的 session。api.moonshine.scan 提供 read／token／release／hit／freeze／suspend，Continue 經 actions.execute 的合成 handle；只交資料與命令，不交 native DOM。actions.read 增加可選 scan 欄位；scan domain 只到 scan view 和 ACTIONS 完成標記。

MOONSHINE：component.scan／input.scan／view.scan ＋ view.scan.css 建自有黃色 modal，不走 hidden workspace 或原生 grid／drag UI。標題可換行；Scanner 無捲動，圖片 contain，target 路徑限圖片可見矩形減40px hit box；兩顆上限、原1.4–3.2秒間隔、16秒flight／whack模式及 Advanced Scans 3秒單次 Freeze 保留。targets 用 CSS/Web Animations transform／opacity，geometry 僅自有 ResizeObserver／viewport 事件；Scan Reports 獨立垂直捲動、JetBrains Mono400／內嵌 Mono fallback。原文未變的報告保留翻譯wrapper；只有新解鎖行 patch。RETURN／Escape／scene取消清 timers／animations／tokens，恢復 ACTIONS pause／focus；背景輸入不前進劇情。

舊 optimizeMobileScan／updateMobileScanButton 仍被非劇情的既有圖鑑／standalone scan 使用，不能當成新劇情流程的另一實作。沒有全盤移除既有兼容層。

特效：bridge.effects 只發布 character／combat 語意意圖及讀 native FX setting；MOONSHINE animation.effects 在 Loading 完成淡出、transition idle 後釋放一次 cue。實際 body 的原 character shake 與自有卡片的舊 class replay 被 UI CSS 抑制，避免 Loading／HUD 整页位移；普通角色選擇仍有一次卡片 shake，Screen FX 關閉／reduced motion 不重播。既有 inline CSS shake 在準備期截取自有 animation 描述、取消早期 CSS 演出，idle 後只重播一次；新場景取消舊意圖。沒有 frame polling、routine game capture／global fit 或讀 Logger 作決策。

Logger：LUNAR.scan 記 pending／report unlock（最多5次）／complete／settle／cancel及原 error；LUNAR.effects 僅延後 cue breadcrumb；MOONSHINE.scan 記 open／close／圖片 fallback WARN。只記 transaction／key／count／reason，不 dump 故事、圖片、manifest、DOM，也不為日志擷取或等待持久化。Logger write/export 權限保持原規範。

驗收入口：tests/test_b66_scan_flow_live.cjs（原版 body／encounter，0/partial/full、RETURN/reopen、一次結算、Advanced Scans、圖鑑與取消、六portrait、翻譯/動畫身份、scoped Logger小payload）；tests/test_b66_effects_live.cjs（原生戰鬥特效延後／合併／取消、FX設定／reduced-motion、自有inline shake一次）；同四模式4×三輪before/after、獨立1×與限制見 diagnostics/b66-scan-effects-2026-10-04.md。版本仍b6.6。

## b6.6 Font／Scanner 改良（2026-10-04，版本維持）

MOONSHINE 一般 UI、Mono、emoji/symbol 經 logical variables 使用 LUNAR 字體資源，保留原字級與用途；所有 Core Google loader、workspace FontFace 和重複 font import 已移除。Distance 使用既有 SVG。Font ready 不再送 runtime font domain，只對使用該 role 的局部幾何元件操作；translated CJK 使用 OS fallback。實作／完整 audit／量測见 lunar/FONTS.md 和 diagnostics/b66-fonts-scan-2026-10-04.md。

Scanning Module（取代 Scanning Results）圖片由 LUNAR 專用未裁切 fit URL 提供；MOONSHINE cover 填滿整個 Scanner、不縮窄 field，目標仍在 field−40px 邊界內。小飛行目標僅黃色 Noto Emoji 單色愛心，透明底、細白緣。Report 是 label＋正文，可換行／段落／縱向捲動，不保留原始固定空格縮排。普通 patch 只改新解鎖 row，保持其他翻譯節點。Return／Continue 的原版結算契約不變。

Bootstrap opacity 動畫以當前 document timeline 設定 startTime（timeline 尚未可用時沿用 browser scheduling）；避免原版同步啟動延後第一個 frame 時，淡入停在 pending／opacity 0。只修改 MOONSHINE 的演出時鐘，不等待 font、不改 native boot，140ms／中斷反向／縮減動態與完成鎖契約保留。

固定 LUNAR-font-resources 不進 bridge.resources 的 routine native STYLE 轉換／textContent 檢查；font payload 不在每次 actions／workspace 更新讀取或拷貝。瀏覽器回歸覆蓋零次讀取。

## b6.6 掃描完成後全圖檢視（2026-10-04）

掃描 complete 時，Scanner 標題列右側和完成勾同步顯示 VIEW CG；未完成時按鈕 hidden，LUNAR 也拒絕 inspection。`api.moonshine.scan.inspection(id)` 返回遞迴凍結的 `{id,image}` 或 null，驗證原 pending scope/game/root/choice/session、transaction id、maxClicks 與原生 clickedTotal，並遵守 resource/transition lock。只讀取當次掃描圖片，不呼叫 native art、Continue、grant 或 story，不新增 buffer/save state。

MOONSHINE `component.inspection` 是自有、唯讀看圖元件：黑底、JetBrains Mono 紫色 RETURN / − / FIT / +，normal-flow Grid 分 image viewport 與 safe-area footer；FIT 完整保留比例，0.75–4 倍縮放與原看圖操作一致，超出範圍可捲動。只使用 API 已解析的未裁切 fit URL，重用 browser image cache，不拉原尺寸、預載其他圖、增加字體或全局 Loading。圖片失敗顯示可返回的文字 fallback，zoom 停用。初次圖片load／局部geometry時，來源仍是FIT則保留已翻譯的按鈕wrapper；真正zoom值改變才patch readout。

`view.scan` 擁有 nested viewer lifecycle 與輸入路由；隱藏並 inert 原 scan scrim，但不移除 scanner/report DOM。RETURN／Escape 只銷毀看圖層，回到同一 scanner 並聚焦 VIEW CG，保留翻譯wrapper、報告捲動與完成狀態。原 scan pause owner 持續有效，不新增／釋放 game pause，不跑結算；scanner RETURN 仍回 ACTIONS，Continue 才原版結算。新 run/navigation/stale context/scan close 清除兩層、Image handlers/src、ResizeObserver 和排程 rAF，不保留過期畫面。局部 resize 只量測 viewer viewport，無 workspace/full render/global fit/game emit。

Logger 使用原 `MOONSHINE.scan` scope 的 SCAN_CG_OPENED/CLOSED 和 SCAN_CG_IMAGE_FALLBACK（WARN），僅 transaction/returning，無圖像URL、正文、每幀或每次zoom log；LUNAR descriptor getter不新增重複日誌。普通 CG 沿用既有元件，本輪沒有全面遷移 compatibility viewer。測試：`tests/test_b66_scan_inspection_live.cjs`；交付／性能及限制見 [本輪報告](diagnostics/b66-scan-inspection-2026-10-04.md)。版本仍 b6.6。

## Collected Data／唯讀掃描資料庫（b6.6，2026-10-04）

Current Location Info 的附近角色 Collected Data 已啟用。MOONSHINE 自有前景清單使用與 Save/Load 相同的兩次點擊語意：第一次選中並展開完整標題，動畫完成後第二次確認進入。標題／Close 為 logical UI，掃描名稱／雙色 collected|total 為 logical Mono；計數不翻譯，其他文字正常可見 DOM。已收集者按英文 A–Z 在上方，紫色；未知者灰色 disabled、Undiscovered 在底部。尚未完成不顯示名字／圖片／報告，零目錄顯示0|0和空狀態。

LUNAR `adapter.collected_data`／`bridge.collected_data` 負責原版 STG_CHARACTER_SCANS、STG_SCAN_DATA 與 _STG.scansCaptured 的唯讀轉換，正式入口 `api.moonshine.collectedData`：read(character,id?)／detail(id,key)／inspection(id,key)／valid(id,key?)／release(id)。read 回傳 frozen schema1、id、character、collected、total、items(id,label,complete)；圖片和報告只在開啟已收集 detail 時交付。原版 captured 旗標是收集權威，列表不是另一套存檔或進度；readOnly 完成DTO只呈現全部既有report，adapter.scan.archive不建立原生session。臨時context handle在bridge，綁mobile/map、原生root/game/scope、location key、角色仍在原生附近名單及catalog identity；圖片沿 images.scan 的60%×DPR、有界1600、未裁切fit請求。沒有原尺寸回退／預載／global Loading。

component.collected_data／view.collected_data／view.collected_data.css 只組裝自己的DOM、排序、輸入、accordion和nested pause。列表 keyed patch，來源不變保留翻譯／節點；一般 HP／金錢更新不讀／patch catalog。原生 stgMarkScanCaptured 窄包裝只在flag由false→true時提交 collectedData＋location.nearby domains，不改原版函式效果、存檔、grant或回呼；新增domain只路由所需view。原生例外不被吞掉，Logger旁路不作runtime query。

detail重用 component.scan／view.scan.openArchive，readOnly 時無勾／Freeze／targets，不呼叫scan token/hit/suspend；VIEW CG 重用 component.inspection 顯示該 catalog scan 的全圖。RETURN依序回detail→catalog，Close回Current Location Info；背景層inert但保留DOM／翻譯／scroll／focus／pause。ACTIONS只可closeStory，不能在例行refresh/resize中清掉archive。navigation／load／run／mode失效清理三層／動畫／observer／輸入並釋放pause。原生 gallery overlay／dialogue art／Continue／獎勵／story command 均不走此路径。

Logger scopes `LUNAR.collected_data`、`MOONSHINE.collected_data`：context、select、detail open、close、release、missing report／rejected detail；CG與圖片fallback沿已有MOONSHINE.scan。payload只id/key/count等小資料，不記文字、URL、每frame或geometry。公開仍previous-only，無新diagnostic read。驗證：tests/test_b66_collected_data_live.cjs、test_b66_location_live.cjs、scanner/inspection回歸、test_architecture／test_inject。四模式4×三輪、獨立1×、原始trace與六種portrait見diagnostics/b66-collected-data-2026-10-04.md；版本維持b6.6。

Inspection的owned標記保留在元件自身：destroy清image src再detach後，延後的MutationObserver record仍可辨識為MOONSHINE節點，不誤發compatibility／native capture。回歸以實際subscribe通知＋capture計數驗證，不能僅攔截exported emit（內部emit closure不經該spy）。

2026-10-04關閉窗口的Chrome error 5調查：[原生崩潰比對／重現限制](diagnostics/b66-location-crash-2026-10-04.md)。新增test_b66_collected_location_lifecycle_live.cjs覆蓋catalog/detail/CG/location完整返回及啟用AX的isolated Chrome；100次未重現不代表修復。離線minidump helper只讀白名單metadata，不進runtime／modules.json，不取代LUNAR Logger。正式版本與流程未改，Logger最後已落盤事件也不能當作完整觸發鏈。

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
| Combat | Visible (existing combat policy) | Suspended, combat | Combat policy |
| Explicit Cinematic | Explicit policy | Explicit policy | Cinematic |
| Error rollback/recovery | Previous valid policy | Same shell, previous valid policy | Previous if valid, else safe Menu |
| Outside gameplay (boot/Menu/CharacterSelect) | Suspended | Suspended | Existing menu/selection |

驗收至少包括多段、背景/角色切換、choice→story、CG返回、map雙向、combat雙向、scene/system loading、slow/failed image/background、translated paragraph＋HUD/scene更新、rollback。交付報告按原文32節的13項，最後明確列出是否仍有 native DOM visibility authority 及任何殘餘位置。

### Persistent Chrome implementation notes（b6.6）

`moonshine.component.chrome` creates one HUD/STORY BOX; `moonshine.view.story` owns content/state/scalar updates, `moonshine.view.presentation` owns mode suspension. They are siblings of the compatibility `#MOONSHINE-scene`, never passage children. New shop prose uses this same shell; retired shop shell creation and HUD ticker/render hooks are removed. Existing actions accordion and options/Tiny Information still use their existing adapters.

Native root zoom is compensated on these two owned boxes using the formal display viewport scale, on mount/viewport invalidation only. Ordinary scalar changes do not read layout. Content-only textless beats keep the shell visible. The native legacy eye button is hidden; VIEW CG uses a LUNAR command that emits explicit art-view semantics, including source callbacks that retain the original function. Closing compatible windows restores the explicitly remembered owned chrome opener even if the old template focused its private workspace; partial modal changes reconcile focus without a full render. Chrome stays above Scene foreground and below the old modal stack.

Loading target readiness accepts existing native interactive UI or the narrow LUNAR `chrome.sceneReady()` query for rendered story/Upgrade/map/Lab UI. It does not snapshot rich prose. Persistent buttons outside the scene are not used as false readiness evidence. A failed required scene still commits safe Menu recovery before END; no native history rewind.

Regression: `tests/test_b66_persistent_chrome_live.cjs`, `test_b6_top_hud_live.cjs`, updated `test_b66_shop_cinematic_live.cjs` and `test_b66_loading_policy_live.cjs`. Actual cold HTTP A55 360×800 / 3G / cache-disabled acceptance is separate: `tests/test_b66_chrome_extreme_live.cjs`. The test-only performance helper instruments old controllers when present and new persistent controllers when present; it freezes all downstream chrome commits for isolated A/B modes. None of these probes ship.

Chrome rich-content keys are normalized semantic positions rather than native node handles. A native same-prose replacement retains owned paragraph and translator wrapper identity; actual new prose/paragraph metadata is patched locally. No native control handles are carried by these blocks.

### 地圖模式與HUD比例修正（b6.6，2026-10-04）

本輪使用者要求覆蓋此前map＝NORMAL／空shell可見規則：地圖關卡只保留Top HUD、原有node map及location入口／資訊。MapScreen／StomachMap／Lab由LUNAR交付語義MAP，MOONSHINE以reason=map-navigation suspend同一Story Box及其所有footer輸入；沒有native class或缺文字判斷、shell teardown或新buffer。story／shop仍NORMAL；Lab依2026-10-06使用者修正改用MAP，戰鬥policy保持。L1／L2優先，END恢復MAP；返回story解除suspend／inert。

HUD在persistent owned DOM使用同一compact比例：96vw寬（safe-area左右優先）、top=max(10px,safe-area)+visual viewport offset、height=clamp(36px,10vw,58px)，Grid、pill、字體和glyph取同一size比例。從前native header的A35上邊距不再控制它。保留formal zoom補償與大數字局部fit，不改Story Box皮膚／尺寸、不新增frame polling、DOM重建、globalfit或字體網路。回歸沿test_b66_persistent_chrome_live（含map input／五map viewport）、test_b6_top_hud_live、test_b6_hud_fit_live、location／loading。詳細數據見diagnostics/b66-map-hud-2026-10-04.md。

### Persistent Chrome 的操作／捲動邊界（b6.6，2026-10-04）

Scene Layer／persistent chrome外層是display:contents，必須在實際cascade中成立，不能被compatibility樣式改成全屏實體盒。外層不保留點擊／觸摸命中區或額外flow高度；HUD／Story Box自己的盒與其controllers保持。Presentation suspend＋inert不是清除外層盒的替代品。驗收需實際hit testing／touch swipe／wheel及外層scroll range，不能只驗visibility和scripted click。真正超長地圖在自己的bounded map容器、正文在Story Box內捲動；禁止新增全域preventDefault或native game state修補。詳細回歸：tests/test_b66_map_scroll_live.cjs。

MAP的owned outer root使用overflow:clip（不是hidden的可程式捲動盒），bounded map容器仍可捲；mode離開後還原既有overflow policy。短viewport需同時驗outer scrollTop保持0與真實長地圖底部可達。


## b6.6 共用卡牌縮略圖（2026-10-05）

版本b6.6不變，revision `card-thumbnails-2026-10-05`。LUNAR的`adapter.cards`統一schema1 thumbnail：revealed/name/family/image、cost（value/magnitude/kind）、uses（unlimited或limited＋remaining/maximum）。`bridge.cards.catalog/deck`只按需讀原版目錄／seen flag／masterDeck；masterDeck空陣列有效、缺少時才fallback piles，不合併同名實例、不新增save或buffer authority。原版Worship的curseLevel是另類風險計數，不能當有限使用次數。無maxUses的卡顯∞；有限卡目錄用初始max/max、牌組用目前remaining/max。鎖定thumbnail不交付名字／圖片／費用／使用次數，preview card為null；entry保留family/type/cost/order以維持既有篩選及有號排序。

API：`compendium.catalog()`與`cards.deck()`返回immutable entries；`cards.art(image,cssWidth,cssHeight)`由LUNAR解析profile與30%×DPR卡圖尺寸。MOONSHINE不直接讀原版目錄或圖片表。排序用有號值，未可用費用為null。既有native detail索引的生命週期及commands保留。

唯一卡面實作為`MOONSHINE_CARD_THUMBNAIL.create(dto,{onActivate})/update(el,dto)`；3:4 portrait、陣營邊框、滿版cover圖片、26.5%寬／80%純黑左側條。單行標題與費用／使用次數共用左條中央的豎軸；旋轉後依文字區塊實際行高CSS置中，多行保持居中且不擠出左條，無JS行數／layout量測。費用在左上：負值絕對值＋紫色空心字、0灰色、正值紫色實心字；標題順時針90°、正常可翻譯DOM；左下∞或remaining/max。數字沿用mono logical role（JetBrains Mono），標題ui role。多位數在局部縮字；長標題最多三行，完整名稱仍在DOM/title與原生詳情。卡面不顯示類型／陣營文字標籤，C／Fs篩選保留。

新卡面子DOM不經hidden workspace：既有compendium/deck殼只建立empty slots附plain DTO，snapshot交付cardThumbnail，catalog patch委派共用component在visible tree建立／更新。亦可create直接用於其他owned場景與重疊stack；戰鬥hand全套視覺／effective cost資料適配待後續戰鬥頁面工作，不能把catalog base cost冒充戰鬥即時費用。無新whole capture、global fit、frame polling或翻譯feedback。未變標題／圖片保留identity，使用次數局部更新不改標題。viewport只刷新此類型圖片尺寸，採用api.viewport既有快照；不得在每張卡／每次值更新後讀innerWidth導致style/layout flush。局部100次4×CPU量測另記於報告。

舊`renderCard/face`／`STG_MOBILE_COMPENDIUM.renderCard`和舊art/title/meta/cost CSS已刪除；`.stg-mc-card`僅保留兼容操作／slot selector，並無舊卡面。牌組的原圖error fallback亦移除；錯圖只hide，禁止下載原始全解析圖。Logger僅用`LUNAR.cards` scope的`CARD_CATALOG_READ {total,revealed}`，不記每張卡／frame／翻譯mutation，不讀logs驅動流程。

回歸：`tests/test_b66_card_thumbnails_live.cjs`（DTO、正負零、remaining/max、五viewport／陣營邊框、翻譯身份、filter/sort/native preview、empty slots、直接reuse）、`test_card_thumbnail_adapter.cjs`及既有deck／unlock／card detail和injection tests。性能與交付紀錄見`diagnostics/b66-card-thumbnails-2026-10-05.md`。

## b6.7 戰鬥介面與 API（2026-10-05）

本節取代舊戰鬥 footer／獨立「戰鬥插圖」按鈕及沿用舊 combat UI 的政策。Top HUD 仍由 persistent chrome 管理；COMBAT 明確 suspend STORY BOX。遊戲原生背景／敵方 action overlay、效果及完成回呼保留原擁有者。普通 CG 不走戰鬥 Details。

- LUNAR `adapter.combat` 正規化數值、buff/debuff 及 native thresholds；`bridge.combat` 窄讀 active battle、當前 requested pile、rendered intent/portrait，以及驗證後委派原生 play/end/preview。不得呼叫會鎖定 AI variant 的 intent getter作唯讀。API DTO immutable，card key 按實例；combat id 按 game/root/run lifetime。没有新 buffer/save 或戰鬥 authority。
- `component.combat`／`component.combat_symbols` 管戰鬥框、彩色數字／單色 Noto Emoji、prelude、enemy/player details；`animation.card_hand` 管 shared thumbnails、局部幾何及有限 scroll animation；`view.combat` 管選牌／pile/modal lifetime；`input.combat` 管 owned controls／keyboard。新 UI 不經 workspace。原版戰鬥 UI 來源不進入 compatibility snapshot；背景／action overlay／結算仍用既有相容邊界。
- 原版初始化的 authored opening lines 在初次進戰鬥時顯示 Prelude to Combat，OK 才解鎖操作，無文字直接進入。這是 native game narrative，不讀正式 LUNAR Logger 作劇情。
- HAND/DRAWPILE/DISCARDED/EXHAUSTED 循環。0–2 張置中；3–8 張佔滿可見寬度且不捲動；超過8張沿用8張 spacing再橫向捲動。卡牌保持原生順序／實例 key，重用唯一 shared thumbnail，shadow→lift/glow。部分裁切者先完整捲入，才可 lift；連續操作取消過期動畫。空白取消，第二次點同張開純 preview。
- PLAY 只送 ready selected HAND instance；非 HAND 的 PLAY/END disabled。原生 energy/effective cost、stunned/unplayable/requiresData、enemy turn、over、consume/cursed 都在 bridge 再驗證。負費用依原版處理。CONSUME 沿用原版選卡命令，不新增消耗規則。
- 敵方 HP/max、Block、Love、native damage progress、flavor/Next Move；Next Move 不顯 emoji，Analyze 仍控制原版情報。TURN current/limit 或∞；玩家 Love/Block/HP/max、energy、profile 與 HUD 同源。Damage progress 與 native escape threshold 一致：combatStartHp−hp（可因 healing 回退），不另造累計戰鬥 counter。
- Enemy Details 用當前 phase portrait、contain 且維持面板背景，無拉伸／額外黑色 letterbox；Player Details 用 native phase/escape/relent/Stuck/turn objectives `Requirement: required(current)`。資料是現有條件的可讀說明，不是新勝負規則。Love/Attack/Relent 色彩按參考；buff/debuff `(002) Name` 一行一個、blue/red、Mono、內部垂直 scroll。
- Modal 自己 acquire/release pause 與 focus，EXIT/Escape 恢復同一 pile/selection/scroll。Pure card preview 沿用既有 detail component／native armed backdrop，自己的 focus 避免 pause guard 吞鍵；preview 不觸發 grant／reward／callback。導航／game/root replacement 清理 owned preview/pause，拒絕 stale id/key。Native action overlay keyboard/callback 繼續由原版擁有；over UI 讓出給既有結算。
- Scalar patches 保留卡牌／父節點；translated label 與 numeric spans 分離。native bar style/class frame updates只檢查窄 scalar inference，無語義變化不通知；狀態刷新不量測全局。Viewport 只量 owned hand 並抵消原生 zoom；local card lift 使用 compositor transform，scroll 動畫有限180ms且不讀 API每 frame。
- Logger 僅 small COMBAT_ENTER/EXIT、prelude ACK、commands、modal/pile lifecycle breadcrumbs。無每牌／每frame／getter dump、無 runtime讀log。正式來源仍只在 SYNODIC/modules.json；b5 輸入保持不變。

回歸：`test_combat_adapter.cjs`、`test_b67_combat_live.cjs`、`test_b67_combat_flow.cjs`。注入／architecture／普通 CG／card thumbnail／HUD／pause 與可選 MOD 回歸另行執行；性能報告及 A55 360×800、3G/no-cache 驗收在本輪 diagnostics/builds。

### b6.7 戰鬥視覺細節補充（2026-10-05）

Enemy panel按使用者更新圖，以等寬左右counter欄／中間方形portrait／姓名行／左右描述行組成。左action flavor和右NEXT MOVE均為bounded文字frame；NEXT MOVE固定2.15:1（比例基於参考图，寬度隨viewport適配），label在frame上方，長文只在該框縱向捲。HP和TURN兩半同屬一個完整outer capsule，等分Grid／shared border和overflow clip，不能用兩個各自描邊的pill拼接。牌堆按鈕三欄Grid，中間Mono label、兩側🃏，切換只更新label。

本輪Love💘／Damage⚔／Block🛡／Energy🔋／Pile🃏統一common logical emoji role，Noto Emoji單色embedded WOFF2；舊combat SVG paths移除。既有子集僅缺🔋，29,808→29,852B（+44B），deferred/common；首屏與UI不等待font，1.2em固定icon slot不新增measure／fit。源字體、OFL、cmap、color table absence及actualplatformfont驗證保留。沒有MOONSHINE font URL／base64／cache、nativefont或font readiness→game capture。

共用card_thumbnail rail補充：cost與90°title之間保留1.5cqw比例空隙，title頂端由既有cost字級×line-height與cost scale決定；縮略圖三處共用CSS，title可用長度相應收窄，單行中央豎軸／多行／uses位置保持。無JS font/layout測量、新LUNAR字段或fit／notify。

戰鬥補充（2026-10-05）：TURN 使用 Mono 加粗、深色外描邊與實色膠囊底，維持完整兩半外框；Enemy 方形 portrait 避開 Top HUD，body 頂線保留 location launcher 下方至少8px。位置由 CSS HUD／42px launcher／portrait 比例預留，不新增 runtime 量測、API 欄位、native 改寫或 Logger 事件。需驗320×568至748×1400的實際幾何與launcher命中，以及A55慢網路圖片decode後的間距。

戰鬥膠囊補充（2026-10-06）：敵方／玩家HP與TURN的右半填色由完整outer capsule的50% hard-stop背景漸層繪製，不再依賴maximum子節點背景的圓角裁切；子節點透明，TURN實色左底以background-color疊加，避免shorthand清掉共用漸層。保留同一外框、等分Grid及數值節點，沒有JS幾何補償。HP縮寫、counter符號及數值明確translate=no；人物名稱、flavor與intent保持可翻譯，既有scalar更新不得抹掉其翻譯wrapper。版本b6.7，revision `combat-capsule-2026-10-06`；像素／語義／身份回歸及必要性能、真實HTTP測試記錄見diagnostics/b67-combat-capsule-2026-10-06.md。

### b6.7 休息站／過場／橫排結算（2026-10-05）

版本保持b6.7，revision `rest-result-2026-10-05`。RestSite的A Cozy Hovel／A Quiet Pocket／Process標題進入STORY BOX header，完整描述沿原有整段fade流程；Rest／Meditate／Process與View Deck／Back回呼接入ACTIONS。Process重用唯一shared thumbnail、固定原生三個offers和Chaos／Grace／DATA門檻，確認時再驗，沒有扣除門檻貨幣。原rest-content移出mobile snapshot。VIEW CG沿用原背景；shift picker補入相容capture並避開HUD，取消不消耗節點。View Deck去除內嵌🃏，標籤／展開正文均為純文字。

敵方攻擊過場沿用原藝術、色彩、原生dismiss／damage／next-turn回呼；文字使用通用UI role，Next Turn可見按鈕廢止。空白與Enter／Space可繼續，整個HUD／location／其他窗口不推進；原生程式click不得再被owned input攔截。

結算改為owned component.result／view.result／input.result，API的result／settle只讀原版已渲染title／quote／reward labels並提交原生領取或略過＋Continue。獎勵固定同一橫列DATA黃色／GRACE藍色／CHAOS橙色，缺項0、真實數量保留，數字JetBrains Mono、📂／🧭用現有Noto Emoji單色role。對話框約.82寬高比、有界quote捲動，上方結果／中間Rewards／下方兩個寬按鈕。Continue領取尚未領取獎勵再繼續，Skip Reward and Continue不領獎繼續；native claim flags和soft loss／boss／Menu路線不重寫。舊結算可見DOM不再投影。

驗證、before/after、極端網絡與限制見diagnostics/b67-rest-result-2026-10-05.md。新API是schema1 additive contract；沒有新增battle buffer／save或font資源。

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

## b6.8 Full-screen narrative choice standard（2026-10-08）

原版把標題、描述與「現在選擇未來」按鈕放在全螢幕容器時，手機標準呈現為 persistent Top HUD + Story Box（標題／描述／正常 footer），最終可執行選項放在既有 ACTIONS 的單層直接按鈕。這是 NORMAL narrative；不是新全屏菜單或 cinematic，不因原版文字容器不存在而放棄擷取，也不自動打開 ACTIONS。背景按原演出來源明確交付：本次 ONE WITH AVERY 與 terminal finale 都是純黑，不沿用上一段 CG、不添加圖片、不等待裝飾資源。將來有 CG 的 family 必須交付 logical asset/frame，沿既有背景雙緩衝、generation/deadline/dimming及畫質邊界處理；普通 in-scene 背景更新仍是 Level0。重大場景替換才走既有 full-black commit barrier。

新增 family 前先讀原生定義、呼叫者、source controls、選擇條件及清理／導航。在 `lunar.bridge.story_choices` 登記窄 source selector、heading/copy/background、leaf command mapping 與先後優先序；只 LUNAR 讀原生 DOM/globals／路由命令。`adapter.story_choices` 純轉換；`chrome.story()` 與 `actions.read()` 交付 DTO，UI 不認 native family/class/function。不得從 onclick 字串解析命令，不泛化為所有 fixed/黑色 div，不猜不存在的分支。body-mounted finale 優先於 retained passage fork；桌面仍委派原版。來源新增/移除是真正結構變更，允許既有 compatibility capture；已登記 family 的 copy/control/disabled 更新只發 story/actions 局部 domains，不走 capture/workspace/globalfit。

本次 void family：標題 `One With Avery`，Logic 描述 `The valve welcomes you deeper into her body.`；另一 route 使用原生不同描述。按順序 `Proceed (Scat Warning)` → `stgDisposalProceed`、`Proceed (No Scat)` → `stgDisposalProceedSoft`、`Skip Ahead` → `stgVoidTunnelSkip`。原 `stgDisposalWarning` 只建立純呈現 selector，沒有必需的狀態／支付／權限副作用，故本次經審核可直接委派其葉子；警告含义仍顯示在第一個選項。terminal family 的描述與 Main Menu → `stgDisposalToMenu` 保留。不得把這次授權擴大到商店確認、內容同意、報酬或其他有 gameplay gate 的確認。新增 family 如有這些門檻，保留 gate 或明確暴露語義條件，不跳過。

bridge 持有 WeakMap 生命周期，leaf id 綁 root identity、run/load scope、當前 passage 與 source control identity；執行時重查 connected/current/disabled/command availability，先 consume，再透過 native command registry/pause.game 呼叫原函式。遲到／重複／離場／模式變更的 id 拒絕，不存回呼於 buffer，不推動假遊戲狀態。原生 HP=0／over flag／結果／存檔／Skip 的原生延後時序保持；選項執行後由既有 ACTIONS followup 釋放 pause 並等原生內容，禁止重複 dispatch。沒有重寫 STG 本體函式或補成假 HP。

**換行與格式預案：** visible `html` 是完整來源，不使用 `\s+` collapse、trim/split/rejoin 或 innerText 去「扁平化」內容；DOM 本來會把 CRLF 正規化為 LF，兩者都是語義換行。保留 `<br>`、paragraph/list/block、`strong/em` 及安全 inline formatting。accessible `label` 可另外收斂空白，但不能回寫 visible HTML。MOONSHINE 沿既有 rich sanitizer 移除 script/事件/id，直接 label 與 fork description 用 `white-space:pre-line`，保留 BR/block，同時自動 wrap／overflow-wrap，不作 nowrap／ellipsis。過長正文／選項各自 bounded vertical scroll，固定 footer Close 可觸控；不得裁掉 CRLF 造成連字或重組 HTML attributes。canonical source 未改時不重寫 translator wrappers；source 真改只更新 affected copy。一般兩步 dialogue/shop accordions、升級／scan 與翻譯權威不變。

診斷只寫 `LUNAR.story` 的一次 source identity/family/leaf count 與一次 command intent/result，走同一 Logger，不 dump 故事/DOM、不從 Logger 決定 readiness。functional ready 僅依 source/controls 與真正 critical resources；純黑 fork 不等待 previous decorative CG。控制式 visual fixture、degraded capture與真網路證據必須區別。測試：`test_b68_story_choices{,_live}.cjs`（真 native 三 routes、terminal Menu、五 viewport、scope/stale/one-shot、CRLF/markup、translated identity、zero local capture/fit、desktop delegation），加既有 persistent chrome/actions/background/readiness 回歸及4×N3/1×N1四模式報告。


## b6.8 Background visibility / late delivery（2026-10-08）

This clarification supersedes cancelling ordinary CG at the visual deadline: an optional visual timeout records WARN/degraded capture and keeps the latest request alive, while retaining the last committed plate. UI_READY and controls remain usable. A late decoded target may commit only under the existing generation/presentation/connected/recovery guards; genuine failure and supersession still release it. No polling, retry loop, native repair, quality-policy changes or API/UI ownership changes. Declared map dynamic-to-static fallback and true critical deadlines remain distinct. Normal CG cover and viewport geometry must hold before first paint, throughout the incoming buffer and after commit; preserve explicit camera overrides. Require actual scene pixels, not just backgroundImage equality. See [resource contract](lunar/ASSETS.md#b68-background-delivery-deadline-correction2026-10-08), `test_b68_background_visible_live.cjs` and the expanded race regression. Version remains b6.8.

## b6.8 直向鏡頭與開發者演出來源補接（2026-10-08）

使用者 3G 截圖是 Logic `stgLogicDescentChunks` 的末段（DOWN）。原版鏡頭終點 `toSize:100%` 在 Chrome 正規化為 `100% auto`，即只填滿寬度；landscape CG 在 portrait 上有黑邊。VIEW CG 返回把原來源改成 cover，因此先前測試只涵蓋開場 cover 未能抓到這個錯誤。本輪以 cover-relative 百分比解讀手機鏡頭，保留 zoom>100%／位置，decode 完成後在 incoming 第一次 paint 前計算自然比例；不能使用新圖比例拉伸舊 committed 圖。viewport 變更由背景自身 ResizeObserver 處理，無 per-frame 資料讀取、global fit 或 image-load scene gate。explicit contain／兩軸尺寸不重寫；既有原版 CSS camera 動畫被背景 owner 隔離的時序不在本轮調動畫範圍。

Avery Defeat Scene、Chaos/Grace Victory、Boss Ending Final Chunk 與 Logic 吞嚥演出共用 body-mounted `stg-defeat-cine`，不在原 capture selector／chrome root／actions root 內，故按鈕已执行但手機保持原畫面。現由既有 chrome/story/actions 語義接口接收，背景採原版 opacity target 中最上層 authored plate，保留暗色 vignette；正文照常 paragraph fade，Next/Continue/Main Menu 使用當前 source 的原回調。原版裝飾 shake／大字／flash 不接管 mobile chrome。Source styles/content 使用窄 story/actions 更新，不反覆重建 compatibility tree。

`stg-run-stats`／`stg-tease` 結算與預告同樣是 body roots，加入既有 measured compatibility capture；原 grid 的 portrait single-column、scroll 和出口保留。五個 run/combat 前置測試（Force Chyme 4/6、Arc Blessings Lock/Unlock、Void Ending）在 Menu 無 `_STG` 時，前四個原版 helper 會 throw，Void Ending 則靜默退回 Menu；LUNAR 在副作用前拒絕並顯示所需前置條件，正常 run/combat 原函式不變，desktop 不攔截。不是 native gameplay repair，不填造 state。

畫質比例唯一可調來源：`lunar/lunar.graphics_quality.toml`。預設 Fast50 / Standard70 / Fancy85 / Ultra100，允許1–100小數、順序不可降低；Original 不在表內。重新注入 HTML 即生效，不需跑 metadata downloader。Injector 從既有 width/height 重建 declared fit URLs；small/unavailable 來源保留。Logger basic header 的 configuration、mode names、target resolution 全部從同一 compiled registry 顯示。

回歸：`tests/test_b68_background_framing_live.cjs`（真實末段、3200ms late delivery、3G hint、第一畫面像素、兩種 viewport、VIEW CG 返回、Defeat 全流程、reports/teaser）；`tests/test_b68_quality_config.py`（小數／不合法比例／原尺寸URLs）；既有 race/readiness/quality/recovery/choice suites 仍必測。網絡 fixture 與真實 3G delivery 的結果分開記錄，不能把 fixture 換算成手機 FPS 或網速。

Body-mounted cinematic/report/teaser/finale sources also make the normalized mainMenu availability false. This prevents retained Menu DOM from leaving the separate watermark/Mods launcher visible or actionable over an active narrative; Menu teardown restores normal availability. Both generic consumers use existing readonly APIs, with no plugin branches.

Body-mounted cinematic/report/teaser ownership also supersedes retained map/combat sources: LUNAR location/combat contexts become unavailable while that foreground exists, so existing owners unmount and their commands cannot target the old scene. Cine remains NORMAL narrative; report/teaser is OUTSIDE even when the retained passage is Start. Actual passage identity and gameplay are unchanged. The regression enters from Menu, StomachMap and Start and verifies both API availability and removal of old controls; do not rely solely on an opaque visual overlay to block input.

### b6.8 Story LOVE／原版字體退役（2026-10-08）

Story LOVE 使用現有 `MOONSHINE_COMBAT_COMPONENT.counter(parent,label,'love',true)` 的半填充膠囊，放在持續 Story 標題右方；Noto Emoji💘、JetBrains Mono current/maximum、藍色右半填充。沒有 LOVE source 時隱藏同一物件；不替換 Story/HUD。LUNAR 從 Avery/Fate 宣告 status 窄讀 optional love DTO，不呼叫初始化 getter。原 b6.8 adapter 只排除旧 LOVE bar；下方 b6.9 status capsule 契約取代 Fate HP單行文字。status mutation 只到 story domain。

ACTIONS 分離原 `.arc-dlg-lock` 的 LOVE metadata：choice 可換行、heart/current/required 獨立一行、數值不可拆行。locked/met 與原 disabled callback 不變。只讀 clone 用於窄來源 label 擷取，CRLF/BR/block 不壓平；visible label 不因 badge 數字改變而重建，普通 accordion 語義保留。LOVE copy/數值用 mono，符號用 emoji；新元件不走 workspace。

原版 family 的 mobile presentation 全部進既有 logical registry，包含 ending SVG `font-family` presentation attributes、CSS `font` shorthand、rich inline styles。Cinzel/Crimson Pro 等 display/serif 對應 UI，Consolas/Courier New 對應 mono；不再請求原版 Google fonts，仍用可逆 import gate。不新增 font resource、source face/subset 或原版 core edits。此授權取代 FONTS.md 舊「不改 native typography」的限制。具體要求見 diagnostics/b68-story-love-requirements.md；驗收見 diagnostics/b68-story-love-2026-10-08.md。


## b6.9 Statistics Report / narrative continuation（2026-10-09）

使用者設計：[需求](diagnostics/b69-run-report-requirements.md)，五張參考圖在 `design/b69-run-report/`。`synodic.build.toml` 是 runtime/header/footer 共用版本 authority；本輪 b6.9，revision `run-report-2026-10-09`。

- `stg-run-stats` 與 `stg-tease` 是明确的 RUN_REPORT / END_NOTICE presentation，取代 b6.8 把它們列為 OUTSIDE 的暫時兼容 admission。只有這兩個已登記來源，不能把普通空劇情／任意 fixed DOM 推測為結業或告示。保留 persistent HUD／Story nodes，report/notice reason 下 suspend + inert，report 以一次 opacity entrance 接替所有正常 UI。真正 scene/profile replacement 仍服從 opaque root guard。
- LUNAR 在來源 root 初次出現時保存本次 frozen report DTO、native root/button/run/scope 身份。Native `stgAlignProfile`／`stgAlignSignature`、原報告 row 數值與排列、native 分組排序 refs 是 authority；純 adapter 只把六軸正規化為 score/sum×100（零總和為0）及卡名數量。不重算玩法、扣款、卡牌效果、存檔或流派混色。Playtime/HP/report 都是結業時快照，不跟無關 HP 刷新反覆改寫。
- 背景保留同 run/scope 的最後 narrative CG，開發者直接 report 而無 narrative 時用原版 report plate。CG descriptor 走既有 latest-generation 雙緩衝及 optional deadline，不引入 Loading。Coming Soon 只窄讀原版兩個 teaser plate 中當前 active authored target；保留原 slideshow timer／順序／停機回呼，UI incoming-only fade、固定暗化層，不恢復 obsolete frame。Menu underlay parking 不銷毀同一 notice。
- 新畫面由 component.run_report/view.run_report 直接建立於 owned root，零新 hidden-workspace transit。Mono 用於 report copy/數值/header/footer，UI 用於標題／按鈕，Emoji 用於 shared upgrade icons。固定按鈕列獨立於 scroll；scroll 只到列上方，footer永遠可捲到。Card pills用既有 family palette；min44px targets，mini54×58。Viewport/zoom只local geometry；無 asset-triggered global fit。
- 卡牌詳情沿用 `bridge.cards.inspect` 的既有 standard projection／armed native backdrop，manual top layer 保留父報告／translated nodes／scroll／focus；不新增 card renderer。升級迷你卡重用現有 upgrade symbol 和 ACTIONS.preview（包括完整 desc/flavor），backdrop／Escape 回報告。查看不是授予/receipt/交易。
- Continue/Return 只 dispatch 當前活著的原版按鈕一次；run/scope/source 替換或重複請求拒絕。Grace按原 callback接epilogue及後續故事；Chaos/Logic按原 callback進告示。沒有泛用跳過故事、解析onclick或代寫native router。
- Save Report是一次明確玩家請求的 owned DOM canvas export：讀完整內容區一次、線性量測可見/翻譯文字的實際換行，畫進度條／卡組／upgrade／footer；排除底部操作列。當前 selected CG用anonymous CORS decode，最多5s／現有animation deadline；暗化背景和所有資料進同一長PNG，不改動／捲動／克隆live DOM、不用foreignObject或遠端依賴。只在匯出暫存Image/Canvas/Blob，釋放src和download URL，無新cache。極大圖用32MP/32760px bounds等比縮小，保留所有資料。Optional art failure仍輸出degraded PNG、missing logical asset ID和可讀狀態；真正PNG失敗有ERROR+重試，非fatal。
- 更新 domains：`runReport`只刷新report/presentation；body report/notice mount/remove以source admission路由，來源樣式/slideshow更新不full capture。不相關標量/translation不讀patch報告。新API詳見 lunar/README；Logger only observer，見 LOGGER_USAGE。

驗收 `tests/test_b69_run_report{,_live}.cjs`：真實Chaos/Grace最後Continue、Grace report→epilogue→Coming Soon、Logic告示、卡牌/升級返回、五portrait尺寸、frozen百分比/原版混色、短/長/失敗背景PNG、unrelated HP zero capture/fit/translated identity、公開/私人、既有background/readiness/graphics/fork回歸；四模式4×N3 before/after與獨立1×N1保留。控制式 SVG/CORS/delay是fixture，不冒充真機或CDN3G。

### b6.9 report visual refinement（2026-10-09）

版本仍b6.9，當前revision `report-visual-2026-10-09`；[使用者五張參考](design/b69-report-visual/README.md)。本節取代上節report卡組min44px及PNG全高cover的視覺細節，API／source DTO／callback／readiness／font ownership保持。

- 網頁進度條fill佔完整track高度，track膠囊裁切，輪廓在fill之上疊加；不讓border縮進fill而露內側黑縫。PNG使用同一full-height fill→膠囊clip→inset contour次序；不能將child rectangle直接畫到沒有parent clip的canvas。0/低百分比/100%仍按native比例，不把fill endpoint擅改為第二個pill。
- 明確依使用者指示，僅report卡名pill由44px降30%為30.8px（瀏覽器30.796875px）；字居中、長名可換行而增高、family色保持。Save/Continue等主要控制仍44px；不全局縮小其他卡牌／按鈕。
- 長PNG以live viewport的CG尺度在頂部horizontal-center/top放置，不依完整report高度再次放大。底圖純黑，黑色overlay從頂部68%、40%位置80%、80%位置96%，至fadeEnd100%；fadeEnd=min(viewportCG高度,footer起點)，因此picture下緣之前已純黑，footer周圍純黑且無硬切。網頁報告原78%暗化和generation background owner不變。
- Export鎖定已committed的CG URL（pending/空值才取model target），在同步resolved-resource scope讀descriptor，避免因profile刷新重新選其他variant。anonymous CORS/decode有限等待和degraded PNG+missingasset保持；不改quality、functionalready、assetcritical政策，不把本輪視覺改良說成CDN故障修復。
- `test_b69_report_visual_live.cjs`用DPR1/2、0/1/25/50/80/100%和真正web/PNG像素驗膠囊角落／filled端／純黑footer，舊版negative辨識矩形角與44px／未漸黑。原report native continuation／translation／失敗CG／五portrait回歸保留。必要4×N3及1×N1另測；真CDN實際PNG與受控SVG分開記錄。


## b6.9 Story choices, continuity and Lab notices（2026-10-09）

This repair uses the user's exact injector-produced IC input, in addition to the accepted b5 control. `bridge.actions` excludes explicit native `hidden` / inline `display:none` on controls and their ancestors for every supported story family. Never infer eligibility from a compatibility-suppressed visibility or from the translated visible tree. Executing a handle revalidates the current normalized model; a previous paragraph's hidden/removed button cannot dispatch. When a native update changes both HUD rewards and choice/content domains, ACTIONS refresh takes priority over scalar state-only patching. Native claims, rewards, routes and callbacks remain authoritative.

Ordinary same-passage re-entry with a declared active EncounterEvent/BodyExploration/Blessing prose source bypasses Level1 only when no transition is active and no report, teaser, defeat cinematic or art-view foreground exists. This is source admission in LUNAR, not an extra UI router. Other passages, combat, maps, system Loading and major presentations retain the opaque commit barrier. Native source preparation remains synchronous; the UI keeps the same HUD/Story Box and translation parents.

EncounterEvent now publishes a narrow `chrome.background()` DTO to the existing owned background surface. Native `.ev-bg` / `.ev-gradient` are omitted from its mobile compatibility snapshot. A new source root does not destroy the committed plate; the existing generation-checked double buffer owns decode/crossfade/release. The established gradient sits above both plates, uses the existing dimming variable, and has no inherited native entrance animation. Background-only changes use the resources.background route and do not rebuild story text. Omitted EncounterEvent plates publish no compatibility patch target; their data goes solely to the semantic background owner. Other background families retain their existing owners.

The Lab Coming Soon overlay is an ordinary dismissible notice, distinct from END_NOTICE. LUNAR reads only that declared source and exposes frozen `labNotice.read()` plus validated `close(id)`; MOONSHINE directly mounts a scrollable, portrait-sized dialog using shared components and UI font roles. Native Close returns to the retained Lab. Source/run/scope/passage/consumed validation expires old commands; source mount/removal is only `labNotice`, not a new full-workspace route. Translation identity survives unrelated scalar changes; pause and focus are released on close/teardown.

A fresh browser on the exact IC input keeps Relax Against Arc’s Panties locked after the initial upgrade. Native `stgArcTranquilSeen` is a persistent unlock outside a save/new-game reset. Do not erase legitimate prior unlocks or reinterpret them as per-run state. The changed-only `INITIAL_BLESSING_ELIGIBILITY` breadcrumb records native seen/claimed/proceed status; native Proceed sharing shortcut classes is a distinct step. The later IC2 follow-up below supersedes the initial-entry admission and clean-storage-only diagnosis.

Regression: `test_b69_story_actions_live.cjs` exercises native scan/bench/tile callbacks, stale command refusal, chrome/background continuity and five portrait notices. Controlled delayed SVG/decode tests are not A35/CDN/FPS evidence. Same four-mode 4×N3 and separate1×N1, native/input equality, injection idempotence and public/private optional-module audits remain mandatory. See [evidence](diagnostics/b69-story-actions-2026-10-09.md).

### b6.9 IC2 initial entry / branch exits / appended prose / Emoji（2026-10-09）

Revision `story-followup-2026-10-09`, version still b6.9. The exact user IC2 input retains the same native core as the prior IC. Injection assembles the current source without changing the native bodies; existing embedded Emoji coverage/bytes are unchanged. No injector-specific font rewrite or new face is needed.

- Native boon confirmation normally navigates to Lab. The mobile deferred initial-entry group intentionally retains the first screen and entry actions; native boon-picked must not reinterpret that retained screen as a revisit. Both persistent skip-blessing buttons stay disabled in this group, even with seen history from older runs. Real Lab revisits and distinct claimed-blessing Proceed retain native eligibility/callbacks. Never erase localStorage, saves or permanent unlocks; this is source/command admission, not a new gameplay ledger.
- In BodyExploration the utility `.body-exit-btn` remains physically retained while a committed response runs. Admit it only during the node-choice phase, never when `#enc-choices` is explicitly hidden or a response `.enc-page-continue` is active. The response exposes its actual Next/Continue, and execution revalidates the same phase so old exit handles cannot escape. Free node navigation and native final reward/exit callbacks remain unchanged.
- Pending narrative uses the full published rich copy. After completion, ACTIONS reads the current declared native text, so instant appended prose is a new narrative and releases its follow-up pause. `chrome.story().extension` optionally identifies an instant sensory child and its normalized content anchor; it carries no DOM, scroll coordinates or command.
- MOONSHINE detects strict append from canonical normalized blocks, never translated DOM text. A proven unchanged prefix uses the shared catalog's partial `append`, preserving earlier paragraph/prose/translator wrappers and caching the new complete child source. Replacement/non-prefix changes use the existing patch. Same main paragraph/scene + new extension scrolls only the owned STORYBOX to the added block; ordinary new paragraphs still reset to the start. Scalar/background/repeated DTO refresh preserves manual scroll. Focus is synchronous and local, so no delayed callback can scroll a later scene; no global fit, polling or source recapture is introduced.
- Shared ACTIONS/upgrade-preview/scan-row Emoji fitting resolves the computed logical family before Canvas measurement. Canvas rejects `var(...)` font shorthand; its old fallback metrics measured another font and left Noto ink clipped. Use the actual ink/font bounds, cell budget and existing local readiness/resize cache. Root symbol cells are eligible for local fit too. Keep Noto Emoji symbols and existing text roles; no CSS overflow escape, manual per-icon offset, font payload or new network dependency.

Regression/evidence: `test_b69_story_followup_live.cjs` with original IC2 negative and rebuilt IC2/public/private controls, DPR and portrait checks, native retained-response and real revisit, append/translation/pause/manual-position checks. Controlled SVG and host Chrome are not physical A35 or CDN evidence. See [diagnostics](diagnostics/b69-story-followup-2026-10-09.md).


## b6.9 Embark / scan completion / autosave / collapsed LOVE（2026-10-09）

This section supersedes b6.6's zero/partial scanner Continue allowance and the b6.8 LOVE summary wrapping exception. Version remains b6.9; build revision `lab-scan-saves-2026-10-09`.

- Reuse `labNotice` for the exact `stgLabConfirmEmbark` and `stgBoonConfirmEmbark` sources. LUNAR registers only a newly created declared Lab overlay, supplies `kind`, optional confirm label/disabled state, and validates `confirm(id)` / `close(id)` against source/run/scope/passage/consumed lifetime. Initial completed-upgrade Embark delegates to the original Lab confirm instead of synthesizing a different modal. Native boon/Embark effects remain original callbacks, once only; Arc's distinct choice overlay is not admitted. Desktop delegates unchanged.
- MOONSHINE owns the existing notice shell, stacked capsule Confirm/Cancel, logical UI/Emoji fonts, bounded scroll body, local viewport geometry, pause/focus/Tab/Escape and top-layer stacking. It never constructs a game destination or reads native buttons. Unrelated scalar updates preserve translated dialog and persistent HUD/Story nodes.
- Positive-target interactive story scans publish `canContinue` only at full native temporary-session progress. Zero/partial Continue stays disabled, and `bridge.scan.proceed` independently rejects premature settlement. Scan-only notifications patch the existing scanner check and Continue row locally, with no full capture/global fit or callback replay. Noninteractive zero-target compatibility scans retain their existing exit; read-only archive/inspection never issues settlement. RETURN preserves partial progress.
- Auto load moves entirely to `bridge.saves.loadAutosave` / `api.moonshine.saves.loadAutosave()`. Read the original saved payload on request, validate current native picker/run/scope at confirmation, deserialize once and navigate through the original `stgGoTo`. Cancel/source replacement expires the command. UI does not deserialize, construct audio/game state, or reference SugarCube Engine. Keep native serializer/save keys/manual slot callbacks untouched; do not reset or migrate saves.
- LOVE requirement uses the ordinary one-line truncated summary and collapsed capsule. Full text and separate nonbreaking LOVE badge live only in selected detail. Numeric/LOVE text stays JetBrains Mono logical role and glyphs Noto Emoji. Native disabled/condition/execution authority is unchanged.

Regression: `test_b69_embark_scan_live.cjs`, `test_b69_autosave_load_live.cjs` (old negative and true native manual/auto comparison), updated `test_b66_scan_flow_live.cjs` and `test_b68_story_love_live.cjs`. Public/private/current IC4 and historical IC2/IC3 builds, before/after four-mode4×N3 plus separate1×N1, native equality/idempotence/module/font audits and limits are recorded in [delivery evidence](diagnostics/b69-lab-scan-saves-2026-10-09.md).

### b6.9 ending ACTIONS and retained thank-you notice（2026-10-09）

The latest user correction supersedes the full-screen fork's single-click presentation policy. Every narrative progression row, including cinematic Next/Continue, flat branch leaves and interactive scanner Continue, uses the shared accordion: first click selects/reveals; the second dispatches the validated native command once. Flattening still removes only the native nested warning gate; it never removes the UI selection step. The terminal full-screen Main Menu command and report/notice primary controls retain their explicit direct-button policy. Embark confirmation uses plain text, without an appended arrow. Collapsed summaries remain one line; selected full labels preserve authored CRLF/LF, BR and block boundaries. Registered full-screen leaves keep their44px touch minimum.

Native `stgTeaseQuietUnderlay` parks the hidden passage on Menu after the body-mounted notice exists. LUNAR's run-report owner admits exactly Menu + connected teaser + the native parked flag as retained underlay cleanup; this does not start a scene curtain or apply pending quality to a foreground CG. Actual Return to Menu removes the teaser/park flag first and retains its normal scene barrier. No native function body, timer or route is rewritten. One observer breadcrumb `END_NOTICE_UNDERLAY_PARK` replaces the misleading story-continuation label for this case.

MOONSHINE transfers only an already committed, decoded owned background into the successor notice before releasing its predecessor. Incoming layers, timers and callbacks are never transferred. The established notice dimming and generation-checked target crossfade stay active; delayed/failed new gallery art retains the carried plate. Native slideshow order is unchanged. `test_b69_ending_actions_live.cjs` compares the real Grace epilogue/notice path against the prior injected input, checks every first click leaves native story unchanged, samples test-only frames for no curtain/Loading/empty plate, and confirms explicit Menu exit still transitions. Controlled images/DPR3 remain host-browser evidence.


## b6.9 Narrative status capsules / stable chrome during shake（2026-10-09）

版本維持 b6.9，revision `story-status-2026-10-09`。劇情角色 HP 改為 Story 標題中的紫色半填充膠囊，放在既有藍色 LOVE 左方；沿用 `MOONSHINE_COMBAT_COMPONENT.counter(...,'hp',true)`，不是新的血條物件。HP 與 LOVE current/maximum 使用 JetBrains Mono，LOVE 符號使用 Noto Emoji；縮寫及數值 translate=no，人物／正文仍可翻譯。沒有對應來源時隱藏同一物件；窄螢幕標題可正常流換行，不重建 shell。Top HUD 的玩家 HP 是另一組數據，保持原用途。

LUNAR `chrome.story()` 新增 optional `hp:{current,maximum}`，僅讀目前 declared panel 的 `.avery-love-wrap .fate-avery-hpnum`；LOVE 來源同時涵蓋 Fate／Avery 及無 ID 的 generic `stgCharStatusHtml`（Savannah）。純 adapter 驗有限非負 current、正 maximum，移除舊 status wrapper／track／單行 HP。不得呼叫會初始化的 pool getter、重算玩法或複製為另一組遊戲狀態。Status mutation 只路由 story；數值局部 patch 不重新套正文、改翻譯、full capture 或 global fit。

原版 `body.stg-screen-shake` 的 transform 即使是 identity matrix，也會改變 fixed 元件的 containing block，造成 HUD／Story 座標瞬移。Mobile CSS 在第一幀即抑制 source body 與 copied root 的 page transform；LUNAR 的既有 updates/effects bridge 只辨識該 class 的出現、發布 semantic `target=background`。只有已宣告 shake class 改動的 body mutation 不觸發兼容全量 capture；其他 body class 仍按既有路由。MOONSHINE 的 effects owner 以獨立 `translate` 在既有 owned 背景上演出，沿用 transition coalescing／cancel、native FX preference、reduced-motion；不變形 body／root／persistent chrome、不逐幀查 native 或建立新的動畫 authority。

Mobile snapshot／ACTIONS 不再呈現原 `.stg-deck-btn-row`／`.stg-view-deck-btn`；牌組入口統一到既有 Tiny Information，保留原生來源 callback 和 desktop。原版函式正文、injector、字體 payload、native HP pool／規則／save schema／解鎖不變。

驗收：`tests/test_b69_story_status_live.cjs` 的 before 負對照、真 native Fate 入場/heal、body SFX cue、五 portrait、HP-only zero capture/fit、翻譯／物件身份、Tiny Deck、reduced motion、Savannah native talk、無來源隱藏；另保留 effects／LOVE／persistent chrome／background race／ending 回歸。性能／原檔與注入完整性及 host Chrome fixture 限制見 [本輪證據](diagnostics/b69-story-status-2026-10-09.md)。

本輪 effects 回歸亦發現戰鬥 shake 仍指向已退役的 compatibility root；同一 effects owner 改指向現有 `#MOONSHINE-combat`，保持 HUD sibling 固定，不新增 fallback renderer。舊測試的 pre-b6.7 card selector 同步到現行 owned combat。

HP／LOVE隱藏屬性採 changed-only 更新；不存在status或visibility未變時不重寫hidden，避免無關state刷新增加owned DOM mutation。

## b6.9 發行前生命週期審計（2026-10-09）

版本維持 b6.9，revision `release-audit-2026-10-09`。先保存未修改公開構建／來源 hashes，建立當前四模式4×N3＋獨立1×N1、圖片與八輪流程基線，再做窄修；歷史性能數字不作本輪結果。完整六項交付見 [發行前審計](diagnostics/b69-release-audit-2026-10-09/README.md)。

LUNAR transport 的 Node-owned callback handle 在既有 native capture 邊界退役：已斷開或已進 passage-out 的來源失效；重新連接／重新發布可沿 WeakMap 身份重登記。已發出但退役的 handle 返回 false，未發出／未知 handle 繼續拒絕；不將晚到的合法舊回呼升為 Recovery fatal。DTO 的 optional `transient` 只描述此生命週期，不轉移遊戲權威。全局原生 routes 和普通 callback 保持原有行為。

MOONSHINE 在既有 workspace sync／snapshot 邊界刪除離場 dispatch index 的強引用，保留 WeakMap 身份；Node-owned transient callbacks 只由当前 UI 物件持有，不進全局 callback cache。這不是重建 Story、搬動原生 DOM、清空圖片快取或改 pending rich text lifetime。保留當前背景＋incoming 雙緩衝、Combat、翻譯 wrappers 和所有現有控制語義。

Tiny Information overlay 明確使用 `minmax(0,1fr)` track；panel 高度以已扣除安全區域的父容器內高為上限。Installed Upgrades 使用剩餘高度和原有捲動，Close 保持固定尾行。只改 UI CSS，不新增量測／timer／全局 fit；visualViewport 高度／offset、系統 top/bottom inset 仍由既有 display owner 處理。

不得新增全目錄強制刷新、silent reload、強制 GC 或以降低畫質／刪動畫作性能改善。Error 5 目前只確認為 A35 Chrome 的整頁崩潰；系統 LOW_MEMORY／SIGNALED 未能對應其發生時間，不能宣稱該錯誤已修復。實機長時間和 fullscreen 驗收另列限制。

## b6.9 六項性能複審（2026-10-10）

版本 b6.9，revision `perf-focus-2026-10-10`。先以 test-only render phase 計時重新建立同一四模式4×N3＋独立1×N1基線；只新增 Mods eligibility DTO，非主菜單先退出，不讀縮放值／catalog。`read()`、原生主菜單資格和模組偏好不變；不增加輪詢、Logger hot-path 記錄、圖片請求或 reload。

原版隱藏 DOM 的 layout／來源擷取條件不能直接以 display:none 取代；stgPlayFillWipe 原生正文不改。Native Audio 和 Browser Image 使用隔離對照，實機 CDN 不以本機 fixture 或 headers 冒充。六項處理分類、數據、限制和回歸見 [複審報告](diagnostics/b69-perf-focus-2026-10-10.md)。

## 原版隱藏 DOM 的長期支援決定（2026-10-10）

依使用者決定，正式登記 [TD-001：原版隱藏 DOM 的效能依賴](TECHNICAL_DEBT.md)。現階段維持現有程式與相容流程；本次只更新文件，b6.9／revision `perf-focus-2026-10-10` 及已交付 HTML 不變。

後續隨遊戲本體更新檢視受影響來源，按實測成本、原生尺寸／回呼依賴與替代接口成熟度安排局部遷移。每項執行改動仍須提供基線、根因、前後數據及功能回歸，遵守現行四模式4×N3與獨立1×N1規範；不能安全替代的部分繼續保留。此決定不啟動全面原版重構，不授權新增同類依賴，也不將未隔離的 Layout 或 Error 5 歸因於本項。
