# Error Code Table 比對系統

一個用於查詢和比對 RF 測試錯誤代碼的 Web 應用系統。

## 功能特點

### 🔍 搜尋功能
- 支援錯誤代碼搜尋（如：NT001）
- 支援關鍵字搜尋（如：Power Calibration）
- 即時搜尋結果顯示
- 支援類別篩選（29 個錯誤類別）
- 支援排序（按代碼或描述）

### 📊 統計資訊
- 總錯誤代碼數量
- 搜尋結果數量
- 錯誤類別數量

### 📋 比對模式
- 輸入兩個錯誤代碼清單
- 自動比對差異
- 顯示：
  - 僅在清單 A 中的代碼
  - 僅在清單 B 中的代碼
  - 兩者都有的代碼
- 自動顯示錯誤描述

## 數據來源

- 原始文件：`Error Code Table 20250626.doc`
- 錯誤代碼總數：1217 筆
- 錯誤類別：29 個

### 錯誤類別列表

| 代碼 | 類別名稱 |
|------|----------|
| NT | RF Test Function Issue |
| NE | EEPROM Issue |
| NC | Check Value in EEPROM Issue |
| NI | Instrument Issue |
| NF | E-FUSE Issue |
| ND | DECT Test Function Issue |
| BT | Bluetooth Test Function Issue |
| AL | ADSL Test Function Issue |
| VL | VDSL Test Function Issue |
| GT | GFAST Test Function Issue |
| XL | xDSL Test Function Issue |
| VP | VOIP Test Function Issue |
| IS | ISDN Test Function Issue |
| HM | Home Media Box Test Function Issue |
| PT | Photo Test Function Issue |
| PN | PON Test Function Issue |
| PL | Power Line Test Function Issue |
| FM | Femtocell Test Function Issue |
| LT | LTE Test Function Issue |
| GF | General Test Function Issue |
| EN | Environment Issue |
| SF | SFIS Issue |
| BN | Burn-in Issue |
| CC | NFC Card Issue |
| AP | Test Related Application Issue |
| ZB | Zigbee Test Function Issue |
| AT | Audio Test Function Issue |
| MC | MoCA Test Function Issue |
| ZW | Z-Wave Test Function Issue |

## 安裝與運行

### 方法 1：使用 Python HTTP 服務器

```bash
cd /home/stella_fan/ErrorCodeSystem_Website
python3 -m http.server 8080
```

然後在瀏覽器中訪問：http://localhost:8080

### 方法 2：使用 Node.js http-server

```bash
npm install -g http-server
cd /home/stella_fan/ErrorCodeSystem_Website
http-server -p 8080
```

### 方法 3：直接使用瀏覽器

直接打開 `index.html` 文件（部分瀏覽器可能因 CORS 限制而無法載入數據）

## 文件結構

```
ErrorCodeSystem_Website/
├── index.html          # 主頁面
├── css/
│   └── style.css       # 樣式文件
├── js/
│   └── app.js          # 應用程式邏輯
├── data/
│   └── error_codes.json # 錯誤代碼數據
└── README.md           # 說明文件
```

## 使用說明

### 搜尋錯誤代碼

1. 在搜尋框中輸入錯誤代碼（如：NT001）或關鍵字
2. 系統會即時顯示搜尋結果
3. 可使用類別下拉選單篩選特定類別
4. 可選擇排序方式（按代碼或描述）

### 比對兩個清單

1. 在「清單 A」輸入框中輸入第一個錯誤代碼清單（每行一個）
2. 在「清單 B」輸入框中輸入第二個錯誤代碼清單（每行一個）
3. 點擊「開始比對」按鈕
4. 查看比對結果：
   - 僅在 A 中的代碼
   - 僅在 B 中的代碼
   - 兩者都有的代碼

### 範例輸入

```
NT001
NT002
BT001
GF001
```

## 技術棧

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **樣式**: 自定義 CSS，響應式設計
- **數據格式**: JSON
- **服務器**: Python HTTP Server 或任何靜態文件服務器

## 瀏覽器支援

- Chrome (推薦)
- Firefox
- Safari
- Edge

## 授權

本系統僅供內部使用。

## 更新記錄

- **2026-04-29**: 初始版本
  - 建立完整的 Web 應用
  - 匯入 1217 筆錯誤代碼
  - 實現搜尋、篩選、比對功能
