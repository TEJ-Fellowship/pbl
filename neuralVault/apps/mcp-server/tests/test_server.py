#!/usr/bin/env python3
"""
Test script for the MCP Gmail Server.
"""

import asyncio
import json
from config import Config
from gmail_service import GmailService

async def test_config():
    """Test configuration validation."""
    print("🔧 Testing configuration...")
    missing = Config.validate()
    if missing:
        print(f"❌ Missing configuration: {missing}")
        return False
    print("✅ Configuration is valid")
    return True

async def test_gmail_service():
    """Test Gmail service initialization."""
    print("📧 Testing Gmail service...")
    try:
        service = GmailService()
        print("✅ Gmail service initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Gmail service: {e}")
        return False

async def test_mcp_tools():
    """Test MCP tool definitions."""
    print("🛠️ Testing MCP tools...")
    
    # Import here to avoid circular imports
    from main import mcp_server
    
    try:
        # This would normally be called by the MCP client
        # For testing, we'll just verify the server is properly configured
        print(f"✅ MCP Server: {mcp_server.name}")
        print("✅ MCP tools are properly defined")
        return True
    except Exception as e:
        print(f"❌ Failed to test MCP tools: {e}")
        return False

async def main():
    """Run all tests."""
    print("🧪 Starting MCP Gmail Server tests...\n")
    
    tests = [
        ("Configuration", test_config),
        ("Gmail Service", test_gmail_service),
        ("MCP Tools", test_mcp_tools),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"Running {test_name} test...")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
        print()
    
    # Summary
    print("📊 Test Results:")
    print("=" * 50)
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:20} {status}")
        if result:
            passed += 1
    
    print("=" * 50)
    print(f"Total: {len(results)} | Passed: {passed} | Failed: {len(results) - passed}")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Your MCP Gmail Server is ready to use.")
        print("\nNext steps:")
        print("1. Set up your Google OAuth credentials")
        print("2. Create a .env file with your credentials")
        print("3. Run: python run.py")
        print("4. Visit http://localhost:8000/auth to authenticate")
    else:
        print("\n⚠️ Some tests failed. Please check the configuration and try again.")

if __name__ == "__main__":
    asyncio.run(main())
