# 🚀 Stripe Support API

A production-ready REST API for the Stripe Customer Support Agent with hybrid search, conversation memory, and AI-powered responses.

## 📋 API Endpoints

### Health & Status

- `GET /api/health` - Basic health check
- `GET /api/health/status` - Detailed system status

### Chat

- `POST /api/chat` - Send message and get AI response
- `GET /api/chat/history/:sessionId` - Get conversation history
- `POST /api/chat/session` - Create new chat session
- `DELETE /api/chat/session/:sessionId` - Delete chat session

## 🔧 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
# Edit .env with your API keys
```

### 3. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### 4. Test API

```bash
npm run test:api
```

## 📡 API Usage Examples

### Send a Message

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create a payment intent with Stripe?",
    "sessionId": "optional-session-id",
    "userId": "user123"
  }'
```

### Get Conversation History

```bash
curl http://localhost:5000/api/chat/history/session_123?limit=10&offset=0
```

### Create New Session

```bash
curl -X POST http://localhost:5000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "context": {"project": "stripe_integration"}
  }'
```

## 🏗️ Architecture

```
Backend/
├── controllers/          # Request handlers
│   ├── chatController.js
│   └── healthController.js
├── services/            # Business logic
│   ├── chatService.js
│   └── memoryService.js
├── routes/              # API routes
│   ├── chat.js
│   └── health.js
├── middleware/          # Middleware functions
│   ├── errorHandler.js
│   └── validation.js
├── config/             # Configuration
└── tests/              # API tests
```

## 🔍 Features

- **Hybrid Search**: PostgreSQL BM25 + Pinecone semantic search
- **Conversation Memory**: Multi-turn conversation support
- **AI Integration**: Gemini 2.0-flash for responses
- **Error Handling**: Comprehensive error management
- **Validation**: Input validation and sanitization
- **Health Checks**: System monitoring endpoints

## 🧪 Testing

```bash
# Test all components
npm test

# Test specific components
npm run test:api
npm run test:hybrid
npm run test:memory
```

## 📊 Response Format

### Successful Chat Response

```json
{
  "success": true,
  "data": {
    "message": "AI response text...",
    "sources": [
      {
        "content": "Source content...",
        "metadata": {...},
        "similarity": 0.85
      }
    ],
    "confidence": 0.87,
    "sessionId": "session_123",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuration

Required environment variables:

- `GEMINI_API_KEY` - Google Gemini API key
- `PINECONE_API_KEY` - Pinecone API key
- `PINECONE_INDEX_NAME` - Pinecone index name
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS

## 🚀 Deployment

The API is ready for deployment to:

- **Heroku**: Add `Procfile` with `web: npm start`
- **Railway**: Automatic deployment with `package.json`
- **AWS**: Use PM2 or Docker
- **Vercel**: Serverless deployment

## 📈 Monitoring

- Health endpoint: `/api/health`
- Status endpoint: `/api/health/status`
- Logs: Structured logging with timestamps
- Error tracking: Comprehensive error handling
