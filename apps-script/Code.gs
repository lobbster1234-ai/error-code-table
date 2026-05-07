/**
 * Error Code Table API - Google Apps Script
 * 
 * 部署步驟：
 * 1. 創建新的 Google Sheet
 * 2. 擴展功能 > Apps Script
 * 3. 貼上此代碼
 * 4. 點擊「部署」>「新建部署」
 * 5. 選擇「Web 應用」
 * 6. 執行身分：我
 * 7. 誰有權存取：任何人
 * 8. 複製 Web 應用網址
 * 
 * API 端點：
 * GET /exec?action=getAll - 獲取所有錯誤代碼
 * GET /exec?action=getByCode&code=NT001 - 根據代碼查詢
 * GET /exec?action=search&q=keyword - 關鍵字搜尋
 * GET /exec?action=getCategories - 獲取所有類別
 * GET /exec?action=askAI&question=xxx&context=xxx - AI 問答（Groq Llama 3）
 */

// Google Sheet ID（部署後會自動使用綁定的表格）
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getAll':
        return getAllErrorCodes();
      case 'getByCode':
        return getByCode(e.parameter.code);
      case 'search':
        return searchErrorCodes(e.parameter.q);
      case 'getCategories':
        return getCategories();
      case 'getStats':
        return getStats();
      case 'askAI':
        return askAI(e.parameter.question, e.parameter.context);
      default:
        return jsonResponse({ error: 'Unknown action', availableActions: ['getAll', 'getByCode', 'search', 'getCategories', 'getStats', 'askAI'] });
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'add':
        return addErrorCode(e.parameter);
      case 'update':
        return updateErrorCode(e.parameter);
      case 'delete':
        return deleteErrorCode(e.parameter.code);
      case 'batchImport':
        return batchImport(e.postData.contents);
      case 'submitRequest':
        return submitRequest(e.parameter);
      case 'askAI':
        return askAI(e.parameter.question, e.parameter.context);
      default:
        return jsonResponse({ error: 'Unknown action: ' + action }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * 獲取所有錯誤代碼
 */
function getAllErrorCodes() {
  const sheet = getSheet('ErrorCodes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const errorCodes = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return jsonResponse({
    success: true,
    count: errorCodes.length,
    data: errorCodes
  });
}

/**
 * 根據代碼查詢
 */
function getByCode(code) {
  if (!code) {
    return jsonResponse({ error: 'Code parameter required' }, 400);
  }
  
  const sheet = getSheet('ErrorCodes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const result = data.slice(1).find(row => row[0] === code);
  
  if (!result) {
    return jsonResponse({ error: 'Code not found', code: code }, 404);
  }
  
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = result[index];
  });
  
  return jsonResponse({
    success: true,
    data: obj
  });
}

/**
 * 關鍵字搜尋
 */
function searchErrorCodes(query) {
  if (!query) {
    return jsonResponse({ error: 'Query parameter required' }, 400);
  }
  
  const sheet = getSheet('ErrorCodes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const searchLower = query.toLowerCase();
  
  const results = data.slice(1).filter(row => {
    return row.some(cell => 
      String(cell).toLowerCase().includes(searchLower)
    );
  });
  
  const errorCodes = results.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return jsonResponse({
    success: true,
    count: errorCodes.length,
    query: query,
    data: errorCodes
  });
}

/**
 * 獲取所有類別
 */
function getCategories() {
  const sheet = getSheet('Categories');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const categories = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return jsonResponse({
    success: true,
    count: categories.length,
    data: categories
  });
}

/**
 * 獲取統計數據
 */
function getStats() {
  const errorSheet = getSheet('ErrorCodes');
  const categorySheet = getSheet('Categories');
  
  const errorCount = errorSheet.getLastRow() - 1;
  const categoryCount = categorySheet.getLastRow() - 1;
  
  // 各類別統計
  const errorData = errorSheet.getDataRange().getValues();
  const categoryStats = {};
  
  errorData.slice(1).forEach(row => {
    const category = row[2] || 'Unknown';
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });
  
  return jsonResponse({
    success: true,
    stats: {
      totalErrorCodes: errorCount,
      totalCategories: categoryCount,
      byCategory: categoryStats
    }
  });
}

/**
 * 新增錯誤代碼
 */
function addErrorCode(params) {
  const sheet = getSheet('ErrorCodes');
  const newRow = [
    params.code,
    params.description,
    params.category,
    new Date()
  ];
  
  sheet.appendRow(newRow);
  
  return jsonResponse({
    success: true,
    message: 'Error code added successfully',
    data: { code: params.code }
  });
}

/**
 * 更新錯誤代碼
 */
function updateErrorCode(params) {
  const sheet = getSheet('ErrorCodes');
  const data = sheet.getDataRange().getValues();
  
  const rowIndex = data.slice(1).findIndex(row => row[0] === params.code) + 1;
  
  if (rowIndex === 0) {
    return jsonResponse({ error: 'Code not found', code: params.code }, 404);
  }
  
  if (params.description) {
    sheet.getRange(rowIndex + 1, 2).setValue(params.description);
  }
  if (params.category) {
    sheet.getRange(rowIndex + 1, 3).setValue(params.category);
  }
  
  return jsonResponse({
    success: true,
    message: 'Error code updated successfully',
    data: { code: params.code }
  });
}

/**
 * 刪除錯誤代碼
 */
function deleteErrorCode(code) {
  const sheet = getSheet('ErrorCodes');
  const data = sheet.getDataRange().getValues();
  
  const rowIndex = data.slice(1).findIndex(row => row[0] === code) + 1;
  
  if (rowIndex === 0) {
    return jsonResponse({ error: 'Code not found', code: code }, 404);
  }
  
  sheet.deleteRow(rowIndex + 1);
  
  return jsonResponse({
    success: true,
    message: 'Error code deleted successfully',
    data: { code: code }
  });
}

/**
 * AI 智慧推薦（使用 Groq API - Llama 3）
 * Groq 提供免費額度，速度快，品質高
 */
function askAI(question, context) {
  try {
    // Groq API Key - 請替換成你的 Key
    const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE'; // ⚠️ 請改成你的 Groq API Key
    const MODEL = 'llama-3.3-70b-versatile';
    
    // 組合 prompt
    const systemPrompt = `你是製造測試設備的 Error Code 助理，也是一個友善的 AI 助手。

你的任務：
1. 如果用戶問候（說嗨、你好），請友善回應，並詢問遇到什麼問題
2. 如果提到設備或錯誤問題，從候選資料中推薦最相關的 Error Code
3. 如果候選資料都不相關，誠實說明並建議申請新代碼

候選資料庫（本地搜尋找到的相關項目）：
${context}

重要限制：
- 你只能推薦上面候選資料中的代碼
- 禁止回傳空陣列，必須至少推薦最相關的 1-5 個
- 用中文回應，語氣自然友善

回應格式（JSON，不要 markdown）：
{
 "thinking": "簡短說明你的判斷",
 "recommendations": [
 {"code": "代碼", "reason": "為什麼適合", "confidence": "高/中/低"}
 ],
 "suggestions": "給用戶的建議或回覆"
}`;
    
    const userPrompt = `用戶問題："${question}"\n\n請分析並推薦最相關的 Error Code。`;
    
    // 呼叫 Groq API
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const payload = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1024
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const resultText = response.getContentText();
    
    console.log('Groq API Response Code:', responseCode);
    console.log('Groq API Response:', resultText.substring(0, 500));
    
    if (responseCode !== 200) {
      return jsonResponse({ 
        success: false, 
        error: `Groq API HTTP ${responseCode}: ${resultText.substring(0, 200)}`,
        fallback: true 
      });
    }
    
    const result = JSON.parse(resultText);
    
    if (result.error) {
      return jsonResponse({ 
        success: false, 
        error: result.error.message || 'Groq API error',
        fallback: true 
      });
    }
    
    const content = result.choices?.[0]?.message?.content || '{}';
    
    let aiResponse;
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      aiResponse = JSON.parse(jsonStr);
      
      if (!aiResponse.thinking) aiResponse.thinking = 'AI 已分析您的問題';
      if (!aiResponse.recommendations) aiResponse.recommendations = [];
      if (!aiResponse.suggestions) aiResponse.suggestions = '';
      
    } catch (e) {
      aiResponse = {
        thinking: 'AI 已分析您的問題，但回應格式需要調整',
        recommendations: [],
        suggestions: content.substring(0, 500)
      };
    }
    
    return jsonResponse({
      success: true,
      data: aiResponse,
      model: MODEL
    });
    
  } catch (error) {
    console.error('Groq API error:', error);
    return jsonResponse({ 
      success: false, 
      error: error.message,
      fallback: true 
    }, 500);
  }
}

/**
 * 提交新 Error Code 申請
 * 儲存到 Requests 工作表並發送通知郵件
 */
function submitRequest(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let requestSheet = ss.getSheetByName('Requests');
  if (!requestSheet) {
    requestSheet = ss.insertSheet('Requests');
    requestSheet.appendRow([
      'RequestID', 
      'Code', 
      'Description', 
      'Category', 
      'Notes', 
      'RequesterEmail', 
      'RequestDate', 
      'Status',
      'ApprovedBy',
      'ApprovedDate',
      'ResponseMessage'
    ]);
    requestSheet.setColumnWidth(1, 80);
    requestSheet.setColumnWidth(2, 100);
    requestSheet.setColumnWidth(3, 300);
    requestSheet.setColumnWidth(4, 150);
    requestSheet.setColumnWidth(5, 300);
    requestSheet.setColumnWidth(6, 200);
    requestSheet.setColumnWidth(7, 120);
    requestSheet.setColumnWidth(8, 100);
    requestSheet.setColumnWidth(9, 150);
    requestSheet.setColumnWidth(10, 120);
    requestSheet.setColumnWidth(11, 300);
  }
  
  const requestId = 'REQ-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  
  const newRow = [
    requestId,
    params.code,
    params.description,
    params.category || '待分類',
    params.notes || '',
    params.requesterEmail,
    new Date(),
    'pending',
    '',
    '',
    ''
  ];
  
  requestSheet.appendRow(newRow);
  
  try {
    const subject = `[Error Code 申請] 新請求 ${requestId} - ${params.code}`;
    const body = `
有新的 Error Code 申請需要審核。

━━━━━━━━━━━━━━━━━━━━━
📋 申請詳情
━━━━━━━━━━━━━━━━━━━━━

請求編號：${requestId}
申請代碼：${params.code}
錯誤描述：${params.description}
類別：${params.category || '待分類'}

補充說明：
${params.notes || '(無)'}

━━━━━━━━━━━━━━━━━━━━━
👤 申請人資訊
━━━━━━━━━━━━━━━━━━━━━

Email：${params.requesterEmail}
申請時間：${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')}

━━━━━━━━━━━━━━━━━━━━━
🔗 快速操作
━━━━━━━━━━━━━━━━━━━━━

1. 查看申請清單：
 ${ss.getUrl()}#gid=${requestSheet.getSheetId()}

2. 審核完成後，請回覆申請人並更新工作表「Status」欄位。

此郵件由 Error Code 批量比對系統自動發送。
`;
    
    MailApp.sendEmail({
      to: 'real@example.com',
      subject: subject,
      body: body,
      name: 'Error Code 系統通知'
    });
    
    MailApp.sendEmail({
      to: params.requesterEmail,
      subject: `[Error Code 申請已提交] ${requestId}`,
      body: `
您好，

您的 Error Code 申請已收到，我們會盡快審核。

請求編號：${requestId}
申請代碼：${params.code}

審核結果將通知至此 Email。

━━━━━━━━━━━━━━━━━━━━━
Error Code 批量比對系統
`,
      name: 'Error Code 系統通知'
    });
    
  } catch (emailError) {
    console.error('郵件發送失敗:', emailError);
  }
  
  return jsonResponse({
    success: true,
    message: '申請已提交，審核郵件已發送',
    data: {
      requestId: requestId,
      code: params.code,
      status: 'pending'
    }
  });
}

/**
 * 批量匯入
 */
function batchImport(jsonData) {
  const data = JSON.parse(jsonData);
  const sheet = getSheet('ErrorCodes');
  
  let imported = 0;
  let updated = 0;
  
  data.forEach(item => {
    const existingIndex = sheet.getDataRange().getValues()
      .slice(1)
      .findIndex(row => row[0] === item.code);
    
    if (existingIndex >= 0) {
      sheet.getRange(existingIndex + 2, 2).setValue(item.description);
      sheet.getRange(existingIndex + 2, 3).setValue(item.category);
      updated++;
    } else {
      sheet.appendRow([item.code, item.description, item.category, new Date()]);
      imported++;
    }
  });
  
  return jsonResponse({
    success: true,
    message: `Imported: ${imported}, Updated: ${updated}`,
    stats: { imported, updated }
  });
}

/**
 * 初始化表格（首次使用時執行）
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let errorSheet = ss.getSheetByName('ErrorCodes');
  if (!errorSheet) {
    errorSheet = ss.insertSheet('ErrorCodes');
    errorSheet.appendRow(['Code', 'Description', 'Category', 'CreatedAt']);
  }
  
  let categorySheet = ss.getSheetByName('Categories');
  if (!categorySheet) {
    categorySheet = ss.insertSheet('Categories');
    categorySheet.appendRow(['Code', 'Name', 'Description']);
  }
  
  const categories = [
    ['NT', 'RF Test Function Issue', '無線電頻率測試相關錯誤'],
    ['NE', 'EEPROM Issue', 'EEPROM 讀寫錯誤'],
    ['NC', 'Check Value in EEPROM Issue', 'EEPROM 數值驗證錯誤'],
    ['NI', 'Instrument Issue', '儀器設備相關錯誤'],
    ['NF', 'E-FUSE Issue', 'E-FUSE 熔絲相關錯誤'],
    ['ND', 'DECT Test Function Issue', 'DECT 無線電話測試錯誤'],
    ['BT', 'Bluetooth Test Function Issue', '藍牙測試相關錯誤'],
    ['AL', 'ADSL Test Function Issue', 'ADSL 測試相關錯誤'],
    ['VL', 'VDSL Test Function Issue', 'VDSL 測試相關錯誤'],
    ['GT', 'GFAST Test Function Issue', 'GFAST 測試相關錯誤'],
    ['XL', 'xDSL Test Function Issue', 'xDSL 系列測試錯誤'],
    ['VP', 'VOIP Test Function Issue', 'VOIP 語音測試錯誤'],
    ['IS', 'ISDN Test Function Issue', 'ISDN 測試相關錯誤'],
    ['HM', 'Home Media Box Test Function Issue', '家庭媒體盒測試錯誤'],
    ['PT', 'Photo Test Function Issue', '相機測試相關錯誤'],
    ['PN', 'PON Test Function Issue', 'PON 光纖測試錯誤'],
    ['PL', 'Power Line Test Function Issue', '電力線測試錯誤'],
    ['FM', 'Femtocell Test Function Issue', '小型基地台測試錯誤'],
    ['LT', 'LTE Test Function Issue', 'LTE 測試相關錯誤'],
    ['GF', 'General Test Function Issue', '一般測試相關錯誤'],
    ['EN', 'Environment Issue', '環境相關錯誤'],
    ['SF', 'SFIS Issue', 'SFIS 系統相關錯誤'],
    ['BN', 'Burn-in Issue', '老化測試相關錯誤'],
    ['CC', 'NFC Card Issue', 'NFC 卡測試錯誤'],
    ['AP', 'Test Related Application Issue', '測試應用相關錯誤'],
    ['ZB', 'Zigbee Test Function Issue', 'Zigbee 測試相關錯誤'],
    ['AT', 'Audio Test Function Issue', '音頻測試相關錯誤'],
    ['MC', 'MoCA Test Function Issue', 'MoCA 測試相關錯誤'],
    ['ZW', 'Z-Wave Test Function Issue', 'Z-Wave 測試相關錯誤']
  ];
  
  categories.forEach(cat => {
    categorySheet.appendRow(cat);
  });
  
  return jsonResponse({
    success: true,
    message: 'Sheets initialized successfully',
    sheets: ['ErrorCodes', 'Categories']
  });
}

/**
 * 匯出錯誤代碼數據（用於初始匯入）
 */
function exportData() {
  const sheet = getSheet('ErrorCodes');
  const data = sheet.getDataRange().getValues();
  
  const errorCodes = data.slice(1).map(row => ({
    code: row[0],
    description: row[1],
    category: row[2]
  }));
  
  return jsonResponse({
    success: true,
    count: errorCodes.length,
    data: errorCodes
  });
}

// ===== 輔助函數 =====

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found. Please run initializeSheets() first.`);
  }
  
  return sheet;
}

function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
