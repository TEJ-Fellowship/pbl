#!/usr/bin/env python3
"""
Simple echo test to verify MCP server responds to JSON-RPC.
"""

import subprocess
import json
import time

def test_mcp_server():
    """Test MCP server with simple JSON-RPC messages."""
    print("Testing MCP Server with JSON-RPC")
    print("=" * 40)
    
    # Start the server
    print("Starting MCP server...")
    process = subprocess.Popen(
        ["python", "main.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    try:
        # Give server time to start
        time.sleep(2)
        
        # Test 1: Initialize request
        print("\nTest 1: Initialize request")
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "clientInfo": {
                    "name": "test-client",
                    "version": "1.0.0"
                }
            }
        }
        
        request_str = json.dumps(init_request) + "\n"
        process.stdin.write(request_str)
        process.stdin.flush()
        
        # Read response
        response_line = process.stdout.readline()
        if response_line:
            response = json.loads(response_line.strip())
            print(f"Received response: {response.get('result', {}).get('serverInfo', {})}")
        else:
            print("No response received")
            return False
        
        # Test 2: List tools
        print("\nTest 2: List tools")
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        
        request_str = json.dumps(tools_request) + "\n"
        process.stdin.write(request_str)
        process.stdin.flush()
        
        # Read response
        response_line = process.stdout.readline()
        if response_line:
            response = json.loads(response_line.strip())
            tools = response.get('result', {}).get('tools', [])
            print(f"Found {len(tools)} tools:")
            for tool in tools:
                print(f"   - {tool['name']}: {tool['description']}")
        else:
            print("No response received")
            return False
        
        # Test 3: Shutdown
        print("\nTest 3: Shutdown")
        shutdown_request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "shutdown",
            "params": {}
        }
        
        request_str = json.dumps(shutdown_request) + "\n"
        process.stdin.write(request_str)
        process.stdin.flush()
        
        print("Shutdown request sent")
        
        return True
        
    except Exception as e:
        print(f"Test failed with error: {e}")
        return False
    
    finally:
        # Clean up
        process.terminate()
        process.wait()
        print("\nServer stopped")

if __name__ == "__main__":
    success = test_mcp_server()
    if success:
        print("\nAll tests passed! Your MCP server is working correctly!")
    else:
        print("\nTests failed. Check the server configuration.")
