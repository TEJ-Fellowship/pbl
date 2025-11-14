# 🔄 Auto-Setup on Startup

## Overview

The application now automatically sets up the database schema when it starts if tables don't exist. This eliminates the need for manual setup via Render Shell (which isn't available on the free tier).

## How It Works

When the server starts, the `initializeConnections()` function:

1. **Connects to PostgreSQL**
2. **Checks if all 7 required tables exist**:
   - `raw_documents`
   - `document_chunks`
   - `conversation_sessions`
   - `conversation_messages`
   - `conversation_qa_pairs`
   - `conversation_summaries`
   - `memory_retrieval_cache`

3. **If tables are missing** (< 7 found):
   - Automatically runs `setupAllSchemas()`
   - Creates all missing tables and indexes
   - Logs the setup progress

4. **If all tables exist**:
   - Skips setup
   - Continues with normal startup

## Benefits

✅ **No Manual Setup Required** - Works automatically on first deployment  
✅ **Idempotent** - Safe to run multiple times (uses `CREATE TABLE IF NOT EXISTS`)  
✅ **Works on Free Tier** - No need for Render Shell access  
✅ **Non-Blocking** - If setup fails, app continues (tables might partially exist)  
✅ **Fast** - Only runs if tables are missing  

## Logs

When auto-setup runs, you'll see:

```
🗄️ Testing PostgreSQL connection...
   ⚠️  Only 0/7 tables found. Setting up database schema...
🚀 Setting up complete database schema...
============================================================
📄 Step 1: Creating raw_documents table...
   ✅ raw_documents table created successfully
📦 Step 2: Creating document_chunks table...
   ✅ document_chunks table created successfully
💬 Step 3: Creating conversation memory tables...
   ✅ Conversation memory tables created successfully
   ✅ Database schema setup completed!
   ✅ PostgreSQL: Connected successfully
```

If tables already exist:

```
🗄️ Testing PostgreSQL connection...
   ✅ PostgreSQL: All tables exist
   ✅ PostgreSQL: Connected successfully
```

## Manual Override

If you need to manually run setup (e.g., to reset tables), you can still use:

```bash
npm run setup:all
```

## Troubleshooting

### Setup Fails on Startup

If you see setup errors in logs:
- Check database connection
- Verify database permissions
- Check Render logs for detailed error messages
- The app will continue running even if setup fails

### Tables Partially Created

If setup is interrupted:
- The app will detect missing tables on next restart
- It will attempt to create only the missing tables
- All operations use `IF NOT EXISTS`, so it's safe

## Configuration

No additional configuration needed! The auto-setup:
- Uses the same database connection as the app
- Respects all environment variables
- Works in both development and production

---

**Status**: ✅ Active  
**Last Updated**: 2024

