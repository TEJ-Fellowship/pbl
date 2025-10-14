# Discord Community Support Agent

A full-stack RAG (Retrieval-Augmented Generation) system for Discord community support with a modern React frontend and Node.js backend.

## 🏗️ Project Structure

```
DiscordCommunitySupportAgent/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Hero.jsx     # Main search interface
│   │   │   ├── Navbar.jsx   # Navigation
│   │   │   ├── CTA.jsx      # Call-to-action
│   │   │   └── ...
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                   # Node.js backend
│   ├── src/
│   │   ├── server.js        # Main RAG API server
│   │   ├── scraper.js       # Data scraping pipeline
│   │   ├── config/          # Configuration files
│   │   ├── services/        # Core services
│   │   └── utils/           # Utility functions
│   ├── data/                # Data storage
│   │   ├── raw/            # Raw scraped data
│   │   ├── processed/      # Processed embeddings
│   │   └── chroma/         # ChromaDB storage
│   ├── tests/              # Test files
│   └── docs/               # Documentation
│
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Gemini API key

### Installation

1. **Clone and navigate to project:**
```bash
cd DiscordCommunitySupportAgent
```

2. **Install server dependencies:**
```bash
cd server
npm install
```

3. **Install client dependencies:**
```bash
cd ../client
npm install
```

4. **Set up environment variables:**
```bash
cd ../server
cp env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Running the Application

1. **Start the server:**
```bash
cd server
npm start
```

2. **Start the client (in a new terminal):**
```bash
cd client
npm run dev
```

3. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔧 Available Scripts

### Server Scripts
```bash
npm start          # Start the RAG API server
npm run dev        # Start in development mode
npm run scrape     # Run data scraping pipeline
npm test           # Run tests
npm run test:api   # Test API endpoints
npm run test:gemini # Test Gemini AI integration
```

### Client Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 📡 API Endpoints

### Main Server
- `GET /` - API information
- `GET /api/health` - Health check with search status
- `POST /api/search` - Hybrid search with RAG
- `POST /api/server-context` - Update server context

## 🔍 Features

### Frontend (React + Vite)
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Search**: Instant search with loading states
- **AI Integration**: Direct connection to RAG backend
- **Source Display**: Expandable source documents
- **Markdown Support**: Rich text formatting for AI responses

### Backend (Node.js + Express)
- **Hybrid Search**: Combines semantic and keyword search
- **RAG Pipeline**: Retrieval-Augmented Generation for accurate responses
- **ChromaDB Integration**: Vector database for embeddings
- **Gemini AI**: Google's advanced language model
- **Web Scraping**: Automated Discord documentation scraping
- **Cross-encoder Reranking**: Improved search result quality

## 📊 Data Flow

1. **Scraping**: Discord support pages → Raw data
2. **Processing**: Text chunking → Embeddings
3. **Storage**: ChromaDB vector database
4. **Search**: Hybrid search (semantic + keyword)
5. **Generation**: RAG with Gemini AI
6. **Response**: Contextual, accurate answers

## 🧪 Testing

The project includes comprehensive tests for all major components:

- RAG system functionality
- API endpoint testing
- Gemini AI integration
- Database operations
- Search algorithms

## 🔧 Configuration

### Server Configuration
- `src/config/index.js` - Main configuration
- `src/config/database.js` - ChromaDB settings
- `src/config/gemini.js` - AI model settings

### Client Configuration
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration

## 📝 Environment Variables

Create a `.env` file in the server directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
CHROMA_DB_PATH=./data/chroma
SCRAPER_DELAY=1000
MAX_CHUNK_SIZE=700
CHUNK_OVERLAP=50
```

## 🎯 Usage

1. **Search for Help**: Use the search bar to ask Discord-related questions
2. **View AI Answers**: Get contextual, AI-generated responses
3. **Check Sources**: Expand source documents to see where information came from
4. **Server Context**: The system adapts responses based on server type and purpose

## 🚨 Troubleshooting

### Common Issues

1. **Server won't start**: Check if port 3001 is available
2. **Client can't connect**: Ensure server is running on port 3001
3. **No search results**: Run `npm run scrape` to populate the database
4. **API errors**: Check your Gemini API key in the `.env` file

### Getting Help

- Check the server logs for detailed error messages
- Ensure all dependencies are installed
- Verify your Gemini API key is valid
- Check that the data directory has the necessary files

## 📈 Performance

- **Search Speed**: Sub-second response times
- **Accuracy**: High relevance scores with hybrid search
- **Scalability**: Designed to handle multiple concurrent users
- **Memory**: Efficient vector storage with ChromaDB

## 🔒 Security

- CORS enabled for client-server communication
- Environment variables for sensitive data
- Input validation and sanitization
- Rate limiting on API endpoints

## 📚 Documentation

- `server/docs/` - Server documentation
- `client/README.md` - Client-specific documentation
- API documentation available at `/api/health` endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
