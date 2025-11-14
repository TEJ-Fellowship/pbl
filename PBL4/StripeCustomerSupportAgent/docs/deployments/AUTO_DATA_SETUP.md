# 🔄 Auto Data Setup

## Overview

The application now automatically handles scraping, chunking, and ingestion on startup. This eliminates the need for manual setup via Render Shell (which isn't available on the free tier).

## How It Works

When the server starts, after database schema setup, the system:

1. **Checks if documents have been scraped**
   - Queries `raw_documents` table
   - If empty, starts auto-scraping in background

2. **Checks if there are unprocessed documents**
   - Queries for documents where `processed = false`
   - If found, starts auto-ingestion in background

3. **Checks if chunks exist**
   - Queries `document_chunks` table
   - If empty but documents exist, triggers ingestion

## Features

✅ **Automatic Scraping** - Scrapes Stripe docs if database is empty  
✅ **Automatic Ingestion** - Processes unprocessed documents  
✅ **Non-Blocking** - Runs in background, doesn't delay server startup  
✅ **Idempotent** - Safe to run multiple times  
✅ **Configurable** - Can be disabled via environment variables  

## Configuration

### Environment Variables

```env
# Auto-setup control (enabled by default in production)
AUTO_DATA_SETUP=true          # Enable/disable all auto-setup (default: true in production)
AUTO_SCRAPE=true              # Enable/disable auto-scraping (default: true)
AUTO_INGEST=true              # Enable/disable auto-ingestion (default: true)
```

### Disable Auto-Setup

To disable auto-setup completely:
```env
AUTO_DATA_SETUP=false
```

To disable only scraping:
```env
AUTO_SCRAPE=false
```

To disable only ingestion:
```env
AUTO_INGEST=false
```

## Process Flow

### First Deployment (Empty Database)

1. **Database Setup** ✅
   - Tables created automatically

2. **Scraping** 🔄 (Background)
   - Detects empty database
   - Scrapes first 3 sources (api, webhooks, errors)
   - Stores in `raw_documents` table

3. **Ingestion** 🔄 (Background, after scraping)
   - Detects unprocessed documents
   - Chunks documents
   - Stores in Pinecone and PostgreSQL
   - Marks documents as processed

### Subsequent Starts

1. **Database Setup** ✅
   - Tables already exist, skipped

2. **Scraping** ⏭️
   - Documents exist, skipped

3. **Ingestion** 🔄 (If needed)
   - Only runs if unprocessed documents found
   - Processes up to 50 documents per run

## Logs

### First Deployment

```
📊 Checking data setup status...
   ⚠️  No documents found in database
   🔄 Starting auto-scraping...
   📡 Scraping 3 sources...
   ✅ Scraped api: 1234 words
   ✅ Scraped webhooks: 567 words
   ✅ Scraped errors: 890 words
   ✅ Stored 3 documents in database
   🔄 Starting auto-ingestion in background...
   📊 Processing 3 documents...
   🗄️  Storing chunks in Pinecone...
   ✅ Pinecone storage completed
   🗄️  Storing chunks in PostgreSQL...
   ✅ PostgreSQL storage completed
   ✅ Marked 3 documents as processed
   🎉 Ingestion completed: 45 chunks processed
```

### Subsequent Starts

```
📊 Checking data setup status...
   ✅ Documents found in database
   ✅ Data setup complete (documents scraped and chunks created)
```

## Limitations

### Scraping
- **Initial Setup**: Only scrapes first 3 sources (to avoid long startup times)
- **Rate Limiting**: 1 request per second (configurable)
- **Background Process**: Runs asynchronously, doesn't block server

### Ingestion
- **Batch Size**: Processes up to 50 documents per run
- **Background Process**: Runs asynchronously
- **Pinecone**: May fail if API key is invalid (continues with PostgreSQL)

## Manual Override

You can still run scraping and ingestion manually:

```bash
# Scrape all sources
npm run scrape

# Ingest all unprocessed documents
npm run ingest

# Full setup
npm run setup
```

## Troubleshooting

### Scraping Fails

**Problem**: Auto-scraping doesn't start or fails

**Solutions**:
- Check `AUTO_SCRAPE` environment variable
- Verify network connectivity
- Check rate limiting settings
- Review logs for specific errors

### Ingestion Fails

**Problem**: Auto-ingestion doesn't start or fails

**Solutions**:
- Check `AUTO_INGEST` environment variable
- Verify Gemini API key is set
- Check Pinecone API key (optional, continues without it)
- Verify PostgreSQL connection
- Review logs for specific errors

### Slow Startup

**Problem**: Server takes long to start

**Solutions**:
- Auto-setup runs in background, shouldn't block startup
- If slow, check database connection
- Consider disabling auto-scraping: `AUTO_SCRAPE=false`
- Run scraping manually after deployment

## Best Practices

1. **First Deployment**: Let auto-setup run (may take a few minutes)
2. **Subsequent Deployments**: Auto-setup only runs if needed
3. **Production**: Monitor logs to ensure setup completes
4. **Manual Control**: Use environment variables to control behavior

## Status

✅ **Active** - Auto-setup runs automatically on startup  
✅ **Production Ready** - Tested and working  
✅ **Configurable** - Can be disabled if needed  

---

**Last Updated**: 2024  
**Version**: 1.0

