# Shopify Merchant Support Agent

A Tier 2 AI-powered support agent for Shopify merchants with hybrid RAG (Retrieval-Augmented Generation) capabilities.

## 🚀 Quick Start

### Prerequisites

- Node.js (>=18.17.0)
- MongoDB (local or cloud)
- Gemini API Key
- Pinecone API Key

### Installation

1. **Backend Setup**

   ```bash
   cd backend
   npm install
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

### Environment Configuration

The backend requires a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/shopify_support

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=shopify-support
```

### Running the Application

#### Option 1: Use the startup scripts

- **Windows**: Double-click `start-servers.bat`
- **Linux/Mac**: Run `./start-servers.sh`

#### Option 2: Manual startup

1. **Start Backend** (Terminal 1):

   ```bash
   cd backend
   PORT=3000 node server.js
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔧 API Endpoints

- `POST /api/session` - Create a new chat session
- `POST /api/chat` - Send a message to the AI agent
- `GET /api/history/:sessionId` - Get conversation history
- `POST /api/feedback` - Submit feedback for a message
- `DELETE /api/chat/:sessionId` - Clear conversation history

## 🛠️ Troubleshooting

### Connection Refused Errors

If you see `ERR_CONNECTION_REFUSED` errors:

1. **Check if backend is running**:

   ```bash
   curl http://localhost:3000/health
   ```

2. **Verify port configuration**:

   - Backend should run on port 3000
   - Frontend should run on port 5173 (Vite default)

3. **Check environment variables**:
   - Ensure `.env` file exists in backend directory
   - Verify all required API keys are set

### Port Conflicts

If port 3000 is already in use:

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill //PID <PID> //F
```

## 📁 Project Structure

```
├── backend/           # Express.js API server
│   ├── config/        # Database and service configurations
│   ├── controllers/   # API route handlers
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── src/           # Core application logic
│   └── server.js      # Main server file
├── frontend/          # React.js frontend
│   ├── src/           # React components and logic
│   └── public/        # Static assets
└── docs/              # Documentation
```

## 🔍 Features

- **Hybrid Search**: Combines semantic and keyword search
- **Conversation Memory**: Maintains context across messages
- **Source Citations**: Shows sources for AI responses
- **Feedback System**: Collects user feedback on responses
- **Real-time Chat**: WebSocket-like experience with HTTP polling
