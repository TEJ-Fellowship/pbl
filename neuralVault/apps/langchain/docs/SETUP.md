# NeuralVault LangChain Setup Guide

## 🚀 Quick Setup

### Prerequisites

- **Node.js**: Version 18 or higher ([Download here](https://nodejs.org/))
- **npm**: Package manager (comes with Node.js)
- **Google Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Step 1: Install Dependencies

```bash
# Navigate to the project directory
cd neuralVault/apps/langchain

# Install all dependencies
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your settings
nano .env
```

### Step 3: Set Up API Key

Edit your `.env` file:

```env
# Google AI API Configuration
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7

# LangChain Configuration
CHUNK_SIZE=500
CHUNK_OVERLAP=50
EMBEDDING_MODEL=models/text-embedding-004

# Application Configuration
DEBUG=true
LOG_LEVEL=debug
```

### Step 4: Test the System

```bash
# Start the system
npm start

# Or run diagnostics
npm run debug
```

## 🎯 Usage

### Start the System

```bash
npm start
```

### Ingest Documents

```
You: ingest
📁 Ingestion Options:
1. Ingest directory
2. Ingest specific files
3. Cancel
Choose option (1-3): 1
Enter directory path: ./data
```

### Chat with Documents

```
You: What is this document about?
AI: Based on the ingested documents, this appears to be about...
```

---

**Your NeuralVault LangChain system is now ready to use!** 🎉
