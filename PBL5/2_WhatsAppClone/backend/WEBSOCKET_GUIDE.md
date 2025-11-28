# WebSocket Connection Guide - Using Conversation ID

This guide shows you how to connect to the WebSocket server and join conversations using conversation IDs.

## Server Configuration

- **WebSocket Server:** `http://localhost:3000`
- **Protocol:** Socket.IO
- **CORS:** Enabled for all origins

## Connection Steps

### 1. Connect to WebSocket Server

First, establish a connection to the Socket.IO server.

### 2. Join a Conversation

After connecting, join a conversation using the `conversation:join` event with the conversation ID.

### 3. Send/Receive Messages

Once joined, you can send and receive messages in that conversation.

## Client Examples

### JavaScript/Node.js (Browser or Node)

```javascript
import { io } from 'socket.io-client';

// Step 1: Connect to WebSocket server
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

// Step 2: Wait for connection
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Step 3: Join a conversation using conversationId
  const conversationId = 'your-conversation-id-here';
  socket.emit('conversation:join', conversationId);
  console.log(`Joined conversation: ${conversationId}`);
});

// Step 4: Listen for messages in the conversation
socket.on('message:receive', (message) => {
  console.log('📨 New message received:', message);
  // message contains: conversationId, messageId, senderId, content, createdAt
});

// Step 5: Send a message
const sendMessage = (conversationId, senderId, content) => {
  socket.emit('message:send', {
    conversationId: conversationId,
    senderId: senderId,
    content: content
  });
};

// Step 6: Typing indicators
socket.on('typing:start', (userId) => {
  console.log(`User ${userId} is typing...`);
});

socket.on('typing:stop', (userId) => {
  console.log(`User ${userId} stopped typing`);
});

// Send typing start
socket.emit('typing:start', conversationId);

// Send typing stop
socket.emit('typing:stop', conversationId);

// Handle disconnection
socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Example usage
socket.on('connect', () => {
  const conversationId = '770e8400-e29b-41d4-a716-446655440002';
  socket.emit('conversation:join', conversationId);
  
  // Send a message after 2 seconds
  setTimeout(() => {
    sendMessage(
      conversationId,
      'alice-user-uuid',
      'Hello from WebSocket!'
    );
  }, 2000);
});
```

### HTML/JavaScript (Browser)

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Chat</title>
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
</head>
<body>
  <div id="messages"></div>
  <input type="text" id="messageInput" placeholder="Type a message...">
  <button onclick="sendMessage()">Send</button>

  <script>
    // Connect to WebSocket
    const socket = io('http://localhost:3000');
    const conversationId = 'your-conversation-id-here';
    const senderId = 'your-user-id-here';

    // Join conversation when connected
    socket.on('connect', () => {
      console.log('Connected!');
      socket.emit('conversation:join', conversationId);
    });

    // Listen for messages
    socket.on('message:receive', (message) => {
      const messagesDiv = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.textContent = `${message.senderId}: ${message.content}`;
      messagesDiv.appendChild(messageElement);
    });

    // Send message function
    function sendMessage() {
      const input = document.getElementById('messageInput');
      const content = input.value;
      
      if (content.trim()) {
        socket.emit('message:send', {
          conversationId: conversationId,
          senderId: senderId,
          content: content
        });
        input.value = '';
      }
    }

    // Typing indicators
    socket.on('typing:start', (userId) => {
      console.log('User is typing...');
    });

    socket.on('typing:stop', (userId) => {
      console.log('User stopped typing');
    });
  </script>
</body>
</html>
```


### React Example

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ChatComponent({ conversationId, userId }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Join conversation when connected
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('conversation:join', conversationId);
    });

    // Listen for messages
    newSocket.on('message:receive', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Typing indicators
    newSocket.on('typing:start', (userId) => {
      console.log('User is typing...');
    });

    newSocket.on('typing:stop', (userId) => {
      console.log('User stopped typing');
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [conversationId]);

  const sendMessage = () => {
    if (inputMessage.trim() && socket) {
      socket.emit('message:send', {
        conversationId: conversationId,
        senderId: userId,
        content: inputMessage
      });
      setInputMessage('');
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.senderId}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatComponent;
```

## Available Events

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `conversation:join` | `conversationId` (string) | Join a conversation room |
| `message:send` | `{ conversationId, senderId, content }` | Send a message |
| `typing:start` | `conversationId` (string) | Indicate user started typing |
| `typing:stop` | `conversationId` (string) | Indicate user stopped typing |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `message:receive` | `{ conversationId, messageId, senderId, content, createdAt }` | Receive a new message |
| `typing:start` | `userId` (string) | Another user started typing |
| `typing:stop` | `userId` (string) | Another user stopped typing |
| `status:update` | `{ messageId, status }` | Message status update |

## Complete Workflow Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// 1. Connect
socket.on('connect', () => {
  console.log('✅ Connected');
  
  // 2. Get conversationId (from your REST API or previous message)
  const conversationId = '770e8400-e29b-41d4-a716-446655440002';
  
  // 3. Join conversation
  socket.emit('conversation:join', conversationId);
  console.log(`Joined conversation: ${conversationId}`);
});

// 4. Listen for messages
socket.on('message:receive', (message) => {
  console.log('New message:', message.content);
  console.log('From:', message.senderId);
  console.log('Time:', message.createdAt);
});

// 5. Send message
function sendMessage(conversationId, senderId, content) {
  socket.emit('message:send', {
    conversationId,
    senderId,
    content
  });
}

// 6. Typing indicators
socket.on('typing:start', (userId) => {
  console.log(`👤 ${userId} is typing...`);
});

socket.on('typing:stop', (userId) => {
  console.log(`👤 ${userId} stopped typing`);
});

// Example: Send a message
sendMessage(
  '770e8400-e29b-41d4-a716-446655440002',
  'alice-user-uuid',
  'Hello from WebSocket!'
);
```

## Integration with REST API

You can combine WebSocket with REST API:

```javascript
// Step 1: Send first message via REST API to get conversationId
const response = await fetch('http://localhost:3000/api/conversation/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    senderId: 'alice-uuid',
    receiverId: 'bob-uuid',
    content: 'Hello!'
  })
});

const { data } = await response.json();
const conversationId = data.conversationId;

// Step 2: Connect to WebSocket and join conversation
const socket = io('http://localhost:3000');
socket.on('connect', () => {
  socket.emit('conversation:join', conversationId);
});

// Step 3: Use WebSocket for real-time messaging
socket.on('message:receive', (message) => {
  console.log('Real-time message:', message);
});
```

## Notes

- **Multiple Conversations:** A client can join multiple conversations by calling `conversation:join` multiple times
- **Room-based:** Messages are sent to all clients in the same conversation room
- **Auto-reconnect:** Socket.IO automatically handles reconnection
- **CORS:** Server allows all origins (`origin: "*"`)

## Testing with Socket.IO Client Tool

You can also test using online tools like:
- [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)
- Connect to: `http://localhost:3000`
- Emit: `conversation:join` with your conversationId
- Emit: `message:send` with message data
- Listen for: `message:receive`

