# Shopify Merchant Support Agent - Architecture Flow for "Who is Donald Trump" Query

## High-Level Architecture Diagram

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend Layer"
        UI[React Chat Interface<br/>localhost:5173]
        UI --> |User types: "who is donald trump"| SEND[Send Message Handler]
    end

    %% API Gateway Layer
    subgraph "Backend API Layer"
        API[Express.js Server<br/>localhost:3000]
        SEND --> |POST /api/chat| API
        API --> CHAT[Chat Controller]
    end

    %% Core Processing Layer
    subgraph "Core Processing Layer"
        CHAT --> INTENT[Intent Classification Service]
        INTENT --> |General Knowledge Query| WEB_DECISION{Web Search Decision}

        WEB_DECISION --> |Low Confidence<br/>General Knowledge| WEB_TOOL[Web Search Tool]
        WEB_DECISION --> |High Confidence<br/>Shopify Related| RAG[Hybrid RAG System]

        WEB_TOOL --> DDG[DuckDuckGo API]
        WEB_TOOL --> WIKI[Wikipedia API]

        RAG --> PINECONE[Pinecone Vector DB]
        RAG --> FLEX[FlexSearch Keyword DB]
    end

    %% AI Processing Layer
    subgraph "AI Processing Layer"
        WEB_TOOL --> |Search Results| GEMINI[Google Gemini AI<br/>Response Generation]
        RAG --> |Retrieved Context| GEMINI

        GEMINI --> |Generated Response| CONFIDENCE[Confidence Scoring]
        CONFIDENCE --> |Final Answer| RESPONSE[Response Assembly]
    end

    %% Data Storage Layer
    subgraph "Data Storage Layer"
        MONGODB[(MongoDB<br/>Conversation Storage)]
        PINECONE[(Pinecone<br/>Vector Embeddings)]
        FLEX[(FlexSearch<br/>Keyword Index)]
    end

    %% External Services
    subgraph "External Services"
        DDG[DuckDuckGo<br/>Instant Answer API]
        WIKI[Wikipedia<br/>Article API]
        GEMINI[Google Gemini<br/>AI Model]
    end

    %% Response Flow
    RESPONSE --> |JSON Response| API
    API --> |Stream Response| UI
    UI --> |Display Answer| USER[User Sees Response]

    %% Data Persistence
    CHAT --> |Save Conversation| MONGODB
    CHAT --> |Store Message| MONGODB

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef ai fill:#fff3e0
    classDef storage fill:#e8f5e8
    classDef external fill:#ffebee

    class UI,SEND frontend
    class API,CHAT,INTENT backend
    class WEB_DECISION,WEB_TOOL,RAG,GEMINI,CONFIDENCE,RESPONSE ai
    class MONGODB,PINECONE,FLEX storage
    class DDG,WIKI external
```

## Detailed Flow Explanation for "Who is Donald Trump" Query

### 1. **User Input Processing**

- User types "who is donald trump" in React chat interface
- Frontend sends POST request to `/api/chat` endpoint
- Message includes sessionId for conversation tracking

### 2. **Intent Classification & Decision Making**

- **Intent Classification Service** analyzes the query
- Detects this as a **general knowledge query** (not Shopify-related)
- Pattern matching: `/^who is/i` triggers general knowledge classification
- Query doesn't contain "shopify", "ecommerce", or "store" keywords

### 3. **Tool Selection Logic**

- **MCP Orchestrator** decides which tools to use
- For general knowledge queries, **Web Search Tool** is prioritized
- System bypasses internal RAG system since query is not Shopify-related
- Web Search Tool is selected as primary tool

### 4. **Web Search Execution**

- **Web Search Tool** performs parallel searches:
  - **DuckDuckGo Instant Answer API**: Gets quick factual information
  - **Wikipedia API**: Retrieves detailed biographical information
- Both APIs are called simultaneously for faster response
- Results are deduplicated and ranked by relevance

### 5. **AI Response Generation**

- Search results are passed to **Google Gemini AI**
- Gemini processes the web search results
- Generates a comprehensive answer about Donald Trump
- Includes source citations and confidence scoring

### 6. **Response Assembly & Delivery**

- **Confidence Scoring** evaluates response quality
- Response includes:
  - Generated answer text
  - Source citations (DuckDuckGo, Wikipedia)
  - Confidence score
  - MCP tool usage metadata
- JSON response sent back to frontend

### 7. **Frontend Display**

- React interface renders the response
- Shows answer with source citations
- Displays confidence score
- Provides feedback options (thumbs up/down)

### 8. **Data Persistence**

- Conversation and message stored in MongoDB
- Session tracking maintained for follow-up questions
- Analytics data collected for system improvement

## Why This Architecture Works

### **Intelligent Query Routing**

- System recognizes non-Shopify queries and routes them appropriately
- Avoids unnecessary internal knowledge base searches
- Prioritizes external sources for general knowledge

### **Hybrid Search Strategy**

- Combines multiple external APIs for comprehensive coverage
- DuckDuckGo provides quick facts, Wikipedia provides detailed context
- Parallel processing reduces response time

### **Context-Aware Processing**

- Maintains conversation context for follow-up questions
- Tracks user preferences and technical level
- Enables multi-turn conversations

### **Confidence-Based Decision Making**

- System evaluates its own confidence in responses
- Adjusts tool selection based on confidence levels
- Provides transparency to users about answer quality

### **Scalable Architecture**

- Microservices approach allows independent scaling
- External API integration provides real-time information
- Modular design enables easy addition of new tools

## Key Components Interaction

1. **Frontend** ↔ **Backend API**: RESTful communication
2. **Chat Controller** ↔ **Intent Service**: Query analysis
3. **MCP Orchestrator** ↔ **Web Search Tool**: Tool selection
4. **Web Search Tool** ↔ **External APIs**: Information retrieval
5. **Gemini AI** ↔ **Search Results**: Response generation
6. **MongoDB** ↔ **All Components**: Data persistence

This architecture ensures that general knowledge queries like "who is donald trump" are handled efficiently by leveraging external knowledge sources while maintaining the system's primary focus on Shopify merchant support.
