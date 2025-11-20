# How to View/Receive Messages

This guide shows you how to retrieve messages from your chat application.

## API Endpoints for Viewing Messages

### 1. Get Messages from a Conversation

Retrieve all messages in a specific conversation.

**Endpoint:** `GET /api/conversation/:conversationId`

**Parameters:**
- `conversationId` (URL parameter) - The ID of the conversation
- `limit` (query parameter, optional) - Number of messages to retrieve (default: 50)

**Example Request:**
```bash
GET http://localhost:3000/api/conversation/123e4567-e89b-12d3-a456-426614174000?limit=20
```

**Response:**
```json
{
  "message": "Messages retrieved successfully",
  "conversationId": "123e4567-e89b-12d3-a456-426614174000",
  "count": 3,
  "data": [
    {
      "messageId": "timeuuid-string",
      "conversationId": "123e4567-e89b-12d3-a456-426614174000",
      "senderId": "550e8400-e29b-41d4-a716-446655440000",
      "content": "That's wonderful to hear!",
      "messageType": "text",
      "status": "sent",
      "createdAt": "2024-11-18T10:35:00.000Z"
    },
    {
      "messageId": "timeuuid-string",
      "conversationId": "123e4567-e89b-12d3-a456-426614174000",
      "senderId": "660e8400-e29b-41d4-a716-446655440001",
      "content": "Hi Alice! I'm doing great, thanks!",
      "messageType": "text",
      "status": "sent",
      "createdAt": "2024-11-18T10:33:00.000Z"
    },
    {
      "messageId": "timeuuid-string",
      "conversationId": "123e4567-e89b-12d3-a456-426614174000",
      "senderId": "550e8400-e29b-41d4-a716-446655440000",
      "content": "Hello Bob! How are you?",
      "messageType": "text",
      "status": "sent",
      "createdAt": "2024-11-18T10:32:00.000Z"
    }
  ]
}
```

### 2. Get All Conversations for a User

Get all conversations where a user is a participant.

**Endpoint:** `GET /api/conversation/user/:userId`

**Parameters:**
- `userId` (URL parameter) - The ID of the user

**Example Request:**
```bash
GET http://localhost:3000/api/conversation/user/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "message": "Conversations retrieved successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "count": 2,
  "data": [
    {
      "conversationId": "123e4567-e89b-12d3-a456-426614174000",
      "user1Id": "550e8400-e29b-41d4-a716-446655440000",
      "user2Id": "660e8400-e29b-41d4-a716-446655440001",
      "lastMessageId": "timeuuid-string",
      "lastMessageText": "That's wonderful to hear!",
      "lastMessageTime": "2024-11-18T10:35:00.000Z",
      "lastMessageSenderId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2024-11-18T10:30:00.000Z"
    }
  ]
}
```

## Using Postman

### View Messages in a Conversation:

1. **Method:** `GET`
2. **URL:** `http://localhost:3000/api/conversation/{conversationId}`
   - Replace `{conversationId}` with the actual conversation ID
3. **Optional Query Parameter:**
   - `limit=20` (to get only 20 messages)

**Example:**
```
GET http://localhost:3000/api/conversation/123e4567-e89b-12d3-a456-426614174000?limit=20
```

### View All Conversations for a User:

1. **Method:** `GET`
2. **URL:** `http://localhost:3000/api/conversation/user/{userId}`
   - Replace `{userId}` with the actual user ID

**Example:**
```
GET http://localhost:3000/api/conversation/user/550e8400-e29b-41d4-a716-446655440000
```

## Using cURL

### Get Messages from a Conversation:
```bash
curl http://localhost:3000/api/conversation/123e4567-e89b-12d3-a456-426614174000?limit=20
```

### Get All Conversations for a User:
```bash
curl http://localhost:3000/api/conversation/user/550e8400-e29b-41d4-a716-446655440000
```

## Complete Workflow Example

### Step 1: Send a Message
```bash
POST http://localhost:3000/api/conversation/send
{
  "senderId": "alice-uuid",
  "receiverId": "bob-uuid",
  "content": "Hello Bob!"
}
```

**Response includes `conversationId`** - save this!

### Step 2: View Messages in That Conversation
```bash
GET http://localhost:3000/api/conversation/{conversationId-from-step-1}
```

### Step 3: View All Conversations for a User
```bash
GET http://localhost:3000/api/conversation/user/alice-uuid
```

This shows all conversations where Alice is a participant, sorted by most recent message first.

## Using JavaScript/Node.js

```javascript
// Get messages from a conversation
const getMessages = async (conversationId, limit = 50) => {
  const response = await fetch(
    `http://localhost:3000/api/conversation/${conversationId}?limit=${limit}`
  );
  const data = await response.json();
  return data;
};

// Get all conversations for a user
const getUserConversations = async (userId) => {
  const response = await fetch(
    `http://localhost:3000/api/conversation/user/${userId}`
  );
  const data = await response.json();
  return data;
};

// Usage
const messages = await getMessages('conversation-id-here', 20);
console.log('Messages:', messages.data);

const conversations = await getUserConversations('user-id-here');
console.log('Conversations:', conversations.data);
```

## Notes

- Messages are returned in **descending order** (newest first)
- Default limit is **50 messages** per request
- You can specify a custom limit using the `limit` query parameter
- Conversations are sorted by **last_message_time** (most recent first)
- All message data is stored in **Cassandra**
- Conversation metadata (last message preview) is stored in **PostgreSQL**

