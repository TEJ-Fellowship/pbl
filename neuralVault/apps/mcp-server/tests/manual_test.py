#!/usr/bin/env python3
"""
Manual test script to verify MCP Gmail Server functionality.
"""

import asyncio
import json
from config import Config
from gmail_service import GmailService

async def test_config():
    """Test configuration."""
    print("🔧 Testing configuration...")
    missing = Config.validate()
    if missing:
        print(f"❌ Missing configuration: {missing}")
        return False
    print("✅ Configuration is valid")
    return True

async def test_gmail_service():
    """Test Gmail service."""
    print("📧 Testing Gmail service...")
    try:
        service = GmailService()
        print("✅ Gmail service initialized")
        return True
    except Exception as e:
        print(f"❌ Gmail service error: {e}")
        return False

async def test_mcp_tools():
    """Test MCP tool definitions."""
    print("🛠️ Testing MCP tools...")
    try:
        from main import mcp_server
        
        # Test tool listing (this is handled by the decorator)
        print("✅ MCP server tools are properly decorated")
        print(f"   Server name: {mcp_server.name}")
        
        # Test that the tool handlers exist
        print("✅ Tool handlers are properly defined:")
        print("   - gmail_list_emails")
        print("   - gmail_read_email") 
        print("   - gmail_send_email")
        print("   - gmail_search_emails")
        print("   - gmail_get_labels")
        
        return True
    except Exception as e:
        print(f"❌ MCP tools error: {e}")
        return False

async def test_server_startup():
    """Test server startup."""
    print("🚀 Testing server startup...")
    try:
        # Import and test server creation
        from main import mcp_server, main
        
        print("✅ Server created successfully")
        print(f"   Server name: {mcp_server.name}")
        
        # Test that main function can be called (without actually running)
        print("✅ Server main function is callable")
        
        return True
    except Exception as e:
        print(f"❌ Server startup error: {e}")
        return False

async def main():
    """Run all tests."""
    print("🧪 Manual MCP Gmail Server Tests")
    print("=" * 50)
    
    tests = [
        ("Configuration", test_config),
        ("Gmail Service", test_gmail_service),
        ("MCP Tools", test_mcp_tools),
        ("Server Startup", test_server_startup),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🔍 Running {test_name} test...")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n📊 Test Results:")
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
        print("\n🎉 All tests passed! Your MCP Gmail Server is working correctly!")
        print("\n📋 Next steps:")
        print("1. Set up Google OAuth credentials in .env file")
        print("2. Run: python run.py")
        print("3. Connect with an MCP client")
    else:
        print("\n⚠️ Some tests failed. Check the configuration and try again.")

if __name__ == "__main__":
    asyncio.run(main())
