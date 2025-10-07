# Stripe Customer Support Agent - Backend

A Node.js backend for the Stripe Customer Support Agent with AI-powered chat capabilities using Gemini API.

## Features

- **AI-Powered Chat**: Interactive chat interface with Stripe documentation
- **Vector Search**: Semantic search through Stripe documentation
- **AI Provider**: Gemini API integration
- **Web Scraping**: Automated Stripe documentation ingestion
- **REST API**: Support ticket management endpoints

## Chat Application

### 🤖 **AI-Powered Chat Interface**

```bash
npm run chat
# or
node src/chat.js
```

- Uses Gemini 2.0-flash for AI responses
- Keyword-based search (no embedding API needed)
- Full AI-powered responses with source citations
- Interactive command-line interface

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

```bash
cp env.example .env
# Edit .env with your API keys
```

3. **Required Environment Variables:**

```env
# For Gemini chat
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=gemini
```

4. **Scrape and ingest Stripe documentation:**

```bash
npm run scrape    # Scrape Stripe docs
npm run ingest    # Create vector embeddings
```

5. **Start chatting:**

```bash
npm run chat    # Start AI chat
```

## API Endpoints

- `GET /` - Server status
- `GET /api/tickets` - Get all support tickets
- `POST /api/tickets` - Create a new support ticket

## Project Structure

```
Backend/
├── src/
│   ├── chat.js                 # AI-powered chat interface
│   ├── scraper.js              # Web scraper
│   └── ingest.js               # Vector store creation
├── data/
│   ├── vector_store.json       # Vector embeddings
│   └── stripe_docs/            # Scraped documentation
├── index.js                    # Main server file
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Development

The server uses `nodemon` for automatic restarts during development.

## Getting API Keys

### Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/welcome)
2. Sign in with your Google account
3. Click "Get API Key" and create a new key
4. Add to your `.env` file
