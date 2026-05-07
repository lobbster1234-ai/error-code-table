// AI 助理模組 - 主要介面
// 使用 Groq LLM (Llama 3) + 本地智慧搜尋回退

class AIAssistant {
    constructor() {
        this.errorCodes = [];
        this.isProcessing = false;
        this.API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwQlNiZ_YNiCNME9Ie7vP7REQXERaYUZaGb78LoeFBiNQk5m-t_kss06mRQmFNiTpzT/exec';
    }

    async init() {
        console.log('🤖 AI 助理初始化中...');
        await this.loadData();
        this.setupUI();
        console.log('✅ AI 助理準備完成');
    }

    async loadData() {
        try {
            const response = await fetch(`${this.API_BASE_URL}?action=getAll`);
            const data = await response.json();
            
            if (data.success && data.data) {
                this.errorCodes = data.data.map(item => ({
                    code: item.Code || item.code,
                    description: item.Description || item.description,
                    category: item.Category || item.category,
                    description_zh: item.Description_ZH || item.Description_zh
                }));
                console.log(`✅ 載入 ${this.errorCodes.length} 筆 Error Code`);
            } else {
                this.showMessage('system', `❌ API 回應錯誤：${JSON.stringify(data)}`);
            }
        } catch (error) {
            console.error('載入資料失敗:', error);
            this.showMessage('system', `❌ 載入失敗：${error.message}`);
        }
    }

    setupUI() {
        const input = document.getElementById('aiInput');
        const sendBtn = document.getElementById('sendBtn');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    showLoading() {
        // 不再使用，改為直接顯示 welcome message
    }

    hideLoading() {
        // 不再使用
    }

    showError(message) {
        this.showMessage('system', `❌ ${message}`);
    }

    async sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input?.value.trim();
        
        if (!message || this.isProcessing) return;
        
        input.value = '';
        this.isProcessing = true;
        
        // 顯示使用者訊息
        this.addUserMessage(message);
        
        // 顯示打字中
        this.showTyping();
        
        try {
            const response = await this.callGroqAI(message);
            this.hideTyping();
            this.showAIResponse(response, 'groq');
        } catch (error) {
            console.error('AI 錯誤:', error);
            this.hideTyping();
            
            // 自動回退到本地搜尋
            const response = this.performLocalSearch(message);
            this.showAIResponse(response, 'local');
        }
        
        this.isProcessing = false;
    }

    async callGroqAI(userQuestion) {
        const allResults = this.performLocalSearch(userQuestion, 30);
        
        let context;
        if (!allResults.recommendations || allResults.recommendations.length === 0) {
            const first30 = this.errorCodes.slice(0, 30);
            context = `這是完整的 Error Code 資料庫（前 30 筆）：\n\n` + 
                first30.map((item, idx) => 
                    `${idx + 1}. ${item.code}: ${item.description} (Category: ${item.category})`
                ).join("\n");
        } else {
            const topCandidates = allResults.recommendations.slice(0, 30);
            context = `從 ${this.errorCodes.length} 筆資料中，找到以下 ${topCandidates.length} 個最相關的候選（按相關度排序）：\n\n` + 
                topCandidates.map((rec, idx) => 
                    `${idx + 1}. ${rec.code}: ${rec.reason} (匹配分數：${rec.score})`
                ).join("\n");
        }
        
        const url = `${this.API_BASE_URL}?action=askAI`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                question: userQuestion,
                context: context
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.warn('Groq failed, using local results');
            return JSON.stringify({
                ...allResults,
                recommendations: allResults.recommendations ? allResults.recommendations.slice(0, 10) : []
            });
        }
        
        const finalResults = result.data.recommendations || (allResults.recommendations ? allResults.recommendations.slice(0, 10) : []);
        
        const sortedResults = finalResults.map(rec => ({
            ...rec,
            score: rec.score || (rec.confidence === '高' ? 80 : rec.confidence === '中' ? 50 : 20)
        })).sort((a, b) => b.score - a.score);
        
        return JSON.stringify({
            thinking: result.data.thinking || allResults.thinking,
            recommendations: sortedResults,
            suggestions: result.data.suggestions || allResults.suggestions
        });
    }

    performLocalSearch(userInput, maxResults = 10) {
        const userLower = userInput.toLowerCase();
        const keywords = userLower.split(/\s+/).filter(w => w.length >= 2);
        
        const chineseToEnglish = {
            '相機': ['camera', 'photo', 'picture', 'image', 'lens', 'pt'],
            '電源': ['power', 'voltage', 'battery', 'electric', 'supply', 'current'],
            '通訊': ['connect', 'serial', 'ethernet', 'usb', 'adapter', 'network', 'port', 'communication'],
            '校正': ['calibrate', 'adjust', 'reference', 'correct', 'calibration'],
            '逾時': ['timeout', 'time', 'out', 'wait', 'response', 'delay'],
            '開啟': ['open', 'access', 'init', 'start', 'launch'],
            '失敗': ['fail', 'error', 'fault', 'problem', 'issue', 'wrong', 'invalid'],
            '測試': ['measure', 'check', 'verify', 'detect', 'test'],
            '感測': ['sensor', 'measure', 'read', 'detect', 'input'],
            '配接器': ['adapter', 'usb', 'serial', 'port', 'device', 'interface'],
            '記憶體': ['memory', 'eeprom', 'flash', 'storage', 'write', 'read'],
            '藍牙': ['bluetooth', 'bt', 'wireless'],
            '無線': ['wireless', 'wifi', 'rf', 'antenna'],
            '音頻': ['audio', 'sound', 'speaker', 'mic', 'voice'],
            '視頻': ['video', 'stream', 'media'],
            '網路': ['network', 'ethernet', 'lan', 'internet', 'ip'],
            '序列': ['serial', 'com', 'uart', 'rs232'],
            '通用': ['general', 'common', 'generic'],
            '環境': ['environment', 'temp', 'humidity', 'condition'],
            '老化': ['burn-in', 'aging', 'stress', 'reliability', 'burn', 'in'],
            '光纖': ['pon', 'fiber', 'optic', 'optical'],
            '電話': ['dect', 'voip', 'phone', 'voice']
        };
        
        let expandedKeywords = [...keywords];
        for (const [chinese, englishList] of Object.entries(chineseToEnglish)) {
            if (userLower.includes(chinese)) {
                expandedKeywords = [...expandedKeywords, ...englishList];
            }
        }
        
        const scored = this.errorCodes.map(item => {
            let score = 0;
            const descLower = item.description.toLowerCase();
            const codeLower = item.code.toLowerCase();
            const catLower = item.category.toLowerCase();
            
            if (descLower.includes(userLower)) score += 100;
            if (codeLower.includes(userLower)) score += 80;
            
            expandedKeywords.forEach(keyword => {
                if (keyword.length < 2) return;
                if (descLower.includes(keyword)) score += 30;
                if (codeLower.includes(keyword)) score += 25;
                if (catLower.includes(keyword)) score += 20;
            });
            
            return { ...item, score };
        });
        
        const results = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
        
        return {
            thinking: `我分析了你的問題「${userInput}」，從 ${this.errorCodes.length} 筆 Error Code 資料中搜尋並比對關鍵字。`,
            recommendations: results.map(item => ({
                code: item.code,
                reason: item.description,
                reason_zh: item.description_zh || item.description,
                confidence: item.score >= 80 ? '高' : item.score >= 40 ? '中' : '低',
                score: item.score
            })),
            suggestions: results.length > 0 
                ? `找到 ${results.length} 個匹配結果，分數從 ${results[results.length-1]?.score || 0} 到 ${results[0]?.score || 0}。`
                : '沒有找到匹配的結果。',
            hasMatches: results.length > 0
        };
    }

    addUserMessage(message) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        
        // 隱藏 welcome message
        const welcome = messages.querySelector('.welcome-message');
        if (welcome) welcome.style.display = 'none';
        
        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        userDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        messages.appendChild(userDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        messages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    showAIResponse(responseOrText, mode) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        
        let response;
        if (typeof responseOrText === 'string') {
            try {
                const jsonMatch = responseOrText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    response = JSON.parse(jsonMatch[0]);
                } else {
                    response = { thinking: responseOrText, recommendations: [], suggestions: '' };
                }
            } catch (e) {
                response = { thinking: responseOrText, recommendations: [], suggestions: '' };
            }
        } else {
            response = responseOrText;
        }
        
        const aiDiv = document.createElement('div');
        aiDiv.className = 'message ai-message';
        
        let html = '';
        
        if (response.thinking) {
            html += `
                <div class="thinking-box">
                    <div class="thinking-label">🤔 分析</div>
                    <div class="thinking-text">${this.escapeHtml(response.thinking)}</div>
                </div>
            `;
        }
        
        if (response.recommendations && response.recommendations.length > 0) {
            html += `<div class="results-label">🎯 推薦的 Error Code（${response.recommendations.length} 筆）</div>`;
            html += `<div class="results-grid">`;
            
            response.recommendations.forEach((rec) => {
                const confidenceColor = rec.confidence === '高' ? '#28a745' : 
                                       rec.confidence === '中' ? '#ffc107' : '#6c757d';
                
                html += `
                    <div class="result-card" onclick="aiAssistant.copyCode('${this.escapeHtml(rec.code)}')">
                        <div class="card-header">
                            <span class="code">${this.escapeHtml(rec.code)}</span>
                            <span class="confidence" style="background: ${confidenceColor}">${rec.confidence || '無'}</span>
                        </div>
                        <div class="card-body">
                            <div class="desc-en"><strong>原文：</strong>${this.escapeHtml(rec.reason)}</div>
                            ${rec.reason_zh && rec.reason_zh !== rec.reason ? `<div class="desc-zh"><strong>翻譯：</strong>${this.escapeHtml(rec.reason_zh)}</div>` : ''}
                        </div>
                        ${rec.score ? `<div class="card-score">匹配分數：${rec.score}</div>` : ''}
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        if (response.suggestions) {
            html += `
                <div class="suggestions-box">
                    ${this.escapeHtml(response.suggestions)}
                </div>
            `;
        }
        
        aiDiv.innerHTML = html;
        messages.appendChild(aiDiv);
        this.scrollToBottom();
    }

    copyCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            // 短暫顯示複製成功
            const toast = document.createElement('div');
            toast.className = 'copy-toast';
            toast.textContent = `✅ 已複製 ${code}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        });
    }

    scrollToBottom() {
        const messages = document.getElementById('aiMessages');
        if (messages) {
            messages.scrollTop = messages.scrollHeight;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

let aiAssistant;

// 全域函數
function askQuestion(question) {
    const input = document.getElementById('aiInput');
    if (input) {
        input.value = question;
        aiAssistant?.sendMessage();
    }
}

function toggleBulkSection() {
    const content = document.getElementById('bulkContent');
    const icon = document.getElementById('bulkToggleIcon');
    if (content && icon) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        icon.textContent = isHidden ? '▲' : '▼';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistant();
    aiAssistant.init();
});