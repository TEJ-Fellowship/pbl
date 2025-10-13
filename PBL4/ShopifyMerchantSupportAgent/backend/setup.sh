#!/bin/bash

# Shopify Merchant Support Agent Setup Script
echo "🚀 Setting up Shopify Merchant Support Agent..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Shopify Merchant Support Agent Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=shopify-merchant-support
MONGODB_URI=mongodb://localhost:27017/shopify-support-agent
PORT=3000
GEMINI_MODEL=gemini-1.5-flash
EMBEDDINGS_PROVIDER=local
EOF
    echo "✅ .env file created! Please edit it with your actual API keys."
else
    echo "✅ .env file already exists."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your actual API keys"
echo "2. Make sure MongoDB is running"
echo "3. Run: npm run server"
