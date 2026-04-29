# 🚀 Error Code Table 上線部署完整指南

## 📋 概述

本指南將協助你將 Error Code Table 比對網站部署到生產環境，使用 Google Sheets + Apps Script 作為後端數據庫。

---

## 🗄️ 第一部分：設置 Google Sheets 後端

### 步驟 1：創建 Google Sheet

1. 前往 [Google Sheets](https://sheets.google.com)
2. 點擊「+ 空白」創建新的試算表
3. 命名為「Error Code Database」
4. 記住這個試算表的名稱，稍後會用到

### 步驟 2：開啟 Apps Script 編輯器

1. 在 Google Sheet 中，點擊選單「擴充功能」
2. 選擇「Apps Script」
3. 會開啟新的瀏覽器分頁，顯示 Apps Script 編輯器

### 步驟 3：複製 API 代碼

1. 打開文件：`/home/stella_fan/ErrorCodeSystem_Website/apps-script/Code.gs`
2. 複製全部內容（Ctrl+A → Ctrl+C）
3. 貼到 Apps Script 編輯器中（覆蓋預設代碼）
4. 點擊「儲存專案」圖示（💾）或按 Ctrl+S
5. 命名專案為「Error Code API」

### 步驟 4：複製數據匯入代碼

1. 打開文件：`/home/stella_fan/ErrorCodeSystem_Website/scripts/ImportData.gs`
2. 複製全部內容
3. 在 Apps Script 編輯器中，點擊「+」新增檔案
4. 選擇「腳本」，命名為 `ImportData`
5. 貼上剛剛複製的內容
6. 儲存（Ctrl+S）

### 步驟 5：執行數據匯入

1. 在 Apps Script 編輯器上方的函數下拉選單中，選擇 `initializeAndImport`
2. 點擊「執行」按鈕（▶️）
3. **首次執行需要授權**：
   - 點擊「檢查權限」
   - 選擇你的 Google 帳號
   - 點擊「進階」
   - 點擊「前往 Error Code API（不安全）」← 這是正常的，因為是你自己開發的
   - 點擊「允許」
4. 等待執行完成（約 30-60 秒）
5. 查看「執行記錄」（錘子圖示）確認成功：
   ```
   開始初始化...
   匯入類別...
   匯入錯誤代碼...
   ✅ 全部完成！
   ```

### 步驟 6：驗證數據

1. 回到 Google Sheet
2. 應該看到三個工作表：
   - `ErrorCodes` - 包含 1217 筆錯誤代碼
   - `Categories` - 包含 29 個類別
   - 可能還有其他自動創建的工作表
3. 檢查 `ErrorCodes` 工作表：
   - 第 1 行：標題（Code, Description, Category, CreatedAt）
   - 第 2 行開始：數據（NT001, NT002, ...）

### 步驟 7：部署為 Web 應用

1. 在 Apps Script 編輯器中，點擊右上角的「部署」按鈕
2. 選擇「新建部署」
3. 點擊左側齒輪圖示 ⚙️
4. 選擇「Web 應用」
5. 填寫部署資訊：
   - **說明**：Error Code API v1.0
   - **執行身分**：我（你的 Google 帳號）
   - **誰有權存取**：任何人 ← 重要！
6. 點擊「部署」
7. 再次授權（如需要）
8. 複製「Web 應用網址」
   - 格式：`https://script.google.com/macros/s/YOUR_UNIQUE_ID/exec`
   - 儲存這個網址，稍後會用到

### 步驟 8：測試 API

在瀏覽器中打開以下網址（替換为你的 Web 應用網址）：

```
https://YOUR_UNIQUE_ID.exec?action=getStats
```

應該看到 JSON 回應：

```json
{
  "success": true,
  "stats": {
    "totalErrorCodes": 1217,
    "totalCategories": 29,
    "byCategory": {
      "RF Test Function Issue": 293,
      "EEPROM Issue": 2,
      ...
    }
  }
}
```

---

## 🌐 第二部分：更新前端配置

### 步驟 9：修改 API 網址

1. 打開文件：`/home/stella_fan/ErrorCodeSystem_Website/js/app.js`
2. 找到第 5 行：
   ```javascript
   const API_BASE_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
   ```
3. 替換為你的 Web 應用網址：
   ```javascript
   const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_UNIQUE_ID/exec';
   ```
4. 儲存文件

### 步驟 10：本地測試

1. 確保 Web 服務器運行中：
   ```bash
   cd /home/stella_fan/ErrorCodeSystem_Website
   python3 -m http.server 8080
   ```

2. 在瀏覽器打開：http://localhost:8080
3. 確認：
   - 黃色提示框消失
   - 搜尋功能正常
   - 統計數據正確顯示（1217 筆錯誤代碼）

---

## 📦 第三部分：選擇部署平台

### 選項 A：GitHub Pages（推薦，完全免費）

#### 優點
- 免費
- 簡單易用
- 自帶 HTTPS
- 自訂網域支援

#### 部署步驟

1. **創建 GitHub 倉庫**
   ```bash
   cd /home/stella_fan/ErrorCodeSystem_Website
   git init
   git add .
   git commit -m "Initial commit - Error Code Table Website"
   ```

2. **創建 GitHub 倉庫**（在瀏覽器）
   - 前往 https://github.com/new
   - 倉庫名稱：`error-code-table`
   - 設為公開（Public）
   - 點擊「Create repository」

3. **推送代碼**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/error-code-table.git
   git branch -M main
   git push -u origin main
   ```

4. **啟用 GitHub Pages**
   - 在 GitHub 倉庫頁面，點擊「Settings」
   - 左側選單點擊「Pages」
   - Source 選擇「Deploy from a branch」
   - Branch 選擇「main」和「/ (root)」
   - 點擊「Save」

5. **等待部署**
   - 等待 1-2 分鐘
   - 重新整理頁面，看到綠色對勾
   - 你的網站網址：`https://YOUR_USERNAME.github.io/error-code-table/`

6. **測試上線版本**
   - 打開 GitHub Pages 網址
   - 確認所有功能正常

---

### 選項 B：Netlify（推薦，完全免費）

#### 優點
- 拖放部署
- 自動 HTTPS
- 自動部署（連接 Git）
- 表單功能

#### 部署步驟

1. **方法 1：拖放部署**
   - 前往 https://app.netlify.com/drop
   - 將 `ErrorCodeSystem_Website` 資料夾拖到頁面上
   - 等待上傳完成
   - 獲得隨機網址（如：`https://wonderful-site-12345.netlify.app`）

2. **方法 2：Git 部署（推薦）**
   - 在 Netlify 創建帳號
   - 點擊「Add new site」→「Import an existing project」
   - 選擇 GitHub
   - 授權 Netlify 存取 GitHub
   - 選擇 `error-code-table` 倉庫
   - 構建設定保持預設
   - 點擊「Deploy site」

3. **自訂網域（可選）**
   - 在 Netlify 儀表板，點擊「Domain settings」
   - 添加自訂網域
   - 按照指示設定 DNS

---

### 選項 C：Vercel（完全免費）

#### 優點
- 自動部署
- 全球 CDN
- 分析功能

#### 部署步驟

1. **安裝 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **部署**
   ```bash
   cd /home/stella_fan/ErrorCodeSystem_Website
   vercel
   ```

3. **按照提示操作**
   - 首次使用需要登入
   - 接受預設設定
   - 獲得生產網址

---

### 選項 D：Google Firebase Hosting

#### 優點
- Google 基礎設施
- 全球 CDN
- 免費配額充足

#### 部署步驟

1. **安裝 Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **登入 Firebase**
   ```bash
   firebase login
   ```

3. **初始化專案**
   ```bash
   cd /home/stella_fan/ErrorCodeSystem_Website
   firebase init hosting
   ```
   
   回答問題：
   - Public directory: `.` (當前目錄)
   - Single-page app: `No`
   - Overwrite files: `No`

4. **部署**
   ```bash
   firebase deploy
   ```

5. **獲得網址**
   - 格式：`https://YOUR_PROJECT.web.app`

---

## 🔐 第四部分：安全與維護

### 安全設定

1. **API 存取控制**
   - 目前設定為「任何人可存取」
   - 如需限制，在 Apps Script 部署設定中改為「僅限我的網域」

2. **CORS 設定**
   - Apps Script 自動處理 CORS
   - 無需額外設定

3. **敏感操作保護**
   - 刪除、批量匯入等操作建議添加 API 金鑰驗證
   - 可在 Apps Script 中添加 `X-API-Key` 檢查

### 數據備份

1. **定期備份 Google Sheet**
   - 在 Google Sheet 中：「檔案」→「下載」→「Excel」或「CSV」
   - 或使用 Google Takeout 自動備份

2. **版本控制**
   - 在 Apps Script 中：「檔案」→「管理版本」→「儲存新版本」
   - 重大更新前務必儲存版本

### 監控與日誌

1. **查看執行記錄**
   - 在 Apps Script 編輯器中，點擊左側「執行記錄」圖示
   - 查看所有 API 調用和錯誤

2. **設定通知**
   - 在 Apps Script 中設定觸發函數
   - 失敗時發送電子郵件通知

---

## 🆘 常見問題排除

### Q1: API 回應 401 錯誤
**解決方案：**
- 檢查部署設定：「誰有權存取」必須設為「任何人」
- 重新部署 Web 應用

### Q2: CORS 錯誤
**解決方案：**
- 確認使用正確的 API 網址（以 `/exec` 結尾）
- 檢查瀏覽器控制台詳細錯誤

### Q3: 數據沒有顯示
**解決方案：**
- 確認已執行 `initializeAndImport()` 函數
- 檢查 Google Sheet 中是否有數據
- 查看瀏覽器控制台錯誤

### Q4: Apps Script 執行超時
**解決方案：**
- 數據匯入已設定分批處理（每批 100 筆）
- 避免在尖峰時段執行大量操作

### Q5: GitHub Pages 404 錯誤
**解決方案：**
- 確認倉庫名稱與 GitHub Pages 設定一致
- 等待 2-3 分鐘讓部署生效
- 檢查 `index.html` 是否存在於倉庫根目錄

---

## 📊 上線後檢查清單

- [ ] Google Sheet 數據正確（1217 筆錯誤代碼）
- [ ] Apps Script API 正常運作
- [ ] 前端已更新 API 網址
- [ ] 本地測試通過
- [ ] 已選擇並完成部署平台
- [ ] 上線版本測試通過
- [ ] 搜尋功能正常
- [ ] 比對功能正常
- [ ] 統計數據正確
- [ ] 手機版介面正常
- [ ] 已設定數據備份

---

## 🎉 完成！

恭喜！你的 Error Code Table 比對網站已經上線了！

### 下一步建議

1. **自訂品牌**
   - 修改網站標題和 logo
   - 更新配色方案
   - 添加 favicon

2. **功能擴充**
   - 添加用戶登入功能
   - 允許用戶提交新錯誤代碼
   - 添加錯誤代碼詳細頁面

3. **分析與追蹤**
   - 添加 Google Analytics
   - 追蹤熱門搜尋關鍵字
   - 監控 API 使用情況

4. **SEO 優化**
   - 添加 meta 描述
   - 優化頁面標題
   - 添加結構化數據

如有任何問題，請查看 Apps Script 執行記錄或瀏覽器控制台！🚀
