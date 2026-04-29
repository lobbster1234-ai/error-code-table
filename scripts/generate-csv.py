#!/usr/bin/env python3
"""
生成 CSV 文件，可直接上傳到 Google Sheets
"""

import json
import csv
import os

def generate_csv():
    # 讀取錯誤代碼數據
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'error_codes.json')
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    error_codes = data['errorCodes']
    categories = data['categories']
    
    # 生成錯誤代碼 CSV
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'error_codes_import.csv')
    
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Code', 'Description', 'Category', 'CreatedAt'])
        
        for item in error_codes:
            code = item['code'].strip()
            description = item['description'].strip()
            prefix = code.split('0')[0] if '0' in code else code[:2]
            category = categories.get(prefix, 'Unknown')
            created_at = '2026-04-29'
            
            writer.writerow([code, description, category, created_at])
    
    print(f"✅ 生成成功：{csv_path}")
    print(f"📊 總計：{len(error_codes)} 筆錯誤代碼")
    print(f"\n📝 使用說明：")
    print(f"1. 在 Google Sheet 中，點擊「檔案」→「匯入」")
    print(f"2. 選擇「上傳」，上傳 {csv_path} 文件")
    print(f"3. 選擇「取代試算表」或「插入新工作表」")
    print(f"4. 完成！")

if __name__ == '__main__':
    generate_csv()
