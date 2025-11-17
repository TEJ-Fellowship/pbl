# Frontend Product Display - Debugging Checklist

## Quick Diagnosis

**Most Likely Issues:**
1. ✅ **Port Mismatch**: Frontend expects `localhost:3000` (default) but backend might be on `3001`
2. ✅ **CORS Error**: Backend not allowing requests from frontend origin
3. ✅ **API URL Incorrect**: Wrong base URL or missing `/api` prefix
4. ✅ **Network Error**: Backend not running or unreachable
5. ✅ **Response Shape Mismatch**: API returning different structure than expected

## Step-by-Step Debugging

### 1. Check Network Tab (Browser DevTools)

**Steps:**
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for request to `/api/products` or `products`

**What to Check:**
- ✅ **Request URL**: Should be `http://localhost:3000/api/products` (or your configured URL)
- ✅ **Status Code**: 
  - `200` = Success
  - `404` = Route not found
  - `500` = Server error
  - `CORS error` = CORS not configured
  - `Failed (net::ERR_CONNECTION_REFUSED)` = Backend not running
- ✅ **Response Headers**: Should include `Content-Type: application/json`
- ✅ **Response Body**: Click on request → Preview/Response tab → Check JSON structure

**Expected Response:**
```json
{
  "success": true,
  "products": [...],
  "pagination": { "page": 1, "limit": 20, "total": 30, "pages": 2 }
}
```

### 2. Verify Backend is Running

**Command:**
```bash
# Check if backend is running
curl http://localhost:3000/api/health
# or
curl http://localhost:3001/api/health
```

**Expected:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**If fails:**
- Start backend: `cd backend && npm start`
- Check backend logs for errors
- Verify PORT in backend `.env` or `config.js`

### 3. Test Products Endpoint Directly

**Command:**
```bash
# Test products endpoint
curl http://localhost:3000/api/products?page=1&limit=20

# With headers (simulating browser)
curl -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/products?page=1&limit=20
```

**Expected:**
- Status: `200 OK`
- Headers include: `Content-Type: application/json`
- Body matches expected shape

### 4. Check CORS Configuration

**Backend should have:**
```javascript
// In backend/index.js or app setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite default
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
}));
```

**Test CORS:**
```bash
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3000/api/products \
     -v
```

**Expected Headers in Response:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Session-ID
```

### 5. Check Frontend API Configuration

**File:** `frontend/src/lib/api.js`

**Verify:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
console.log('API Base URL:', API_BASE_URL); // Add this temporarily
```

**Check `.env` file:**
```bash
# frontend/.env
VITE_API_URL=http://localhost:3000/api
```

**Note:** Vite requires `VITE_` prefix for environment variables!

### 6. Check Console for Errors

**Browser Console (F12 → Console tab):**

**Common Errors:**
- `Failed to fetch` = Network/CORS issue
- `CORS policy` = CORS not configured
- `404 Not Found` = Wrong URL or route
- `Unexpected token <` = Server returning HTML instead of JSON
- `Cannot read property 'products' of undefined` = Response shape mismatch

**Add Debug Logging:**
```javascript
// In useProducts.js or Products.jsx
console.log('Fetching products with params:', params);
console.log('API Response:', data);
console.log('Products:', products);
```

### 7. Verify Response Shape

**Add temporary logging:**
```javascript
// In useProducts.js
const data = await productsApi.getAll(fetchParams);
console.log('Raw API Response:', JSON.stringify(data, null, 2));

// Check structure
if (!data.success) {
  console.error('API returned success: false', data);
}
if (!Array.isArray(data.products)) {
  console.error('Products is not an array:', typeof data.products, data.products);
}
```

**Expected Structure:**
```javascript
{
  success: true,           // Required
  products: [...],        // Must be array
  pagination: {           // Optional but recommended
    page: 1,
    limit: 20,
    total: 30,
    pages: 2
  }
}
```

### 8. Check State Lifecycle

**Verify useEffect dependencies:**
```javascript
// In Products.jsx - ensure all dependencies are included
useEffect(() => {
  fetchProducts();
}, [currentPage, selectedCategory, search, minPrice, maxPrice, sortBy, order]);
// Missing dependency = stale closure = won't refetch
```

**Check if component unmounts:**
```javascript
useEffect(() => {
  console.log('Component mounted');
  return () => {
    console.log('Component unmounting');
  };
}, []);
```

### 9. Verify Rendering Conditions

**Check ProductGrid:**
```javascript
// Should render if:
- !loading && !error && products.length > 0
```

**Add debug:**
```javascript
console.log('Rendering ProductGrid:', {
  loading,
  error,
  productsCount: products?.length,
  hasProducts: products && products.length > 0
});
```

### 10. Check for Service Worker / Cache

**Clear cache:**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Disable cache in DevTools → Network tab → Check "Disable cache"
- Clear browser cache: Settings → Clear browsing data

**Check for Service Worker:**
- DevTools → Application → Service Workers
- Unregister if present and causing issues

## Quick Fixes

### Fix 1: Port Mismatch
```bash
# Option A: Update frontend .env
echo "VITE_API_URL=http://localhost:3000/api" > frontend/.env

# Option B: Update backend to match frontend expectation
# In backend/.env or config.js
PORT=3000
```

### Fix 2: CORS Error
```javascript
// In backend/index.js - ensure CORS is configured
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
```

### Fix 3: Missing Error Handling
The updated `useProducts` hook now includes proper error handling. Ensure you're using it:
```javascript
import { useProducts } from '../hooks/useProducts';
const { products, loading, error, retry } = useProducts(params);
```

### Fix 4: Response Shape Mismatch
If backend returns different shape, update the hook:
```javascript
// In useProducts.js - adjust data extraction
const productsArray = Array.isArray(data.products) 
  ? data.products 
  : Array.isArray(data.data?.products) 
    ? data.data.products 
    : [];
```

## Verification Commands

```bash
# 1. Start backend
cd backend
npm start
# Should see: "Server running on port 3000" (or 3001)

# 2. Test backend directly
curl http://localhost:3000/api/products?page=1&limit=5

# 3. Start frontend
cd frontend
npm run dev
# Should open http://localhost:5173

# 4. Open browser DevTools → Network
# Navigate to Products page
# Check for GET /api/products request
# Verify status 200 and response structure
```

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Port mismatch | Network error or 404 | Update `.env` or backend port |
| CORS error | Red error in console | Add CORS middleware to backend |
| Backend not running | `ERR_CONNECTION_REFUSED` | Start backend server |
| Wrong API URL | 404 on `/api/products` | Check `VITE_API_URL` in `.env` |
| Response shape mismatch | `Cannot read property 'products'` | Verify backend response matches expected shape |
| Missing error handling | Silent failure | Use updated `useProducts` hook with error state |
| Stale closure | Products don't update | Check useEffect dependencies |

## Still Not Working?

1. **Check backend logs** for errors
2. **Check browser console** for JavaScript errors
3. **Check Network tab** for failed requests
4. **Verify database** has products (run seed script if needed)
5. **Test with Postman/Insomnia** to isolate frontend vs backend issue

