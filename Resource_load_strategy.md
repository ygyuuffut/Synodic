Adaptive Startup Asset Quality Profile
SYNODIC 在每次啟動時根據實際網路交付能力，為本 session 選擇一個圖片／背景資源品質檔位。此 Profile 主要控制貼圖、背景圖以及其他大型 presentation image 的解析度版本。
不修改 gameplay、UI geometry、map topology 或 canonical data。
1. 四級資源 Profile
ULTRA
「NASA network」
→ 100% original / near-original resolution

HIGH
「Starlink / expensive fiber ISP」
→ 85% linear resolution

MEDIUM
「ordinary 5G / 4G cellular」
→ 70% linear resolution

LOW
「WCDMA is somehow still alive」
→ 50% linear resolution

百分比表示 width / height resolution scale，不是目標檔案 bytes。
例如：
Original: 2000 × 1200

ULTRA   → 2000 × 1200
HIGH    → 1700 × 1020
MEDIUM  → 1400 × 840
LOW     → 1000 × 600

預先生成並提供正式資源 variant；不得在 browser runtime 中現場重新 resize 原始大圖。
2. 啟動時判定方式
不要只依賴 navigator.connection.effectiveType，也不要把它當成權威。
優先依據 SYNODIC 啟動階段本來就必須發生的實際資源請求，觀察：
TTFB / request latency
effective transfer throughput
request completion time
timeout / failure rate

navigator.connection、rtt、downlink、saveData 等資訊若瀏覽器提供，可作為輔助 hint。
不要為了分類而下載大型 speed-test payload。
如有必要，可使用非常小且有明確大小的 calibration resource，但不得讓 calibration 本身成為新的 startup bottleneck。
3. Profile 選擇應有快速 deadline
Profile 判定不能反過來讓啟動畫面等很久。
startup begins
↓
collect early delivery samples
↓
short classification window
↓
choose profile
↓
resolve remaining large image resources using that profile

如果在判定 deadline 內資料不足：
choose conservative MEDIUM/HIGH fallback

不要為了確認「是不是 ULTRA」而把玩家卡住。
4. Profile 為 session-level policy
一旦啟動完成：
session.assetQuality = ULTRA | HIGH | MEDIUM | LOW

普通場景切換不得因瞬時網速波動來回更換品質。
核心規則：
Downgrade may occur during a session; upgrade does not occur until the next session.
例如：
HIGH
↓ repeated delivery degradation
MEDIUM
↓ severe degradation
LOW

但不得：
HIGH → LOW → HIGH → MEDIUM → HIGH

造成資源反覆替換與視覺抖動。
5. Resource resolver
LUNAR/resource layer 負責 Profile 選擇與資源解析。
概念：
map.foyer.background
├─ ultra
├─ high
├─ medium
└─ low

character.avery.cg.xxx
├─ ultra
├─ high
├─ medium
└─ low

MOONSHINE 只要求 logical asset key：
LUNAR.resources.resolve("map.foyer.background")

不得讓 MOONSHINE 自行判斷網速或拼接不同解析度 URL。
6. 不代表所有圖片都必須有四份
只對真正大型、值得降級的 presentation resource 建立 variant，例如：
map backgrounds
large CG
character illustrations
large scanner / scene imagery

小型 UI icon、Material glyph、字體、小型裝飾資源不需要製作四檔。
若某資源缺少當前檔位，可按最近可用版本 fallback：
requested MEDIUM
medium missing
→ low or high according to declared fallback policy

不得因缺少 variant 導致資源解析失敗。
7. Dynamic map background 與 Quality Profile 分開
「解析度品質」和「是否播放動畫」是兩個獨立維度。
例如：
ULTRA + animated
HIGH + animated
MEDIUM + animated/static
LOW + static

不要把 LOW 直接等同於所有資源都必須 static，但對大型動態地圖背景，可以設定更積極的 fallback。
若 dynamic background 的實際 delivery/decode 超過自身 deadline：
animated
→ predefined static equivalent

此降級仍屬 Level 0，不阻塞 UI_READY。
8. Save-Data 優先
如果瀏覽器明確提供：
saveData = true

應視為使用者意圖，優先降低 Profile，例如最多使用 MEDIUM 或直接 LOW，具體上限由實作決定。
不要因測得高速網路而無視 Save-Data。
9. Logger
啟動時至少記錄：
ASSET_PROFILE_PROBE_START

ASSET_PROFILE_SELECTED
profile=HIGH
reason=observed_delivery
samples=...
estimatedThroughput=...
observedLatency=...

ASSET_PROFILE_DOWNGRADE
from=HIGH
to=MEDIUM
reason=repeated_timeout | poor_throughput | decode_pressure

不要記錄整份 Performance API dump。
10. 不要硬編碼「NASA = X Mbps」作為唯一判定
閾值應集中在一個 policy/config 中，可以日後根據真實測試校準。
assetQualityPolicy
├─ ultraThreshold
├─ highThreshold
├─ mediumThreshold
├─ classificationDeadline
└─ downgradeRules

不要把閾值散落在各個 resource loader。
第一版可以使用合理的暫定閾值，但要在 Logger 與開發文件中標明它們是 tuning parameters，而不是 gameplay constants。
驗收要求
1. 高速環境可使用接近原版品質的資源。
2. 中等／蜂窩環境會在 startup 自動選取較小 variant。
3. 慢速環境不會先下載原版大圖再發現「應該用 50%」。
4. Profile 判定本身不顯著增加 startup time。
5. 同一 session 不因短暫網速波動反覆切換品質。
6. Profile downgrade 不觸發 global UI rebuild。
7. 圖片 variant 不影響 layout geometry、map node position、translation 或 gameplay state。
8. 缺少某一 variant 時 fail-soft。
9. Background animation timeout 仍可獨立降級 static。
Core rule:
SYNODIC selects a session-wide presentation asset quality profile from observed startup delivery conditions. Large presentation assets resolve to pre-generated 100% / 85% / 70% / 50% variants. Runtime degradation may lower the profile, but must never delay gameplay readiness or oscillate between quality levels.