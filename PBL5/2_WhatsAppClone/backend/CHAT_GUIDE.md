# Complete Guide: Create Users and Chat

This guide will walk you through creating users and sending messages between them.

## Prerequisites

1. **PostgreSQL** - Running with database configured
2. **Cassandra** - Running on `127.0.0.1:9042` with keyspace `chatapp`
3. **Node.js** - Installed
4. **Environment** - `.env` file with `DATABASE_URL`

## Step 1: Start the Server

```bash
cd backend
npm start
```

Server will run on **http://localhost:3000**

## Step 2: Create Users

You need to create at least 2 users to start chatting.

### Create User 1 (Alice)

**Request:**
```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "name": "Alice",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice",
    "phone": "1234567890",
    "created_at": "2024-11-18T10:30:00.000Z"
  }
}
```

**Save the `user_id` - you'll need it!** Let's call it `alice_user_id`

### Create User 2 (Bob)

**Request:**
```bash
POST http://localhost:3000/api/users
Content-Type: application/json

{
  "name": "Bob",
  "phone": "0987654321"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "data": {
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Bob",
    "phone": "0987654321",
    "created_at": "2024-11-18T10:31:00.000Z"
  }
}
```

**Save the `user_id` - you'll need it!** Let's call it `bob_user_id`

## Step 3: Send Messages Between Users

Now you can send messages between Alice and Bob!

### Alice sends a message to Bob

**Request:**
```bash
POST http://localhost:3000/api/conversation/send
Content-Type: application/json

{
  "senderId": "550e8400-e29b-41d4-a716-446655440000",
  "receiverId": "660e8400-e29b-41d4-a716-446655440001",
  "content": "Hello Bob! How are you?",
  "conversationId": "optional-if-new-conversation"
}
```

**Note:** `conversationId` is optional. If you don't provide it, a new conversation will be created automatically.

**Response:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "conversationId": "770e8400-e29b-41d4-a716-446655440002",
    "messageId": "timeuuid-string",
    "senderId": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Hello Bob! How are you?",
    "messageType": "text",
    "status": "sent",
    "createdAt": "2024-11-18T10:32:00.000Z",
    "receiverId": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Save the `conversationId`** - use it for subsequent messages in this conversation!

### Bob replies to Alice

**Request:**
```bash
POST http://localhost:3000/api/conversation/send
Content-Type: application/json

{
  "conversationId": "770e8400-e29b-41d4-a716-446655440002",
  "senderId": "660e8400-e29b-41d4-a716-446655440001",
  "receiverId": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Hi Alice! I'm doing great, thanks!"
}
```

### Continue the conversation

Keep using the same `conversationId` for all messages in this conversation:

**Alice sends another message:**
```bash
POST http://localhost:3000/api/conversation/send
Content-Type: application/json

{
  "conversationId": "770e8400-e29b-41d4-a716-446655440002",
  "senderId": "550e8400-e29b-41d4-a716-446655440000",
  "receiverId": "660e8400-e29b-41d4-a716-446655440001",
  "content": "That's wonderful to hear!"
}
```

## Step 4: Get Messages from a Conversation

To retrieve all messages in a conversation:

**Request:**
```bash
GET http://localhost:3000/api/conversation/770e8400-e29b-41d4-a716-446655440002
```

**Response:**
```json
[
  {
    "conversation_id": "770e8400-e29b-41d4-a716-446655440002",
    "message_id": "timeuuid",
    "sender_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "That's wonderful to hear!",
    "message_type": "text",
    "status": "sent",
    "created_at": "2024-11-18T10:35:00.000Z"
  },
  {
    "conversation_id": "770e8400-e29b-41d4-a716-446655440002",
    "message_id": "timeuuid",
    "sender_id": "660e8400-e29b-41d4-a716-446655440001",
    "content": "Hi Alice! I'm doing great, thanks!",
    "message_type": "text",
    "status": "sent",
    "created_at": "2024-11-18T10:33:00.000Z"
  },
  {
    "conversation_id": "770e8400-e29b-41d4-a716-446655440002",
    "message_id": "timeuuid",
    "sender_id": "550e8400-e29b-41d4-a716-446655440000",
    "content": "Hello Bob! How are you?",
    "message_type": "text",
    "status": "sent",
    "created_at": "2024-11-18T10:32:00.000Z"
  }
]
```

## Additional API Endpoints

### Get All Users

```bash
GET http://localhost:3000/api/users
```

### Get User by ID

```bash
GET http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

## Using Postman

### Collection Setup

1. **Create User 1:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/users`
   - Body (raw JSON):
     ```json
     {
       "name": "Alice",
       "phone": "1234567890"
     }
     ```
   - Save the `user_id` from response

2. **Create User 2:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/users`
   - Body (raw JSON):
     ```json
     {
       "name": "Bob",
       "phone": "0987654321"
     }
     ```
   - Save the `user_id` from response

3. **Send Message (User 1 to User 2):**
   - Method: `POST`
   - URL: `http://localhost:3000/api/conversation/send`
   - Body (raw JSON):
     ```json
     {
       "senderId": "alice_user_id_here",
       "receiverId": "bob_user_id_here",
       "content": "Hello Bob!"
     }
     ```
   - Save the `conversationId` from response

4. **Send Reply (User 2 to User 1):**
   - Method: `POST`
   - URL: `http://localhost:3000/api/conversation/send`
   - Body (raw JSON):
     ```json
     {
       "conversationId": "conversation_id_from_previous_response",
       "senderId": "bob_user_id_here",
       "receiverId": "alice_user_id_here",
       "content": "Hi Alice!"
     }
     ```

5. **Get Messages:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/conversation/{conversationId}`

## Using cURL

### Create User 1
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "phone": "1234567890"}'
```

### Create User 2
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "phone": "0987654321"}'
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/conversation/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "alice_user_id",
    "receiverId": "bob_user_id",
    "content": "Hello Bob!"
  }'
```

### Get Messages
```bash
curl http://localhost:3000/api/conversation/conversation_id_here
```

## What Happens Automatically

When you send a message:

1. ✅ **Message saved to Cassandra** - Full message content stored
2. ✅ **Conversation created/updated in PostgreSQL** - If conversation doesn't exist, it's created automatically
3. ✅ **Metadata updated** - Last message info updated in PostgreSQL:
   - `last_message_id`
   - `last_message_content`
   - `last_message_time`
   - `last_message_sender_id`

## Quick Test Script

You can also use the provided test script:

1. Edit `test-send-message.js`
2. Replace UUIDs with actual user IDs
3. Run: `node test-send-message.js`

## Troubleshooting

- **"User not found"**: Make sure you're using valid `user_id` values
- **"Phone number already exists"**: Each phone number must be unique
- **"Missing required fields"**: Ensure `senderId`, `receiverId`, and `content` are provided
- **Database errors**: Check PostgreSQL and Cassandra are running

