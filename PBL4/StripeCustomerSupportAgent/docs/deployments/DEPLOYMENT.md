# 🚀 Deployment Guide

Complete guide for deploying the Stripe Customer Support Agent backend to Render with PostgreSQL.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Render PostgreSQL Setup](#render-postgresql-setup)
3. [Web Service Deployment](#web-service-deployment)
4. [Database Schema Setup](#database-schema-setup)
5. [Environment Variables](#environment-variables)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Render account ([render.com](https://render.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- API keys ready (Gemini, Pinecone, etc.)

## Render PostgreSQL Setup

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `stripe-support-db` (or your choice)
   - **Database**: `stripe_support_db` (or leave default)
   - **User**: Auto-generated (or customize)
   - **Region**: Choose closest to your deployment
   - **PostgreSQL Version**: Latest stable
   - **Plan**: Free (testing) or Starter+ (production)
4. Click **"Create Database"**
5. Wait 1-2 minutes for provisioning

### Step 2: Get Connection Details

- **Internal Database URL**: Automatically set when linked to web service
- **External Database URL**: For local testing (optional)
- Save these for reference

## Web Service Deployment

### Step 1: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your Git repository
3. Configure:
   - **Name**: `stripe-support-backend`
   - **Environment**: `Node`
   - **Region**: Same as database (for performance)
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `Backend` (if backend is in Backend folder)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 2: Link Database

1. In Web Service dashboard → **"Environment"** tab
2. Click **"Link Database"**
3. Select your PostgreSQL database
4. `DATABASE_URL` will be automatically set

### Step 3: Set Environment Variables

Add these in **"Environment"** tab:

```env
# Database (automatically set when linked)
# DATABASE_URL is set automatically by Render

# AI Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_2=your_second_gemini_api_key_here
GEMINI_API_KEY_3=your_third_gemini_api_key_here
GEMINI_API_MODEL=gemini-2.0-flash
GEMINI_API_MODEL_2=gemini-2.5-flash-lite
GEMINI_API_MODEL_3=gemini-2.5-flash

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=stripe-docs

# Server Configuration
PORT=5000
NODE_ENV=production

# Security & Authentication
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRATION=7d

# Frontend URLs
FRONTEND_URL=https://your-frontend.onrender.com
FRONTEND_URL_DEV=https://your-frontend.onrender.com

# Processing Configuration
CHUNK_SIZE=800
CHUNK_OVERLAP=100
MAX_CHUNKS=10
MAX_SOURCES=3
BATCH_SIZE=5

# Rate Limiting
RATE_LIMIT_DELAY=1000
EMBEDDING_DELAY=200

# MCP Integration (Optional)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_google_search_engine_id_here

# Stripe Configuration (If using)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy automatically
3. Monitor build logs for any issues

## Database Schema Setup

After deployment, initialize the database schema:

### Option 1: Via Render Shell (Recommended)

1. Go to Web Service dashboard
2. Click **"Shell"** tab
3. Run:

```bash
npm run setup:all
```

This creates all required tables:

- `raw_documents` - For storing scraped documents
- `document_chunks` - For storing chunks (BM25 search)
- `conversation_sessions` - For chat sessions
- `conversation_messages` - For chat messages
- `conversation_qa_pairs` - For Q&A pairs
- `conversation_summaries` - For conversation summaries
- `memory_retrieval_cache` - For memory cache

### Option 2: Manual SQL Execution

If you prefer to run SQL manually:

```bash
# Connect via Render Shell or external client
psql "your-database-url"

# Then run the SQL files from utils/ directory
\i utils/setup_conversation_memory.sql
```

## Environment Variables

### Database Configuration

The application supports two connection methods:

1. **DATABASE_URL** (Recommended for Render)

   - Automatically set when you link the database
   - Format: `postgresql://user:password@host:port/database`
   - SSL is automatically enabled for Render

2. **Individual Variables** (For local development)
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=stripe_support_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

**Priority**: `DATABASE_URL` takes precedence over individual variables.

## Verification

### Test Database Connection

```bash
# In Render Shell
npm run test:render-db
```

This will:

- ✅ Test database connection
- ✅ Verify SSL is enabled
- ✅ Check database permissions
- ✅ List existing tables
- ✅ Test read/write operations

### Test Setup Script

```bash
# Validate setup script (no database required)
npm run validate:setup

# Full test with database
npm run test:setup
```

### Check Health Endpoint

Visit: `https://your-service.onrender.com/api/health`

Should return:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

## Troubleshooting

### Database Connection Issues

**Problem**: `❌ PostgreSQL: Connection failed`

**Solutions**:

1. Verify `DATABASE_URL` is set in environment variables
2. Check if database is running (free tier may spin down)
3. Ensure database is linked to web service
4. Check SSL configuration (automatically handled)

**Problem**: `SSL connection required`

**Solution**: The code automatically enables SSL for Render. If you see this:

- Verify `DATABASE_URL` is set
- Check `NODE_ENV=production` is set
- Ensure you're using the latest `database.js` configuration

### Database Schema Not Created

**Problem**: Tables don't exist

**Solution**:

1. Connect via Render Shell
2. Run: `npm run setup:all`
3. Verify with: `npm run test:render-db`

### Build Failures

**Problem**: Build fails during deployment

**Solutions**:

1. Check `package.json` start script: `"start": "node index.js"`
2. Verify all dependencies in `package.json`
3. Check build logs for specific errors
4. Ensure Node.js version is compatible

### Environment Variables Not Working

**Problem**: Variables not being read

**Solutions**:

1. Variables must be set in Render dashboard (not just `.env`)
2. Restart service after adding variables
3. Check variable names match exactly (case-sensitive)
4. Verify no typos in variable names

### Free Tier Limitations

- **Database**: Spins down after 90 days of inactivity
- **Web Service**: Spins down after 15 minutes of inactivity
- **Hours**: Limited to 750 hours/month
- **Backups**: No automatic backups on free tier

**Recommendations**:

- Use Starter+ plan for production
- Set up manual backups for important data
- Monitor usage to avoid unexpected charges

## Post-Deployment

### Initial Data Setup

After deployment and schema setup:

```bash
# Scrape Stripe documentation (optional, can be done later)
npm run scrape

# Ingest documents into database and Pinecone
npm run ingest
```

### Monitoring

- Check Render logs regularly
- Monitor database connection pool
- Watch for error rates
- Set up alerts for critical issues

### Updates

1. **Code Changes**: Push to Git, Render auto-deploys
2. **Environment Variables**: Update in dashboard, service restarts
3. **Database Schema**: Run migrations via Shell

## Quick Reference

### Essential Commands

```bash
# Setup database schema
npm run setup:all

# Test database connection
npm run test:render-db

# Validate setup script
npm run validate:setup

# Check database
npm run check:db
```

### Important Files

- `config/database.js` - Database connection configuration
- `config/config.js` - Application configuration
- `utils/setup_all_schemas.js` - Database schema setup script
- `env.example` - Environment variables template

### Support Resources

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Node.js on Render](https://render.com/docs/node)

---

**Last Updated**: 2024
**Version**: 1.0
