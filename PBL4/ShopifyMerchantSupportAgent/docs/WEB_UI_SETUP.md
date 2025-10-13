# Shopify Merchant Support Agent - Web UI

A modern React-based chat interface for the Shopify Merchant Support Agent with hybrid RAG (Retrieval-Augmented Generation) capabilities.

## Features

- 🤖 **AI-Powered Chat**: Interactive chat interface powered by Google Gemini AI
- 🔍 **Hybrid Search**: Combines semantic and keyword search for better results
- 📚 **Source Citations**: Expandable sources panel with relevance scores
- 💬 **Conversation History**: Persistent chat sessions with MongoDB
- 🎨 **Modern UI**: Built with React and Tailwind CSS
- ⚡ **Real-time Responses**: Fast, responsive chat experience

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create environment file**:
   Create a `.env` file in the backend directory with:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX_NAME=shopify-merchant-support
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```

4. **Start the backend server**:
   ```bash
   npm run server
   ```

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## API Endpoints

- `POST /api/chat` - Send a message and get AI response
- `GET /api/history/:sessionId` - Retrieve conversation history
- `GET /` - Basic health check

## Usage

1. **Start both servers** (backend on port 3000, frontend on port 5173)
2. **Open the web interface** in your browser
3. **Ask questions** about Shopify APIs, themes, products, orders, etc.
4. **View sources** by clicking on the sources link in responses
5. **Check confidence levels** displayed in the header

## Example Questions

- "How do I create products using the API?"
- "What are the REST API endpoints for orders?"
- "How to customize themes with Liquid?"
- "GraphQL Admin API authentication"
- "Shopify webhook setup"

## Technology Stack

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, MongoDB
- **AI**: Google Gemini AI
- **Search**: Pinecone Vector Database
- **Styling**: Tailwind CSS with custom Shopify theme

## Troubleshooting

- Ensure all environment variables are set correctly
- Check that MongoDB is running and accessible
- Verify Pinecone index has data (run `npm run ingest` if needed)
- Make sure both servers are running on correct ports
- Check browser console for any CORS or network errors
