# b6.6 Asset Profile／Critical Loading

版本維持 b6.6；規格見 [使用者設計](../diagnostics/b66-assets-requirements.md)，量測見 [本輪報告](../diagnostics/b66-assets-2026-10-03.md)。資源狀態是 Runtime infrastructure，不是遊戲權威或 buffer。LUNAR 不建立 Loading DOM／動畫；MOONSHINE 只透過 `api.moonshine.assets` 消費資料和提交意圖。HECATE 的命令也受資源 input lock 限制，公開包仍沒有其專屬 API／本體。

Loading 視覺修正維持上述API：MOONSHINE單一140ms opacity Web Animation完成後才hidden，反轉接續現有opacity，縮減動態直接完成；Mods入口直到shell淡出完成才恢復。無額外LUNAR通知、鎖定、資源等待或game timer，詳見DEVELOPMENT／元件目錄。

## Loading Policy 覆蓋（2026-10-03）

資源 CRITICAL_LOADING ≠ Loading presentation。LUNAR transitions.core 為独立純語義 lifecycle；初次 system／ACCEPT system、原生導航 scene、普通 request silent。MOONSHINE API 的 transitions 僅 status/subscribe/onPresent，assets 對消費者排除私有 navigation/cancelScene。Status.locked 合成資源／候選及 transition 鎖，直到 scene crossfade completion 才解鎖；Scene input lock 不 pause 原生準備。Same-passage navigation revision 獨立於資源 epoch，舊資源/解碼/動畫完成不得結束新transition。

Scene critical failure 改為 ERROR → 原生 safe Menu recovery，不再「失敗後繼續半個新場景」。cancelScene abort 有界 fetch、增加epoch、清鎖；12秒 semantic watchdog 包含 UI/decode尚未完成，recovery 再失敗不遞迴。原生歷史不管理全部 game globals，因此沒有虛構 transaction rollback。初次 bootstrap artwork 失敗仍允許 usable Menu fallback、profile failure仍恢復舊方案；詳見 DEVELOPMENT 的新政策。request start/ready/error 與 system/scene events分開，普通asset無presentation事件。

MOONSHINE 背景 decode 是最多4個短期消費者，目的為不顯示未可解碼的 target background；沒有 createImageBitmap、自有 decoded cache 或常駐Blob。取消／crossfade結束清src/handler，不把圖像decode當遊戲通知。詳細交付及測試：[Loading policy](../diagnostics/b66-loading-policy-2026-10-03.md)。

## Manifest 與來源

`lunar.assets.manifest.json` 在構建時打包為不可執行的 `LUNAR-asset-manifest` JSON，schema 1：

- `profiles.<id>.available`：完整 UI／資源方案是否可用。正式包只有 mobile=true、desktop=false；原版 desktop 委派不是新的完整 SYNODIC profile。
- `assets[]`：`id/source/pack/critical/kind/profiles`。穩定 id 解析到 active profile 的來源，再經原有 60／30／40% 顯示尺寸×DPR 的圖像策略；已適配 URL 不疊乘縮放、不回退原尺寸。
- `packs`：critical/menu/common/map/combat/story/shop/deferred。menu.background 是首屏必要背景；map.background 不因將來可能使用而預載。
- 注入器把輸入中其餘 Wix 圖像字面 URL 建立為 `native.<hash>`，保守歸 deferred。這是索引，不是下載清單；沒有推測所有敵人／角色歸屬，也沒有把整個 deferred 包下載。
- `initialScene=menu`，上下界 700／900 CSS px、穩定窗口750ms、單個受控請求8秒 timeout。metadata 一次解析並建立 Map，resolve 不遍歷 manifest。

首次開啟當前完整方案為 mobile，包含較寬 viewport；不因窗口大小選不存在的 desktop。顯示模式的原版桌面委派與資源方案可用性分開。沒有新增 desktop UI、Service Worker、自有持久資源 cache 或任意 URL 發現服務。

## API／狀態與工作集

`status()` 提供小型 frozen DTO：profile/state/scene/candidate/locked/error/errorCode/available/requested/failed/aborted/bytes/pending。`resolve(id)` 取得當前方案 URL；未提供的 profile key 返回 null。`source(url)` 為 bridge 兼容入口，索引原始與各方案 URL，切換中返回 null。未知 mobile 來源只允許既有實際 consumer 使用，不加入預載；未知 desktop HTTP 來源拒絕。沒有掃描網路或推測第二套實體 URL。

`start()` 在 image adapter／resource bridge 可用後立即開始最低必要資源，與原版初始化並行。`presented(scene)` 在 MOONSHINE 確實建立 controls 後加入同一工作，不把空根節點當成可用首屏。bridge 提供 passage＋run scope 身份；相同身份重繪不重啟 Loading。換 passage／成功載入的新 scope 取消過期工作，舊 generation 完成不解鎖新場景。

`BOOT → PROFILE_RESOLVING → CRITICAL_LOADING → READY`；首屏只等待 critical 和當前 scene 的實際必要背景。bridge 僅讀當前 passage 的明確背景節點及已啟用的 body 背景，最多8個節點／4個不同 URL，不掃整份 DOM／catalog。Start 歸 combat、Map 歸 map；shop／story 在實際進入才選取。首屏的必要 UI 是本地可用控制項，不等待遠端字體。初次必要 artwork 失敗記錄 ERROR 後放行可用 UI，沒有永遠 Loading 或遮擋確認的 toast。

`request(id, pack, owner)` deduplicate 當前方案＋URL、`cancelOwner(owner)` abort 自有 pending fetch。受控請求使用原生 system clock／AbortController／cache:default；它們不進 game timer registry、不為 timeout 自動發 game emit，暫停不阻止資源完成。圖像 decode 留給瀏覽器的可見 img／CSS consumer，不再把相同背景額外 decode 成 ImageBitmap；Blob 只讀 size 後釋放、不保存。已完成 metadata 最多64筆，scene/profile 清理；sized URL approval 最多256筆，換 profile 清理。沒有強制清 browser HTTP cache，decode 不保證 Chrome 自己的 HTTP／圖像 cache 立即釋放。

正式呈現使用 `presented` 加上 bridge 的當前背景清單，沒有新增無 consumer 的預載接口、沒有列舉下一個不確定場景。當前 authored encounter sequence 的下一批最多3個不同 CG 保留原有有界預載，下載責任改由 LUNAR，sequence／scope 結束取消 owner。圖像到達不推進故事、不改原生 ASMR／CG 時計。

## 請求建立前的 gate

沿用既有 injection 的 img.src／setAttribute、innerHTML 中 Wix URL、background/CSS/textContent 轉換邊界，先解析 active profile 再建立來源。圖片內聯原始碼與遊戲函式正文不重写。兩個定義時橋接 `stgPreloadImages`／`stgWarmAudio` 在 mobile profile 禁止原版「之後可能使用」的整批背景／音訊 warm；實際 BGM／畫面／場景仍按原生使用入口載入。這兩個 hook 不是全面攔截所有 fetch／Audio／HTML parser。

自有元件新建非 critical `<img>` 設 lazy／async，圖片 load 僅標記其 component geometry。原生 menu/map 裝飾背景在自有根接管時不再繪製，不能把這項 CSS 當成 gate 的證據；請求實際清單另由 CDP 驗證。首屏背景的受控 request 用 high priority，其餘普通 scene／預載用 low；沒有所有圖片 high。

原版 mobile 不用的 Cinzel／Crimson Pro import 在生成 HTML 時可逆 gate，後續 STYLE 同樣經 LUNAR 門控；MOONSHINE 字體來源／readiness 全部委派 LUNAR Font API，沒有 link／FontFace loader。bootstrap 只有兩個內嵌 WOFF2 子集（3,964＋1,668＝5,632B），OFL 許可一同打包、衍生字體內部名稱已改；動畫不等 fonts.ready。其自身 CSS／字體事件不失效原生樣式 cache，routine install 僅在 stylesheet 文本／profile／尺寸／resolution 改變時重新轉換；WeakMap 不保留離場 stylesheet。

## 顯式切換與失敗

只在另一完整 profile 可用時啟用750ms resize穩定檢查；單方案時連 debounce timeout 都不建立。越過900可候選 desktop、降至700可候選 mobile，中間保持；不逐 frame polling。MOONSHINE 彈窗鎖 input、保留焦點、Tab 在兩按鈕內循環、Escape 等同 KEEP。KEEP 對相同候選方案在本次 HTML session 不重複提示。

ACCEPT：`SWITCHING → CRITICAL_LOADING → SCENE_RESTORE → READY`。停止舊 URL 建立、abort 自有 pending／清 metadata、選新方案、最低必要和當前背景、等待 MOONSHINE 的 profile layout 提交／geometry、恢復、解鎖。LUNAR dispatch／port invoke／故事／ACTIONS／圖鑑及可選 HECATE 命令門檻再次檢查 lock；不只在 UI 遮罩攔截。此時 MOONSHINE 自有 pause owner 凍結 game timers／非BGM媒體，UI/system resource clock 繼續。

失敗回到仍可用的舊 profile，SCENE_RESTORE 回呼重套舊來源；ERROR 解鎖並釋放 pause，MOONSHINE 顯示可關閉文字提示。沒有留半切換方案繼續遊玩。正式 desktop=false；回歸使用 test-only complete desktop URL fixture，不能當作正式 desktop 驗收。

Logger 使用固定 `LUNAR.assets` scope、小型 counters：PROFILE_DETECTED／SELECTED／CHANGE_DETECTED／KEEP／ACCEPT／SWITCH_START／SWITCH_READY、ASSET_LOAD_START／READY／ASSET_ABORT／ERROR、PACK_LOAD_START／PACK_READY／PACK_LOAD_FAILED；PROFILE_SWITCH_ERROR 也涵蓋 layout 提交拒絕。elapsed 是 system clock，bytes 是成功 Blob payload bytes，**不是** HTTP transferSize；失敗／尚未完成的網路 byte count 不假裝0。CDP completed encodedDataLength 在報告另記。沒有 manifest／DOM dump、per-frame breadcrumb 或新增 IndexedDB asset cache。

## 已知範圍

沒有重寫 SugarCube／原版 asset 系統：原生實際進入畫面時的 eager portrait/card/CG、BGM／音訊使用、原生已發出的 image/CSS/media 請求仍由瀏覽器管理，不能由 AbortController 保證取消。受控 pending 和自己的 working set 才是本輪清理對象。原版 HTML 包含的大量 inline 程式仍須解析；本機 file 測試不包含 HTML 下載。Loading shell 很早建立，但不能搶占同一 main thread 的長段 native boot JS；不能把 mark 時間冒充實際 paint。未證實的 Chrome error5／OOM 維持原有問題紀錄。

新增第三方資源／完整 desktop 方案時須明確補 key、可用性與必要背景，不用「未分類就全部下載」作回退。後續若需重寫原生 eager 建圖／Audio 流程，先報告實際範圍，再按使用者授權處理。

地圖出口的region切換可能只呼叫stgMapBoot、不發SugarCube導航。resource bridge只讀run scope＋currentSubmap，在MapScreen內region實際變更時發scene semantic；同區waypoint／HP／普通重繪不觸發。native inline exit回歸使用stgEnterNode，不以改passage冒充區域切換。

System的onPresent acknowledgement等待原有140ms shell fade completion後才END/解除input lock，包括profile失敗退場；Bootstrap show/hide回傳同一冪等完成Promise，反轉resolve舊意圖，onfinish才hidden。無新timeout／遊戲事件／每幀處理。

## 本輪修正：presentation失敗可繼續（2026-10-03）

使用者最新要求覆蓋舊的「所有background failure均safe Menu」。failurePolicy=continue僅允許裝飾presentation降級，required默認strict；明確 critical readiness 始終strict（包含profile切換）。scene pack catch檢查epoch，每工作集最多4筆unavailable；request()仍reject，普通request無全局Loading/lock。消費者僅讀presentation()/presentationFallback(url)，O(1)索引，MOONSHINE限時1.5秒decode/fallback。UI/state未ready仍12秒watchdog safe Menu。沒有新永久Blob/cache或預載/retry。

### b6.8 功能就緒與視覺穩定（2026-10-06）

使用者最新要求：[slow-network readiness](../diagnostics/b68-readiness-requirements.md)。資源 `readiness` 分 critical／important／decorative；原 `critical` 欄位只選必要pack rows，blocking authority改由readiness明確決定。只有critical fetch及decode可阻塞；未知required默認critical。Main/menu背景為important、build-time原生CG為decorative；當前pack/visible來源依原請求路徑啟動，但不等optional completion、不預載deferred catalog。explicit profile switch也只對真正critical失敗rollback。

`UI_READY` 表示LUNAR可读／既有MOONSHINE結構與控制項已提交並解除鎖；MAP還要求owned nodes非空。`MAP_UI_READY` 是owned map事件，不做新的capture/fit/polling。Optional images自行paint，不做第二個blocking decode consumer；critical維持1.5秒decode上限／reject及原12秒UI/state watchdog、safe Menu recovery。Level0/1/2語義、兩段140ms fade與UI ownership不變。

Test-only `helpers/visual-readiness.cjs` 的 full visual oracle只指定當前截圖重要targets，重要程度僅對該capture生效，另記LUNAR functionalTier；不枚舉全頁all images。Deadline30秒（stall fixture1秒），到期仍截圖＋JSON missingAssets(URL/tier/functionalTier/reason)；decorative不成functional oracle。真正critical missing仍判失敗，保留截圖。`ASSET_DECODE_TIMEOUT`／`VISUAL_CAPTURE_DEGRADED` WARN與`FUNCTIONAL_REGRESSION_PASS` INFO清楚分開；runtime optional fetch failure WARN、critical ERROR，status.failedCritical/failedVisual與criticalRequested獨立計數。無新runtime視覺ready輪詢／logging讀取／全面性能重構。

Scanner（2026-10-04）：圖片 URL 仍由 LUNAR images adapter 解析當前mobile profile，只在玩家開啟 Scanning Module 時由自有實際consumer請求。不增加 startup/profile critical pack、預載全部掃描圖或全局Loading；失敗在自有Scanner以文字fallback繼續可操作，WARN只記transaction。Scanner幾何／圖片cover／目標邊界屬UI，無 per-image global fit。Loading END 後的shake由MOONSHINE排程；LUNAR僅發語意cue與transition生命周期。

Fonts（2026-10-04）：[FONTS.md](FONTS.md) 管理 common critical/deferred/system 字體，無 Core Google waterfall。掃描使用 images.scan 從未裁切 base 重新產生有界 fit 縮圖，UI cover 填滿 Scanner；保留60% CG密度，不取原始全尺寸／不預載，不改卡圖請求。

Scanner全圖inspection（2026-10-04）：完成後點VIEW CG才建立第二個短期img consumer，直接重用scan的未裁切fit來源；browser cache可共享，不升原尺寸、不新開critical request、不自有decode/cache/Blob。退出清Image handlers/src及UI observer，失敗本地文字fallback與WARN，流程仍可RETURN。


## b6.8 adaptive quality（2026-10-07）

[User resource policy](../Resource_load_strategy.md) and [root safety policy](../transition_seizure_proetection.md) are development requirements. `lunar.assets.quality` reads centralized `qualityPolicy`: 1200ms classification window, provisional MEDIUM (LOW for explicit 3G/2G/SaveData), delivery thresholds ULTRA25Mbps/120ms, HIGH8Mbps/250ms, MEDIUM1.5Mbps, severe latency900ms; two degraded samples lower one level, never upgrade after selection. These are tuning parameters. Necessary fetch latency/completed bytes and bounded Resource Timing samples supply evidence; missing cross-origin timing uses a conservative hint/deadline. No startup wait or separate payload. Superseded/navigation aborts are not degradation evidence.

`build_asset_variants.py` reads at most bounded original headers offline at build time. `lunar.assets.variants.json` declares dimensions and CDN derivatives at linear100/85/70/50%; 275 large images and43 small images in accepted b5. Variants are named server-delivered Wix derivatives; browser never downloads an original bitmap to resize it. Missing variant uses declared nearest fallback. Existing small card/portrait fitting and small UI/font assets retain their own presentation sizing; large CG/background/scanner selection supersedes the old fixed CG percentage. No variant catalog preloads. `assets.status().quality` is an additive read-only delivery-policy DTO; display mobile/desktop profile remains a separate concept.

The quality owner also writes bounded session-header diagnostics at initialization, selection, real downgrades or changed static preference: four registry scales, initial/current tier, reasons/count, SaveData and static/decode preference. The previous `.log` retains this basic information independently of ring event eviction. It is an observer copy, never read to resolve assets or readiness; no unchanged-sample writes, UI notifications or synchronous persistence. Public resource/status APIs and quality thresholds are unchanged. See [LOGGER.md](LOGGER.md).

`resources.resolve(key)` resolves logical asset metadata; `resources.background(key)` returns frozen `{key,static,preferStatic,deadlineMs}` and `backgroundDegraded` reports a delivery/decode outcome (not UI visibility or Logger data). Rotating stomach image layers declare `map.stomach.background`; their authored first image is a static equivalent. MOONSHINE observes only those owned styles, monitors at most current URLs with2500ms optional decode deadline, and pins the static equivalent after failure/severe-delivery policy; this cannot hold UI_READY or emit gameplay data. Future video/background admission requires declaring its equivalent, not URL inference in UI.

Root commands use `transitions.beforeSwap(to, originalCommand)` and consumer `transitions.onCover(fn)` for one presentation acknowledgment. LUNAR does not schedule frames or read paint. MOONSHINE persistent root guard uses double-rAF + actual coverage/opacity checks before acknowledgment, then existing target readiness/recovery and Level0/1/2 completion reveal. It has no network dependencies and retains the same shield under reduced motion. Direct native passage changes still preserve the owned visible root until the guard commits; public projection scheduler waits that commitment before patching.


Guard-induced unchanged visualViewport notifications are filtered by the presentation runtime's viewport stamp (size/offset/scale/DPR). Actual viewport changes still invalidate geometry; equal notifications do no scene capture or global fit. This narrow correction is backed by the critical-policy fast-transition test (previously one viewport global fit; corrected zero), not a general renderer optimization.

Visual node raster comparisons also use a test-only 5s geometry deadline. If mount/viewport focus moves the node between screenshots, record the rectangles and retry the pair; never compare a node with the old position’s background. The original opaque-fill pixel tolerance remains strict. This does not gate UI_READY or add a runtime layout wait. Four-quality root-guard coverage uses an explicitly labeled sample-filter fixture with real HTTP art; unmodified actual3G builds separately exercise delivery classification/static fallback.

## b6.8 六檔偏好與延後套用（2026-10-07）

本節及 [最新完整規範](../diagnostics/b68-graphics-transition-requirements.md)取代上述立即 quality downgrade 與 Level1 的140ms演出細節。內部四檔仍是原圖線性50/70/85/100%，public names是 Fast/Standard/Fancy/Ultra；Ultra使用optimized derivative，Original只由玩家指定，解析為upstream source，Auto不能選它。`stg_graphics_quality_v1`由LUNAR持久保存；reset原stg_ namespace一起清除。

`api.moonshine.graphicsQuality.status/subscribe/commit/apply/onPrepare`供UI只讀policy、正常退出提交及有界presentation callback。status分 preference/autoEffective/effective/applied/pending/revision；draft只屬MOONSHINE，不存於LUNAR或Logger。`commit`未變時完全不開transition、不寫setting/CHANGE；persist failure保留舊偏好且可retry。Manual有效profile不受poor delivery變更。Auto poor samples只改decision，revision/resolver保持applied，next_scene/next_cg boundary才更新。Hint/static preference、individual visual fallback和quality preference分開。

Resources `plan(values)`由LUNAR解析目前consumer的opaque source/CSS，選最多四個important/critical，給immutable source/target/tier；UI不知道upstream命名/variant host策略。`reselect(value,next,fallbacks)`由LUNAR依active/applied/pending政策選URL；bounded同一原素材fallback保留已載入source，不改preference。Explicit settings exit的current important decode上限沿用1500ms，optional失敗WARN並保留個別來源；decorative不進blocking plan。只更新source-bearing attributes/CSS；不清HTTP cache、不重置native run/translation/UI。No all-image gate。

個別visual fallback只保留最多四筆URL/revision/boundary metadata，讓同一畫質commit後的native menu refresh仍重用已載入來源；下一個major boundary即失效，沒有另存bitmap/Blob或全目錄cache。已選static的`delivery_policy`不製造新的poor-delivery evidence；真正delivery/decode deadline才報告失敗樣本。

Native preparation和visible commit分開。`beforeSwap`先宣告semantic intent，再同步執行hidden native source preparation；passageinit合併同一root request、不再黑幕後才準備。已著作普通CG `.ev-bg/.rest-bg`等source真正切換時以窄bridge比較base identity建立next_cg boundary；動態stomach rotations維持Level0，普通標量不啟動Loading。MOONSHINE佇列保留舊可見tree，native structure+truecritical fetch/decode準備完才黑幕；owned target/map graph提交完才reveal和UI_READY。Map延遲scaffold採事件觸發await，無polling/frame資料讀取。

既有bounded current-background讀取會seed剛建立的authored CG source，確保第一次inline CG切換也可套用pending。CG hook先排除非背景元素／非URL樣式，再讀display mode，不把新網路／模式查詢加到一般style hot path；空visual-fallback registry直接返回，沒有逐圖status allocation。

UI中心timing100ms decision/150ms minimum Loading/50ms toBlack/50ms reveal；實際呈現受瀏覽器frame scheduling影響。快路徑無spinner；慢路徑舊CG50%dim+既有Loading，整組在curtain下消失。popover backdrop透明、curtain本身全黑；double-rAF驗opacity/viewport覆蓋才commit。Level2冷啟動/profile switch不變；true critical failures仍ERROR/safe Menu，unrestored failure也在cover下恢復可用結構。Logger保留decision/application及presentation chronology，public previous-only。

## b6.8 in-scene background correction（2026-10-07）

此節取代上文 authored CG 的 next_cg＝L1/black 項：source identity 變更只套用 pending quality 並發布 resources.background target；不呼叫 transitions.scene/assets.navigation。MOONSHINE 保留舊 image， bounded decode 後背景 layer200ms crossfade（lunar.transitions.toml 可調）；failure/deadline 留舊圖+WARN，不阻塞 UI_READY、不隱藏持續 chrome、不觸發全局 fit。重大根/presentation replacement 仍用 opaque barrier。Read-only scan preview 以自然圖片比例配置相框，保留 bounded optimized scan URL，報告獨立scroll；interactive scanner 的 target/cover規則不變。所有背景 deadline/degraded 分類遵守原 Level0/1/2 和 critical ownership。

Full-art consumers declare `data-ms-art-role=cg`; normalized background markers carry the same role. LUNAR image classification gives this explicit semantic role priority over card-source registration. SCAN/VIEW CG preserve declared fit variants; card thumbnails keep fill. This fixes shared artwork being silently re-cropped to portrait viewport dimensions before UI sizing.


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

### b6.8 Background delivery deadline correction（2026-10-08）

`animationDeadlineMs` is a visual observation/degradation budget, **not a cancellation deadline for ordinary story CG delivery**. MOONSHINE warns once with `ASSET_DECODE_TIMEOUT {generation,assetId,tier:'decorative',reason:'deadline',pending:true}` and retains the previous committed plate plus the single latest pending request. A valid late load/decode may then finish the same generation exactly once. Actual load/decode errors still release the request and retain the previous plate; supersession, detach, major presentation replacement and recovery invalidate callbacks. This does not extend critical deadlines, hold UI_READY, apply pending Auto quality early or create retries/polling/preloads. Capture deadlines still produce degraded screenshots and missing-asset records. Map dynamic-to-static fallback has a separate declared equivalent/deadline and remains unchanged.

Background cover/viewport geometry must already be established before delivery and stay valid through incoming fade and commit, without image-load-triggered global fit. Preserve explicitly authored camera sizing. Verification includes real native Pylorus scene pixels, late initial delivery in Auto/Original, late decode, obsolete completion and first-visible-frame geometry; a matching CSS URL alone is insufficient. See `tests/test_b68_background_visible_live.cjs` and `tests/test_b68_background_race_live.cjs`.

### b6.8 editable linear resolution policy（2026-10-08）

`lunar.graphics_quality.toml` is now the build-time authority for Fast/Standard/Fancy/Ultra percentages. Defaults remain50/70/85/100; edit `[resolution_percent]` then re-inject HTML. Values are finite numeric1–100, nondecreasing, decimals allowed. Injection derives every declared large-art fit URL from stored original dimensions; the metadata downloader reads the same policy. Small/unavailable assets, manual Original, Auto evidence, pending/applied revisions and loading tiers remain unchanged. Logger renders the compiled scales, never a hardcoded label. Metadata JSON is an original-dimension inventory; its historical variant URLs are recompiled during injection.

For portrait story CG, desktop width-only percentages (including normalized `% auto`) are cover-relative zoom. MOONSHINE owns each buffer's decoded aspect and local geometry; LUNAR still owns selection and logical identity. Cover must be correct on first paint, not repaired by inspection/asset completion/global fit.

## b6.9 report export and teaser backgrounds（2026-10-09）

Report retains the matching run's last narrative logical CG; direct developer reports fall back to native report artwork. Owned report host uses the existing CG double buffer with fixed extra dimming; current targets remain optional and do not block functional controls. Teaser admission reads only the native active plate; original timer/asset order remains native, one UI owner handles decoded commit and stale generation. Export is explicit and transient: selected CG anonymous-CORS Image, bounded deadline, no upstream/full-original fallback, no new preloads or cache/Blob persistence. Successful delivery includes dimmed CG in long PNG; timeout/failure still exports report and logs missing logical asset, no runtime fatal. Native Wix report originals HEAD checks on2026-10-09 returned200/CORS `*`; controlled SVG tests separately verify browser PNG pixels. This is not a guarantee for arbitrary third-party/non-CORS assets or real phone3G.
# b6.9 report export composition clarification（2026-10-09）

MOONSHINE exporter reads the already-selected committed background descriptor inside existing synchronous `resources.withResolved`; a missing/pending committed image falls back to the current report target. It does not reselect the current quality profile for an already-painted URL, derive resource resolution from long PNG height, or issue gameplay refresh. PNG visual composition uses current viewport CG framing at top-center and fades to black before footer/CG edge; no change to live background generation/78% dimming. CORS decode deadline, degraded capture/missing ID, critical policy and current quality selection stay unchanged. Real-CDN PNG evidence and uniform-SVG pixel fixtures must be identified separately.


### b6.9 EncounterEvent source re-entry（2026-10-09）

Native passage replacement does not imply a new visual owner for ordinary continuous EncounterEvent prose. The narrow chrome descriptor routes its current authored image/camera to the retained MOONSHINE background double buffer; native plates are not separately projected. Last committed image stays until the latest target is decoded, then commits once. Stable gradient/dimming spans both buffers and never runs a native entrance fade. Existing late-delivery/generation/quality/recovery/major-guard rules and logical asset IDs remain unchanged; no new fetch policy or resource registry. Background dirty updates do not re-read Story Box prose.

## b6.9 Resource ownership audit（2026-10-09）

Current asset metadata remains bounded and does not retain Blob／ImageBitmap caches. The confirmed extra retained CG references were detached workspace DOM reachable from its dispatch index, not an HTTP Cache quota error. Existing snapshot boundaries now retire those strong references; active DOM, pending rich text and double-buffer transactions remain untouched. DOM removal/reference release only permits browser reclamation, not immediate HTTP／decoded／GPU cache eviction. No whole-catalog fetch, resource cache clear or reload is introduced. Browser/GPU/A35 limitations and actual before/after evidence are in [Memory Lifecycle Report](../diagnostics/b69-release-audit-2026-10-09/B-memory-lifecycle.md).
