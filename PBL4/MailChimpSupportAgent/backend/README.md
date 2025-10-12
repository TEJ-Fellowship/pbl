# MailChimp Support Agent - Enhanced Tier-1 Implementation

This project implements a comprehensive MailChimp support agent with enhanced chunking, FAQ interface, and structured data processing.

## 🚀 Features Completed

### ✅ Step 1: Web Scraping
- Scrapes Getting Started, Campaign Creation, and List Management guides
- Extracts structured content with headings and sections
- Rate-limited scraping to respect MailChimp's servers

### ✅ Step 2: Chunking (600 tokens optimized)
- Splits content into 600-token chunks with 100-token overlap
- Preserves document structure and metadata
- Optimized for step-by-step instructions

### ✅ Step 3: Pinecone Integration
- Stores chunks in Pinecone vector database
- Metadata includes: `{category: campaigns/automation/lists, difficulty: beginner/advanced}`
- Fallback to local storage if Pinecone unavailable

### ✅ Step 4: Terminal FAQ Interface
- Interactive terminal interface for common questions
- Pre-built questions: "How do I import contacts?", "What's a good open rate?"
- Custom question support
- Real-time search and answer generation using Gemini AI

### ✅ Step 5: Enhanced Chunking with Structure Preservation
- **Screenshot Preservation**: Extracts and references screenshots in context
- **Numbered Lists**: Preserves step-by-step instructions as structured lists
- **Bullet Points**: Maintains key points and features
- **Enhanced Metadata**: Better categorization and difficulty assessment

## 📁 Project Structure

```
backend/
├── src/
│   ├── scraper.js           # Web scraping (Step 1)
│   ├── ingest.js            # Basic chunking & Pinecone (Steps 2-3)
│   ├── enhanced-ingest.js   # Enhanced chunking (Step 5)
│   └── faq-interface.js     # Terminal FAQ interface (Step 4)
├── config/
│   └── config.js            # Environment configuration
├── data/
│   ├── mailerbyte_docs/
│   │   └── scraped.json     # Scraped content
│   └── processed_chunks/
│       ├── chunks.json      # Basic chunks
│       └── enhanced_chunks.json # Enhanced chunks
└── package.json
```

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   Create `.env` file in backend directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=mailerbyte-rag
   CHUNK_SIZE=600
   CHUNK_OVERLAP=100
   RATE_LIMIT_DELAY=1000
   ```

3. **Run the Pipeline**
   ```bash
   # Step 1: Scrape MailChimp docs
   npm run scrape
   
   # Step 2-3: Basic ingestion
   npm run ingest
   
   # Step 5: Enhanced ingestion (recommended)
   npm run enhanced-ingest
   
   # Step 4: Start FAQ interface
   npm run faq
   ```

## 🎯 Usage Examples

### Terminal FAQ Interface
```bash
npm run faq
```

**Pre-built Questions:**
- 📧 How do I import contacts?
- 📊 What's a good open rate?
- 🎯 How do I create a campaign?
- 📋 How do I manage my audience?
- 🤖 How do I set up automation?
- 📈 How do I view reports?

**Custom Questions:**
- "How do I set up email automation?"
- "What are the best practices for subject lines?"
- "How do I segment my audience?"

### Enhanced Chunking Features

The enhanced ingestion preserves:

1. **Screenshots**: References images with descriptions
2. **Numbered Lists**: Step-by-step instructions
3. **Bullet Points**: Key features and tips
4. **Structure**: Maintains document hierarchy

**Example Enhanced Chunk:**
```
Original: "To create a campaign, follow these steps: 1. Choose campaign type 2. Select audience 3. Design email"

Enhanced: "To create a campaign, follow these steps: 1. Choose campaign type 2. Select audience 3. Design email

[Step-by-step instructions:]
To create a campaign:
1. Choose campaign type
2. Select audience  
3. Design email

[Screenshots in this section:]
1. Campaign creation dashboard
2. Audience selection interface
```

## 🔧 Configuration Options

### Chunking Parameters
- `CHUNK_SIZE`: Token limit per chunk (default: 600)
- `CHUNK_OVERLAP`: Overlap between chunks (default: 100)
- `BATCH_SIZE`: Pinecone upload batch size (default: 50)

### Rate Limiting
- `RATE_LIMIT_DELAY`: Delay between requests (default: 1000ms)

### AI Models
- **Embeddings**: Google Gemini text-embedding-004
- **Generation**: Google Gemini 1.5 Flash

## 📊 Metadata Structure

Each chunk includes enhanced metadata:

```json
{
  "category": "campaigns|automation|lists|getting-started|general",
  "difficulty": "beginner|intermediate|advanced",
  "hasScreenshots": true|false,
  "hasNumberedLists": true|false,
  "hasBulletPoints": true|false,
  "stepCount": 5,
  "pointCount": 3,
  "isInstructional": true|false,
  "hasVisuals": true|false,
  "chunkIndex": 0,
  "totalChunks": 3
}
```

## 🚀 Advanced Features

### Smart Categorization
- **Automation**: Workflows, triggers, sequences
- **Campaigns**: Email creation, sending, templates
- **Lists**: Audience management, imports, segments
- **Getting Started**: Setup, basics, onboarding

### Difficulty Assessment
- **Beginner**: Introductions, basic setup
- **Intermediate**: Standard features, common tasks
- **Advanced**: API, integrations, complex workflows

### Structure Preservation
- Maintains numbered lists as step-by-step instructions
- Preserves bullet points for key information
- References screenshots with descriptions
- Keeps document hierarchy intact

## 🔍 Search & Retrieval

The FAQ interface uses semantic search to find relevant chunks and generates contextual answers using:

1. **Vector Search**: Finds semantically similar content
2. **Metadata Filtering**: Uses category and difficulty
3. **Context Assembly**: Combines multiple relevant chunks
4. **AI Generation**: Creates comprehensive answers with Gemini

## 📈 Performance

- **Scraping**: ~3-5 seconds per page with rate limiting
- **Chunking**: ~1000 chunks per minute
- **Pinecone Upload**: ~50 chunks per batch
- **FAQ Response**: ~2-3 seconds per question

## 🛡️ Error Handling

- Graceful fallback to local storage if Pinecone unavailable
- Rate limiting to respect external APIs
- Comprehensive error logging and user feedback
- Retry mechanisms for failed operations

## 🔄 Next Steps

This implementation provides a solid foundation for:
- Multi-modal support (images, videos)
- Advanced automation workflows
- Integration with MailChimp API
- Real-time data updates
- Multi-language support

## 📝 Notes

- All scraped content respects MailChimp's terms of service
- Rate limiting prevents server overload
- Enhanced chunking preserves instructional structure
- FAQ interface provides immediate value for common questions

