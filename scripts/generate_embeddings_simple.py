#!/usr/bin/env python3
"""Simple script to generate mock embeddings"""
import json
import os
import random
import math

def normalize_vector(vec):
    norm = math.sqrt(sum(x*x for x in vec))
    if norm == 0:
        return vec
    return [x/norm for x in vec]

def generate_deterministic_embedding(code, dim=384):
    """Generate deterministic embedding based on code"""
    random.seed(code)
    vec = [random.gauss(0, 1) for _ in range(dim)]
    return normalize_vector(vec)

# Load error codes
with open('/home/stella_fan/ErrorCodeSystem_Website/data/error_codes.json', 'r') as f:
    data = json.load(f)

error_codes = data['errorCodes']

# Generate embeddings
embeddings = []
for item in error_codes:
    vec = generate_deterministic_embedding(item['code'])
    embeddings.append({
        'code': item['code'],
        'description': item['description'],
        'category': item.get('category', ''),
        'embedding': vec
    })

# Save
with open('/home/stella_fan/ErrorCodeSystem_Website/embeddings/error_codes_embedded.json', 'w') as f:
    json.dump(embeddings, f)

print(f"Generated {len(embeddings)} embeddings")

# Create metadata
metadata = {
    'model': 'Xenova/paraphrase-multilingual-MiniLM-L12-v2 (MOCK)',
    'embedding_dim': 384,
    'count': len(embeddings),
    'created_at': '2025-05-15T15:30:00'
}

with open('/home/stella_fan/ErrorCodeSystem_Website/embeddings/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("Done!")
