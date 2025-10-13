# 📚 Scalable Document Storage Guide

This document explains how to scale document storage beyond JSON files for large-scale document processing and retrieval systems.

## 🚨 **Current Issues with JSON Storage**

### **Problems with `scraped.json`**

- ❌ **Memory Limitations**: Large files consume excessive RAM
- ❌ **File Size**: Single files become unwieldy (GB+ files)
- ❌ **Loading Time**: Slow to read entire file for processing
- ❌ **Concurrency**: Can't process multiple documents simultaneously
- ❌ **Backup/Recovery**: Difficult to backup and restore partial data
- ❌ **Incremental Processing**: Must reprocess entire file for new documents

## 🎯 **Recommended Solutions**

### **Option 1: PostgreSQL Document Storage (Recommended)**

Store raw scraped documents in PostgreSQL before processing into chunks.

#### **Database Schema**

```sql
-- Create raw documents table
CREATE TABLE raw_documents (
    id VARCHAR(255) PRIMARY KEY,
    url TEXT NOT NULL,
    category VARCHAR(100),
    title TEXT,
    content TEXT NOT NULL,
    word_count INTEGER,
    scraped_at TIMESTAMP DEFAULT NOW(),
    doc_type VARCHAR(50),
    metadata JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_raw_documents_category ON raw_documents (category);
CREATE INDEX idx_raw_documents_processed ON raw_documents (processed);
CREATE INDEX idx_raw_documents_content_gin ON raw_documents USING gin(to_tsvector('english', content));
```

#### **Benefits**

- ✅ **Scalable**: Handle millions of documents
- ✅ **Queryable**: Filter by category, date, processed status
- ✅ **Incremental**: Process documents in batches
- ✅ **Reliable**: ACID compliance and data integrity
- ✅ **Concurrent**: Multiple processes can work simultaneously

### **Option 2: File-Based Storage with Chunking**

Organize documents in separate files by category/date:

```
data/
├── raw_documents/
│   ├── 2024-01-15/
│   │   ├── api_001.json
│   │   ├── api_002.json
│   │   └── webhooks_001.json
│   ├── 2024-01-16/
│   │   └── ...
│   └── metadata.json
```

### **Option 3: Hybrid Approach**

Combine PostgreSQL for metadata and file storage for content:

```sql
CREATE TABLE document_metadata (
    id VARCHAR(255) PRIMARY KEY,
    url TEXT NOT NULL,
    category VARCHAR(100),
    title TEXT,
    file_path TEXT NOT NULL,
    word_count INTEGER,
    scraped_at TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);
```

## 🚀 **Implementation: PostgreSQL Document Storage**

### **1. Direct PostgreSQL Storage**

The scraper now stores documents directly in PostgreSQL during scraping:

```javascript
// Current scraper implementation
async function main() {
  const docs = [];

  // Scrape documents
  for (const category of sourcesToScrape) {
    const doc = await scrapeDoc(SOURCES[category], category);
    if (doc) {
      docs.push(doc);
    }
  }

  // Store directly in PostgreSQL
  const documentStorageService = new DocumentStorageService();
  await documentStorageService.storeDocuments(docs);
}
```

### **2. Document Storage Service**

```javascript
class DocumentStorageService {
  // Store scraped documents directly
  async storeDocuments(documents) {
    // Batch insert with conflict resolution
  }

  // Get unprocessed documents for processing
  async getUnprocessedDocuments(limit = 100, category = null) {
    // Query unprocessed documents (newest first)
  }

  // Mark documents as processed
  async markAsProcessed(documentIds) {
    // Update processed status
  }

  // Get document statistics
  async getStats() {
    // Return processing statistics
  }
}
```

### **3. Updated Ingestion Process**

```javascript
// Current approach (scalable)
const documents = await loadDocumentsFromDB(100); // Process 100 documents at a time
const chunks = await processDocuments(documents);
await storeChunks(chunks, embeddings, pinecone); // Store in Pinecone
await postgresBM25Service.insertChunks(chunks); // Store in PostgreSQL for BM25
```

### **4. Batch Processing**

```javascript
async function processDocumentsInBatches() {
  const batchSize = 100;
  let processedCount = 0;

  while (true) {
    const documents = await loadDocumentsFromDB(batchSize);
    if (documents.length === 0) break;

    // Process batch
    const chunks = await processDocuments(documents);

    // Store in both Pinecone and PostgreSQL
    await storeChunks(chunks, embeddings, pinecone); // Semantic search
    await postgresBM25Service.insertChunks(chunks); // BM25 search

    // Mark as processed
    const documentIds = documents.map((doc) => doc.metadata.id);
    await markAsProcessed(documentIds);

    processedCount += documents.length;
    console.log(`Processed ${processedCount} documents so far...`);
  }
}
```

## 📊 **Performance Comparison**

| Aspect                  | JSON Storage                 | PostgreSQL Storage            |
| ----------------------- | ---------------------------- | ----------------------------- |
| **Memory Usage**        | ❌ High (entire file in RAM) | ✅ Low (query-specific data)  |
| **Processing Speed**    | ❌ Slow (sequential)         | ✅ Fast (parallel batches)    |
| **Scalability**         | ❌ Limited by file size      | ✅ Scales to millions         |
| **Incremental Updates** | ❌ Reprocess entire file     | ✅ Process only new documents |
| **Concurrency**         | ❌ Single-threaded           | ✅ Multi-threaded             |
| **Backup/Recovery**     | ❌ All-or-nothing            | ✅ Granular control           |

## 🔧 **Migration Steps**

### **Step 1: Setup Database**

```bash
# Create raw documents table
psql -U postgres -d stripe_support_db -f setup_raw_documents.sql
```

### **Step 2: Migrate Existing Data**

```bash
# Run migration script
npm run migrate:postgres
```

### **Step 3: Update Ingestion Process**

```javascript
// In ingest.js - Switch to PostgreSQL approach
// const documents = await loadDocuments(); // Old approach
const documents = await loadDocumentsFromDB(100); // New approach
```

### **Step 4: Test and Verify**

```bash
# Test PostgreSQL connection
npm run test:postgres

# Test document storage
npm run test:documents
```

## 🎯 **Current Features**

### **✅ Improved Title Extraction**

The scraper now uses multiple fallback strategies for title extraction:

```javascript
// Multiple title extraction methods
if ($("h1").length > 0) {
  title = $("h1").first().text().trim();
} else if ($("title").length > 0) {
  title = $("title").text().trim();
} else if ($("h2").length > 0) {
  title = $("h2").first().text().trim();
} else if ($(".page-title").length > 0) {
  title = $(".page-title").first().text().trim();
} else if ($("[data-testid='page-title']").length > 0) {
  title = $("[data-testid='page-title']").first().text().trim();
}

// Clean up title and use fallback
title = title
  .replace(/\s+/g, " ")
  .replace(/^\s*-\s*Stripe\s*$/, "")
  .replace(/^\s*Stripe\s*-\s*/, "")
  .trim();

// Category-based fallback titles
if (!title || title.length === 0) {
  const categoryTitles = {
    api: "API Reference",
    webhooks: "Webhooks",
    errors: "Error Codes",
    payments: "Payment Methods",
    billing: "Billing",
    disputes: "Disputes",
    integration: "Integration Guide",
    support: "Support",
    connect: "Connect",
  };
  title = categoryTitles[category] || "Documentation";
}
```

### **✅ Direct PostgreSQL Storage**

Documents are now stored directly in PostgreSQL during scraping:

```javascript
// Store documents in PostgreSQL
const documentStorageService = new DocumentStorageService();
await documentStorageService.storeDocuments(docs);
```

### **✅ JSON Fallback (Emergency Only)**

If PostgreSQL storage fails, documents are saved to JSON as backup:

```javascript
// Fallback: Save to JSON file as backup
const outputDir = path.join(process.cwd(), "data", "stripe_docs");
await fs.mkdir(outputDir, { recursive: true });
const outputFile = path.join(outputDir, "scraped.json");
await fs.writeFile(outputFile, JSON.stringify(docs, null, 2));
```

## 🎯 **Usage Examples**

### **Scrape and Store Documents Directly**

```javascript
// The scraper now stores documents directly in PostgreSQL
npm run scrape

// Or with specific sources
npm run scrape --sources=api,webhooks --limit=5

// Check latest scraped documents (built into scraper)
npm run test:documents
```

### **Process Documents in Batches**

```javascript
import { loadDocumentsFromDB } from "./ingest.js";

// Process 100 documents at a time
const documents = await loadDocumentsFromDB(100, "api");
const chunks = await processDocuments(documents);
```

### **Monitor Processing Status**

```javascript
import DocumentStorageService from "./services/documentStorageService.js";

const service = new DocumentStorageService();
const stats = await service.getStats();

console.log(`Total documents: ${stats.total_documents}`);
console.log(`Processed: ${stats.processed_documents}`);
console.log(`Unprocessed: ${stats.unprocessed_documents}`);
```

## 📈 **Scaling Benefits**

### **Memory Efficiency**

- **Before**: Load entire JSON file (100MB+ in RAM)
- **After**: Load only needed documents (1-10MB per batch)

### **Processing Speed**

- **Before**: Sequential processing of entire file
- **After**: Parallel processing of document batches

### **Storage Efficiency**

- **Before**: Single large file, difficult to manage
- **After**: Database with indexes, easy to query and manage

### **Reliability**

- **Before**: File corruption affects entire dataset
- **After**: ACID compliance, partial failures don't affect other documents

## 🛠️ **Best Practices**

### **1. Batch Size Optimization**

```javascript
// Start with small batches for testing
const batchSize = 50;

// Increase for production
const batchSize = 200;
```

### **2. Error Handling**

```javascript
try {
  const documents = await loadDocumentsFromDB(batchSize);
  // Process documents
} catch (error) {
  console.error("Batch processing failed:", error);
  // Implement retry logic
}
```

### **3. Monitoring**

```javascript
// Track processing progress
const stats = await documentStorageService.getStats();
console.log(`Progress: ${stats.processed_documents}/${stats.total_documents}`);
```

### **4. Cleanup**

```javascript
// Clean up old processed documents
await documentStorageService.cleanupOldDocuments(30); // 30 days
```

## 🧹 **Code Cleanup Summary**

### **✅ Removed Redundant Code**

The following functions and code have been removed as they are no longer needed:

- ❌ **`storeChunksLocally()` function** - No longer needed with PostgreSQL storage
- ❌ **Local JSON file storage** - Replaced with PostgreSQL database storage
- ❌ **`searchChunks()` function** - No longer needed with PostgreSQL BM25 search
- ❌ **Local vector store fallback** - Removed fallback to `vector_store.json`
- ❌ **`VECTOR_STORE_PATH` constant** - Unused after removing local storage
- ❌ **`storeScrapedDocuments()` function** - Scraper now stores directly

### **✅ Current Clean Architecture**

```
Documents → PostgreSQL (raw_documents) → Batch Processing → Pinecone + PostgreSQL
                ↓                              ↓
            Title Extraction              Chunk Processing
                ↓                              ↓
            Proper Titles              BM25 + Semantic Search
```

## 🎉 **Summary**

The PostgreSQL-based document storage approach provides:

- **✅ Scalability**: Handle millions of documents efficiently
- **✅ Performance**: Fast batch processing with parallel execution
- **✅ Reliability**: ACID compliance and data integrity
- **✅ Flexibility**: Query and filter documents as needed
- **✅ Maintainability**: Easy to monitor and manage processing status
- **✅ Clean Code**: No redundant functions or fallbacks
- **✅ Proper Titles**: Multiple fallback strategies for title extraction
- **✅ Direct Storage**: Documents stored in PostgreSQL during scraping

This approach transforms your document processing from a memory-intensive, single-threaded operation into a scalable, efficient system that can handle enterprise-level document volumes with clean, maintainable code.
