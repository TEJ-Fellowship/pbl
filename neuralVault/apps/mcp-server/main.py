#!/usr/bin/env python3
"""
MCP Gmail Server

A Model Context Protocol server that provides Gmail integration capabilities.
"""

import asyncio
import json
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from mcp.server import Server
from mcp.server.stdio import stdio_server
from pydantic import BaseModel

from config import Config
from gmail_service import GmailService

# MCP Server instance
mcp_server = Server(Config.MCP_SERVER_NAME)

# FastAPI app for OAuth flow
app = FastAPI(title="Gmail MCP Server")

# Global Gmail service instance
gmail_service = GmailService()

# Store credentials (in production, use proper storage)
credentials = None

@app.get("/auth")
async def auth():
    """Start OAuth flow."""
    flow = InstalledAppFlow.from_client_config(
        Config.get_google_config(),
        Config.GMAIL_SCOPES
    )
    
    auth_url, _ = flow.authorization_url(prompt='consent')
    return RedirectResponse(url=auth_url)

@app.get("/auth/callback")
async def auth_callback(code: str):
    """Handle OAuth callback."""
    global credentials, gmail_service
    
    flow = InstalledAppFlow.from_client_config(
        Config.get_google_config(),
        Config.GMAIL_SCOPES
    )
    
    flow.fetch_token(code=code)
    credentials = flow.credentials
    gmail_service.authenticate(credentials)
    
    return {"message": "Authentication successful!"}

@mcp_server.list_tools()
async def handle_list_tools() -> List[Dict[str, Any]]:
    """List available tools."""
    return [
        {
            "name": "gmail_list_emails",
            "description": "List emails from Gmail inbox",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of emails to return",
                        "default": 10
                    },
                    "label": {
                        "type": "string",
                        "description": "Gmail label to filter by (e.g., 'INBOX', 'SENT')",
                        "default": "INBOX"
                    }
                }
            }
        },
        {
            "name": "gmail_read_email",
            "description": "Read a specific email by ID",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "email_id": {
                        "type": "string",
                        "description": "Gmail message ID"
                    }
                },
                "required": ["email_id"]
            }
        },
        {
            "name": "gmail_send_email",
            "description": "Send an email via Gmail",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "to": {
                        "type": "string",
                        "description": "Recipient email address"
                    },
                    "subject": {
                        "type": "string",
                        "description": "Email subject"
                    },
                    "body": {
                        "type": "string",
                        "description": "Email body"
                    },
                    "cc": {
                        "type": "string",
                        "description": "CC recipients (comma-separated)"
                    },
                    "bcc": {
                        "type": "string",
                        "description": "BCC recipients (comma-separated)"
                    }
                },
                "required": ["to", "subject", "body"]
            }
        },
        {
            "name": "gmail_search_emails",
            "description": "Search emails in Gmail",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Gmail search query"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        },
        {
            "name": "gmail_get_labels",
            "description": "Get Gmail labels",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        }
    ]

@mcp_server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Handle tool calls."""
    try:
        if name == "gmail_list_emails":
            return gmail_service.list_emails(
                max_results=arguments.get("max_results", 10),
                label=arguments.get("label", "INBOX")
            )
        elif name == "gmail_read_email":
            return gmail_service.read_email(arguments["email_id"])
        elif name == "gmail_send_email":
            return gmail_service.send_email(
                to=arguments["to"],
                subject=arguments["subject"],
                body=arguments["body"],
                cc=arguments.get("cc"),
                bcc=arguments.get("bcc")
            )
        elif name == "gmail_search_emails":
            return gmail_service.search_emails(
                query=arguments["query"],
                max_results=arguments.get("max_results", 10)
            )
        elif name == "gmail_get_labels":
            return gmail_service.get_labels()
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        return {"error": f"Error: {str(e)}"}



async def main():
    """Main function to run the MCP server."""
    # Create initialization options
    init_options = mcp_server.create_initialization_options()
    
    # Run the MCP server with stdio transport
    async with stdio_server() as (read_stream, write_stream):
        await mcp_server.run(read_stream, write_stream, init_options)

if __name__ == "__main__":
    asyncio.run(main())
