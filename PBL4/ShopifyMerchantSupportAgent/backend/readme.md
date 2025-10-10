# Shopify Merchant Support Agent — Backend

A RAG-based support agent that scrapes Shopify documentation, chunks it, generates embeddings, stores them in Pinecone, and provides intelligent responses using Google's Gemini AI.

## Features

- **Web Scraping**: Automatically scrapes Shopify documentation
- **Intelligent Chunking**: Splits content while respecting code blocks
- **Vector Storage**: Stores embeddings in Pinecone for fast similarity search
- **RAG Pipeline**: Retrieves relevant context and generates responses with Gemini AI
- **Merchant Level Detection**: Automatically categorizes content by difficulty level

## Prerequisites

1. **Node.js** (>=18.17.0)
2. **Google Gemini API Key** - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. **Pinecone Account** - Sign up at [Pinecone](https://app.pinecone.io/)

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create environment file:**
   Create a `.env` file in the backend directory with:

   ```env
   # Gemini API Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash

   # Pinecone Configuration
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX_NAME=shopify-merchant-support

   # Embeddings Configuration
   EMBEDDINGS_PROVIDER=local
   ```

3. **Run the complete pipeline:**

   ```bash
   npm start
   ```

   This will:

   - Scrape Shopify documentation
   - Chunk and embed the content
   - Upload to Pinecone
   - Start the chat interface

## Manual Steps

If you prefer to run steps individually:

```bash
# 1. Scrape documentation
npm run scrape

# 2. Process and upload to Pinecone
npm run ingest

# 3. Start chat interface
npm run chat
```

## Architecture

- **`scraper.js`**: Scrapes Shopify documentation
- **`ingest.js`**: Chunks content, generates embeddings, uploads to Pinecone
- **`retriever.js`**: Queries Pinecone for relevant content
- **`chat.js`**: Main chat interface using Gemini AI
- **`config/pinecone.js`**: Pinecone client configuration

## Data Flow

1. **Scraping**: Documentation → JSON files
2. **Chunking**: Content → Text chunks with metadata
3. **Embedding**: Chunks → Vector embeddings (384 dimensions)
4. **Storage**: Embeddings → Pinecone vector database
5. **Retrieval**: Query → Similar vectors → Relevant context
6. **Generation**: Context + Query → AI response

## Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure both Gemini and Pinecone API keys are set
2. **Pinecone Connection**: Verify your Pinecone API key and index name
3. **Model Availability**: If Gemini model fails, the system will fallback to `gemini-1.5-flash`

### Environment Variables

| Variable              | Description                                             | Required |
| --------------------- | ------------------------------------------------------- | -------- |
| `GEMINI_API_KEY`      | Google Gemini API key                                   | Yes      |
| `GEMINI_MODEL`        | Gemini model name (default: gemini-1.5-flash)           | No       |
| `PINECONE_API_KEY`    | Pinecone API key                                        | Yes      |
| `PINECONE_INDEX_NAME` | Pinecone index name (default: shopify-merchant-support) | No       |
| `EMBEDDINGS_PROVIDER` | Embedding provider (default: local)                     | No       |

## File Structure

```
backend/
├── config/
│   ├── db.js
│   └── pinecone.js          # Pinecone configuration
├── controllers/
│   └── controller.js
├── data/
│   ├── chunks/              # Chunked content (for debugging)
│   └── shopify_docs/        # Scraped documentation
├── src/
│   ├── chat.js              # Main chat interface
│   ├── ingest.js            # Data ingestion to Pinecone
│   ├── retriever.js         # Pinecone query interface
│   ├── scraper.js           # Web scraping
│   └── utils/
│       ├── chunker.js       # Text chunking utilities
│       ├── cleaner.js       # Content cleaning
│       └── embeddings.js    # Local embedding generation
├── package.json
└── README.md
```
