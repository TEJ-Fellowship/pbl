# 🔗 Frontend-Backend Integration

This document explains how the React frontend integrates with the Express.js backend API.

## 🏗️ Architecture Overview

```
Frontend (React)          Backend (Express.js)
├── API Service           ├── Chat Controller
├── useChat Hook          ├── Chat Service
├── Components            ├── Memory Service
└── Configuration         └── Hybrid Search
```

## 📡 API Integration

### API Service (`src/services/api.js`)

- Centralized HTTP client for all backend communication
- Handles request/response formatting
- Error handling and retry logic
- Configuration management

### Key Endpoints

- `POST /api/chat` - Send message, get AI response
- `GET /api/chat/history/:sessionId` - Get conversation history
- `POST /api/chat/session` - Create new chat session
- `DELETE /api/chat/session/:sessionId` - Delete chat session
- `GET /api/health` - Health check
- `GET /api/health/status` - Detailed system status

## 🎯 Chat Integration

### useChat Hook (`src/hooks/useChat.js`)

- Manages chat state and session handling
- Integrates with backend API
- Handles real-time message updates
- Manages conversation history
- Error handling and loading states

### Key Features

- **Session Management**: Automatic session creation and management
- **Message History**: Load and display conversation history
- **Real-time Updates**: Live message sending and receiving
- **Error Handling**: User-friendly error messages
- **Source Display**: Shows AI response sources and confidence

## 🎨 UI Components

### Enhanced Components

- **ChatMessages**: Displays sources, confidence scores, and error states
- **ChatHistory**: Session-based chat history management
- **StatusIndicator**: Real-time backend connection status
- **Error Display**: User-friendly error notifications

### New Features

- **Source Citations**: Expandable source panels with relevance scores
- **Confidence Indicators**: Visual confidence scoring (High/Medium/Low)
- **Error States**: Clear error messaging with retry options
- **Connection Status**: Real-time backend health monitoring

## ⚙️ Configuration

### Environment Variables

```bash
# Frontend Environment
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

### API Configuration (`src/config/api.js`)

- Centralized API configuration
- Endpoint definitions
- Default values
- Timeout settings

## 🚀 Getting Started

### 1. Start Backend

```bash
cd Backend
npm run dev
```

### 2. Start Frontend

```bash
cd Frontend
npm run dev
```

### 3. Test Integration

- Open http://localhost:5173
- Check status indicator (should show "Connected")
- Send a test message
- Verify sources and confidence display

## 🔧 Development

### API Service Usage

```javascript
import { apiService } from "../services/api.js";

// Send message
const response = await apiService.sendMessage("Hello", sessionId, userId);

// Get history
const history = await apiService.getHistory(sessionId);

// Create session
const session = await apiService.createSession(userId, context);
```

### Error Handling

```javascript
try {
  const response = await apiService.sendMessage(message);
  // Handle success
} catch (error) {
  // Error is automatically displayed in UI
  console.error("API Error:", error.message);
}
```

## 📊 Data Flow

1. **User Input** → ChatInput component
2. **Message Send** → useChat hook → API service
3. **Backend Processing** → Chat service → Hybrid search → AI response
4. **Response Display** → ChatMessages with sources and confidence
5. **History Update** → ChatHistory component

## 🎯 Features Implemented

### ✅ Completed

- Real-time chat with backend API
- Session management and persistence
- Source citations with relevance scores
- Confidence indicators
- Error handling and display
- Connection status monitoring
- Conversation history loading
- Responsive UI with animations

### 🔄 In Progress

- Code syntax highlighting
- Feedback collection (thumbs up/down)
- Advanced source filtering

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**: Check if backend is running on port 5000
2. **CORS Errors**: Verify backend CORS configuration
3. **Session Issues**: Check browser console for API errors
4. **Slow Responses**: Monitor backend logs for performance issues

### Debug Mode

- Open browser DevTools
- Check Network tab for API calls
- Monitor Console for errors
- Verify API responses in Network tab

## 📈 Performance

### Optimizations

- Request caching for health checks
- Debounced message sending
- Lazy loading of chat history
- Efficient re-rendering with React hooks

### Monitoring

- Real-time connection status
- API response times
- Error rates and types
- User interaction metrics
