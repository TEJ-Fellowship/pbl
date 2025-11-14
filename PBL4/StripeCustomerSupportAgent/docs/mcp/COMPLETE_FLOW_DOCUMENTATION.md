# 🔄 Complete System Flow - From Query to Response

## 📋 Overview

This document provides a **comprehensive, step-by-step** breakdown of what happens when a user enters a query, including all prompts sent to Gemini AI, confidence scores at each stage, and detailed flows for each scenario.

---

## 🚀 **INITIAL ENTRY POINT**

### Step 1: User Query Received

**File:** `services/chatService.js:264`

```javascript
async processMessage({ message, sessionId, userId, timestamp })
```

**Input:**
- `message`: User's query string
- `sessionId`: Session identifier (created if not provided)
- `userId`: User identifier
- `timestamp`: Current timestamp

**Action:**
- Logs: `💬 Processing message: "${message.substring(0, 50)}..."`

---

## 🧠 **PHASE 1: MEMORY & SESSION MANAGEMENT**

### Step 2: Session Initialization

**File:** `services/chatService.js:274-307`

**Actions:**
1. **Create new session** (if `sessionId` not provided):
   ```javascript
   sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   await this.memoryController.initializeSession(sessionId, userId, {
     project: "stripe_support",
     context: "customer_support",
     startTime: timestamp,
   });
   ```

2. **Or reinitialize existing session** (if session ID changed)

**Output:**
- Session initialized with memory system

---

### Step 3: Process User Message in Memory

**File:** `services/chatService.js:313-317`

**Action:**
```javascript
await this.memoryController.processUserMessage(message, {
  timestamp,
  source: "api",
});
```

**What happens:**
- Message stored in buffer memory
- Token count estimated and tracked
- Message added to conversation history

---

### Step 4: Get Complete Memory Context

**File:** `services/chatService.js:319-326`

**Action:**
```javascript
const memoryContext = await this.memoryController.getCompleteMemoryContext(message);
```

**What's retrieved:**
- `recentContext`: Last N messages in current conversation
- `longTermContext`: Relevant Q&A pairs from past conversations
- `reformulatedQuery`: AI-reformulated query for better search (if applicable)
- `sessionContext`: Session metadata

**Logs:**
```
🧠 Memory context: X recent messages
```

---

## 🔄 **PHASE 2: QUERY REFORMULATION (Optional)**

### Step 5: Query Reformulation Prompt (If Applicable)

**File:** `services/queryReformulationService.js:190-210`

**When:** Only for technical Stripe queries (not personal/conversational queries)

**Prompt sent to Gemini:**
```
You are an expert query reformulation assistant for a Stripe customer support system. Your task is to reformulate user queries to be more effective for document retrieval while maintaining the original intent.

CONTEXT INFORMATION:
[Recent conversation context]
[Relevant previous Q&As]
[Session context]

ORIGINAL USER QUERY: "{originalQuery}"

IMPORTANT RULES:
1. If the query asks about personal information (name, previous conversation, things mentioned earlier), return the ORIGINAL query unchanged. Do NOT reformulate personal queries into Stripe API questions.
2. If the query is about conversation history or what was said before, return the ORIGINAL query unchanged.
3. Only reformulate technical queries about Stripe API, payments, webhooks, integrations, etc.

INSTRUCTIONS FOR TECHNICAL QUERIES:
1. Reformulate the query to be more specific and search-friendly
2. Include relevant context from the conversation history
3. Add technical terms that might help with document retrieval
4. Maintain the original question's intent
5. Make the query self-contained for better search results
6. Focus on Stripe API, payments, webhooks, and technical concepts

REFORMULATED QUERY:
```

**Output:**
- `reformulatedQuery`: Enhanced query for better document retrieval
- Or original query if it's personal/conversational

**Result stored in:** `memoryContext.reformulatedQuery`

---

## 🤖 **PHASE 3: QUERY CLASSIFICATION**

### Step 6: Query Classification[]

**File:** `services/chatService.js:328-337`

**Action:**
```javascript
let classification = await this.queryClassifier.classifyQuery(
  message,
  0.5,  // ⚠️ ISSUE: Hardcoded default confidence!
  enabledTools
);
```

**Confidence Score Used:** `0.5` (default, NOT from hybrid search - **THIS IS THE ISSUE!**)

---

### Step 6a: Classification Prompt Sent to Gemini

**File:** `services/queryClassifier.js:57-93`

**Prompt:**
```
You are a query classifier for a Stripe support system. Analyze the user query and decide the best approach.

User Query: "{query}"
Document Confidence: 0.5  ⚠️ (This is hardcoded, not actual!)

Available MCP Tools:
• calculator: Mathematical calculations and Stripe fee computations
• status_checker: Real-time Stripe API status monitoring
• web_search: Google Custom Search for current information
• code_validator: Code syntax validation and API endpoint verification
• datetime: Date/time operations and business hours
• currency_converter: Convert currencies with real-time exchange rates

Available approaches:
1. MCP_TOOLS_ONLY - Use MCP tools for direct answers (calculations, status checks, etc.)
2. HYBRID_SEARCH - Use hybrid search through documentation for comprehensive answers
3. COMBINED - Use both MCP tools and hybrid search
4. CONVERSATIONAL - Use only memory context/Q&A pairs (no hybrid search, no MCP tools)

Classification Guidelines:
- Use CONVERSATIONAL for queries asking about:
  * Personal information mentioned earlier (e.g., "what is my name?", "tell me who am i", "what did I tell you?")
  * Previously discussed topics from the conversation
  * Questions about what was said or remembered in this conversation
  * References to information shared in earlier messages
  * Requests to remember something (e.g., "remember my name is X")
  * Questions like "who am I", "what did I say", "what did you tell me"

- Use MCP_TOOLS_ONLY for: calculations, status checks, real-time data, specific tool operations, and ANY non-Stripe general knowledge or current events/news queries (e.g., Israel-Palestine, Russia-Ukraine, weather today). Prefer the web_search tool in these cases.
- Use HYBRID_SEARCH for: API documentation, implementation guides, general Stripe concepts ONLY
- Use COMBINED for: complex queries that need both real-time data and documentation

CRITICAL: If the query is conversational (asking about personal info, previous conversation, etc.), 
ALWAYS use CONVERSATIONAL approach, NOT HYBRID_SEARCH or MCP_TOOLS_ONLY.

Respond with JSON only:
{
  "approach": "MCP_TOOLS_ONLY|HYBRID_SEARCH|COMBINED|CONVERSATIONAL",
  "reasoning": "Brief explanation",
  "confidence": 0.8,
  "isConversationQuery": true|false
}
```

**AI Response:**
```json
{
  "approach": "HYBRID_SEARCH",
  "reasoning": "Query is about Stripe API documentation",
  "confidence": 0.8,
  "isConversationQuery": false
}
```

**Output:**
- Classification object with approach, reasoning, confidence, and conversation flag

**Logs:**
```
📊 Classification: HYBRID_SEARCH - Query is about Stripe API documentation
```

---

### Step 7: Non-Stripe Query Check

**File:** `services/chatService.js:342-348`

**Action:**
```javascript
const isStripe = this.isStripeRelatedQuery(message);
if (!isStripe && classification.approach !== "MCP_TOOLS_ONLY") {
  console.log("🔧 Forcing MCP tools only for non-Stripe query");
  classification = { ...classification, approach: "MCP_TOOLS_ONLY" };
}
```

**Purpose:** Prevent searching Stripe docs for non-Stripe queries (e.g., "What's the weather?")

---

## 🎯 **PHASE 4: ROUTING BASED ON CLASSIFICATION**

The system now branches into **4 different paths** based on classification:

---

## 📚 **SCENARIO 1: HYBRID_SEARCH**

### Flow: HYBRID_SEARCH Approach

**File:** `services/chatService.js:373-375`

---

#### Step 8: Execute Hybrid Search

**File:** `services/chatService.js:441-462`

**Action:**
```javascript
const searchQuery = memoryContext.reformulatedQuery || message;
const chunks = await this.hybridSearch.hybridSearch(
  searchQuery,
  parseInt(config.MAX_CHUNKS) || 5  // Default: 5 chunks
);
```

**What happens inside `hybridSearch()`:**

1. **Parallel Searches:**
   - **BM25 Search** (PostgreSQL): Requests `topK * 2 = 10` results
   - **Semantic Search** (Pinecone): Requests `topK * 2 = 10` results

2. **Query Type Detection:**
   ```javascript
   const isErrorQuery = this.isErrorCode(query);
   const semanticWeight = isErrorQuery ? 0.4 : 0.7;
   const bm25Weight = isErrorQuery ? 0.6 : 0.3;
   ```

3. **Result Fusion:**
   - Normalize scores (0-1 range)
   - Combine results with weighted fusion
   - Deduplicate by chunk ID
   - Sort by `finalScore` (descending)
   - Return top `topK` results (5 by default)

**Output:**
```javascript
chunks = [
  {
    id: "doc_123_chunk_5",
    content: "The PaymentIntent API allows you to...",
    finalScore: 0.85,
    bm25Score: 0.72,
    semanticScore: 0.91,
    metadata: {
      source: "https://stripe.com/docs/api/payment_intents",
      title: "Payment Intents API",
      category: "payments"
    }
  },
  // ... 4 more chunks
]
```

---

#### Step 9: Calculate Document Confidence

**File:** `services/chatService.js:836-849`

**Function:**
```javascript
calculateConfidence(chunks, sources) {
  if (!chunks || chunks.length === 0) return 0.1;
  
  // Base confidence on top chunk similarity
  const topScore = chunks[0]?.finalScore || chunks[0]?.similarity || 0;
  
  // Adjust based on number of relevant sources
  const sourceBonus = Math.min(sources?.length || 0, 5) * 0.1;
  
  // Calculate final confidence (0-1 scale)
  const confidence = Math.min(0.9, Math.max(0.1, topScore + sourceBonus));
  
  return Math.round(confidence * 100) / 100;
}
```

**Example Calculation:**
- `topScore = 0.85` (from first chunk)
- `sourceBonus = min(5, 5) * 0.1 = 0.5`
- `confidence = min(0.9, max(0.1, 0.85 + 0.5)) = 0.9`

**Result:** Document Confidence = `0.9` (90%)

**Note:** This confidence is calculated but **NOT used** for classification (classification already happened with default 0.5)

---

#### Step 10: Generate Response with Memory Context

**File:** `services/chatService.js:693-831`

**Function:** `generateResponseWithMemory(query, chunks, memoryContext)`

**Prompt sent to Gemini:**
```
You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

You have access to both current Stripe documentation and previous conversation context to provide contextually aware responses.

CURRENT STRIPE DOCUMENTATION:
[Source 1: Payment Intents API (payments)]
The PaymentIntent API allows you to create and manage payment intents...

[Source 2: Payment Methods (payments)]
Payment methods can be attached to customers...

[Source 3: ...]

CURRENT USER QUESTION: {query}

RECENT CONVERSATION CONTEXT:
[Previous messages from this session]

RELEVANT PREVIOUS DISCUSSIONS:
[Previous Q&A 1] Q: How do I handle webhooks?
A: To handle webhooks, you need to...

RESPONSE GUIDELINES:
1. **Context Awareness**: Use previous conversation context to provide more relevant and personalized responses
2. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
3. **Continuity**: Reference previous discussions when relevant to maintain conversation flow
4. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
5. **Include Code**: Always include practical code examples in the appropriate programming language
6. **Step-by-Step**: Break down complex processes into clear, actionable steps
7. **Error Handling**: Mention common errors and how to handle them
8. **Best Practices**: Include security considerations and best practices
9. **Context Awareness**: Use the provided Stripe documentation context to inform your response
10. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Reference previous context when relevant (e.g., "Building on our previous discussion about...")
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- Focus on being helpful and practical
- Do NOT include source citations in your response - they will be added automatically

Remember: You're helping developers build payment solutions with full awareness of their conversation history, so be practical, solution-oriented, and contextually aware.
```

**AI Response:**
- Generated text response based on documentation and memory context

**Post-processing:**
- Sources are automatically formatted and appended to response

---

#### Step 11: Final Response

**File:** `services/chatService.js:421-431`

**Action:**
```javascript
const confidence = this.calculateConfidence([], response.sources);
// Note: Uses empty chunks array, calculates from sources only

return {
  answer: response.answer,
  sources: response.sources,
  confidence: confidence,  // Final confidence
  sessionId: sessionId,
  searchQuery: searchQuery,
  timestamp: new Date().toISOString(),
};
```

**Final Output:**
```javascript
{
  answer: "To create a PaymentIntent, use the PaymentIntents API endpoint...",
  sources: [
    {
      title: "Payment Intents API",
      url: "https://stripe.com/docs/api/payment_intents",
      category: "payments"
    }
    // ... more sources
  ],
  confidence: 0.9,
  sessionId: "session_123456",
  searchQuery: "how to create payment intent",
  timestamp: "2025-01-XX..."
}
```

---

## 🔧 **SCENARIO 2: MCP_TOOLS_ONLY**

### Flow: MCP_TOOLS_ONLY Approach

**File:** `services/chatService.js:350-372`

---

#### Step 8: Call MCP Integration Service

**File:** `services/chatService.js:354-357`

**Action:**
```javascript
const mcpResult = await this.mcpService.processQueryWithMCP(
  message,
  0.5  // ⚠️ ISSUE: Default confidence, not from hybrid search!
);
```

**Confidence Score:** `0.5` (default, NOT from hybrid search)

---

#### Step 8a: MCP Integration Service Processing

**File:** `services/mcpIntegrationService.js:158-203`

**Action:**
```javascript
async processQueryWithMCP(query, confidence = 0.5, context = {}) {
  // Get enabled tools
  const enabledTools = this.getEnabledTools();
  
  // Decide which tools to use
  const toolNames = await this.orchestrator.decideToolUse(
    query,
    confidence,  // 0.5 (default)
    enabledTools
  );
  
  // Execute selected tools
  const toolResults = await this.orchestrator.executeTools(
    toolNames,
    query
  );
  
  return {
    success: true,
    enhancedResponse: toolResults.combinedResponse,
    toolsUsed: toolNames,
    confidence: toolResults.overallConfidence,  // From tools
  };
}
```

---

#### Step 8b: Tool Selection Decision

**File:** `services/mcp-server/agentOrchestrator.js:118-161`

**Confidence Used:** `0.5` (passed from MCP Integration Service)

**Decision Flow:**

**Option A: AI-Powered Selection**

**Prompt sent to Gemini:**
```
You are an AI assistant that analyzes Stripe support queries and determines which MCP tools should be used.

Available MCP tools:
- calculator: Mathematical calculations and Stripe fee computations (requires: [])
- status_checker: Real-time Stripe API status monitoring (requires: STRIPE_SECRET_KEY)
- web_search: Google Custom Search for current information (requires: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID)
- code_validator: Code syntax validation and API endpoint verification (requires: [])
- datetime: Date/time operations and business hours (requires: [])
- currency_converter: Convert currencies with real-time exchange rates (requires: [])

Context: This is a Stripe Customer Support Agent. Users ask questions about Stripe API, payments, webhooks, billing, disputes, etc.

Tool Selection Guidelines:
- calculator: Use for fee calculations, math operations, pricing questions, percentage calculations, mathematical expressions
- currency_converter: Use for currency conversions, exchange rates, "convert X to Y" queries
- status_checker: Use for system status, downtime, "is Stripe down" questions
- web_search: Use for ANY general knowledge queries, current events, news, recent updates, latest information, "what's new" questions, non-Stripe topics (politics, geography, history, science, etc.), questions that cannot be answered from Stripe documentation alone, or queries about the real world
- code_validator: Use for code validation, API endpoint verification, syntax checking
- datetime: Use for time-related queries, business hours, scheduling

CRITICAL: If the query is NOT about Stripe API, payments, or Stripe-specific topics, you MUST use web_search tool. Examples: "Who is the PM of Nepal?", "Latest news about X", "What is the capital of Y?", "Current events in Z"

User Query: "{query}"
Document Confidence: 0.5  ⚠️ (This is default, not actual!)
Current Time: 2025-01-XX...

Analyze this Stripe support query and determine which MCP tools should be used.

If the query requires using one or more tools, respond with JSON:
{
  "useTool": true,
  "tools": ["tool1", "tool2"],
  "reasoning": "Why these tools were selected",
  "confidence": 0.8
}

If the query is about general knowledge, current events, news, or anything NOT related to Stripe documentation, you MUST use web_search tool.

If no tools are needed (ONLY for Stripe-specific queries that can be answered from documentation), respond with:
{
  "useTool": false,
  "reasoning": "Query can be answered with documentation alone"
}

Only respond with JSON, nothing else.
```

**AI Response:**
```json
{
  "useTool": true,
  "tools": ["calculator"],
  "reasoning": "Query requires mathematical calculation",
  "confidence": 0.9
}
```

**Option B: Rule-Based Fallback**

**File:** `services/mcp-server/agentOrchestrator.js:170-232`

**Decision Logic:**
```javascript
// Low confidence fallback to web search
if (confidence < 0.6 && !toolDecisions.includes("web_search")) {
  // confidence = 0.5 < 0.6 → Triggers web_search
  toolDecisions.push("web_search");
}

// Pattern matching
if (hasMathPatterns(query)) {
  toolDecisions.push("calculator");
}
if (hasStatusPatterns(query)) {
  toolDecisions.push("status_checker");
}
// ... etc
```

**Result:** `["calculator"]` (for math query)

---

#### Step 8c: Execute Selected Tools

**File:** `services/mcp-server/agentOrchestrator.js:302-391`

**Action:**
```javascript
const toolResults = await this.orchestrator.executeTools(
  ["calculator"],  // Selected tools
  query
);
```

**For Calculator Tool:**

**Execution:**
1. Extract math expression: `"1000 * 0.029"`
2. Evaluate: `29`
3. Calculate tool confidence:
   ```javascript
   let confidence = 0.8;  // Base
   if (expression.length < 20) confidence += 0.1;  // = 0.9
   if (result > 0 && result < 1000000) confidence += 0.1;  // = 1.0
   ```
   **Tool Confidence = 1.0** (100%)

**Tool Result:**
```javascript
{
  calculator: {
    success: true,
    result: 29,
    confidence: 1.0,
    message: "The 2.9% fee on $1000 is $29.00"
  }
}
```

---

#### Step 8d: Calculate Overall MCP Confidence

**File:** `services/mcp-server/agentOrchestrator.js:482-492`

**Action:**
```javascript
calculateOverallConfidence(results) {
  const confidences = Object.values(results)
    .filter((result) => result && typeof result.confidence === "number")
    .map((result) => result.confidence);
  
  if (confidences.length === 0) return 0.5;
  
  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
}
```

**Calculation:**
- `confidences = [1.0]` (from calculator)
- `overallConfidence = (1.0) / 1 = 1.0`

**Result:** Overall MCP Confidence = `1.0` (100%)

---

#### Step 8e: Generate Enhanced Response

**File:** `services/mcpIntegrationService.js:255-277`

**Action:**
```javascript
generateEnhancedResponse(toolResults, query, confidence) {
  // confidence = 0.5 (document confidence, NOT tool confidence)
  
  let response = "";
  
  // Add MCP tool results
  if (toolResults.results && Object.keys(toolResults.results).length > 0) {
    response += "🔧 **Additional Intelligence:**\n\n";
    response += toolResults.combinedResponse;  // "The 2.9% fee on $1000 is $29.00"
    response += "\n\n";
  }
  
  // Add confidence indicator
  if (confidence < 0.6) {  // 0.5 < 0.6 → TRUE
    response += "⚠️ **Note**: This response includes additional web search results due to lower confidence in documentation retrieval.\n\n";
  }
  
  // Add tool usage information
  if (toolResults.toolsUsed && toolResults.toolsUsed.length > 0) {
    response += `🛠️ **Tools Used**: ${toolResults.toolsUsed.join(", ")}\n\n`;
  }
  
  return response.trim();
}
```

**Output:**
```
🔧 **Additional Intelligence:**

The 2.9% fee on $1000 is $29.00

⚠️ **Note**: This response includes additional web search results due to lower confidence in documentation retrieval.

🛠️ **Tools Used**: calculator
```

**Note:** The warning appears because document confidence (0.5) is used, even though this is MCP-only (no docs were searched!)

---

#### Step 9: Generate Final Response with MCP

**File:** `services/chatService.js:468-522`

**Function:** `generateResponseWithMCP(query, chunks, mcpEnhancement, toolsUsed, mcpConfidence)`

**Prompt sent to Gemini:**
```
You are a helpful assistant. Answer the user's question based on the provided information.

USER QUESTION: Calculate 2.9% fee on $1000

MCP TOOL ENHANCEMENT:
🔧 **Additional Intelligence:**

The 2.9% fee on $1000 is $29.00

⚠️ **Note**: This response includes additional web search results due to lower confidence in documentation retrieval.

🛠️ **Tools Used**: calculator

TOOLS USED: calculator
MCP CONFIDENCE: 100.0%

Provide a clear, helpful response based on the MCP tool results.
```

**AI Response:**
- Generated text response incorporating MCP tool results

**Output:**
```javascript
{
  answer: "The 2.9% fee on $1000 is $29.00. This calculation is based on...",
  sources: []  // No sources for MCP-only responses
}
```

---

#### Step 10: Final Response

**File:** `services/chatService.js:421-431`

**Action:**
```javascript
const confidence = this.calculateConfidence([], response.sources);
// Empty chunks → returns 0.1

return {
  answer: response.answer,
  sources: [],
  confidence: 0.1,  // ⚠️ Low because no chunks!
  sessionId: sessionId,
  searchQuery: message,
  timestamp: new Date().toISOString(),
};
```

**Note:** Final confidence is 0.1 (low) even though MCP tool confidence was 1.0!

---

## 🔧🔍 **SCENARIO 3: COMBINED**

### Flow: COMBINED Approach (MCP + Hybrid Search)

**File:** `services/chatService.js:376-403`

---

#### Step 8: Execute Hybrid Search First

**File:** `services/chatService.js:379-383`

**Action:**
```javascript
const chunks = await this.hybridSearch.hybridSearch(
  searchQuery,
  parseInt(config.MAX_CHUNKS) || 5
);
```

**What happens:**
- Same as HYBRID_SEARCH scenario (Step 8)
- Retrieves 5 chunks with BM25 + Semantic fusion
- Example chunks with `finalScore: 0.72, 0.65, 0.58, 0.55, 0.52`

**Note:** Confidence could be calculated here but is **NOT** (see issue)

---

#### Step 9: Call MCP Tools

**File:** `services/chatService.js:391-395`

**Action:**
```javascript
const mcpResult = await this.mcpService.processQueryWithMCP(
  message,
  0.5  // ⚠️ ISSUE: Should use calculated confidence from chunks!
);
```

**Confidence Score:** `0.5` (default, NOT from hybrid search results)

**What happens:**
- Same MCP flow as Scenario 2 (Steps 8a-8e)
- Tools execute and return results
- Overall MCP confidence calculated (e.g., 1.0)

---

#### Step 10: Generate Combined Response

**File:** `services/chatService.js:527-688`

**Function:** `generateResponseWithMemoryAndMCP(query, chunks, memoryContext, mcpResult)`

**Prompt sent to Gemini (Stripe query):**
```
You are an expert Stripe API support assistant with deep knowledge of Stripe's payment processing, webhooks, and developer tools. Your role is to provide accurate, helpful, and actionable guidance to developers working with Stripe.

You have access to both current Stripe documentation and previous conversation context to provide contextually aware responses.

CURRENT STRIPE DOCUMENTATION:
[Source 1: Payment Intents API (payments)]
The PaymentIntent API allows you to create and manage payment intents...

[Source 2: ...]

CURRENT USER QUESTION: {query}

RECENT CONVERSATION CONTEXT:
[Previous messages]

MCP TOOL ENHANCEMENT:
🔧 **Additional Intelligence:**

[Results from MCP tools]

Tools Used: calculator

RESPONSE GUIDELINES:
1. **Context Awareness**: Use previous conversation context to provide more relevant and personalized responses
2. **Accuracy First**: Base your answer strictly on the provided Stripe documentation context
3. **MCP Integration**: Incorporate MCP tool results when available to enhance your response
4. **Continuity**: Reference previous discussions when relevant to maintain conversation flow
5. **Be Specific**: Provide exact API endpoints, parameter names, and code examples when relevant
6. **Include Code**: Always include practical code examples in the appropriate programming language
7. **Step-by-Step**: Break down complex processes into clear, actionable steps
8. **Error Handling**: Mention common errors and how to handle them
9. **Best Practices**: Include security considerations and best practices
10. **If Uncertain**: Clearly state when information isn't available in the context

FORMAT YOUR RESPONSE:
- Start with a direct answer to the question
- Reference previous context when relevant (e.g., "Building on our previous discussion about...")
- Provide detailed explanation with code examples
- Include relevant API endpoints and parameters
- Mention any prerequisites or setup requirements
- Focus on being helpful and practical
- Do NOT include source citations in your response - they will be added automatically

Remember: You're helping developers build payment solutions with full awareness of their conversation history, so be practical, solution-oriented, and contextually aware.
```

**Prompt sent to Gemini (Non-Stripe query):**
```
You are a helpful, up-to-date assistant. Answer the user's question directly and concisely using the information provided below. If Stripe documentation context is included but irrelevant to the user's question, ignore it.

USER QUESTION: {query}

RECENT CONVERSATION CONTEXT:
[Previous messages]

INFORMATION:
[Source 1: ...]
[Source 2: ...]

MCP TOOL ENHANCEMENT:
🔧 **Additional Intelligence:**

[Results from MCP tools]

Tools Used: web_search

GUIDELINES:
- Be factual and current. If MCP tools include web search results, prioritize them.
- Keep the answer focused on the user's question; avoid Stripe-specific framing unless the question is about Stripe.
- If information is insufficient, say what is missing and suggest a follow-up.
- Provide links or brief references when available in the provided information.
```

**AI Response:**
- Generated text combining documentation chunks and MCP tool results

**Post-processing:**
- Sources automatically formatted and appended

---

#### Step 11: Final Response

**File:** `services/chatService.js:421-431`

**Action:**
```javascript
const confidence = this.calculateConfidence([], response.sources);
// Uses sources only, not chunks

return {
  answer: response.answer,
  sources: response.sources,
  confidence: confidence,
  sessionId: sessionId,
  searchQuery: searchQuery,
  timestamp: new Date().toISOString(),
};
```

---

## 💬 **SCENARIO 4: CONVERSATIONAL**

### Flow: CONVERSATIONAL Approach

**File:** `services/chatService.js` (not shown in current code, but exists in other files)

**Characteristics:**
- No hybrid search
- No MCP tools
- Only uses memory context (previous conversations)

**Prompt:**
```
You are a helpful assistant with access to conversation history.

USER QUESTION: {query}

RECENT CONVERSATION CONTEXT:
[Previous messages from this session]

RELEVANT PREVIOUS DISCUSSIONS:
[Previous Q&A pairs]

Answer the user's question based on what you remember from previous conversations.
```

---

## 📊 **CONFIDENCE SCORE SUMMARY**

### Confidence Scores at Each Stage

| Stage | Type | Value | Used For | Calculation |
|-------|------|-------|----------|-------------|
| **Classification** | Document Confidence | `0.5` (default) | Query classification | ❌ Hardcoded, not calculated |
| **Hybrid Search** | Document Confidence | `0.1 - 0.9` | Response quality | ✅ From chunks: `topScore + sourceBonus` |
| **MCP Tool Selection** | Document Confidence | `0.5` (default) | Tool selection | ❌ Hardcoded, not from hybrid search |
| **MCP Tool Execution** | Tool Confidence | `0.0 - 1.0` | Tool quality | ✅ From each tool's `calculateConfidence()` |
| **Overall MCP** | Overall Confidence | `0.0 - 1.0` | Response quality | ✅ Average of tool confidences |
| **Final Response** | Final Confidence | `0.1 - 0.9` | User display | ⚠️ From `calculateConfidence([], sources)` |

---

## 🔍 **KEY ISSUES IDENTIFIED**

### Issue 1: Classification Uses Default Confidence
- **Problem:** Classification uses hardcoded `0.5` instead of actual document confidence
- **Impact:** Wrong classification decisions
- **Fix:** Calculate confidence from quick hybrid search BEFORE classification

### Issue 2: MCP Tools Receive Default Confidence
- **Problem:** MCP tools receive `0.5` instead of calculated confidence
- **Impact:** Low confidence checks (< 0.6) may not work correctly
- **Fix:** Pass calculated confidence from hybrid search to MCP tools

### Issue 3: Final Confidence Calculation
- **Problem:** Uses empty chunks array `[]` for MCP-only responses
- **Impact:** Returns low confidence (0.1) even when MCP tools were successful
- **Fix:** Use MCP tool confidence for MCP-only responses

---

## 📝 **PROMPTS SUMMARY**

### All Prompts Sent to Gemini:

1. **Query Reformulation Prompt** (Optional)
   - Purpose: Enhance query for better document retrieval
   - Input: Original query + memory context
   - Output: Reformulated query

2. **Query Classification Prompt**
   - Purpose: Decide which approach to use
   - Input: Query + confidence (0.5) + available tools
   - Output: Classification (approach, reasoning, confidence)

3. **MCP Tool Selection Prompt**
   - Purpose: Decide which MCP tools to use
   - Input: Query + confidence (0.5) + available tools + current time
   - Output: Tool selection (tools array, reasoning, confidence)

4. **Response Generation Prompt (HYBRID_SEARCH)**
   - Purpose: Generate answer from documentation
   - Input: Query + chunks + memory context
   - Output: Response text

5. **Response Generation Prompt (MCP_TOOLS_ONLY)**
   - Purpose: Generate answer from MCP tool results
   - Input: Query + MCP enhancement + tool info + MCP confidence
   - Output: Response text

6. **Response Generation Prompt (COMBINED)**
   - Purpose: Generate answer combining docs + MCP tools
   - Input: Query + chunks + memory context + MCP enhancement
   - Output: Response text

7. **Response Generation Prompt (CONVERSATIONAL)**
   - Purpose: Generate answer from memory only
   - Input: Query + memory context
   - Output: Response text

---

## 🎯 **COMPLETE FLOW DIAGRAM**

```
User Query
    ↓
Session Management
    ↓
Memory Processing
    ↓
Query Reformulation (Optional) → Gemini Prompt #1
    ↓
Query Classification → Gemini Prompt #2 (with confidence 0.5)
    ↓
    ├─ HYBRID_SEARCH
    │   ├─ Hybrid Search (BM25 + Semantic)
    │   ├─ Calculate Document Confidence
    │   ├─ Generate Response → Gemini Prompt #4
    │   └─ Return Response
    │
    ├─ MCP_TOOLS_ONLY
    │   ├─ Tool Selection → Gemini Prompt #3 (with confidence 0.5)
    │   ├─ Execute Tools → Calculate Tool Confidence
    │   ├─ Calculate Overall MCP Confidence
    │   ├─ Generate Response → Gemini Prompt #5
    │   └─ Return Response
    │
    ├─ COMBINED
    │   ├─ Hybrid Search (BM25 + Semantic)
    │   ├─ Tool Selection → Gemini Prompt #3 (with confidence 0.5)
    │   ├─ Execute Tools → Calculate Tool Confidence
    │   ├─ Calculate Overall MCP Confidence
    │   ├─ Generate Response → Gemini Prompt #6
    │   └─ Return Response
    │
    └─ CONVERSATIONAL
        ├─ Generate Response → Gemini Prompt #7
        └─ Return Response
```

---

## 📅 Created
Date: 2025-01-XX
Purpose: Complete documentation of system flow from query to response
Status: **COMPREHENSIVE REFERENCE**

