// Error Code 批量比對系統
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwQlNiZ_YNiCNME9Ie7vP7REQXERaYUZaGb78LoeFBiNQk5m-t_kss06mRQmFNiTpzT/exec';

let errorCodes = [];
let categories = {};
let compareResults = {
    exact: [],
    fuzzy: [],
    notFound: []
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 初始化批量比對系統...');
    await loadData();
    setupEventListeners();
    document.getElementById('requestDate').value = new Date().toISOString().split('T')[0];
});

// 載入數據
async function loadData() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getAll`);
        const data = await response.json();
        
        if (data.success) {
            errorCodes = data.data.map(item => ({
                code: item.Code,
                description: item.Description,
                category: item.Category
            }));
            
            // 載入類別
            const catResponse = await fetch(`${API_BASE_URL}?action=getCategories`);
            const catData = await catResponse.json();
            if (catData.success) {
                catData.data.forEach(cat => {
                    categories[cat.Code] = cat.Name;
                    const option = document.createElement('option');
                    option.value = cat.Name;
                    option.textContent = `${cat.Code} - ${cat.Name}`;
                    document.getElementById('newCategory').appendChild(option);
                });
            }
            
            console.log(`✅ 載入成功：${errorCodes.length} 筆錯誤代碼`);
        }
    } catch (error) {
        console.error('載入失敗:', error);
        alert('載入數據失敗，請稍後再試');
    }
}

// 設置事件監聽
function setupEventListeners() {
    document.getElementById('compareBtn').addEventListener('click', performBulkCompare);
    document.getElementById('clearBtn').addEventListener('click', clearAll);
    document.getElementById('newCodeForm').addEventListener('submit', submitNewCodeRequest);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
}

// 執行批量比對
async function performBulkCompare() {
    const input = document.getElementById('bulkInput').value.trim();
    
    if (!input) {
        alert('請輸入 Error Code 清單');
        return;
    }
    
    const inputList = input.split('\n')
        .map(line => line.trim())
        .filter(line => line !== '');
    
    compareResults = {
        exact: [],
        fuzzy: [],
        notFound: []
    };
    
    // 逐行比對
    for (const inputItem of inputList) {
        const inputLower = inputItem.toLowerCase().trim();
        
        // 1. 完全匹配
        const exactMatch = errorCodes.find(item => 
            item.code.toLowerCase() === inputLower || 
            item.description.toLowerCase() === inputLower
        );
        
        if (exactMatch) {
            compareResults.exact.push({
                input: inputItem,
                match: exactMatch,
                type: 'exact'
            });
            continue;
        }
        
        // 2. 模糊匹配（>50% 相似度，最多 5 項）
        const fuzzyResults = fuzzySearch(inputItem, errorCodes, 5)
            .filter(item => item.similarity > 0.5);
        
        if (fuzzyResults.length > 0) {
            compareResults.fuzzy.push({
                input: inputItem,
                matches: fuzzyResults
            });
        } else {
            // 3. 未找到
            compareResults.notFound.push(inputItem);
        }
    }
    
    displayResults();
}

// 顯示結果
function displayResults() {
    document.getElementById('resultsSection').style.display = 'block';
    
    // 更新統計
    document.getElementById('exactCount').textContent = compareResults.exact.length;
    document.getElementById('fuzzyCount').textContent = compareResults.fuzzy.length;
    document.getElementById('notFoundCount').textContent = compareResults.notFound.length;
    
    // 顯示完全匹配
    const exactList = document.getElementById('exactList');
    if (compareResults.exact.length > 0) {
        exactList.innerHTML = compareResults.exact.map(item => `
            <div class="result-row">
                <div class="col-input">${escapeHtml(item.input)}</div>
                <div class="col-code">${escapeHtml(item.match.code)}</div>
                <div class="col-desc">${escapeHtml(item.match.description)}</div>
                <div class="col-category">${escapeHtml(item.match.category)}</div>
            </div>
        `).join('');
        document.getElementById('exactMatches').style.display = 'block';
    } else {
        document.getElementById('exactMatches').style.display = 'none';
    }
    
    // 顯示相近匹配
    const fuzzyList = document.getElementById('fuzzyList');
    if (compareResults.fuzzy.length > 0) {
        fuzzyList.innerHTML = compareResults.fuzzy.map(item => `
            <div class="fuzzy-item">
                <div class="fuzzy-header">
                    <span class="fuzzy-code">輸入：${escapeHtml(item.input)}</span>
                    <span class="similarity-badge">${Math.round(item.matches[0].similarity * 100)}% 相似</span>
                </div>
                <div class="fuzzy-description">
                    <strong>建議：</strong> ${escapeHtml(item.matches[0].code)} - ${escapeHtml(item.matches[0].description)}
                </div>
                <div class="fuzzy-suggestion">
                    類別：${escapeHtml(item.matches[0].category)} | 
                    匹配欄位：${item.matches[0].matchType === 'code' ? '代碼' : '描述'}
                </div>
            </div>
        `).join('');
        document.getElementById('fuzzyMatches').style.display = 'block';
    } else {
        document.getElementById('fuzzyMatches').style.display = 'none';
    }
    
    // 顯示未找到
    const notFoundList = document.getElementById('notFoundList');
    if (compareResults.notFound.length > 0) {
        notFoundList.innerHTML = compareResults.notFound.map(code => `
            <div class="not-found-item">
                <span class="code">${escapeHtml(code)}</span>
                <button class="btn-secondary" onclick="autoFillNewCode('${escapeHtml(code)}')">
                    填入申請表
                </button>
            </div>
        `).join('');
        document.getElementById('notFound').style.display = 'block';
    } else {
        document.getElementById('notFound').style.display = 'none';
    }
    
    // 滾動到結果區
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

// 自動填入申請表
function autoFillNewCode(code) {
    document.getElementById('newCode').value = code;
    document.getElementById('newDescription').focus();
    document.getElementById('newCode').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 提交新代碼申請
async function submitNewCodeRequest(event) {
    event.preventDefault();
    
    const requestData = {
        code: document.getElementById('newCode').value.trim(),
        category: document.getElementById('newCategory').value,
        description: document.getElementById('newDescription').value.trim(),
        notes: document.getElementById('newNotes').value.trim(),
        requesterEmail: document.getElementById('requesterEmail').value.trim(),
        requestDate: document.getElementById('requestDate').value,
        status: 'pending'
    };
    
    if (!confirm(`確定要提交申請嗎？\n\n代碼：${requestData.code}\n描述：${requestData.description}\n\n系統將發送審核郵件給 Real 哥`)) {
        return;
    }
    
    try {
        // 儲存申請到 Google Sheets
        const response = await fetch(`${API_BASE_URL}?action=submitRequest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ 申請已提交！\n\n審核郵件已發送給 Real 哥\n審核結果將通知至：' + requestData.requesterEmail);
            document.getElementById('newCodeForm').reset();
            document.getElementById('requestDate').value = new Date().toISOString().split('T')[0];
        } else {
            alert('❌ 提交失敗：' + (result.error || '未知錯誤'));
        }
    } catch (error) {
        console.error('提交失敗:', error);
        alert('❌ 提交失敗，請稍後再試');
    }
}

// 匯出結果
function exportResults() {
    const csvRows = [
        ['類型', '輸入內容', 'Error Code', '描述', '類別', '相似度']
    ];
    
    // 完全匹配
    compareResults.exact.forEach(item => {
        csvRows.push([
            '完全匹配',
            item.input,
            item.match.code,
            item.match.description,
            item.match.category,
            '100%'
        ]);
    });
    
    // 相近匹配
    compareResults.fuzzy.forEach(item => {
        csvRows.push([
            '相近匹配',
            item.input,
            item.matches[0].code,
            item.matches[0].description,
            item.matches[0].category,
            Math.round(item.matches[0].similarity * 100) + '%'
        ]);
    });
    
    // 未找到
    compareResults.notFound.forEach(code => {
        csvRows.push(['未找到', code, '', '', '', '']);
    });
    
    // 生成 CSV
    const csvContent = csvRows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `error_code_compare_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// 清除所有
function clearAll() {
    document.getElementById('bulkInput').value = '';
    document.getElementById('resultsSection').style.display = 'none';
    compareResults = { exact: [], fuzzy: [], notFound: [] };
}

// HTML 轉義
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('✅ 批量比對系統已載入');
