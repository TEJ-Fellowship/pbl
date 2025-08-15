#!/usr/bin/env python3
"""
MCP Client for Gmail Operations
Connects to the MCP Gmail Server and provides easy-to-use functions.
"""

import asyncio
import json
import subprocess
import sys
from typing import Dict, List, Optional, Any
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

console = Console()

class GmailMCPClient:
    """MCP Client for Gmail operations."""
    
    def __init__(self, server_path: str = "../mcp-server/run.py"):
        """Initialize the MCP client."""
        self.server_path = server_path
        self.process = None
        self.tools = {}
        
    async def start_server(self):
        """Start the MCP server process."""
        try:
            console.print("🚀 Starting MCP Gmail Server...", style="blue")
            
            # Start the server process
            self.process = subprocess.Popen(
                [sys.executable, self.server_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait a moment for server to start
            await asyncio.sleep(2)
            
            # Initialize the connection
            await self._initialize()
            
            console.print("✅ MCP Server connected successfully!", style="green")
            return True
            
        except Exception as e:
            console.print(f"❌ Failed to start server: {e}", style="red")
            return False
    
    async def _initialize(self):
        """Initialize MCP connection."""
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
                    "name": "gmail-mcp-client",
                    "version": "1.0.0"
                }
            }
        }
        
        await self._send_request(init_request)
        
        # Get available tools
        await self._get_tools()
    
    async def _get_tools(self):
        """Get available tools from the server."""
        tools_request = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        
        response = await self._send_request(tools_request)
        if response and "result" in response:
            self.tools = {tool["name"]: tool for tool in response["result"].get("tools", [])}
            console.print(f"📧 Found {len(self.tools)} Gmail tools", style="blue")
    
    async def _send_request(self, request: Dict) -> Optional[Dict]:
        """Send a request to the MCP server."""
        try:
            request_str = json.dumps(request) + "\n"
            self.process.stdin.write(request_str)
            self.process.stdin.flush()
            
            response_line = self.process.stdout.readline()
            if response_line:
                return json.loads(response_line.strip())
        except Exception as e:
            console.print(f"❌ Request failed: {e}", style="red")
        return None
    
    async def call_tool(self, tool_name: str, arguments: Dict) -> Optional[Dict]:
        """Call a specific tool with arguments."""
        if tool_name not in self.tools:
            console.print(f"❌ Tool '{tool_name}' not found", style="red")
            return None
        
        tool_request = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        response = await self._send_request(tool_request)
        if response and "result" in response:
            return response["result"].get("content", [{}])[0]
        return None
    
    async def list_emails(self, max_results: int = 10, label: str = "INBOX") -> List[Dict]:
        """List emails from Gmail."""
        console.print(f"📧 Fetching {max_results} emails from {label}...", style="blue")
        
        result = await self.call_tool("gmail_list_emails", {
            "max_results": max_results,
            "label": label
        })
        
        if result and "emails" in result:
            emails = result["emails"]
            self._display_emails(emails, f"Emails from {label}")
            return emails
        else:
            console.print("❌ Failed to fetch emails", style="red")
            return []
    
    async def search_emails(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search emails in Gmail."""
        console.print(f"🔍 Searching emails with query: '{query}'...", style="blue")
        
        result = await self.call_tool("gmail_search_emails", {
            "query": query,
            "max_results": max_results
        })
        
        if result and "emails" in result:
            emails = result["emails"]
            self._display_emails(emails, f"Search results for '{query}'")
            return emails
        else:
            console.print("❌ Failed to search emails", style="red")
            return []
    
    async def read_email(self, email_id: str) -> Optional[Dict]:
        """Read a specific email."""
        console.print(f"📖 Reading email {email_id}...", style="blue")
        
        result = await self.call_tool("gmail_read_email", {
            "email_id": email_id
        })
        
        if result:
            self._display_email_details(result)
            return result
        else:
            console.print("❌ Failed to read email", style="red")
            return None
    
    async def send_email(self, to: str, subject: str, body: str, 
                        cc: Optional[str] = None, bcc: Optional[str] = None) -> bool:
        """Send an email."""
        console.print(f"📤 Sending email to {to}...", style="blue")
        
        arguments = {
            "to": to,
            "subject": subject,
            "body": body
        }
        
        if cc:
            arguments["cc"] = cc
        if bcc:
            arguments["bcc"] = bcc
        
        result = await self.call_tool("gmail_send_email", arguments)
        
        if result and "message_id" in result:
            console.print(f"✅ Email sent successfully! Message ID: {result['message_id']}", style="green")
            return True
        else:
            console.print("❌ Failed to send email", style="red")
            return False
    
    async def get_labels(self) -> List[Dict]:
        """Get Gmail labels."""
        console.print("🏷️ Fetching Gmail labels...", style="blue")
        
        result = await self.call_tool("gmail_get_labels", {})
        
        if result and "labels" in result:
            labels = result["labels"]
            self._display_labels(labels)
            return labels
        else:
            console.print("❌ Failed to fetch labels", style="red")
            return []
    
    def _display_emails(self, emails: List[Dict], title: str):
        """Display emails in a table."""
        if not emails:
            console.print("No emails found", style="yellow")
            return
        
        table = Table(title=title)
        table.add_column("Subject", style="cyan")
        table.add_column("From", style="magenta")
        table.add_column("Date", style="green")
        table.add_column("ID", style="dim")
        
        for email in emails:
            subject = email.get('subject', 'No Subject')[:50]
            sender = email.get('from', 'Unknown')[:30]
            date = email.get('date', 'Unknown')[:20]
            email_id = email.get('id', 'Unknown')
            
            table.add_row(subject, sender, date, email_id)
        
        console.print(table)
    
    def _display_email_details(self, email: Dict):
        """Display detailed email information."""
        panel = Panel(
            f"[bold cyan]Subject:[/bold cyan] {email.get('subject', 'No Subject')}\n"
            f"[bold magenta]From:[/bold magenta] {email.get('from', 'Unknown')}\n"
            f"[bold green]Date:[/bold green] {email.get('date', 'Unknown')}\n"
            f"[bold yellow]Body:[/bold yellow]\n{email.get('body', 'No content')[:500]}...",
            title="Email Details",
            border_style="blue"
        )
        console.print(panel)
    
    def _display_labels(self, labels: List[Dict]):
        """Display Gmail labels."""
        if not labels:
            console.print("No labels found", style="yellow")
            return
        
        table = Table(title="Gmail Labels")
        table.add_column("Name", style="cyan")
        table.add_column("Type", style="magenta")
        table.add_column("ID", style="dim")
        
        for label in labels:
            name = label.get('name', 'Unknown')
            label_type = label.get('type', 'Unknown')
            label_id = label.get('id', 'Unknown')
            
            table.add_row(name, label_type, label_id)
        
        console.print(table)
    
    async def shutdown(self):
        """Shutdown the MCP server."""
        if self.process:
            try:
                shutdown_request = {
                    "jsonrpc": "2.0",
                    "id": 4,
                    "method": "shutdown",
                    "params": {}
                }
                await self._send_request(shutdown_request)
                
                self.process.terminate()
                self.process.wait()
                console.print("👋 MCP Server shutdown", style="blue")
            except Exception as e:
                console.print(f"❌ Error during shutdown: {e}", style="red")

# Example usage functions
async def example_usage():
    """Example usage of the Gmail MCP client."""
    client = GmailMCPClient()
    
    try:
        # Start the server
        if not await client.start_server():
            return
        
        console.print("\n🎯 Gmail MCP Client Examples", style="bold blue")
        console.print("=" * 50)
        
        # Example 1: Get Gmail labels
        console.print("\n1️⃣ Getting Gmail Labels", style="bold")
        await client.get_labels()
        
        # Example 2: List recent emails
        console.print("\n2️⃣ Listing Recent Emails", style="bold")
        emails = await client.list_emails(max_results=5)
        
        # Example 3: Search for unread emails
        console.print("\n3️⃣ Searching for Unread Emails", style="bold")
        await client.search_emails("is:unread", max_results=3)
        
        # Example 4: Read a specific email (if available)
        if emails:
            console.print("\n4️⃣ Reading a Specific Email", style="bold")
            await client.read_email(emails[0]['id'])
        
        # Example 5: Search for important emails
        console.print("\n5️⃣ Searching for Important Emails", style="bold")
        await client.search_emails("is:important", max_results=3)
        
        console.print("\n✅ All examples completed!", style="bold green")
        
    except KeyboardInterrupt:
        console.print("\n⏹️ Interrupted by user", style="yellow")
    except Exception as e:
        console.print(f"\n❌ Error: {e}", style="red")
    finally:
        await client.shutdown()

if __name__ == "__main__":
    asyncio.run(example_usage())
