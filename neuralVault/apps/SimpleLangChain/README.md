# Simple LangChain Demo

A simplified demonstration of essential LangChain concepts using PDF files, Gemini embeddings, and vector stores.

## 🎯 What This Demo Shows

This application demonstrates the core concepts of LangChain in a simple, easy-to-understand way:

1. **Document Loading** - How to load and parse PDF files
2. **Text Chunking** - Breaking documents into manageable pieces
3. **Embeddings** - Converting text to numerical vectors using Gemini
4. **Vector Storage** - Storing and retrieving document vectors
5. **Semantic Search** - Finding relevant content by meaning
6. **RAG (Retrieval-Augmented Generation)** - Combining search with AI generation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env` file with your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Add PDF Files

Create a `data` folder and add some PDF files:

```bash
mkdir data
# Add your PDF files to the data folder
```

### 4. Run the Demo

```bash
npm start
```

## 📁 Project Structure

```
SimpleLangChain/
├── pdf-loader.js            # PDF document loading
├── text-splitter.js         # Text chunking
├── vector-store.js          # Embeddings and vector storage
├── chat.js                  # RAG chat interface
├── langchain-demo.js        # Main application
├── package.json
└── README.md
```

## 🔧 Key Components

### PDFLoader

- Loads and parses PDF files
- Extracts text and metadata
- Creates LangChain Document objects

### TextSplitter

- Breaks documents into chunks
- Configurable chunk size and overlap
- Essential for embedding generation

### VectorStore

- Creates embeddings using Gemini
- Stores documents as vectors
- Performs semantic similarity search

### Chat

- Implements RAG (Retrieval-Augmented Generation)
- Combines document search with AI responses
- Demonstrates the complete RAG pipeline

## 🎮 Interactive Commands

When running the demo, you can use these commands:

- **Ask questions** - Get answers based on your documents
- `demo` - Show step-by-step RAG demonstration
- `compare` - Compare RAG vs simple chat responses
- `search <query>` - Perform semantic search
- `stats` - Show system statistics
- `help` - Show available commands
- `quit` - Exit the application

## 🧠 Understanding the Concepts

### 1. Document Processing

```
PDF File → Text Extraction → Document Object
```

### 2. Text Chunking

```
Large Document → Small Chunks (1000 chars each)
```

### 3. Embeddings

```
Text Chunks → Numerical Vectors (768 dimensions)
```

### 4. Vector Storage

```
Vectors → Searchable Database
```

### 5. Semantic Search

```
Query → Embedding → Similarity Search → Relevant Chunks
```

### 6. RAG Pipeline

```
Query → Search → Context → LLM → Answer
```

## 🔍 How It Works

1. **Load PDFs** - The system reads PDF files and extracts text
2. **Chunk Text** - Large documents are split into smaller, manageable pieces
3. **Create Embeddings** - Each chunk is converted to a numerical vector using Gemini
4. **Store Vectors** - Embeddings are stored in a vector database
5. **Search** - When you ask a question, the system finds similar chunks
6. **Generate Answer** - The relevant chunks are sent to Gemini to generate an answer

## 🎯 Learning Objectives

After running this demo, you'll understand:

- How to process PDF documents with LangChain
- The importance of text chunking for embeddings
- How embeddings enable semantic search
- The complete RAG pipeline
- The difference between simple chat and RAG

## 🛠️ Customization

You can modify the demo by:

- Changing chunk size in `SimpleTextSplitter`
- Adjusting the number of search results
- Modifying the prompt template in `SimpleChat`
- Adding different document types

## 📚 Next Steps

This demo provides a foundation for understanding LangChain. You can extend it by:

- Adding more document types (Word, Excel, etc.)
- Implementing different embedding models
- Using different vector stores (Pinecone, Weaviate, etc.)
- Adding conversation memory
- Implementing more sophisticated retrieval strategies

## 🤝 Contributing

This is a learning demo. Feel free to modify and experiment with the code to deepen your understanding of LangChain concepts!
