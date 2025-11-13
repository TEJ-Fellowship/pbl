# 🍔 Foodmandu Support Agent

An intelligent support agent for Foodmandu (Nepal's leading food delivery platform) with **TRUE Model Context Protocol (MCP)** implementation.

## ✨ Features

- 🤖 **AI-Powered Support** - RAG-based Q&A system using Pinecone + Gemini
- 🔧 **16 MCP Tools** - Order tracking, weather checks, address validation, and more
- 🌐 **Dual Interface** - Works with both Claude Desktop (MCP) and Web Browser (HTTP)
- 🇳🇵 **Bilingual** - English & Nepali (नेपाली) support
- 📍 **Location-Aware** - Kathmandu Valley coverage and regional insights
- 🎯 **Intent Classification** - Smart query routing to appropriate tools
- 📊 **Analytics** - Track support metrics and problem areas

---

## 🚀 Quick Start

### 1. Start Web Application

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 2. Start MCP Server (for Claude Desktop)

```bash
cd backend
npm run mcp-server
```

See **[MCP Quick Start Guide](backend/MCP_QUICKSTART.md)** for Claude Desktop setup.

---

## 🎯 Model Context Protocol (MCP)

This project implements **TRUE MCP** using the official `@modelcontextprotocol/sdk`.

### What is MCP?

MCP is a standardized protocol for connecting AI assistants (like Claude) to external tools and data sources using JSON-RPC 2.0 over stdio.

### Quick Test

```bash
# Test with MCP Inspector
cd backend
npm run mcp-inspect
```

### Documentation

- 📚 **[Full MCP Documentation](backend/src/mcp/README_MCP.md)**
- 🚀 **[Quick Start Guide](backend/MCP_QUICKSTART.md)**
- 🧪 **[Testing Guide](backend/src/mcp/TEST_MCP.md)**

### Available MCP Tools (16)

<details>
<summary>Click to expand tool list</summary>

#### Order Tracking
- `get_order_status` - Get order status
- `get_order_details` - Full order information
- `get_location_tracking` - Track delivery person
- `calculate_eta` - Estimate arrival time
- `get_driver_info` - Driver details
- `get_progress_tracking` - Order progress stages
- `get_route_info` - Delivery route

#### Support Tools
- `check_weather_delay` - Weather impact on delivery
- `validate_address` - Kathmandu address validation
- `check_payment_status` - eSewa/Khalti status
- `web_search_restaurant` - Restaurant information

#### Regional & Cultural
- `check_festival_schedule` - Nepali festival dates
- `suggest_festival_food` - Festival food suggestions
- `get_regional_preferences` - Regional food preferences
- `get_current_weather` - Current weather
- `suggest_weather_based_food` - Weather-based recommendations

</details>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TOOL CORE LOGIC                           │
│                  (16 MCP Tools)                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   MCP Server    │     │   HTTP Server   │
│ (JSON-RPC/stdio)│     │   (REST API)    │
└─────────────────┘     └─────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Claude Desktop  │     │  React Web App  │
└─────────────────┘     └─────────────────┘
```

### Key Components

- **RAG System** - Pinecone vector DB + Gemini embeddings
- **Intent Classifier** - Routes queries to appropriate tools
- **MCP Server** - TRUE protocol implementation (stdio/JSON-RPC)
- **HTTP API** - Web frontend interface
- **Shared Tool Executor** - Consistent logic across interfaces

---

## 📦 Tech Stack

### Backend
- **Node.js** + Express
- **@modelcontextprotocol/sdk** - Official MCP implementation
- **Pinecone** - Vector database
- **Google Gemini** - LLM & embeddings
- **MongoDB** - Chat history & analytics
- **Cheerio** - Web scraping

### Frontend
- **React** + Vite
- **Leaflet** - Map visualization
- **Axios** - API client

---

## 🛠️ Development

### Project Structure

```
FoodManduSupportAgent/
├── backend/
│   ├── src/
│   │   ├── mcp/
│   │   │   ├── mcpServer.js          # TRUE MCP server ⭐
│   │   │   ├── toolExecutor.js       # Shared tool logic
│   │   │   ├── server.js             # HTTP wrapper
│   │   │   └── tools/                # 16 tool implementations
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── retriverQA/               # RAG system
│   │   ├── scraper/                  # Data collection
│   │   └── embeddings/               # Vector injection
│   ├── package.json
│   └── MCP_QUICKSTART.md
├── frontend/
│   └── src/
└── README.md
```

### Scripts

```bash
# Backend
npm run dev          # Start HTTP server (web app)
npm run mcp-server   # Start MCP server (Claude Desktop)
npm run mcp-inspect  # Test with MCP Inspector

# Data Pipeline
node src/scraper/foodmanduScraper.js       # Scrape website
node src/embeddings/foodmanduEmbeddings.js # Generate embeddings
```

---

## 🎓 How It Works

### 1. Data Collection & Injection

```
Scrape Foodmandu → Clean Text → Chunk (2000 chars) 
→ Generate Embeddings → Store in Pinecone
```

### 2. Query Processing (Web App)

```
User Query → Intent Classification → MCP Tool or RAG
→ Gemini Response → User
```

### 3. MCP Integration (Claude Desktop)

```
Claude Query → MCP tools/call (JSON-RPC) → Tool Execution
→ Structured Response → Claude formats naturally
```

---

## 🧪 Testing

### Test HTTP API
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"How to order food?","language":"en"}'
```

### Test MCP Server
```bash
npm run mcp-inspect
# Opens http://localhost:6000
```

### Test in Claude Desktop
1. Configure `claude_desktop_config.json`
2. Restart Claude
3. Ask: "Check order FM100001"

See **[Test Guide](backend/src/mcp/TEST_MCP.md)** for comprehensive testing.

---

## 📊 Features Breakdown

### Tier 1: Basic RAG ✅
- ✅ Web scraping from Foodmandu
- ✅ Vector embeddings (Gemini)
- ✅ Semantic search (Pinecone)
- ✅ Bilingual support (EN/NP)

### Tier 2: Production RAG ✅
- ✅ Hybrid search (semantic + keyword + topic)
- ✅ React UI with chat interface
- ✅ Conversation memory
- ✅ Location-aware responses
- ✅ Real-time order tracking

### Tier 3: MCP + Advanced ✅
- ✅ **TRUE MCP implementation** (stdio/JSON-RPC)
- ✅ 16 production-ready tools
- ✅ Intent classification
- ✅ Multi-turn conversations
- ✅ Smart escalation (tickets)
- ✅ Analytics dashboard

### Tier 4: Enterprise (In Progress)
- ⏳ Real Foodmandu API integration
- ⏳ WhatsApp bot
- ⏳ SMS notifications

---

## 🔐 Environment Variables

Create `.env` in `backend/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/foodmandu-support

# Vector Database
PINECONE_API_KEY=your-key-here
PINECONE_INDEX_NAME=foodmandu-support
PINECONE_DIMENSION=768

# AI
GOOGLE_GEMINI_API_KEY=your-key-here

# Server
PORT=5000
NODE_ENV=development
```

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! See [MCP Documentation](backend/src/mcp/README_MCP.md) for adding new tools.

---

## 📞 Support

- **Issues:** GitHub Issues
- **MCP Docs:** [README_MCP.md](backend/src/mcp/README_MCP.md)
- **Quick Start:** [MCP_QUICKSTART.md](backend/MCP_QUICKSTART.md)

---

**Built with ❤️ for Nepal's food delivery ecosystem**

🍔 Foodmandu | 🤖 AI Support | 🔧 TRUE MCP




