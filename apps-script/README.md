# Google Apps Script 部署指南

## 📋 部署步驟

### 步驟 1：創建 Google Sheet

1. 前往 [Google Sheets](https://sheets.google.com)
2. 點擊「+」創建新的試算表
3. 命名為「Error Code Table」

### 步驟 2：開啟 Apps Script

1. 在 Google Sheet 中，點擊選單「擴充功能」
2. 選擇「Apps Script」
3. 會開啟新的 Apps Script 編輯器頁面

### 步驟 3：貼上代碼

1. 刪除編輯器中預設的 `function myFunction() {...}`
2. 打開 `Code.gs` 文件
3. 複製全部內容
4. 貼到 Apps Script 編輯器中
5. 點擊「儲存專案」圖示（💾）
6. 命名專案為「Error Code API」

### 步驟 4：初始化表格

1. 在 Apps Script 編輯器中，找到 `initializeSheets` 函數
2. 點擊工具列的下拉選單，選擇 `initializeSheets`
3. 點擊「執行」按鈕（▶️）
4. 首次執行需要授權：
   - 點擊「檢查權限」
   - 選擇你的 Google 帳號
   - 點擊「進階」
   - 點擊「前往 Error Code API（不安全）」
   - 點擊「允許」
5. 執行完成後，回到 Google Sheet 查看
6. 應該會看到兩個工作表：
   - `ErrorCodes`（錯誤代碼）
   - `Categories`（類別）

### 步驟 5：匯入錯誤代碼數據

1. 在 Apps Script 編輯器中，創建新的函數來匯入數據：

```javascript
function importErrorCodes() {
  const errorCodes = [
    // 這裡會用腳本自動匯入
  ];
  
  // 請使用下面的 Python 腳本生成匯入代碼
}
```

2. 執行以下 Python 腳本生成匯入代碼：

```bash
cd /home/stella_fan/ErrorCodeSystem_Website
python3 scripts/generate-import.js
```

3. 將生成的代碼貼到 Apps Script 中
4. 執行 `importErrorCodes` 函數

### 步驟 6：部署為 Web 應用

1. 點擊「部署」按鈕（右上角）
2. 選擇「新建部署」
3. 點擊左側齒輪圖示，選擇「Web 應用」
4. 填寫：
   - **說明**：Error Code API v1
   - **執行身分**：我（你的帳號）
   - **誰有權存取**：任何人
5. 點擊「部署」
6. 再次授權（如需要）
7. 複製「Web 應用網址」
   - 格式：`https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXX/exec`

### 步驟 7：更新前端配置

1. 打開 `/home/stella_fan/ErrorCodeSystem_Website/js/app.js`
2. 找到第 5 行：
   ```javascript
   const API_BASE_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
   ```
3. 替換為你的 Web 應用網址：
   ```javascript
   const API_BASE_URL = 'https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXX/exec';
   ```
4. 儲存文件

### 步驟 8：測試 API

訪問以下網址測試 API 是否正常運作：

```
https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXX/exec?action=getStats
```

應該會看到類似回應：

```json
{
  "success": true,
  "stats": {
    "totalErrorCodes": 1217,
    "totalCategories": 29,
    "byCategory": {
      "RF Test Function Issue": 293,
      ...
    }
  }
}
```

### 步驟 9：測試網站

1. 確保 Web 服務器運行中：
   ```bash
   cd /home/stella_fan/ErrorCodeSystem_Website
   python3 -m http.server 8080
   ```

2. 訪問 http://localhost:8080
3. 應該看到黃色提示框消失（如果 API 配置正確）
4. 搜尋和篩選功能應該正常運作

---

## 🔧 API 端點說明

### 獲取所有錯誤代碼
```
GET /exec?action=getAll
```

### 根據代碼查詢
```
GET /exec?action=getByCode&code=NT001
```

### 關鍵字搜尋
```
GET /exec?action=search&q=Power
```

### 獲取所有類別
```
GET /exec?action=getCategories
```

### 獲取統計數據
```
GET /exec?action=getStats
```

### 新增錯誤代碼（POST）
```
POST /exec?action=add
Content-Type: application/x-www-form-urlencoded

code=NT999&description=Test Error&category=RF Test Function Issue
```

### 更新錯誤代碼（POST）
```
POST /exec?action=update
Content-Type: application/x-www-form-urlencoded

code=NT999&description=Updated Description
```

### 刪除錯誤代碼（POST）
```
POST /exec?action=delete&code=NT999
```

### 批量匯入（POST）
```
POST /exec?action=batchImport
Content-Type: application/json

[
  {"code": "NT998", "description": "Test 1", "category": "RF Test"},
  {"code": "NT999", "description": "Test 2", "category": "RF Test"}
]
```

---

## 📊 數據匯入腳本

使用以下 Python 腳本生成 Apps Script 匯入代碼：

```bash
cd /home/stella_fan/ErrorCodeSystem_Website
python3 scripts/generate-import.py
```

這會生成 `importErrorCodes` 函數的完整代碼，包含所有 1217 筆錯誤代碼。

---

## 🌐 上線部署選項

### 選項 1：GitHub Pages（推薦）

1. 創建 GitHub 倉庫
2. 推送網站文件
3. 啟用 GitHub Pages
4. 修改 `js/app.js` 中的 `API_BASE_URL`
5. 訪問 `https://yourusername.github.io/repo-name/`

### 選項 2：Netlify

1. 在 Netlify 創建帳號
2. 拖放 `ErrorCodeSystem_Website` 資料夾
3. 或使用 Git 部署
4. 自動獲得 HTTPS 網址

### 選項 3：Vercel

1. 在 Vercel 創建帳號
2. 連接 GitHub 倉庫
3. 自動部署
4. 獲得 `https://your-project.vercel.app` 網址

### 選項 4：Google Firebase Hosting

1. 安裝 Firebase CLI
2. 初始化專案
3. 部署到 Firebase

---

## 🔐 安全性注意事項

- 目前部署設定為「任何人可存取」
- 如需限制存取，可修改為「僅限我的網域」
- 考慮添加 API 金鑰驗證
- 敏感操作（刪除、批量匯入）建議添加身份驗證

---

## 📝 維護說明

### 更新錯誤代碼

1. 直接在 Google Sheet 中編輯
2. 或使用 API 端點進行增刪改
3. 前端會即時獲取最新數據

### 備份數據

1. 在 Google Sheet 中，點擊「檔案」>「下載」
2. 選擇 Excel 或 CSV 格式
3. 定期備份以防資料遺失

### 監控使用情況

1. 在 Apps Script 儀表板查看執行記錄
2. 監控 API 調用次數
3. 注意配額限制（Google Apps Script 有每日限制）

---

## 🆘 常見問題

### Q: 部署後 API 回應 401 錯誤
**A:** 檢查部署設定，確保「誰有權存取」設為「任何人」

### Q: 搜尋功能無法使用
**A:** 檢查瀏覽器控制台是否有 CORS 錯誤，確認 `API_BASE_URL` 正確

### Q: 數據沒有顯示
**A:** 確認已執行 `initializeSheets()` 和 `importErrorCodes()` 函數

### Q: Apps Script 執行超時
**A:** 大量數據操作建議分批處理，或使用觸發函數非同步執行

---

## 📞 技術支援

如有問題，請檢查：
1. Apps Script 執行記錄
2. 瀏覽器控制台錯誤
3. Google Cloud Platform 配額使用情況

祝部署順利！🚀
