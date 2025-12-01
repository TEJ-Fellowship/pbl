# Backend Fixes for Frontend Integration

## Required Backend Changes

### 1. CORS Configuration

**File:** `backend/index.js`

**Current (may need update):**
```javascript
app.use(cors());
```

**Recommended (explicit configuration):**
```javascript
const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',  // Vite default
      'http://localhost:3000',   // Alternative frontend port
      'http://localhost:5174',   // Vite alternative
      process.env.FRONTEND_URL, // From environment
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
```

**Or simpler (development only):**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
}));
```

### 2. Ensure Proper Response Headers

**File:** `backend/controllers/productController.js`

**Add middleware or ensure responses include:**
```javascript
// In getProducts function, before res.json()
res.setHeader('Content-Type', 'application/json');
res.json(result);
```

**Or add global middleware:**
```javascript
// In backend/index.js
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});
```

### 3. Verify Response Shape

**File:** `backend/controllers/productController.js`

**Ensure response matches expected shape:**
```javascript
const getProducts = async (req, res) => {
  try {
    // ... existing code ...
    
    const result = {
      success: true,  // ✅ Required
      products: products,  // ✅ Must be array
      pagination: {  // ✅ Recommended
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,  // ✅ Required for errors
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};
```

### 4. Handle Query Parameters

**File:** `backend/controllers/productController.js`

**Ensure pagination params are handled:**
```javascript
const {
  page = 1,
  limit = 20,
  category,
  minPrice,
  maxPrice,
  search,
  sortBy = 'created_at',
  order = 'DESC'
} = req.query;

// Validate and parse
const pageNum = Math.max(1, parseInt(page, 10) || 1);
const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
```

### 5. Error Response Format

**File:** `backend/controllers/productController.js`

**Ensure all errors return consistent format:**
```javascript
// Success
res.json({
  success: true,
  products: [...],
  pagination: {...}
});

// Error
res.status(400).json({
  success: false,
  message: 'Error message here',
  error: 'Optional error details'
});
```

### 6. Add OPTIONS Handler (if needed)

**File:** `backend/index.js`

**Some setups need explicit OPTIONS handler:**
```javascript
app.options('*', cors(corsOptions)); // Handle preflight
```

### 7. Session Middleware (if using)

**File:** `backend/middleware/sessionId.js`

**Ensure it doesn't block requests:**
```javascript
const sessionIdMiddleware = (req, res, next) => {
  let sessionId = req.headers['x-session-id'] || req.cookies?.session_id;
  
  if (!sessionId) {
    sessionId = uuidv4();
  }
  
  req.sessionId = sessionId;
  
  // Set cookie (ensure CORS allows credentials)
  res.cookie('session_id', sessionId, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  next();
};
```

## Testing Backend Endpoints

### Test Products Endpoint

```bash
# Basic request
curl http://localhost:3000/api/products

# With pagination
curl "http://localhost:3000/api/products?page=1&limit=5"

# With filters
curl "http://localhost:3000/api/products?category=cat-id&minPrice=10&maxPrice=100"

# Check CORS headers
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3000/api/products \
     -v
```

### Expected Response

```json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "title": "Product Name",
      "description": "Product description",
      "price": "29.99",
      "stock": 50,
      "image_url": "https://...",
      "thumbnail_url": "https://...",
      "category": {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-slug"
      },
      "inventory": {
        "quantity": 50,
        "reserved_quantity": 5
      },
      "rating": 4.5,
      "minimum_order_quantity": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "pages": 2
  }
}
```

## Environment Variables

**File:** `backend/.env`

```bash
# Server
PORT=3000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Database (your existing config)
DATABASE_URL1=...
DATABASE_URL2=...
DATABASE_URL3=...

# Redis (your existing config)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Quick Verification Script

**File:** `backend/test-api.js` (temporary test file)

```javascript
const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API...\n');
    
    // Test health
    console.log('1. Health check...');
    const health = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health:', health.data);
    
    // Test products
    console.log('\n2. Products endpoint...');
    const products = await axios.get('http://localhost:3000/api/products?page=1&limit=5');
    console.log('✅ Products response shape:', {
      hasSuccess: 'success' in products.data,
      hasProducts: Array.isArray(products.data.products),
      productsCount: products.data.products?.length,
      hasPagination: 'pagination' in products.data,
    });
    console.log('Sample product:', products.data.products[0]);
    
    // Test CORS
    console.log('\n3. CORS headers...');
    const corsTest = await axios.options('http://localhost:3000/api/products', {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      }
    });
    console.log('✅ CORS headers:', corsTest.headers['access-control-allow-origin']);
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
```

**Run:**
```bash
cd backend
node test-api.js
```

## Summary of Required Changes

1. ✅ **CORS**: Configure to allow frontend origin
2. ✅ **Response Headers**: Ensure `Content-Type: application/json`
3. ✅ **Response Shape**: Match expected `{ success, products, pagination }`
4. ✅ **Error Format**: Consistent `{ success: false, message, error }`
5. ✅ **Query Params**: Handle `page`, `limit`, filters correctly
6. ✅ **Session**: Ensure session middleware doesn't block requests

After making these changes, restart the backend server and test with the frontend.

