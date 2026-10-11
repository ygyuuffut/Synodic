# 故事文本翻譯工具

遊戲的大部分故事內容存放在 `twine-user-script` 的 JavaScript 字串中，而不是 Twine passage。`story_text_tool.py` 會同時擷取兩者，且不執行遊戲程式。

## 匯出

```sh
python3 SYNODIC/story_text_tool.py extract \
  "Slay the Giantess v0.1374.html" \
  -o SYNODIC/builds/story-text.json
```

預設只匯出至少三個可見單字的字串，以減少 CSS selector、內部 key 等雜訊。若也要翻譯短按鍵文字，可加入 `--min-words 1`。

把 JSON 交給本地模型時，要求它只填寫每個 entry 的 `translation`，不可修改 `id`、`original`、HTML 標籤、`{{placeholder}}`、格式符號或程式片段。空白的 `translation` 代表保留原文。

## 回填

```sh
python3 SYNODIC/story_text_tool.py apply \
  "Slay the Giantess v0.1374.html" \
  SYNODIC/builds/story-text.json \
  -o "SYNODIC/builds/Slay the Giantess v0.1374.translated.html"
```

再把行動版注入到翻譯檔：

```sh
python3 SYNODIC/inject_mobile.py \
  "SYNODIC/builds/Slay the Giantess v0.1374.translated.html"
```

工具會核對穩定 ID 與原文；來源版本不一致時拒絕靜默套用。請保留原 HTML，並先用少量翻譯條目試跑遊戲流程。
