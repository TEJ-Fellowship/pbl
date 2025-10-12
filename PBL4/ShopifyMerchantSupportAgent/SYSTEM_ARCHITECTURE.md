# 🧠 Mental Visualization: Tier 2 Shopify Support Agent Architecture

## Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SHOPIFY SUPPORT AGENT - TIER 2                        │
│                        Conversation Memory + Context Windowing                   │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REACT UI      │    │   EXPRESS API   │    │   MONGODB       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Chat        │ │◄──►│ │ /api/chat   │ │◄──►│ │conversations│ │
│ │ Interface   │ │    │ │ /api/history│ │    │ │ collection  │ │
│ │             │ │    │ │ /api/feedback│ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │                 │
│ │ Sources     │ │    │ │ Chat        │ │    │                 │
│ │ Panel       │ │    │ │ Controller  │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CORE SERVICES                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Enhanced Chat   │    │ MongoDB Buffer  │    │ Context Window  │
│ Service         │    │ Window Memory   │    │ Manager         │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Process     │ │    │ │ Load Memory │ │    │ │ Token Count │ │
│ │ Message     │ │    │ │ Save Context│ │    │ │ Truncate    │ │
│ │             │ │    │ │ Clear       │ │    │ │ Prioritize  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            RETRIEVAL & AI LAYER                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Hybrid          │    │ Pinecone        │    │ Gemini AI       │
│ Retriever       │    │ Vector DB       │    │                 │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Semantic    │ │◄──►│ │ 1,339       │ │    │ │ Generate    │ │
│ │ Search      │ │    │ │ Vectors     │ │    │ │ Response    │ │
│ │             │ │    │ │             │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │                 │    │                 │
│ │ Keyword     │ │    │                 │    │                 │
│ │ Search      │ │    │                 │    │                 │
│ │ (FlexSearch)│ │    │                 │    │                 │
│ └─────────────┘ │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Conversation Memory Flow

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY MANAGEMENT                            │
└─────────────────────────────────────────────────────────────────┘

1. Load Conversation History (MongoDB)
   ├── Query by sessionId
   ├── Get last 8 messages (4 turns)
   └── Convert to LangChain format

2. Process Current Message
   ├── Add to conversation history
   ├── Apply context windowing
   └── Prepare for AI processing

3. Save Context (MongoDB)
   ├── Store user message
   ├── Store assistant response
   ├── Include sources and metadata
   └── Maintain sliding window (8 messages max)
```

## Context Windowing Process

```
Total Context Budget: 6000 tokens
├── Reserved for Response: 1000 tokens
├── Available for Context: 5000 tokens
│
├── Conversation History (Priority: Recent → Old)
│   ├── Most recent turn: 100% included
│   ├── Previous turns: Included if space allows
│   └── Older turns: Truncated or excluded
│
└── Retrieved Documents (Priority: High Score → Low Score)
    ├── Top 6 documents by relevance
    ├── High-score chunks: Full content
    ├── Medium-score chunks: Truncated if needed
    └── Low-score chunks: Excluded if space limited

Token Counting Process:
1. Count tokens in conversation history
2. Count tokens in retrieved documents
3. Apply truncation if total > 5000 tokens
4. Prioritize most recent + highest relevance
5. Format final context for LLM
```

## API Endpoints Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REST API LAYER                           │
└─────────────────────────────────────────────────────────────────┘

POST /api/chat
├── Input: { message, sessionId? }
├── Process: Enhanced Chat Service
├── Memory: Load conversation history
├── Search: Hybrid retrieval (Pinecone + FlexSearch)
├── Context: Apply windowing and token management
├── AI: Generate response with Gemini
├── Storage: Save to MongoDB
└── Output: { response, sources, sessionId, contextStats }

GET /api/history/:sessionId
├── Query: MongoDB by sessionId
├── Sort: By message timestamp
└── Output: { sessionId, messages[] }

POST /api/feedback
├── Input: { sessionId, messageIndex, feedback }
├── Update: MongoDB message feedback
└── Output: { success, message }

DELETE /api/chat/:sessionId
├── Action: Clear MongoDB conversation
└── Output: { success, message }

POST /api/session
├── Generate: New UUID session ID
└── Output: { sessionId }
```

## Frontend Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT UI LAYER                           │
└─────────────────────────────────────────────────────────────────┘

App.jsx (Main Container)
├── State Management
│   ├── messages: Conversation history
│   ├── sessionId: Current session
│   ├── isLoading: Loading state
│   ├── sources: Retrieved sources
│   └── showSources: Panel visibility
│
├── API Integration
│   ├── sendMessage(): POST /api/chat
│   ├── loadHistory(): GET /api/history/:sessionId
│   ├── updateFeedback(): POST /api/feedback
│   └── clearConversation(): DELETE /api/chat/:sessionId
│
├── UI Components
│   ├── Message Bubbles (User/Assistant)
│   ├── Source Citations Panel
│   ├── Loading States
│   ├── Feedback Buttons
│   └── Code Copy Functionality
│
└── Features
    ├── Real-time Chat Interface
    ├── Syntax Highlighting (react-syntax-highlighter)
    ├── Responsive Design (Tailwind CSS)
    ├── Smooth Animations
    └── Error Handling
```

## Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPLETE DATA FLOW                       │
└─────────────────────────────────────────────────────────────────┘

1. USER INPUT
   User types message in React UI
   │
   ▼

2. API REQUEST
   POST /api/chat with message + sessionId
   │
   ▼

3. MEMORY LOAD
   MongoDBBufferWindowMemory.loadMemoryVariables()
   ├── Query MongoDB by sessionId
   ├── Get last 8 messages
   └── Return conversation history
   │
   ▼

4. HYBRID SEARCH
   HybridRetriever.retrieve()
   ├── Semantic search (Pinecone)
   ├── Keyword search (FlexSearch)
   ├── Fusion ranking
   └── Return top 6 documents
   │
   ▼

5. CONTEXT WINDOWING
   ContextWindowManager.formatContext()
   ├── Count tokens in history + docs
   ├── Apply truncation if > 6000 tokens
   ├── Prioritize recent + relevant
   └── Format for LLM
   │
   ▼

6. AI GENERATION
   Gemini AI with formatted context
   ├── Include conversation history
   ├── Include retrieved documents
   ├── Generate response
   └── Return response + metadata
   │
   ▼

7. MEMORY SAVE
   MongoDBBufferWindowMemory.saveContext()
   ├── Add user message
   ├── Add assistant response
   ├── Include sources
   └── Maintain sliding window
   │
   ▼

8. API RESPONSE
   Return to React UI
   ├── Response text
   ├── Source citations
   ├── Context statistics
   └── Session ID
   │
   ▼

9. UI UPDATE
   React state update
   ├── Add messages to conversation
   ├── Update sources panel
   ├── Show loading states
   └── Enable feedback buttons
```

## Key Technical Achievements

✅ **Conversation Memory**: Sliding window of 8 messages with MongoDB persistence
✅ **Context Windowing**: Token-aware truncation using js-tiktoken
✅ **Hybrid Search**: Semantic + keyword search with fusion ranking
✅ **Modern UI**: React with Tailwind CSS and smooth animations
✅ **Source Citations**: Expandable panel with copy functionality
✅ **Feedback System**: Thumbs up/down for continuous improvement
✅ **Session Management**: UUID-based session persistence
✅ **Error Handling**: Comprehensive error handling and user feedback
✅ **Production Ready**: Clean architecture with proper separation of concerns

This implementation successfully delivers all Tier 2 requirements with professional-grade code quality and user experience.
