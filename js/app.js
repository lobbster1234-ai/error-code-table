/**
 * Error Code RAG System - Main Application
 * Integrates Transformers.js for semantic search + Groq LLM for responses
 */

class ErrorCodeRAGApp {
    constructor() {
        this.rag = new ErrorCodeRAG();
        this.isProcessing = false;
        this.currentLang = 'zh';
        
        // Language configurations
        this.langConfig = {
            zh: {
                name: '中文',
                placeholder: '輸入你的問題（支援中/英/越語言）...',
                welcomeTitle: '嗨！我是 Error Code 查詢助理',
                welcomeDesc: '你可以用自然語言描述問題，例如：',
                examples: ['「相機測試失敗」', '「電源校正錯誤」', '「藍牙連線逾時」'],
                hint: '💡 支援中文、英文、越南語查詢'
            },
            en: {
                name: 'English',
                placeholder: 'Type your question (supports Chinese/English/Vietnamese)...',
                welcomeTitle: 'Hi! I\'m your Error Code Assistant',
                welcomeDesc: 'Describe your problem in natural language, e.g.:',
                examples: ['"camera test failed"', '"power calibration error"', '"bluetooth connection timeout"'],
                hint: '💡 Supports Chinese, English, and Vietnamese queries'
            },
            vi: {
                name: 'Tiếng Việt',
                placeholder: 'Nhập câu hỏi của bạn (hỗ trợ Tiếng Trung/Anh/Việt)...',
                welcomeTitle: 'Xin chào! Tôi là trợ lý Tra cứu Mã lỗi',
                welcomeDesc: 'Bạn có thể mô tả vấn đề bằng ngôn ngữ tự nhiên, ví dụ:',
                examples: ['"lỗi kiểm tra camera"', '"lỗi hiệu chỉnh nguồn"', '"hết thời gian kết nối bluetooth"'],
                hint: '💡 Hỗ trợ truy vấn tiếng Trung, Anh và Việt'
            }
        };

        // Quick hints for each language
        this.quickHints = {
            zh: [
                { icon: '📷', text: '相機測試錯誤', query: '相機測試錯誤' },
                { icon: '⚡', text: '電源問題', query: '電源供應問題' },
                { icon: '🌐', text: '網路連線', query: '網路連線失敗' },
                { icon: '📶', text: '藍牙失敗', query: '藍牙配對失敗' },
                { icon: '💾', text: '記憶體錯誤', query: '記憶體讀寫錯誤' },
                { icon: '⏱️', text: '校正逾時', query: '校正逾時' }
            ],
            en: [
                { icon: '📷', text: 'Camera Test', query: 'camera test failed' },
                { icon: '⚡', text: 'Power Issue', query: 'power calibration error' },
                { icon: '🌐', text: 'Network', query: 'network connection failed' },
                { icon: '📶', text: 'Bluetooth', query: 'bluetooth pairing failed' },
                { icon: '💾', text: 'Memory Error', query: 'memory read write error' },
                { icon: '⏱️', text: 'Timeout', query: 'calibration timeout' }
            ],
            vi: [
                { icon: '📷', text: 'Lỗi Camera', query: 'lỗi kiểm tra camera' },
                { icon: '⚡', text: 'Nguồn điện', query: 'lỗi hiệu chỉnh nguồn' },
                { icon: '🌐', text: 'Mạng', query: 'lỗi kết nối mạng' },
                { icon: '📶', text: 'Bluetooth', query: 'lỗi ghép nối bluetooth' },
                { icon: '💾', text: 'Bộ nhớ', query: 'lỗi đọc ghi bộ nhớ' },
                { icon: '⏱️', text: 'Hết giờ', query: 'hết thời gian hiệu chỉnh' }
            ]
        };
    }

    async init() {
        console.log('🚀 Initializing Error Code RAG App...');
        
        // Initialize RAG system
        await this.rag.init();
        
        // Setup UI
        this.setupUI();
        
        console.log('✅ App ready');
    }

    setupUI() {
        const input = document.getElementById('aiInput');
        const sendBtn = document.getElementById('sendBtn');
        
        // Send button
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.handleSearch());
        }
        
        // Enter key
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSearch();
                }
            });
            
            // Auto-resize textarea
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
        }
    }

    /**
     * Set current language and update UI
     */
    setLanguage(lang) {
        if (!this.langConfig[lang]) return;
        
        this.currentLang = lang;
        this.rag.setLanguage(lang);
        
        // Update language buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        // Update placeholder
        const input = document.getElementById('aiInput');
        if (input) {
            input.placeholder = this.langConfig[lang].placeholder;
        }
        
        // Update welcome message
        this.updateWelcomeMessage();
        
        // Update quick hints
        this.updateQuickHints();
        
        console.log(`🌐 Language switched to: ${this.langConfig[lang].name}`);
    }

    updateWelcomeMessage() {
        const welcomeText = document.querySelector('.welcome-text');
        if (!welcomeText) return;
        
        const config = this.langConfig[this.currentLang];
        
        welcomeText.innerHTML = `
            <h3>${config.welcomeTitle}</h3>
            <p>${config.welcomeDesc}</p>
            <ul>
                ${config.examples.map(ex => `<li>${ex}</li>`).join('')}
            </ul>
            <p class="hint-text">${config.hint}</p>
        `;
    }

    updateQuickHints() {
        const hintsContainer = document.querySelector('.quick-hints');
        if (!hintsContainer) return;
        
        const hints = this.quickHints[this.currentLang];
        hintsContainer.innerHTML = hints.map(hint => `
            <button class="hint-btn" onclick="app.askQuestion('${hint.query}')">
                ${hint.icon} ${hint.text}
            </button>
        `).join('');
    }

    askQuestion(question) {
        const input = document.getElementById('aiInput');
        if (input) {
            input.value = question;
            this.handleSearch();
        }
    }

    async handleSearch() {
        const input = document.getElementById('aiInput');
        const message = input?.value.trim();
        
        if (!message || this.isProcessing) return;
        
        input.value = '';
        input.style.height = 'auto';
        this.isProcessing = true;
        
        // Show user message
        this.addUserMessage(message);
        
        // Show loading
        this.showTyping();
        
        try {
            // Step 1: Semantic search using RAG
            const searchResults = await this.rag.search(message, 10);
            
            // Step 2: Get LLM response using Groq
            const response = await this.callGroqAPI(message, searchResults);
            
            // Hide loading and show response
            this.hideTyping();
            this.showAIResponse(response, searchResults);
            
        } catch (error) {
            console.error('Search error:', error);
            this.hideTyping();
            this.showError('抱歉，查詢時發生錯誤，請稍後再試。');
        }
        
        this.isProcessing = false;
    }

    async callGroqAPI(userQuery, searchResults) {
        // GAS Proxy URL
        const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbwQlNiZ_YNiCNME9Ie7vP7REQXERaYUZaGb78LoeFBiNQk5m-t_kss06mRQmFNiTpzT/exec';
        
        // Prepare context from search results
        const context = searchResults.map((result, idx) => 
            `${idx + 1}. ${result.code}: ${result.description} (相似度: ${(result.similarity * 100).toFixed(1)}%)`
        ).join('\n');
        
        // Check if using proxy or direct API
        if (GAS_PROXY_URL.includes('YOUR_GAS_DEPLOYMENT_ID')) {
            // Fallback to local results if GAS not configured
            return {
                type: 'local',
                thinking: this.getThinkingText(userQuery),
                results: searchResults
            };
        }
        
        try {
            const response = await fetch(GAS_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userQuery,
                    context: context,
                    language: this.currentLang
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    type: 'groq',
                    thinking: this.getThinkingText(userQuery),
                    analysis: data.analysis,
                    results: searchResults
                };
            }
            
            throw new Error(data.error);
            
        } catch (error) {
            console.warn('GAS Proxy error, falling back to local:', error);
            return {
                type: 'local',
                thinking: this.getThinkingText(userQuery),
                results: searchResults
            };
        }
    }

    getSystemPrompt() {
        const prompts = {
            zh: '你是工廠錯誤代碼查詢助手。分析用戶的問題，從提供的錯誤代碼列表中找出最相關的項目，並給出簡潔的分析和建議。用繁體中文回答。',
            en: 'You are a factory error code query assistant. Analyze the user\'s question, find the most relevant items from the provided error code list, and give concise analysis and recommendations.',
            vi: 'Bạn là trợ lý truy vấn mã lỗi nhà máy. Phân tích câu hỏi của người dùng, tìm các mục phù hợp nhất từ danh sách mã lỗi được cung cấp, và đưa ra phân tích và khuyến nghị ngắn gọn.'
        };
        return prompts[this.currentLang] || prompts.zh;
    }

    getThinkingText(query) {
        const texts = {
            zh: `正在分析「${query}」，從 ${this.rag.embeddings.length} 筆資料中搜尋相關錯誤代碼...`,
            en: `Analyzing "${query}", searching through ${this.rag.embeddings.length} error codes...`,
            vi: `Đang phân tích "${query}", tìm kiếm trong ${this.rag.embeddings.length} mã lỗi...`
        };
        return texts[this.currentLang] || texts.zh;
    }

    addUserMessage(message) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        
        // Hide welcome message
        const welcome = messages.querySelector('.welcome-message');
        if (welcome) welcome.style.display = 'none';
        
        const userDiv = document.createElement('div');
        userDiv.className = 'message user-message';
        userDiv.innerHTML = `<div class="message-content">${this.escapeHtml(message)}</div>`;
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

    showAIResponse(response, searchResults) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        
        const aiDiv = document.createElement('div');
        aiDiv.className = 'message ai-message';
        
        let html = '';
        
        // Thinking section
        if (response.thinking) {
            html += `
                <div class="thinking-box">
                    <div class="thinking-label">🤔 ${this.currentLang === 'zh' ? '分析' : this.currentLang === 'en' ? 'Analysis' : 'Phân tích'}</div>
                    <div class="thinking-text">${this.escapeHtml(response.thinking)}</div>
                </div>
            `;
        }
        
        // LLM Analysis (if available)
        if (response.analysis) {
            html += `
                <div class="ai-analysis">
                    <div class="analysis-label">💡 AI ${this.currentLang === 'zh' ? '分析' : this.currentLang === 'en' ? 'Analysis' : 'Phân tích'}</div>
                    <div class="analysis-text">${this.formatMarkdown(response.analysis)}</div>
                </div>
            `;
        }
        
        // Search results
        if (searchResults && searchResults.length > 0) {
            html += `<div class="results-label">🎯 ${this.getResultsLabel()} (${searchResults.length})</div>`;
            html += `<div class="results-grid">`;
            
            searchResults.forEach((result) => {
                // 確保一定有 code 和 description
                const code = result.code || 'N/A';
                const description = result.description || 'No description available';
                const confidence = result.similarity > 0.7 ? 'high' : result.similarity > 0.4 ? 'medium' : 'low';
                const confidenceText = this.getConfidenceText(confidence);
                
                html += `
                    <div class="result-card" onclick="app.copyCode('${this.escapeHtml(code)}')">
                        <div class="card-header">
                            <span class="code">${this.escapeHtml(code)}</span>
                            <span class="confidence confidence-${confidence}">${confidenceText}</span>
                        </div>
                        <div class="card-body">
                            <div class="desc-en">${this.escapeHtml(description)}</div>
                        </div>
                        <div class="card-score">${this.getSimilarityLabel()}: ${(result.similarity * 100).toFixed(1)}%</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        } else {
            html += `<div class="no-results">❌ ${this.getNoResultsText()}</div>`;
        }
        
        aiDiv.innerHTML = html;
        messages.appendChild(aiDiv);
        this.scrollToBottom();
    }

    getResultsLabel() {
        const labels = { zh: '推薦的 Error Code', en: 'Recommended Error Codes', vi: 'Mã lỗi được đề xuất' };
        return labels[this.currentLang] || labels.zh;
    }

    getConfidenceText(confidence) {
        const texts = {
            zh: { high: '高', medium: '中', low: '低' },
            en: { high: 'High', medium: 'Medium', low: 'Low' },
            vi: { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }
        };
        return (texts[this.currentLang] || texts.zh)[confidence];
    }

    getSimilarityLabel() {
        const labels = { zh: '相似度', en: 'Similarity', vi: 'Độ tương đồng' };
        return labels[this.currentLang] || labels.zh;
    }

    getNoResultsText() {
        const texts = { zh: '未找到相關錯誤代碼', en: 'No related error codes found', vi: 'Không tìm thấy mã lỗi liên quan' };
        return texts[this.currentLang] || texts.zh;
    }

    showError(message) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai-message error';
        errorDiv.innerHTML = `<div class="error-text">${this.escapeHtml(message)}</div>`;
        messages.appendChild(errorDiv);
        this.scrollToBottom();
    }

    copyCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            const toast = document.createElement('div');
            toast.className = 'copy-toast';
            toast.textContent = `✅ ${this.getCopiedText()}: ${code}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        });
    }

    getCopiedText() {
        const texts = { zh: '已複製', en: 'Copied', vi: 'Đã sao chép' };
        return texts[this.currentLang] || texts.zh;
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

    formatMarkdown(text) {
        if (!text) return '';
        // Simple markdown formatting
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
}

// Global app instance
let app;

// Global toggle function for bulk section
function toggleBulkSection() {
    const content = document.getElementById('bulkContent');
    const icon = document.getElementById('bulkToggleIcon');
    if (content && icon) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        icon.textContent = isHidden ? '▲' : '▼';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    app = new ErrorCodeRAGApp();
    app.init();
});

// API Key management
function setGroqApiKey(key) {
    localStorage.setItem('groq_api_key', key);
    console.log('✅ Groq API key saved');
}

function getGroqApiKey() {
    return localStorage.getItem('groq_api_key');
}

// Expose functions
window.app = app;
window.setGroqApiKey = setGroqApiKey;
window.getGroqApiKey = getGroqApiKey;
