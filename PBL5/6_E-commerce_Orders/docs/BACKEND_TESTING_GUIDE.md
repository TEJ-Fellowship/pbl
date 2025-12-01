# Backend API Testing Guide

## 📋 Quick Reference Card

| What | How |
|------|-----|
| **Test from VS Code** | Open `backend/api-tests.http` → Install "REST Client" extension → Click "Send Request" |
| **Test from Terminal** | Use cURL commands (see examples below) |
| **Test from Browser** | Open `http://localhost:3000/api/products` (GET only) |
| **Base URL** | `http://localhost:3000/api` |
| **Get Session ID** | Run "GET YOUR SESSION ID" request → Check response headers → Copy `session_id` value |
| **Test File** | `backend/api-tests.http` (all endpoints ready!) |

### 🎯 Quick Start: Getting Your Session ID

1. **Open:** `backend/api-tests.http`
2. **Find:** `### ⭐ GET YOUR SESSION ID - Run this first!` (in Cart section)
3. **Click:** "Send Request" above that request
4. **Look:** In response panel → "Response Headers" section
5. **Find:** `Set-Cookie: session_id=550e8400-e29b-41d4-a716-446655440000`
6. **Copy:** The UUID value (everything after `session_id=`)
7. **Update:** Change `@sessionId = test-session-123` to `@sessionId = 550e8400-e29b-41d4-a716-446655440000`
8. **Done!** Now use `{{sessionId}}` in all requests

---

## 🚀 Quick Start: Test Directly from VS Code

**The easiest way to test your API is directly from VS Code - no external tools needed!**

### Step-by-Step Guide:

1. **Install REST Client Extension:**
   - Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac) to open Extensions
   - Search for **"REST Client"** by Huachao Mao
   - Click **Install**

2. **Start Your Backend Server:**
   ```bash
   cd backend
   npm start
   ```
   Make sure it's running on `http://localhost:3000`

3. **Open the Test File:**
   - Navigate to: `backend/api-tests.http`
   - This file contains **ALL** API endpoints ready to test

4. **Test Any Endpoint:**
   - You'll see a **"Send Request"** link above each request
   - Click it to execute the request
   - Response appears in a new tab next to your code
   - No copy-pasting, no terminal needed!

### Visual Guide:

```
┌─────────────────────────────────────────┐
│  backend/api-tests.http                 │
├─────────────────────────────────────────┤
│                                         │
│  ### Health Check                       │
│  GET {{baseUrl}}/health                 │
│  ↑ Click "Send Request" here           │
│                                         │
│  ### Get All Products                  │
│  GET {{baseUrl}}/products              │
│  ↑ Click "Send Request" here           │
│                                         │
└─────────────────────────────────────────┘
         ↓ Click "Send Request"
         ↓
┌─────────────────────────────────────────┐
│  Response Panel (opens automatically)   │
├─────────────────────────────────────────┤
│  HTTP/1.1 200 OK                        │
│  {                                      │
│    "success": true,                     │
│    "message": "API is healthy"          │
│  }                                      │
└─────────────────────────────────────────┘
```

### What You Can Test:

✅ **Health Check** - Verify server is running  
✅ **Products** - List, search, filter, get by ID  
✅ **Cart** - Add, update, remove, clear items  
✅ **Orders** - Checkout, view orders, cancel  
✅ **Complete Flows** - Full shopping experience  
✅ **Error Cases** - Invalid inputs, edge cases  
✅ **Performance** - Cache testing, multiple requests  

**📁 Test File:** `backend/api-tests.http`  
**🎯 No setup needed - just install extension and start testing!**

---

## Table of Contents
1. [Quick Start: Test from VS Code](#-quick-start-test-directly-from-vs-code)
2. [Prerequisites](#prerequisites)
3. [Testing Tools](#testing-tools)
4. [Base URL & Configuration](#base-url--configuration)
5. [Session Management](#session-management)
6. [API Endpoints Testing](#api-endpoints-testing)
7. [Complete Testing Scenarios](#complete-testing-scenarios)
8. [Error Testing](#error-testing)
9. [Performance Testing](#performance-testing)

---

## Prerequisites

Before testing, ensure:
- ✅ Backend server is running (default: `http://localhost:3000`)
- ✅ PostgreSQL database is connected and initialized
- ✅ Redis server is running
- ✅ Database has some sample data (run seed script if needed)

### Start Backend Server
```bash
cd backend
npm start
# Server should start on port 3000 (or PORT from .env)
```

### Verify Server is Running
```bash
# Test health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Testing Tools

### Option 1: Postman (Recommended)
- Download: https://www.postman.com/downloads/
- Create a new Collection: "E-commerce API Tests"
- Set collection variable: `baseUrl = http://localhost:3000`

### Option 2: cURL (Command Line)
- Built-in on Linux/Mac
- Windows: Use Git Bash or PowerShell

### Option 3: HTTPie
```bash
# Install: pip install httpie
http GET http://localhost:3000/api/health
```

### Option 4: Browser (GET requests only)
- Open: `http://localhost:3000/api/products`
- Use browser DevTools Network tab

### Option 5: VS Code REST Client Extension ⭐ **RECOMMENDED**
- **Install:** "REST Client" extension by Huachao Mao
- **Location:** `backend/api-tests.http` (already created for you!)
- **Usage:** Click "Send Request" above any request to test
- **Benefits:**
  - Test directly from VS Code
  - No need to copy-paste commands
  - All endpoints pre-configured
  - View responses in editor
  - Save request history

**📝 The `api-tests.http` file includes:**
- ✅ All API endpoints
- ✅ Complete shopping flow tests
- ✅ Error testing scenarios
- ✅ Multiple product cart tests
- ✅ Search and filter examples
- ✅ Ready-to-use variables

**Just open `backend/api-tests.http` and start testing!**

---

## Base URL & Configuration

**Base URL:** `http://localhost:3000/api`

**Important Headers:**
- `Content-Type: application/json` (for POST/PUT requests)
- `X-Session-ID: <your-session-id>` (for cart/order operations)
- `Cookie: sessionId=<your-session-id>` (alternative to header)

---

## Session Management

The API uses **guest session-based authentication**. Each user gets a unique session ID.

### Getting a Session ID

**Method 1: Automatic (Recommended for VS Code REST Client)**
1. Open `backend/api-tests.http` in VS Code
2. Find the request: `### ⭐ GET YOUR SESSION ID - Run this first!`
3. Click "Send Request" (this request has NO X-Session-ID header)
4. In the response panel, look at the **Response Headers** section
5. Find: `Set-Cookie: session_id=YOUR-SESSION-ID-HERE`
6. Copy the UUID value after `session_id=`
7. Update the `@sessionId` variable at the top of the `.http` file
8. Now all requests using `{{sessionId}}` will use your session ID

**Method 2: Generate Your Own UUID**
- Visit: https://www.uuidgenerator.net/
- Generate a UUID: `550e8400-e29b-41d4-a716-446655440000`
- Update `@sessionId` variable in `api-tests.http`
- Or include directly in header: `X-Session-ID: 550e8400-e29b-41d4-a716-446655440000`

**Method 3: Use Any String (For Testing)**
- You can use any string like `test-session-123` or `my-session`
- Just make sure to use the **SAME** value consistently across all requests
- Update `@sessionId` variable or use directly in headers

**💡 Important:** Once you have a session ID, use it consistently. If you use different session IDs, you'll have different carts!

### Testing Session Flow

**Using VS Code REST Client (Easiest):**
1. Open `backend/api-tests.http`
2. Run the "GET YOUR SESSION ID" request (no header needed)
3. Check response headers for `Set-Cookie: session_id=...`
4. Copy the session ID and update `@sessionId` variable
5. All subsequent requests will use `{{sessionId}}` automatically

**Using cURL:**
```bash
# 1. Get cart (will generate session ID)
curl -X GET http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -v  # -v shows headers including Set-Cookie

# 2. Check the Set-Cookie header in output, or use cookies.txt
# 3. Use session ID in subsequent requests
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id-from-step-1>" \
  -d '{"productId": 1, "quantity": 2}'
```

**Visual Guide - Getting Session ID in VS Code:**
```
1. Click "Send Request" on: GET /api/cart (no header)
   ↓
2. Response opens in new tab
   ↓
3. Look at "Response Headers" section:
   Set-Cookie: session_id=550e8400-e29b-41d4-a716-446655440000
   ↓
4. Copy: 550e8400-e29b-41d4-a716-446655440000
   ↓
5. Update @sessionId at top of file
   ↓
6. Use {{sessionId}} in all requests!
```

---

## API Endpoints Testing

### 1. Health Check

**Endpoint:** `GET /api/health`

**cURL:**
```bash
curl http://localhost:3000/api/health
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/health`
- No headers/body needed

**Expected Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Products Endpoints

#### 2.1 Get All Products

**Endpoint:** `GET /api/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `category` (optional): Filter by category ID
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `search` (optional): Search in title/description
- `sortBy` (optional): Sort field (default: 'created_at')
- `order` (optional): 'ASC' or 'DESC' (default: 'DESC')

**cURL Examples:**
```bash
# Basic request
curl http://localhost:3000/api/products

# With pagination
curl "http://localhost:3000/api/products?page=1&limit=10"

# With filters
curl "http://localhost:3000/api/products?minPrice=10&maxPrice=100&search=laptop"

# With sorting
curl "http://localhost:3000/api/products?sortBy=price&order=ASC"
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/products?page=1&limit=20`
- Params tab: Add query parameters

**Expected Response:**
```json
{
  "success": true,
  "fromCache": false,
  "products": [
    {
      "id": 1,
      "title": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "category_id": 1,
      "image_url": "https://example.com/image.jpg",
      "thumbnail_url": "https://example.com/thumb.jpg",
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "inventory": {
        "quantity": 100,
        "reserved_quantity": 0,
        "available_quantity": 100
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 2.2 Get Product by ID

**Endpoint:** `GET /api/products/:id`

**cURL:**
```bash
curl http://localhost:3000/api/products/1
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/products/1`

**Expected Response:**
```json
{
  "success": true,
  "fromCache": false,
  "product": {
    "id": 1,
    "title": "Product Name",
    "description": "Full description",
    "price": 99.99,
    "category_id": 1,
    "image_url": "https://example.com/image.jpg",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "inventory": {
      "quantity": 100,
      "reserved_quantity": 0,
      "available_quantity": 100
    },
    "category": {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics"
    }
  }
}
```

#### 2.3 Get All Categories

**Endpoint:** `GET /api/products/categories`

**cURL:**
```bash
curl http://localhost:3000/api/products/categories
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/products/categories`

**Expected Response:**
```json
{
  "success": true,
  "fromCache": false,
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic products"
    }
  ]
}
```

#### 2.4 Get Products by Category

**Endpoint:** `GET /api/products/category/:categorySlug`

**cURL:**
```bash
curl http://localhost:3000/api/products/category/electronics
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/products/category/electronics`

**Expected Response:**
```json
{
  "success": true,
  "fromCache": false,
  "products": [...],
  "category": {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics"
  },
  "pagination": {...}
}
```

---

### 3. Cart Endpoints

**⚠️ Important:** All cart endpoints require a session ID in header or cookie.

#### 3.1 Get Cart Items

**Endpoint:** `GET /api/cart`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/cart \
  -H "X-Session-ID: your-session-id-here"
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/cart`
- Headers: `X-Session-ID: your-session-id-here`

**Expected Response (Empty Cart):**
```json
{
  "success": true,
  "cart": {},
  "items": [],
  "total": 0,
  "itemCount": 0
}
```

**Expected Response (With Items):**
```json
{
  "success": true,
  "cart": {
    "1": {
      "quantity": 2,
      "price": 99.99
    }
  },
  "items": [
    {
      "productId": 1,
      "product": {
        "id": 1,
        "title": "Product Name",
        "price": 99.99,
        "image": "https://example.com/image.jpg"
      },
      "quantity": 2,
      "subtotal": 199.98
    }
  ],
  "total": 199.98,
  "itemCount": 2
}
```

#### 3.2 Add Item to Cart

**Endpoint:** `POST /api/cart/add`

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: your-session-id-here" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'
```

**Postman:**
- Method: POST
- URL: `http://localhost:3000/api/cart/add`
- Headers: 
  - `Content-Type: application/json`
  - `X-Session-ID: your-session-id-here`
- Body (raw JSON):
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {
    "1": {
      "quantity": 2,
      "price": 99.99
    }
  },
  "items": [...],
  "total": 199.98,
  "itemCount": 2
}
```

#### 3.3 Update Cart Item Quantity

**Endpoint:** `PUT /api/cart/update`

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 5
}
```

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/cart/update \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: your-session-id-here" \
  -d '{
    "productId": 1,
    "quantity": 5
  }'
```

**Postman:**
- Method: PUT
- URL: `http://localhost:3000/api/cart/update`
- Headers: 
  - `Content-Type: application/json`
  - `X-Session-ID: your-session-id-here`
- Body (raw JSON):
```json
{
  "productId": 1,
  "quantity": 5
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cart item updated",
  "cart": {...},
  "items": [...],
  "total": 499.95,
  "itemCount": 5
}
```

#### 3.4 Remove Item from Cart

**Endpoint:** `DELETE /api/cart/remove/:productId`

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/cart/remove/1 \
  -H "X-Session-ID: your-session-id-here"
```

**Postman:**
- Method: DELETE
- URL: `http://localhost:3000/api/cart/remove/1`
- Headers: `X-Session-ID: your-session-id-here`

**Expected Response:**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart": {},
  "items": [],
  "total": 0,
  "itemCount": 0
}
```

#### 3.5 Clear Entire Cart

**Endpoint:** `DELETE /api/cart/clear`

**cURL:**
```bash
curl -X DELETE http://localhost:3000/api/cart/clear \
  -H "X-Session-ID: your-session-id-here"
```

**Postman:**
- Method: DELETE
- URL: `http://localhost:3000/api/cart/clear`
- Headers: `X-Session-ID: your-session-id-here`

**Expected Response:**
```json
{
  "success": true,
  "message": "Cart cleared",
  "cart": {},
  "items": [],
  "total": 0,
  "itemCount": 0
}
```

---

### 4. Orders Endpoints

**⚠️ Important:** All order endpoints require a session ID.

#### 4.1 Create Order (Checkout)

**Endpoint:** `POST /api/orders/checkout`

**Request Body:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "simulated"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: your-session-id-here" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "paymentMethod": "simulated"
  }'
```

**Postman:**
- Method: POST
- URL: `http://localhost:3000/api/orders/checkout`
- Headers: 
  - `Content-Type: application/json`
  - `X-Session-ID: your-session-id-here`
- Body (raw JSON):
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "simulated"
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "your-session-id-here",
    "total_amount": 199.98,
    "status": "confirmed",
    "shipping_address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "created_at": "2024-01-15T10:30:00.000Z",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 2,
        "price": 99.99,
        "subtotal": 199.98,
        "product": {
          "id": 1,
          "title": "Product Name",
          "price": 99.99
        }
      }
    ],
    "payment": {
      "id": 1,
      "order_id": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 199.98,
      "status": "completed",
      "method": "simulated"
    }
  }
}
```

**Expected Response (Empty Cart Error):**
```json
{
  "success": false,
  "message": "Cart is empty"
}
```

**Expected Response (Insufficient Stock):**
```json
{
  "success": false,
  "message": "Insufficient stock for product: Product Name"
}
```

#### 4.2 Get Order by ID

**Endpoint:** `GET /api/orders/:id`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-Session-ID: your-session-id-here"
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000`
- Headers: `X-Session-ID: your-session-id-here`

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "your-session-id-here",
    "total_amount": 199.98,
    "status": "confirmed",
    "shipping_address": {...},
    "created_at": "2024-01-15T10:30:00.000Z",
    "items": [...],
    "payment": {...}
  }
}
```

#### 4.3 Get My Orders (All orders for session)

**Endpoint:** `GET /api/orders/my-orders`

**cURL:**
```bash
curl -X GET http://localhost:3000/api/orders/my-orders \
  -H "X-Session-ID: your-session-id-here"
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/orders/my-orders`
- Headers: `X-Session-ID: your-session-id-here`

**Expected Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "total_amount": 199.98,
      "status": "confirmed",
      "created_at": "2024-01-15T10:30:00.000Z",
      "itemCount": 2
    }
  ],
  "totalOrders": 1
}
```

#### 4.4 Cancel Order

**Endpoint:** `PUT /api/orders/:id/cancel`

**cURL:**
```bash
curl -X PUT http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000/cancel \
  -H "X-Session-ID: your-session-id-here"
```

**Postman:**
- Method: PUT
- URL: `http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000/cancel`
- Headers: `X-Session-ID: your-session-id-here`

**Expected Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

**Expected Response (Already Cancelled):**
```json
{
  "success": false,
  "message": "Order is already cancelled or cannot be cancelled"
}
```

---

## Complete Testing Scenarios

### Scenario 1: Complete Shopping Flow

**Step 1: Get Products**
```bash
curl http://localhost:3000/api/products?limit=5
```
- Note a product ID from response (e.g., `productId: 1`)

**Step 2: Get Product Details**
```bash
curl http://localhost:3000/api/products/1
```
- Verify product exists and has inventory

**Step 3: Get Cart (Generate Session)**
```bash
curl -X GET http://localhost:3000/api/cart \
  -c cookies.txt
```
- Save session ID from response cookie or header

**Step 4: Add Product to Cart**
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id-from-step-3>" \
  -d '{"productId": 1, "quantity": 2}'
```

**Step 5: View Cart**
```bash
curl -X GET http://localhost:3000/api/cart \
  -H "X-Session-ID: <session-id>"
```

**Step 6: Update Cart Item**
```bash
curl -X PUT http://localhost:3000/api/cart/update \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"productId": 1, "quantity": 3}'
```

**Step 7: Checkout (Create Order)**
```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```
- Save order ID from response

**Step 8: View Order Details**
```bash
curl -X GET http://localhost:3000/api/orders/<order-id> \
  -H "X-Session-ID: <session-id>"
```

**Step 9: View All My Orders**
```bash
curl -X GET http://localhost:3000/api/orders/my-orders \
  -H "X-Session-ID: <session-id>"
```

**Step 10: Cancel Order (Optional)**
```bash
curl -X PUT http://localhost:3000/api/orders/<order-id>/cancel \
  -H "X-Session-ID: <session-id>"
```

### Scenario 2: Multiple Products in Cart

```bash
# Add first product
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"productId": 1, "quantity": 1}'

# Add second product
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"productId": 2, "quantity": 2}'

# View cart (should show both products)
curl -X GET http://localhost:3000/api/cart \
  -H "X-Session-ID: <session-id>"
```

### Scenario 3: Search and Filter Products

```bash
# Search for "laptop"
curl "http://localhost:3000/api/products?search=laptop"

# Filter by price range
curl "http://localhost:3000/api/products?minPrice=50&maxPrice=200"

# Filter by category
curl "http://localhost:3000/api/products?category=1"

# Combined filters
curl "http://localhost:3000/api/products?search=laptop&minPrice=100&maxPrice=500&page=1&limit=10"
```

---

## Error Testing

### Test 1: Invalid Product ID
```bash
curl http://localhost:3000/api/products/99999
```
**Expected:** 404 or error message

### Test 2: Add Non-existent Product to Cart
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"productId": 99999, "quantity": 1}'
```
**Expected:** Error message about product not found

### Test 3: Add More Quantity Than Available
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"productId": 1, "quantity": 10000}'
```
**Expected:** Error about insufficient stock

### Test 4: Checkout with Empty Cart
```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"shippingAddress": {"street": "123 Main St", "city": "NY", "state": "NY", "zipCode": "10001", "country": "USA"}}'
```
**Expected:** Error "Cart is empty"

### Test 5: Missing Shipping Address
```bash
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{}'
```
**Expected:** Error "Shipping address is required"

### Test 6: Invalid Session ID
```bash
curl -X GET http://localhost:3000/api/cart \
  -H "X-Session-ID: invalid-session"
```
**Expected:** Empty cart (new session created)

### Test 7: Cancel Non-existent Order
```bash
curl -X PUT http://localhost:3000/api/orders/invalid-id/cancel \
  -H "X-Session-ID: <session-id>"
```
**Expected:** Error about order not found

---

## Performance Testing

### Test Cache Performance

**First Request (Cache Miss):**
```bash
time curl http://localhost:3000/api/products
```
- Note the response time

**Second Request (Cache Hit):**
```bash
time curl http://localhost:3000/api/products
```
- Should be faster (check `fromCache: true` in response)

### Test Database Routing

**Read Operations (Should use Replica):**
```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/1
```

**Write Operations (Should use Primary):**
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: <session-id>" \
  -d '{"productId": 1, "quantity": 1}'
```

---

## Postman Collection Setup

### Create Postman Collection

1. **Create New Collection:** "E-commerce API"
2. **Add Collection Variables:**
   - `baseUrl`: `http://localhost:3000/api`
   - `sessionId`: (leave empty, will be set automatically)

3. **Create Folder Structure:**
   ```
   E-commerce API
   ├── Health
   │   └── Health Check
   ├── Products
   │   ├── Get All Products
   │   ├── Get Product by ID
   │   ├── Get Categories
   │   └── Get Products by Category
   ├── Cart
   │   ├── Get Cart
   │   ├── Add to Cart
   │   ├── Update Cart Item
   │   ├── Remove from Cart
   │   └── Clear Cart
   └── Orders
       ├── Checkout
       ├── Get Order by ID
       ├── Get My Orders
       └── Cancel Order
   ```

4. **Set Up Pre-request Script for Session:**
   - In Cart/Orders folder, add pre-request script:
   ```javascript
   // Auto-generate session if not exists
   if (!pm.collectionVariables.get("sessionId")) {
       pm.collectionVariables.set("sessionId", pm.variables.replaceIn("{{$randomUUID}}"));
   }
   ```

5. **Use Variables in Requests:**
   - URL: `{{baseUrl}}/products`
   - Header: `X-Session-ID: {{sessionId}}`

---

## VS Code REST Client - Ready to Use! ⭐

**The test file is already created for you!**

📁 **File Location:** `backend/api-tests.http`

### How to Use:

1. **Install Extension:**
   - Open VS Code
   - Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
   - Search: "REST Client"
   - Install the extension by Huachao Mao

2. **Open the Test File:**
   - Navigate to `backend/api-tests.http`
   - You'll see all endpoints organized by category

3. **Test Endpoints:**
   - Click "Send Request" that appears above each request
   - Or right-click and select "Send Request"
   - View response in the editor panel

4. **Update Variables (if needed):**
   - Edit variables at the top of the file:
   ```http
   @baseUrl = http://localhost:3000/api
   @sessionId = your-session-id
   @productId = 1
   @orderId = your-order-id
   ```

### What's Included in `api-tests.http`:

✅ **Health Check** - Verify server is running  
✅ **All Product Endpoints** - GET, search, filter, categories  
✅ **All Cart Endpoints** - Add, update, remove, clear  
✅ **All Order Endpoints** - Checkout, view, cancel  
✅ **Complete Shopping Flow** - Step-by-step test sequence  
✅ **Error Testing** - Invalid IDs, empty cart, etc.  
✅ **Search & Filter Tests** - All query parameter combinations  
✅ **Multiple Products Test** - Cart with multiple items  
✅ **Cache Testing** - Verify Redis caching works  

### Example Usage:

```http
### Health Check
GET {{baseUrl}}/health
```

Just click "Send Request" above this line and see the response!

**💡 Tip:** After creating an order, copy the order ID from the response and update the `@orderId` variable at the top of the file to test order-specific endpoints.

---

## Quick Test Checklist

- [ ] Health endpoint returns success
- [ ] Can fetch products list
- [ ] Can fetch product by ID
- [ ] Can fetch categories
- [ ] Can add item to cart
- [ ] Can view cart
- [ ] Can update cart item quantity
- [ ] Can remove item from cart
- [ ] Can clear cart
- [ ] Can create order (checkout)
- [ ] Can view order details
- [ ] Can view all my orders
- [ ] Can cancel order
- [ ] Error handling works (invalid IDs, empty cart, etc.)
- [ ] Session management works
- [ ] Cache is working (check `fromCache` field)

---

## Troubleshooting

### Issue: "Cannot connect to server"
**Solution:** 
- Check if backend is running: `npm start` in backend directory
- Verify port in `.env` file matches your requests
- Check firewall settings

### Issue: "CORS error"
**Solution:**
- Ensure you're using the correct origin
- Check `backend/index.js` CORS configuration
- For Postman/cURL, CORS shouldn't be an issue

### Issue: "Session ID not working"
**Solution:**
- Ensure session ID is in header: `X-Session-ID: <id>`
- Or use cookie: `Cookie: sessionId=<id>`
- Make sure session ID is consistent across requests

### Issue: "Product not found"
**Solution:**
- Run seed script to populate database: `node scripts/seedProducts.js`
- Check database connection
- Verify product ID exists in database

### Issue: "Empty cart on checkout"
**Solution:**
- Ensure you're using the same session ID for cart operations and checkout
- Check Redis is running: `redis-cli ping`
- Verify cart items were added successfully

---

## Additional Resources

- **Backend README:** `backend/README.md`
- **System Documentation:** `SYSTEM_ANALYSIS_AND_DESIGN_DOCUMENTATION.md`
- **Quick Start Guide:** `backend/QUICK-START.md`

---

**Last Updated:** 2024  
**API Version:** 1.0.0

