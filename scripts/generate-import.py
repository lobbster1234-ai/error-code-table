#!/usr/bin/env python3
"""
生成 Apps Script 匯入代碼腳本
將 error_codes.json 轉換為 Apps Script 可執行的匯入函數
"""

import json
import os

def generate_import_script():
    # 讀取錯誤代碼數據
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'error_codes.json')
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    error_codes = data['errorCodes']
    categories = data['categories']
    
    # 生成 Apps Script 代碼
    script = '''/**
 * 批量匯入錯誤代碼數據
 * 執行此函數將所有 1217 筆錯誤代碼匯入 Google Sheet
 */
function importErrorCodes() {
  const errorCodes = [
'''
    
    # 添加錯誤代碼數據
    for item in error_codes:
        code = item['code'].replace("'", "\\'")
        description = item['description'].replace("'", "\\'")
        prefix = code.split('0')[0] if '0' in code else code[:2]
        category = categories.get(prefix, 'Unknown')
        
        script += f"    {{code: '{code}', description: '{description}', category: '{category}'}},\n"
    
    script += '''  ];
  
  // 獲取或創建 ErrorCodes 工作表
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ErrorCodes');
  
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('ErrorCodes');
    sheet.appendRow(['Code', 'Description', 'Category', 'CreatedAt']);
  }
  
  // 批量匯入（每次 100 筆以避免超時）
  const batchSize = 100;
  let imported = 0;
  let updated = 0;
  
  for (let i = 0; i < errorCodes.length; i += batchSize) {
    const batch = errorCodes.slice(i, i + batchSize);
    
    batch.forEach(item => {
      // 檢查是否已存在
      const existing = sheet.getDataRange().getValues()
        .slice(1)
        .findIndex(row => row[0] === item.code);
      
      if (existing >= 0) {
        // 更新現有記錄
        sheet.getRange(existing + 2, 2).setValue(item.description);
        sheet.getRange(existing + 2, 3).setValue(item.category);
        updated++;
      } else {
        // 新增記錄
        sheet.appendRow([item.code, item.description, item.category, new Date()]);
        imported++;
      }
    });
    
    // 記錄進度
    Logger.log(`已處理 ${Math.min(i + batchSize, errorCodes.length)}/${errorCodes.length} 筆`);
  }
  
  const result = {
    success: true,
    message: `匯入完成！新增：${imported} 筆，更新：${updated} 筆`,
    stats: {
      total: errorCodes.length,
      imported: imported,
      updated: updated
    }
  };
  
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * 批量匯入類別數據
 */
function importCategories() {
  const categories = [
'''
    
    # 添加類別數據
    for code, name in categories.items():
        script += f"    {{code: '{code}', name: '{name}', description: ''}},\n"
    
    script += '''  ];
  
  // 獲取或創建 Categories 工作表
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Categories');
    sheet.appendRow(['Code', 'Name', 'Description']);
  }
  
  // 清空現有數據（保留標題行）
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).clearContent();
  }
  
  // 匯入類別
  categories.forEach((cat, index) => {
    sheet.appendRow([cat.code, cat.name, cat.description]);
  });
  
  Logger.log(`類別匯入完成！共 ${categories.length} 個類別`);
  return { success: true, count: categories.length };
}

/**
 * 一鍵初始化並匯入所有數據
 */
function initializeAndImport() {
  Logger.log('開始初始化...');
  
  // 初始化表格結構
  initializeSheets();
  
  // 匯入類別
  Logger.log('匯入類別...');
  importCategories();
  
  // 匯入錯誤代碼
  Logger.log('匯入錯誤代碼...');
  importErrorCodes();
  
  Logger.log('✅ 全部完成！');
  
  return {
    success: true,
    message: '初始化和匯入完成！'
  };
}
'''
    
    # 寫入文件
    output_path = os.path.join(os.path.dirname(__file__), 'ImportData.gs')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(script)
    
    print(f"✅ 生成成功：{output_path}")
    print(f"📊 錯誤代碼數量：{len(error_codes)}")
    print(f"📊 類別數量：{len(categories)}")
    print(f"\n📝 使用說明：")
    print(f"1. 將 {output_path} 的內容複製到 Apps Script 編輯器")
    print(f"2. 執行 initializeAndImport() 函數")
    print(f"3. 等待匯入完成（約 30-60 秒）")
    print(f"4. 檢查 Google Sheet 中的數據")

if __name__ == '__main__':
    generate_import_script()
