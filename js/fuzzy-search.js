/**
 * 模糊搜尋算法 - Levenshtein Distance
 * 計算兩個字符串的相似度
 */

// 計算 Levenshtein Distance
function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[len1][len2];
}

// 計算相似度分數 (0-1)
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // 完全匹配
    if (s1 === s2) return 1.0;
    
    // 包含匹配
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Levenshtein Distance 計算
    const distance = levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    
    return 1 - (distance / maxLen);
}

// 模糊搜尋主函數
function fuzzySearch(query, errorCodes, topN = 5) {
    if (!query || !errorCodes || errorCodes.length === 0) {
        return [];
    }

    const queryLower = query.toLowerCase().trim();
    const results = [];

    errorCodes.forEach(item => {
        const code = item.code?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        const category = item.category?.toLowerCase() || '';

        // 計算各欄位相似度
        const codeSimilarity = calculateSimilarity(queryLower, code);
        const descSimilarity = calculateSimilarity(queryLower, description);
        const catSimilarity = calculateSimilarity(queryLower, category);

        // 取最高分
        const maxSimilarity = Math.max(codeSimilarity, descSimilarity, catSimilarity);

        // 只保留 >50% 相似度的結果
        if (maxSimilarity > 0.5) {
            results.push({
                ...item,
                similarity: maxSimilarity,
                matchType: codeSimilarity === maxSimilarity ? 'code' : 
                            descSimilarity === maxSimilarity ? 'description' : 'category'
            });
        }
    });

    // 按相似度排序並取前 N 個
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topN);
}

// 檢查是否為完全匹配
function isExactMatch(query, item) {
    if (!query || !item) return false;
    
    const queryLower = query.toLowerCase().trim();
    const code = item.code?.toLowerCase().trim() || '';
    const description = item.description?.toLowerCase().trim() || '';
    
    return queryLower === code || queryLower === description;
}

// 導出函數
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fuzzySearch, isExactMatch, calculateSimilarity };
}
