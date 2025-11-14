# 🚀 Deployment Guide

Complete guide for deploying the Stripe Customer Support Agent (Backend + Frontend) to Render with PostgreSQL.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Render PostgreSQL Setup](#render-postgresql-setup)
3. [Backend Web Service Deployment](#backend-web-service-deployment)
4. [Frontend Static Site Deployment](#frontend-static-site-deployment)
5. [Database Schema Setup](#database-schema-setup)
6. [Environment Variables](#environment-variables)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Render account ([render.com](https://render.com))
- Git repository (GitHub, GitLab, or Bitbucket)
- API keys ready (Gemini, Pinecone, etc.)

## Deployment Order

**Recommended deployment sequence:**

1. **PostgreSQL Database** → Create first (needed by backend)
2. **Backend Web Service** → Deploy second (needed by frontend)
3. **Frontend Static Site** → Deploy last (depends on backend)

This ensures dependencies are available when each service starts.

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

## Backend Web Service Deployment

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
4. **Note**: Database schema will be created automatically on first startup (no Shell needed!)

## Frontend Static Site Deployment

### Step 1: Create Static Site

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Static Site"**
3. Connect your Git repository
4. Configure:
   - **Name**: `stripe-support-frontend`
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `Frontend` (if frontend is in Frontend folder)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### Step 2: Set Environment Variables

Add these in **"Environment"** tab:

```env
# Backend API URL (Required)
VITE_API_URL=https://your-backend-service.onrender.com

# Optional
VITE_NODE_ENV=production
```

**Important**: Replace `your-backend-service.onrender.com` with your actual backend service URL.

### Step 3: Configure Client-Side Routing

Since you're using React Router, you need to configure redirects. The project includes a `_redirects` file in `Frontend/public/` that will be automatically copied to `dist/` during build.

**Automatic (Recommended):**

- The `_redirects` file is already configured in `Frontend/public/_redirects`
- It will be automatically included in the build
- Render will use it to handle client-side routing

**Manual (Alternative):**
If you prefer to configure in the dashboard:

1. In Static Site dashboard → **"Settings"** tab
2. Scroll to **"Redirects/Rewrites"** section
3. Add redirect rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status Code**: `200` (not 301/302)

This ensures all routes serve `index.html` for client-side routing.

### Step 4: Deploy

1. Click **"Create Static Site"**
2. Render will build and deploy automatically
3. Your frontend will be available at: `https://your-frontend.onrender.com`

### Step 5: Update Backend CORS

After deploying frontend, update backend's `FRONTEND_URL`:

1. Go to Backend Web Service → **"Environment"** tab
2. Update `FRONTEND_URL`:
   ```env
   FRONTEND_URL=https://your-frontend.onrender.com
   ```
3. Service will restart automatically

## Database Schema Setup

**Good News**: Database schema is now **automatically created** on startup! No manual setup needed.

### Automatic Setup (Default)

The application automatically:

1. ✅ Creates all database tables on first startup
2. ✅ Scrapes initial documents if database is empty
3. ✅ Ingests documents into chunks (Pinecone + PostgreSQL)

**No action required** - everything happens automatically!

### Manual Setup (Optional)

If you need to manually run setup (e.g., to reset tables):

**Option 1: Via Render Shell** (if available on your plan)

1. Go to Web Service dashboard
2. Click **"Shell"** tab
3. Run:

```bash
npm run setup:all
```

**Option 2: Manual SQL Execution**

If you prefer to run SQL manually:

```bash
# Connect via external client using External Database URL
psql "your-external-database-url"

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

### Backend Verification

#### Test Database Connection

```bash
# In Render Shell (if available)
npm run test:render-db
```

This will:

- ✅ Test database connection
- ✅ Verify SSL is enabled
- ✅ Check database permissions
- ✅ List existing tables
- ✅ Test read/write operations

#### Check Health Endpoint

Visit: `https://your-backend.onrender.com/api/health`

Should return:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

#### Check Logs

In Render dashboard → **"Logs"** tab, you should see:

- ✅ Database tables created
- ✅ Auto-scraping started (if needed)
- ✅ Auto-ingestion started (if needed)

### Frontend Verification

#### Test Frontend

1. Visit: `https://your-frontend.onrender.com`
2. Should load the landing page
3. Check browser console for any errors
4. Verify API calls are going to correct backend URL

#### Test API Connection

1. Open browser DevTools → Network tab
2. Try to use the chat feature
3. Verify requests are going to: `https://your-backend.onrender.com/api/...`
4. Check for CORS errors (should be none if `FRONTEND_URL` is set correctly)

#### Common Frontend Issues

**Problem**: API calls failing with CORS error

**Solution**:

- Verify `FRONTEND_URL` in backend matches frontend URL exactly
- Check `VITE_API_URL` in frontend is set correctly
- Restart backend service after updating `FRONTEND_URL`

**Problem**: Routes not working (404 on refresh)

**Solution**:

- Verify redirect rule is set: `/*` → `/index.html` (status 200)
- Check `Publish Directory` is set to `dist`

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

1. **Automatic Setup**: Tables should be created automatically on startup
2. **Check Logs**: Look for "Setting up database schema..." in logs
3. **Manual Setup** (if needed):
   - Connect via Render Shell (if available)
   - Run: `npm run setup:all`
   - Or use external database URL to run setup locally

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

### Automatic Data Setup

The application automatically handles data setup on first deployment:

1. **Database Schema**: Created automatically ✅
2. **Scraping**: Runs automatically if database is empty ✅
3. **Ingestion**: Runs automatically for unprocessed documents ✅

**No manual steps required!**

### Manual Data Setup (Optional)

If you want to manually control scraping/ingestion:

```bash
# Scrape all Stripe documentation
npm run scrape

# Ingest documents into database and Pinecone
npm run ingest

# Full setup (scrape + ingest + schema)
npm run setup
```

### Auto-Setup Configuration

Control auto-setup behavior with environment variables:

```env
# Enable/disable all auto-setup (default: true in production)
AUTO_DATA_SETUP=true

# Enable/disable auto-scraping (default: true)
AUTO_SCRAPE=true

# Enable/disable auto-ingestion (default: true)
AUTO_INGEST=true
```

### Monitoring

- Check Render logs regularly
- Monitor database connection pool
- Watch for error rates
- Set up alerts for critical issues

### Updates

1. **Code Changes**: Push to Git, Render auto-deploys both services
2. **Environment Variables**: Update in dashboard, service restarts
3. **Database Schema**: Auto-updates on startup (if tables missing)
4. **Frontend Build**: Rebuilds automatically on code changes

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

**Backend:**

- `config/database.js` - Database connection configuration
- `config/config.js` - Application configuration
- `utils/setup_all_schemas.js` - Database schema setup script
- `utils/autoDataSetup.js` - Auto scraping/ingestion setup
- `index.js` - Main server file with auto-setup

**Frontend:**

- `vite.config.js` - Vite build configuration
- `src/config/api.js` - API endpoint configuration
- `package.json` - Build scripts and dependencies

### Support Resources

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Node.js on Render](https://render.com/docs/node)

---

**Last Updated**: 2024
**Version**: 1.0
