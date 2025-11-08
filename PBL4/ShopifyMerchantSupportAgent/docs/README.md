# Shopify Merchant Support Agent

A sophisticated AI-powered support system for Shopify merchants, featuring multi-turn conversations, MCP tools integration, and hybrid RAG (Retrieval-Augmented Generation) capabilities.

## 🚀 Features

### Core Capabilities

- **Multi-turn Conversations**: Maintains context across conversation turns
- **Hybrid RAG**: Combines semantic search (Pinecone) with keyword search (FlexSearch)
- **MCP Tools Integration**: Calculator, Shopify Status Checker, Date/Time operations, Code Validator, Web Search
- **API Clarification**: Intelligent detection of ambiguous API questions
- **Context Compression**: Efficient memory management for long conversations
- **Real-time Status Monitoring**: Check Shopify service status and outages

### Frontend Features

- Modern React-based chat interface
- Real-time message streaming
- Chat history management
- Source citations and confidence scoring
- MCP tool results visualization
- Responsive design with Tailwind CSS

### Backend Features

- Express.js API server
- MongoDB for conversation storage
- Pinecone vector database for semantic search
- Google Gemini AI integration
- Comprehensive error handling
- CORS configuration for development

## 🛠️ Technology Stack

### Backend

- **Node.js** (18.17.0+)
- **Express.js** - Web framework
- **MongoDB** - Database
- **Pinecone** - Vector database
- **Google Gemini AI** - Language model
- **FlexSearch** - Keyword search
- **Mongoose** - MongoDB ODM

### Frontend

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Syntax Highlighter** - Code display

## 📋 Prerequisites

- Node.js 18.17.0 or higher
- MongoDB (local or cloud)
- Google Gemini API key
- Pinecone API key
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ShopifyMerchantSupportAgent
```

### 2. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment Variables

Edit `backend/.env` with your API keys:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
MONGODB_URI=mongodb://localhost:27017/shopify-support-agent

# Optional
GEMINI_MODEL=gemini-1.5-flash
PINECONE_INDEX_NAME=shopify-merchant-support
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### 4. Start the Services

#### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

#### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

### 5. Access the Application

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📖 Documentation Structure

This documentation is organized into the following folders for easy navigation:

### 📁 Getting Started (`getting-started/`)
- **SETUP_GUIDE.md** - Comprehensive setup instructions
- **SETUP_SHOPIFY_OAUTH.md** - Shopify OAuth configuration guide
- **requirements.md** - Project requirements and specifications

### 🏗️ Architecture (`architecture/`)
- **MCP_CLIENT_SERVER_ARCHITECTURE.md** - MCP protocol implementation details
- **DATA_INGESTION_MENTAL_MODEL.md** - Data ingestion architecture
- **MCP_TOOLS_EXPLAINED.md** - MCP tools documentation

### 💻 Implementation (`implementation/`)
- **IMPLEMENTATION_SUMMARY.md** - Overall implementation overview
- **MCP_IMPLEMENTATION_SUMMARY.md** - MCP implementation details
- **TIER3_OPTIMIZATION_IMPLEMENTATION.md** - Tier 3 optimization guide

### ⚙️ Features (`features/`)
- **Caching Documentation** - Semantic caching implementation and fixes
  - CACHE_FIX_FINAL.md
  - CACHING_COMPLETE_EXPLANATION.md
  - CACHING_FIX_EXPLAINED.md
  - SEMANTIC_CACHE_EXPLAINED.md
  - SEMANTIC_CACHING_SUMMARY.md
- **Memory Management** - Memory cleanup and user experience
  - MEMORY_CLEANUP_AND_USER_EXPERIENCE.md
  - MEMORY_CLEANUP_SIMPLE_VISUAL.md

### 🔧 Troubleshooting (`troubleshooting/`)
- **RACE_CONDITION_EXPLAINED.md** - Race condition issues and solutions
- **test_fixes.md** - Test-related fixes and improvements
- **terminalissue/** - Terminal-related issue documentation

### 📊 Analysis (`analysis/`)
- **LATENCY_ANALYSIS_AND_OPTIMIZATION.md** - Performance analysis
- **Compatibility/** - Implementation compatibility analysis
- **tier 3/** - Tier 3 architecture and flow analysis
- **tier3 analysis/** - Comprehensive tier 3 analysis and recommendations

## 🔧 Manual Setup

If you prefer manual setup:

### Backend Setup

```bash
cd backend
npm install
npm run enhanced-ingest  # Ingest Shopify documentation
npm run api              # Start the API server
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 📚 API Endpoints

### Chat Endpoints

- `POST /api/chat` - Send a message
- `POST /api/clarify` - Handle clarification responses
- `GET /api/history/:sessionId` - Get conversation history
- `GET /api/history` - Get chat history list
- `GET /api/stats/:sessionId` - Get conversation statistics
- `DELETE /api/cleanup/:sessionId` - Clean up conversation state

### Health Check

- `GET /health` - Server health status

## 🛠️ MCP Tools

The system includes several MCP (Model Context Protocol) tools:

### Calculator Tool

- Mathematical expressions
- Shopify fee calculations
- Currency and percentage operations

### Shopify Status Tool

- Real-time service status monitoring
- Incident detection and reporting
- Maintenance notifications

### Date/Time Tool

- Time zone conversions
- Date calculations
- Business day operations

### Code Validator Tool

- JavaScript/TypeScript validation
- Liquid template validation
- Syntax checking

### Web Search Tool

- Real-time web search
- Source verification
- Recent information retrieval

## 🔍 Multi-Turn Conversation Features

### Context Management

- **Follow-up Detection**: Automatically detects follow-up questions
- **User Preference Tracking**: Remembers API preferences and technical level
- **Context Compression**: Efficiently manages long conversations
- **Ambiguity Detection**: Identifies questions needing clarification

### Conversation Flow

1. **Initial Query**: User asks a question
2. **Context Analysis**: System analyzes conversation history
3. **Search & Retrieval**: Hybrid search finds relevant information
4. **AI Processing**: Gemini generates contextual response
5. **Tool Integration**: MCP tools enhance the response
6. **Response Delivery**: Enhanced answer sent to frontend

## 🎯 Usage Examples

### Basic Questions

```
"How do I create a product in Shopify?"
"What are the different Shopify APIs available?"
"How do I set up payment processing?"
```

### Multi-turn Conversations

```
User: "How do I create a product?"
AI: [Provides detailed product creation steps]
User: "What about variants?"
AI: [Builds on previous context, explains variants]
User: "And inventory management?"
AI: [Continues conversation with inventory context]
```

### MCP Tool Integration

```
User: "Calculate 2.9% + $0.30 on $100"
AI: [Uses calculator tool to compute: $3.20]

User: "Is Shopify down right now?"
AI: [Uses status tool to check current service status]

User: "What's the current time in PST?"
AI: [Uses date/time tool to provide current time]
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start

- Check if MongoDB is running
- Verify API keys in `.env` file
- Ensure all dependencies are installed

#### Frontend Connection Issues

- Verify backend is running on port 3000
- Check CORS configuration
- Ensure proxy settings in `vite.config.js`

#### Search Not Working

- Verify Pinecone API key and index name
- Check if data ingestion completed successfully
- Ensure embeddings are properly configured

#### MCP Tools Not Responding

- Check tool initialization logs
- Verify tool-specific API keys (if required)
- Review error messages in console

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## 📊 Performance Optimization

### Backend Optimization

- Connection pooling for MongoDB
- Caching for frequent queries
- Compression for large responses
- Rate limiting for API endpoints

### Frontend Optimization

- Lazy loading for components
- Virtual scrolling for long conversations
- Debounced input handling
- Optimized re-renders

## 🔒 Security Considerations

- Environment variables for sensitive data
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Rate limiting for API endpoints
- Secure MongoDB connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Create an issue with detailed information
4. Include environment details and steps to reproduce

## 🔄 Updates and Maintenance

### Regular Maintenance

- Update dependencies regularly
- Monitor API rate limits
- Review and optimize performance
- Update documentation

### Data Updates

- Re-run ingestion for updated Shopify docs
- Update Pinecone index with new data
- Refresh embeddings if needed

---

**Happy coding! 🎉**
