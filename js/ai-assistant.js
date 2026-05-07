// AI 助理模組 - 使用 Groq LLM (Llama 3) + 本地智慧搜尋回退
// Groq 提供高速免費 API，品質接近 GPT-4

class AIAssistant {
    constructor() {
        this.errorCodes = [];
        this.chatHistory = [];
        this.isProcessing = false;
        this.API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwQlNiZ_YNiCNME9Ie7vP7REQXERaYUZaGb78LoeFBiNQk5m-t_kss06mRQmFNiTpzT/exec';
    }

    async init() {
        console.log('🤖 AI 助理初始化中...');
        await this.loadData();
        this.setupUI();
        this.showMessage('system', '🚀 使用 Groq AI (Llama 3) - 高速推理');
        console.log('✅ AI 助理準備完成');
    }

    async loadData() {
        try {
            console.log('📡 呼叫 API:', `${this.API_BASE_URL}?action=getAll`);
            const response = await fetch(`${this.API_BASE_URL}?action=getAll`);
            console.log('📥 回應狀態:', response.status);
            const data = await response.json();
            console.log('📦 回應資料:', data);
            
            if (data.success && data.data) {
                this.errorCodes = data.data.map(item => ({
                    code: item.Code || item.code,
                    description: item.Description || item.description,
                    category: item.Category || item.category,
                    description_zh: item.Description_ZH || item.Description_zh
                }));
                console.log(`✅ 載入 ${this.errorCodes.length} 筆 Error Code`);
                this.showMessage('system', `✅ 已載入 ${this.errorCodes.length} 筆 Error Code`);
            } else {
                console.error('API 回應格式錯誤:', data);
                this.showMessage('system', `❌ API 回應錯誤：${JSON.stringify(data)}`);
            }
        } catch (error) {
            console.error('載入資料失敗:', error);
            this.showMessage('system', `❌ 載入失敗：${error.message}`);
            this.showMessage('system', '💡 請確認 Google Apps Script 已正確部署');
        }
    }

    setupUI() {
        const container = document.getElementById('aiAssistant');
        if (!container) return;

        container.querySelectorAll('.ai-quick-hint-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('aiChatInput').value = btn.textContent;
                this.sendMessage();
            });
        });

        const sendBtn = document.getElementById('aiSendBtn');
        const input = document.getElementById('aiChatInput');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        
        if (!message || this.isProcessing) return;
        
        this.showMessage('user', message);
        input.value = '';
        
        this.isProcessing = true;
        this.showTyping();
        
        try {
            // 使用 Groq AI - 讓 LLM 自己決定如何回應
            const response = await this.callGroqAI(message);
            this.hideTyping();
            this.showAIResponse(response, message, 'groq');
        } catch (error) {
            console.error('Groq AI 錯誤:', error);
            this.hideTyping();
            
            // 顯示具體錯誤訊息
            this.showMessage('system', `❌ Groq AI 錯誤：${error.message || '未知錯誤'}`);
            this.showMessage('system', '⚠️ 改用本地智慧搜尋...');
            
            // 自動回退到本地搜尋
            const response = this.performLocalSearch(message);
            this.showAIResponse(response, message, 'local');
        }
        
        this.isProcessing = false;
    }

    // 混合 AI：本地搜尋全部 1217 筆 → 給 LLM 分析前 100 個最相關的
    async callGroqAI(userQuestion) {
        // 第一步：從全部 1217 筆中找出最相關的 30 個
        const allResults = this.performLocalSearch(userQuestion, 30);
        
        // 如果本地搜尋沒有結果，傳前 30 筆完整資料給 LLM（讓它自由回應）
        let context;
        if (!allResults.recommendations || allResults.recommendations.length === 0) {
            // 沒有相關結果，傳完整資料庫的前 30 筆
            const first30 = this.errorCodes.slice(0, 30);
            context = `這是完整的 Error Code 資料庫（前 30 筆）：\n\n` + 
                first30.map((item, idx) => 
                    `${idx + 1}. ${item.code}: ${item.description} (Category: ${item.category})`
                ).join("\n");
        } else {
            // 有相關結果，傳最相關的 30 個
            const topCandidates = allResults.recommendations.slice(0, 30);
            context = `從 ${this.errorCodes.length} 筆資料中，找到以下 ${topCandidates.length} 個最相關的候選（按相關度排序）：\n\n` + 
                topCandidates.map((rec, idx) => 
                    `${idx + 1}. ${rec.code}: ${rec.reason} (匹配分數：${rec.score})`
                ).join("\n");
        }
        
        // 第二步：呼叫 Groq 讓 Llama 3 分析
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
        
        console.log("Sending context to Llama 3 for analysis...");
        
        const result = await response.json();
        
        if (!result.success) {
            // Groq 失敗，回傳本地搜尋的前 15 個結果
            console.warn("Groq failed, using local results");
            const localTop15 = {
                ...allResults,
                recommendations: allResults.recommendations ? allResults.recommendations.slice(0, 15) : []
            };
            return JSON.stringify(localTop15);
        }
        
        // 成功：回傳 Llama 3 的精選結果（按分數排序）
        const finalResults = result.data.recommendations || (allResults.recommendations ? allResults.recommendations.slice(0, 15) : []);
        
        // 確保有分數並排序
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

    // 本地智慧搜尋（回退方案）
    async performLocalSearch(userInput, maxResults = 15) {
        const userLower = userInput.toLowerCase();
        const keywords = userLower.split(/\s+/).filter(w => w.length >= 2);
        
        // 中文→英文關鍵字映射
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
        
        // 擴展關鍵字
        let expandedKeywords = [...keywords];
        for (const [chinese, englishList] of Object.entries(chineseToEnglish)) {
            if (userLower.includes(chinese)) {
                expandedKeywords = [...expandedKeywords, ...englishList];
            }
        }
        
        // 計算每個 Error Code 的分數
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
        
        // 過濾並排序
        const results = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
        
        // 呼叫 AI 翻譯結果（非同步）
        const translatedResults = await this.translateDescriptions(results);
        
        return {
            thinking: `我分析了你的問題「${userInput}」，從 ${this.errorCodes.length} 筆 Error Code 資料中搜尋並比對關鍵字。`,
            recommendations: translatedResults.map(item => ({
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

    // 使用 AI 翻譯 Error Code 描述
    async translateDescriptions(results) {
        if (!results || results.length === 0) return results;
        
        try {
            // 批量翻譯：將所有描述組合成一個請求
            const textsToTranslate = results.map(r => r.description);
            const url = `${this.API_BASE_URL}?action=translate`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    texts: JSON.stringify(textsToTranslate)
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.translations) {
                // 將翻譯結果對應回原始資料
                results.forEach((item, index) => {
                    if (result.translations[index]) {
                        item.description_zh = result.translations[index];
                    }
                });
                console.log(`✅ AI 翻譯完成：${results.length} 筆`);
            }
        } catch (error) {
            console.warn('AI 翻譯失敗，使用原文:', error);
            // 翻譯失敗不影響搜尋結果，只是沒有中文
        }
        
        return results;
    }

    // 建立 Error Code 上下文
    buildContext() {
        const maxItems = 100;
        const codes = this.errorCodes.slice(0, maxItems);
        
        return codes.map(item => 
            `- ${item.code}: ${item.description} (Category: ${item.category})`
        ).join('\n');
    }

    // 顯示 AI 回應
    showAIResponse(responseOrText, userQuestion, mode) {
        const messagesContainer = document.getElementById('aiChatMessages');
        
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
        
        let html = '';
        
        if (response.thinking) {
            html += `
                <div class="ai-thinking">
                    <div class="thinking-header">🤔 分析 ${mode === 'groq' ? '🚀' : '🔍'}</div>
                    <div class="thinking-content">${this.escapeHtml(response.thinking)}</div>
                </div>
            `;
        }
        
        if (response.recommendations && response.recommendations.length > 0) {
            html += `<div class="ai-recommendations-title">🎯 推薦的 Error Code（${response.recommendations.length} 筆）</div>`;
            html += `<div class="recommendation-cards">`;
            
            response.recommendations.forEach((rec) => {
                const confidenceColor = rec.confidence === '高' ? '#28a745' : 
                                       rec.confidence === '中' ? '#ffc107' : '#6c757d';
                
                html += `
                    <div class="recommendation-card" onclick="aiAssistant.copyToClipboard('${this.escapeHtml(rec.code)}')" title="點擊複製">
                        <div class="recommendation-header">
                            <span class="recommendation-code">${this.escapeHtml(rec.code)}</span>
                            <span class="confidence-badge" style="background: ${confidenceColor}">${rec.confidence || '無'}</span>
                        </div>
                        <div class="recommendation-reason">
                            <div class="reason-en">${this.escapeHtml(rec.reason)}</div>
                            <div class="reason-zh">${this.escapeHtml(rec.reason_zh || rec.reason)}</div>
                        </div>
                        ${rec.score ? `<div class="recommendation-score">匹配分數：${rec.score}</div>` : ''}
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        if (response.suggestions) {
            html += `
                <div class="ai-suggestions">
                    <div class="suggestions-content">${this.escapeHtml(response.suggestions)}</div>
                </div>
            `;
        }
        
        const avatar = mode === 'groq' ? '🚀' : '🔍';
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ai';
        messageDiv.innerHTML = `
            <div class="chat-avatar">${avatar}</div>
            <div class="chat-bubble gemini-response">${html}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showMessage(type, content) {
        const messagesContainer = document.getElementById('aiChatMessages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="chat-bubble">${this.escapeHtml(content)}</div>
                <div class="chat-avatar">👤</div>
            `;
        } else if (type === 'system') {
            messageDiv.innerHTML = `
                <div class="chat-avatar">⚙️</div>
                <div class="chat-bubble">${this.escapeHtml(content)}</div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTyping() {
        const messagesContainer = document.getElementById('aiChatMessages');
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai typing';
        typingDiv.id = 'aiTyping';
        typingDiv.innerHTML = `
            <div class="chat-avatar">🤖</div>
            <div class="ai-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTyping() {
        const typing = document.getElementById('aiTyping');
        if (typing) typing.remove();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            const messagesContainer = document.getElementById('aiChatMessages');
            const toastDiv = document.createElement('div');
            toastDiv.className = 'chat-message ai';
            toastDiv.innerHTML = `
                <div class="chat-avatar">✅</div>
                <div class="chat-bubble" style="font-size: 0.9em;">已複製 <strong>${text}</strong> 到剪貼簿!</div>
            `;
            messagesContainer.appendChild(toastDiv);
            this.scrollToBottom();
            
            setTimeout(() => toastDiv.remove(), 3000);
        });
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('aiChatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleMinimize() {
        const container = document.getElementById('aiAssistant');
        if (container) {
            container.classList.toggle('minimized');
        }
    }
}

let aiAssistant;

document.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistant();
    aiAssistant.init();
});
