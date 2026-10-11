# SYNODIC Core 1.0.0-rc2

RC2 修復故事 VIEW CG 開啟後 UI 消失、沒有 RETURN 而無法回到遊戲的問題。
故事背景已由 MOONSHINE 的持續存在物件管理，舊 viewer 卻仍只從兼容
workspace 找圖片。現在讀取目前已提交的背景，並辨識 Stomach Fate 的
目標緩衝。CG 沿用 FIT 的等比例水平／垂直置中；圖片缺失或載入失敗仍顯示
固定 RETURN 和狀態文字，避免困在 CG 模式。

故事、Map／Stomach Map、Combat、Blessing、Body Exploration、Upgrade、
Rest、Stomach Fate，以及掃描完成和 Collected Data 的共用 CG 操作已完成
主機回歸。HUD／Story Box、翻譯節點、父頁捲動／焦點及原版進度保持。

安裝：使用 THEIA 1.0.1 匯入 `synodic-core-1.0.0-rc2.zip`，再選受支援的
原版 STG 0.2001 HTML。認證按 manifest 的原始 bytes SHA-256 判定。
工坊改造的原版輸入仍需 THEIA Force；本次驗證了使用者 Deck 輸入，但不代表
所有工坊改造都已認證。已注入的完整遊戲不是安全安裝的原版輸入。

- 公開 Core：LUNAR API 1.0 + MOONSHINE UI 1.0 成對部署。
- 對應源碼：`synodic-source-1.0.0-rc2.zip`，含重建工具、測試、文檔及預編譯資源。
- 授權：GPL-3.0-or-later；第三方字體／圖標保留各自授權。
- 公開封包不包含 STG、工坊完整遊戲或私人 HECATE 實作。
- RC1 封包保持原樣；本次不要求重新下載全目錄資源或清除瀏覽器快取。

驗證範圍：主機 Chrome、受控 artwork；THEIA 安全 PC／C2 及 Force Deck
匯出與 Python 注入逐 byte 相同。封包可由對應源碼離線重建。
本次修正不是性能優化：4× normal Script 中位 212.304→218.225ms，Layout
34.418→51.596ms；主要 capture／copy／render／patch／fit 次數保持。
測量限制及原版隱藏 DOM 債務保留，不宣稱手機 FPS 或記憶體崩潰已改善。

待驗收：新 RC2 檔在 A35 上實際開啟與長時間操作、Android／iOS 跨瀏覽器、
真實 CDN／畫質策略。已用現行返回 API 救回原 A35 session，但不等於新檔
真機驗收。先前 Chrome 整頁 Error 5 的根因仍未確認。

本地發行文件已準備；尚未發布 GitHub Release 或線上 catalog。
