# Shopify Merchant Support Agent - Setup Guide

## Overview

This is a comprehensive Shopify Merchant Support Agent with MCP (Model Context Protocol) tools and multi-turn conversation capabilities. The system includes both frontend and backend components with advanced features like hybrid RAG (Retrieval-Augmented Generation), context management, and tool integration.

## Features

- 🤖 **Multi-turn Conversations**: Context-aware conversations with follow-up detection
- 🔧 **MCP Tools Integration**: Calculator, Web Search, Shopify Status, Date/Time, Code Validator
- 🔍 **Hybrid RAG**: Semantic + keyword search with confidence scoring
- 📊 **Conversation Management**: History tracking, statistics, and cleanup
- 🎯 **Clarification System**: Handles ambiguous queries with API suggestions
- 💾 **Persistent Storage**: MongoDB for conversation and message storage

## Prerequisites

- Node.js (>=18.17.0)
- MongoDB (running locally or accessible remotely)
- Google Gemini API key
- Pinecone API key (for vector search)
- Optional: Web Search API key

## Quick Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/shopify-support-agent

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Pinecone Vector Database Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=shopify-merchant-support

# Embeddings Configuration
EMBEDDINGS_PROVIDER=local

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:5173

# Optional: Web Search API (for web search tool)
WEB_SEARCH_API_KEY=your_web_search_api_key_here
WEB_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Data Ingestion (First Time Only)

```bash
cd backend
npm run enhanced-ingest
```

This will:

- Scrape Shopify documentation
- Process and chunk the content
- Create embeddings
- Store in Pinecone vector database

### 4. Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

## API Endpoints

The backend provides the following API endpoints:

- `GET /health` - Health check
- `GET /api/` - API information
- `POST /api/chat` - Main chat endpoint with MCP tools and multi-turn support
- `GET /api/history/:sessionId` - Get conversation history
- `GET /api/history` - Get chat history list
- `POST /api/clarify` - Process clarification responses
- `GET /api/stats/:sessionId` - Get conversation statistics
- `DELETE /api/cleanup/:sessionId` - Clean up conversation state

## Testing

Run the API test suite to verify everything is working:

```bash
cd backend
node test-api.js
```

This will test all endpoints and verify:

- ✅ Server health
- ✅ Chat functionality with MCP tools
- ✅ Multi-turn conversation features
- ✅ Database operations
- ✅ Error handling

## Architecture

### Backend Components

1. **Chat Controller** (`controllers/chatController.js`)

   - Main chat processing logic
   - MCP tools integration
   - Multi-turn conversation management
   - Confidence scoring

2. **MCP Orchestrator** (`src/mcp/mcpOrchestrator.js`)

   - Tool selection and execution
   - Available tools:
     - Calculator Tool
     - Web Search Tool
     - Shopify Status Tool
     - Date/Time Tool
     - Code Validator Tool

3. **Multi-Turn Manager** (`src/multi-turn-conversation.js`)

   - Context management
   - Follow-up detection
   - Clarification handling
   - Context compression

4. **Hybrid Retriever** (`src/hybrid-retriever.js`)
   - Semantic + keyword search
   - Result fusion and ranking
   - Confidence scoring

### Frontend Components

1. **Main App** (`src/App.jsx`)

   - Chat interface
   - Message handling
   - API integration
   - Real-time updates

2. **Chat History Sidebar** (`src/components/ChatHistorySidebar.jsx`)

   - Conversation management
   - Session switching
   - History display

3. **Clarifying Question** (`src/components/ClarifyingQuestion.jsx`)
   - API clarification interface
   - User preference handling

## Configuration

### Environment Variables

| Variable               | Description               | Required           |
| ---------------------- | ------------------------- | ------------------ |
| `MONGODB_URI`          | MongoDB connection string | Yes                |
| `GEMINI_API_KEY`       | Google Gemini API key     | Yes                |
| `PINECONE_API_KEY`     | Pinecone API key          | Yes                |
| `PINECONE_INDEX_NAME`  | Pinecone index name       | Yes                |
| `PORT`                 | Server port               | No (default: 3000) |
| `FRONTEND_URL`         | Frontend URL for CORS     | No                 |
| `WEB_SEARCH_API_KEY`   | Web search API key        | No                 |
| `WEB_SEARCH_ENGINE_ID` | Search engine ID          | No                 |

### MCP Tools Configuration

Each MCP tool can be configured independently:

- **Calculator Tool**: No configuration needed
- **Web Search Tool**: Requires web search API credentials
- **Shopify Status Tool**: Uses Shopify's public status API
- **Date/Time Tool**: No configuration needed
- **Code Validator Tool**: No configuration needed

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network accessibility

2. **Gemini API Error**

   - Verify API key is correct
   - Check API quota and limits
   - Ensure model name is valid

3. **Pinecone Error**

   - Verify API key and index name
   - Check index exists and is accessible
   - Ensure embeddings are properly configured

4. **Frontend Proxy Error**
   - Check vite.config.js proxy configuration
   - Ensure backend is running on correct port
   - Verify CORS settings

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
```

## Development

### Adding New MCP Tools

1. Create tool class in `src/mcp/`
2. Implement required methods
3. Register in `mcpOrchestrator.js`
4. Update tool selection logic

### Extending Multi-Turn Features

1. Modify `multi-turn-conversation.js`
2. Update conversation state schema
3. Add new context management features
4. Update frontend components

## Production Deployment

### Backend Deployment

- Use PM2 or similar process manager
- Set up proper logging
- Configure environment variables
- Set up monitoring

### Frontend Deployment

- Build for production: `npm run build`
- Serve static files
- Configure reverse proxy
- Set up CDN if needed

## Support

For issues and questions:

1. Check the troubleshooting section
2. Run the test suite
3. Check logs for errors
4. Verify configuration

## License

This project is part of the PBL (Project-Based Learning) series.
