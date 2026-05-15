# 🚀 Error Code RAG System - Setup Guide

## ✅ 已完成項目

### 1. 目錄結構
```
ErrorCodeSystem_Website/
├── index.html                 ✅ 多語言 UI（中/英/越按鈕）
├── css/
│   ├── rag-styles.css         ✅ RAG 系統專屬樣式
│   └── ...（其他樣式）
├── js/
│   ├── app.js                 ✅ 主應用程式（17KB，含多語言+Groq）
│   └── rag.js                 ✅ RAG 核心（語意搜尋）
├── data/
│   └── error_codes.json       ✅ 1217 筆錯誤代碼
├── embeddings/
│   ├── error_codes_embedded.json  ✅ 9.8MB 向量資料
│   └── metadata.json          ✅ 元資料
├── scripts/
│   └── generate-embeddings.js ✅ Node.js 生成腳本
├── package.json               ✅ NPM 設定
└── README_RAG.md              ✅ 完整文件
```

### 2. 核心功能

#### 多語言支援
- 🇹🇼 中文（繁體）
- 🇺🇸 English
- 🇻🇳 Tiếng Việt

#### RAG 架構
- **Embedding 模型**：Xenova/paraphrase-multilingual-MiniLM-L12-v2（384 維）
- **搜尋方式**：Cosine Similarity 語意比對
- **LLM**：Groq API（llama-3.1-8b-instant）

#### UI 特色
- 語言切換按鈕（置中排列）
- 快速提示按鈕（6 個常見問題）
- 對話式介面（類似聊天）
- 批量比對功能（折疊式）

### 3. 檔案總覽

| 檔案 | 大小 | 說明 |
|------|------|------|
| index.html | 7KB | 主頁面，含語言按鈕 |
| js/app.js | 18KB | 主應用程式邏輯 |
| js/rag.js | 5KB | RAG 搜尋核心 |
| css/rag-styles.css | 3KB | RAG 樣式 |
| embeddings/error_codes_embedded.json | 9.8MB | 1217 筆向量 |
| README_RAG.md | 5KB | 使用文件 |

## 🔧 使用方式

### 本地測試
```bash
cd /home/stella_fan/ErrorCodeSystem_Website
npx serve .
# 或
python3 -m http.server 8000
```

### 設定 Groq API Key
在瀏覽器控制台輸入：
```javascript
setGroqApiKey('gsk_xxxxxxxx');
```

### 部署到 GitHub Pages
1. 推送程式碼到 GitHub
2. Settings > Pages > Source: main branch
3. 完成！網址：`https://USERNAME.github.io/ErrorCodeSystem_Website/`

## 📊 技術規格

| 項目 | 規格 |
|------|------|
| 錯誤代碼數量 | 1,217 筆 |
| Embedding 維度 | 384 |
| 支援語言 | 50+（中/英/越為主） |
| 模型大小 | ~80MB（首次下載） |
| LLM | Groq Llama 3.1 8B |
| Token 限制 | 2,000 tokens/次 |

## ⚠️ 注意事項

1. **Mock Embeddings**：目前是隨機生成的 mock 資料，僅供測試
   - 生產環境請執行：`node scripts/generate-embeddings.js`

2. **首次載入**：Transformers.js 需要下載模型（約 80MB）
   - 之後會快取在瀏覽器

3. **CORS**：Groq API 支援瀏覽器直接呼叫

## 🎯 下一步建議

1. **生成真實 Embeddings**（選用）
   ```bash
   npm install @xenova/transformers
   node scripts/generate-embeddings.js
   ```

2. **測試多語言查詢**
   - 中文：「相機測試失敗」
   - English: "power calibration error"
   - Việt: "lỗi kết nối bluetooth"

3. **部署上線**
   ```bash
   git add .
   git commit -m "RAG system with multilingual support"
   git push
   ```

## 📞 支援

如有問題，請參考 README_RAG.md 或檢查瀏覽器控制台錯誤訊息。
