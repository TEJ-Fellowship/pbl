# MCP Tools Architecture - Detailed Explanation with Mental Visualization

## 🎯 Overview

MCP (Model Context Protocol) Tools in this Shopify Merchant Support Agent are **specialized utility functions** that extend the AI's capabilities beyond just answering from documentation. Think of them as **smart assistants** that can perform specific tasks like calculations, checking status, searching the web, validating code, and more.

---

## 🏗️ Architecture Visualization

### **Mental Model: The Command Center**

Imagine a **central command center** (the `MCPOrchestrator`) that has access to **7 specialized tools**:

```
                    ┌─────────────────────────────────┐
                    │   MCP Orchestrator              │
                    │   (Command Center)              │
                    │                                 │
                    │  - Decides which tools to use   │
                    │  - Coordinates tool execution   │
                    │  - Combines tool results        │
                    └───────────┬─────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │  Calculator   │ │ Web Search │ │  Status   │
        │   Tool        │ │   Tool     │ │  Tool     │
        └───────────────┘ └────────────┘ └───────────┘
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │ Date/Time    │ │  Code      │ │ Currency  │
        │   Tool       │ │ Validator  │ │ Converter │
        └──────────────┘ └────────────┘ └───────────┘
                │
        ┌───────▼──────┐
        │ Theme        │
        │ Compatibility│
        └──────────────┘
```

---

## 🔄 Complete Flow: From User Query to Response

### **Step-by-Step Journey**

```
USER QUERY
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 1. QUERY CLASSIFICATION                                  │
│    (classifyQueryType function)                         │
│                                                          │
│    Analyzes:                                            │
│    - Is it math? (numbers, +, -, *, /, %)              │
│    - Is it date/time? ("what time", "when")            │
│    - Is it code validation? ("validate", "check code") │
│    - Is it currency? ("convert", "USD to EUR")         │
│    - Is it general knowledge? ("what is", "who is")     │
│    - Is it Shopify-related? ("shopify", "store")       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Classification Result│
         │                       │
         │  shouldUseMCPTools:   │
         │    true/false        │
         │                       │
         │  shouldUseWebSearch:  │
         │    true/false        │
         │                       │
         │  shouldUseRAG:        │
         │    true/false        │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ MCP Tools Path  │    │ RAG Path        │
│ (Direct)        │    │ (Documentation)  │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         ▼                      │
┌───────────────────────────────┴──────────────┐
│ 2. MCP ORCHESTRATOR DECISION                │
│    (mcpOrchestrator.decideToolUse)          │
│                                              │
│    Checks each tool's "shouldUse" method:   │
│    - Calculator: hasMathematicalContent()   │
│    - Status: shouldUseStatusChecker()       │
│    - Web Search: shouldUseWebSearch()        │
│    - Date/Time: shouldUseDateTimeTool()      │
│    - Code Validator: shouldUseCodeValidator()│
│    - Currency: shouldUseCurrencyConverter() │
│    - Theme: shouldUseThemeCompatibility()    │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Selected Tools Array │
         │  e.g., ["calculator"]│
         │  e.g., ["web_search"]│
         │  e.g., ["shopify_status"]│
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 3. PARALLEL TOOL EXECUTION                 │
│    (executeTools - runs in parallel)       │
│                                             │
│    For each tool:                          │
│    ┌─────────────────────────────────────┐ │
│    │ Calculator Tool:                    │ │
│    │  - Extracts math expressions        │ │
│    │  - Evaluates using mathjs           │ │
│    │  - Returns: {calculations, summary}│ │
│    └─────────────────────────────────────┘ │
│                                             │
│    ┌─────────────────────────────────────┐ │
│    │ Status Tool:                        │ │
│    │  - Fetches from status.shopify.com  │ │
│    │  - Parses incidents/maintenance      │ │
│    │  - Returns: {status, summary}       │ │
│    └─────────────────────────────────────┘ │
│                                             │
│    ┌─────────────────────────────────────┐ │
│    │ Web Search Tool:                    │ │
│    │  - Searches DuckDuckGo/Wikipedia    │ │
│    │  - Returns: {results, summary}      │ │
│    └─────────────────────────────────────┘ │
└────────────────────┬────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Tool Results Object  │
         │  {                    │
         │    calculator: {...}, │
         │    web_search: {...},  │
         │    ...                │
         │  }                    │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 4. ANSWER ENHANCEMENT                      │
│    (enhanceAnswerWithToolResults)          │
│                                             │
│    Takes original answer (or empty string) │
│    and appends formatted tool results:     │
│                                             │
│    Original: "Here's the answer..."        │
│    + Calculator: "## 🧮 Calculation..."    │
│    + Status: "## 🟢 Shopify Status..."     │
│    + Web Search: "## 🔍 Web Search..."     │
│                                             │
│    = Enhanced Answer with all results      │
└────────────────────┬────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Final Response       │
         │  {                    │
         │    answer: "...",      │
         │    toolsUsed: [...],  │
         │    toolResults: {...} │
         │  }                    │
         └───────────────────────┘
```

---

## 🛠️ The 7 MCP Tools Explained

### **1. Calculator Tool** 🧮

**Purpose:** Performs mathematical calculations

**When It's Used:**

- Query contains numbers and math operators (+, -, \*, /, %)
- Query mentions "calculate", "compute", "what is X% of Y"
- Query has currency calculations ("$100 + $50")

**How It Works:**

```javascript
Query: "What is 15% of $200?"
  ↓
1. extractMathExpressions() finds "15% of $200"
  ↓
2. convertNaturalLanguageToMath() converts to "(15/100) * 200"
  ↓
3. evaluateMathExpression() calculates = 30
  ↓
4. Returns: {
     calculations: [{original: "15% of $200", result: 30, formatted: "$30.00"}],
     summary: "Calculated 1 expression: $30.00"
   }
```

**Visual Flow:**

```
User: "Calculate 2.9% + $0.30 on $100"
  │
  ▼
Calculator Tool detects: "2.9% + $0.30" and "$100"
  │
  ▼
Extracts: fee = (2.9/100) * 100 + 0.30
  │
  ▼
Calculates: 2.9 + 0.30 = $3.20
  │
  ▼
Returns: "The transaction fee would be $3.20"
```

---

### **2. Shopify Status Tool** 🟢

**Purpose:** Checks real-time Shopify service status

**When It's Used:**

- Query contains: "down", "not working", "outage", "status", "is shopify down"
- Query asks about service availability

**How It Works:**

```javascript
Query: "Is Shopify down right now?"
  ↓
1. shouldUseStatusChecker() returns true
  ↓
2. fetchShopifyStatus() calls https://status.shopify.com/api/v2/status.json
  ↓
3. parseStatusData() extracts:
   - Overall status (operational/minor/major/critical)
   - Active incidents
   - Scheduled maintenance
   - Component statuses
  ↓
4. generateStatusSummary() formats into readable text
  ↓
5. Returns: {
     status: {overallStatus: "operational", incidents: []},
     summary: "## 🟢 Shopify Status Overview\n\nAll services operational..."
   }
```

**Visual Flow:**

```
User: "Is Shopify down?"
  │
  ▼
Status Tool makes HTTP request to status.shopify.com
  │
  ▼
Receives JSON: {status: {indicator: "operational"}, incidents: []}
  │
  ▼
Parses and formats into human-readable summary
  │
  ▼
Returns: "🟢 All Shopify services are operating normally"
```

---

### **3. Web Search Tool** 🔍

**Purpose:** Searches the internet for information

**When It's Used:**

- Query is general knowledge ("what is", "who is", "tell me about")
- Query is NOT Shopify-related
- RAG confidence is low (< 0.5)

**How It Works:**

```javascript
Query: "What is e-commerce?"
  ↓
1. shouldUseWebSearch() returns true (general knowledge, not Shopify)
  ↓
2. searchDuckDuckGo() calls DuckDuckGo API
  ↓
3. searchWikipedia() calls Wikipedia API (if needed)
  ↓
4. Combines results and formats summary
  ↓
5. Returns: {
     results: [{title: "...", content: "...", url: "..."}],
     summary: "## 🔍 Web Search Results\n\n..."
   }
```

**Visual Flow:**

```
User: "What is a payment gateway?"
  │
  ▼
Web Search Tool queries DuckDuckGo API
  │
  ▼
Receives instant answer + related topics
  │
  ▼
Formats results with sources and links
  │
  ▼
Returns: "A payment gateway is a service that processes..."
```

---

### **4. Date/Time Tool** 🕒

**Purpose:** Handles date and time calculations

**When It's Used:**

- Query contains: "what time", "when", "date", "timezone", "schedule"
- Query asks about time differences or conversions

**How It Works:**

```javascript
Query: "What time is it in New York?"
  ↓
1. shouldUseDateTimeTool() detects time-related keywords
  ↓
2. processDateTime() extracts timezone/city
  ↓
3. Calculates current time in that timezone
  ↓
4. Returns formatted time information
```

---

### **5. Code Validator Tool** ✅

**Purpose:** Validates code snippets (Liquid, JavaScript, etc.)

**When It's Used:**

- Query contains: "validate", "check code", "is this code correct"
- Query includes code blocks

**How It Works:**

```javascript
Query: "Validate this Liquid code: {{ product.title }}"
  ↓
1. shouldUseCodeValidator() detects code validation intent
  ↓
2. validateCode() extracts code and checks syntax
  ↓
3. Returns validation results with errors/warnings
```

---

### **6. Currency Converter Tool** 💱

**Purpose:** Converts between currencies

**When It's Used:**

- Query contains: "convert", "USD to EUR", "currency conversion"
- Query mentions multiple currencies

**How It Works:**

```javascript
Query: "Convert $100 USD to EUR"
  ↓
1. shouldUseCurrencyConverter() detects currency conversion
  ↓
2. convert() fetches exchange rates and calculates
  ↓
3. Returns converted amount with exchange rate
```

---

### **7. Theme Compatibility Tool** 🎨

**Purpose:** Checks theme/app compatibility

**When It's Used:**

- Query asks about theme compatibility
- Query mentions app conflicts

---

## 🎬 Three Routing Scenarios

### **Scenario 1: Direct MCP Tool Route**

```
User: "Calculate 15% of $200"
  │
  ▼
classifyQueryType() → {shouldUseMCPTools: true, queryType: "math"}
  │
  ▼
chatController routes directly to MCP tools (skips RAG)
  │
  ▼
MCPOrchestrator.decideToolUse() → ["calculator"]
  │
  ▼
Calculator Tool executes → Returns calculation
  │
  ▼
Response: "15% of $200 = $30.00"
```

### **Scenario 2: RAG + MCP Enhancement**

```
User: "Is Shopify down right now?"
  │
  ▼
classifyQueryType() → {shouldUseMCPTools: false, queryType: "shopify_related"}
  │
  ▼
RAG search runs first (searches documentation)
  │
  ▼
After RAG completes, MCPOrchestrator.processWithTools() is called
  │
  ▼
Status Tool detects "down" keyword → Executes
  │
  ▼
RAG answer + Status Tool results = Enhanced answer
  │
  ▼
Response: "Based on the documentation... [RAG answer]
           ## 🟢 Shopify Status Overview
           All services are operational..."
```

### **Scenario 3: Web Search Route**

```
User: "What is artificial intelligence?"
  │
  ▼
classifyQueryType() → {shouldUseWebSearch: true, isNotShopifyRelated: true}
  │
  ▼
chatController routes directly to Web Search Tool
  │
  ▼
Web Search Tool queries DuckDuckGo/Wikipedia
  │
  ▼
Response: "## 🔍 Web Search Results
           Artificial intelligence (AI) is..."
```

---

## 🔧 Key Components Deep Dive

### **1. MCPOrchestrator Class**

**Location:** `backend/src/mcp/mcpOrchestrator.js`

**Responsibilities:**

- **Tool Registration:** Initializes all 7 tools in `initializeTools()`
- **Decision Making:** `decideToolUse()` determines which tools to use
- **Execution:** `executeTools()` runs tools in parallel
- **Enhancement:** `enhanceAnswerWithToolResults()` combines results

**Key Methods:**

```javascript
// Decision Logic (Priority-based)
decideToolUse(query, confidence) {
  1. Check web search (highest priority for general knowledge)
  2. Check calculator (fast, local)
  3. Check status checker (critical for service issues)
  4. Check code validator (important for dev queries)
  5. Check currency converter
  6. Check theme compatibility
  7. Check date/time
  8. Limit to 2 tools max for performance
}

// Parallel Execution
executeTools(toolNames, query, confidence) {
  // Creates Promise array for parallel execution
  const toolPromises = toolNames.map(async (toolName) => {
    const tool = this.tools.get(toolName);
    return await tool.execute(query); // Each tool has its own execute method
  });

  // Waits for all tools to complete
  return await Promise.all(toolPromises);
}
```

---

### **2. Query Classification**

**Location:** `backend/controllers/chatController.js` (classifyQueryType function)

**Purpose:** Determines routing strategy BEFORE processing

**Logic:**

```javascript
classifyQueryType(message) {
  // Pattern matching for different query types
  const isMathQuery = /[\+\-\*\/\(\)%]/.test(message) ||
                      /\d+%\s+of/.test(message);

  const isDateTimeQuery = /what time|when|date|timezone/i.test(message);

  const isCodeQuery = /validate|check code|is.*code correct/i.test(message);

  const isCurrencyQuery = /convert|USD to|EUR to|currency/i.test(message);

  const isGeneralKnowledgeQuery = /^(what is|who is|when was|where is)/i.test(message);

  const isShopifyRelated = /shopify|store|ecommerce/i.test(message);

  // Routing decision
  const shouldUseMCPTools = !isShopifyRelated &&
                            (isMathQuery || isDateTimeQuery || isCodeQuery || isCurrencyQuery);

  const shouldUseWebSearch = isGeneralKnowledgeQuery && !isShopifyRelated;

  return {shouldUseMCPTools, shouldUseWebSearch, shouldUseRAG, queryType};
}
```

---

### **3. Tool Execution Flow**

**Visual Timeline:**

```
Time →
│
├─ 0ms: User sends query
│
├─ 5ms: Query classification completes
│
├─ 10ms: MCPOrchestrator.decideToolUse() called
│
├─ 15ms: Tools selected: ["calculator", "status"]
│
├─ 20ms: executeTools() starts (parallel execution)
│   │
│   ├─ Calculator Tool starts (async)
│   │   └─ 50ms: Calculator completes
│   │
│   └─ Status Tool starts (async)
│       └─ 200ms: Status API call completes
│
├─ 220ms: All tools complete (Promise.all resolves)
│
├─ 225ms: enhanceAnswerWithToolResults() formats results
│
└─ 250ms: Final response returned to user
```

---

## 🎯 Invocation Points

### **Where MCP Tools Are Called**

1. **Direct Route (chatController.js:885-946)**

   ```javascript
   if (queryClassification.shouldUseMCPTools) {
     const mcpResult = await mcpOrchestrator.processWithTools(message, 0.9, "");
     // Returns immediately, no RAG
   }
   ```

2. **Web Search Route (chatController.js:816-881)**

   ```javascript
   if (queryClassification.shouldUseWebSearch) {
     const mcpResult = await mcpOrchestrator.processWithTools(message, 0.1, "");
     // Web search only, no RAG
   }
   ```

3. **RAG Enhancement Route (chatController.js:1091-1102)**
   ```javascript
   // After RAG search completes
   if (mcpOrchestrator) {
     const mcpResult = await mcpOrchestrator.processWithTools(
       message,
       confidence.score,
       ragAnswer
     );
     // Enhances RAG answer with tool results
   }
   ```

---

## 🧠 Mental Model Summary

**Think of MCP Tools as:**

1. **Specialized Workers:** Each tool is an expert in one domain

   - Calculator = Math expert
   - Status Tool = Real-time data expert
   - Web Search = Internet knowledge expert

2. **Smart Router:** The Orchestrator is like a dispatcher

   - Analyzes the request
   - Decides which workers are needed
   - Coordinates their work
   - Combines their results

3. **Enhancement Layer:** Tools don't replace RAG, they enhance it

   - RAG provides documentation answers
   - Tools add real-time data, calculations, external info
   - Combined = Complete answer

4. **Parallel Processing:** Tools run simultaneously for speed
   - Multiple tools can run at once
   - Results are combined after all complete
   - Faster than sequential execution

---

## 📊 Performance Characteristics

- **Calculator:** ~5-10ms (local calculation)
- **Status Check:** ~200-500ms (API call)
- **Web Search:** ~300-1000ms (external APIs)
- **Code Validator:** ~10-50ms (local parsing)
- **Currency Converter:** ~200-400ms (API call)
- **Date/Time:** ~5-10ms (local calculation)
- **Theme Compatibility:** ~50-200ms (local check)

**Parallel execution means:** If 2 tools run together, total time = max(tool1, tool2), not tool1 + tool2.

---

## 🔍 Debugging Tips

**To see MCP tools in action, check logs for:**

- `🔧 MCP Tools initialized:` - Shows all registered tools
- `🔧 MCP Decision for query:` - Shows tool selection
- `🔧 Using MCP tools:` - Shows which tools are executing
- `🔧 Web search check:` - Shows web search decision

**In the response object, check:**

- `response.mcpTools.toolsUsed` - Array of tool names used
- `response.mcpTools.toolResults` - Detailed results from each tool

---

## 🎓 Key Takeaways

1. **MCP Tools are NOT a replacement for RAG** - They enhance it
2. **Tools run in parallel** - For better performance
3. **Smart routing** - Different paths for different query types
4. **Modular design** - Each tool is independent and testable
5. **Extensible** - Easy to add new tools by implementing the tool interface

---

## 🚀 Future Enhancements

Potential new tools:

- **API Testing Tool:** Test Shopify API endpoints
- **Theme Analyzer:** Analyze theme code for issues
- **Performance Monitor:** Check store performance metrics
- **SEO Checker:** Analyze SEO aspects of store
- **Inventory Calculator:** Calculate inventory metrics

Each would follow the same pattern:

1. Create tool class with `shouldUse()` and `execute()` methods
2. Register in `MCPOrchestrator.initializeTools()`
3. Add decision logic in `decideToolUse()`
4. Add enhancement logic in `enhanceAnswerWithToolResults()`
