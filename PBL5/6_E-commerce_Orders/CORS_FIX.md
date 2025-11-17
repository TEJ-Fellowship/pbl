# CORS Fix Applied

## Problem

The error message was clear:
```
Access-Control-Allow-Origin header in the response must not be the wildcard '*' 
when the request's credentials mode is 'include'
```

**Root Cause:**
- Frontend sends requests with `withCredentials: true` (for session cookies)
- Backend was using `cors()` which defaults to `origin: '*'` (wildcard)
- Browsers **forbid** wildcard `*` when credentials are included

## Solution Applied

Updated `backend/index.js` to use explicit CORS configuration:

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',  // Vite default
      'http://localhost:5174',  // Vite alternative
      'http://localhost:3000',   // Alternative frontend
      process.env.FRONTEND_URL, // From env
    ].filter(Boolean);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development') {
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
```

## What Changed

1. ✅ **Explicit Origin Check**: Instead of wildcard `*`, now checks specific origins
2. ✅ **Development Mode**: Allows all localhost origins in development
3. ✅ **Credentials Support**: `credentials: true` allows cookies/session
4. ✅ **Proper Headers**: Allows `X-Session-ID` header used by frontend

## Verification

After restarting the backend:

1. **Check CORS headers:**
   ```bash
   curl -H "Origin: http://localhost:5173" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        http://localhost:3000/api/products \
        -v
   ```

   Should see:
   ```
   < Access-Control-Allow-Origin: http://localhost:5173
   < Access-Control-Allow-Credentials: true
   < Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH
   < Access-Control-Allow-Headers: Content-Type,Authorization,X-Session-ID
   ```

2. **Test actual request:**
   ```bash
   curl -H "Origin: http://localhost:5173" \
        http://localhost:3000/api/products?page=1&limit=5
   ```

3. **In browser:**
   - Open DevTools → Network tab
   - Navigate to Products page
   - Check `/api/products` request
   - Should see status `200` (not CORS error)

## Next Steps

1. **Restart backend:**
   ```bash
   cd backend
   # Stop current server (Ctrl+C)
   npm start
   ```

2. **Refresh frontend:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Products should now load!

3. **If still having issues:**
   - Check backend console for CORS errors
   - Verify frontend origin matches allowed list
   - Check Network tab → Headers → Response Headers for CORS headers

## Alternative: Remove Credentials (Not Recommended)

If you don't need session cookies, you could remove `withCredentials: true` from frontend:

```javascript
// frontend/src/lib/api.js
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Remove this line
});
```

**But this will break session management**, so the CORS fix above is the correct solution.

