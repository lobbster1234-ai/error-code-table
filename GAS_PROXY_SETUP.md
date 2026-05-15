# GAS Proxy 建立與設定指南

## 目標
建立一個 Google Apps Script (GAS) 專案，作為前端與 Groq API 之間的安全代理。

---

## 步驟 1：建立 GAS 專案

1. 前往 [script.google.com](https://script.google.com/home)
2. 點擊 **+ 新專案**（左上角）
3. 專案名稱改為：`groq-proxy`
4. 把預設的 `Code.gs` 內容全部刪除，貼上以下程式碼：

```javascript
/**
 * Groq API Proxy - Google Apps Script
 * 隱藏 API Key，轉發請求到 Groq
 * 
 * ⚠️ 重要：請在 GAS 的「專案設定」→「屬性」中設定 GROQ_API_KEY
 * 不要直接在程式碼裡寫 API key！
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * 取得 Groq API Key
 * 從 Properties Service 讀取（安全）
 */
function getGroqApiKey() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const key = scriptProperties.getProperty('GROQ_API_KEY');
  if (!key) {
    throw new Error('請先在 GAS 專案設定中設定 GROQ_API_KEY 屬性');
  }
  return key;
}

/**
 * Web App 入口點
 * @param {Object} e - HTTP 請求參數
 */
function doPost(e) {
  // CORS 處理
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  if (e.method === 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setHeaders(headers);
  }
  
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { query, context, language } = requestData;
    
    // 建立 system prompt
    const systemPrompt = getSystemPrompt(language);
    
    // 呼叫 Groq API
    const response = UrlFetchApp.fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getGroqApiKey()}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `用戶問題: ${query}\n\n相關錯誤代碼:\n${context}\n\n請分析這些錯誤代碼，並給出最相關的建議。`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    
    const groqData = JSON.parse(response.getContentText());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      analysis: groqData.choices[0].message.content,
      model: 'llama-3.1-8b-instant'
    }))
    .setHeaders(headers);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    }))
    .setHeaders(headers);
  }
}

/**
 * GET 請求 - 測試用
 */
function doGet(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  const action = e.parameter.action;
  
  if (action === 'ping') {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Groq Proxy 服務正常運行',
      version: '1.0.0'
    }))
    .setHeaders(headers);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Groq Proxy API',
    usage: 'POST 請求到這個 URL，包含 query, context, language 參數'
  }))
  .setHeaders(headers);
}

/**
 * 取得多語言 system prompt
 */
function getSystemPrompt(lang) {
  const prompts = {
    zh: '你是工廠錯誤代碼查詢助手。分析用戶的問題，從提供的錯誤代碼列表中找出最相關的項目，並給出簡潔的分析和建議。用繁體中文回答。',
    en: 'You are a factory error code query assistant. Analyze the user\'s question, find the most relevant items from the provided error code list, and give concise analysis and recommendations.',
    vi: 'Bạn là trợ lý truy vấn mã lỗi nhà máy. Phân tích câu hỏi của người dùng, tìm các mục phù hợp nhất từ danh sách mã lỗi được cung cấp, và đưa ra phân tích và khuyến nghị ngắn gọn.'
  };
  return prompts[lang] || prompts.zh;
}
```

5. 點擊 **儲存**（💾 磁碟圖示）

---

## 步驟 2：設定 API Key

1. 點擊 **設定**（⚙️ 齒輪圖示）
2. 選擇 **專案屬性**
3. 點擊 **新增屬性**
   - **名稱**：`GROQ_API_KEY`
   - **值**：`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`
4. 點擊 **儲存**

---

## 步驟 3：部署為 Web 應用程式

1. 點擊 **部署**（🚀 圖示）
2. 選擇 **新建部署**
3. 類型選擇 **Web 應用程式**
4. 設定：
   - **描述**：Groq API Proxy
   - **執行身分**：我
   - **誰有權存取**：任何人
5. 點擊 **部署**
6. 複製 **Web 應用程式網址**（格式類似：
   `https://script.google.com/macros/s/AKfycb.../exec`）

---

## 步驟 4：更新前端程式碼

1. 修改 `/home/stella_fan/ErrorCodeSystem_Website/js/app.js` 第 212 行
2. 把 `GAS_PROXY_URL` 改成你剛複製的網址

---

## 步驟 5：測試

1. 訪問你的 GitHub Pages 網站
2. 在主控台輸入測試：`fetch('你的GAS網址?action=ping').then(r=>r.json()).then(console.log)`
3. 應該看到 `{success: true, message: 'Groq Proxy 服務正常運行', ...}`

完成後你的系統就會：
- 🔒 API key 完全不會出現在 GitHub
- ✅ GitHub 安全掃描通過
- ✅ 只有 GAS 能看到 key
