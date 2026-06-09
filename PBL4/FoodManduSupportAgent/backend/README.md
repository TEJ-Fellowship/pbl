# Foodmandu Support Agent - Backend

A robust Node.js/Express backend for the Foodmandu Support Agent using RAG (Retrieval-Augmented Generation) with Pinecone and Google Gemini.

## Features

- 🤖 AI-powered chat support using Google Gemini
- 🔍 Semantic search with Pinecone vector database
- 💾 MongoDB for chat history storage
- ✅ Comprehensive error handling and validation
- 📊 Request logging and performance tracking
- 🏥 Health check endpoints
- 🔒 Environment variable validation

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Pinecone account and API key
- Google Gemini API key

## Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file with:**
   - MongoDB connection URI
   - Pinecone API key and index name
   - Google Gemini API key

## Running the Server

### Development mode (with auto-reload):

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Root

- `GET /` - API information and available endpoints

### Health Check

- `GET /api/health` - Server and database health status

### Chat

- `POST /api/chat` - Send a question and get an AI-generated answer
  ```json
  {
    "question": "How do I track my order?"
  }
  ```

### Chat History

- `GET /api/chat/history?limit=10&skip=0` - Get chat history with pagination

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   └── qacontrollers.js       # Request handlers
│   ├── middlewares/
│   │   ├── errorHandler.js        # Error handling middleware
│   │   └── validateRequest.js     # Request validation
│   ├── models/
│   │   └── Chat.js                # MongoDB schema
│   ├── retriverQA/
│   │   └── retriever.js           # Pinecone & Gemini integration
│   ├── routes/
│   │   └── qaRoutes.js            # API routes
│   ├── utils/
│   │   └── validateEnv.js         # Environment validation
│   └── index.js                   # App entry point
├── .env.example                   # Environment template
├── package.json
└── README.md
```

## Error Handling

The backend includes comprehensive error handling:

- Input validation
- API error handling
- Database error handling
- Global error middleware
- Helpful error messages in development mode

## Logging

All requests are logged with:

- HTTP method
- Route path
- Status code
- Processing time

## Environment Variables

| Variable                | Description               | Required                  |
| ----------------------- | ------------------------- | ------------------------- |
| `PORT`                  | Server port               | No (default: 5000)        |
| `NODE_ENV`              | Environment mode          | No (default: development) |
| `CORS_ORIGIN`           | Allowed CORS origin       | No (default: \*)          |
| `MONGO_URI`             | MongoDB connection string | Yes                       |
| `PINECONE_API_KEY`      | Pinecone API key          | Yes                       |
| `PINECONE_INDEX_NAME`   | Pinecone index name       | Yes                       |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key     | Yes                       |

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "question": "How do I track my order?",
    "answer": "...",
    "chatId": "...",
    "timestamp": "2025-10-14T..."
  },
  "meta": {
    "sectionsFound": 3,
    "processingTime": "1234ms"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Development Tips

1. **Check server health:**

   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Test chat endpoint:**

   ```bash
   curl -X POST http://localhost:5000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"question": "How do I place an order?"}'
   ```

3. **Monitor logs:** All requests and errors are logged to console

## Troubleshooting

### Server won't start

- Check if all environment variables are set correctly
- Verify MongoDB is running and accessible
- Ensure Pinecone API key is valid

### Chat responses are slow

- This is normal for the first request (Pinecone initialization)
- Check your internet connection
- Verify Gemini API quota

### Database connection failed

- Check MongoDB URI format
- Ensure MongoDB is running
- Verify network access to MongoDB

## License

ISC
