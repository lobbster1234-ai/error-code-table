# Error Code RAG 查詢系統

多語言錯誤代碼語意查詢系統，支援中文、英文、越南語自然語言查詢。

## 🌟 功能特色

- **多語言支援**：中文 (繁體)、English、Tiếng Việt
- **語意搜尋**：使用 Transformers.js 在瀏覽器內生成 embedding
- **RAG 架構**：Retrieval-Augmented Generation，結合語意搜尋 + LLM
- **Groq AI 整合**：使用 Llama 3.1 8B Instant 模型生成自然語言回覆
- **前端部署**：可直接部署到 GitHub Pages，無需後端伺服器

## 📁 專案結構

```
ErrorCodeSystem_Website/
├── index.html                 # 主頁面（含語言切換 UI）
├── css/
│   ├── style.css             # 基礎樣式
│   ├── ai-assistant.css      # AI 助理樣式
│   ├── bulk-compare.css      # 批量比對樣式
│   └── rag-styles.css        # RAG 系統樣式
├── js/
│   ├── app.js                # 主應用程式（含多語言、Groq 整合）
│   └── rag.js                # RAG 核心（語意搜尋）
├── data/
│   └── error_codes.json      # 錯誤代碼資料庫（1200+ 筆）
├── embeddings/
│   ├── error_codes_embedded.json  # 預處理的向量資料
│   └── metadata.json         # Embedding 元資料
├── scripts/
│   ├── generate-embeddings.js     # Node.js embedding 生成腳本
│   ├── generate_embeddings.py     # Python embedding 生成腳本
│   └── create_mock_embeddings.py  # Mock embeddings 生成
├── package.json              # Node.js 依賴
└── README_RAG.md             # 本文件
```

## 🚀 快速開始

### 1. 本地測試

```bash
cd /home/stella_fan/ErrorCodeSystem_Website
# 使用任何靜態檔案伺服器
npx serve .
# 或
python3 -m http.server 8000
```

然後開啟瀏覽器訪問 `http://localhost:8000` 或 `http://localhost:3000`

### 2. 設定 Groq API Key（選用）

在瀏覽器控制台輸入：
```javascript
setGroqApiKey('your-groq-api-key-here');
```

API Key 會儲存在 localStorage，可從 https://console.groq.com 取得免費 Key。

### 3. 部署到 GitHub Pages

```bash
# 初始化 Git（如果還沒有）
git init
git add .
git commit -m "RAG system with multilingual support"

# 推送到 GitHub
git remote add origin https://github.com/YOUR_USERNAME/ErrorCodeSystem_Website.git
git push -u origin main

# 在 GitHub 設定 Pages：Settings > Pages > Source: main branch > / (root)
```

部署後網址：`https://YOUR_USERNAME.github.io/ErrorCodeSystem_Website/`

## 🔧 技術細節

### Embedding 模型

- **模型**：`Xenova/paraphrase-multilingual-MiniLM-L12-v2`
- **維度**：384
- **支援語言**：50+ 語言（含中文、英文、越南語）
- **來源**：Hugging Face Transformers.js

### 生成 Embeddings（生產環境）

如果要生成真實的 embeddings（而非 mock 資料）：

```bash
# 安裝依賴
npm install @xenova/transformers

# 生成 embeddings
node scripts/generate-embeddings.js
```

或使用 Python：
```bash
pip install sentence-transformers
python3 scripts/generate_embeddings.py
```

### RAG 搜尋流程

1. 用戶輸入自然語言查詢（任意語言）
2. Transformers.js 在瀏覽器內生成查詢的 embedding
3. 計算與所有錯誤代碼的 cosine similarity
4. 取出 Top-K 最相關結果
5. （選用）送給 Groq LLM 生成自然語言回覆
6. 顯示結果給用戶

### Groq API 整合

- **模型**：`llama-3.1-8b-instant`
- **Token 限制**：每次最多 2000 tokens
- **System Prompt**：多語言版本（中/英/越）

## 🌐 使用範例

### 中文查詢
```
輸入：「相機測試失敗」
結果：NT061 (RX Test Fail), NT055 (Start RX Fail), ...
```

### English Query
```
Input: "power calibration error"
Result: NT005 (11A Power Calibration Fail), NT008 (5GHz Power Calibration Fail), ...
```

### Tiếng Việt Query
```
Nhập: "lỗi hiệu chỉnh nguồn"
Kết quả: NT005, NT008, NT009, ...
```

## 📝 注意事項

1. **Mock Embeddings**：目前的 embeddings 是 mock 資料（隨機生成），僅供測試。
   生產環境請使用真實的 embedding 模型生成。

2. **瀏覽器效能**：Transformers.js 首次載入模型需要下載約 80MB，之後會快取。

3. **CORS**：Groq API 支援瀏覽器直接呼叫，無需 proxy。

4. **資料來源**：錯誤代碼來自 Google Sheets，透過 Apps Script API 同步。

## 🛠️ 開發者指南

### 新增語言

在 `js/app.js` 的 `langConfig` 和 `quickHints` 新增語言設定。

### 調整搜尋結果數量

在 `js/app.js` 的 `handleSearch()` 中調整：
```javascript
const searchResults = await this.rag.search(message, 10); // 改為需要的數字
```

### 更換 LLM 模型

在 `js/app.js` 的 `callGroqAPI()` 中修改：
```javascript
model: 'llama-3.1-8b-instant' // 改為其他 Groq 支援的模型
```

## 📄 License

MIT License

## 👤 Author

Stella - Error Code RAG System v2.0
