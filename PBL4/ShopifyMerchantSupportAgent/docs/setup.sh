#!/bin/bash

# Shopify Merchant Support Agent - Setup Script
# This script sets up both backend and frontend for the chat interface

echo "🚀 Setting up Shopify Merchant Support Agent Chat Interface"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Are you in the correct directory?"
    exit 1
fi

echo "Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Shopify Merchant Support Agent Configuration
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=shopify-merchant-support
GEMINI_MODEL=gemini-1.5-flash
MONGODB_URI=mongodb://localhost:27017/shopify-support
PORT=3000
FRONTEND_URL=http://localhost:5173
EOF
    echo "📝 Created .env template. Please update with your API keys:"
    echo "   - Get Gemini API key: https://aistudio.google.com/app/apikey"
    echo "   - Get Pinecone API key: https://app.pinecone.io/"
    echo "   - Update MongoDB URI if needed"
else
    echo "✅ .env file found"
fi

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Are you in the correct directory?"
    exit 1
fi

echo "Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"

# Go back to root directory
cd ..

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update backend/.env with your API keys"
echo "2. Start the backend API server:"
echo "   cd backend && npm run api"
echo "3. Start the frontend development server:"
echo "   cd frontend && npm run dev"
echo ""
echo "🌐 Access the chat interface at: http://localhost:5173"
echo "🔗 API server will run at: http://localhost:3000"
echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - backend/README.md"
echo "   - frontend/README.md"
echo ""
echo "Happy chatting! 🤖"
