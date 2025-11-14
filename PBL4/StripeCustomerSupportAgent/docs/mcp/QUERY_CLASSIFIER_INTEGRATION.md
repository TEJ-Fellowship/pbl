# Query Classifier Integration

This document describes the integration of the AI-powered query classifier into the existing `integratedChat.js` system.

## Overview

The system now uses an intelligent query classifier to automatically decide between three approaches:

1. **MCP_TOOLS_ONLY** - Uses MCP tools for direct answers (calculations, status checks)
2. **HYBRID_SEARCH** - Uses documentation search for comprehensive answers (API guides, tutorials)
3. **COMBINED** - Uses both MCP tools and documentation search (complex queries)

## Key Changes

### 1. Added Query Classifier Import

```javascript
import QueryClassifier from "../services/queryClassifier.js";
```

### 2. Initialized Query Classifier

```javascript
const queryClassifier = new QueryClassifier();
```

### 3. Intelligent Query Routing

The main query processing logic now:

1. **Classifies the query** using AI-powered analysis
2. **Routes based on classification** to the appropriate approach
3. **Uses existing functions** (`generateResponseWithMCP`, `generateResponseWithMemoryAndMCP`)
4. **Maintains backward compatibility** with the existing system

## Classification Logic

### MCP_TOOLS_ONLY

- **Triggers**: Calculations, status checks, real-time data queries
- **Examples**: "What's Stripe's fee for $1000?", "Is Stripe down?"
- **Process**: Uses MCP tools directly, falls back to hybrid search if MCP fails

### HYBRID_SEARCH

- **Triggers**: API documentation, implementation guides, general concepts
- **Examples**: "How do I create a payment intent?", "How to handle webhooks?"
- **Process**: Uses hybrid search through documentation

### COMBINED

- **Triggers**: Complex queries needing both real-time data and documentation
- **Examples**: "Calculate fees and show me the API implementation"
- **Process**: Uses both MCP tools and hybrid search in parallel

## New Commands

### `classifier`

Shows the query classifier status and available approaches:

```
🤖 Query Classifier Status:
   Gemini AI: ✅ Available
   Model: gemini-2.0-flash

📊 Classification Approaches:
   • MCP_TOOLS_ONLY - Direct tool responses (calculations, status checks)
   • HYBRID_SEARCH - Documentation-based responses (API guides, tutorials)
   • COMBINED - Both tools and documentation (complex queries)
```

### Updated `sample` Command

Now shows examples organized by classification approach:

```
🔧 MCP_TOOLS_ONLY Examples:
  • What's Stripe's fee for $1000? (Calculator Tool)
  • Is Stripe down right now? (Status Checker Tool)

📚 HYBRID_SEARCH Examples:
  • How do I create a payment intent with Stripe?
  • How to handle Stripe API errors and exceptions?

🔧📚 COMBINED Examples:
  • Calculate Stripe fees for $500 and show me the API implementation
  • Is Stripe working and how do I implement webhooks?
```

## Benefits

### ✅ Intelligent Routing

- **AI-powered decisions** based on query content and context
- **Automatic optimization** for different query types
- **Reduced unnecessary processing** by avoiding hybrid search for simple MCP queries

### ✅ Maintained Compatibility

- **Uses existing functions** (`generateResponseWithMCP`, `generateResponseWithMemoryAndMCP`)
- **Same configuration** and setup process
- **Backward compatible** with existing system

### ✅ Enhanced User Experience

- **Faster responses** for MCP tool queries
- **More comprehensive answers** for documentation queries
- **Better handling** of complex queries requiring both approaches

## Error Handling

- **AI Unavailable**: Falls back to rule-based classification
- **MCP Tools Unavailable**: Uses hybrid search only
- **Hybrid Search Unavailable**: Uses MCP tools only
- **Both Unavailable**: Returns error message

## Usage

Run the updated system:

```bash
cd Backend
node scripts/integratedChat.js
```

The system will automatically:

1. Classify each query using AI
2. Route to the appropriate approach
3. Use existing response generation functions
4. Provide optimal performance for each query type

## Example Flow

```
User: "What's Stripe's fee for $1000?"
System: [Classification: MCP_TOOLS_ONLY] Using MCP tools only approach
System: [MCP Calculator Tool] Stripe's fee for $1000 is $29.00 (2.9% + $0.30)
```

```
User: "How do I create a payment intent?"
System: [Classification: HYBRID_SEARCH] Using hybrid search only approach
System: [Documentation Search] Here's how to create a payment intent...
```

```
User: "Calculate fees for $500 and show me the implementation"
System: [Classification: COMBINED] Using combined approach (MCP + Hybrid search)
System: [MCP Calculator + Documentation] Fee calculation + API implementation guide
```

This integration provides the best of both worlds: intelligent routing with maintained compatibility with the existing system.
