#!/usr/bin/env python3
"""
Create mock embeddings for testing (384-dimensional vectors)
In production, use generate_embeddings.py with sentence-transformers
"""

import json
import os
import random
import math

def normalize_vector(vec):
    """Normalize a vector to unit length"""
    norm = math.sqrt(sum(x*x for x in vec))
    if norm == 0:
        return vec
    return [x/norm for x in vec]

def generate_random_embedding(dim=384):
    """Generate a random normalized embedding"""
    vec = [random.gauss(0, 1) for _ in range(dim)]
    return normalize_vector(vec)

def create_mock_embeddings():
    print("🚀 Creating mock embeddings...")
    
    # Load error codes data
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'error_codes.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    error_codes = data['errorCodes']
    print(f"📊 Loaded {len(error_codes)} error codes")
    
    # Generate deterministic mock embeddings (same input = same output)
    random.seed(42)
    
    embeddings = []
    for item in error_codes:
        # Use item code as seed for reproducibility
        random.seed(item['code'])
        vec = normalize_vector([random.gauss(0, 1) for _ in range(384)])
        
        embeddings.append({
            'code': item['code'],
            'description': item['description'],
            'category': item.get('category', ''),
            'embedding': vec
        })
    
    # Save embeddings
    output_path = os.path.join(os.path.dirname(__file__), '..', 'embeddings', 'error_codes_embedded.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(embeddings, f)
    
    print(f"✅ Saved {len(embeddings)} embeddings to {output_path}")
    
    # Create metadata
    metadata = {
        'model': 'Xenova/paraphrase-multilingual-MiniLM-L12-v2 (MOCK)',
        'embedding_dim': 384,
        'count': len(embeddings),
        'created_at': __import__('datetime').datetime.now().isoformat(),
        'note': 'These are mock embeddings for testing. Replace with real embeddings for production.'
    }
    
    metadata_path = os.path.join(os.path.dirname(__file__), '..', 'embeddings', 'metadata.json')
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    
    print("🎉 Mock embeddings created!")
    print("⚠️  Note: These are mock embeddings. For production, run:")
    print("   pip install sentence-transformers")
    print("   python3 scripts/generate_embeddings.py")

if __name__ == '__main__':
    create_mock_embeddings()