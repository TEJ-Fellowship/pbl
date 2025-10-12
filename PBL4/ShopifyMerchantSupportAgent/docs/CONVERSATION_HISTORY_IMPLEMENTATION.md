# Conversation History Implementation - Tier 2

## 🎯 Overview

This document describes the implementation of **Tier 2 conversation history** for the Shopify Merchant Support Agent. The system now maintains a sliding window of the last 8 messages (4 turns) using MongoDB for persistence across sessions.

## 🏗️ Architecture

### Before Implementation

- **Terminal chat only**: No conversation history storage
- **Stateless interactions**: Each question was processed independently
- **No context awareness**: No memory of previous Q&A pairs
- **No persistence**: Conversations were lost when the session ended

### After Implementation

- **Persistent conversation history**: All messages stored in MongoDB
- **Sliding window memory**: Maintains last 8 messages (4 turns) for context
- **Context-aware retrieval**: Uses conversation history for query reformulation
- **Session persistence**: Conversations survive across application restarts
- **Rich metadata**: Stores search results, processing time, and model information

## 📊 Data Models

### Conversation Model (`models/Conversation.js`)

```javascript
{
  sessionId: String,        // Unique session identifier
  userId: String,           // User identifier (default: "anonymous")
  title: String,            // Auto-generated conversation title
  messages: [ObjectId],     // Array of message references
  createdAt: Date,          // Creation timestamp
  updatedAt: Date,          // Last update timestamp
  isActive: Boolean         // Conversation status
}
```

### Message Model (`models/Message.js`)

```javascript
{
  conversationId: ObjectId,  // Reference to parent conversation
  role: String,             // "user" or "assistant"
  content: String,          // Message content
  timestamp: Date,          // Message timestamp
  metadata: {               // Rich metadata
    searchResults: [Object], // Search results used for response
    modelUsed: String,       // AI model used
    processingTime: Number,   // Processing time in ms
    tokensUsed: Number        // Token count (if available)
  }
}
```

## 🔧 Core Components

### 1. BufferWindowMemory Service (`src/memory/BufferWindowMemory.js`)

**Key Features:**

- **Sliding Window**: Maintains last 8 messages (configurable)
- **MongoDB Persistence**: Stores conversations and messages
- **Context Generation**: Formats conversation history for retrieval
- **Session Management**: Handles conversation lifecycle

**Methods:**

- `initializeConversation()`: Create or retrieve conversation
- `addMessage(role, content, metadata)`: Store message with metadata
- `getRecentMessages()`: Get sliding window of messages
- `getConversationContext()`: Format context for query reformulation
- `clearHistory()`: Clear conversation history
- `getStats()`: Get conversation statistics

### 2. Enhanced Chat Interface (`src/chat.js`)

**New Features:**

- **MongoDB Integration**: Connects to MongoDB on startup
- **Memory Initialization**: Creates BufferWindowMemory instance
- **Context-Aware Search**: Uses conversation history in query embedding
- **Message Storage**: Stores both user questions and assistant responses
- **Rich Metadata**: Captures search results and processing metrics
- **Session Commands**: `stats` and `clear` commands for management

## 🔄 Data Flow

### 1. User Question Processing

```
User Question → Store in MongoDB → Get Conversation Context →
Embed Query with Context → Hybrid Search → Generate Response →
Store Response in MongoDB → Display Answer
```

### 2. Context Integration

```
Previous Messages (8 max) → Format as Context String →
Append to Current Query → Embed Combined Query →
Search with Enhanced Context → Generate Contextual Response
```

### 3. Memory Management

```
New Message → Add to Conversation → Update Sliding Window →
Maintain Last 8 Messages → Persist to MongoDB →
Update Conversation Timestamp
```

## 🚀 Usage Examples

### Starting a New Conversation

```bash
npm run chat
# Creates new session with unique ID
# Initializes MongoDB connection
# Sets up BufferWindowMemory
```

### Conversation Commands

```bash
# View statistics
stats

# Clear conversation history
clear

# Exit application
exit
```

### Sample Conversation Flow

```
User: "How do I add products to my store?"
→ Stored in MongoDB
→ Context: "" (first message)
→ Search: "How do I add products to my store?"
→ Response: "To add products..."

User: "What about bulk upload?"
→ Stored in MongoDB
→ Context: "user: How do I add products...\nassistant: To add products..."
→ Search: "Previous context + Current question: What about bulk upload?"
→ Response: "For bulk upload, you can use CSV files..."
```

## 📈 Benefits

### 1. **Contextual Understanding**

- AI can reference previous questions and answers
- Provides more relevant and personalized responses
- Maintains conversation continuity

### 2. **Improved User Experience**

- Conversations feel more natural and flowing
- Users don't need to repeat context
- Better follow-up question handling

### 3. **Enhanced Retrieval**

- Query reformulation uses conversation history
- Better semantic understanding of user intent
- More accurate search results

### 4. **Analytics and Insights**

- Rich metadata for conversation analysis
- Processing time tracking
- Search result effectiveness metrics

## 🔧 Configuration

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/shopify-support-agent
```

### Memory Configuration

```javascript
const memory = new BufferWindowMemory({
  windowSize: 8, // Last 8 messages (4 turns)
  sessionId: "unique_id", // Unique session identifier
});
```

## 🧪 Testing

### Run Conversation History Tests

```bash
npm run test-conversation
```

### Test Coverage

- ✅ MongoDB connection and models
- ✅ BufferWindowMemory initialization
- ✅ Message storage and retrieval
- ✅ Sliding window functionality
- ✅ Context generation
- ✅ Statistics and cleanup
- ✅ Data persistence

## 🚨 Error Handling

### MongoDB Connection Issues

- Graceful fallback with error messages
- Automatic reconnection attempts
- Clear setup instructions

### Memory Service Errors

- Safe error handling in all methods
- Fallback to empty context on errors
- Detailed error logging

### Data Integrity

- Validation on message creation
- Automatic cleanup on errors
- Transaction safety for critical operations

## 🔮 Future Enhancements

### Potential Improvements

1. **User Authentication**: Link conversations to specific users
2. **Conversation Search**: Search through historical conversations
3. **Export Functionality**: Export conversation history
4. **Analytics Dashboard**: Visualize conversation patterns
5. **Multi-language Support**: Handle different languages
6. **Conversation Summarization**: Auto-generate conversation summaries

## 📝 Implementation Notes

### Performance Considerations

- MongoDB indexes on `sessionId`, `conversationId`, and `timestamp`
- Efficient querying with compound indexes
- Minimal memory footprint with sliding window

### Security Considerations

- No sensitive data in conversation storage
- Session-based isolation
- Optional user authentication support

### Scalability

- MongoDB horizontal scaling support
- Efficient query patterns
- Minimal database load with proper indexing

---

## ✅ Implementation Complete

The Tier 2 conversation history implementation is now fully operational with:

- ✅ MongoDB integration and models
- ✅ BufferWindowMemory service
- ✅ Context-aware retrieval
- ✅ Enhanced chat interface
- ✅ Comprehensive testing
- ✅ Documentation and setup instructions

The system now provides a much more sophisticated and user-friendly experience with persistent conversation history and context-aware responses.
