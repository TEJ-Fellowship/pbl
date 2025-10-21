#!/bin/bash

# Development Testing Script for Shopify Merchant Support Agent
# This script helps test the complete system integration

echo "🧪 Testing Shopify Merchant Support Agent Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required services are running
check_services() {
    print_status "Checking required services..."
    
    # Check MongoDB
    if ! pgrep -x "mongod" > /dev/null; then
        print_warning "MongoDB is not running. Please start MongoDB first."
        echo "  On macOS: brew services start mongodb-community"
        echo "  On Ubuntu: sudo systemctl start mongod"
        echo "  On Windows: net start MongoDB"
        return 1
    else
        print_success "MongoDB is running"
    fi
    
    # Check if backend is running
    if ! curl -s http://localhost:3000/health > /dev/null; then
        print_warning "Backend server is not running on port 3000"
        return 1
    else
        print_success "Backend server is running"
    fi
    
    # Check if frontend is running
    if ! curl -s http://localhost:5173 > /dev/null; then
        print_warning "Frontend server is not running on port 5173"
        return 1
    else
        print_success "Frontend server is running"
    fi
    
    return 0
}

# Test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test health endpoint
    if curl -s http://localhost:3000/health | grep -q "OK"; then
        print_success "Health endpoint working"
    else
        print_error "Health endpoint failed"
        return 1
    fi
    
    # Test API root endpoint
    if curl -s http://localhost:3000/api | grep -q "Shopify Merchant Support Agent"; then
        print_success "API root endpoint working"
    else
        print_error "API root endpoint failed"
        return 1
    fi
    
    return 0
}

# Test chat functionality
test_chat_functionality() {
    print_status "Testing chat functionality..."
    
    # Create a test session
    SESSION_ID="test_session_$(date +%s)"
    
    # Test basic chat
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"Hello, can you help me with Shopify?\", \"sessionId\": \"$SESSION_ID\"}")
    
    if echo "$RESPONSE" | grep -q "answer"; then
        print_success "Basic chat functionality working"
    else
        print_error "Basic chat functionality failed"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    # Test multi-turn conversation
    RESPONSE2=$(curl -s -X POST http://localhost:3000/api/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"What about product creation?\", \"sessionId\": \"$SESSION_ID\"}")
    
    if echo "$RESPONSE2" | grep -q "answer"; then
        print_success "Multi-turn conversation working"
    else
        print_error "Multi-turn conversation failed"
        echo "Response: $RESPONSE2"
        return 1
    fi
    
    return 0
}

# Test MCP tools
test_mcp_tools() {
    print_status "Testing MCP tools..."
    
    SESSION_ID="test_mcp_$(date +%s)"
    
    # Test calculator tool
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"Calculate 2.9% + \$0.30 on \$100\", \"sessionId\": \"$SESSION_ID\"}")
    
    if echo "$RESPONSE" | grep -q "mcpTools"; then
        print_success "Calculator tool integration working"
    else
        print_warning "Calculator tool may not be triggered or working"
    fi
    
    # Test status tool
    RESPONSE2=$(curl -s -X POST http://localhost:3000/api/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"Is Shopify down right now?\", \"sessionId\": \"$SESSION_ID\"}")
    
    if echo "$RESPONSE2" | grep -q "mcpTools"; then
        print_success "Status tool integration working"
    else
        print_warning "Status tool may not be triggered or working"
    fi
    
    return 0
}

# Test conversation history
test_conversation_history() {
    print_status "Testing conversation history..."
    
    SESSION_ID="test_history_$(date +%s)"
    
    # Send a message
    curl -s -X POST http://localhost:3000/api/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"Test message for history\", \"sessionId\": \"$SESSION_ID\"}" > /dev/null
    
    # Get conversation history
    RESPONSE=$(curl -s http://localhost:3000/api/history/$SESSION_ID)
    
    if echo "$RESPONSE" | grep -q "messages"; then
        print_success "Conversation history working"
    else
        print_error "Conversation history failed"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    return 0
}

# Main test function
run_tests() {
    print_status "Starting integration tests..."
    
    if ! check_services; then
        print_error "Service checks failed. Please ensure all services are running."
        exit 1
    fi
    
    if ! test_api_endpoints; then
        print_error "API endpoint tests failed."
        exit 1
    fi
    
    if ! test_chat_functionality; then
        print_error "Chat functionality tests failed."
        exit 1
    fi
    
    if ! test_mcp_tools; then
        print_warning "MCP tools tests had issues, but continuing..."
    fi
    
    if ! test_conversation_history; then
        print_error "Conversation history tests failed."
        exit 1
    fi
    
    print_success "All core tests passed! 🎉"
    print_status "The system is ready for use."
}

# Run the tests
run_tests

echo ""
echo "📋 Test Summary:"
echo "✅ Service checks passed"
echo "✅ API endpoints working"
echo "✅ Chat functionality working"
echo "✅ Multi-turn conversations working"
echo "✅ Conversation history working"
echo "⚠️  MCP tools may need API keys for full functionality"
echo ""
echo "🌐 Access the application at: http://localhost:5173"
echo "🔧 API documentation at: http://localhost:3000/api"
echo "❤️  Health check at: http://localhost:3000/health"
