# LangChain Data Ingestion & Chat Application

A comprehensive data ingestion and retrieval-augmented generation (RAG) application built with LangChain and Google's Gemini AI. This application provides an interactive chat interface for querying documents using AI-powered semantic search.

## 🚀 Features

- **Multi-Format Document Processing**: Support for PDF, TXT, MD, DOCX, XLSX, XLS, CSV, and JSON files
- **Excel File Support**: Process Excel workbooks with multiple sheets
- **Vector Storage**: Store document embeddings in memory vector store
- **Similarity Search**: Search through documents using semantic similarity
- **Retrieval-Augmented Chat**: Chat with AI using document context
- **Interactive Command-Line Interface**: Full-featured CLI with commands
- **Batch Processing**: Process entire directories or specific files
- **Chat History**: Track and review conversation history
- **Statistics**: View processing and chat statistics
- **Modular Architecture**: Clean, extensible code structure

## 📁 Project Structure

```
neuralVault/apps/langchain/
├── src/
│   ├── config/           # Configuration management
│   ├── ingestion/        # Document loading and processing
│   │   ├── processors/   # Document type processors (PDF, Excel, etc.)
│   │   ├── loaders/      # Document loaders
│   │   └── splitters/    # Text splitting utilities
│   ├── storage/          # Vector store operations
│   ├── chat/            # AI chat interface
│   └── utils/           # Logging and file utilities
├── docs/                # Documentation and sample files
├── batch-chat.js        # Main interactive application
├── test-batch.js        # Batch processing tests
└── package.json         # Dependencies and scripts
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- pnpm package manager
- Google Gemini API key

### Installation

1. **Navigate to the langchain app directory:**

   ```bash
   cd neuralVault/apps/langchain
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   CHUNK_SIZE=500
   CHUNK_OVERLAP=50
   EMBEDDING_MODEL=models/embedding-001
   DEBUG=false
   LOG_LEVEL=info
   ```

## 🎯 Usage

### Interactive Batch Chat Mode

```bash
node batch-chat.js
```

This starts an interactive chat session with the following commands:

- **`ingest`** - Ingest documents (directory or specific files)
- **`stats`** - View processing and chat statistics
- **`history`** - View chat history
- **`quit`** - Exit the application

### Document Ingestion

When you type `ingest`, you'll get options:

1. **Ingest directory** - Process all supported files in a directory
2. **Ingest specific files** - Process individual files
3. **Cancel** - Return to main menu

Example:

```
You: ingest
📁 Ingestion Options:
1. Ingest directory
2. Ingest specific files
3. Cancel
Choose option (1-3): 1
Enter directory path: ./docs
```

### Supported File Types

| File Type | Extension          | Features                        |
| --------- | ------------------ | ------------------------------- |
| PDF       | `.pdf`             | Multi-page document processing  |
| Text      | `.txt`, `.text`    | Plain text processing           |
| Markdown  | `.md`, `.markdown` | Formatted text processing       |
| Word      | `.docx`            | Word document processing        |
| Excel     | `.xlsx`, `.xls`    | Multi-sheet workbook processing |
| CSV       | `.csv`             | Tabular data processing         |
| JSON      | `.json`            | Structured data processing      |

### Chat with Documents

After ingesting documents, you can ask questions:

```
You: What is the main topic of the document?
AI: Based on the ingested documents, the main topic is...

You: Can you summarize the key points?
AI: Here are the key points from the documents...

You: What are the dates mentioned in the Excel file?
AI: The Excel file contains the following dates...
```

## 🔧 Configuration

### Environment Variables

| Variable             | Description                  | Default                |
| -------------------- | ---------------------------- | ---------------------- |
| `GEMINI_API_KEY`     | Your Google Gemini API key   | Required               |
| `GEMINI_MODEL`       | Gemini model to use          | `gemini-2.5-flash`     |
| `GEMINI_MAX_TOKENS`  | Maximum tokens for responses | `4096`                 |
| `GEMINI_TEMPERATURE` | Response creativity (0-1)    | `0.7`                  |
| `CHUNK_SIZE`         | Document chunk size          | `500`                  |
| `CHUNK_OVERLAP`      | Chunk overlap size           | `50`                   |
| `EMBEDDING_MODEL`    | Embedding model              | `models/embedding-001` |
| `DEBUG`              | Enable debug mode            | `false`                |
| `LOG_LEVEL`          | Logging level                | `info`                 |

### Document Processing Features

- **Multi-sheet Excel Support**: Process all sheets in Excel workbooks
- **Intelligent Chunking**: Configurable chunk size and overlap
- **Metadata Enrichment**: Automatic metadata addition (file type, source, timestamp)
- **Error Handling**: Graceful handling of unsupported or corrupted files
- **Progress Tracking**: Real-time processing status and statistics

## 🏗️ Architecture

### Core Components

1. **BatchChatApp (`batch-chat.js`)**

   - Main application class
   - Interactive command-line interface
   - Document ingestion management
   - Chat session handling

2. **BatchIngestion (`src/ingestion/batchIngestion.js`)**

   - Directory and file scanning
   - Multi-format document processing
   - Vector store initialization
   - Processing statistics

3. **DocumentProcessor (`src/ingestion/processors/documentProcessor.js`)**

   - File type detection and routing
   - Specialized processors for each file type
   - Text splitting and chunking
   - Metadata enrichment

4. **GeminiChat (`src/chat/geminiChat.js`)**

   - AI chat interface
   - Retrieval-augmented generation
   - Chat history management
   - Response generation

5. **VectorStoreManager (`src/storage/vectorStore.js`)**
   - Memory vector storage
   - Similarity search
   - Document retrieval
   - Embedding management

### Data Flow

1. **Document Discovery**: Scan directory → Find supported files
2. **Document Processing**: File → Loader → Processor → Chunks
3. **Vector Storage**: Chunks → Embeddings → Vector Store
4. **Query Processing**: User Question → Similarity Search → Relevant Chunks
5. **AI Response**: Question + Context → Gemini → Response

## 📊 Statistics and Monitoring

### Ingestion Statistics

- Processed files count
- Failed files count
- Total chunks created
- File-by-file breakdown

### Chat Statistics

- Total messages
- Total characters
- Average message length
- Oldest and newest messages

### Example Output

```
📄 Ingestion Statistics:
Processed Files: 6
Failed Files: 1
Total Chunks: 146

📁 Processed Files:
1. PEP_PREP Exercises List (1).xlsx (88 chunks)
2. sample.xlsx (1 chunks)
3. README.md (17 chunks)
4. sample.md (4 chunks)
5. sample.txt (3 chunks)
6. sample_langchain_doc.pdf (33 chunks)

📊 Chat Statistics:
Total Messages: 26
Total Characters: 2047
Average Message Length: 79
Oldest Message: 2025-08-21T14:38:22.412Z
Newest Message: 2025-08-21T14:45:12.789Z
```

## 🧪 Testing

### Run Tests

```bash
# Test batch processing
node test-batch.js

# Test specific functionality
node test-start.js
```

### Test Coverage

- Document ingestion (all file types)
- Vector storage and retrieval
- Chat functionality
- Error handling
- Statistics generation

## 🔧 Development

### Adding New Document Types

1. **Add processor method** in `src/ingestion/processors/documentProcessor.js`:

   ```javascript
   async processNewFormat(filePath, options = {}) {
     // Implementation
   }
   ```

2. **Update file type detection** in `src/ingestion/batchIngestion.js`:

   ```javascript
   case ".newformat":
     return await this.documentProcessor.processNewFormat(filePath);
   ```

3. **Update supported file types** in scanDirectory method

### Customizing Chat Behavior

Edit `src/chat/geminiChat.js` to modify:

- Prompt templates
- Response formatting
- Context handling
- History management

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**

   - Ensure `GEMINI_API_KEY` is set in `.env`
   - Verify the API key is valid and has proper permissions

2. **File Processing Errors**

   - Check file permissions and readability
   - Verify file format is supported
   - Check for corrupted files

3. **Excel File Issues**

   - Ensure `xlsx` package is installed
   - Check file is not password-protected
   - Verify file is not corrupted

4. **Memory Issues**
   - Reduce `CHUNK_SIZE` for large documents
   - Process files in smaller batches
   - Use smaller embedding models

### Debug Mode

Enable debug mode in `.env`:

```env
DEBUG=true
LOG_LEVEL=debug
```

## 📚 Resources

- [LangChain Documentation](https://js.langchain.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Vector Similarity Search](https://en.wikipedia.org/wiki/Vector_similarity_search)
- [XLSX Package](https://www.npmjs.com/package/xlsx)

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use semantic commit messages

## 📄 License

MIT License - see LICENSE file for details.

---

**Note**: This application is part of the NeuralVault project, designed to create an AI assistant that acts as an extension of your mind, instantly surfacing insights from your entire digital life through conversational AI.
