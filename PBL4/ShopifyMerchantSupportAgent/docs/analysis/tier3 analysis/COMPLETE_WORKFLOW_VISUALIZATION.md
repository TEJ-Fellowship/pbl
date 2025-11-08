# 🔄 Complete Workflow Visualization: User Query → Response

## 📊 Executive Summary

This document provides a detailed, step-by-step visualization of what happens when a user submits ANY query to the Shopify Merchant Support Agent. Every component, database call, AI interaction, and decision point is documented.

---

## 🎯 System Architecture Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY MERCHANT SUPPORT AGENT                 │
└────────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐              ┌───────▼────────┐
        │   FRONTEND     │              │    BACKEND    │
        │   (React)      │              │   (Express)    │
        └───────┬────────┘              └───────┬────────┘
                │                               │
                │     HTTP Request              │
                └──────────────────────────────►│
                                │                               │
                ┌───────────────▼───────────────┐
                │   CHAT CONTROLLER            │
                │   (chatController.js)        │
                └───────────────┬───────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
        ┌───────────▼───┐  ┌───▼────┐  ┌──▼────────┐
        │ INTENT        │  │ MCP    │  │ HYBRID   │
        │ CLASSIFIER    │  │ ORCH   │  │ RAG      │
        └───────────┬───┘  └───┬────┘  └──┬───────┘
                    │           │           │
                    ▼           ▼           ▼
                ┌───────────────────────────────┐
                │   MONGODB (Conversation)     │
                │   PINECONE (Vectors)          │
                │   FLEXSEARCH (Keywords)       │
                └───────────────────────────────┘
```

---

## 🔍 Step-by-Step: User Query Processing Flow

### **PHASE 1: Frontend Input & Transmission** (0-100ms)

#### **Step 1.1: User Types Query**

```
User types: "How do I set up Shopify payments?"
         │
         ▼
```

#### **Step 1.2: React State Update**

**File:** `frontend/src/App.jsx` (Line 173-186)

```javascript
// State management
- inputMessage state: "How do I set up Shopify payments?"
- isLoading state: false → true
- Session tracking: session_1234567890_abc
- Message queue: []

// User message object created:
{
  id: `user_${Date.now()}`,
  role: "user",
  content: "How do I set up Shopify payments?",
  timestamp: new Date()
}
```

#### **Step 1.3: HTTP Request Sent**

**File:** `frontend/src/App.jsx` (Line 188-203)

```javascript
// POST /api/chat
Request Headers:
{
  "Content-Type": "application/json",
  "Origin": "http://localhost:5173"
}

Request Body:
{
  message: "How do I set up Shopify payments?",
  sessionId: "session_1234567890_abc"
}
```

#### **Step 1.4: Loading UI Display**

- Spinner shown: "Thinking..."
- Input disabled
- User can't send another message

---

### **PHASE 2: Backend Reception & Initialization** (100-300ms)

#### **Step 2.1: Express Route Handler**

**File:** `backend/routes/route.js` (Line 64-83)

```javascript
// Route: POST /api/chat
Received:
{
  message: "How do I set up Shopify payments?",
  sessionId: "session_1234567890_abc"
}

Validation:
✓ message exists
✓ sessionId exists
✓ Fields present
```

#### **Step 2.2: AI Components Initialization**

**File:** `backend/controllers/chatController.js` (Line 641-698)

```javascript
async function initializeAI() {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create Hybrid Retriever
  retriever = new HybridRetriever({
    semanticWeight: 0.7,
    keywordWeight: 0.3,
    maxResults: 20,
    finalK: 8,
    diversityBoost: 0.15,
  });

  // 3. Initialize Google Gemini
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel("gemini-1.5-flash");

  // 4. Initialize MCP Orchestrator
  mcpOrchestrator = new MCPOrchestrator();

  // 5. Initialize Intent Classifier
  intentClassifier = new IntentClassificationService();

  // 6. Initialize Proactive Suggestions
  proactiveSuggestions = new ProactiveSuggestionsService();

  // 7. Initialize Analytics
  analyticsService = new AnalyticsService();
}
```

**Performance Note:** This initialization happens once on first query, then cached for subsequent queries.

---

### **PHASE 3: Conversation Context Loading** (300-500ms)

#### **Step 3.1: MongoDB Query**

**File:** `backend/controllers/chatController.js` (Line 708-730)

```javascript
// Find or create conversation
let conversation = await Conversation.findOne({ sessionId });

if (!conversation) {
  // NEW conversation
  conversation = new Conversation({
    sessionId: "session_1234567890_abc",
    title: "How do I set up Shopify payments?...",
    createdAt: new Date(),
    isActive: true,
  });
  await conversation.save();
}

// Load conversation history
const conversationHistory = await getConversationHistory(sessionId);
// Returns: { messages: [], conversation: {...} }
```

#### **Step 3.2: Create User Message Record**

**File:** `backend/models/Message.js`

```javascript
const userMessage = new Message({
  conversationId: conversation._id,
  role: "user",
  content: "How do I set up Shopify payments?",
  timestamp: new Date(),
});
await userMessage.save();

// Add to conversation
await conversation.addMessage(userMessage._id);
```

---

### **PHASE 4: Multi-Turn Context Building** (500-800ms)

#### **Step 4.1: Enhanced Context Building**

**File:** `backend/src/multi-turn-conversation.js` (Line 683-798)

```javascript
const enhancedContext = await multiTurnManager.buildEnhancedContext(
  message, // "How do I set up Shopify payments?"
  sessionId, // "session_1234567890_abc"
  messages, // Previous conversation history
  [] // Will be populated with search results
);

// Build process:
// 1. Get conversation state
// 2. Update turn count: state.turnCount++
// 3. Detect follow-up questions
// 4. Detect ambiguity
// 5. Extract user preferences
// 6. Extract merchant info
```

#### **Step 4.2: Follow-Up Detection**

**File:** `backend/src/multi-turn-conversation.js` (Line 327-455)

```javascript
const followUpDetection = await detectFollowUp(currentMessage, history);

// Patterns checked:
- "what about", "how about", "also", "additionally"
- Pronoun references: "it", "this", "that"
- Continuation patterns

Result:
{
  isFollowUp: false,
  confidence: 0.85,
  indicators: {
    followUpWords: false,
    pronounReference: false,
    continuationPattern: false,
    contextBased: false
  }
}
```

#### **Step 4.3: Ambiguity Detection**

**File:** `backend/src/multi-turn-conversation.js` (Line 511-581)

```javascript
const ambiguityDetection = await detectAmbiguity(message, history);

// Patterns checked:
- API ambiguity: "which API", "API difference"
- Payment ambiguity: "payment integrate", "payment setup"
- Integration ambiguity: "integrate service"
- Development ambiguity: "develop app"
- Store setup ambiguity: "setup store"

Result:
{
  needsClarification: false,
  ambiguities: [],
  clarificationQuestion: null
}
```

#### **Step 4.4: User Preference Extraction**

**File:** `backend/src/multi-turn-conversation.js` (Line 586-628)

```javascript
const preferences = await extractUserPreferences(message, history);

// Extracted:
{
  preferredAPI: null,          // Will be inferred
  technicalLevel: "intermediate", // Default
  topics: new Set(["payments", "setup"]),
  merchantPlanTier: null,
  storeType: null,
  industry: null,
  location: null,
  experienceLevel: null,
  goals: new Set()
}
```

#### **Step 4.5: Merchant Info Extraction**

**File:** `backend/src/multi-turn-conversation.js` (Line 31-162)

```javascript
const merchantInfo = extractMerchantInfo(conversationHistory);

// Keywords analyzed:
- planTierKeywords: { basic, shopify, advanced, plus, enterprise }
- storeTypeKeywords: { physical, online, both }
- industryKeywords: { fashion, electronics, food, beauty, home, sports }
- storeSizeKeywords: { small, medium, large, enterprise }
- experienceKeywords: { new, experienced, expert }

// Extracted:
{
  planTier: null,
  storeType: null,
  industry: null,
  location: null,
  storeSize: null,
  experienceLevel: null
}
```

---

### **PHASE 5: Query Classification & Routing** (800-1000ms)

#### **Step 5.1: Smart Query Classification**

**File:** `backend/controllers/chatController.js` (Line 381-600)

```javascript
const queryClassification = classifyQueryType(message);

// Classification logic:
1. Check for general knowledge patterns
2. Check for Shopify-related keywords
3. Check for mathematical queries
4. Check for date/time queries
5. Check for code validation queries
6. Check for currency queries

// Result:
{
  isGeneralKnowledgeQuery: false,
  isNotShopifyRelated: false,
  isMathQuery: false,
  isDateTimeQuery: false,
  isCodeQuery: false,
  isCurrencyQuery: false,
  shouldUseWebSearch: false,    // No → internal RAG
  shouldUseMCPTools: false,    // No → internal RAG
  shouldUseRAG: true,           // YES → proceed with RAG
  queryType: "shopify_related"  // Primary route
}
```

#### **Step 5.2: Intent Classification**

**File:** `backend/controllers/chatController.js` (Line 917-920)

```javascript
const intentClassification = await intentClassifier.classifyIntent(message);

// Hybrid classification:
// 1. Rule-based pattern matching (30% weight)
// 2. AI-based classification (70% weight)

// Result:
{
  intent: "setup",           // setup, troubleshooting, optimization, billing, general
  confidence: 0.85,
  method: "hybrid",
  ruleBased: { intent: "setup", confidence: 0.9 },
  aiBased: { intent: "setup", confidence: 0.82 }
}
```

#### **Step 5.3: Routing Configuration**

**File:** `backend/src/services/intentClassificationService.js` (Line 1072-1081)

```javascript
const routingConfig = intentClassifier.getRoutingConfig(
  intentClassification.intent  // "setup"
);

// Result:
{
  primarySources: ["getting_started", "manual_getting_started", "helpcenter"],
  secondarySources: ["api", "products", "orders"],
  promptTemplate: "setup-focused"
}
```

---

### **PHASE 6: Hybrid Search & Retrieval** (1000-1500ms)

#### **Step 6.1: Query Embedding Generation**

**File:** `backend/controllers/chatController.js` (Line 914)

```javascript
const queryEmbedding = await embedSingle(enhancedContext.contextualQuery);

// Contextual query includes:
"Conversation summary: (if exists)
Current question: How do I set up Shopify payments?
User prefers: (if exists)"

// Embedding process:
// 1. Tokenize query
// 2. Generate vector using Gemini embeddings API
// 3. Result: 768-dimensional vector
```

#### **Step 6.2: Pinecone Semantic Search**

**File:** `backend/src/hybrid-retriever.js` (Line 169-176)

```javascript
const semanticResults = await index.query({
  vector: queryEmbedding,        // 768-dim vector
  topK: 20,                       // Get top 20
  includeMetadata: true,
  includeValues: false,
  filter: buildSemanticFilter(processedQuery)
});

// Filters applied:
{
  category: { $in: ["helpcenter", "manual_getting_started", "api"] }
}

// Result: ~15 documents with similarity scores
// Example:
[
  { id: "chunk_123", score: 0.92, metadata: {...} },
  { id: "chunk_456", score: 0.88, metadata: {...} },
  ...
]
```

#### **Step 6.3: FlexSearch Keyword Search**

**File:** `backend/src/hybrid-retriever.js` (Line 179-183)

```javascript
const keywordQueries = buildKeywordQueries(processedQuery);
// Queries: ["original query", "expanded query", "key terms"]

const keywordResults = await performMultiKeywordSearch(keywordQueries);

// Keyword processing:
1. Tokenize: ["setup", "shopify", "payments"]
2. Search FlexSearch index
3. Rank by term frequency
4. Result: ~10 documents
```

#### **Step 6.4: Fusion Ranking**

**File:** `backend/src/hybrid-retriever.js` (Line 257-345)

```javascript
const fusedResults = fuseResults(
  semanticResults,    // From Pinecone
  keywordResults,     // From FlexSearch
  semanticWeight,     // 0.7
  keywordWeight       // 0.3
);

// Fusion algorithm:
1. Normalize both result sets
2. Combine scores: finalScore = (semantic × 0.7) + (keyword × 0.3)
3. Detect documents appearing in both sets → boost
4. Apply diversity boost for different categories
5. Sort by final score

// Result: Top 8 documents ranked by relevance
[
  { doc: "...", metadata: {...}, score: 0.94, searchType: "hybrid" },
  { doc: "...", metadata: {...}, score: 0.89, searchType: "semantic" },
  ...
]
```

#### **Step 6.5: Diversity Boost Application**

**File:** `backend/src/hybrid-retriever.js` (Line 227-252)

```javascript
const diversifiedResults = applyDiversityBoost(fusedResults);

// Algorithm:
1. Select best result from each category first
2. Apply +0.15 boost to category leaders
3. Then add remaining high-scoring results
4. Ensures content diversity

// Final: Top 8 unique, diverse documents
```

---

### **PHASE 7: AI Response Generation** (1500-2500ms)

#### **Step 7.1: Intent-Specific Prompt Generation**

**File:** `backend/src/services/intentClassificationService.js` (Line 1089-1136)

```javascript
const intentSpecificPrompt = intentClassifier.generateIntentSpecificPrompt(
  intentClassification.intent,  // "setup"
  message,
  results
);

// Generated prompt:
"You are helping a Shopify merchant with SETUP and CONFIGURATION. Focus on:
- Step-by-step instructions
- Prerequisites and requirements
- Best practices for initial setup
- Common setup mistakes to avoid
- Next steps after setup

Query: How do I set up Shopify payments?"
```

#### **Step 7.2: Multi-Turn Enhanced Response Generation**

**File:** `backend/src/multi-turn-conversation.js` (Line 831-947)

```javascript
const enhancedResponse = await multiTurnManager.generateEnhancedResponse(
  message,
  sessionId,
  messages,
  results,
  intentSpecificPrompt
);

// Prompt assembly:
const systemPrompt = `
You are an expert Shopify Merchant Support Assistant...
CONVERSATION CONTEXT:
- Turn Count: 1
- User's Preferred API: Not specified
- User's Technical Level: intermediate
- Topics Discussed: payments, setup
- Is Follow-up Question: No

INSTRUCTIONS:
1. Provide detailed, actionable responses
2. Match technical level to user
3. Include examples and code snippets
4. Format with markdown
...
`;

const context = searchResults
  .map((r, i) => `[Source ${i + 1}] ${r.metadata.title}\n${r.doc}`)
  .join("\n\n");

const conversationHistoryText = messages
  .slice(-6)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n");

const prompt = `${systemPrompt}\n\nRETRIEVED DOCUMENTATION:\n${context}\n\nUSER QUESTION: ${contextualQuery}\n\nEXPERT ANSWER:`;
```

#### **Step 7.3: Gemini AI Processing**

**File:** `backend/src/multi-turn-conversation.js` (Line 929-933)

```javascript
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }]
});

// AI processing:
1. Parse prompt (~5000 tokens)
2. Process with gemini-1.5-flash
3. Generate response (500-1000 tokens)
4. Time: ~1-2 seconds

const answer = result.response?.text();
// Result: Comprehensive answer with setup instructions
```

---

### **PHASE 8: Confidence Scoring** (2500-2600ms)

#### **Step 8.1: Confidence Calculation**

**File:** `backend/controllers/chatController.js` (Line 996-1001)

```javascript
const confidence = calculateConfidence(
  results,                    // Retrieved docs
  answer,                     // Generated answer
  message,                    // User query
  intentClassification        // Intent info
);

// Factors evaluated (total weight = 100%):
1. Cross-encoder relevance (30%): avgScore × 0.7 + queryAnswerRelevance × 0.3
2. Entity matching bonus (25%): exact API/error/entity matches
3. Source quality (20%): source diversity and authority
4. Answer completeness (15%): length, specifics, examples, steps
5. Intent confidence (10%): classification confidence

// Calculation:
confidence += crossEncoderScore × 30;
confidence += entityMatchBonus × 25;
confidence += sourceQualityBonus × 20;
confidence += completenessBonus × 15;
confidence += intentConfidence × 10;

// Result:
{
  score: 87,        // Out of 100
  level: "High",    // Very High / High / Medium / Low / Very Low
  factors: [
    "High cross-encoder relevance",
    "Strong exact entity matches found",
    "Multiple search methods used",
    "Good category diversity",
    "Comprehensive answer with details and examples",
    "High intent classification confidence"
  ]
}
```

---

### **PHASE 9: MCP Tools Integration** (2600-2800ms)

#### **Step 9.1: Tool Selection**

**File:** `backend/src/mcp/mcpOrchestrator.js` (Line 60-137)

```javascript
const toolsToUse = mcpOrchestrator.decideToolUse(query, confidence);

// Tool selection logic:
1. Check calculator: contains math? → NO
2. Check Shopify status: contains "status" or "down"? → NO
3. Check code validator: contains "validate" or "code"? → NO
4. Check currency converter: contains "convert" or currency? → NO
5. Check theme compatibility: contains "theme compatibility"? → NO
6. Check web search: general knowledge? → NO

// Result: []
// No MCP tools triggered for this query
```

#### **Step 9.2: Tool Execution (if any)**

```javascript
if (toolsToUse.length > 0) {
  const toolResults = await mcpOrchestrator.executeTools(
    toolsToUse,
    query,
    confidence
  );

  // Enhance answer with tool results
  finalAnswer = enhanceAnswerWithToolResults(answer, toolResults);
}

// For this query: No tools executed
```

---

### **PHASE 10: Proactive Suggestions** (2800-3000ms)

#### **Step 10.1: Analyze Context for Suggestions**

**File:** `backend/src/services/proactiveSuggestionsService.js` (Line 824-896)

```javascript
const suggestionsResult = await proactiveSuggestions.getProactiveSuggestions(
  message,
  messages,
  intentClassification.intent,      // "setup"
  enhancedResponse.conversationState.userPreferences
);

// Analysis process:
1. Check context patterns for triggers
2. Analyze conversation history
3. Generate AI-powered suggestions
4. Get fallback suggestions if none found

// Generated suggestions:
[
  {
    suggestion: "You might also want to set up payment gateway settings for international transactions.",
    category: "payment_configuration",
    priority: "high",
    reasoning: "Related to payment setup context",
    source: "ai_generated",
    relevanceScore: 0.85
  },
  {
    suggestion: "Consider setting up abandoned cart recovery to maximize sales potential.",
    category: "sales_optimization",
    priority: "high",
    reasoning: "Common next step after payment setup",
    source: "rule_based",
    relevanceScore: 0.75
  },
  {
    suggestion: "Enable Shopify Payments fraud protection for additional security.",
    category: "security",
    priority: "medium",
    reasoning: "Security best practice for payments",
    source: "ai_generated",
    relevanceScore: 0.72
  }
]
```

---

### **PHASE 11: Analytics Tracking** (3000-3100ms)

#### **Step 11.1: Track Question**

**File:** `backend/src/services/analyticsService.js`

```javascript
await analyticsService.trackQuestion(
  message,                              // User query
  intentClassification.intent,           // "setup"
  enhancedResponse.conversationState.userPreferences,  // User profile
  sessionId,                            // "session_123..."
  confidence,                           // { score: 87, level: "High" }
  results                               // Retrieved documents
);

// Stored analytics:
{
  question: "How do I set up Shopify payments?",
  intent: "setup",
  confidence: { score: 87, level: "High" },
  timestamp: new Date(),
  sessionId: "session_123...",
  sources: [...],
  merchantSegment: {...}
}
```

---

### **PHASE 12: Data Persistence** (3100-3200ms)

#### **Step 12.1: Save Assistant Message**

**File:** `backend/controllers/chatController.js` (Line 1048-1083)

```javascript
const assistantMessage = new Message({
  conversationId: conversation._id,
  role: "assistant",
  content: finalAnswer,
  metadata: {
    searchResults: results.map(r => ({
      title: r.metadata?.title,
      source_url: r.metadata?.source_url,
      category: r.metadata?.category,
      score: r.score,
      searchType: r.searchType
    })),
    modelUsed: "gemini-1.5-flash-multi-turn",
    processingTime: Date.now() - startTime,  // ~3.2 seconds
    tokensUsed: 0,
    mcpTools: { toolsUsed: [], toolResults: {} },
    multiTurnContext: {
      turnCount: 1,
      isFollowUp: false,
      userPreferences: {...}
    },
    intentClassification: intentClassification,
    proactiveSuggestions: suggestionsResult.suggestions
  }
});

await assistantMessage.save();
await conversation.addMessage(assistantMessage._id);
```

---

### **PHASE 13: Response Assembly** (3200-3300ms)

#### **Step 13.1: Format Response**

**File:** `backend/controllers/chatController.js` (Line 1085-1117)

```javascript
return {
  answer: finalAnswer,
  confidence: {
    score: 87,
    level: "High",
    factors: [...]
  },
  sources: results.map((r, i) => ({
    id: i + 1,
    title: r.metadata?.title || "Unknown",
    url: r.metadata?.source_url || "N/A",
    category: r.metadata?.category || "unknown",
    score: r.score,
    searchType: r.searchType,
    content: r.doc
  })),
  multiTurnContext: {
    turnCount: 1,
    isFollowUp: false,
    userPreferences: {...},
    contextualQuery: enhancedContext.contextualQuery,
    conversationStats: multiTurnManager.getConversationStats(sessionId)
  },
  intentClassification: {
    intent: "setup",
    confidence: 0.85,
    method: "hybrid",
    routingConfig: routingConfig
  },
  queryClassification: queryClassification,
  mcpTools: {
    toolsUsed: [],
    toolResults: {}
  },
  proactiveSuggestions: suggestionsResult
};
```

---

### **PHASE 14: Frontend Reception & Display** (3300-3500ms)

#### **Step 14.1: Response Received**

**File:** `frontend/src/App.jsx` (Line 206-224)

```javascript
const assistantMessage = {
  id: `assistant_${Date.now()}`,
  role: "assistant",
  content: response.data.answer,
  timestamp: new Date(),
  confidence: response.data.confidence,
  sources: response.data.sources || [],
  tokenUsage: response.data.tokenUsage,
  truncated: response.data.truncated,
  mcpTools: response.data.mcpTools || {},
  isClarifyingQuestion: false,
  suggestedApis: [],
  originalQuery: null,
  clarificationData: null,
  needsClarification: false,
  multiTurnContext: response.data.multiTurnContext || {},
  intentClassification: response.data.intentClassification || {},
  proactiveSuggestions: response.data.proactiveSuggestions || [],
};

setMessages((prev) => [...prev, assistantMessage]);
setPendingClarification(null);
```

#### **Step 14.2: UI Update**

```javascript
- isLoading = false
- Assistant message rendered
- Sources expandable
- Confidence badge displayed
- Proactive suggestions shown
- MCP tools section (empty)
- Feedback buttons enabled
```

#### **Step 14.3: Auto-Scroll**

```javascript
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
```

---

## 📊 Performance Breakdown

| Phase | Component             | Duration    | Percentage |
| ----- | --------------------- | ----------- | ---------- |
| 1     | Frontend Input        | 0-100ms     | 3%         |
| 2     | Backend Reception     | 100-300ms   | 6%         |
| 3     | Context Loading       | 300-500ms   | 6%         |
| 4     | Multi-Turn Building   | 500-800ms   | 9%         |
| 5     | Classification        | 800-1000ms  | 6%         |
| 6     | Hybrid Search         | 1000-1500ms | 15%        |
| 7     | AI Generation         | 1500-2500ms | 30%        |
| 8     | Confidence Scoring    | 2500-2600ms | 3%         |
| 9     | MCP Tools             | 2600-2800ms | 6%         |
| 10    | Proactive Suggestions | 2800-3000ms | 6%         |
| 11    | Analytics             | 3000-3100ms | 3%         |
| 12    | Data Persistence      | 3100-3200ms | 3%         |
| 13    | Response Assembly     | 3200-3300ms | 3%         |
| 14    | Frontend Display      | 3300-3500ms | 6%         |

**Total End-to-End Time: ~3.5 seconds**

---

## 🔍 Key Decision Points Summary

### **Decision 1: Shopify vs General Knowledge**

- **Check:** Contains "shopify", "store", "ecommerce"?
- **Yes** → Use internal RAG
- **No** → Use web search

### **Decision 2: Intent Classification**

- **Rule-based** (30%) + **AI-based** (70%) = Hybrid confidence
- **Highest confidence intent** wins

### **Decision 3: Tool Selection**

- **Calculator** if math detected
- **Shopify Status** if service issues
- **Web Search** if general knowledge
- **None** if internal RAG sufficient

### **Decision 4: Search Strategy**

- **Semantic** (Pinecone): 0.7 weight
- **Keyword** (FlexSearch): 0.3 weight
- **Fusion** of both results

### **Decision 5: Response Enhancement**

- **MCP Tools** if low confidence or special needs
- **Proactive Suggestions** always generated
- **Multi-turn context** always maintained

---

## 🎯 Database Interactions

### **MongoDB (5 Operations)**

1. `Conversation.findOne({ sessionId })` - Load conversation
2. `new Message({...}).save()` - Save user message
3. `conversation.addMessage(messageId)` - Link message
4. `new Message({...}).save()` - Save assistant message
5. `conversation.addMessage(messageId)` - Link assistant message

### **Pinecone (1 Operation)**

1. `index.query({ vector, topK: 20 })` - Semantic search

### **FlexSearch (3 Operations)**

1. Search original query
2. Search expanded query
3. Search key terms

---

## 💾 Memory Usage

| Component           | Memory     | Purpose                               |
| ------------------- | ---------- | ------------------------------------- |
| Hybrid Retriever    | ~500MB     | Document index (in-memory FlexSearch) |
| MCP Orchestrator    | ~50MB      | Tool instances                        |
| Conversation States | ~10MB      | Active sessions (Map)                 |
| MongoDB Connection  | ~100MB     | Connection pool                       |
| **Total Backend**   | **~660MB** | In-memory state                       |

---

This workflow demonstrates the sophisticated multi-layer architecture of the Shopify Merchant Support Agent, showing how every component works together to provide intelligent, contextual responses to user queries.
