# 🔍 PostgreSQL Full-Text Search Functions Guide

This document provides a comprehensive understanding of PostgreSQL's full-text search functions, specifically `to_tsvector()` and `plainto_tsquery()`, and how they work together in our hybrid search system.

## 📋 Table of Contents

- [Overview](#overview)
- [to_tsvector() Function](#totsvector-function)
- [plainto_tsquery() Function](#plainto_tsquery-function)
- [Key Differences](#key-differences)
- [How They Work Together](#how-they-work-together)
- [Real-World Examples](#real-world-examples)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)

## 🎯 Overview

PostgreSQL's full-text search uses two main functions to enable efficient text searching:

1. **`to_tsvector()`** - Processes **documents** for indexing
2. **`plainto_tsquery()`** - Processes **queries** for searching

These functions work together to provide fast, language-aware text search with BM25 ranking.

## 🔧 to_tsvector() Function

### **Purpose**

Converts document content into searchable tokens for indexing and storage.

### **Syntax**

```sql
to_tsvector(config, text)
```

### **What It Does**

1. **Tokenization**: Breaks text into individual words
2. **Stemming**: Reduces words to root forms (running → run)
3. **Stop Word Removal**: Removes common words (the, and, or)
4. **Position Assignment**: Assigns position numbers to each token
5. **Case Normalization**: Converts to lowercase

### **Example**

```sql
-- Input document
SELECT to_tsvector('english', 'The quick brown fox jumps over the lazy dog');

-- Output
'brown':3 'dog':9 'fox':4 'jump':5 'lazi':8 'quick':2
```

**Processing Breakdown:**

- "The" → removed (stop word)
- "quick" → "quick" (position 2)
- "brown" → "brown" (position 3)
- "fox" → "fox" (position 4)
- "jumps" → "jump" (stemmed, position 5)
- "over" → removed (stop word)
- "the" → removed (stop word)
- "lazy" → "lazi" (stemmed, position 8)
- "dog" → "dog" (position 9)

### **Key Features**

| Feature               | Description                       |
| --------------------- | --------------------------------- |
| **Position Tracking** | Each token gets a position number |
| **Stemming**          | Words reduced to root forms       |
| **Stop Word Removal** | Common words filtered out         |
| **Case Insensitive**  | All text converted to lowercase   |
| **Language Aware**    | Uses language-specific rules      |

## 🔍 plainto_tsquery() Function

### **Purpose**

Converts user queries into searchable query format for matching against indexed documents.

### **Syntax**

```sql
plainto_tsquery(config, text)
```

### **What It Does**

1. **Tokenization**: Breaks query into individual terms
2. **Stemming**: Reduces query terms to root forms
3. **Stop Word Removal**: Removes stop words from query
4. **AND Logic**: Connects terms with `&` (AND operator)
5. **Safe Parsing**: Handles special characters safely

### **Example**

```sql
-- Input query
SELECT plainto_tsquery('english', 'quick brown fox');

-- Output
'quick' & 'brown' & 'fox'
```

**Processing Breakdown:**

- "quick" → "quick" (first term)
- "brown" → "brown" (second term)
- "fox" → "fox" (third term)
- Connected with `&` (AND logic)

### **Key Features**

| Feature               | Description                           |
| --------------------- | ------------------------------------- |
| **AND Logic**         | Terms connected with `&` operator     |
| **Safe Parsing**      | Handles quotes and special characters |
| **Stemming**          | Query terms reduced to root forms     |
| **Stop Word Removal** | Common words filtered from query      |
| **Case Insensitive**  | All terms converted to lowercase      |

## ⚖️ Key Differences

| Aspect              | `to_tsvector()`              | `plainto_tsquery()`       |
| ------------------- | ---------------------------- | ------------------------- |
| **Input**           | Document content             | User query                |
| **Purpose**         | Index documents              | Search documents          |
| **Output**          | Search vector with positions | Query with AND logic      |
| **Usage**           | For indexing/storing         | For searching/matching    |
| **Position Info**   | ✅ Includes positions        | ❌ No positions           |
| **Logic Operators** | ❌ No operators              | ✅ AND (&) logic          |
| **Processing**      | One-time (during indexing)   | Real-time (during search) |
| **Storage**         | Stored in database           | Generated per query       |

## 🤝 How They Work Together

### **The Search Process**

```sql
SELECT ts_rank(
  to_tsvector('english', content),     -- Document vector
  plainto_tsquery('english', $1)       -- Query vector
) as bm25_score
FROM document_chunks
WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1);
```

### **Step-by-Step Process**

1. **Document Indexing** (One-time):

   ```sql
   -- Document: "Stripe provides secure payment processing"
   to_tsvector('english', content)
   -- Result: 'payment':4 'process':5 'provid':2 'secur':3 'stripe':1
   ```

2. **Query Processing** (Real-time):

   ```sql
   -- Query: "secure payment"
   plainto_tsquery('english', 'secure payment')
   -- Result: 'secur' & 'payment'
   ```

3. **Matching**:

   - Document has: 'secur':3, 'payment':4
   - Query needs: 'secur' & 'payment'
   - **Match found!** ✅

4. **Ranking**:
   - `ts_rank()` calculates BM25 score
   - Based on term frequency and document frequency
   - Returns relevance score for ranking

## 🌟 Real-World Examples

### **Example 1: Stripe Documentation Search**

**Document Content:**

```
"Stripe provides secure payment processing for online businesses.
The API supports various payment methods including cards and digital wallets."
```

**Document Processing:**

```sql
SELECT to_tsvector('english', 'Stripe provides secure payment processing for online businesses. The API supports various payment methods including cards and digital wallets.');
-- Result: 'api':8 'busi':6 'card':12 'digit':13 'includ':11 'method':10 'onlin':5 'payment':4 'process':4 'provid':2 'secur':3 'stripe':1 'support':9 'various':9 'wallet':13
```

**User Query:**

```
"secure payment methods"
```

**Query Processing:**

```sql
SELECT plainto_tsquery('english', 'secure payment methods');
-- Result: 'secur' & 'payment' & 'method'
```

**Matching Results:**

- ✅ 'secur' found at position 3
- ✅ 'payment' found at position 4
- ✅ 'method' found at position 10
- **All terms match!** High relevance score.

### **Example 2: Error Code Search**

**Document Content:**

```
"Card declined errors occur when the bank rejects the transaction.
Common reasons include insufficient funds, expired cards, and invalid CVV codes."
```

**User Query:**

```
"card declined error"
```

**Processing:**

```sql
-- Document vector
'bank':4 'card':1,7 'code':12 'common':6 'cvv':12 'declin':1 'error':2 'expir':8 'fund':6 'invalid':11 'occur':3 'reason':6 'reject':5 'suffici':6 'transact':5

-- Query vector
'card' & 'declin' & 'error'
```

**Matching Results:**

- ✅ 'card' found at positions 1, 7
- ✅ 'declin' found at position 1
- ✅ 'error' found at position 2
- **Perfect match!** Very high relevance score.

## ⚡ Performance Considerations

### **Indexing Strategy**

```sql
-- Create GIN index for fast full-text search
CREATE INDEX idx_document_chunks_content_gin
ON document_chunks USING gin(to_tsvector('english', content));
```

**Benefits:**

- **Fast Lookups**: O(log n) search time
- **Efficient Storage**: Compressed vector format
- **Automatic Updates**: Index updates with data changes

### **Query Optimization**

```sql
-- Efficient query pattern
WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
ORDER BY ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) DESC
```

**Optimization Tips:**

1. **Use GIN indexes** for full-text search
2. **Pre-compute vectors** during indexing
3. **Limit result sets** with appropriate WHERE clauses
4. **Use parameterized queries** to prevent SQL injection

## 🎯 Best Practices

### **1. Consistent Language Configuration**

```sql
-- Always use same language config
to_tsvector('english', content)
plainto_tsquery('english', query)
```

### **2. Proper Indexing**

```sql
-- Create indexes during table creation
CREATE INDEX idx_content_gin ON documents USING gin(to_tsvector('english', content));
CREATE INDEX idx_metadata_gin ON documents USING gin(metadata);
```

### **3. Query Safety**

```sql
-- Use parameterized queries
const query = 'SELECT * FROM documents WHERE to_tsvector(\'english\', content) @@ plainto_tsquery(\'english\', $1)';
const result = await client.query(query, [userInput]);
```

### **4. Performance Monitoring**

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM documents
WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'search term');
```

## 🔧 Integration with Our System

### **In PostgreSQLBM25Service**

```javascript
async searchBM25(query, topK = 10, filters = {}) {
  const query_sql = `
    SELECT
      chunk_id,
      content,
      metadata,
      title,
      category,
      source,
      word_count,
      ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) as bm25_score
    FROM document_chunks
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
    ORDER BY bm25_score DESC
    LIMIT $2
  `;

  const result = await client.query(query_sql, [query, topK]);
  return result.rows;
}
```

### **Key Benefits in Our Implementation**

1. **Automatic BM25 Scoring**: PostgreSQL handles complex calculations
2. **Language Processing**: Built-in English language support
3. **Performance**: GIN indexes for fast search
4. **Scalability**: Handles millions of documents efficiently
5. **Reliability**: ACID compliance and data integrity

## 📊 Summary

Understanding `to_tsvector()` and `plainto_tsquery()` is crucial for effective PostgreSQL full-text search:

- **`to_tsvector()`**: Processes documents for indexing (one-time)
- **`plainto_tsquery()`**: Processes queries for searching (real-time)
- **Together**: Enable fast, language-aware text search with BM25 ranking
- **Our System**: Uses both functions for efficient hybrid search

This combination provides the foundation for our scalable, high-performance document retrieval system that combines PostgreSQL BM25 search with Pinecone semantic search.
