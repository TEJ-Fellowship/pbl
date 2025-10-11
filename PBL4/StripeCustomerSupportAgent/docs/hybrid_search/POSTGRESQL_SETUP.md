# PostgreSQL BM25 Search Setup Guide

This guide explains how to set up PostgreSQL for BM25 search in the Stripe Customer Support Agent, replacing FlexSearch with a more scalable database solution.

## 🎯 Overview

The system now uses:

- **PostgreSQL**: For BM25 keyword search with full-text search capabilities
- **Pinecone**: For semantic/vector search (existing setup)
- **Hybrid Fusion**: Combines both search results with weighted scoring

## 📋 Prerequisites

- Windows 10/11
- Node.js (v16 or higher)
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

### Step 2: Create Database and Tables

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

### Step 3: Create Tables and Indexes

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

The PostgreSQL dependency has been added to `package.json`:

```json
{
  "dependencies": {
    "pg": "^8.11.3"
  }
}
```

Install the dependency:

```bash
npm install
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

## 🔧 Code Implementation

### Files Created/Modified

1. **`src/config/database.js`** - PostgreSQL connection configuration
2. **`src/services/postgresBM25Service.js`** - PostgreSQL BM25 service
3. **`src/hybridSearch.js`** - Updated to use PostgreSQL instead of FlexSearch
4. **`src/chat.js`** - Updated to use PostgreSQL-based hybrid search
5. **`src/ingest.js`** - Updated to store documents in PostgreSQL
6. **`package.json`** - Removed FlexSearch, added PostgreSQL dependency

### Key Changes

- **Removed FlexSearch dependency** - No more in-memory search
- **Added PostgreSQL BM25 service** - Handles document storage and search
- **Updated hybrid search** - Now uses PostgreSQL for BM25 + Pinecone for semantic
- **Enhanced ingest process** - Stores documents in both Pinecone and PostgreSQL

## 🧪 Testing

### Test PostgreSQL Connection

```bash
npm run test:postgres
```

This will:

- Test database connection
- Display database statistics
- Test BM25 search functionality
- Show sample search results

### Test Full System

```bash
npm run test:hybrid
```

This will test the complete hybrid search system.

## 🚀 Usage

### 1. Ingest Documents

```bash
npm run ingest
```

This will:

- Process documents into chunks
- Store in Pinecone (for semantic search)
- Store in PostgreSQL (for BM25 search)
- Create local vector store (fallback)

### 2. Start Chat Interface

```bash
npm run chat
```

The chat interface now uses:

- **PostgreSQL BM25 search** for keyword matching
- **Pinecone semantic search** for conceptual understanding
- **Hybrid fusion** for optimal results

## 📊 Performance Benefits

### Before (FlexSearch)

- ❌ In-memory only (limited scalability)
- ❌ No persistence (lost on restart)
- ❌ Memory intensive for large datasets
- ❌ No advanced query capabilities

### After (PostgreSQL)

- ✅ Persistent storage (survives restarts)
- ✅ Scalable to millions of documents
- ✅ Advanced full-text search with ranking
- ✅ Optimized indexes for fast queries
- ✅ ACID compliance and data integrity

## 🔍 Search Capabilities

### PostgreSQL BM25 Features

- **Full-text search** with PostgreSQL's `ts_rank`
- **Metadata filtering** by category, source, etc.
- **Fuzzy matching** and phrase search
- **Ranking algorithms** for relevance scoring
- **Index optimization** for fast queries

### Hybrid Search Benefits

- **Keyword precision** (PostgreSQL BM25)
- **Semantic understanding** (Pinecone)
- **Weighted fusion** based on query type
- **Fallback mechanisms** for reliability

## 🛠️ Troubleshooting

### Common Issues

1. **Connection Refused**:

   ```bash
   # Check if PostgreSQL is running
   net start postgresql-x64-15
   ```

2. **Authentication Failed**:

   - Check username/password in `.env`
   - Verify user has proper permissions

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

### Performance Issues

1. **Slow Queries**:

   - Check if indexes are created
   - Use `EXPLAIN ANALYZE` to analyze query performance

2. **Connection Pool Exhausted**:
   - Increase `max` in pool configuration
   - Check for connection leaks

## 📈 Expected Performance

| Operation          | Expected Time | Notes                          |
| ------------------ | ------------- | ------------------------------ |
| PostgreSQL BM25    | 20-50ms       | Full-text search with ranking  |
| Pinecone Semantic  | 50-100ms      | Vector similarity search       |
| Combined Hybrid    | 100-150ms     | Both searches + fusion         |
| Insert 1000 chunks | 2-5 seconds   | Batch insert with transactions |

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
