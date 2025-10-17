# Multi-Turn Conversation Implementation

## Overview

This implementation adds comprehensive multi-turn conversation capabilities to the Shopify Merchant Support Agent, including:

- **Follow-up Question Detection**: Automatically detects when users ask follow-up questions
- **Context Management**: Maintains conversation state and user preferences
- **Ambiguity Clarification**: Detects ambiguous questions and requests clarification
- **Context Compression**: Compresses long conversations every 10 turns using GPT-4
- **User Preference Tracking**: Learns and adapts to user's technical level and API preferences

## Features Implemented

### 1. Follow-up Question Detection

The system automatically detects follow-up questions using multiple indicators:

- **Follow-up words**: "what about", "how about", "also", "additionally", etc.
- **Pronoun references**: "it", "this", "that", "these", "those", "them"
- **Continuation patterns**: "and", "but", "however", "on the other hand"

**Example:**

```
User: "How do I create products using the Shopify API?"
Assistant: "To create products using the Shopify API..."
User: "What about recurring payments?"  // ← Detected as follow-up
```

### 2. Context Management

The system maintains comprehensive conversation state:

- **Turn counting**: Tracks conversation length
- **User preferences**: API preference (REST, GraphQL, Node SDK), technical level
- **Topic tracking**: Monitors discussed topics (products, orders, customers, etc.)
- **Conversation flow**: Tracks current and previous topics

### 3. Ambiguity Detection and Clarification

Automatically detects ambiguous questions and requests clarification:

**Ambiguity Patterns:**

- API questions: "Are you asking about REST Admin API, GraphQL Admin API, or Storefront API?"
- Payment questions: "Are you asking about one-time payments, recurring payments, or payment processing setup?"
- Integration questions: "Are you asking about integrating with external services, connecting apps, or linking accounts?"

**Example:**

```
User: "How do I integrate payments?"
Assistant: "Are you asking about one-time payments, recurring payments, or payment processing setup?"
User: "Recurring payments"
Assistant: "For recurring payments in Shopify..."
```

### 4. Context Compression

Every 10 turns, the system compresses conversation context using GPT-4:

- **Compression trigger**: After 10 turns or when conversation exceeds 20 turns
- **Context preservation**: Maintains key topics, user preferences, and important context
- **Memory efficiency**: Reduces token usage while preserving conversation continuity

### 5. User Preference Learning

The system learns and adapts to user preferences:

- **API preference**: Detects if user prefers REST, GraphQL, or Node SDK
- **Technical level**: Adapts responses to beginner, intermediate, or advanced level
- **Topic interests**: Tracks which topics the user is interested in

## Implementation Details

### Core Components

#### 1. MultiTurnConversationManager (`/backend/src/multi-turn-conversation.js`)

Main class handling all multi-turn conversation features:

```javascript
export class MultiTurnConversationManager {
  // Initialize conversation state
  async initializeConversationState(sessionId)

  // Detect follow-up questions
  async detectFollowUp(currentMessage, conversationHistory)

  // Detect ambiguous questions
  async detectAmbiguity(message, conversationHistory)

  // Extract user preferences
  async extractUserPreferences(message, conversationHistory)

  // Compress conversation context
  async compressConversationContext(conversationHistory, currentState)

  // Build enhanced context
  async buildEnhancedContext(message, sessionId, conversationHistory, searchResults)

  // Generate enhanced response
  async generateEnhancedResponse(message, sessionId, conversationHistory, searchResults)
}
```

#### 2. Enhanced Chat Controller (`/backend/controllers/chatController.js`)

Updated to integrate multi-turn capabilities:

- **Enhanced context building**: Uses multi-turn manager for context
- **Clarification handling**: Processes clarification responses
- **Multi-turn metadata**: Includes conversation state in responses
- **Statistics tracking**: Provides conversation statistics

#### 3. Updated Routes (`/backend/routes/route.js`)

New API endpoints:

- `POST /chat` - Enhanced chat with multi-turn support
- `POST /clarify` - Handle clarification responses
- `GET /stats/:sessionId` - Get conversation statistics
- `DELETE /cleanup/:sessionId` - Clean up conversation state

### API Usage Examples

#### 1. Basic Chat with Multi-Turn Support

```javascript
// POST /chat
{
  "message": "How do I create products using the Shopify API?",
  "sessionId": "user-session-123"
}

// Response includes multi-turn context
{
  "answer": "To create products using the Shopify API...",
  "confidence": { "score": 85, "level": "High" },
  "sources": [...],
  "multiTurnContext": {
    "turnCount": 1,
    "isFollowUp": false,
    "userPreferences": {
      "preferredAPI": null,
      "technicalLevel": "intermediate",
      "topics": ["products"]
    },
    "conversationStats": {...}
  }
}
```

#### 2. Follow-up Question

```javascript
// POST /chat (follow-up)
{
  "message": "What about recurring payments?",
  "sessionId": "user-session-123"
}

// Response detects follow-up and maintains context
{
  "answer": "Building on your previous question about product creation, for recurring payments...",
  "multiTurnContext": {
    "turnCount": 2,
    "isFollowUp": true,
    "followUpConfidence": 0.8,
    "userPreferences": {
      "preferredAPI": "rest",
      "technicalLevel": "intermediate",
      "topics": ["products", "payments"]
    }
  }
}
```

#### 3. Clarification Request

```javascript
// POST /chat (ambiguous question)
{
  "message": "How do I integrate payments?",
  "sessionId": "user-session-123"
}

// Response requests clarification
{
  "answer": "Are you asking about one-time payments, recurring payments, or payment processing setup?",
  "needsClarification": true,
  "clarificationQuestion": "Are you asking about one-time payments, recurring payments, or payment processing setup?"
}
```

#### 4. Clarification Response

```javascript
// POST /clarify
{
  "clarificationResponse": "Recurring payments",
  "originalQuestion": "How do I integrate payments?",
  "sessionId": "user-session-123"
}

// Response provides specific answer
{
  "answer": "For recurring payments in Shopify...",
  "multiTurnContext": {
    "clarificationProcessed": true
  }
}
```

#### 5. Conversation Statistics

```javascript
// GET /stats/user-session-123
{
  "conversation": {
    "id": "...",
    "sessionId": "user-session-123",
    "title": "How do I create products...",
    "messageCount": 8,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "multiTurnStats": {
    "turnCount": 8,
    "lastCompressionTurn": 0,
    "hasContextSummary": false,
    "userPreferences": {
      "preferredAPI": "rest",
      "technicalLevel": "intermediate",
      "topics": ["products", "payments", "orders"]
    }
  }
}
```

## Testing

Run the comprehensive test suite:

```bash
cd backend
node src/test-multi-turn.js
```

The test suite covers:

- Follow-up question detection
- Ambiguity detection and clarification
- User preference extraction
- Context compression
- Enhanced context building
- Conversation state management
- State cleanup

## Mental Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Turn Conversation Flow            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Message                                               │
│       ↓                                                     │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Follow-up       │    │ Ambiguity       │                │
│  │ Detection       │    │ Detection       │                │
│  └─────────────────┘    └─────────────────┘                │
│       ↓                           ↓                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Context         │    │ Clarification   │                │
│  │ Building        │    │ Request         │                │
│  └─────────────────┘    └─────────────────┘                │
│       ↓                           ↓                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ User Preference │    │ Wait for       │                │
│  │ Extraction      │    │ Clarification   │                │
│  └─────────────────┘    └─────────────────┘                │
│       ↓                           ↓                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Context         │    │ Process         │                │
│  │ Compression     │    │ Clarification   │                │
│  │ (Every 10 turns)│    │ Response        │                │
│  └─────────────────┘    └─────────────────┘                │
│       ↓                           ↓                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Enhanced        │    │ Enhanced        │                │
│  │ Response        │    │ Response        │                │
│  │ Generation      │    │ Generation      │                │
│  └─────────────────┘    └─────────────────┘                │
│       ↓                           ↓                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Update          │    │ Update          │                │
│  │ Conversation    │    │ Conversation    │                │
│  │ State           │    │ State           │                │
│  └─────────────────┘    └─────────────────┘                │
│       ↓                           ↓                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Return          │    │ Return          │                │
│  │ Response        │    │ Response        │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Improved User Experience**: Natural conversation flow with context awareness
2. **Reduced Ambiguity**: Automatic clarification requests prevent misunderstandings
3. **Personalized Responses**: Adapts to user's technical level and preferences
4. **Memory Efficiency**: Context compression prevents token overflow
5. **Better Follow-ups**: Seamlessly handles follow-up questions
6. **Comprehensive Tracking**: Detailed conversation statistics and state management

## Future Enhancements

- **Sentiment Analysis**: Track user satisfaction and adjust responses
- **Topic Modeling**: Advanced topic detection and conversation flow analysis
- **Multi-language Support**: Extend clarification and follow-up detection to other languages
- **Advanced Compression**: Implement more sophisticated context compression strategies
- **Real-time Adaptation**: Dynamic adjustment of conversation parameters based on user behavior
