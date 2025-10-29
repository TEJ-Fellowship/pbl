# PostgreSQL Setup Guide

This guide explains how to set up PostgreSQL database storage for scraped Twilio documentation.

## Prerequisites

1. **PostgreSQL Installation**: Make sure PostgreSQL is installed on your system
   - macOS: `brew install postgresql@14` or download from [postgresql.org](https://www.postgresql.org/download/)
   - Linux: `sudo apt-get install postgresql` or `sudo yum install postgresql`
   - Windows: Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **PostgreSQL Running**: Ensure PostgreSQL service is running
   - macOS: `brew services start postgresql@14`
   - Linux: `sudo systemctl start postgresql`
   - Windows: Check Services panel

## Database Setup

### Option 1: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE twilio_support;

# Create user (optional, or use default postgres user)
CREATE USER twilio_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE twilio_support TO twilio_user;

# Exit psql
\q
```

### Option 2: Using Createdb Command

```bash
createdb -U postgres twilio_support
```

## Environment Variables

Add the following to your `.env` file in the `Backend/` directory:

```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=twilio_support
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
POSTGRES_SSL=false
```

For remote databases or cloud providers (Heroku, AWS RDS, etc.):

```env
# Example for remote PostgreSQL
POSTGRES_HOST=your-db-host.region.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=twilio_support
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_SSL=true
```

## Schema Initialization

The database schema is automatically initialized when you run the scraper. However, you can manually initialize it:

```bash
# The schema is auto-created when running the scraper
npm run scrape

# Or test the database connection separately
node -e "import('./src/database.js').then(async (db) => { await db.testConnection(); await db.initializeSchema(); await db.closePool(); })"
```

## Database Schema

The `scraped_docs` table includes:

- `id` (VARCHAR): Unique document identifier
- `url` (TEXT): Source URL
- `category` (VARCHAR): Document category
- `title` (TEXT): Document title
- `content` (TEXT): Full document content
- `word_count` (INTEGER): Word count
- `scraped_at` (TIMESTAMP): When the document was scraped
- `doc_type` (VARCHAR): Type of document (default: 'api')
- `code_blocks` (JSONB): Array of code blocks extracted
- `metadata` (JSONB): Additional metadata
- `created_at` (TIMESTAMP): Record creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes**:
- `idx_scraped_docs_category` on category
- `idx_scraped_docs_scraped_at` on scraped_at
- `idx_scraped_docs_url` on url
- `idx_scraped_docs_content_search` (GIN) for full-text search on content
- `idx_scraped_docs_title_search` (GIN) for full-text search on title

## Running the Scraper

### Save to Both Database and JSON (Default)

```bash
npm run scrape
```

### Save Only to Database

```bash
npm run scrape -- --skip-json
```

### Save Only to JSON

```bash
npm run scrape -- --skip-db
```

## Verification

### Check if Data is Saved

You can verify data is stored using psql:

```bash
psql -U postgres -d twilio_support

# Count documents
SELECT COUNT(*) FROM scraped_docs;

# View all documents
SELECT id, category, title, word_count, scraped_at FROM scraped_docs;

# View by category
SELECT category, COUNT(*) as count FROM scraped_docs GROUP BY category;

# Full-text search
SELECT title, category FROM scraped_docs 
WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'webhook');

# Exit
\q
```

### Using the Database Utility

You can also use the database utility functions programmatically:

```javascript
import {
  getAllScrapedDocs,
  getScrapedDocsByCategory,
  searchScrapedDocs,
  getStats,
} from "./src/database.js";

// Get all documents
const allDocs = await getAllScrapedDocs();

// Get documents by category
const apiDocs = await getScrapedDocsByCategory('api');

// Search documents
const searchResults = await searchScrapedDocs('webhook', 10);

// Get statistics
const stats = await getStats();
console.log(stats);
```

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Make sure PostgreSQL is running:
- macOS: `brew services start postgresql@14`
- Linux: `sudo systemctl start postgresql`
- Check status: `psql -U postgres -c "SELECT version();"`

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Solution**: 
1. Check your `.env` file has the correct password
2. Reset PostgreSQL password: `psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"`

### Database Does Not Exist

```
Error: database "twilio_support" does not exist
```

**Solution**: Create the database:
```bash
createdb -U postgres twilio_support
```

### Permission Denied

```
Error: permission denied to create database
```

**Solution**: Use a superuser account or grant permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE twilio_support TO your_user;
```

## Migration from JSON

If you have existing JSON files and want to migrate to PostgreSQL:

```javascript
import fs from "fs/promises";
import { saveScrapedDocs } from "./src/database.js";
import { testConnection, initializeSchema } from "./src/database.js";

async function migrateJsonToDb() {
  // Connect to database
  await testConnection();
  await initializeSchema();

  // Load JSON file
  const jsonData = await fs.readFile("data/twilio_docs/scraped.json", "utf-8");
  const docs = JSON.parse(jsonData);

  // Save to database
  const savedIds = await saveScrapedDocs(docs);
  console.log(`Migrated ${savedIds.length} documents to PostgreSQL`);
}

migrateJsonToDb().catch(console.error);
```

## Performance Tips

1. **Connection Pooling**: The database module uses connection pooling (max 20 connections)
2. **Indexes**: Full-text search indexes are automatically created for fast searches
3. **Batch Operations**: Use `saveScrapedDocs()` for batch inserts instead of individual saves
4. **SSL**: Enable SSL for remote databases to avoid connection issues

## Next Steps

After setting up PostgreSQL:

1. Run the scraper: `npm run scrape`
2. Verify data: Check database with psql or utility functions
3. Continue with chunking: `npm run chunk`
4. Create embeddings: `npm run ingest`
5. Start chat interface: `npm run chat`

