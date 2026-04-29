// Error Code Table 比對系統 - 主應用程式 (Google Sheets 版本)

// ===== 配置 =====
// 部署 Apps Script 後，請將此 URL 替換為你的 Web 應用網址
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwQlNiZ_YNiCNME9Ie7vP7REQXERaYUZaGb78LoeFBiNQk5m-t_kss06mRQmFNiTpzT/exec';

// 如果尚未部署，使用本地數據作為後備
let useLocalData = true;
let localData = null;

// 應用程式狀態
let errorCodes = [];
let categories = {};
let filteredResults = [];

// 初始化應用程式
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 初始化 Error Code Table 比對系統...');
    
    // 嘗試載入本地數據作為後備
    await loadLocalData();
    
    // 嘗試連接 Google Sheets API
    if (API_BASE_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        const apiAvailable = await testApiConnection();
        if (apiAvailable) {
            useLocalData = false;
            console.log('✅ 使用 Google Sheets API');
        } else {
            console.log('⚠️ API 不可用，使用本地數據');
        }
    } else {
        console.log('⚠️ 請在 js/app.js 中設置 API_BASE_URL');
        showDeploymentNotice();
    }
    
    if (useLocalData && localData) {
        await loadFromLocalData();
    }
    
    setupEventListeners();
    renderResults(filteredResults);
    updateStats();
    populateCategoryFilter();
});

// 顯示部署提示
function showDeploymentNotice() {
    const notice = document.createElement('div');
    notice.style.cssText = `
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 10px;
        padding: 20px;
        margin: 20px;
        color: #856404;
    `;
    notice.innerHTML = `
        <h3 style="margin-bottom: 10px;">⚠️ Google Sheets API 尚未配置</h3>
        <p>請按照以下步驟部署：</p>
        <ol style="margin: 10px 0; padding-left: 20px;">
            <li>創建新的 Google Sheet</li>
            <li>擴展功能 > Apps Script</li>
            <li>貼上 <code>apps-script/Code.gs</code> 的代碼</li>
            <li>點擊「部署」>「新建部署」> 選擇「Web 應用」</li>
            <li>執行身分：我 | 誰有權存取：任何人</li>
            <li>複製 Web 應用網址</li>
            <li>修改 <code>js/app.js</code> 中的 <code>API_BASE_URL</code></li>
        </ol>
        <p style="margin-top: 10px;">目前使用本地數據運行。</p>
    `;
    document.querySelector('.container').insertBefore(notice, document.querySelector('.search-section'));
}

// 測試 API 連接
async function testApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getStats`);
        if (!response.ok) throw new Error('API 回應異常');
        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('API 連接測試失敗:', error);
        return false;
    }
}

// 載入本地數據
async function loadLocalData() {
    try {
        const response = await fetch('data/error_codes.json');
        localData = await response.json();
        console.log(`📦 本地數據載入成功：${localData.errorCodes?.length || 0} 筆`);
    } catch (error) {
        console.error('載入本地數據失敗:', error);
    }
}

// 從本地數據載入
async function loadFromLocalData() {
    if (!localData) return;
    
    categories = localData.categories;
    errorCodes = localData.errorCodes.filter(item => item.code !== 'EOF');
    
    // 為每個錯誤代碼添加類別信息
    errorCodes = errorCodes.map(item => {
        const prefix = item.code.match(/^[A-Z]+/)[0];
        return {
            ...item,
            category: categories[prefix] || 'Unknown',
            categoryCode: prefix
        };
    });
    
    filteredResults = [...errorCodes];
}

// 從 API 載入數據
async function loadFromAPI() {
    try {
        // 載入錯誤代碼
        const errorResponse = await fetch(`${API_BASE_URL}?action=getAll`);
        const errorData = await errorResponse.json();
        
        if (errorData.success) {
            errorCodes = errorData.data.map(item => ({
                code: item.Code,
                description: item.Description,
                category: item.Category,
                categoryCode: item.Category?.split(' ')[0] || item.Category?.match(/[A-Z]+/)?.[0] || 'Unknown'
            }));
        }
        
        // 載入類別
        const categoryResponse = await fetch(`${API_BASE_URL}?action=getCategories`);
        const categoryData = await categoryResponse.json();
        
        if (categoryData.success) {
            categories = {};
            categoryData.data.forEach(cat => {
                categories[cat.Code] = cat.Name;
            });
        }
        
        filteredResults = [...errorCodes];
        console.log(`✅ API 數據載入成功：${errorCodes.length} 筆`);
    } catch (error) {
        console.error('載入 API 數據失敗:', error);
        throw error;
    }
}

// 設置事件監聽器
function setupEventListeners() {
    // 搜尋功能
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('clearBtn').addEventListener('click', clearSearch);
    
    // 篩選和排序
    document.getElementById('categoryFilter').addEventListener('change', handleFilter);
    document.getElementById('sortBy').addEventListener('change', handleSort);
    
    // 比對功能
    document.getElementById('compareBtn').addEventListener('click', handleCompare);
    
    // 支援 Enter 鍵搜尋
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// 處理搜尋
async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!useLocalData && searchTerm !== '') {
        // 使用 API 搜尋
        try {
            const response = await fetch(`${API_BASE_URL}?action=search&q=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            
            if (data.success) {
                filteredResults = data.data.map(item => ({
                    code: item.Code,
                    description: item.Description,
                    category: item.Category,
                    categoryCode: item.Category?.split(' ')[0] || 'Unknown'
                }));
                handleFilter();
                return;
            }
        } catch (error) {
            console.error('API 搜尋失敗:', error);
        }
    }
    
    // 本地搜尋
    if (searchTerm === '') {
        filteredResults = useLocalData ? [...errorCodes] : [...errorCodes];
    } else {
        filteredResults = errorCodes.filter(item => 
            item.code.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            (item.category && item.category.toLowerCase().includes(searchTerm)) ||
            (item.categoryCode && item.categoryCode.toLowerCase().includes(searchTerm))
        );
    }
    
    handleFilter();
}

// 處理篩選
function handleFilter() {
    const category = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    let results = searchTerm === '' ? [...errorCodes] : [...filteredResults];
    
    if (category !== 'all') {
        results = results.filter(item => item.categoryCode === category);
    }
    
    filteredResults = results;
    handleSort();
}

// 處理排序
function handleSort() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredResults.sort((a, b) => {
        if (sortBy === 'code') {
            return a.code.localeCompare(b.code);
        } else {
            return (a.description || '').localeCompare(b.description || '');
        }
    });
    
    renderResults(filteredResults);
    updateStats();
}

// 清除搜尋
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('sortBy').value = 'code';
    filteredResults = [...errorCodes];
    renderResults(filteredResults);
    updateStats();
}

// 渲染結果
function renderResults(results) {
    const resultsBody = document.getElementById('resultsBody');
    const noResults = document.getElementById('noResults');
    const resultsTable = document.getElementById('resultsTable');
    
    resultsBody.innerHTML = '';
    
    if (results.length === 0) {
        resultsTable.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    resultsTable.style.display = 'block';
    noResults.style.display = 'none';
    
    // 只渲染前 100 筆結果以提高性能
    const displayLimit = Math.min(results.length, 100);
    
    for (let i = 0; i < displayLimit; i++) {
        const item = results[i];
        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `
            <div class="col-code">${escapeHtml(item.code)}</div>
            <div class="col-category">${escapeHtml(item.categoryCode || 'N/A')} - ${escapeHtml(item.category || 'Unknown')}</div>
            <div class="col-description">${escapeHtml(item.description || '')}</div>
        `;
        resultsBody.appendChild(row);
    }
    
    if (results.length > 100) {
        const moreRow = document.createElement('div');
        moreRow.className = 'result-row';
        moreRow.style.background = '#fff3cd';
        moreRow.innerHTML = `
            <div class="col-description" style="grid-column: 1 / -1; text-align: center; color: #856404;">
                顯示前 100 筆結果，共 ${results.length} 筆。請使用搜尋或篩選功能縮小範圍。
            </div>
        `;
        resultsBody.appendChild(moreRow);
    }
}

// 更新統計數據
async function updateStats() {
    document.getElementById('totalCount').textContent = errorCodes.length;
    document.getElementById('filteredCount').textContent = filteredResults.length;
    document.getElementById('categoryCount').textContent = Object.keys(categories).length;
    
    // 如果連接 API，獲取即時統計
    if (!useLocalData && API_BASE_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
        try {
            const response = await fetch(`${API_BASE_URL}?action=getStats`);
            const data = await response.json();
            if (data.success) {
                document.getElementById('totalCount').textContent = data.stats.totalErrorCodes;
                document.getElementById('categoryCount').textContent = data.stats.totalCategories;
            }
        } catch (error) {
            console.error('獲取統計失敗:', error);
        }
    }
}

// 填充類別篩選下拉選單
function populateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    
    Object.entries(categories).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} - ${name}`;
        select.appendChild(option);
    });
}

// 處理比對
function handleCompare() {
    const listA = document.getElementById('compareListA').value
        .split('\n')
        .map(item => item.trim().toUpperCase())
        .filter(item => item !== '');
    
    const listB = document.getElementById('compareListB').value
        .split('\n')
        .map(item => item.trim().toUpperCase())
        .filter(item => item !== '');
    
    const setA = new Set(listA);
    const setB = new Set(listB);
    
    const onlyInA = [...setA].filter(x => !setB.has(x));
    const onlyInB = [...setB].filter(x => !setA.has(x));
    const inBoth = [...setA].filter(x => setB.has(x));
    
    // 更新統計
    document.getElementById('onlyInA').textContent = onlyInA.length;
    document.getElementById('onlyInB').textContent = onlyInB.length;
    document.getElementById('inBoth').textContent = inBoth.length;
    
    // 渲染清單
    renderCompareList('onlyAList', onlyInA);
    renderCompareList('onlyBList', onlyInB);
    renderCompareList('bothList', inBoth);
    
    // 顯示結果
    document.getElementById('compareResult').style.display = 'block';
}

// 渲染比對清單
function renderCompareList(elementId, items) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';
    
    if (items.length === 0) {
        list.innerHTML = '<li style="color: #6c757d; font-style: italic;">無</li>';
        return;
    }
    
    // 查找錯誤代碼描述
    items.forEach(code => {
        const errorCode = errorCodes.find(e => e.code === code);
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${escapeHtml(code)}</strong>
            ${errorCode ? `<br><small style="color: #6c757d;">${escapeHtml(errorCode.description)}</small>` : '<br><small style="color: #dc3545;">未找到錯誤代碼</small>'}
        `;
        list.appendChild(li);
    });
}

// HTML 轉義函數
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 導出功能
function exportResults() {
    const csvContent = [
        ['錯誤代碼', '類別', '描述'].join(','),
        ...filteredResults.map(item => 
            [item.code, item.categoryCode, `"${(item.description || '').replace(/"/g, '""')}"`].join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'error_codes_export.csv';
    link.click();
}

// 添加導出按鈕到頁面（可選）
const exportBtn = document.createElement('button');
exportBtn.textContent = '📥 導出 CSV';
exportBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.2);';
exportBtn.onclick = exportResults;
document.body.appendChild(exportBtn);

console.log('✅ Error Code Table 比對系統已載入完成');
console.log(`📊 數據來源：${useLocalData ? '本地 JSON' : 'Google Sheets API'}`);
