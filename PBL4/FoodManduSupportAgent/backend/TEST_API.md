# API Testing Guide

## Starting the Server

From the **backend** directory, run:

```bash
cd backend
npm start
```

Or using dev mode (with auto-reload):

```bash
npm run dev
```

## Testing Endpoints

### 1. Root Endpoint

```bash
curl http://localhost:5000/
```

Expected response:

```json
{
  "success": true,
  "message": "Welcome to Foodmandu Support Agent API",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "chat": "POST /api/chat",
    "history": "GET /api/chat/history"
  }
}
```

### 2. Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-14T...",
  "database": "connected",
  "environment": "development"
}
```

### 3. Chat Endpoint (POST)

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I place an order on Foodmandu?"}'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "question": "How do I place an order on Foodmandu?",
    "answer": "...",
    "chatId": "...",
    "timestamp": "..."
  },
  "meta": {
    "sectionsFound": 3,
    "processingTime": "1234ms"
  }
}
```

### 4. Chat History

```bash
curl "http://localhost:5000/api/chat/history?limit=5&skip=0"
```

Expected response:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 10,
    "limit": 5,
    "skip": 0,
    "hasMore": true
  }
}
```

## Postman Collection

You can import these into Postman:

1. **GET** `http://localhost:5000/` - Root
2. **GET** `http://localhost:5000/api/health` - Health Check
3. **POST** `http://localhost:5000/api/chat` - Send Chat
   - Body (JSON): `{"question": "Your question here"}`
4. **GET** `http://localhost:5000/api/chat/history?limit=10&skip=0` - Get History

## Common Issues

### Server won't start

- Make sure you're in the `backend` directory
- Check if `.env` file exists with all required variables
- Verify MongoDB is running and accessible

### Connection refused

- Server might not be running on port 5000
- Check if another process is using port 5000
- Try: `netstat -ano | findstr :5000` (Windows) or `lsof -i :5000` (Linux/Mac)

### Database errors

- Ensure MongoDB is running
- Check `MONGO_URI` in your `.env` file

## Running from Root Directory

If you want to run from the project root:

```bash
cd FoodManduSupportAgent
npm start --prefix backend
```

Or:

```bash
cd FoodManduSupportAgent/backend && npm start
```
