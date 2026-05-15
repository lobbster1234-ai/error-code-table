/**
 * RAG Module - Semantic Search for Error Codes
 * Uses Transformers.js for browser-side embedding generation
 */

class ErrorCodeRAG {
    constructor() {
        this.embeddings = [];
        this.metadata = null;
        this.embedder = null;
        this.currentLang = 'zh'; // default Chinese
        this.isLoading = false;
        
        // Language configurations
        this.langConfig = {
            zh: { name: '中文', prompt: '你是工廠錯誤代碼查詢助手，工程師輸入自然語言，你回覆相關的錯誤代碼和描述。' },
            en: { name: 'English', prompt: 'You are a factory error code query assistant. When engineers input natural language, you respond with relevant error codes and descriptions.' },
            vi: { name: 'Tiếng Việt', prompt: 'Bạn là trợ lý truy vấn mã lỗi nhà máy. Khi kỹ sư nhập ngôn ngữ tự nhiên, bạn trả lời các mã lỗi và mô tả liên quan.' }
        };
    }

    /**
     * Initialize the RAG system with dynamic data
     * @param {Array} data - Array of {code, description, category} from GAS
     */
    async initWithData(data) {
        console.log('🔍 Initializing RAG system with dynamic data...');
        this.isLoading = true;
        
        try {
            // Load pre-computed embeddings (code + embedding only)
            const embeddingData = await this.loadEmbeddings();
            
            // Create a map of code -> embedding
            const embeddingMap = {};
            embeddingData.forEach(item => {
                embeddingMap[item.code] = item.embedding;
            });
            
            // Merge GAS data with embeddings
            this.embeddings = data.map(item => ({
                code: item.code,
                description: item.description || item.category || 'No description',
                category: item.category || '',
                embedding: embeddingMap[item.code] || null
            })).filter(item => item.embedding !== null); // Only keep items with embeddings
            
            console.log(`✅ RAG system ready: ${this.embeddings.length} error codes loaded`);
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize RAG:', error);
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Load pre-computed embeddings from JSON
     * @returns {Array} - Array of {code, embedding}
     */
    async loadEmbeddings() {
        const response = await fetch('./embeddings/error_codes_embedded.json');
        const data = await response.json();
        console.log(`📦 Loaded ${data.length} embeddings`);
        return data;
    }

    /**
     * Load JSON file
     */
    async loadJSON(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (e) {
            return null;
        }
    }

    /**
     * Get embeddings for a specific language (using same embeddings for multilingual model)
     * Note: Xenova/paraphrase-multilingual-MiniLM-L12-v2 supports 50+ languages
     */
    async search(query, topK = 10) {
        if (!this.embedder) {
            // Lazy load the embedder only when needed
            console.log('📥 Loading Transformers.js embedder...');
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
            this.embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
            console.log('✅ Embedder loaded');
        }

        // Generate query embedding
        const queryEmbedding = await this.embedder(query, { pooling: 'mean', normalize: true });
        const queryVector = Array.from(queryEmbedding.data);

        // Calculate cosine similarity with all embeddings
        const results = this.embeddings.map(item => {
            const similarity = this.cosineSimilarity(queryVector, item.embedding);
            return {
                code: item.code,
                description: item.description,
                category: item.category,
                similarity: similarity
            };
        });

        // Sort by similarity and return top K
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Set current language
     */
    setLanguage(lang) {
        if (this.langConfig[lang]) {
            this.currentLang = lang;
            console.log(`🌐 Language set to: ${this.langConfig[lang].name}`);
        }
    }

    /**
     * Get system prompt for current language
     */
    getSystemPrompt() {
        return this.langConfig[this.currentLang]?.prompt || this.langConfig.zh.prompt;
    }
}

// Export for use
window.ErrorCodeRAG = ErrorCodeRAG;