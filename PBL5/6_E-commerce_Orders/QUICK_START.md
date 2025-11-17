# Quick Start Guide - Product Display Fix

## Immediate Steps to Get Products Displaying

### 1. Check Backend Port

```bash
# Check what port backend is running on
cd backend
cat .env | grep PORT
# or check config.js
```

**If backend is on port 3000:**
```bash
# Frontend already configured for 3000 by default
# No changes needed
```

**If backend is on port 3001:**
```bash
# Update frontend .env
cd frontend
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 2. Verify Backend is Running

```bash
# Terminal 1: Start backend
cd backend
npm start

# Should see:
# 🚀 Server running on port 3000 (or 3001)
# 📡 API available at http://localhost:3000/api
```

### 3. Test Backend Endpoint

```bash
# In new terminal
curl http://localhost:3000/api/products?page=1&limit=5

# Should return JSON with products array
```

### 4. Start Frontend

```bash
# Terminal 2: Start frontend
cd frontend
npm install  # If not done already
npm run dev

# Should open http://localhost:5173
```

### 5. Verify in Browser

1. Open `http://localhost:5173/products`
2. Open DevTools (F12) → Network tab
3. Look for `GET /api/products` request
4. Check:
   - ✅ Status: 200
   - ✅ Response has `success: true`
   - ✅ Response has `products` array
   - ✅ Products render on page

## If Products Still Don't Show

### Quick Debug Steps

1. **Check Console (F12 → Console)**
   - Look for red errors
   - Common: CORS error, network error, undefined property

2. **Check Network Tab (F12 → Network)**
   - Find `/api/products` request
   - Click it → Check Response tab
   - Verify JSON structure matches expected

3. **Add Temporary Logging**

In `frontend/src/pages/Products.jsx`, add:
```javascript
console.log('Products state:', { products, loading, error });
```

4. **Verify API URL**

In browser console:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

## Common Fixes

### Fix CORS Error

**Backend:** `backend/index.js`
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
```

### Fix Port Mismatch

**Frontend:** `frontend/.env`
```
VITE_API_URL=http://localhost:3000/api
```

**Or update backend to match:**
```bash
# backend/.env
PORT=3000
```

### Fix Missing Products

```bash
# Seed database if empty
cd backend
npm run seed
```

## Verification Checklist

- [ ] Backend running on port 3000 (or 3001)
- [ ] Frontend running on port 5173
- [ ] `curl http://localhost:3000/api/products` returns JSON
- [ ] Browser Network tab shows 200 for `/api/products`
- [ ] Console has no red errors
- [ ] Products array has items
- [ ] Product cards render on page

## Still Not Working?

See `DEBUGGING_CHECKLIST.md` for detailed troubleshooting steps.

