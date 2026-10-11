Root Presentation Flash / Safe Transition Guard
修復從遊戲內畫面返回 Main Menu，以及其他 root-level presentation replacement 時可能出現的全屏閃爍。
這個問題屬於視覺安全與 presentation lifecycle 缺陷，不能依賴 Level 0 asset loading 自然消失。
目標
任何會：
destroy / clear / hide current root
replace full-screen scene
return to Main Menu
switch between major presentation roots

的操作，都不得讓使用者看到：
empty root
body default background
transparent intermediate frame
unloaded background
old/new scene rapid alternation
one-frame white/bright flash

1. 增加 Safe Transition Guard
Safe Transition Guard 是 presentation safety layer，不是新的 Loading Level。
它應位於 scene/menu root 之上，並且在 root replacement 前先遮住整個 viewport。
標準流程：
current presentation visible
↓
activate dark transition shield
↓
ensure shield has actually committed to rendering
↓
teardown / replace old root
↓
build target presentation behind shield
↓
wait for TARGET_UI_READY
↓
reveal target presentation
↓
remove/deactivate shield

2. Shield 必須先真正顯示，再拆舊畫面
不要：
showShield();
destroyCurrentRoot();

在同一 render turn 直接完成。
必須保證瀏覽器至少有一次 presentation opportunity，使 shield 已經覆蓋畫面，再進行 teardown。
可使用現有 rendering scheduler / requestAnimationFrame 機制；若單次 rAF 不能可靠保證，使用保守的 double-rAF。
不要額外引入 busy wait 或固定長延遲。
3. Shield 外觀
使用穩定的深色 neutral / black presentation，與 SYNODIC loading presentation 視覺相容。
過渡應保持亮度連續：
old scene
→ dark cover
→ new scene

禁止：
dark → white → dark
old → empty → new
old/new rapid flashing

Safe Transition Guard 本身不得依賴遠端資源。
4. Main Menu 返回流程
Game → Main Menu 視為 root presentation replacement。
建議流程：
MENU_RETURN_REQUEST
↓
activate transition shield
↓
commit shield
↓
suspend/destroy game presentation as appropriate
↓
build Main Menu
↓
MAIN_MENU_UI_READY
↓
reveal Main Menu
↓
decorative Main Menu assets continue loading as Level 0

不要求等待所有背景圖、CG 或其他 decorative resources 完成。
5. 與 Loading Level 的關係
保持現有：
L0 = non-critical / decorative
L1 = scene transition
L2 = startup / global rebuild

Safe Transition Guard 橫跨以上 Level，專門保證：
visible root replacement is never visually uncovered

不要因為加入 Guard，就把所有 root swap 強制升級成 L2。
6. UI_READY 與 decorative asset 分離
Target presentation reveal 只需要等待：
required structure exists
core controls are available
essential text/UI is ready
critical presentation is stable

不需要等待：
decorative background
optional animated background
non-critical CG
Level 0 assets

這些仍然可以在 reveal 後繼續補載或套用 adaptive asset quality policy。
7. 與 Adaptive Asset Profile 相容
Safe Transition Guard 必須在：
ULTRA
HIGH
MEDIUM
LOW

所有資源 profile 下保持相同行為。
資源 profile 可以改變背景品質或 animated/static variant，但不得改變 transition safety contract。
8. Reduced Motion
若偵測到：
prefers-reduced-motion

可以縮短或取消 fade animation，但不得取消安全遮罩本身。
應保持：
stable old presentation
→ stable dark cover
→ stable new presentation

而不是重新暴露 intermediate frame。
9. Hard invariant
加入以下 presentation invariant：
Never destroy, hide, clear, or replace the currently visible root presentation until either the successor is ready to fully cover the viewport or the persistent transition shield has been visibly committed.
10. Logger breadcrumbs
建議記錄：
ROOT_TRANSITION_REQUEST
TRANSITION_SHIELD_ON
TRANSITION_SHIELD_COMMITTED
ROOT_SWAP_BEGIN
TARGET_UI_READY
TRANSITION_REVEAL_BEGIN
TRANSITION_COMPLETE

若偵測到 transition 中出現 uncovered frame 或 root gap：
ROOT_TRANSITION_GAP

應視為 presentation regression。
11. Regression test
至少測試：
Game → Main Menu
Map → Main Menu
Combat → Main Menu
Menu → Resume/Continue
slow network
failed decorative asset
ULTRA/HIGH/MEDIUM/LOW profiles
animated/static background variants
prefers-reduced-motion

驗收條件：
- 不再出現白屏、空 root、透明 frame 或瞬間亮度跳變。
- Main Menu 可在 decorative assets 未完成時安全 reveal。
- 慢網下不會增加額外閃爍。
- Safe Guard 不造成 unnecessary global rebuild。
- 不破壞現有 L0/L1/L2 Loading semantics。
Core rule:
Root presentation replacement must be visually atomic from the player’s perspective. Intermediate DOM/resource states must never be exposed as full-screen flashes.