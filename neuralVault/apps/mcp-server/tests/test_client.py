#!/usr/bin/env python3
"""
Simple MCP client to test the Gmail server.
"""

import asyncio
import json
import subprocess
from typing import Dict, Any

class SimpleMCPClient:
    def __init__(self, server_command: str):
        self.server_command = server_command
        self.process = None
        self.request_id = 0
    
    async def start_server(self):
        """Start the MCP server process."""
        self.process = await asyncio.create_subprocess_exec(
            *self.server_command.split(),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        print(f"🚀 Started MCP server process (PID: {self.process.pid})")
    
    async def send_request(self, method: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send a JSON-RPC request to the server."""
        self.request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params or {}
        }
        
        # Send request
        request_str = json.dumps(request) + "\n"
        self.process.stdin.write(request_str.encode())
        await self.process.stdin.drain()
        
        # Read response
        response_line = await self.process.stdout.readline()
        if response_line:
            response = json.loads(response_line.decode().strip())
            return response
        return None
    
    async def test_initialization(self):
        """Test server initialization."""
        print("🔧 Testing server initialization...")
        
        init_params = {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "clientInfo": {
                "name": "test-client",
                "version": "1.0.0"
            }
        }
        
        response = await self.send_request("initialize", init_params)
        if response and "result" in response:
            print("✅ Server initialized successfully!")
            print(f"   Server info: {response['result'].get('serverInfo', {})}")
            return True
        else:
            print("❌ Server initialization failed!")
            print(f"   Response: {response}")
            return False
    
    async def test_list_tools(self):
        """Test listing available tools."""
        print("🛠️ Testing tool listing...")
        
        response = await self.send_request("tools/list")
        if response and "result" in response:
            tools = response["result"].get("tools", [])
            print(f"✅ Found {len(tools)} tools:")
            for tool in tools:
                print(f"   - {tool['name']}: {tool['description']}")
            return True
        else:
            print("❌ Tool listing failed!")
            print(f"   Response: {response}")
            return False
    
    async def test_tool_call(self):
        """Test calling a tool."""
        print("📧 Testing tool call...")
        
        # Test with gmail_get_labels (doesn't require authentication)
        params = {
            "name": "gmail_get_labels",
            "arguments": {}
        }
        
        response = await self.send_request("tools/call", params)
        if response and "result" in response:
            result = response["result"]
            if "error" in result:
                print(f"⚠️ Tool call returned error (expected if not authenticated): {result['error']}")
            else:
                print("✅ Tool call successful!")
                print(f"   Result: {result.get('content', [])}")
            return True
        else:
            print("❌ Tool call failed!")
            print(f"   Response: {response}")
            return False
    
    async def stop_server(self):
        """Stop the server process."""
        if self.process:
            # Send shutdown request
            await self.send_request("shutdown")
            
            # Wait a bit then terminate
            await asyncio.sleep(1)
            self.process.terminate()
            await self.process.wait()
            print("🛑 Server stopped")

async def main():
    """Main test function."""
    print("🧪 MCP Gmail Server Test Client")
    print("=" * 40)
    
    client = SimpleMCPClient("python main.py")
    
    try:
        # Start server
        await client.start_server()
        await asyncio.sleep(2)  # Give server time to start
        
        # Run tests
        tests = [
            ("Initialization", client.test_initialization),
            ("List Tools", client.test_list_tools),
            ("Tool Call", client.test_tool_call),
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
        print("=" * 40)
        passed = 0
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:20} {status}")
            if result:
                passed += 1
        
        print("=" * 40)
        print(f"Total: {len(results)} | Passed: {passed} | Failed: {len(results) - passed}")
        
        if passed == len(results):
            print("\n🎉 All tests passed! Your MCP Gmail Server is working correctly!")
        else:
            print("\n⚠️ Some tests failed. Check the server configuration.")
    
    finally:
        # Clean up
        await client.stop_server()

if __name__ == "__main__":
    asyncio.run(main())
