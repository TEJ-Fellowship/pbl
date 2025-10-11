# PostgreSQL Setup for Windows - BM25 Search Only

This document provides a complete guide for setting up PostgreSQL on Windows to handle BM25 (keyword) search for the Stripe Customer Support Agent, while keeping Pinecone for semantic search.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
- [Database Setup](#database-setup)
- [Node.js Integration](#nodejs-integration)
- [Code Implementation](#code-implementation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Performance Expectations](#performance-expectations)

## 🎯 Overview

This setup creates a hybrid search architecture where:

- **PostgreSQL**: Handles BM25 keyword search with full-text search capabilities
- **Pinecone**: Handles semantic/vector search (existing setup)
- **FlexSearch**: Provides backup in-memory search
- **Result Fusion**: Combines all search results with weighted scoring

## 📋 Prerequisites

- Windows 10/11
- Node.js (v16 or higher)
- Existing Stripe Customer Support Agent project
- PostgreSQL 13+ (recommended)

## 🚀 Installation Steps

### Step 1: Install PostgreSQL on Windows

1. **Download PostgreSQL**:

   - Go to https://www.postgresql.org/download/windows/
   - Download the latest version (PostgreSQL 15+ recommended)

2. **Run the Installer**:

   - Run the downloaded `.exe` file as Administrator
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` user
   - Choose the default port (5432)
   - Select components: PostgreSQL Server, pgAdmin 4, Stack Builder

3. **Verify Installation**:
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version

### Step 2: Install pgAdmin (Optional but Recommended)

- pgAdmin is included in the PostgreSQL installer
- It provides a GUI for database management
- Access it from Start Menu → pgAdmin 4

## 🗄️ Database Setup

### Step 1: Create Database and User

Open **Command Prompt** or **PowerShell** and run:

```bash
# Connect to PostgreSQL as postgres user
psql -U postgres

# Create database
CREATE DATABASE stripe_support_db;

# Create a dedicated user (optional but recommended)
CREATE USER stripe_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stripe_support_db TO stripe_user;

# Connect to the new database
\c stripe_support_db;

# Grant schema privileges
GRANT ALL ON SCHEMA public TO stripe_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stripe_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stripe_user;

# Exit psql
\q
```

### Step 2: Create Tables and Indexes

```bash
# Connect to the database
psql -U stripe_user -d stripe_support_db

# Create document chunks table (NO vector column needed)
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

-- Create indexes for efficient BM25 search
CREATE INDEX idx_document_chunks_content_gin ON document_chunks USING gin(to_tsvector('english', content));
CREATE INDEX idx_document_chunks_metadata_gin ON document_chunks USING gin(metadata);
CREATE INDEX idx_document_chunks_category ON document_chunks (category);
CREATE INDEX idx_document_chunks_source ON document_chunks (source);
CREATE INDEX idx_document_chunks_word_count ON document_chunks (word_count);

-- Create composite index for hybrid queries
CREATE INDEX idx_document_chunks_category_word_count ON document_chunks (category, word_count);

-- Create index for chunk_id lookups
CREATE INDEX idx_document_chunks_chunk_id ON document_chunks (chunk_id);

-- Exit psql
\q
```

## 💻 Node.js Integration

### Step 1: Install Dependencies

Add to your `package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.3"
  }
}
```

Install the dependency:

```bash
npm install pg
```

### Step 2: Environment Configuration

Add to your `.env` file:

```env
# PostgreSQL Configuration (BM25 Search Only)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stripe_support_db
DB_USER=stripe_user
DB_PASSWORD=your_secure_password
```

### Step 3: Database Connection

Create `src/config/database.js`:

```javascript
import pkg from "pg";
const { Pool } = pkg;
import config from "./config.js";

const pool = new Pool({
  user: config.DB_USER || "postgres",
  host: config.DB_HOST || "localhost",
  database: config.DB_NAME || "stripe_support_db",
  password: config.DB_PASSWORD,
  port: config.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

export default pool;
```

## 🔧 Code Implementation

### Step 1: PostgreSQL BM25 Service

Create `src/services/postgresBM25Service.js`:

```javascript
import pool from "../config/database.js";

class PostgreSQLBM25Service {
  constructor() {
    this.pool = pool;
  }

  /**
   * Insert document chunks into PostgreSQL for BM25 search
   */
  async insertChunks(chunks) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const insertPromises = chunks.map(async (chunk) => {
        const query = `
          INSERT INTO document_chunks 
          (chunk_id, content, metadata, title, category, source, word_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (chunk_id) DO UPDATE SET
          content = EXCLUDED.content,
          metadata = EXCLUDED.metadata,
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          source = EXCLUDED.source,
          word_count = EXCLUDED.word_count,
          updated_at = NOW()
        `;

        const values = [
          chunk.id,
          chunk.content,
          JSON.stringify(chunk.metadata),
          chunk.metadata?.title || "",
          chunk.metadata?.category || "documentation",
          chunk.metadata?.source || "",
          chunk.metadata?.wordCount || 0,
        ];

        return client.query(query, values);
      });

      await Promise.all(insertPromises);
      await client.query("COMMIT");

      console.log(
        `✅ Inserted ${chunks.length} chunks into PostgreSQL for BM25 search`
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Perform BM25 search using PostgreSQL full-text search
   */
  async searchBM25(query, topK = 10, filters = {}) {
    const client = await this.pool.connect();

    try {
      let whereClause =
        "to_tsvector('english', content) @@ plainto_tsquery('english', $1)";
      let queryParams = [query];
      let paramIndex = 2;

      // Add filters
      if (filters.category) {
        whereClause += ` AND category = $${paramIndex}`;
        queryParams.push(filters.category);
        paramIndex++;
      }

      if (filters.source) {
        whereClause += ` AND source = $${paramIndex}`;
        queryParams.push(filters.source);
        paramIndex++;
      }

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
        WHERE ${whereClause}
        ORDER BY bm25_score DESC 
        LIMIT $${paramIndex}
      `;

      queryParams.push(topK);

      const result = await client.query(query_sql, queryParams);

      return result.rows.map((row) => ({
        id: row.chunk_id,
        content: row.content,
        metadata: row.metadata,
        title: row.title,
        category: row.category,
        source: row.source,
        bm25Score: parseFloat(row.bm25_score),
        searchType: "postgres_bm25",
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get document statistics
   */
  async getStats() {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total_chunks,
          AVG(word_count) as avg_word_count,
          COUNT(DISTINCT category) as categories,
          COUNT(DISTINCT source) as sources
        FROM document_chunks
      `);

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    await this.pool.end();
  }
}

export default PostgreSQLBM25Service;
```

### Step 2: Enhanced Hybrid Search

Create `src/services/enhancedHybridSearch.js`:

```javascript
import FlexSearch from "flexsearch";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import PostgreSQLBM25Service from "./postgresBM25Service.js";
import config from "../config/config.js";

/**
 * Enhanced Hybrid Search: PostgreSQL BM25 + Pinecone Semantic + FlexSearch
 */
class EnhancedHybridSearch {
  constructor(vectorStore, embeddings, postgresBM25Service) {
    this.vectorStore = vectorStore; // Pinecone for semantic search
    this.embeddings = embeddings;
    this.postgresBM25Service = postgresBM25Service;
    this.flexSearchIndex = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the enhanced hybrid search system
   */
  async initialize() {
    try {
      console.log(
        "🔧 Initializing Enhanced Hybrid Search (PostgreSQL BM25 + Pinecone Semantic)..."
      );

      // Initialize FlexSearch for fast in-memory search (backup)
      this.flexSearchIndex = new FlexSearch.Document({
        tokenize: "forward",
        document: {
          id: "id",
          index: ["content", "title", "category"],
          store: ["content", "metadata", "source"],
        },
      });

      // Load documents from PostgreSQL into FlexSearch for backup
      await this.loadDocumentsIntoFlexSearch();

      this.isInitialized = true;
      console.log("✅ Enhanced Hybrid Search initialized");
    } catch (error) {
      console.error(
        "❌ Failed to initialize Enhanced Hybrid Search:",
        error.message
      );
      throw error;
    }
  }

  /**
   * Load documents from PostgreSQL into FlexSearch (backup)
   */
  async loadDocumentsIntoFlexSearch() {
    const client = await this.postgresBM25Service.pool.connect();

    try {
      const result = await client.query(`
        SELECT chunk_id, content, metadata, title, category, source
        FROM document_chunks
        ORDER BY created_at DESC
      `);

      console.log(
        `📚 Loading ${result.rows.length} documents into FlexSearch (backup)...`
      );

      result.rows.forEach((row) => {
        this.flexSearchIndex.add({
          id: row.chunk_id,
          content: row.content,
          title: row.title || "",
          category: row.category || "documentation",
          metadata: row.metadata,
          source: row.source || "",
        });
      });

      console.log(`✅ Loaded ${result.rows.length} documents into FlexSearch`);
    } finally {
      client.release();
    }
  }

  /**
   * Perform hybrid search with PostgreSQL BM25 + Pinecone Semantic
   */
  async hybridSearch(query, topK = 5, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`\n🔍 Enhanced Hybrid Search: "${query}"`);
    console.log("=".repeat(50));

    const isErrorQuery = this.isErrorCode(query);
    const semanticWeight = isErrorQuery ? 0.4 : 0.7;
    const bm25Weight = isErrorQuery ? 0.6 : 0.3;

    console.log(
      `🎯 Query type: ${isErrorQuery ? "Error Code/Technical" : "General"}`
    );
    console.log(`⚖️ Weights: Semantic=${semanticWeight}, BM25=${bm25Weight}`);

    try {
      // Strategy 1: PostgreSQL BM25 search
      const postgresBM25Results = await this.postgresBM25Service.searchBM25(
        query,
        topK * 2,
        options.filters || {}
      );

      // Strategy 2: Pinecone semantic search
      const pineconeResults = await this.searchPinecone(query, topK * 2);

      // Strategy 3: FlexSearch backup (if needed)
      let flexSearchResults = [];
      if (postgresBM25Results.length === 0) {
        console.log("🔄 Using FlexSearch backup...");
        flexSearchResults = await this.searchFlexSearch(query, topK * 2);
      }

      // Fuse results
      const fusedResults = this.fuseResults(
        postgresBM25Results,
        pineconeResults,
        flexSearchResults,
        semanticWeight,
        bm25Weight
      );

      const topResults = fusedResults.slice(0, topK);

      // Log results
      console.log("\n📊 Top Results:");
      console.table(
        topResults.map((result, index) => ({
          Rank: index + 1,
          Source: result.source || "Unknown",
          "Final Score": result.finalScore.toFixed(3),
          "BM25 Score": result.bm25Score.toFixed(3),
          "Semantic Score": result.semanticScore.toFixed(3),
          "Search Type": result.searchType || "fused",
        }))
      );

      return topResults;
    } catch (error) {
      console.error("❌ Enhanced hybrid search failed:", error.message);

      // Fallback to FlexSearch only
      console.log("🔄 Falling back to FlexSearch...");
      return await this.searchFlexSearch(query, topK);
    }
  }

  /**
   * Search using Pinecone semantic search
   */
  async searchPinecone(query, topK) {
    try {
      console.log(`🔍 Pinecone semantic search for: "${query}"`);

      const queryEmbedding = await this.embeddings.embedQuery(query);

      if (
        !queryEmbedding ||
        !Array.isArray(queryEmbedding) ||
        queryEmbedding.length === 0
      ) {
        throw new Error("Failed to generate query embedding");
      }

      const searchResponse = await this.vectorStore.index.query({
        vector: queryEmbedding,
        topK: topK,
        includeMetadata: true,
      });

      const results = searchResponse.matches.map((match) => ({
        id: match.id,
        content: match.metadata.content,
        metadata: match.metadata,
        source: match.metadata.source,
        semanticScore: match.score,
        searchType: "pinecone_semantic",
      }));

      console.log(`📊 Pinecone found ${results.length} results`);
      return results;
    } catch (error) {
      console.error("❌ Pinecone search failed:", error.message);
      return [];
    }
  }

  /**
   * Search using FlexSearch (backup)
   */
  async searchFlexSearch(query, topK) {
    try {
      console.log(`🔍 FlexSearch backup for: "${query}"`);

      const results = this.flexSearchIndex.search(query, {
        limit: topK,
        suggest: true,
      });

      const flexResults = results.map((result) => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        source: result.source,
        flexScore: 1.0,
        searchType: "flexsearch_backup",
      }));

      console.log(`📊 FlexSearch found ${flexResults.length} results`);
      return flexResults;
    } catch (error) {
      console.error("❌ FlexSearch failed:", error.message);
      return [];
    }
  }

  /**
   * Fuse results from PostgreSQL BM25 + Pinecone + FlexSearch
   */
  fuseResults(postgresBM25, pinecone, flexSearch, semanticWeight, bm25Weight) {
    console.log(
      `🔄 Fusing results: ${postgresBM25.length} PostgreSQL-BM25 + ${pinecone.length} Pinecone + ${flexSearch.length} FlexSearch`
    );

    const combinedResults = new Map();

    // Add PostgreSQL BM25 results
    postgresBM25.forEach((result) => {
      const key = result.id;
      combinedResults.set(key, {
        ...result,
        bm25Score: result.bm25Score || 0,
        semanticScore: 0,
        finalScore: bm25Weight * (result.bm25Score || 0),
      });
    });

    // Add Pinecone semantic results
    pinecone.forEach((result) => {
      const key = result.id;
      const existing = combinedResults.get(key);

      if (existing) {
        existing.semanticScore = result.semanticScore || 0;
        existing.finalScore =
          semanticWeight * (result.semanticScore || 0) +
          bm25Weight * existing.bm25Score;
      } else {
        combinedResults.set(key, {
          ...result,
          bm25Score: 0,
          semanticScore: result.semanticScore || 0,
          finalScore: semanticWeight * (result.semanticScore || 0),
        });
      }
    });

    // Add FlexSearch results (small boost)
    flexSearch.forEach((result) => {
      const key = result.id;
      const existing = combinedResults.get(key);

      if (existing) {
        existing.flexScore = result.flexScore || 0;
        existing.finalScore += 0.05 * (result.flexScore || 0); // Small boost
      } else {
        combinedResults.set(key, {
          ...result,
          bm25Score: 0,
          semanticScore: 0,
          flexScore: result.flexScore || 0,
          finalScore: 0.05 * (result.flexScore || 0),
        });
      }
    });

    const fusedResults = Array.from(combinedResults.values()).sort(
      (a, b) => b.finalScore - a.finalScore
    );

    console.log(`✅ Fused ${fusedResults.length} unique results`);
    return fusedResults;
  }

  /**
   * Detect error codes in query
   */
  isErrorCode(query) {
    const errorPatterns = [
      /card_declined|card_expired|insufficient_funds|invalid_cvc|processing_error/i,
      /err_\d+|error_\d+|api_error|validation_error/i,
      /\b(4\d{2}|5\d{2})\b/,
      /sk_(live|test)_[a-zA-Z0-9]+|pk_(live|test)_[a-zA-Z0-9]+/i,
      /whsec_[a-zA-Z0-9]+/i,
    ];

    return errorPatterns.some((pattern) => pattern.test(query));
  }
}

export default EnhancedHybridSearch;
```

### Step 3: Update Ingest Script

Modify your existing `src/ingest.js`:

```javascript
// Add this import at the top
import PostgreSQLBM25Service from "./services/postgresBM25Service.js";

// In your main function, after storing in Pinecone/local:
async function main() {
  // ... your existing code ...

  // Store chunks in PostgreSQL for BM25 search
  const postgresBM25Service = new PostgreSQLBM25Service();
  await postgresBM25Service.insertChunks(chunks);

  // ... rest of your code ...
}
```

### Step 4: Update Chat Integration

Modify `src/chat.js`:

```javascript
// Add these imports
import EnhancedHybridSearch from "./services/enhancedHybridSearch.js";
import PostgreSQLBM25Service from "./services/postgresBM25Service.js";

// In your chat function, replace the existing hybrid search:
const postgresBM25Service = new PostgreSQLBM25Service();
const enhancedHybridSearch = new EnhancedHybridSearch(
  vectorStore,
  embeddings,
  postgresBM25Service
);

// Use enhanced hybrid search
const chunks = await enhancedHybridSearch.hybridSearch(
  query,
  parseInt(config.MAX_CHUNKS) || 10
);
```

## 🧪 Testing

### Step 1: Test Database Connection

Create `src/tests/testPostgreSQL.js`:

```javascript
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";

async function testPostgreSQL() {
  const postgresService = new PostgreSQLBM25Service();

  try {
    // Test connection
    const stats = await postgresService.getStats();
    console.log("✅ PostgreSQL connection successful");
    console.log("📊 Database stats:", stats);

    // Test BM25 search
    const results = await postgresService.searchBM25("card declined", 5);
    console.log("✅ BM25 search test successful");
    console.log("📊 Search results:", results.length);
  } catch (error) {
    console.error("❌ PostgreSQL test failed:", error.message);
  } finally {
    await postgresService.close();
  }
}

testPostgreSQL();
```

Run the test:

```bash
npm run test:postgres
```

### Step 2: Test Hybrid Search

Create `src/tests/testEnhancedHybrid.js`:

```javascript
import EnhancedHybridSearch from "../services/enhancedHybridSearch.js";
import PostgreSQLBM25Service from "../services/postgresBM25Service.js";
// ... other imports

async function testEnhancedHybrid() {
  const postgresService = new PostgreSQLBM25Service();
  const enhancedHybrid = new EnhancedHybridSearch(
    vectorStore,
    embeddings,
    postgresService
  );

  try {
    const results = await enhancedHybrid.hybridSearch("card declined", 5);
    console.log("✅ Enhanced hybrid search test successful");
    console.log("📊 Results:", results.length);
  } catch (error) {
    console.error("❌ Enhanced hybrid test failed:", error.message);
  }
}

testEnhancedHybrid();
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**:

   ```bash
   # Check if PostgreSQL is running
   net start postgresql-x64-15

   # Or restart the service
   net stop postgresql-x64-15
   net start postgresql-x64-15
   ```

2. **Authentication Failed**:

   - Check username/password in `.env`
   - Verify user has proper permissions
   - Try connecting with `psql -U postgres -d stripe_support_db`

3. **Database Not Found**:

   ```sql
   -- List all databases
   \l

   -- Create if missing
   CREATE DATABASE stripe_support_db;
   ```

4. **Table Not Found**:

   ```sql
   -- Check if table exists
   \dt

   -- Create table if missing (run the CREATE TABLE script)
   ```

5. **Permission Denied**:
   ```sql
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE stripe_support_db TO stripe_user;
   GRANT ALL ON SCHEMA public TO stripe_user;
   ```

### Performance Issues

1. **Slow Queries**:

   - Check if indexes are created
   - Use `EXPLAIN ANALYZE` to analyze query performance
   - Consider increasing `work_mem` in PostgreSQL config

2. **Connection Pool Exhausted**:
   - Increase `max` in pool configuration
   - Check for connection leaks
   - Monitor active connections

## 📊 Performance Expectations

### Search Performance

| Search Type       | Expected Time | Notes                         |
| ----------------- | ------------- | ----------------------------- |
| PostgreSQL BM25   | 20-50ms       | Full-text search with ranking |
| Pinecone Semantic | 50-100ms      | Vector similarity search      |
| FlexSearch Backup | 5-10ms        | In-memory search              |
| Combined Hybrid   | 100-150ms     | All strategies + fusion       |

### Database Performance

| Operation             | Expected Time | Notes                          |
| --------------------- | ------------- | ------------------------------ |
| Insert 1000 chunks    | 2-5 seconds   | Batch insert with transactions |
| Update existing chunk | 50-100ms      | Single row update              |
| Delete chunk          | 20-50ms       | Single row delete              |
| Full-text search      | 20-50ms       | With proper indexes            |

### Memory Usage

- **PostgreSQL**: ~50-100MB base + data size
- **Node.js Pool**: ~10-20MB for 20 connections
- **FlexSearch**: ~5-10MB for 1000 documents

## 🎯 Benefits

1. **Cost-Effective**: PostgreSQL is free, only pay for hosting
2. **Scalable**: Can handle millions of documents
3. **Fast**: Optimized full-text search with proper indexing
4. **Reliable**: ACID compliance and data persistence
5. **Flexible**: Multiple search strategies with fallbacks
6. **Maintainable**: Clean separation of concerns

## 📝 Next Steps

1. **Monitor Performance**: Set up logging and monitoring
2. **Optimize Queries**: Use `EXPLAIN ANALYZE` for slow queries
3. **Backup Strategy**: Set up regular database backups
4. **Scaling**: Consider read replicas for high-traffic scenarios
5. **Security**: Implement proper user permissions and SSL

---

**Note**: This setup provides a robust, scalable solution for BM25 search while maintaining your existing Pinecone semantic search capabilities. The hybrid approach ensures optimal search results with multiple fallback strategies.
