# LangChain Batch Chat System

A robust document ingestion and chat system built with LangChain, Gemini embeddings, and vector storage.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the working batch chat (recommended)
npm start

# Or run the original version
npm run original

# Debug the system
npm run debug
```

## 📁 System Structure

### Core Files

- `working-batch-chat.js` - **Main application** (recommended)
- `batch-chat.js` - Original version (for comparison)
- `debug-system.js` - System debugging tool

### Key Components

- `src/ingestion/workingBatchIngestion.js` - Document processing with fallback
- `src/storage/workingVectorStore.js` - Vector store with timeout handling
- `src/chat/geminiChat.js` - Chat interface
- `src/config/` - Configuration management

## 🎯 Features

### ✅ Working Version (Recommended)

- **Timeout handling**: 10-second timeout with 2 retries
- **Fallback search**: Text-based search when API fails
- **Local document caching**: Documents stored for offline search
- **Robust error handling**: Graceful degradation
- **Interactive commands**: Full chat interface with debug tools

### 📊 Available Commands

- `ingest` - Load documents from directory or files
- `stats` - View system statistics
- `test-search` - Test search functionality
- `show-docs` - Display all available documents
- `debug` - System debug information
- `history` - Chat history
- `quit` - Exit application

## 🔧 Configuration

Ensure your `.env` file contains:

```env
GEMINI_API_KEY=your_api_key_here
```

## 🐛 Troubleshooting

If you encounter issues:

1. **API Timeouts**: The system automatically falls back to text-based search
2. **Configuration Issues**: Run `npm run debug` to diagnose
3. **Document Loading**: Check file paths and permissions

## 📈 Performance

The working version includes:

- **Caching**: Search results cached for faster subsequent queries
- **Batch Processing**: Documents processed in small batches
- **Rate Limiting**: Built-in delays to prevent API overload
- **Fallback Search**: Works even when API is unavailable

## 🎉 Success!

Your system is now clean and optimized. Use `npm start` to run the working version with all the improvements!
