#!/usr/bin/env python3
"""
Embedding Generation Script
Pre-computes embeddings for all error codes using sentence-transformers
Run with: python3 scripts/generate_embeddings.py
"""

import json
import os
import sys

# Check for sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("❌ sentence-transformers not installed")
    print("   Run: pip install sentence-transformers")
    sys.exit(1)

def generate_embeddings():
    print("🚀 Starting embedding generation...")
    
    # Load error codes data
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'error_codes.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    error_codes = data['errorCodes']
    print(f"📊 Loaded {len(error_codes)} error codes")
    
    # Load multilingual model
    model_name = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
    print(f"📥 Loading multilingual model: {model_name}")
    model = SentenceTransformer(model_name)
    print("✅ Model loaded")
    
    # Generate embeddings
    texts = [item['description'] for item in error_codes]
    print(f"🔄 Generating embeddings for {len(texts)} descriptions...")
    embeddings_list = model.encode(texts, show_progress_bar=True, batch_size=32)
    
    # Create output data
    embeddings = []
    for i, item in enumerate(error_codes):
        embeddings.append({
            'code': item['code'],
            'description': item['description'],
            'category': item.get('category', ''),
            'embedding': embeddings_list[i].tolist()
        })
    
    # Save embeddings
    output_path = os.path.join(os.path.dirname(__file__), '..', 'embeddings', 'error_codes_embedded.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(embeddings, f)
    
    print(f"✅ Saved {len(embeddings)} embeddings to {output_path}")
    print(f"   Embedding dimension: {len(embeddings[0]['embedding']) if embeddings else 'unknown'}")
    
    # Also create a metadata file
    metadata = {
        'model': model_name,
        'embedding_dim': len(embeddings[0]['embedding']) if embeddings else 384,
        'count': len(embeddings),
        'created_at': __import__('datetime').datetime.now().isoformat()
    }
    
    metadata_path = os.path.join(os.path.dirname(__file__), '..', 'embeddings', 'metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    
    print("🎉 Done!")

if __name__ == '__main__':
    generate_embeddings()