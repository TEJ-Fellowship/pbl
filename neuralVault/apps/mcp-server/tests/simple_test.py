#!/usr/bin/env python3
"""
Simple test to debug MCP server issues.
"""

import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

# Create a simple MCP server
server = Server("test-server")

@server.list_tools()
async def list_tools():
    return []

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    return {"result": "test"}

async def main():
    print("Starting simple MCP server...")
    async with stdio_server(server) as stdio:
        print("MCP server started successfully!")
        await stdio.run()

if __name__ == "__main__":
    asyncio.run(main())
