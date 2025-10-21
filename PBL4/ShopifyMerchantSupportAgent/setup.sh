#!/bin/bash

# Shopify Merchant Support Agent Setup Script
# This script helps set up the development environment

echo "🚀 Setting up Shopify Merchant Support Agent..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.17.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.17.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18.17.0 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"

# Create .env file if it doesn't exist
cd ../backend
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit the .env file with your actual API keys:"
    echo "   - GEMINI_API_KEY"
    echo "   - PINECONE_API_KEY"
    echo "   - MONGODB_URI (if not using default)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Start MongoDB (if not already running)"
echo "3. Run 'npm run dev' in the backend directory"
echo "4. Run 'npm run dev' in the frontend directory"
echo "5. Open http://localhost:5173 in your browser"
echo ""
echo "Required API Keys:"
echo "- Google Gemini API Key (for AI responses)"
echo "- Pinecone API Key (for vector search)"
echo "- MongoDB connection string (default: mongodb://localhost:27017/shopify-support-agent)"
