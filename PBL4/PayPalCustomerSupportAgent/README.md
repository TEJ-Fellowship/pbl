# PayPal Customer Support Agent

A full-stack application for PayPal customer support with AI-powered assistance.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Git

### Installation
```bash
# Install dependencies for all services
npm run install:all
```

### Development
```bash
# Run all services in development mode
npm run dev
```

This will start:
- **Backend** (Express server) - Usually on port 3000
- **Frontend** (React + Vite) - Usually on port 5173
- **MCP Server** (Model Context Protocol server)

### Individual Services
```bash
# Run only backend
npm run dev:backend

# Run only frontend
npm run dev:frontend

# Run only MCP server
npm run dev:mcp
```

### Production
```bash
# Build frontend
npm run build

# Start all services in production mode
npm start
```

### Testing
```bash
# Run tests for all services
npm test
```

## Project Structure
- `backend/` - Express.js API server
- `frontend/` - React frontend application
- `mcp-server/` - Model Context Protocol server
- `scraper/` - Data scraping utilities
- `docs/` - Documentation

## Services
- **Backend**: REST API with AI integration
- **Frontend**: React-based user interface
- **MCP Server**: Handles external tool integrations
