# 🔍 PostgreSQL-Based Hybrid Search System - Working Flow & Code Guide

This document provides a comprehensive guide to the PostgreSQL-based hybrid search system's working flow, highlighting important code sections and functions.

## 🏗️ System Architecture Overview

```
User Query
    ↓
┌─────────────────────────────────────────────────────────┐
│                HybridSearch Class                      │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ PostgreSQL BM25 │    │     Pinecone Semantic     │ │
│  │  (Full-text)    │    │   (Vector Similarity)     │ │
│  │                 │    │                            │ │
│  │ • ts_rank       │    │ • Vector similarity        │ │
│  │ • Full-text     │    │ • Cosine similarity        │ │
│  │ • Metadata      │    │ • Embedding-based          │ │
│  │ • Indexes       │    │ • Pinecone API             │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│           ↓                           ↓                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Fusion Algorithm                       │ │
│  │  • Weighted combination                            │ │
│  │  • finalScore = α * bm25 + (1-α) * semantic        │ │
│  │  • Dynamic weight adjustment                       │ │
│  │  • Query type detection                            │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
    ↓
Ranked Results
```

## 📋 Core Class Structure

### **HybridSearch Class Constructor**

```javascript
class HybridSearch {
  constructor(vectorStore, embeddings, postgresBM25Service = null) {
    this.vectorStore = vectorStore; // Pinecone for semantic search
    this.embeddings = embeddings; // Google Gemini embeddings
    this.postgresBM25Service =
      postgresBM25Service || new PostgreSQLBM25Service();
    this.isInitialized = false; // Initialization flag
  }
}
```

**Key Properties:**

- **`vectorStore`**: Pinecone for semantic search
- **`embeddings`**: Google Gemini embeddings for vector generation
- **`postgresBM25Service`**: PostgreSQL service for BM25 keyword search
- **`isInitialized`**: Flag to track system initialization

---

## 🔄 Complete Working Flow

### **Step 1: System Initialization**

#### **Function: `initialize()`**

```javascript
async initialize() {
  try {
    console.log("🔧 Initializing PostgreSQL-based hybrid search system...");

    // Test PostgreSQL connection
    const stats = await this.postgresBM25Service.getStats();
    console.log(`✅ PostgreSQL connection established`);
    console.log(`📊 Database stats: ${stats.total_chunks} chunks, ${stats.categories} categories`);

    this.isInitialized = true;
    console.log("✅ PostgreSQL-based hybrid search initialized");
  } catch (error) {
    console.error(
      "❌ Failed to initialize PostgreSQL hybrid search:",
      error.message
    );
    throw error;
  }
}
```

**Purpose**: Sets up the PostgreSQL-based hybrid search system with both BM25 and semantic capabilities.

**Key Steps:**

1. **PostgreSQL Connection**: Tests connection to PostgreSQL database
2. **Database Statistics**: Retrieves document count and category information
3. **System Initialization**: Marks system as ready for search operations

---

### **Step 2: PostgreSQL BM25 Service**

#### **PostgreSQLBM25Service Class**

```javascript
class PostgreSQLBM25Service {
  constructor() {
    this.pool = pool; // PostgreSQL connection pool
  }

  // Insert document chunks into PostgreSQL
  async insertChunks(chunks) {
    // Batch insert with conflict resolution
  }

  // Perform BM25 search using PostgreSQL full-text search
  async searchBM25(query, topK = 10, filters = {}) {
    // Uses ts_rank for BM25 scoring
  }

  // Get database statistics
  async getStats() {
    // Returns chunk count, categories, sources
  }
}
```

**Key Features:**

- **Full-text Search**: Uses PostgreSQL's `to_tsvector` and `ts_rank`
- **Metadata Filtering**: Supports category and source filters
- **Connection Pooling**: Efficient database connection management
- **Batch Operations**: Optimized for bulk document insertion

---

### **Step 3: Document Ingestion Process**

#### **PostgreSQL Document Storage**

```javascript
// In ingest.js - Document ingestion process
async function main() {
  // 1. Load documents from data folder
  const documents = await loadDocuments();

  // 2. Process documents into chunks
  const chunks = await processDocuments(documents);

  // 3. Store in PostgreSQL for BM25 search
  const postgresBM25Service = new PostgreSQLBM25Service();
  await postgresBM25Service.insertChunks(chunks);

  // 4. Store in Pinecone for semantic search
  await storeChunks(chunks, embeddings, pinecone);
}
```

**Purpose**: Documents are ingested once during setup and stored in both PostgreSQL and Pinecone.

**Key Features:**

- **PostgreSQL Storage**: Documents stored in `document_chunks` table for BM25 search
- **Pinecone Storage**: Document embeddings stored for semantic search
- **One-time Process**: Ingestion happens during setup, not during search
- **Dual Storage**: Same documents available for both search types

---

### **Step 4: Query Type Detection**

#### **Function: `isErrorCode(query)`**

```javascript
isErrorCode(query) {
  const errorPatterns = [
    // Stripe error codes
    /card_declined|card_expired|insufficient_funds|invalid_cvc|processing_error/i,
    // API error patterns
    /err_\d+|error_\d+|api_error|validation_error/i,
    // HTTP status codes
    /\b(4\d{2}|5\d{2})\b/,
    // Technical tokens
    /sk_(live|test)_[a-zA-Z0-9]+|pk_(live|test)_[a-zA-Z0-9]+/i,
    // Webhook signatures
    /whsec_[a-zA-Z0-9]+/i,
  ];

  return errorPatterns.some((pattern) => pattern.test(query));
}
```

**Purpose**: Detects technical queries that should prioritize BM25 keyword search.

**Patterns Detected:**

- **Stripe Error Codes**: `card_declined`, `insufficient_funds`, etc.
- **API Error Patterns**: `err_123`, `error_456`, etc.
- **HTTP Status Codes**: `400`, `500`, etc.
- **API Keys**: `sk_live_*`, `pk_test_*`
- **Webhook Signatures**: `whsec_*`

---

### **Step 5: PostgreSQL BM25 Search Implementation**

#### **Function: `searchBM25(query, topK)`**

```javascript
async searchBM25(query, topK = 10, filters = {}) {
  try {
    console.log(`🔍 PostgreSQL BM25 search for: "${query}"`);

    const results = await this.postgresBM25Service.searchBM25(query, topK, filters);

    console.log(`📊 PostgreSQL BM25 found ${results.length} results`);
    return results;
  } catch (error) {
    console.error("❌ PostgreSQL BM25 search failed:", error.message);
    return [];
  }
}
```

**Purpose**: Performs BM25 keyword search using PostgreSQL full-text search.

**Key Features:**

- **PostgreSQL Full-text Search**: Uses `to_tsvector` and `ts_rank` for BM25 scoring
- **Metadata Filtering**: Supports category and source filters
- **Optimized Indexes**: GIN indexes for fast full-text search
- **Connection Pooling**: Efficient database connection management

---

### **Step 6: Database Schema**

#### **PostgreSQL Table Structure**

```sql
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    chunk_id VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    title VARCHAR(500),
    category VARCHAR(100),
    source VARCHAR(500),
    word_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Optimized Indexes**

```sql
-- Full-text search index
CREATE INDEX idx_document_chunks_content_gin
ON document_chunks USING gin(to_tsvector('english', content));

-- Metadata search index
CREATE INDEX idx_document_chunks_metadata_gin
ON document_chunks USING gin(metadata);

-- Category and source filters
CREATE INDEX idx_document_chunks_category ON document_chunks (category);
CREATE INDEX idx_document_chunks_source ON document_chunks (source);
```

**Key Benefits:**

- **Fast Full-text Search**: GIN indexes for efficient text search
- **Metadata Filtering**: JSONB indexes for complex queries
- **Scalable**: Can handle millions of documents
- **Persistent**: Data survives application restarts

---

### **Step 7: PostgreSQL BM25 Score Calculation**

#### **PostgreSQL Built-in BM25 Scoring**

```sql
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
```

**Purpose**: PostgreSQL automatically calculates BM25 scores using built-in `ts_rank()` function.

**PostgreSQL Functions:**

- **`to_tsvector('english', content)`**: Converts text to searchable vector
- **`plainto_tsquery('english', $1)`**: Converts query to searchable format
- **`ts_rank(vector, query)`**: Calculates BM25 relevance score automatically
- **`@@`**: Full-text search operator for matching

**Key Benefits:**

- **Automatic Scoring**: No manual BM25 calculation needed
- **Optimized Performance**: Uses GIN indexes for fast search
- **Language Support**: Built-in English language processing
- **Standardized**: Uses PostgreSQL's proven BM25 implementation

---

### **Step 8: Semantic Search Implementation**

#### **Function: `searchSemantic(query, topK)`**

```javascript
async searchSemantic(query, topK = 10) {
  try {
    console.log(`🔍 Semantic search for: "${query}"`);

    // Generate query embedding
    const queryEmbedding = await this.embeddings.embedQuery(query);

    if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Failed to generate query embedding");
    }

    let semanticResults = [];

    if (this.vectorStore.type === "pinecone") {
      // Pinecone search
      const searchResponse = await this.vectorStore.index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
      });

      semanticResults = searchResponse.matches.map((match, index) => ({
        id: match.id,
        content: match.metadata.content,
        metadata: {
          source: match.metadata.source,
          title: match.metadata.title,
          category: match.metadata.category,
          docType: match.metadata.docType,
          chunk_index: match.metadata.chunk_index,
          total_chunks: match.metadata.total_chunks,
        },
        source: match.metadata.source,
        semanticScore: match.score,
        searchType: "semantic",
      }));
    }

    console.log(`📊 Semantic search found ${semanticResults.length} results`);
    return semanticResults;
  } catch (error) {
    console.error("❌ Semantic search failed:", error.message);
    return [];
  }
}
```

**Purpose**: Performs semantic search using Pinecone vector database.

**Key Features:**

- **Embedding Generation**: Uses Google Gemini embeddings
- **Vector Similarity**: Cosine similarity in high-dimensional space
- **Metadata Preservation**: Maintains document metadata
- **Score-based Ranking**: Sorts by semantic relevance

---

### **Step 9: Score Normalization**

#### **Function: `normalizeScores(results, scoreField)`**

```javascript
normalizeScores(results, scoreField = "score") {
  if (results.length === 0) return results;

  const scores = results.map((r) => r[scoreField]);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  if (range === 0) {
    // All scores are the same, set to 0.5
    return results.map((r) => ({ ...r, normalizedScore: 0.5 }));
  }

  return results.map((r) => ({
    ...r,
    normalizedScore: (r[scoreField] - minScore) / range,
  }));
}
```

**Purpose**: Normalizes scores to 0-1 range for fair comparison between BM25 and semantic results.

**Normalization Formula**: `normalizedScore = (score - minScore) / (maxScore - minScore)`

---

### **Step 10: Result Fusion**

#### **Function: `fuseResults(bm25Results, semanticResults, semanticWeight, bm25Weight)`**

```javascript
fuseResults(bm25Results, semanticResults, semanticWeight = 0.7, bm25Weight = 0.3) {
  console.log(`🔄 Fusing results: ${bm25Results.length} BM25 + ${semanticResults.length} semantic`);

  // Normalize scores
  const normalizedBM25 = this.normalizeScores(bm25Results, "bm25Score");
  const normalizedSemantic = this.normalizeScores(semanticResults, "semanticScore");

  // Create a map to track combined results
  const combinedResults = new Map();

  // Add BM25 results
  normalizedBM25.forEach((result) => {
    const key = result.id || result.content.substring(0, 100);
    combinedResults.set(key, {
      ...result,
      bm25Score: result.normalizedScore,
      semanticScore: 0,
      finalScore: bm25Weight * result.normalizedScore,
    });
  });

  // Add/update with semantic results
  normalizedSemantic.forEach((result) => {
    const key = result.id || result.content.substring(0, 100);
    const existing = combinedResults.get(key);

    if (existing) {
      // Update existing result
      existing.semanticScore = result.normalizedScore;
      existing.finalScore = semanticWeight * result.normalizedScore + bm25Weight * existing.bm25Score;
    } else {
      // Add new result
      combinedResults.set(key, {
        ...result,
        bm25Score: 0,
        semanticScore: result.normalizedScore,
        finalScore: semanticWeight * result.normalizedScore,
      });
    }
  });

  // Convert to array and sort by final score
  const fusedResults = Array.from(combinedResults.values()).sort(
    (a, b) => b.finalScore - a.finalScore
  );

  console.log(`✅ Fused ${fusedResults.length} unique results`);
  return fusedResults;
}
```

**Purpose**: Combines BM25 and semantic results using weighted fusion.

**Fusion Formula**: `finalScore = α × semanticScore + (1-α) × bm25Score`

**Dynamic Weights:**

- **Error Codes**: 40% semantic + 60% BM25
- **General Questions**: 70% semantic + 30% BM25
- **Technical Concepts**: 70% semantic + 30% BM25
- **API Keys**: 40% semantic + 60% BM25

---

### **Step 11: Main Hybrid Search Orchestration**

#### **Function: `hybridSearch(query, topK)`**

```javascript
async hybridSearch(query, topK = 5) {
  if (!this.isInitialized) {
    await this.initialize();
  }

  console.log(`\n🔍 PostgreSQL Hybrid Search: "${query}"`);
  console.log("=".repeat(50));

  // Detect if query contains error codes
  const isErrorQuery = this.isErrorCode(query);
  const semanticWeight = isErrorQuery ? 0.4 : 0.7;
  const bm25Weight = isErrorQuery ? 0.6 : 0.3;

  console.log(`🎯 Query type: ${isErrorQuery ? "Error Code/Technical" : "General"}`);
  console.log(`⚖️ Weights: Semantic=${semanticWeight}, BM25=${bm25Weight}`);

  try {
    // Perform both searches in parallel
    const [bm25Results, semanticResults] = await Promise.all([
      this.searchBM25(query, topK * 2), // PostgreSQL BM25 search
      this.searchSemantic(query, topK * 2), // Pinecone semantic search
    ]);

    // Fuse results
    const fusedResults = this.fuseResults(
      bm25Results,
      semanticResults,
      semanticWeight,
      bm25Weight
    );

    // Return top results
    const topResults = fusedResults.slice(0, topK);

    // Log results
    console.log("\n📊 Top Results:");
    console.table(
      topResults.map((result, index) => ({
        Rank: index + 1,
        Source: result.source || result.metadata?.source || "Unknown",
        "Final Score": result.finalScore.toFixed(3),
        "BM25 Score": result.bm25Score.toFixed(3),
        "Semantic Score": result.semanticScore.toFixed(3),
        "Match Type": result.searchType || "fused",
      }))
    );

    return topResults;
  } catch (error) {
    console.error("❌ PostgreSQL hybrid search failed:", error.message);

    // Fallback to semantic search only
    console.log("🔄 Falling back to semantic search only...");
    return await this.searchSemantic(query, topK);
  }
}
```

**Purpose**: Orchestrates the complete hybrid search process.

**Key Features:**

- **Parallel Execution**: BM25 and semantic search run simultaneously
- **Dynamic Weighting**: Adjusts weights based on query type
- **Result Fusion**: Combines and ranks results intelligently
- **Fallback Mechanism**: Falls back to semantic search if hybrid fails

---

## 📊 Complete Workflow Example

### **Input Query**: `"card_declined"`

1. **Initialization**: System connects to PostgreSQL, retrieves database statistics
2. **Query Analysis**: `isErrorCode("card_declined")` returns `true`
3. **Weight Assignment**: `semanticWeight = 0.4`, `bm25Weight = 0.6`
4. **PostgreSQL BM25 Search**: Uses full-text search with `ts_rank`, finds 1 result
5. **Pinecone Semantic Search**: Generates embedding, queries Pinecone, returns 10 results
6. **Score Normalization**: Both result sets normalized to 0-1 range
7. **Fusion**: Combines results with 40% semantic + 60% BM25 weights
8. **Final Ranking**: Sorts by combined final score
9. **Output**: Returns top 5 results with detailed scoring breakdown

### **Expected Output**

```
🔍 Hybrid Search: "card_declined"
==================================================
🎯 Query type: Error Code/Technical
⚖️ Weights: Semantic=0.4, BM25=0.6
📊 BM25 found 1 results
📊 Semantic search found 10 results
🔄 Fusing results: 1 BM25 + 10 semantic
✅ Fused 10 unique results

📊 Top Results:
┌──────┬─────────────────────────┬─────────────┬─────────────┬─────────────┐
│ Rank │ Source                  │ Final Score │ BM25 Score  │Semantic Score│
├──────┼─────────────────────────┼─────────────┼─────────────┼─────────────┤
│    1 │ docs/errors/card_declined│       0.473 │       0.500 │       0.433 │
│    2 │ docs/errors/card_declined│       0.400 │       0.000 │       1.000 │
└──────┴─────────────────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🚀 Performance Characteristics

### **System Statistics**

- **Total Documents**: 256 documents loaded
- **Database Chunks**: 256 chunks stored in PostgreSQL
- **Categories**: 7 different categories
- **Sources**: 9 different sources
- **Initialization Time**: ~1-2 seconds
- **Search Time**: ~200-300ms for BM25 + semantic

### **Database Performance**

- **PostgreSQL Connection**: Connection pooling for efficiency
- **Full-text Search**: GIN indexes for fast text search
- **Query Response**: ~20-50ms for BM25 search
- **Memory Usage**: Optimized with database storage

### **Search Performance**

- **PostgreSQL BM25**: ~20-50ms response time
- **Pinecone Semantic**: ~50-100ms response time
- **Fusion Time**: ~50ms for result combination
- **Total Response**: ~200-300ms end-to-end

---

## 🔍 Integration Points

### **Chat System Integration**

```javascript
// In chat.js
const chunks = await retrieveChunksWithHybridSearch(
  query,
  vectorStore,
  embeddings
);
```

### **Fallback Mechanism**

```javascript
try {
  return await this.hybridSearch(query, topK);
} catch (error) {
  // Fallback to semantic search only
  return await this.searchSemantic(query, topK);
}
```

This comprehensive workflow ensures that the PostgreSQL-based hybrid search system provides optimal results by combining the strengths of both keyword and semantic search approaches while maintaining high performance and reliability.
