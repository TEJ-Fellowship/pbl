# Twilio Developer Support Agent - Frontend

A modern React-based chat interface for the Twilio Developer Support Agent, featuring Monaco Editor integration for code display and editing.

## Features

- 🤖 **AI-Powered Chat**: Interactive chat interface with Twilio's AI support agent
- 💻 **Monaco Editor**: Syntax-highlighted code display and editing
- 🎨 **Modern UI**: Clean, minimal design with Tailwind CSS
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔄 **Real-time**: Live chat with conversation memory
- 📊 **Structured Responses**: Explanation → Code → Pitfalls → Sources format
- 🎯 **Smart Suggestions**: Quick action buttons and example queries

## Tech Stack

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code editor in the browser
- **Axios** - HTTP client for API communication
- **React Markdown** - Markdown rendering with syntax highlighting
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running on port 3001

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## Project Structure

```
src/
├── components/           # React components
│   ├── ChatContainer.jsx    # Main chat wrapper
│   ├── MessageList.jsx     # Message display component
│   ├── MessageInput.jsx    # Input form component
│   ├── CodeEditor.jsx      # Monaco Editor integration
│   └── ResponseFormatter.jsx # Response parsing and display
├── services/             # API services
│   └── api.js              # Backend communication
├── App.jsx              # Main application component
├── main.jsx             # Application entry point
└── index.css            # Global styles and Tailwind
```

## Key Components

### ChatContainer

Main wrapper component that provides the chat interface layout and structure.

### MessageList

Displays conversation history with:

- User and assistant message bubbles
- Loading indicators
- Welcome screen with suggestions
- Timestamp display

### MessageInput

Input form with:

- Multi-line textarea with auto-resize
- Send button with loading state
- Quick suggestion buttons
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### CodeEditor

Monaco Editor integration featuring:

- Syntax highlighting for multiple languages
- Copy-to-clipboard functionality
- Read-only mode for displayed code
- Custom themes (light/dark)
- Language detection and configuration

### ResponseFormatter

Parses and displays AI responses with:

- Markdown rendering with syntax highlighting
- Code block extraction and Monaco Editor display
- Source citations with similarity scores
- Metadata display (API, language, response time)
- Structured format: Explanation → Code → Pitfalls → Sources

## API Integration

The frontend communicates with the backend through REST API endpoints:

- `POST /api/chat` - Send messages and receive responses
- `GET /api/conversation/:sessionId` - Get conversation history
- `DELETE /api/conversation/:sessionId` - Clear conversation
- `GET /api/preferences/:sessionId` - Get user preferences
- `GET /api/health` - Health check

## Styling

The application uses Tailwind CSS with custom components:

- **Gradient backgrounds** for modern visual appeal
- **Glass morphism** effects with backdrop blur
- **Custom scrollbars** for better UX
- **Responsive design** with mobile-first approach
- **Dark/light themes** for code editors
- **Smooth animations** and transitions

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- ESLint configuration for React
- Prettier for code formatting
- Consistent component structure
- TypeScript-ready (can be migrated)

## Deployment

1. Build the application:

```bash
npm run build
```

2. The `dist/` folder contains the production build
3. Serve with any static file server (nginx, Apache, etc.)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Use meaningful component and variable names
3. Add comments for complex logic
4. Test on multiple browsers
5. Ensure responsive design works

## License

This project is part of the Twilio Developer Support Agent system.
