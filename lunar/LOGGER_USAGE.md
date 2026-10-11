# LUNAR Logger API 使用與讀取規範

生效：2026-10-03，b6.6。這是 **LUNAR API 管轄的正式開發契約**，適用於 LUNAR、MOONSHINE、所有 SYNODIC MOD、私人開發模組（包括 HECATE）及未來 Core subsystem。[使用者完整原文](../diagnostics/b66-logger-usage-standard-requirements.md)保留全部30條；[LOGGER.md](LOGGER.md)記錄目前實作、接口及平台限制。

本次更新規範，不新增 runtime、讀取 API、scope 權限機制或私人 viewer，不推進版本。新功能及後續修改必須遵守；現有實作不因文件更新就視為已符合所有新增要求。

## 1. 唯一正式診斷接口

LUNAR Logger API 是 SYNODIC Core 及 MOD 唯一正式診斷日誌接口。新功能、重大狀態切換、可恢復異常及錯誤路徑，必須考慮接入；不得另建互不兼容的第二套正式日誌系統。

## 2. 架構地位與資料流

Logger 屬於 LUNAR infrastructure，只是 observer、diagnostic recorder、breadcrumb recorder、crash context provider。它不是 game state、state manager、event bus、save system、IPC、component communication channel 或 feature flag storage。

唯一正確方向是 `authoritative state → runtime logic → Logger 旁路觀察`。任何 runtime 功能不得以已記錄的內容決定遊戲或 UI 行為；禁止 `game → Logger → MOONSHINE 讀取日誌取得遊戲狀態`，也不得以 lastEntry 等值分支。

## 3. 統一 API 與跨層入口

標準 scoped write 接口：

```text
log.debug(message, data?);
log.info(message, data?);
log.warn(message, data?);
log.error(message, error?, data?);
log.fatal(message, error?, data?);
```

上面的 `?` 是簽名中的可選參數記法。實際使用依 ownership 選入口：

LUNAR 內部：

```js
const log = LUNAR.logger.scope('LUNAR.assets');
```

MOONSHINE 只用自己的正式 consumer API：

```js
const log = LUNAR.api.moonshine.logger.scope('MOONSHINE.actions');
```

現有 HECATE 使用 LUNAR 綁定 `MOD.hecate` 的專用 logger：

```js
const log = LUNAR.api.hecate.logger;
```

普通 MOD 的規範入口是 LUNAR 正式授予的 `scope('MOD.<module-id>')`；不因此授權 MOONSHINE 讀取 HECATE API 或原生全域。不得建立 console-only 正式 framework、自訂 IndexedDB/localStorage logs、第二個 ring buffer 或 crash log。`console.*` 只可作臨時開發輸出，不替代正式 Logger。

## 4. Scope 命名與 ownership

使用穩定的 `SYSTEM.SUBSYSTEM`；同一功能不得因文件不同隨意換名，正式 scope 不用 `test`、`misc`、`stuff`、`debug2`、`temp`、`whatever`。

| Ownership | 推薦 scope |
| --- | --- |
| LUNAR | `LUNAR.game`、`LUNAR.native`、`LUNAR.actions`、`LUNAR.story`、`LUNAR.buffer`、`LUNAR.assets`、`LUNAR.updates`、`LUNAR.logger` |
| MOONSHINE | `MOONSHINE.runtime`、`MOONSHINE.actions`、`MOONSHINE.map`、`MOONSHINE.combat`、`MOONSHINE.geometry`、`MOONSHINE.transition`、`MOONSHINE.modules` |
| MOD | `MOD.<module-id>`，例如 module ID 為 `author.foo` 時對應 `MOD.author.foo` |

推薦名稱不是要求本輪機械改名既有 scope；既有穩定 scope 保持 ownership。含點 module ID 的目前支援限制見下方實作對照。

## 5. 級別語義

| Level | 使用情境與限制 |
| --- | --- |
| DEBUG | 簡短開發診斷／breadcrumb：domain dirty、route dispatch、command sent/result、asset pack start/ready、scene preparation、component invalidation。 |
| INFO | 正常且重要的 lifecycle：startup、profile selected、scene transition、module loaded、session started/completed、critical package ready；不記每次微小 DOM 改動。 |
| WARN | 可繼續的非預期狀態或降級：fallback、optional asset missing、可恢復的 invalid metadata／state mismatch、unsupported profile、storage fallback；不是對代碼品質的主觀評語。 |
| ERROR | 功能或 transaction 失敗而 Core 仍可能繼續：scene asset load failed、unexpected command rejection、module initialization failure、rollback、persistent logging failure。 |
| FATAL | Core runtime 無法繼續、關鍵狀態無法恢復、全局 transaction 無法 rollback 或 uncaught fatal exception；普通錯誤不得一律升級 FATAL。 |

## 6. 必須考慮的事件類型

新功能至少評估以下事件是否有事後還原價值；不是要求每個 subsystem 全部實作，也不要求重複記錄同一事件：

- `INPUT / USER ACTION`、`COMMAND_SENT`、`COMMAND_RESULT`。
- `STATE_CHANGE`、`DOMAIN_DIRTY`、`VIEW_DISPATCH`。
- `SCENE_TRANSITION_START/END/FAILED`、`SYSTEM_TRANSITION_START/END`。
- `PROFILE_SELECTED`、`PROFILE_SWITCH`、`ASSET_LOAD_ERROR`。
- `MOD_LOAD`、`MOD_ERROR`、`ROLLBACK`、`ERROR`、`FATAL`。

有診斷價值的事件應留下 breadcrumb，足以串起玩家操作、系統行動與失敗點。

## 7. 禁止大型狀態與為日誌擷取資料

普通 Logger path 不得 dump 完整 `_STG`、game/LUNAR snapshot、DOM/workspace tree、asset manifest、card/story database。禁止 `log.debug('state', JSON.stringify(entireGameState))`，也不得為寫日誌執行 `game.capture()`、deep clone、full stringify、DOM serialization 或 geometry read。

只使用原操作已有的小型診斷資料，例如 `{cycle, domains: ['player.hp', 'enemy.hp']}`；不得為 Logger 增加遊戲擷取或布局量測。

## 8. Structured payload

Payload 應小、穩定、可讀、可 grep、可跨版本理解。優先 `{action: 'selectCard', cardId: 'upgrade_17', cycle: 184, result: 'accepted'}`，不傳 entireCardObject、allCards、wholeGame 或 everythingElse。

## 9. ID 優先

已有穩定 identity 時只記 `cardId`、`enemyId`、`sceneId`、`moduleId`、`paragraphId` 或 `transactionId`。例如 `log.info('enemy selected', {enemyId})`，不要將整個 enemyObject 塞入 Logger。

## 10. 保留原始 error

捕獲例外時傳遞原始 error 與相關操作 context，例如 `log.error('scene preparation failed', err, {sceneId})`，不得只寫「something went wrong」。應盡可能保留 name、message、stack、cause 與 relevant operation context；error 序列化本身不得再次 throw。這是錯誤記錄契約，不授權無界展開 cause chain 或完整狀態。

## 11. 不吞錯誤

記錄後依原功能契約恢復、rollback 或 rethrow。不得 catch、寫一條 ERROR 然後假裝成功；只有 subsystem 原本具有明確 fallback／rollback／recover 流程時才可繼續。

## 12. Logger 自身 fail-soft

所有 public write API 必須 best effort／fail-soft。IndexedDB failure、quota error、malformed quote TOML、export failure、serialization failure不得拖垮 Core；應降級、盡可能保留 memory logging，必要時 console warning。

## 13. Session 讀取權限

目前只保留 previous 與 current。公版 MOONSHINE 只允許正式接口提供的 previous 讀取／匯出，不暴露 current。普通 LUNAR/MOONSHINE runtime 功能不得主動讀 previous/current contents；例外僅限 diagnostic export、Logger maintenance 或經正式授權的 HECATE developer inspection。

普通 MOD 只寫自己的 `MOD.<id>` scope，預設沒有 current/previous raw log、其他 module 私有內容、internal ring mutation 或 session rotation。新的 diagnostic read API 必須另行正式設計；Logger 不是 runtime query database。

## 14. Public Export

MOONSHINE 的「Export Previous Log」只調用 LUNAR 正式 export/read interface，取得已格式化 text/blob，再負責下載呈現；不得直接讀 IndexedDB、解析 Logger storage 或自行拼 session file。

目前入口是 `LUNAR.api.moonshine.diagnostics.exportPrevious()`；`status/subscribe` 只服務匯出可用性，不作 gameplay／UI 路由資料。Persistence implementation 可獨立更換，不讓 UI 依賴 storage shape。

## 15. Current 保護

公版隱藏 current，不新增 Export current、View current、Live current。未來若設計 Live Log Viewer／Export Current，屬私人 Developer MOD，不屬公共 MOONSHINE Core；本規範不表示現有 HECATE 已獲得讀取接口。

## 16. Browser Translation

翻譯不是 game-state error，翻譯後文字不得反向寫入 Logger 作 canonical data。可記真正重要的 translation observer failure、feedback loop 或 translated-node preservation failure；禁止每次 characterData mutation 都記一行 DEBUG，避免事件風暴。

## 17. Asset／Scene lifecycle

只記 lifecycle，例如 scene transition start／critical ready／end、profile switch start／pack ready／end。不得逐幀記背景 opacity、moon frame 或其他動畫 frame。

## 18. 精細 profiling 分離

Logger 只記重要摘要，例如 operation elapsed、已偵測的 long task 或 fallback。精細分析仍使用 performance.now、Performance API、DevTools trace 或專用 instrumentation；Logger 不替代 profiler，本規範不要求新增常駐性能 observer。

## 19. 最小化敏感及無關資訊

不記不必要的本機路徑、玩家任意自由文本、不需診斷的個資、完整瀏覽歷史或其他網站資料。環境只保留診斷所需 browser、platform、viewport、DPR、language、SYNODIC versions、game version/fingerprint、installed module list。

b6.8 使用者新增基礎資訊要求：允許 LUNAR quality owner 在初始化／選定／實際降級或靜態偏好改變時旁路提交四檔解析度比例、初次及目前檔位、pending/selected、原因／降級次數、SaveData及獨立背景偏好／decode deadline。僅有限純量白名單，不能延伸為完整resource manifest、無變更的sample更新或runtime讀取來源；匯出仍previous-only，實作與missing/pending語義見 [LOGGER.md](LOGGER.md)。

## 20. MOD ownership

每個 MOD 使用自己的 `MOD.<module-id>`，不得冒充 `LUNAR.*`、`MOONSHINE.*` 或其他 `MOD.*`。module ID `author.foo` 的規範名稱為 `MOD.author.foo`；授權與 scope 驗證屬 LUNAR API，不交給 UI 或 MOD 操作 Logger internals。

## 21. 不形成強耦合

核心工作不得因 Logger 不存在或寫入失敗而停止；Logger return value 不作 gameplay decision。不可將 `log.info(...); doGameLogic();` 改成 `if (log.info(...)) doGameLogic();`。

## 22. 新功能最低診斷要求

新增 subsystem／重大功能完成前，必須能回答：重要 lifecycle 是什麼、失敗是否有 ERROR、fallback 是否有 WARN、偶發故障時能否重建「玩家做了什麼 → 系統做了什麼 → 哪一步失敗」。不能重建有價值的事件鏈，代表 diagnostic coverage 未完成。

## 23. 避免過度記錄

目標是讓只發生一次的故障仍有線索，不是記錄每件事。不得機械地對 every getter／setter／render／mutation／frame 加 log；保留有用 breadcrumb，避免重複和 log storm。

## 24. 不改變時序

普通 write 必須非阻塞、memory-first。不得為 DEBUG `await logger.write(...)`，critical runtime／player command 不等待 disk persistence 或 IndexedDB；enqueue 後遊戲繼續。

## 25. 現階段性能策略

先穩定 Logger、Loading、UI、Map、Combat 等整體結構，完整性能 pass 待主要結構完成後統一進行。現階段優先 correctness、diagnostic value、architecture stability，必須避免明顯退化。

禁止 full-state/per-frame logging、sync storage writes、large repeated stringify、log-triggered capture、DOM serialization 或為記錄而量測 layout。未證明 Logger 是實際 bottleneck 時，不要求大型性能重構、逐 call 納秒微調或重寫 persistence architecture。此策略不取消既有功能變更的性能比較、節點身份或新開發准入檢查；純文件更新不需要重建遊戲或跑管線 benchmark。

## 26. API 版本兼容

Logger 屬 LUNAR API。method signature、scope behavior、export format、session semantics 或 MOD access 改動須視為 API contract 變更評估。MOONSHINE feature 不得依賴 internal object shape，例如 `_sessions.current.buffer[...]`；只使用正式接口。

## 27. Internal detail 不跨層

Ring buffer、storage keys、IndexedDB schema、sequence implementation、quote selection state、checkpoint queue、session storage layout 都是 implementation detail。MOONSHINE/MOD 不得直接讀取，所有跨層讀取經正式 LUNAR Logger API；JavaScript「摸得到」不代表 public API。

## 28. 彩蛋 TOML

Header quote 只影響診斷文件裝飾，任何 subsystem 不依賴其內容；缺失、空或格式錯誤都不影響 Logger 核心。彩蛋是 optional decoration，不是 runtime contract。目前由 build-time 編譯 `[crash].quotes` 並兼容舊 root `quotes`。

## 29. Code Review Checklist

- [ ] 使用正式 LUNAR Logger，跨層入口正確。
- [ ] Scope ownership 正確、名稱穩定；MOD 只用自己的 scope。
- [ ] Level 語義合理，必要 lifecycle／事件鏈有記錄。
- [ ] 捕獲 exception 保留原始 error、stack/context。
- [ ] 不讀 log contents 或 return value 決定 runtime 行為。
- [ ] 不 dump 大型 object，不引入 capture、DOM serialization、layout read。
- [ ] 無同步 storage、大型重複 stringify 或 persistence wait。
- [ ] 不讀 Logger internals，不控制 MOD 無權管理的 lifecycle。
- [ ] 無每幀／每次 mutation 的 log storm。
- [ ] Logger failure fail-soft，不改原功能恢復／rollback／rethrow 契約。

## 30. 開發指南摘要

DEVELOPMENT 開頭的「SYNODIC Logger Rules」摘要指向本規範；摘要不取代以上完整條款。所有後續開發及 review 均按這份 LUNAR API 契約檢查。

## 目前實作對照與後續修改邊界

- 跨層 write/export 與 previous-only 規則使用目前正式入口；公版及現有私人版都沒有 current viewer/export。原文中的未來 HECATE inspection 是允許另行設計的功能類別，不是現成讀取權限。
- 現有 scope validator 接受單段 `MOD.<id>`，尚不接受 `MOD.author.foo`。後續需要此能力時由 LUNAR 修改正式 scope contract／validator 與回歸，不繞過驗證、不以另一套 Logger 補洞。
- 現有 error serializer 有界保存 message/stack，尚未完整保留 name/cause。後續按第10條補足時須保持 fail-soft／有界成本；這次文件更新不冒充實作已完成。
- 本輪不機械改名既有事件/scope，也不以「Logger 標準」授權大規模 runtime 改寫、原生遊戲修改或新 diagnostic read API。

## b6.8 使用者授權的 fatal-only snapshot 例外（2026-10-07）

[完整原文](../diagnostics/b68-recovery-requirements.md)明確授權：fatal capture 後，LUNAR 一次性讀同一 Logger 的有界 current snapshot，凍結 canonical exception、header 和 recent breadcrumbs，Recovery 只匯出這份 immutable text。這不是公開 live/current 讀取、viewer 或一般 Export Current，不改 previous-only ordinary policy。無第二套 ring/persistence；snapshot 不作 runtime oracle。capture→FATAL_EXCEPTION_CAPTURED→CRASH_SNAPSHOT_FROZEN→suspend→Recovery；export/restart 的後續 breadcrumb 不回寫凍結文本。Missing Logger 保留有限原錯與 build context，export failure fail-soft，不因 optional asset/translation/MOD 可恢復錯誤啟動 Recovery。

### b6.8 narrative source breadcrumbs（2026-10-08）

Registered fullscreen narrative bridge uses existing `LUNAR.story` scope: `STORY_CHOICE_SOURCE` only when source/control/run lifecycle identity changes (`id,family,leaves`); `COMMAND_SENT/COMMAND_RESULT` at an accepted leaf (`id,action,command/phase`), preserving caught original exceptions. No repeated read/DOM/text dump, new ring, per-frame logging, runtime Logger reads or readiness dependencies.


### b6.8 optional background deadline classification（2026-10-08）

`MOONSHINE.background` records one `ASSET_DECODE_TIMEOUT` WARN per overdue latest request with existing generation/assetId/tier/reason plus `pending:true`; it indicates degraded visual observation, not cancelled delivery, runtime fatal or failed UI_READY. A valid late decode continues the same low-frequency BG ready/start/commit/complete breadcrumbs. Generation/presentation authority remains runtime-owned; no Logger reads, timers per frame or new diagnostic store. Actual load/decode failure retains `BACKGROUND_REPLACEMENT_DEGRADED`.

### b6.8 editable quality percentages（2026-10-08）

All basic quality header lines use the compiled `[resolution_percent]` values from `lunar.graphics_quality.toml`, including decimal percentages. Do not keep hardcoded50/70/85/100 in mode descriptions. Developer precondition rejection uses WARN `DEV_TEST_UNAVAILABLE {action,reason}` and an ordinary alert, never runtime fatal. These records remain diagnostic only; presentation never reads Logger to determine readiness.

### b6.9 report/notice/export breadcrumbs（2026-10-09）

Stable lowercase scopes `LUNAR.runreport` and `MOONSHINE.runreport`: `RUN_REPORT_AVAILABLE/END_NOTICE_AVAILABLE`, `RUN_REPORT_OPEN/END_NOTICE_OPEN/RUN_REPORT_CLOSE`, native `COMMAND_SENT/COMMAND_RESULT`, `REPORT_EXPORT_START/REPORT_EXPORT_COMPLETE/REPORT_EXPORT_FAILED` and `VISUAL_CAPTURE_DEGRADED` with bounded missing asset IDs. Existing background breadcrumbs carry logical ID/generation for genuine teaser target changes. No frame logging, DOM/report/game dump, new ring, public current reader or diagnostic-based readiness. Optional export CG failure records degraded result and downloads the complete readable report; true PNG failure logs original error and presents retry status, not FATAL.


### b6.9 Lab / scanner / autosave breadcrumbs（2026-10-09）

Existing LUNAR.lab_notice scope adds `kind` to source/open/close context and `LAB_EMBARK_CONFIRM`; original exception is recorded as LAB_NOTICE_COMMAND_FAILED then rethrown. LUNAR.scan records SCAN_CONTINUE_BLOCKED only for an attempted premature command, never per frame. LUNAR.saves records AUTOSAVE_LOAD_REQUEST/COMMIT and a native refusal WARN with resume/reason only; no saved payload/DOM dump, new ring or runtime reads from Logger.


`LUNAR.transitions` records `END_NOTICE_UNDERLAY_PARK {from,to}` at the native passage boundary when the retained teaser parks its hidden passage. It replaces STORY_CONTINUATION only for that declared case. No frame records, copied background state, runtime Logger reads or new diagnostic authority.

### b6.9 Status and motion correction（2026-10-09）

Status-only numeric refresh and body class observations add no per-frame/per-number Logger records. Page-motion intent reuses `LUNAR.effects` and the existing `EFFECT_DEFERRED {target,transition}` lifecycle breadcrumb when a scene is preparing; existing native action/transition logs remain. Geometry/node/capture profiling exists only in external tests, never shipped as Logger state or a second diagnostic interface. No new read authority or persistence policy.

## b6.9 reference retirement breadcrumb（2026-10-09）

`LUNAR.native / DEBUG / RETIRED_HANDLES_RELEASED` records only a small `{count}` when an existing capture sweep actually expires Node-owned handles. No per-frame/per-URL dumps, current-log reads or Logger-driven cleanup/reload decisions. Development-only heap/DOM/resource census probes are not in modules.json or generated release builds.

Focused b6.9 performance review adds no runtime Logger read or per-render/eligibility log. Render phase timings, weak references, heap snapshots and GC remain opt-in test code, excluded from generated shipping HTML. See `../diagnostics/b69-perf-focus-2026-10-10.md`.
