# NeuralVault LangChain Quick Reference

## 🚀 Quick Commands

### Setup Commands

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit environment file
nano .env  # or use your preferred editor
```

### Start System

```bash
npm start
```

### Debug System

```bash
npm run debug
```

## 💬 Chat Commands

| Command       | Description     | Example            |
| ------------- | --------------- | ------------------ |
| `ingest`      | Load documents  | `You: ingest`      |
| `stats`       | View statistics | `You: stats`       |
| `history`     | Chat history    | `You: history`     |
| `test-search` | Test search     | `You: test-search` |
| `show-docs`   | Show documents  | `You: show-docs`   |
| `debug`       | System debug    | `You: debug`       |
| `quit`        | Exit system     | `You: quit`        |

## 🔧 Configuration

### Essential .env Settings

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=models/text-embedding-004
DEBUG=true
```

### File Types Supported

- **PDF**: `.pdf`
- **Text**: `.txt`, `.text`
- **Markdown**: `.md`, `.markdown`
- **Word**: `.docx`
- **Excel**: `.xlsx`, `.xls`
- **CSV**: `.csv`
- **JSON**: `.json`

## 📊 System Status

### Check System Health

```
You: debug
```

### View Performance

```
You: stats
```

### Test Functionality

```
You: test-search
```

## 🐛 Common Issues

| Issue                 | Solution                          |
| --------------------- | --------------------------------- |
| API timeout           | Normal - uses fallback search     |
| Module not found      | Run `npm install`                 |
| API key error         | Check `.env` file                 |
| File processing error | Check file format and permissions |

## 📁 Folder Structure

```
neuralVault/apps/langchain/
├── working-batch-chat.js    # Main app
├── debug-system.js          # Debug tool
├── src/                     # Source code
├── docs/                    # Documentation
├── data/                    # Sample documents
└── cache/                   # System cache
```

---

**Quick Reference - Keep this handy for daily use!** 📚
