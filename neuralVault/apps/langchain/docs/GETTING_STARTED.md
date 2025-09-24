# Getting Started with NeuralVault LangChain

## 🎯 Welcome!

This guide will walk you through setting up the NeuralVault LangChain system from scratch. By the end, you'll have a fully functional AI document chat system.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **A Google account** (for Gemini API key)
- **Basic command line knowledge**
- **Text editor** (VS Code, nano, vim, etc.)

## 🚀 Step-by-Step Setup

### Step 1: Verify Your Environment

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check if you're in the right directory
pwd
# Should show: .../neuralVault/apps/langchain
```

**Expected Output:**

```
v18.17.0  # or higher
8.19.0    # or higher
/your/path/neuralVault/apps/langchain
```

### Step 2: Install Dependencies

```bash
# Clean install (recommended)
rm -rf node_modules package-lock.json
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Set Up Environment Variables

```bash
# Copy the environment template
cp env.example .env

# Verify the file was created
ls -la .env
```

### Step 4: Get Your Gemini API Key

1. **Visit Google AI Studio**:

   - Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key**:

   - Click "Create API Key"
   - Choose "Create API key in new project"
   - Copy the generated key (starts with `AIza...`)

3. **Add to .env file**:

   ```bash
   # Edit your .env file
   nano .env

   # Add your API key
   GEMINI_API_KEY=AIzaSyYourActualKeyHere
   ```

### Step 5: Test Your Setup

```bash
# Test the system
npm run debug
```

### Step 6: Start the System

```bash
# Start the main application
npm start
```

## 🎯 First Use

### Step 7: Ingest Documents

```
You: ingest
📁 Ingestion Options:
1. Ingest directory
2. Ingest specific files
3. Cancel
Choose option (1-3): 1
Enter directory path: ./data
```

### Step 8: Test Chat

```
You: What is this document about?
AI: Based on the ingested documents, this appears to be about...
```

## 🎉 Success!

If you've reached this point, your NeuralVault LangChain system is fully operational! You can now:

- **Ingest documents**: Use the `ingest` command
- **Chat with documents**: Ask questions about your content
- **View statistics**: Use the `stats` command
- **Debug issues**: Use the `debug` command

---

**Welcome to NeuralVault LangChain!** 🚀
