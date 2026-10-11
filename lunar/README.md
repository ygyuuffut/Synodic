# LUNAR 資料／命令邊界

RC1 CG return candidate（2026-10-10）：既有 `api.chrome.viewArt` 與
`resources.backgroundImage` 的契約及原版 enter/exit authority 不變。
Encounter 背景仍不進 legacy snapshot；MOONSHINE 內部的 CG consumer 改讀
其自有 Story plate，不為這個修正新增 native DOM 擷取／命令或 buffer。
Logger 的既有 consumer scoped write 記錄 `MOONSHINE.art/CG_ART_UNAVAILABLE`，
只含 missing-source／image-error 原因；未新增 current log reader。

必讀 [架構規範](../ARCHITECTURE.md)。LUNAR API 是 SYNODIC 的資料、交互、緩衝與兼容層，是 UI／MOD 與原版的唯一交互邊界；與 MOONSHINE UI 共同部署為 SYNODIC Runtime。本層不建立元件、不轉換 CSS 選擇器、不繪圖。API 提供標準資料與語意動作，本體更新優先調整 adapter／bridge，不讓下游依賴原版資料形狀。

| 分類 | 模組／資料 | 規則 |
| --- | --- | --- |
| buffer.store | scope、typedStore | 可序列化副本；新 run／load/reset 清除過期 scope |
| buffer.game | current、normalized、working、selection、catalogs | current 是來源副本；normalized 為 schema 1，包含 player／inventory／alignment／preferences／location／combat |
| buffer.story | enqueue／update／get／pending／acknowledge | source、scene、paragraphId、order、html、visibleHtml、complete、phase；未呈現不丟失，不重跑劇情效果 |
| buffer.shop | freeze／read／invalidate | run＋node＋shop 首次商品／价格；動態餘額和持有由 bridge 刷新 |
| buffer.actions | presentation.actions、shop actions:groupId | 固定選項／價格、selected 暫存意圖、pending／completed／receipt；不提交交易 |
| buffer.exchange | presentation.active、ui.viewport | 普通顯示資料；不呼叫任何命令 |
| adapter.data/game/actions/story_actions/menu/shop/images | 格式/schema、語意動作、主選單分類、資源 URL | 純轉換；60／30／40% 基於顯示尺寸×DPR，24～1600px；不回原尺寸 |
| bridge.interfaces/port | 動作識別、原生函式／回呼、明確寫入允許清單 | function／DOM 保留在 bridge，不放 buffer；呈現端接不可見 action id 和資料副本 |
| adapter.saves／bridge.saves | 原版 load／overwrite 確認 options 的名稱轉換 | 手機 port.route 交付前只讀目標槽位一次；saveName 是純文字，回呼及實際操作仍由原生擁有 |
| bridge.game/story/shop/actions/native/resources/pause | 遊戲來源、待顯示內容、商店、集中唯讀 DOM 擷取、資源請求、遊戲計時 | 原生遊戲保有結算／效果／交易／存檔；UI timers 與核心 timers 分開 |
| api.moonshine | version 1、snapshot/catalogs/pending/action/actions/sources/subscribe/port | 唯一呈現端邊界；既有 port 為遷移轉譯，新畫面用語意動作與標準快照 |
| api.moonshine.story | read／complete／presentation | 完整富文字、paragraphId、channel、scope、language、translatable、hasNarrative、complete 副本；完成命令由 bridge 驗證當前段落／scope／暫停／一次回呼 |
| api.hecate | version 1、snapshot/capabilities/command | 非公開 HECATE MOD 專用開發 API；僅完整可選組載入，公開版不注入；未知命令拒絕 |

文本／事件緩衝保留因顯示、翻譯、動畫或交互延後的內容，原始／標準化文本供 MOONSHINE 呈現為可翻譯 DOM；buffer 無命令能力，不建立第二套遊戲狀態。

標準快照不是遊戲權威來源。shop 凍結初次原生成果，按穩定商品 id 提交給原生；UI 重繪／關閉不刪資料。記憶體資料尚無跨重新載入持久化，沒有修改原生存檔格式。

存檔確認轉換只匹配原版 Load／Overwrite Slot N 的 title＋body＋okLabel，以及 All Slots Full 匯入覆寫訊息。bridge.saves.confirmOptions 在既有 api.moonshine.port.route 的手機確認入口讀指定槽位最新 saveName；adapter.saves 只改 title 或 body 的文字，跳脫 HTML 字元，不修改輸入 options、callback、slot index 或存檔。未命名／空白／不存在返回原 options；其他確認不讀 storage，desktop 原版委派不轉換。沒有新增公開存檔命令、buffer 欄位、通知、完整 capture 或 MOONSHINE DOM 存取。

來源資料中的 data-ms-id/class 只是轉譯別名。LUNAR 可讀取原生 DOM、媒體及動畫的普通描述；MOONSHINE 取得描述後自行組裝、轉換樣式及演出。語意動作列表见 lunar.adapter.actions.cjs；命令／轉換與 buffer 明確分離。

ACTIONS 的 read/select/confirm/execute 只傳標準副本與意圖。select 不改原生選中索引，也不發放效果；confirm 再查來源及餘額，委派原生交易並延後導航以呈現回執。回呼與延後導航在 bridge.actions，狀態／receipt 在 buffer.actions；UI 拆卸不清空，run／load scope 失效。

初次升級的 group.entryActions 保存原本入口的 id／label／html／category／disabled／role（arcExplore、lab、embark）資料副本。原生確認先切換已領取狀態時，bridge 用這份入口資料避免把重訪 Return to Lab 帶入延後的初次流程；實際重訪不帶初次 group，仍委派原生按鈕。role 的固定路由、原生函式及場景／節點失效檢查全在 bridge，buffer 不存回呼、不推動遊戲。native bridge 也擷取 Lab 節點彈窗，供 MOONSHINE 自有呈現；LUNAR 不組裝畫面。

presentation.actions 另包含 scope、story.html／hasNarrative／paragraphId、choiceOnly：bridge 以同場景緩衝的完整正文及目前正文擷取判斷，打字尚未出現文字仍算有正文。story_actions 的 labelHtml 去掉首尾裝飾箭頭並保留富文字，hasContent 判斷空段落／媒體。只傳交換資料；是否接續菜單及預覽動畫由 MOONSHINE 決定。

手機敘事現改為完整段落交付：bridge.story 不呼叫原逐字 interval／字元包裝；完整 HTML 一次寫入兼容來源並保存於 buffer，完成回呼留在 bridge，MOONSHINE 淡入後透過 story.complete 提交。被替代／離場／scope 過期的完成失效，暫停不能推進，空正文在可恢復時直接完成。language 在原文入口保留，不從翻譯後 DOM 回推來源語言。隱藏來源 translate=no 只作兼容標記，不傳給下游正文；桌面還原。buffer 不存翻譯後 DOM、不控制動畫、不發命令。

## 模組後段（b6）

adapter.mods 提供 numeric version／compare／satisfies／metadata 純轉換；bridge.mods 擁有已打包模組清單、本次 active、下次 enabled、兼容鎖定及 localStorage 偏好。api.moonshine.mods.context／read／setEnabled 是通用 UI 唯一入口；bridge.mods.shouldLoad 僅供注入器的可選組啟動門控使用，不暴露給 MOONSHINE。MOD 專用 API 也整組門控；停用不在本次運行中卸載。這些 Runtime 偏好不進遊戲 buffer／存檔，run／load 不清除它們。TOML 在構建時讀取，手機 HTML 無檔案掃描或動態程式載入。詳細版本、資料欄位、儲存失敗與公開包契約見開發指南 b6 模組節。

## b6.5 更新 cycle

port.revision 立即失效交換快照，合併 microtask 通知提供 revision／dirty domains；同步 consumer 讀取前收集未送達的原生 DOM 記錄。api.sources 同 revision／scope 返回同一 deep-frozen、純資料快照，不重複 native.capture 或 copy；buffer 對外 read/write 的副本隔離不變。bridge.game.refresh 在每個 cycle 保守檢查 game／working／selection 輸入，真的改變才 capture／normalize／寫 buffer；未變的 DOM／樣式通知不重建遊戲資料。這個輸入比較仍有兼容成本，不是大型 reactive state manager，也不把 buffer 變成權威。

MOONSHINE 自己合併 frame 提交，LUNAR 不排 rAF、不處理演出。回呼仍同步，真正不同時點、scope 或資料改變不能為了 capture 數字被吞掉。詳見開發指南 b6.5 節及 diagnostics/b65-performance-2026-10-02.md。

## b6.6 domains／partial API

story.presentation() 返回 `{scene, hidden, art, interstitial, paragraphId}`（無 encounter 時 scene=null），只查當前 panel／paragraph／choices 和 art flag；等待後續文字的 flow 狀態以 scope-aware WeakMap 保留，不是動畫控制。actions.ready 同時受該門檻限制。story.presentation 更新不擷取 panel tree、不讀翻譯、不全量 capture；class oldValue 判別讓同批 remove/add 與重複 phase 寫入保持局部。

resources.encounter() 返回 `{id, urls}` 或 null，最多三個未來不同 CG，adapter 用既有 mobile CG 縮圖 URL。bridge 包裝 native PlayChunks 保留原 args／callback／桌面委派，僅發 resources.encounter；原生 scene／scope 過期時清理。下載／decode／取消由 LUNAR assets 處理，UI 由 MOONSHINE 處理，不改原生 SFX／CG 時計。

升級商店的 Leave／Continue／Skip 等意圖，在 group 未確認時為 disabled；execute 即時驗證，select NONE 仍不解鎖，confirm NONE 才委派原生零費離開結算，保留 receipt／destination。已完成退出一律用記錄目的地，不能重複交易；沒有修改 b5 或桌面流程。

bridge.updates.infer 只比較小型標量和 game／hand／enemy／scope／passage 引用，沒有循環完整 pack、copy 或 normalize；describe 把原生 MutationRecord 分類成 domains 與 `{key, domain, kind}`。port.emit 合併 metadata，保留 microtask 通知；HTML 根 lang／dir／translate 及自有呈現 DOM 不引發資料刷新。未知原生結構用 compatibility fallback，不把不明資料漏掉。

api.moonshine.updates.scalars() 每次返回新普通 HP／DATA／alignment／block／energy 資料，不把原生物件或引用交給 UI。partial(targets) 解析 bridge 持有的來源 handle，僅描述仍有效的來源子樹，去除重疊 target。完整 sources 保留同 revision immutable reuse；snapshot() 明確先 refresh 再返回標準副本，避免熱路徑的標量更新讓顯式完整查詢讀到舊資料。完整 snapshot／sources 不是日常標量通知的必要流程。

actions.state(groupId) 讀凍結的 offers／price／selected／receipt，僅按目前 DATA 更新 affordable；actions.flags(keys) 只傳 affected disabled，保留必選升級門檻。select 仍驗證來源後保存意圖並發 selection 通知；交易／命令驗證所需副本未移除。故事 publish／finish 明確發 story／actions 及段落 target：原生純 JS 的 loading property 改變也能局部傳達，不需要恢復全局 sources 刷新。

翻譯 DOM 只屬 MOONSHINE。LUNAR 不讀翻譯结果、不依翻譯換來源語言、不更新 buffer 或遊戲，不承擔 geometry／動畫。

## b6.6 display／對話控制項契約

display.resetRecommended() 只委派原生 stgResetToRecommended（包含既有保存）；瀏覽器頁面縮放／metadata／動畫排程屬 MOONSHINE。native snapshot 將多段Encounter intro SKIP標準化為 data-lunar-control-role=story.skipIntro；不移除原生DOM／回呼、不按標籤文字擴大過濾，不影響Continue、reward skip或NONE。

## b6.6 卡牌詳情關閉接口

`api.moonshine.cards.dismissPopup(sourceKey)` 是原生獲卡／純卡牌預覽的背景關閉命令。native snapshot 供 `data-lunar-control-role=cards.detailBackdrop` 和純資料 handle；LUNAR 保留來源／生命週期，不傳 DOM／回呼。未 armed、已 leaving／已提交、非頂層、離場／scope 過期、desktop 或已斷開的來源拒絕。成功時只觸發既有原生背景關閉；獲卡、音效、onDone、獎勵順序、劇情和導航仍在原版，沒有第二次發牌或 buffer 命令。

`actions.read().pendingCardReceipt` 是暫時的來源流程資訊；此時 ready=false，供 MOONSHINE 等待接續，不是新增遊戲狀態。Encounter 轉接忽略原生明確 hidden／display:none 的過期選項，包含結果 Continue；初次升級顯示灰色出口的 gate 不變。關閉淡出仍屬 MOONSHINE；LUNAR 不新增動畫或輪詢。

## b6.6 待顯示正文與行動接續

api.moonshine.actions.read().story 新增 pending 布林資料：身體探索來源仍空、原生插圖入口尚未結束時，bridge.actions 讀取目前角色／節點的 authored text，pending=true、ready=false。bridge 不排動畫、不控制展示計時；MOONSHINE 據非空白正文返回閱讀及釋放選單暫停。

story 使用當前 source text 的 data-lunar-story-id，避免其他來源的 latest entry；即時 body-sense-host 內容及新來源子節點身份納入正文比對。只有新文本或新發佈身份要求閱讀，未變／翻譯後 DOM 不回灌 canonical state。body-sense-host mutation 分類為 dialogue target，與全頁兼容路徑分離。

adapter.menu 忽略資料夾裝飾／variation selector，將 Load Slot 分類為 load；僅標準化用途，原生 callback／desktop 文案不變。

## b6.6 主菜單水印邊界

設定來源 `moonshine/moonshine.main_menu_watermark.toml`（相對 SYNODIC 根目錄）；注入器編譯為轉義 JSON，手機不讀取本機文件。LUNAR bridge.main_menu／api.moonshine.mainMenu 只提供固定唯讀設定與狹窄主菜單／viewport 資料；MOONSHINE view.main_menu_watermark 自有、可翻譯 DOM 僅在主菜單前景呈現，預設左下角。舊 CSS 偽元素水印已移除。mainMenu／viewport domain 局部路由，不經 hidden-workspace、不新增 observer／輪詢／全局 fit、不回灌翻譯、不替換文字節點。具體欄位、CSS px 單位與驗收見 DEVELOPMENT.md 的「b6.6 主菜單 TOML 水印」。

### b6.6 ACTIONS 標籤資料

items 另提供 summary（首個非空 authored BR／區塊行＋必要省略號）和 affiliation（原生明確 enc-choice／arc-dlg-opt 陣營 class 的小寫值或 null）。label 仍為完整純文字，html 保留富文字；首尾裝飾箭頭包含向上／下三角，正文符號不全局刪除。bridge.actions 窄讀單一按鈕、WeakMap 快取未變 HTML／class，adapter 純轉換；沒有布局讀取、動畫、翻譯回灌或新增通知。MOONSHINE 控制展開色和本地摘要 patch。

## b6.6 圖鑑解鎖語意 API

`api.moonshine.compendium.cardsUnlocked()` 返回原生布林狀態；`unlockCards(value)` 返回 `{success, available}`，只在提交時接受字串並限制12字。不提供可見節點或原生callback。bridge.compendium 以同步request-local資料facade供原版驗證函式讀取兩個legacy ID，其他ID透傳，finally還原document.getElementById並清空密碼；失敗不通知，成功發cards domain。原生判定／解鎖flag／持久化和desktop不變。無UI建立／布局／動畫／buffer存密碼。MOONSHINE直接管理窗口和輸入，測試含原生例外還原。

## b6.6 位置資訊 API（地圖第一輪）

api.moonshine.location.context() → {available, kind:map|combat, name, key}；非 MapScreen／StomachMap／Lab／Start 或來源未就緒時僅 {available:false}。read(part?) → context，map 額外提供 legend／nearby，part=nearby 或 legend 只查該區；combat 一律不查兩區。資料凍結、無 DOM／回呼／原生 singleton。b6.8 legend 為 {id,visualKey,label,description}，只交付語義 key 與原生 profile 適用文案；圖形／顏色／geometry 屬於 MOONSHINE 共用 registry，不帶 SVG、paint 或事件。nearby 為 {id,name,subtitle,portrait,hp,maxHp,affinity,collectedData}；計數為已完成 capture 的 scans。

bridge.location 只讀窄位置／legend／原生名單 metadata，池數值從遊戲讀取、不呼叫初始化 getter；不用 buffer 假作遊戲狀態，不完整 pack／capture／copy。bridge.updates 增加 location／location.nearby／location.legend，固定少量位置／池標量比較與對應原生 subtree 描述；不對全遊戲做 normalize 或額外 polling。顯示、字體、數值適配、動畫／pause 生命周期都由 MOONSHINE 擁有。display.viewport() 返回 width／height／offsetTop／scale 的新資料，不查主菜單存在性、不寫 UI。

### b6.6 Pause 控制通知（2026-10-03）

api.moonshine.timing.subscribe(fn) → unsubscribe；同步只傳 active boolean（第一個 owner acquire=true，最後 release=false；重複／nested acquire 不重複通知）。subscribe 不立即 replay，UI 初始化可讀 active()。這是控制通道，不屬於 canonical game state、game domain／notification、capture 或動畫資料。MOONSHINE 決定入口遮蔽／動畫。

bridge.pause.controlMutation(record) 僅供 port 消費本 bridge 的 inert／body class 寫入；先 drain 原生 records，WeakMap→attribute→oldValue count，O(1) 並消費清理。port observer 使用 attributeOldValue；真實 native class／inert 和遊戲更新不被通用忽略。沒有新的輪詢／observer 或常規全量 capture。pause／release 的 timers／music／elapsed 規格保留。
# b6.6 診斷基礎設施

LUNAR Logger 的 scope／observer-only契約、ring、IndexedDB current/previous、匯出與生命周期见 [LOGGER.md](LOGGER.md)。MOONSHINE只經api.moonshine.logger／diagnostics使用；MOD寫入同一LUNAR.logger.scope API，HECATE 綁MOD.hecate。Logger資料不進遊戲buffer、不發game notification、不作canonical state／UI決策來源，公版只匯出previous。

b6.8 quality owner 在初始化／選定／實際降級或靜態偏好改變時寫入 bounded `environment.assetQuality` header；previous export 在基礎資訊列出四檔100/85/70/50%、初次／目前檔、原因／降級數、SaveData及背景偏好。早期event被ring覆蓋不影響header；pending／舊session缺值明示。內部writer不增加public讀取API，不通知UI、不為日誌capture／等待storage。

## b6.6 Asset Profile

見 [ASSETS.md](ASSETS.md)：assets.core 為資源 infrastructure，不進 game buffer。api.moonshine.assets 供小型狀態／request／profile意圖；bridge.resources.context/current 為唯一原生場景／背景讀取邊界，native.stylesRevision 排除自有／MOD／字體樣式而保留來源樣式變更。MOONSHINE 不讀原生URL／state；HECATE命令同樣驗input lock。


### Scanner adapter／native command lifecycle（b6.6，2026-10-04）

adapter.scan 將原 scanner config／report table／temporary session 轉 schema1：id/scope/key/title/image、count/maximum/complete、whack/freezeAvailable、header/reports/trait、spawn。bridge.scan 保存 original choice callback/context、認證token和待結算 handle；session.clickedTotal／freezeUsed 留在原版，buffer.actions 只包含顯示用 scan 副本。沒有 scan buffer 或新save field。

api.moonshine.scan.read() 是遞迴凍結副本；token(id)/release(id,token)/hit(id,token) 限2個有效token且每次命中一次，freeze(id) 使用原 advancedScans 條件，suspend(id) 撤銷未命中token而保留進度。Continue 只透過 actions.execute(id+':continue')，立即消耗 handle、再委派 native choice，並在完整時呼叫既有 captured/fetish native grant。Data 原數量、不增加 per-heart currency；native response/outcome 也只在 Continue 開始。不同 scope/game/root/choice/session 或 navigation 使 handle 失效；read-only legacy gallery stop 保留有效pending session。記憶體 pending 不跨頁面重載／存檔載入。

bridge.effects 包裝既有 character selection／stgShake，只發布 target/transition/scope 意圖、委派原 gameplay selection 及 native FX 開關；api.moonshine.effects.subscribe 接收純資料。所有動畫、時序與 Loading 完成後的演出由 MOONSHINE 負責。scan／effects scoped Logger 不讀記錄決定狀態，無快照dump或輪詢。

## b6.6 字體／掃描資源

正式字體 resolver、logical roles、readiness、import gate 與 Logger 契約見 [FONTS.md](FONTS.md)。api.moonshine.fonts 是唯一 UI 字體資源入口。scan adapter 將原始 report 的固定空格／單換行正規化為 label/body/paragraph DTO（保持 text 兼容）；未顯示的正文不寫回原版。images.scan 重建保留比例的未裁切資源請求，API 不決定 Scanner 大小、cover、愛心色或佈局。

### 完成掃描圖片只讀接口（b6.6，2026-10-04）

`api.moonshine.scan.inspection(id)` → frozen `{id,image}` 或 null。bridge驗證pending identity＋原生clickedTotal≥maxClicks且maxClicks>0，API驗證資源/transition lock。image是當次scan專用未裁切fit URL，與對話CG分開；getter不normalize整份report、不capture、不emit、不啟動原生art/結算。buffer/schema/save皆不新增欄位。UI自行顯示/關閉及維持scan pause。

## Collected Data API（b6.6）

`api.moonshine.collectedData.read(character,id?)`建立或驗證一個暫時唯讀context，回frozen `{schema:1,id,character,collected,total,items:[{id,label,complete}]}`。來源是目前map附近角色的STG_CHARACTER_SCANS與native scansCaptured；unknown label固定Undiscovered且沒有report/image。沒有掃描buffer／save新增欄位、沒有新authority。context id不是遊戲session。

`detail(id,key)`只對有效context中的captured entry交付共用schema1 scan DTO＋`readOnly:true,collectionId`，報告全部解鎖，image從catalog經images.scan按需解析。`inspection(id,key)`只回id/image，`valid(id,key?)`查來源有效性／可選captured gate，`release(id)`只釋放context。原生root/game/scope/location/catalog或附近角色失效均拒絕，navigation清context。不調native gallery/scanner/CG、grant/Continue，不停止或替換native temporary scanner session；adapter.scan.archive的完成count是唯讀呈現資料，收集判定只在bridge nativeflag。

captured wrapper在原版flag真正改變才通知collectedData/location.nearby，原版回傳與例外透傳。API不排序、不量測布局、不組裝UI、不讀翻譯、Logger return不作決策。LUNAR.collected_data只記context/detail/release與missing metadata WARN；原版例外保持。既有buffer保留data-only，沒有gallery快照cache或game副本。

## Persistent Chrome API（b6.6）

`api.moonshine.chrome.story()` 窄讀 active story panel 的 title／rich blocks／paragraphId／held／sceneId；available=false是來源狀態，不能當visibility指令。adapter.chrome保留rich text與source handles、排除互動controls；新chrome直接接資料，不經workspace。`chrome.presentation()/subscribe()` 交付sceneId、NORMAL/MAP/COMBAT/OUTSIDE及顯式art command狀態；Mode lifecycle/visibility屬MOONSHINE。`chrome.viewArt()` 委派原生art toggle並受lock驗證。native bridge snapshot為LUNAR内部窄converter，不新增全game capture/cache/buffer。原版source listener持有舊toggle引用時，native.dispatch只於該art按鈕命令補語義ack；不監看body class推測Cinematic。

Chrome API implementation: `lunar.bridge.chrome` reads only the current native story panel or Upgrade narrative and emits command/navigation presentation semantics. `lunar.adapter.chrome` removes native controls, converts rich content/source handles and maps explicit scene kinds. `api.moonshine.chrome` freezes DTOs; no new buffer or authoritative game state is introduced. Native delayed function installation is retried through normal API installation, without polling. Scene/loading readiness uses the narrow `chrome.sceneReady()` availability query; image failure or absent prose cannot choose chrome visibility. The narrow `chrome.sceneReady()` query recognizes rendered story panels, Upgrade name, map/location titles and native Lab interactive SVG; it supplies required-UI readiness, not a mode or visibility decision.

Chrome content keys use normalized semantic positions; they do not inherit native DOM lifetime. Rich content does not carry native control handles. Formal story paragraph IDs still route completion; native same-prose redraw changes source node IDs without replacing an unchanged translated body.

Map presentation補充（2026-10-04）：adapter.chrome僅按正式scene identity將MapScreen／StomachMap／Lab交付MAP；沒有新增DOM visibility判定、poll／capture／buffer。HUD／Story suspension仍由MOONSHINE mode owner決定。Lab依2026-10-06使用者修正改為MAP，取代此前NORMAL期待。


### Card thumbnail API（b6.6，2026-10-05）

`api.moonshine.compendium.catalog()`與`cards.deck()`返回immutable entries `{card,family,type,cost,revealed,order,thumbnail}`。preview card是原版data副本，locked時null。`adapter.cards.thumbnail`供schema1 `{revealed,name,family,image,cost,uses}`：cost的value保留符號、magnitude為絕對值字串、kind正／負／零；不可用cost為null。有限uses `{kind:'limited',remaining,maximum}`來自maxUses／toolUses，無上限 `{kind:'unlimited',remaining:null,maximum:null}`；Worship curseLevel不取代uses。Locked thumbnail只有Undiscovered／revealed:false，其餘null，仍保留entry的family/type/cost/order作既有篩選／排序metadata（cost不呈現在locked卡面）。Catalog保留原版cards／tool／Worship／condition組合和seen/admin semantics；deck按masterDeck完整實例順序（有效空陣列不fallback）。沒有新buffer/save／命令／持久化。

`cards.art(source,cssWidth,cssHeight)`檢查Asset Profile後用adapter.images.variant的30%×DPR尺寸，僅在元件需要時請求。MOONSHINE只取得資料及URL，不讀native tables。catalog讀取的小事件為scoped Logger `LUNAR.cards / CARD_CATALOG_READ {total,revealed}`，不讀取日誌／每card logging。

## Combat API（b6.7）

`api.moonshine.combat.read()` → schema1 narrow battle summary, available/id, enemy/player counters/name/current portrait, native damage progress, energy/turn/limit/busy/actionOverlay/canEnd/consume/over, rendered flavor/intent and opening text until ACK. Reads never choose intent variants. `pile(id, HAND|DRAWPILE|DISCARDED|EXHAUSTED)` returns only requested native instances `{key,thumbnail,playable}`; shared thumbnail cost uses native effective cost and use counters, no game mutation. `details(id,enemy|player)` returns current image/statuses and player objectives from native flags/thresholds. DTOs frozen by consumer API.

`acknowledge(id)` acknowledges presentation once; `play(id,key)` resolves current HAND instance and rechecks native rules; `end(id)` delegates only legal non-consume player turns. Assets lock, pause, prelude, enemy turn, over and stale lifetime reject commands. `inspect(id,mode,key)` validates requested pile and uses existing pure card detail via a bounded temporary native preview slot; UI timer ownership makes armed/close callbacks pause-safe. `previewOpen()` reports only this bridge's pure preview. Native body preview is cleaned on scope/game/root/navigation expiry, without gain/reward callbacks. No new game-state store or save fields. MOONSHINE alone owns selection, geometry, animation and modal lifecycle. Logger records small events only; native authored `g.logs.msg` initial narrative is distinct from formal LUNAR diagnostics.

戰鬥counter沿同一API供給數值，MOONSHINE以完整outer capsule背景填滿HP／TURN右半；不新增LUNAR字段或measurement。HP／符號／数值使用translate=no，人物名稱及描述保持可翻譯DOM／source-unchanged wrapper identity；來源及game state不接收翻譯結果。最新視覺revision `combat-capsule-2026-10-06`、版本b6.7不變，完整驗證見diagnostics/b67-combat-capsule-2026-10-06.md。

### b6.7 rest/result additions

chrome.story now exposes RestSite title/description and rest background availability. bridge.story wraps only rest render completion to publish the authored paragraph through the existing fade/complete contract. actions exposes native options, frozen Process card offers and currency requirements; confirm revalidates native picks/threshold without charging. View Deck normalized label/summary/html omit the joker glyph. Existing native card picker is captured as a callback source.

combat.result(id) returns frozen schema1 `{id,outcome,title,quote,rewards:[{kind,amount}]}` in data/grace/chaos order; adapter converts native reward labels and missing amounts to0. combat.settle(id,'claim'|'skip') delegates native claim/skip then the source Continue button once; no duplicated reward formula or route. combat.advance(id) validates live attack overlay and delegates its native dismissal. No layout/DOM composition/polling in LUNAR, no current Logger reads or new buffer.

## b6.7 Compact card panels / rest display corrections（2026-10-06）

`api.moonshine.cardPanel.read/inspect/submit/cancel` is an additive schema1 consumer boundary. bridge.card_panel retains the native picker/deck root, supplied card instances/order and native click callbacks, bound to game/passage/run scope. The original picker and deck are hidden callback sources, excluded from mobile snapshots. Selection is presentation-only; only explicit Confirm clicks the validated source card once. Cancel/Close use native controls; native shift/grant/armed receipt/onDone/navigation remain authoritative. No picker buffer/save or copied shift rules. Desktop delegates unchanged.

MOONSHINE component.card_panel/view.card_panel/input.card_panel own a centered modal card stack above the retained ACTIONS menu, with a full viewport dark backdrop, responsive footer, pause/focus, selection and nested detail lifetime. The overlay is an owned child of actions-root, reusing its viewport/zoom compensation; standard details still use the existing compatibility layer. During nested inspection, view.actions promotes that same keyed, MOONSHINE-owned detail backdrop into the browser manual top layer, retaining its scene parent and source key. Both ACTIONS and the card stack remain visibly open and inert under the existing dark scrim; the ACTIONS root must not be lowered below the opaque scene for this detail. No cloning, reparenting, native DOM change or second detail renderer is allowed. Text taps stay in the detail; Tab/Shift+Tab stay inside it, while blank taps/Escape delegate the existing armed native dismissal and return selection, scroll and focus. Removal/navigation releases the top-layer node with its existing projection lifetime. View Deck has Close only; Reverse Alignment has Close and Confirm. Return preserves the ACTIONS shell, expanded option, scroll, focus and translated row nodes; regenerated native callback IDs are rebound on semantically unchanged rows through an O(n) index. `MOONSHINE_CARD_HAND` in animation.card_hand is now the single shared stack/scroll/lift implementation used by combat and these panels; superseded animation.combat_hand is removed. 1–2 cards center, 3–8 distribute without scrolling, >8 retain eight-card density and scroll. The shared hand reserves 14 CSS px at each scroll edge for the 7px blur/2px spread halo, including first/last cards and combat. A clipped card scrolls into this reserved area before lift/glow; top/bottom clearance also survives the lift. Second tap uses the same existing standard detail projection as compendium; backdrop returns to the selected card. Only Confirm changes alignment; View Deck has Close only.

Rest button name/subtitle boundaries normalize to explicit BR, preserving expanded rich text after native class stripping. Original RestSite blessing-header is no longer projected. Process offers inspect via actions.inspect and native pure card preview, preserving the parent ACTIONS selection/translation/focus; the old CARD variant of upgrade-preview is removed. Standard detail and native receipt dismissal are reused, not duplicated. Geometry is mount/viewport only; local selection adds zero native capture/notification. cards.panel targets the owning view. Logger writes only small open/close/confirm/inspect lifecycle IDs, never data/geometry per frame.

Latest nested-detail revision: rest-card-detail-stack-2026-10-06, version b6.7 unchanged. During-detail parent paint order/identity, seven viewport sizes, required performance and real-network results: diagnostics/b67-rest-card-detail-stack-2026-10-06.md; artifacts: builds/rest-card-detail-stack-b67-2026-10-06. Prior modal/glow correction: diagnostics/b67-rest-card-modal-2026-10-06.md; original migration: diagnostics/b67-rest-cards-2026-10-06.md.

Lab位置補充（b6.7，2026-10-06）：bridge.location僅在Lab讀stg-lab-root/mapscreen-title，context/read使用既有schema與kind=map，name=The Lab、key=Lab，避免誤標成Manor子圖。Lab未提供legend/nearby時保留空陣列；不初始化原生pool／寫state／造目錄／新增buffer。NORMAL恢復由離開地圖的正式scene語義決定。

## b6.8 Map API / autosave completion

`api.moonshine.map.read()` returns frozen `{schema:1,available,id,identity,profile,topology:{nodes,edges},state:{nodes,edges,portrait}}` (or `{available:false}`). Nodes: `{id,x,y,visualKey,direction,label,name}`; edges: `{id,x1,y1,x2,y2,dash}`; state: node `{id,current,available,cleared}`, edge `{id,emphasized}`. Coordinates/line endpoints are read from the existing native SVG; no routes are inferred/generated. The frozen topology object is retained for equal structure, even when native source DOM is replaced. Native handles are private, refreshed on source replacement. `map.enter(id,nodeId)` validates scope/game/source/identity/pause/assets and invokes the connected original node callback once, using its existing availability gate. Invalid/stale/unavailable requests return false.

`adapter.map` absorbs spawn/entry/chest/special/ev_* and pyl naming, plus native Lab services. Unknown types become `unknown` and a scoped MAP_UNKNOWN_TYPE WARN once per raw type/context. Map bridge never initializes stomach layouts or character pools. Location's original profile legend defines possible types; actual new types supplement it. Reading either API is pure. Map dirty notifications do not carry DOM or controls to consumers.

`api.moonshine.saves.subscribeAutosave(fn)` → unsubscribe; one immutable `{success:true}` after each successful **native** write. Reserved notice/UI queries the payload only when needed; no game capture/notification is caused solely by saving. Original save format, success/failure result and manual slot commands remain native. Ordinary native MapBoot presentation timer scope is UI; gameplay callbacks still use native pause/action gates.

Deferred first-map readiness: if native boot fills a previously empty map root after the initial scene projection, one structure/scene refresh creates the existing panel's empty normalized slot. LUNAR remembers source scaffold capture in a WeakSet, independently of map API reads; it is neither gameplay state nor visibility authority. Already captured same-root state rebuilds continue through map/location domains with zero full capture/fit. New graph nodes still mount directly and never traverse the workspace. This addresses the real9.8×/3G stomach-map readiness failure, without polling, native generator edits or ordinary-state rebuilds.


Slow-network readiness (b6.8): `api.moonshine.assets.readiness(id)` supplies frozen critical/important/decorative metadata. Only critical resources and actual owned controls/graph gate UI_READY; important/decorative current-scene requests do not hold input, including profile switches. Unknown required assets remain strict. Main/menu background is important; native catalog CG is decorative, requested only on demand/current scene, never whole-catalog preload. Critical decode remains bounded/strict; the existing 12s UI/state watchdog, safe Menu and Level0/1/2 transition policy stay unchanged. MOONSHINE reports MAP_UI_READY after owned nodes mount and unlock, without polling or capture/fit. Test-only visual oracle waits explicit current important capture targets to a deadline, then writes VISUAL_SETTLED or VISUAL_CAPTURE_DEGRADED screenshot + missing asset list. Slow optional assets log WARN, genuine critical failures ERROR; failedCritical/failedVisual counters are separate. No all-images-decoded functional oracle, runtime log reads, global performance/native repair or ownership changes. See lunar/ASSETS.md and tests/test_b68_readiness{,_live}.cjs.


## b6.8 map safety / passive catalog / quality

The resource quality and root guard contracts are documented in [ASSETS](ASSETS.md). Consumer additions are `assets.status().quality`, `resources.resolve/background/backgroundDegraded`, and `transitions.onCover`; all data/command mediation remains LUNAR-owned. The root-cover callback is a presentation acknowledgment, not a frame scheduler in LUNAR.

Collected Data schema1 adds optional row `kind:scan|passive`. `passive.avery.stomach` exists only in Avery's stomach catalog, alwayscomplete, with original passive perception text and STG_STOMACH_SCAN art. Its read-only details/inspection still validate game/scope/root/catalog/context lifetime; normal row authority remains native scansCaptured. List totals/counts add one in stomach only. Contextual Avery roster may be normalized for direct dev entry without changing encounter/pool state. Old mobile null-claim stomach overlay is suppressed at its existing scanner bridge; desktop delegation remains native.

Graphics Quality b6.8: `api.moonshine.graphicsQuality` exposes persisted six-position policy with separate Auto estimate/effective/applied/pending. Native resource metadata/variant selection/cache revision remain LUNAR-owned; UI draft, actual decode consumers and100/150/50/50ms presentation remain MOONSHINE-owned. `resources.plan/reselect` are semantic source refresh helpers, never browser-side bitmap resizers. See [ASSETS](ASSETS.md) and [latest requirements](../diagnostics/b68-graphics-transition-requirements.md).

## b6.8 Recovery and local background updates

`lunar.recovery.core` owns capture/dedup/frozen evidence and semantic commands; `moonshine.view.recovery` owns standalone emergency DOM/CSS, keyboard/focus/export and fallback. Normal API only publishes `recovery.status/subscribe/acknowledge/exportCrash/exportFailed/restart`, never live logs. Error text uses JetBrains Mono logical role and translate=no. `transitions.timing` reads build-time lunar.transitions.toml; MOONSHINE root guard and background layer alone animate. Authored background target patches preserve old image until bounded decode, never use L1 or invalidate global geometry. Read-only scanner natural-aspect preview and viewport-bounded stomach layout preserve existing gameplay and node identities. See DEVELOPMENT latest contract.


## b6.8 Background crossfade race（2026-10-08）

Background descriptors and native active body-frame normalization remain data-only. `api.moonshine.resources.backgroundImage(css)` returns immutable logical source/selected CG metadata; `withResolved(fn)` is a synchronous selection scope for already-resolved presentation writes, restored on throw, never an async asset gate or UI renderer. See the 2026-10-08 background transaction contract in ASSETS.md.

## b6.8 registered narrative forks

`adapter.story_choices` only normalizes source data; `bridge.story_choices` reads registered void/terminal fullscreen sources and routes exact native leaf commands. `chrome.story()` adds `branchId`, `background:{color,image}`, `actionsAvailable`, `viewArtAvailable` and intact `html`; `actions.read()` uses the same branch identity as scene/paragraphId and leaves `{id,label,html,category:"dialogue",activation:"direct",disabled}`. Fields are ordinary deep-frozen consumer data; no DOM/callback handles pass the API. `label` is accessible copy, `html` preserves CRLF/BR/block/rich semantics. presentation.actions remains exchange-only, never a command owner.

Leaf handles are validated against current root/control/passage/run scope/disabled and consumed before native dispatch. Audited void intermediate warning is presentation-only; actual native Proceed/Soft/Skip effects and timing remain unchanged. Finale body source wins over retained passage. Unknown family/confirmation cannot be bypassed or parsed from onclick. Existing public methods and schema1 remain compatible; normal actions/shop/scan are unchanged. Mobile native fullscreen foreground is replaced by owned presentation; desktop delegates. Small observer-only source/command breadcrumbs use LUNAR.story.


b6.8 background deadline clarification（2026-10-08）: resources.backgroundImage/withResolved and graphicsQuality.status signatures are unchanged. UI uses the existing animationDeadlineMs only as a visual warning budget for ordinary CG; it does not cancel latest valid delivery or block controls. Asset/quality authority stays LUNAR; pending decode and generation stay MOONSHINE. True critical deadlines and separately declared dynamic map fallback are unchanged. See [ASSETS](ASSETS.md#b68-background-delivery-deadline-correction2026-10-08).

### b6.8 native cinematic admission and tunable scales（2026-10-08）

Existing chrome/actions APIs now normalize the body-mounted Avery/Logic cinematic source ahead of retained passage roots. Paragraph blocks retain story IDs; background/vignette are data, actions are current native leaf callbacks, not buffer commands. Reports/teasers remain declared compatibility sources. Five native developer tests reject missing run/combat prerequisites with an ordinary alert before effects, while retaining original execution in valid contexts. `lunar.graphics_quality.toml` is build-time input for the resolver's four linear resolution percentages; UI never reads it.

While a declared cine/report/teaser foreground exists, retained combat/location command contexts are unavailable and main-menu availability is false. Existing UI owners release their controls; reports/teasers use OUTSIDE over a retained Start passage. Cine keeps NORMAL narrative semantics and takes priority over retained passage forks. This changes presentation admission, not actual passage identity or game state.

## b6.8 Narrative LOVE metadata（2026-10-08）

`chrome.story()` adds optional `love:{current,maximum}` from existing Avery/Fate `.avery-love-num` text. Adapter originally retained Fate HP copy; b6.9 status capsules below supersede that exception. No pool initialization/getter/effect/save/new buffer is involved. LOVE status dirty mutations route only to story.

`actions.read().items` adds optional `requirement:{kind:"love",current,required,met}` extracted solely from declared `.arc-dlg-opt .arc-dlg-lock`. Prose HTML/BR/block boundaries and accessible label are separate; native disabled callback remains the authority. The existing data-only actions buffer carries these fields without new state/cache/commands. Only the affected control is cloned for label extraction on changed source content; unchanged HTML uses its existing WeakMap cache.

## b6.9 runReport API（2026-10-09）

Additive schema1 `api.moonshine.runReport`: `read()` returns frozen null/report/notice; `valid(id)` rejects expired source; `proceed(id)` dispatches current native Continue/Menu once; `inspect(id,cardKey)` opens the existing read-only standard card detail. No game globals, DOM, native callbacks or full cards/effects cross this API.

Report DTO: `{id,kind:'report',title,titleColor,version,axes:[{id,label,score,percent,color}],alignmentColor,dominant,statistics:[{label,value}],score?,deckTotal,deck:[{id,name,count,family}],upgrades:[{id,key,title,description,flavor,icon}],background}`. Native profile/signature, rendered row values and ordered `_stgRsDeckRef` are authoritative. Adapter handles only nonnegative percentage/zero-total and grouping. Snapshot bound to report root/game/scope; unchanged reads retain identity and do not resample run statistics. Build version comes from the compiled diagnostic config (same TOML as Logger), not a UI literal.

Notice DTO: `{id,kind:'notice',title,html,version,background}`. Rich native announcement preserves paragraphs/markup; UI sanitizes rich presentation. Only active authored teaser plate updates background; root identity survives native Menu-underlay parking. Commands live in bridge.run_report, snapshots are data only, no new store/domain persistence. `runReport` dirty route is narrow; ordinary changes do not capture report/native tree or serialize it for diagnostics. Last narrative background descriptor is bounded to matching game/scope in chrome bridge, not a new asset cache.
### b6.9 report visual boundary（2026-10-09）

This same-version visual refinement changes only MOONSHINE report CSS/export composition. `runReport` DTOs, source/command validation, frozen native statistics/colors/deck and shared inspection remain unchanged. Export consumes the current committed URL using existing synchronous `resources.withResolved/backgroundImage`, falling back to model target only when no committed image exists; it does not apply pending quality, enlarge resource dimensions based on report length, or infer readiness from export diagnostics. Web/canvas capsule clipping, user-requested30.8px report card pills and top CG→black gradient are UI responsibilities, not bridge/adapter data or animations. CORS deadline/degraded missing IDs remain observer-only.


## b6.9 current choices / continuity / labNotice（2026-10-09）

`actions.read()` omits controls/ancestors explicitly hidden by the current native source in every supported story root. `execute(id)` rereads that source before dispatch; previous-paragraph and consumed-scan handles reject without effects. Genuine Lab revisit shortcuts follow native persistent seen flags; the later IC2 rule below separates deferred initial entry. Claimed native Proceed is a distinct continuation. No new authoritative buffer/state.

`chrome.background()` is an additive immutable null or `{image,color,size,position,repeat,storyLayer:true}` descriptor for the current ordinary EncounterEvent plate; `chrome.story().background` uses the same data. This narrow resource route does not copy prose or native DOM. It selects no animation/geometry. Mobile compatibility snapshots omit those native plates because MOONSHINE's existing background owner holds them. Other background source families remain unchanged.

Additive schema1 `labNotice.read()` returns null or `{schema:1,id,scope,scene,title,subtitle,body,closeLabel}` from the declared native Lab Coming Soon overlay. `labNotice.close(id)` validates current source/game/passage/scope and one-shot use, then runs its original Close callback. Source data is not a new buffer; no DOM or command references cross the API. Closing returns to Lab, unlike runReport notices. Dirty domain `labNotice` handles only its native source lifecycle. Observer breadcrumbs: LAB_NOTICE_SOURCE/CLOSE and changed INITIAL_BLESSING_ELIGIBILITY.

### b6.9 IC2 follow-up（2026-10-09）

`bridge.actions` keeps the completed **deferred initial entry** distinct from a real Lab revisit. Native permanent seen flags are not erased; first-entry skip-blessing commands stay disabled, genuine revisit and Proceed still use original callbacks. A retained Body utility exit is admitted only while native node choices are active, not during a committed response's Next/Continue; execute revalidates this phase. Pending paragraph copy remains complete in the story buffer; completed copy reads the declared native text so an instant append releases the ACTIONS follow-up pause.

`api.moonshine.chrome.story().extension` is optional `{id,anchor}` data for Body sensory content: `id` is the source child lifetime, `anchor` is the existing normalized content alias. It exposes no native node, command, scroll coordinate or UI timer. MOONSHINE owns prefix-preserving block append and local reading focus. Changed-only initial eligibility adds `deferredInitialEntry` to the existing breadcrumb; `MOONSHINE.story` writes one `STORY_EXTENSION_REVEALED` on an actual extension. No log becomes runtime state.


### b6.9 Lab Embark / scanner admission / auto load（2026-10-09）

`labNotice.read()` schema1 adds `kind: notice|embark`, `confirmLabel: string|null`, `confirmDisabled` and `closeDisabled`. `labNotice.confirm(id)` validates the same current source lifetime as Close and executes the original primary callback once. Only wrapped declared Embark functions register this source family; unchanged native Arc selection overlays remain outside this owner.

`scan.read().canContinue` is false until full progress for positive-target interactive scans; zero-target compatibility exit stays available. `actions.read()` exposes the same gate on the synthesized Continue and `scan.proceed` rechecks it before any claim/reward/replay. No new state authority or persistence.

`saves.loadAutosave()` takes no payload or native node from UI. It reads the original autosave on demand, opens the existing native confirmation if a live run exists, and captures only the validated native picker/run/scope lifetime. Confirmation delegates native deserialization then `stgGoTo(resume)` once; cancel/replaced picker/stale run cannot load. Original slot loading and localStorage schema are unchanged. Observer breadcrumbs: LAB_EMBARK_CONFIRM, SCAN_CONTINUE_BLOCKED, AUTOSAVE_LOAD_REQUEST/COMMIT/REJECTED.


Ending continuation: full-screen fork DTO uses `activation=accordion` for progression and `direct` only for terminal Menu. Native cine ACTIONS no longer declares a blanket direct mode. `bridge.run_report.retainsUnderlay` is bridge-private admission for the connected native teaser's Menu park; it does not become a public UI command or authorize a real notice dismissal. `END_NOTICE_UNDERLAY_PARK` records the one source cleanup without applying a pending foreground quality change.

## b6.9 Character status / page motion（2026-10-09）

`chrome.story()` adds optional `hp:{current,maximum}` from the current declared panel's `.avery-love-wrap .fate-avery-hpnum`; `love` also admits the generic no-ID status wrapper. Pure `adapter.chrome.hp` validates the numeric text and excludes the superseded complete status bar from prose. No getter initialization, new buffer, mutation of native HP or save schema. Status text mutations publish story only; unchanged blocks preserve translated prose.

Existing `bridge.effects.pageCue` admits only a newly present declared `stg-screen-shake` class, honoring mobile/native FX preference, and publishes the existing frozen effects event with `target:'background'`. Body motion-only changes route without native capture. It never animates, schedules frames or handles UI coordinates; all queued/cancelled/reduced motion remains in MOONSHINE. The mobile snapshot and narrative action list omit redundant native deck controls; their original implementation and desktop remain intact.

## b6.9 Native callback retirement（2026-10-09）

Private port.collect runs at native.capture completion; it removes only disconnected／passage-out Node-owned handles and their query/UI-action membership. Weak function IDs permit republishing reconnected sources. Previously issued retired calls return false; unknown handles still throw. Optional `transient:true` marks Node-owned call DTOs; MOONSHINE does not globally cache them. Global routes retain existing ownership. No command authority enters buffers, no new consumer endpoint/timer/Logger decision. See [release audit](../diagnostics/b69-release-audit-2026-10-09/README.md).

### b6.9 Mods eligibility (2026-10-10)

`api.moonshine.mods.context()` returns a new plain `{schema:1, mainMenu:boolean}` using the same native eligibility predicate as `read()`. It performs no viewport/computed-style read or module catalog conversion. MOONSHINE checks eligibility before reading the unchanged full `read()` DTO. This does not alter optional-module startup decisions or game state.
