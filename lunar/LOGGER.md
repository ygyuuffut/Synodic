# LUNAR Logger — diagnostic contract

Logger 只觀察 SYNODIC，絕不成為 runtime state。原始需求：[b6.6 Logger requirements](../diagnostics/b66-logger-requirements.md)；目前 Runtime 版本由 synodic.build.toml 指定，LUNAR public manifest API0.1／protocol1 不變。這是加法式基礎設施，不重造 lifecycle／storage／Core。

## 開發使用規範（2026-10-03）

所有後續開發遵守 [LOGGER_USAGE.md](LOGGER_USAGE.md) 的30條LUNAR API使用／讀取契約及review checklist；它是正式規範，不是第二套Logger。本文記錄目前實作及接口，含點MOD scope、error name/cause等新增要求尚未全部實作，詳見規範的實作對照。性能策略為禁止退化、暫不精修；沒有證據時不大型重構Logger或persistence。

## 模組與 API

| 文件 | 職責 |
| --- | --- |
| lunar.logger.core.cjs | 有界 circular ring、scope／小型 payload、session header、exception listener、checkpoint 合併／故障降級 |
| lunar.logger.storage.cjs | IndexedDB async open、兩筆 transaction rotation、checkpoint／tab ownership |
| lunar.logger.api.cjs | previous-only status／訂閱／純文字格式化匯出；一次啟動 storage |
| lunar.logger.quotes.toml | 可選的本地 header 彩蛋；注入器編譯、沒有 runtime fetch |

所有 subsystem 用同一 logger：

```js
const log = LUNAR.logger.scope('MOD.example'); // MOD 僅寫入
log.debug('DOMAIN_DIRTY', { cycle: 18, domains: ['player.hp'] });
log.info('COMMAND_SENT', { action: 'select', cardId: 'upgrade_17' });
log.warn('unexpected state', { expected: 'upgrade_17', actual: null });
log.error('COMMAND_RESULT', error, { action: 'select' });
log.fatal('runtime terminated', error);
```

LUNAR module 直接使用 LUNAR.logger；MOONSHINE 僅用 `LUNAR.api.moonshine.logger.scope(...)`；HECATE client 用 `LUNAR.api.hecate.logger`（MOD.hecate）。scope convention：LUNAR.game/native/story/actions/buffer/updates/logger；MOONSHINE.runtime/actions/combat/map/geometry/workspace；MOD.<lowercase-module-id>。scope 長度最多80字，64個固定scope可快取；scope 是 write-only frozen object，不暴露 ring／clear／rotate／threshold。

正常 append 固定 O(1) ring slot replacement，不用 Array.shift。所有 DEBUG／INFO／WARN／ERROR／FATAL 預設入 ring；內部 bridge 保留簡單 threshold hook 供將來調整，公版沒有 filters。entry：ISO timestamp、performance.now elapsed、session內單調 sequence、level、scope、message、可選小型 data。ERROR／FATAL 另存 session id／最近最多12條 breadcrumb、可選 message／stack（500／4096字上限），不以完整 payload 回溯。

structured data 用 descriptor 讀取，最多3層／32節點／每容器8個欄位，字串240字，跳過 getters／非 plain object；敏感名稱、state/snapshot/DOM/HTML 不記錄值。請 caller 只傳 cycle／domain／handle／數量／semantic action，不傳 _STG、完整 snapshot、DOM、輸入值或玩家存檔名稱。小型化是開發契約，不能把任意巨大物件當正常 hot payload；代理物件或 caller getter 也不是支持的熱路徑。只在 export 使用 JSON.stringify 每條小記錄，normal append 無 stringify／layout／snapshot／game read。

## 生命周期與持久化

每次遊戲 HTML 的模組 bootstrap 啟動一次 current；logger.api 是唯一啟動者，core.start guard 不因 route／scene／load 重入。run/game buffer scope 與 diagnostic session 無關。啟動時 cleanShutdown=false；ID／quote 使用 crypto 的獨立亂數，不消耗 game Math.random。

DB `SYNODIC.diagnostics.v1`／version1／store `sessions`，固定 key current、previous：startup readwrite transaction 讀 old current → put previous、put新current；old previous自然覆寫。第一次啟動 previous不存在。每筆有 session header、最多1500 entries、lastSequence、checkpoint時間。沒有無限制歷史、localStorage 備份或遠端上傳。現有 api.storage 是同步 localStorage，不適合 Logger；本輪僅新增狹窄 async Logger storage，不改遊戲存檔架構。

core／storage 必須在 bridge.pause 之前載入，保留當時原生 setTimeout／clearTimeout，診斷計時不進遊戲timer registry、不被 gameplay pause凍結、不讓timer callback附加 port.emit。MOONSHINE 下載URL清理透過 timing.ui 登記。

dirty64條或首條後2秒觸發合批checkpoint；只在有 dirty 时設單次 timeout，無 idle polling。一次未完成寫入期間合併後續 dirty；checkpoint 只生成最多1500條的有界列表，IndexedDB structured clone，不 stringify完整ring。ERROR／FATAL優先microtask checkpoint；visibility hidden／pagehide尝試提交。DB open被拒／blocked／3秒timeout、版本更換或checkpoint失敗：console warn、ring WARN、切成memory，遊戲繼續。失敗不透過 game notify，不遞迴重試。啟動 transaction失敗時讀不到previous，按鈕停用；若已載入previous後寫入失敗，仍能匯出那份previous記憶體副本。

checkpoint先驗DB current.session.id，防止另一tab啟動後旧tab覆寫新current；旧tab降級memory。只保留兩筆不代表多tab能各自長期持久化，公版不是多局歷史管理器。

正常 pagehide（非persisted）標記clean／ended並記SESSION_END；BFCache pagehide只checkpoint、不结束，pageshow persisted恢復unclean／ended=null且不rotate。不保證關頁時async transaction完成，也不能攔截Chrome renderer native crash、kill或OS終止。previous unclean顯示提醒，**不是confirmed crash**。最近尚未checkpoint的日誌可能遺失。相關平台限制：[MDN IndexedDB shutdown](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#warning_about_browser_shutdown)、[MDN pagehide](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)。

儲存依browser origin／profile／permission與配額；file URL在本機Chrome驗證，不承諾其他手機瀏覽器相同行為。不同檔案／origin、無痕、清理網站資料可能無previous。持久化可用性失敗安全，並不是可靠文件系統或crash report服務。

## Header、彩蛋及匯出

inject_mobile.py 嵌入 `LUNAR-diagnostic-config`：沿用module manifests的API／version／installed catalog，SYNODIC build及revision來自synodic.build.toml，modules.json configuration.build只保存路徑；declared game version取原生window.STG_VERSION文字，game fingerprint是移除注入區後原生export的SHA256，構建時一次計算。LUNARschema1是當前adapter contract，不讀完整遊戲。Header固定保存起始browser／platform／viewport／DPR／language／document.lang、quote、版本與modules，不持續追蹤环境。

b6.8 四檔資源基礎資訊（2026-10-07）：LUNAR quality owner 在初始化、首次選定、實際降級或靜態偏好改變時，旁路提交 `session.environment.assetQuality` 的有限純量白名單。記錄四檔 ULTRA/HIGH/MEDIUM/LOW 的原圖寬高比例100/85/70/50%、pending/selected、初次選定及目前檔位、選定／最近變更原因、降級次數、Save-Data、staticPreferred 與動態解碼deadline。比例來自正式 variant registry，不硬編另一套設定；不是像素面積百分比，也不是保證所有小圖下載尺寸。解析度與動態背景偏好分開列出。

這是同一 session header 的加法欄位，不增加DB版本、第二套logger或public current API。內部 `bridge.logger.assetQuality` 僅供 LUNAR owner 寫入，沒有DOM/game capture、manifest dump、輪詢、通知或同步儲存；沿既有合批checkpoint，無變更的delivery sample不重寫。最多初始化＋選定＋3次降級＋1次獨立的靜態偏好切換（false→true）。callback缺失／失敗不影響品質、readiness、Loading或操作。任何runtime不得讀這份診斷副本作決策。

previous `.log` 在 Runtime Log 前列出上述基礎資訊。早期選定事件被1500條ring覆蓋後仍保留header；若session在選定前終止，明確顯示pending／not selected及目前暫定檔。舊session缺欄位時顯示 `Asset quality: not recorded by this session`，不套用新執行的配置。IndexedDB不可用／未checkpoint尾端遺失仍遵守既有限制。驗證：`tests/test_b68_quality_log{,_live}.cjs`；[本輪範圍](../diagnostics/b68-logger-quality-requirements.md)。

目前TOML使用 `[crash]` 表下的 `quotes = ["…", "…"]`，兼容舊root `quotes`；最多64條、每條500字；missing／empty／malformed／wrong type回退空，Logger照常工作。每個session選一條且不變，同檔直接注入，無網路請求，HTML script escaping防止字串破壞封包。

`api.moonshine.diagnostics.status()` → `{ready, previousAvailable, persistence}`；`subscribe(fn)`返回unsubscribe，只通知logger可用性初始化／降級，**不逐條通知**。`exportPrevious()` → Promise `{available:false}` 或 `{available:true,filename,text}`。沒有 current read/export API；正常公版UI不能取得current。本輪私人版也沒有viewer／current export。MOD公共Logger僅提供scope寫入，沒有reset／rotate或讀別人内部記錄。

Mods footer 左「Export Log」右「Close」，aria-label「Export Previous Log」，只有previous可用才啟用；沒有previous時title提示。LUNAR格式化純文字header與runtime lines，MOONSHINE只請求、建Blob及download，再revokeObjectURL；不解析／保存log rows或session狀態。可用性更新只patch按鈕，footer由CSS正常Grid适配且支援翻譯／身份，不用hidden-workspace中轉或global fit。

## 事件鏈與限制

入口PLAYER_INPUT、interface/nativehandle COMMAND_SENT／COMMAND_RESULT、DOMAIN_DIRTY／STATE_NOTIFICATION、runtime VIEW_DISPATCH、catalog／scalar／actions／workspace DOM_PATCH、geometry每個非空queue批次首次入列 GEOMETRY_INVALIDATE（只記首個key／reason，不逐元素）、既有SugarCube :passagedisplay SCENE_CHANGE、story STORY_PUBLISH／STORY_FINISH、installed/preference/private MOD_HOOK、ERROR／FATAL。scope／sequence／cycle／command id供回溯，不dump完整state或DOM，不追pointermove／每鍵password输入、不逐節點記patch。DOM_PATCH是一次patch入口，不是「真正改了幾個節點」的計量；需要精確mutation／耗時仍用test-only probe。

bridge commands記錄同步 returned／dispatched及error rethrow；native Promise不額外then／catch，只記returned async=true，避免改返回身份或消耗unhandledrejection。無法保證所有原生內部函式／timer都有單獨breadcrumb，本輪覆蓋主要入口，不包裝整個原版函式庫。window error／unhandledrejection保留瀏覽器原錯誤行為；caller已catch的error只在明確instrumented catch中記錄，沒有全量攔截。

回歸入口與before/after報告：tests/test_logger.cjs、test_b66_logger_live.cjs、test_inject.py，以及既有四模式4×／三輪performance benchmark和獨立1×sanity；結果见 diagnostics/b66-logger-2026-10-03.md。

buildRevision固定header，previous-only匯出不回讀TOML。

### b6.8 六檔畫質 header（2026-10-07）

`environment.assetQuality` schema2增加whitelisted preference、autoEffective、effective、appliedProfile、pendingProfile；ORIGINAL是獨立來源型別，不假裝等於optimized ULTRA100%。`.log` Runtime Log前列出Auto/Fast/Standard/Fancy/Ultra/Original語義、四個linear scales、Auto estimate、effective/applied/pending及原有SaveData/static/decode/reasons。舊schema1與沒有metadata的session仍可匯出並標示未記錄；initial selection和pending status不虛構。

品質owner在init、startup selection、實際decision/application、manual commit或static change時旁路更新；unchanged samples不重寫header、不觸发game/DOM/UI通知，不依Logger決策。原1500ring及async batch persistence不變，metadata能跨ring eviction。新增GRAPHICS_QUALITY_CHANGED（settings_commit且真變更）、AUTO_SELECTED、AUTO_DOWNGRADE（poor_delivery/next_scene）、PROFILE_APPLIED（boundary）與UI TRANSITION_* breadcrumbs；individual ASSET_VISUAL_FALLBACK/ASSET_DECODE_TIMEOUT保持不同事件及WARN，真正critical/coverage failure才ERROR。公開接口仍僅previous export，沒有current viewer。

## b6.8 fatal-only export（2026-10-07）

普通 diagnostics.exportPrevious 不變。LUNAR.recovery 在真正 fatal 發生時先寫 FATAL_EXCEPTION_CAPTURED（name/message/stack reference），再 CRASH_SNAPSHOT_FROZEN，凍結 current snapshot 為有限 JSON text（fatal original message8192chars/stack16384chars，1500條 ring，safe context、完整既有 header）。UI 只收到 fatalId/displayMessage/availability；exportCrash 返回 immutable filename/text，不提供 current log reader。沒有第二套 Logger、session rotation、DOM/game dump 或 storage wait。Logger 缺失仍建立 minimal crash text；後續 UI/export/restart/secondary breadcrumbs 只追加既有 Logger，不修改凍結文本。詳見 [要求](../diagnostics/b68-recovery-requirements.md)與 DEVELOPMENT。


## b6.8 Background crossfade race（2026-10-08）

Background presentation breadcrumbs (b6.8, 2026-10-08): MOONSHINE.background emits BG_TRANSITION_REQUEST, BG_ASSET_READY, BG_TRANSITION_START, BG_TRANSITION_COMMIT, BG_TRANSITION_COMPLETE and once-per-obsolete-request BG_TRANSITION_STALE_IGNORED with generation/assetId. Decode/load/deadline degradation stays WARN for optional backgrounds; no per-frame records, log-derived runtime state or new public current reader.


### b6.9 story/action and Lab notice breadcrumbs（2026-10-09）

`LUNAR.actions`: INITIAL_BLESSING_ELIGIBILITY on a changed native eligibility tuple (`scene,completed,stinkySeen,tranquilSeen,claimed,proceed`). This records native persistent-unlock evidence without storage dumps or new-game resets. `LUNAR.transitions`: STORY_CONTINUATION (`from,to`) when declared ordinary same-passage prose keeps the presentation. `LUNAR.lab_notice`: LAB_NOTICE_SOURCE (`id,scene`) and LAB_NOTICE_CLOSE (`id`); `MOONSHINE.lab_notice`: LAB_NOTICE_OPEN (`id`). Existing BG_TRANSITION_* retains generation/logical asset IDs. No per-frame logging, text/DOM snapshot, second logger or runtime reads from breadcrumbs.
