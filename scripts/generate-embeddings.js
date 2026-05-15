// Embedding Generation Script
// Pre-computes embeddings for all error codes using Transformers.js
// Run with: node scripts/generate-embeddings.js

const fs = require('fs');
const path = require('path');

// Check if transformers is available
let pipeline;
try {
    pipeline = require('@xenova/transformers').pipeline;
} catch (e) {
    console.log('⚠️  @xenova/transformers not installed globally');
    console.log('   Trying to use local installation...');
    try {
        require('./node_modules/@xenova/transformers');
        pipeline = require('./node_modules/@xenova/transformers').pipeline;
    } catch (e2) {
        console.error('❌ Failed to load transformers. Please install:');
        console.error('   npm install @xenova/transformers');
        process.exit(1);
    }
}

async function generateEmbeddings() {
    console.log('🚀 Starting embedding generation...');
    
    // Load error codes data
    const dataPath = path.join(__dirname, '..', 'data', 'error_codes.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const errorCodes = data.errorCodes;
    console.log(`📊 Loaded ${errorCodes.length} error codes`);
    
    // Load transformer model
    console.log('📥 Loading multilingual model: paraphrase-multilingual-MiniLM-L12-v2');
    const embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    console.log('✅ Model loaded');
    
    const embeddings = [];
    const batchSize = 32;
    
    for (let i = 0; i < errorCodes.length; i += batchSize) {
        const batch = errorCodes.slice(i, i + batchSize);
        const texts = batch.map(item => item.description);
        
        // Generate embeddings for batch
        const results = await embedder(texts, { pooling: 'mean', normalize: true });
        
        batch.forEach((item, idx) => {
            const embedding = Array.from(results[idx]);
            embeddings.push({
                code: item.code,
                description: item.description,
                category: item.category || '',
                embedding: embedding
            });
        });
        
        const progress = Math.min(i + batchSize, errorCodes.length);
        console.log(`📈 Progress: ${progress}/${errorCodes.length} (${Math.round(progress/errorCodes.length*100)}%)`);
    }
    
    // Save embeddings
    const outputPath = path.join(__dirname, '..', 'embeddings', 'error_codes_embedded.json');
    fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 0));
    
    console.log(`✅ Saved ${embeddings.length} embeddings to ${outputPath}`);
    console.log(`   Embedding dimension: ${embeddings[0]?.embedding?.length || 'unknown'}`);
    
    // Also create a metadata file
    const metadata = {
        model: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        embedding_dim: embeddings[0]?.embedding?.length || 384,
        count: embeddings.length,
        created_at: new Date().toISOString()
    };
    fs.writeFileSync(
        path.join(__dirname, '..', 'embeddings', 'metadata.json'),
        JSON.stringify(metadata, null, 2)
    );
    
    console.log('🎉 Done!');
}

generateEmbeddings().catch(console.error);