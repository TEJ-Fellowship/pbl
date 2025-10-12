# Shopify Merchant Support Agent - Tier 2 Implementation

## 🚀 Overview

This is a **Tier 2** implementation of the Shopify Merchant Support Agent featuring:

- **Conversation Memory**: Sliding window of last 8 messages (4 turns) with MongoDB persistence
- **Context Windowing**: Token counting and intelligent truncation using js-tiktoken
- **Web UI**: Modern React chat interface with Tailwind CSS
- **Source Citations**: Expandable panel with code copy functionality
- **Feedback System**: "Was this helpful?" buttons for continuous improvement

## 🏗️ Architecture

### Backend (Express.js + MongoDB)

```
├── config/
│   ├── mongodb.js          # MongoDB connection
│   └── pinecone.js         # Pinecone vector DB config
├── controllers/
│   └── ChatController.js   # API endpoints
├── models/
│   └── Conversation.js     # MongoDB schema
├── routes/
│   └── route.js            # Express routes
├── src/
│   ├── memory/
│   │   └── MongoDBBufferWindowMemory.js  # LangChain memory with MongoDB
│   ├── context/
│   │   └── ContextWindowManager.js       # Token counting & truncation
│   ├── services/
│   │   └── EnhancedChatService.js        # Main chat service
│   └── hybrid-retriever.js              # Existing hybrid search
└── server.js              # Express server
```

### Frontend (React + Tailwind CSS)

```
├── src/
│   ├── components/
│   │   ├── SourceCitations.jsx    # Sources panel
│   │   └── LoadingDots.jsx        # Loading animation
│   ├── App.jsx                    # Main chat interface
│   ├── index.css                  # Tailwind styles
│   └── main.jsx                   # React entry point
├── tailwind.config.js             # Tailwind configuration
└── postcss.config.js             # PostCSS configuration
```

## 🔧 Key Features

### 1. Conversation Memory

- **BufferWindowMemory**: Maintains last 8 messages (4 turns)
- **MongoDB Persistence**: Conversations survive server restarts
- **Session Management**: Unique session IDs for each conversation
- **Cross-session Context**: Previous Q&A context included in retrieval

### 2. Context Windowing

- **Token Counting**: Uses js-tiktoken for accurate token counting
- **Smart Truncation**: Prioritizes recent messages and high-relevance chunks
- **6000 Token Limit**: Configurable maximum context size
- **Efficient Management**: Balances conversation history with retrieved docs

### 3. Web UI Features

- **Modern Design**: Clean, responsive interface with Tailwind CSS
- **Real-time Chat**: Instant message sending and receiving
- **Source Citations**: Expandable panel showing document sources
- **Code Highlighting**: Syntax highlighting with react-syntax-highlighter
- **Copy Functionality**: One-click copying of messages and code
- **Feedback System**: Thumbs up/down for response quality
- **Loading States**: Smooth loading animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0+
- MongoDB (local or cloud)
- Gemini API key
- Pinecone API key

### Backend Setup

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your API keys
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/shopify_support
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=shopify-support
PORT=3000
```

## 📡 API Endpoints

### POST /api/chat

Send a message and get AI response with memory context.

**Request:**

```json
{
  "message": "How do I create a product using the API?",
  "sessionId": "optional-session-id"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "response": "To create a product using the Shopify API...",
    "sources": [
      {
        "title": "Product API Documentation",
        "url": "https://shopify.dev/docs/api/admin-rest/products",
        "score": 0.95,
        "chunk": "Creating products via API..."
      }
    ],
    "sessionId": "uuid-session-id",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "contextStats": {
      "messageTokens": 150,
      "docTokens": 800,
      "totalTokens": 950,
      "utilizationPercent": 15.8
    }
  }
}
```

### GET /api/history/:sessionId

Retrieve conversation history for a session.

### POST /api/feedback

Update feedback for a specific message.

### DELETE /api/chat/:sessionId

Clear conversation history for a session.

### POST /api/session

Generate a new session ID.

## 🧠 Mental Visualization

### Conversation Flow

```
User Message → Memory Load → Hybrid Search → Context Window → LLM → Response → Memory Save
     ↓              ↓            ↓            ↓         ↓        ↓         ↓
  Session ID    Last 8 msgs   Pinecone +   Token      Gemini   Sources   MongoDB
                from MongoDB  FlexSearch   Count      AI       + Stats   Storage
```

### Context Management

```
Total Context (6000 tokens max)
├── Conversation History (sliding window)
│   ├── Recent messages (priority)
│   └── Older messages (truncated if needed)
├── Retrieved Documents (top 6 by relevance)
│   ├── High-score chunks (priority)
│   └── Lower-score chunks (truncated if needed)
└── Response Buffer (1000 tokens reserved)
```

### Memory Architecture

```
MongoDB Collection: conversations
├── sessionId (indexed)
├── messages[] (last 8)
│   ├── role: 'user' | 'assistant'
│   ├── content: string
│   ├── timestamp: Date
│   ├── sources: array
│   └── feedback: object
├── createdAt: Date
└── updatedAt: Date
```

## 🎯 Key Benefits

1. **Persistent Memory**: Conversations continue across sessions
2. **Intelligent Context**: Token-aware truncation prevents overflow
3. **Source Transparency**: Users can verify information sources
4. **Feedback Loop**: Continuous improvement through user feedback
5. **Modern UX**: Professional chat interface with smooth animations
6. **Scalable Architecture**: Clean separation of concerns

## 🔍 Technical Highlights

- **LangChain Integration**: Uses @langchain/memory for conversation management
- **Token Precision**: js-tiktoken for accurate GPT token counting
- **Hybrid Search**: Combines semantic (Pinecone) + keyword (FlexSearch)
- **Real-time UI**: React with modern hooks and state management
- **Responsive Design**: Mobile-friendly Tailwind CSS styling
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Production Ready

This implementation is production-ready with:

- ✅ Comprehensive error handling
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Environment-based configuration
- ✅ Database indexing for performance
- ✅ Responsive UI design
- ✅ Loading states and user feedback
- ✅ Clean code architecture

The system successfully implements all Tier 2 requirements with professional-grade code quality and user experience.
