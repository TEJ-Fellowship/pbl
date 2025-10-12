# Shopify Merchant Support Agent - Web Chat Interface

A professional AI-powered chat interface for Shopify merchant support, featuring hybrid RAG (Retrieval-Augmented Generation) with conversation history and source citations.

## 🚀 Quick Start

### Automated Setup

```bash
# Run the setup script
./setup.sh
```

### Manual Setup

1. **Backend Setup**

```bash
cd backend
npm install
# Update .env with your API keys
npm run api
```

2. **Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

3. **Access the Interface**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## ✨ Features

### 🤖 AI Chat Interface

- **Hybrid RAG**: Combines semantic and keyword search for better results
- **Conversation History**: Persistent chat sessions with MongoDB storage
- **Token-Aware Context**: Smart context windowing to optimize performance
- **Confidence Scoring**: AI confidence levels with detailed factors

### 📚 Source Citations

- **Expandable Sources**: Click to view all referenced documentation
- **Relevance Scores**: See how relevant each source is to your query
- **Search Types**: Understand whether semantic or keyword search found each source
- **Direct Links**: Click through to original documentation

### 💻 Code Support

- **Syntax Highlighting**: Beautiful code blocks with language detection
- **Copy Buttons**: One-click copy for all code snippets
- **Inline Code**: Properly formatted inline code with highlighting
- **Multiple Languages**: Support for JavaScript, Python, JSON, and more

### 👍 Feedback System

- **Thumbs Up/Down**: Rate response quality
- **Visual Feedback**: Clear indication of your feedback
- **Persistent State**: Feedback remembered during session

### 🎨 Modern UI

- **Responsive Design**: Works perfectly on mobile and desktop
- **Professional Styling**: Clean, modern interface with Tailwind CSS
- **Smooth Animations**: Polished user experience
- **Accessibility**: Keyboard navigation and screen reader support

## 🏗️ Architecture

### Backend (Express.js + MongoDB)

```
backend/
├── src/
│   ├── chat.js              # Terminal chat (original)
│   ├── hybrid-retriever.js  # Hybrid search implementation
│   ├── memory/              # Conversation memory management
│   └── utils/               # Embeddings and utilities
├── controllers/
│   └── chatController.js    # API endpoints for web interface
├── models/                  # MongoDB schemas
├── routes/                  # Express routes
└── server.js               # API server
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── App.jsx             # Main chat component
│   ├── App.css             # Chat interface styles
│   └── utils/
│       └── markdown.js     # Markdown parsing
└── public/                 # Static assets
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=shopify-merchant-support

# Optional Configuration
GEMINI_MODEL=gemini-1.5-flash
MONGODB_URI=mongodb://localhost:27017/shopify-support
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### API Keys Setup

1. **Gemini API**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Pinecone API**: Get from [Pinecone Console](https://app.pinecone.io/)
3. **MongoDB**: Use local MongoDB or MongoDB Atlas

## 📡 API Endpoints

### Chat API

```http
POST /api/chat
Content-Type: application/json

{
  "message": "How do I create a product in Shopify?",
  "sessionId": "session_1234567890_abc123"
}
```

**Response:**

```json
{
  "answer": "To create a product in Shopify...",
  "confidence": {
    "score": 85,
    "level": "High",
    "factors": ["Multiple relevant sources found", "High relevance scores"]
  },
  "sources": [
    {
      "id": 1,
      "title": "Products API Documentation",
      "url": "https://shopify.dev/api/admin-rest/products",
      "category": "api",
      "score": 0.9234,
      "searchType": "semantic",
      "content": "Product creation content..."
    }
  ],
  "tokenUsage": {
    "totalTokens": 4500,
    "messageTokens": 2000,
    "documentTokens": 2500
  },
  "truncated": false
}
```

### History API

```http
GET /api/history/:sessionId
```

**Response:**

```json
{
  "messages": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "How do I create a product?",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_124",
      "role": "assistant",
      "content": "To create a product in Shopify...",
      "timestamp": "2024-01-15T10:30:05Z",
      "confidence": {...},
      "sources": [...]
    }
  ],
  "conversation": {
    "id": "conv_123",
    "sessionId": "session_1234567890_abc123",
    "title": "Product Creation Help",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:05Z"
  }
}
```

## 🚀 Deployment

### Development

```bash
# Terminal 1: Backend
cd backend
npm run api

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production

```bash
# Build frontend
cd frontend
npm run build

# Serve with backend
cd backend
# Serve static files from frontend/dist
npm run api
```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
EXPOSE 3000
CMD ["npm", "run", "api"]
```

## 🔍 How It Works

### 1. Query Processing

- User sends message via React frontend
- Backend processes query with hybrid search
- Retrieves relevant documentation from Pinecone
- Applies token-aware context windowing

### 2. AI Generation

- Context + conversation history sent to Gemini
- AI generates response with source citations
- Confidence score calculated based on multiple factors
- Response stored in MongoDB with metadata

### 3. Frontend Display

- Response rendered with syntax highlighting
- Source citations displayed in expandable panel
- Code blocks get copy buttons
- Feedback buttons for user rating

## 🛠️ Development

### Adding New Features

1. **Backend API Changes**

   - Update `controllers/chatController.js`
   - Add new routes in `routes/route.js`
   - Update MongoDB models if needed

2. **Frontend UI Changes**
   - Modify `src/App.jsx` for new components
   - Update `src/App.css` for styling
   - Add new utilities in `src/utils/`

### Testing

```bash
# Test backend API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","sessionId":"test123"}'

# Test frontend
npm run dev
# Open http://localhost:5173
```

## 📊 Performance

### Optimizations

- **Token Window Management**: Prevents context overflow
- **Hybrid Search**: Better relevance than single search method
- **Caching**: MongoDB conversation caching
- **Lazy Loading**: Frontend components load on demand

### Metrics

- **Response Time**: ~2-5 seconds per query
- **Token Usage**: Optimized to stay under limits
- **Memory Usage**: Efficient conversation management
- **Search Quality**: High relevance scores with hybrid approach

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**

   - Check backend server is running on port 3000
   - Verify CORS settings in backend
   - Check API keys in .env file

2. **No Response from AI**

   - Verify Gemini API key is valid
   - Check Pinecone index has data
   - Run `npm run ingest` to populate data

3. **Frontend Not Loading**

   - Check Node.js version (18+ required)
   - Clear browser cache
   - Verify all dependencies installed

4. **Database Connection Issues**
   - Check MongoDB is running
   - Verify MONGODB_URI in .env
   - Check network connectivity

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run api
```

## 📚 Documentation

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Shopify Merchant Support Agent system.

## 🙏 Acknowledgments

- Built with React, Express.js, and MongoDB
- Powered by Google Gemini AI
- Vector search by Pinecone
- Styled with Tailwind CSS
- Icons by Lucide React
