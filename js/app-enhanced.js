// Error Code Table 比對系統 - 增強版
// 包含完全匹配、模糊搜尋、申請新代碼功能

// ===== 配置 =====
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwQlNiZ_YNiCNME9Ie7vP7REQXERaYUZaGb78LoeFBiNQk5m-t_kss06mRQmFNiTpzT/exec';
const ADMIN_EMAIL = 'real@example.com'; // Real 哥的郵箱

let errorCodes = [];
let categories = {};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 初始化 Error Code Table 增強版...');
    await loadData();
    setupEventListeners();
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
                category: item.Category,
                categoryCode: item.Category?.split(' ')[0] || 'Unknown'
            }));
            
            // 建立類別映射
            const catResponse = await fetch(`${API_BASE_URL}?action=getCategories`);
            const catData = await catResponse.json();
            if (catData.success) {
                catData.data.forEach(cat => {
                    categories[cat.Code] = cat.Name;
                });
            }
            
            console.log(`✅ 載入成功：${errorCodes.length} 筆錯誤代碼`);
        }
    } catch (error) {
        console.error('載入失敗:', error);
    }
}

// 智能搜尋（完全匹配 + 模糊匹配）
async function smartSearch(query) {
    if (!query || query.trim() === '') {
        showEmptyState();
        return;
    }
    
    const queryLower = query.toLowerCase().trim();
    
    // 1. 完全匹配（Code 或 Description）
    const exactMatch = errorCodes.find(item => 
        item.code.toLowerCase() === queryLower || 
        item.description.toLowerCase() === queryLower
    );
    
    if (exactMatch) {
        showExactMatch(exactMatch);
        return;
    }
    
    // 2. 模糊匹配（前 3 名）
    const fuzzyResults = fuzzySearch(query, errorCodes, 3);
    
    if (fuzzyResults.length > 0) {
        showFuzzyResults(fuzzyResults, query);
    } else {
        // 3. 無結果，顯示申請新代碼選項
        showAddNewRequest(query);
    }
}

// 顯示完全匹配結果
function showExactMatch(item) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `
        <div class="exact-match">
            <h2>✅ 找到完全匹配</h2>
            <div class="result-card highlight">
                <div class="result-header">
                    <span class="code">${escapeHtml(item.code)}</span>
                    <span class="category">${escapeHtml(item.category)}</span>
                </div>
                <div class="result-description">${escapeHtml(item.description)}</div>
                <div class="match-badge">100% 匹配</div>
            </div>
        </div>
    `;
}

// 顯示模糊匹配結果
function showFuzzyResults(results, query) {
    const resultsDiv = document.getElementById('searchResults');
    
    let html = `
        <div class="fuzzy-match">
            <h2>🔍 找到 ${results.length} 個相似結果</h2>
            <p class="subtitle">輸入："${escapeHtml(query)}"</p>
            <div class="results-list">
    `;
    
    results.forEach((item, index) => {
        const similarity = Math.round(item.similarity * 100);
        html += `
            <div class="result-card" onclick="selectResult('${item.code}')">
                <div class="result-rank">#${index + 1}</div>
                <div class="result-header">
                    <span class="code">${escapeHtml(item.code)}</span>
                    <span class="similarity">${similarity}% 相似</span>
                </div>
                <div class="result-description">${escapeHtml(item.description)}</div>
                <div class="match-type">匹配欄位：${item.matchType === 'code' ? '代碼' : item.matchType === 'description' ? '描述' : '類別'}</div>
            </div>
        `;
    });
    
    html += `
            </div>
            <div class="not-found-option">
                <p>都不是你要找的？</p>
                <button class="btn-request-new" onclick="showAddNewRequest('${escapeHtml(query)}')">
                    📋 申請新增錯誤代碼
                </button>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

// 顯示申請新代碼表單
function showAddNewRequest(query) {
    const resultsDiv = document.getElementById('searchResults');
    
    resultsDiv.innerHTML = `
        <div class="add-new-request">
            <h2>📝 申請新增錯誤代碼</h2>
            <p>找不到 "${escapeHtml(query)}" 的相關結果</p>
            
            <form id="newCodeForm" onsubmit="submitNewCodeRequest(event)">
                <div class="form-group">
                    <label>錯誤代碼（建議格式：XX000）</label>
                    <input type="text" name="code" placeholder="例如：NT999" required>
                </div>
                
                <div class="form-group">
                    <label>錯誤描述</label>
                    <input type="text" name="description" value="${escapeHtml(query)}" required>
                </div>
                
                <div class="form-group">
                    <label>類別</label>
                    <select name="category" required>
                        <option value="">選擇類別</option>
                        ${Object.entries(categories).map(([code, name]) => 
                            `<option value="${name}">${code} - ${name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label>申請人 Email</label>
                    <input type="email" name="requesterEmail" placeholder="your@email.com" required>
                </div>
                
                <div class="form-group">
                    <label>補充說明</label>
                    <textarea name="notes" rows="3" placeholder="請描述此錯誤代碼的使用場景..."></textarea>
                </div>
                
                <button type="submit" class="btn-submit">📧 提交申請</button>
            </form>
        </div>
    `;
}

// 提交新代碼申請
async function submitNewCodeRequest(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const requestData = {
        code: formData.get('code'),
        description: formData.get('description'),
        category: formData.get('category'),
        requesterEmail: formData.get('requesterEmail'),
        notes: formData.get('notes'),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    // 儲存到待審核資料表
    try {
        // 呼叫 API 儲存申請
        const response = await fetch(`${API_BASE_URL}?action=submitRequest`, {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        
        // 顯示成功訊息
        document.getElementById('searchResults').innerHTML = `
            <div class="success-message">
                <h2>✅ 申請已提交</h2>
                <p>錯誤代碼：${escapeHtml(requestData.code)}</p>
                <p>描述：${escapeHtml(requestData.description)}</p>
                <p>已發送審核通知給 Real 哥</p>
                <p>審核結果將通知至：${escapeHtml(requestData.requesterEmail)}</p>
                <button onclick="resetSearch()" class="btn-reset">返回搜尋</button>
            </div>
        `;
        
        // 發送郵件通知（後端處理）
        console.log('📧 已發送郵件通知給 Real 哥');
        
    } catch (error) {
        console.error('提交失敗:', error);
        alert('提交失敗，請稍後再試');
    }
}

// 選擇結果
function selectResult(code) {
    const item = errorCodes.find(i => i.code === code);
    if (item) {
        showExactMatch(item);
    }
}

// 顯示空狀態
function showEmptyState() {
    document.getElementById('searchResults').innerHTML = `
        <div class="empty-state">
            <p>請輸入錯誤代碼或描述進行搜尋</p>
        </div>
    `;
}

// 重置搜尋
function resetSearch() {
    document.getElementById('searchInput').value = '';
    showEmptyState();
}

// HTML 轉義
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 設置事件監聽
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    // 輸入時即時搜尋（防抖）
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            smartSearch(e.target.value);
        }, 300);
    });
    
    // Enter 鍵搜尋
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            smartSearch(e.target.value);
        }
    });
}

console.log('✅ Error Code Table 增強版已載入');
