# ⚡ 快速開始指南 - 5 分鐘部署

## 🎯 目標
在 5 分鐘內完成 Google Sheets 後端設置並讓網站上線。

---

## 📝 步驟 1：設置 Google Sheets（3 分鐘）

### 1.1 創建試算表
1. 前往 https://sheets.google.com
2. 點擊「+」創建新的空白試算表
3. 命名為「Error Code Database」

### 1.2 開啟 Apps Script
1. 點擊選單「擴充功能」→「Apps Script」
2. 刪除編輯器中的所有代碼

### 1.3 貼上完整代碼（只需這一個！）
1. 打開 `/home/stella_fan/ErrorCodeSystem_Website/COMPLETE_APPS_SCRIPT.gs`
2. 複製全部內容（Ctrl+A → Ctrl+C）
3. 貼到 Apps Script 編輯器（覆蓋所有內容）
4. 儲存（Ctrl+S），命名為「Error Code API」

> ✅ 這個文件已包含 API + 1217 筆錯誤代碼匯入，不需要其他文件！

### 1.4 執行匯入
1. 在 Apps Script 上方選擇 `initializeAndImport` 函數
2. 點擊「執行」▶️
3. 授權（點擊「進階」→「前往 Error Code API」→「允許」）
4. 等待 30-60 秒直到完成

### 1.5 部署 Web 應用
1. 點擊「部署」→「新建部署」
2. 點擊齒輪 ⚙️ → 選擇「Web 應用」
3. 設定：
   - 說明：Error Code API
   - 執行身分：我
   - 誰有權存取：**任何人** ← 重要！
4. 點擊「部署」
5. **複製 Web 應用網址**（格式：`https://script.google.com/macros/s/XXX/exec`）

---

## 🖥️ 步驟 2：更新前端（1 分鐘）

### 2.1 修改 API 網址
1. 打開 `/home/stella_fan/ErrorCodeSystem_Website/js/app.js`
2. 第 5 行，替換：
   ```javascript
   const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
   ```

### 2.2 本地測試
```bash
cd /home/stella_fan/ErrorCodeSystem_Website
python3 -m http.server 8080
```
打開 http://localhost:8080 確認功能正常

---

## 🚀 步驟 3：上線部署（1 分鐘）

### 選項 A：GitHub Pages（推薦）

```bash
# 初始化 Git
cd /home/stella_fan/ErrorCodeSystem_Website
git init
git add .
git commit -m "Deploy Error Code Table"

# 在 GitHub.com 創建新倉庫後
git remote add origin https://github.com/YOUR_USERNAME/error-code-table.git
git branch -M main
git push -u origin main
```

然後在 GitHub：
1. Settings → Pages
2. Source 選擇「main branch」
3. 等待 2 分鐘
4. 訪問 `https://YOUR_USERNAME.github.io/error-code-table/`

### 選項 B：Netlify（最快）

1. 前往 https://app.netlify.com/drop
2. 將 `ErrorCodeSystem_Website` 資料夾拖到頁面上
3. 完成！獲得網址

---

## ✅ 驗證清單

- [ ] Google Sheet 中有 1217 筆數據
- [ ] API 測試成功：`https://YOUR_ID.exec?action=getStats`
- [ ] 本地測試正常
- [ ] 上線版本可訪問
- [ ] 搜尋功能正常
- [ ] 比對功能正常

---

## 🆘 快速排錯

| 問題 | 解決方案 |
|------|----------|
| API 401 錯誤 | 檢查部署設定「誰有權存取」=「任何人」 |
| 沒有數據顯示 | 確認已執行 `initializeAndImport()` |
| GitHub Pages 404 | 等待 2-3 分鐘，檢查倉庫設定 |
| CORS 錯誤 | 確認 API 網址正確（以 `/exec` 結尾） |

---

## 📞 需要更多幫助？

查看完整部署指南：`DEPLOYMENT.md`

**恭喜完成！** 🎉

---

## 📚 重要文件

| 文件 | 用途 |
|------|------|
| **COMPLETE_APPS_SCRIPT.gs** | ⭐ 完整代碼（API + 1217 筆數據匯入）|
| QUICKSTART.md | 本快速開始指南 |
| DEPLOYMENT.md | 完整部署指南 |
| PROJECT_SUMMARY.md | 專案總結 |

---

## 🆘 快速排錯

| 問題 | 解決方案 |
|------|----------|
| API 401 錯誤 | 檢查部署設定「誰有權存取」=「任何人」 |
| 沒有數據顯示 | 確認已執行 `initializeAndImport()` |
| GitHub Pages 404 | 等待 2-3 分鐘，檢查倉庫設定 |
| CORS 錯誤 | 確認 API 網址正確（以 `/exec` 結尾） |
| 找不到函數 | 確認已複製 `COMPLETE_APPS_SCRIPT.gs` 完整內容 |
