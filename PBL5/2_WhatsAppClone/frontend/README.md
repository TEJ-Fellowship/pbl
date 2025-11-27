# WhatsApp Clone Frontend

A simple React frontend for the WhatsApp Clone application.

## Setup

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

- User selection/login
- Create new users
- View conversation list
- Real-time messaging via WebSocket
- Typing indicators
- WhatsApp-like UI design

## Backend Requirements

Make sure your backend is running on `http://localhost:3000` with the following endpoints:

- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/conversation/user/:userId` - Get conversations for a user
- `GET /api/conversation/:conversationId` - Get messages for a conversation
- `POST /api/conversation/send` - Send a message

## Note

If some API endpoints are not available, you may need to add them to your backend routes.
