# PayPal Customer Support Agent

A comprehensive full-stack PayPal Customer Support Agent with AI integration, featuring a React frontend, Express backend, and MCP (Model Context Protocol) server.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL** (for database operations)

### 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd PayPalCustomerSupportAgent

# Install dependencies for all services
npm run install:all
```

## 🔧 Development Mode (with Auto-Reload)

### Run All Services with Watch Mode
```bash
# Start all services with automatic restart on file changes
npm run dev
```

This command will start all three services with watch functionality:
- **Backend** (Express server) - `http://localhost:3000` with auto-restart on changes
- **Frontend** (React + Vite) - `http://localhost:5173` with hot module replacement
- **MCP Server** (Model Context Protocol) - Auto-restart on changes

### 🎯 Individual Service Development

#### Backend Only (with Watch)
```bash
# Run backend with auto-restart on file changes
npm run dev:backend
```
- **Port**: 3000
- **Watch**: Automatically restarts when `backend/` files change
- **Features**: Express API with AI integration

#### Frontend Only (with Hot Reload)
```bash
# Run frontend with hot module replacement
npm run dev:frontend
```
- **Port**: 5173
- **Watch**: Hot reload for instant updates
- **Features**: React + Vite with Tailwind CSS

#### MCP Server Only (with Watch)
```bash
# Run MCP server with auto-restart
npm run dev:mcp
```
- **Watch**: Automatically restarts when `mcp-server/` files change
- **Features**: External tool integrations and web search

### 🔄 Watch Mode Details

| Service | Watch Technology | What Triggers Restart |
|---------|------------------|----------------------|
| **Backend** | Node.js `--watch` | Any `.js` file changes in `backend/` |
| **Frontend** | Vite HMR | Any file changes in `frontend/src/` |
| **MCP Server** | Node.js `--watch` | Any `.js` file changes in `mcp-server/` |

## 🚀 Production Mode

### Build and Start
```bash
# Build frontend for production
npm run build

# Start all services in production mode
npm start
```

### Production Services
- **Backend**: Production Express server
- **Frontend**: Built React app (served statically)
- **MCP Server**: Production MCP server

## 🧪 Testing

```bash
# Run tests for all services
npm test

# Run MCP server tests only
npm run test:mcp
```

## 📁 Project Structure

```
PayPalCustomerSupportAgent/
├── backend/           # Express.js API server
│   ├── controllers/   # Route controllers
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   └── App.jsx    # Main app component
│   └── dist/          # Built frontend files
├── mcp-server/        # Model Context Protocol server
│   ├── src/           # MCP server source
│   └── cache/         # Cached data
├── scraper/           # Data scraping utilities
└── docs/              # Documentation
```

## 🔧 Development Workflow

### Recommended Development Setup
1. **Terminal 1**: Run all services with watch
   ```bash
   npm run dev
   ```

2. **Terminal 2**: Run individual service for focused development
   ```bash
   # For backend changes
   npm run dev:backend
   
   # For frontend changes  
   npm run dev:frontend
   
   # For MCP server changes
   npm run dev:mcp
   ```

### File Change Behavior
- **Backend**: Restarts server automatically (preserves state)
- **Frontend**: Hot reloads components (preserves React state)
- **MCP Server**: Restarts server automatically (preserves state)

## 🛠️ Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000, 5173 are available
2. **Dependencies**: Run `npm run install:all` if modules are missing
3. **Database**: Ensure PostgreSQL is running for backend operations

### Reset Everything
```bash
# Clean install all dependencies
rm -rf node_modules backend/node_modules frontend/node_modules mcp-server/node_modules
npm run install:all
```

## 🌟 Services Overview
- **Backend**: REST API with AI integration and database operations
- **Frontend**: React-based user interface with modern UI components
- **MCP Server**: Handles external tool integrations and web search capabilities
- **Scraper**: Data collection utilities for PayPal documentation
