# 🚀 Unified Deployment Guide

This guide explains how to deploy both frontend and backend from a single domain using the backend Express server.

## Overview

Instead of deploying frontend and backend separately, the frontend `dist` folder is served directly from the backend Express server. This means:

- ✅ Single domain for both frontend and backend
- ✅ No CORS issues (same origin)
- ✅ Simpler deployment (one service instead of two)
- ✅ Better for production (fewer moving parts)

## Architecture

```
User Request
    ↓
Express Server (Backend)
    ↓
├── /api/* → API Routes (auth, chat, health, etc.)
├── /assets/* → Static files (JS, CSS, images)
└── /* → index.html (React Router handles routing)
```

## Setup Instructions

### 1. Build Frontend

```bash
cd Frontend
npm run build
```

This creates the `Frontend/dist` folder with all static assets.

### 2. Copy Frontend Dist to Backend

You have two options:

**Option A: Use the build script (Recommended)**

```bash
cd Backend
npm run build:frontend
```

**Option B: Build and copy in one command**

```bash
cd Backend
npm run build:all
```

**Option C: Manual copy**

```bash
# Windows
xcopy /E /I /Y Frontend\dist Backend\dist

# Linux/Mac
cp -r Frontend/dist Backend/dist
```

### 3. Start Backend Server

```bash
cd Backend
npm start
```

The server will:

- Serve API routes at `/api/*`
- Serve static assets from `Backend/dist/`
- Serve `index.html` for all other routes (SPA routing)

## Configuration

### Frontend API Configuration

The frontend is configured to use relative paths when `VITE_API_URL` is not set or empty:

```javascript
// Frontend/src/config/api.js
// If VITE_API_URL is empty, uses relative paths (same domain)
BASE_URL: ""; // Results in requests like /api/chat
```

### Environment Variables

For production deployment, you can either:

1. **Don't set `VITE_API_URL`** - Uses relative paths (recommended for same domain)
2. **Set `VITE_API_URL=""`** - Explicitly use relative paths
3. **Set `VITE_API_URL="http://localhost:5000"`** - For local development with separate frontend server

## Deployment on Render

### Build Command

```bash
cd Frontend && npm install && npx vite build && cd ../Backend && cp -r Frontend/dist Backend/dist && npm install
```

**Alternative (if npx doesn't work):**

```bash
cd Frontend && npm install && npm run build && cd ../Backend && cp -r ../Frontend/dist dist && npm install
```

**Note:** If you get "vite: not found", try using `npx vite build` instead of `npm run build`, or ensure `node_modules/.bin` is in your PATH.

### Start Command

```bash
npm start
```

### Root Directory

Set to: `Backend`

### Environment Variables

- Set all backend environment variables as usual
- **Don't set `VITE_API_URL`** (or set it to empty string) for same-domain deployment
- Remove `FRONTEND_URL` from backend env vars (not needed when serving from same domain)

## File Structure

```
Backend/
├── dist/              # Frontend build (copied from Frontend/dist)
│   ├── index.html
│   ├── assets/
│   └── ...
├── index.js           # Express server (serves dist + API)
├── routes/            # API routes
└── ...

Frontend/
├── dist/              # Frontend build output
│   ├── index.html
│   ├── assets/
│   └── ...
└── ...
```

## How It Works

### Request Flow

1. **API Request** (`/api/chat`)

   - Matches `/api/*` route
   - Handled by Express API routes
   - Returns JSON response

2. **Static Asset** (`/assets/index.js`)

   - Matches static file in `dist/`
   - Served by `express.static()`
   - Returns file content

3. **Frontend Route** (`/chat`, `/dashboard`, etc.)
   - Doesn't match `/api/*`
   - Doesn't match static file
   - Falls through to `app.get("*")`
   - Serves `index.html`
   - React Router handles client-side routing

### Code Changes

**Backend/index.js:**

- Added `express.static()` to serve `dist/` folder
- Added catch-all route to serve `index.html` for SPA routing
- API routes come before static file serving

**Frontend/src/config/api.js:**

- Updated to use relative paths when `VITE_API_URL` is not set
- Automatically detects same-domain deployment

## Testing Locally

1. Build frontend:

   ```bash
   cd Frontend && npm run build
   ```

2. Copy to backend:

   ```bash
   cd ../Backend && npm run build:frontend
   ```

3. Start backend:

   ```bash
   npm start
   ```

4. Visit: `http://localhost:5000`
   - Should see frontend landing page
   - Navigate to `/chat` - should work
   - Refresh `/chat` - should still work (no 404)

## Troubleshooting

### Issue: 404 on refresh

**Solution:** Make sure the catch-all route is configured correctly in `Backend/index.js`:

```javascript
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(join(__dirname, "dist", "index.html"));
});
```

### Issue: API calls failing

**Solution:** Check that `VITE_API_URL` is not set (or set to empty string) in frontend build. The API config should use relative paths.

### Issue: Static assets not loading

**Solution:**

1. Verify `dist` folder exists in `Backend/`
2. Check that `express.static()` is configured correctly
3. Ensure static middleware comes after API routes

### Issue: CORS errors

**Solution:** When serving from same domain, CORS shouldn't be an issue. If you see CORS errors, check:

1. API requests are using relative paths (not absolute URLs)
2. CORS middleware is still configured (for development)

## Benefits

✅ **Simpler Deployment**: One service instead of two
✅ **No CORS Issues**: Same origin for all requests
✅ **Better Performance**: No cross-origin requests
✅ **Easier Configuration**: No need to manage separate frontend/backend URLs
✅ **Cost Effective**: One Render service instead of two

## Migration from Separate Deployment

If you're migrating from separate frontend/backend deployment:

1. Update `Frontend/src/config/api.js` to use relative paths
2. Build frontend and copy to backend
3. Update backend `index.js` to serve static files
4. Deploy only the backend service
5. Remove frontend static site from Render
6. Update environment variables (remove `FRONTEND_URL`)

---

**Last Updated**: 2024
**Version**: 1.0
