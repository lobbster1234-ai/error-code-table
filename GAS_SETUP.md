# GAS Proxy 設定說明

## 步驟

1. 開啟你的 GAS 專案：https://script.google.com/home
2. 開啟你的 `groq-proxy` 專案
3. 點擊 **設定**（齒輪圖示）→ **屬性** → **專案屬性**
4. 新增一個屬性：
   - **名稱**：`GROQ_API_KEY`
   - **值**：`（你的 Groq API Key）`
5. 點擊 **儲存**
6. 重新部署 Web 應用程式（這樣才能讀取新屬性）

## 為什麼這樣做？

- ✅ API key 不會出現在 GitHub 原始碼裡
- ✅ GitHub 安全掃描不會警告
- ✅ 只有 GAS 管理員能看到 key

## 完成後

你的網站就會：
1. 瀏覽器 → GAS Proxy（不含任何 key）
2. GAS Proxy → Groq API（含從 Properties 讀取的 key）
3. 超安全！🔒
