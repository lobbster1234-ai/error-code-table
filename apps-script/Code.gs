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

// Groq API 設定
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
      default:
        return jsonResponse({ error: 'Unknown action', availableActions: ['getAll', 'getByCode', 'search', 'getCategories', 'getStats'] });
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
      case 'translate':
        return translateTexts(e.postData.contents);
      case 'askAI':
        return askAI(e.parameter.question, e.parameter.context);
      default:
        return jsonResponse({ error: 'Unknown action' }, 400);
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
 * 批量翻譯（使用 Google Translate API）
 */
function translateTexts(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    const texts = data.texts || [];
    
    if (!texts || texts.length === 0) {
      return jsonResponse({ success: false, error: 'No texts to translate' });
    }
    
    // 使用 Google Apps Script 內建的翻譯服務
    const translations = texts.map(text => {
      try {
        // 翻譯成繁體中文
        return LanguageApp.translate(text, 'en', 'zh-TW');
      } catch (e) {
        console.error('Translation error:', e);
        return text; // 翻譯失敗回傳原文
      }
    });
    
    console.log(`✅ 翻譯完成：${translations.length} 筆`);
    
    return jsonResponse({
      success: true,
      translations: translations
    });
    
  } catch (error) {
    console.error('Batch translate error:', error);
    return jsonResponse({ 
      success: false, 
      error: error.message 
    }, 500);
  }
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
      // 更新
      sheet.getRange(existingIndex + 2, 2).setValue(item.description);
      sheet.getRange(existingIndex + 2, 3).setValue(item.category);
      updated++;
    } else {
      // 新增
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
  
  // 創建錯誤代碼表
  let errorSheet = ss.getSheetByName('ErrorCodes');
  if (!errorSheet) {
    errorSheet = ss.insertSheet('ErrorCodes');
    errorSheet.appendRow(['Code', 'Description', 'Category', 'CreatedAt']);
  }
  
  // 創建類別表
  let categorySheet = ss.getSheetByName('Categories');
  if (!categorySheet) {
    categorySheet = ss.insertSheet('Categories');
    categorySheet.appendRow(['Code', 'Name', 'Description']);
  }
  
  // 填入預設類別
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

// ===== AI 助理 - Groq Llama 3 =====

/**
 * AI 問答（使用 Groq Llama 3）
 */
function askAI(question, context) {
  try {
    if (!question) {
      return jsonResponse({ success: false, error: 'Question is required' }, 400);
    }
    
    // 建構系統提示
    const systemPrompt = `你是 Error Code 查詢助理。你的任務是根據使用者問題和提供的上下文，從錯誤代碼清單中找出最相關的項目。

你必須嚴格遵守以下輸出格式（只回傳 JSON，不要有任何其他文字）：
{
  "thinking": "你的分析過程，簡短說明如何匹配",
  "recommendations": [
    {"code": "代碼", "reason": "為什麼這個代碼相關", "confidence": "高/中/低"},
    ...
  ],
  "suggestions": "給使用者的建議或補充說明"
}

請從提供的上下文（最多 30 個候選）中，挑選最相關的 10 個（或少於 10 個如果相關的不足 10 個）。
按照相關程度由高到低排序。confidence 高適用於完全匹配的，中適用於部分匹配的，低適用於模糊匹配的。`;

    // 建構使用者訊息
    const userMessage = `問題：${question}\n\n上下文：\n${context}`;
    
    // 呼叫 Groq API
    const response = UrlFetchApp.fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      console.error('Groq API 錯誤:', responseCode, responseText);
      return jsonResponse({ 
        success: false, 
        error: `Groq API 錯誤: ${responseCode}`,
        recommendations: []
      });
    }
    
    const result = JSON.parse(responseText);
    
    if (result.error) {
      console.error('Groq 回傳錯誤:', result.error);
      return jsonResponse({ 
        success: false, 
        error: result.error.message || result.error,
        recommendations: []
      });
    }
    
    // 解析 LLM 回應
    const llmContent = result.choices[0].message.content;
    
    // 嘗試解析 JSON
    let recommendations;
    try {
      // 找出 JSON 區塊
      const jsonMatch = llmContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed;
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('JSON 解析失敗:', parseError);
      return jsonResponse({ 
        success: false, 
        error: 'LLM 回應格式錯誤',
        rawResponse: llmContent,
        recommendations: []
      });
    }
    
    return jsonResponse({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    console.error('askAI 函數錯誤:', error);
    return jsonResponse({ 
      success: false, 
      error: error.message || '未知錯誤',
      recommendations: []
    }, 500);
  }
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
