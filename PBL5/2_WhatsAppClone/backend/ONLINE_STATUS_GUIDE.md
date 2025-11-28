# Online Status Guide

This guide explains how to use the online status feature in the WhatsApp Clone backend.

## Overview

The online status feature tracks which users are currently online and notifies other users in conversations when someone comes online or goes offline.

## How It Works

1. **User Registration**: When a user connects, they must register with their `userId`
2. **Status Tracking**: The system tracks online users in memory
3. **Conversation Notifications**: When a user joins a conversation, others are notified of their online status
4. **Disconnect Handling**: When a user disconnects, their conversations are notified

## Client Implementation

### Step 1: Connect and Register User

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// After connecting, register the user
socket.on('connect', () => {
  console.log('Connected to server');
  
  // Register with your userId
  socket.emit('user:register', {
    userId: 'your-user-id-here'
  });
});

// Confirm registration
socket.on('user:registered', (data) => {
  console.log('User registered:', data);
  // { userId: '...', isOnline: true }
});
```

### Step 2: Join Conversation

```javascript
// Join a conversation (user must be registered first)
socket.emit('conversation:join', conversationId);

// Listen for online/offline events in the conversation
socket.on('user:online', (data) => {
  console.log(`User ${data.userId} is now online`);
  // Update UI to show user as online
});

socket.on('user:offline', (data) => {
  console.log(`User ${data.userId} is now offline`);
  // Update UI to show user as offline
});
```

### Step 3: Check Online Status

```javascript
// Check if specific users are online
socket.emit('user:check-online', {
  userIds: ['user-id-1', 'user-id-2', 'user-id-3']
});

// Receive online status
socket.on('user:online-status', (status) => {
  console.log('Online status:', status);
  // {
  //   'user-id-1': true,
  //   'user-id-2': false,
  //   'user-id-3': true
  // }
});
```

## Complete Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const userId = 'alice-user-uuid';
const conversationId = 'conversation-uuid';

// 1. Connect
socket.on('connect', () => {
  console.log('✅ Connected');
  
  // 2. Register user
  socket.emit('user:register', { userId });
});

// 3. Confirm registration
socket.on('user:registered', (data) => {
  console.log('Registered:', data);
  
  // 4. Join conversation
  socket.emit('conversation:join', conversationId);
});

// 5. Listen for online/offline events
socket.on('user:online', (data) => {
  console.log(`👤 ${data.userId} came online`);
  // Update UI: show green dot, "online" status, etc.
});

socket.on('user:offline', (data) => {
  console.log(`👤 ${data.userId} went offline`);
  // Update UI: remove green dot, show "offline" or last seen
});

// 6. Check online status of multiple users
socket.emit('user:check-online', {
  userIds: ['user-1', 'user-2', 'user-3']
});

socket.on('user:online-status', (status) => {
  Object.entries(status).forEach(([userId, isOnline]) => {
    console.log(`${userId}: ${isOnline ? 'online' : 'offline'}`);
  });
});

// 7. Handle disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## Available Events

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `user:register` | `{ userId }` | Register user as online (required after connection) |
| `conversation:join` | `conversationId` | Join a conversation (user must be registered first) |
| `conversation:leave` | `conversationId` | Leave a conversation |
| `user:check-online` | `{ userIds: string[] }` | Check online status of multiple users |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `user:registered` | `{ userId, isOnline }` | Confirmation of user registration |
| `user:online` | `{ userId }` | User came online (in a conversation) |
| `user:offline` | `{ userId }` | User went offline (in a conversation) |
| `user:online-status` | `{ [userId]: boolean }` | Online status of requested users |
| `error` | `{ message }` | Error message |

## Important Notes

1. **User Registration Required**: You must call `user:register` after connecting, before joining conversations
2. **Multiple Connections**: A user can have multiple socket connections (e.g., multiple tabs/devices)
3. **Offline Detection**: User is marked offline only when ALL their connections are closed
4. **Conversation Tracking**: Online status is only broadcasted to conversations the user has joined
5. **In-Memory Storage**: Currently uses in-memory storage (single server). For multi-server, use Redis adapter

## Integration with Frontend

Update your frontend to:

1. Register user on WebSocket connection
2. Listen for `user:online` and `user:offline` events
3. Update UI to show online/offline status
4. Optionally check online status when loading conversations

Example React integration:

```jsx
useEffect(() => {
  const socket = io('http://localhost:3000');
  
  socket.on('connect', () => {
    // Register current user
    socket.emit('user:register', { userId: currentUser.user_id });
  });
  
  socket.on('user:online', (data) => {
    setOnlineUsers(prev => new Set(prev).add(data.userId));
  });
  
  socket.on('user:offline', (data) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
  });
  
  return () => socket.close();
}, [currentUser]);
```

