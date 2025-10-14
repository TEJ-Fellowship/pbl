#!/bin/bash

# Installation script for Twilio Web Search MCP Server

echo "🚀 Installing Twilio Web Search MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Make server executable
chmod +x server.js

# Make test client executable
chmod +x test-client.js

echo "✅ Installation completed!"
echo ""
echo "To test the MCP server, run:"
echo "  npm test"
echo ""
echo "To start the MCP server, run:"
echo "  npm start"
echo ""
echo "To use with Claude Desktop, add this to your claude_desktop_config.json:"
echo "  $(cat mcp-config.json)"
