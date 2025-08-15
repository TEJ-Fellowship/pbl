#!/usr/bin/env python3
"""
Simple MCP Client for Gmail Operations
Connects to the MCP Gmail Server via HTTP.
"""

import asyncio
import json
import requests
from typing import Dict, List, Optional, Any
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

class SimpleGmailClient:
    """Simple HTTP-based MCP client for Gmail operations."""
    
    def __init__(self, server_url: str = "http://localhost:8000"):
        """Initialize the client."""
        self.server_url = server_url
        self.session = requests.Session()
    
    def check_server(self) -> bool:
        """Check if the server is running."""
        try:
            response = self.session.get(f"{self.server_url}/", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_labels(self) -> List[Dict]:
        """Get Gmail labels."""
        console.print("🏷️ Fetching Gmail labels...", style="blue")
        
        try:
            # Use the Gmail service directly
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
            
            from gmail_service import GmailService
            from google.oauth2.credentials import Credentials
            
            # Load credentials from file
            creds_file = os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'credentials.json')
            if os.path.exists(creds_file):
                with open(creds_file, 'r') as f:
                    creds_data = json.load(f)
                
                credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                gmail_service = GmailService(credentials)
                result = gmail_service.get_labels()
                
                if "labels" in result:
                    labels = result["labels"]
                    self._display_labels(labels)
                    return labels
                else:
                    console.print(f"❌ Failed to fetch labels: {result.get('error', 'Unknown error')}", style="red")
                    return []
            else:
                console.print("❌ No credentials file found. Please complete OAuth authentication.", style="red")
                return []
                
        except Exception as e:
            console.print(f"❌ Error: {e}", style="red")
            return []
    
    def list_emails(self, max_results: int = 10, label: str = "INBOX") -> List[Dict]:
        """List emails from Gmail."""
        console.print(f"📧 Fetching {max_results} emails from {label}...", style="blue")
        
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
            
            from gmail_service import GmailService
            from google.oauth2.credentials import Credentials
            
            # Load credentials from file
            creds_file = os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'credentials.json')
            if os.path.exists(creds_file):
                with open(creds_file, 'r') as f:
                    creds_data = json.load(f)
                
                credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                gmail_service = GmailService(credentials)
                result = gmail_service.list_emails(max_results=max_results, label=label)
                
                if "emails" in result:
                    emails = result["emails"]
                    self._display_emails(emails, f"Emails from {label}")
                    return emails
                else:
                    console.print(f"❌ Failed to fetch emails: {result.get('error', 'Unknown error')}", style="red")
                    return []
            else:
                console.print("❌ No credentials file found. Please complete OAuth authentication.", style="red")
                return []
                
        except Exception as e:
            console.print(f"❌ Error: {e}", style="red")
            return []
    
    def search_emails(self, query: str, max_results: int = 10) -> List[Dict]:
        """Search emails in Gmail."""
        console.print(f"🔍 Searching emails with query: '{query}'...", style="blue")
        
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
            
            from gmail_service import GmailService
            from google.oauth2.credentials import Credentials
            
            # Load credentials from file
            creds_file = os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'credentials.json')
            if os.path.exists(creds_file):
                with open(creds_file, 'r') as f:
                    creds_data = json.load(f)
                
                credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                gmail_service = GmailService(credentials)
                result = gmail_service.search_emails(query, max_results=max_results)
                
                if "emails" in result:
                    emails = result["emails"]
                    self._display_emails(emails, f"Search results for '{query}'")
                    return emails
                else:
                    console.print(f"❌ Failed to search emails: {result.get('error', 'Unknown error')}", style="red")
                    return []
            else:
                console.print("❌ No credentials file found. Please complete OAuth authentication.", style="red")
                return []
                
        except Exception as e:
            console.print(f"❌ Error: {e}", style="red")
            return []
    
    def read_email(self, email_id: str) -> Optional[Dict]:
        """Read a specific email."""
        console.print(f"📖 Reading email {email_id}...", style="blue")
        
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
            
            from gmail_service import GmailService
            from google.oauth2.credentials import Credentials
            
            # Load credentials from file
            creds_file = os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'credentials.json')
            if os.path.exists(creds_file):
                with open(creds_file, 'r') as f:
                    creds_data = json.load(f)
                
                credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                gmail_service = GmailService(credentials)
                result = gmail_service.read_email(email_id)
                
                if "error" not in result:
                    self._display_email_details(result)
                    return result
                else:
                    console.print(f"❌ Failed to read email: {result.get('error', 'Unknown error')}", style="red")
                    return None
            else:
                console.print("❌ No credentials file found. Please complete OAuth authentication.", style="red")
                return None
                
        except Exception as e:
            console.print(f"❌ Error: {e}", style="red")
            return None
    
    def send_email(self, to: str, subject: str, body: str, 
                   cc: Optional[str] = None, bcc: Optional[str] = None) -> bool:
        """Send an email."""
        console.print(f"📤 Sending email to {to}...", style="blue")
        
        try:
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
            
            from gmail_service import GmailService
            from google.oauth2.credentials import Credentials
            
            # Load credentials from file
            creds_file = os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'credentials.json')
            if os.path.exists(creds_file):
                with open(creds_file, 'r') as f:
                    creds_data = json.load(f)
                
                credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                gmail_service = GmailService(credentials)
                result = gmail_service.send_email(to, subject, body, cc, bcc)
                
                if "message_id" in result:
                    console.print(f"✅ Email sent successfully! Message ID: {result['message_id']}", style="green")
                    return True
                else:
                    console.print(f"❌ Failed to send email: {result.get('error', 'Unknown error')}", style="red")
                    return False
            else:
                console.print("❌ No credentials file found. Please complete OAuth authentication.", style="red")
                return False
                
        except Exception as e:
            console.print(f"❌ Error: {e}", style="red")
            return False
    
    def _display_emails(self, emails: List[Dict], title: str):
        """Display emails in a table."""
        if not emails:
            console.print("No emails found", style="yellow")
            return
        
        table = Table(title=title)
        table.add_column("Subject", style="cyan")
        table.add_column("From", style="magenta")
        table.add_column("Date", style="green",max_width=100)
        table.add_column("ID", style="dim",overflow="fold")
        
        for email in emails:
            subject = email.get('subject', 'No Subject')[:50]
            sender = email.get('from', 'Unknown')[:30]
            date = email.get('date', 'Unknown')[:50]
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

def demo():
    """Run a demo of all Gmail operations."""
    client = SimpleGmailClient()
    
    console.print("\n🎯 Simple Gmail Client Demo", style="bold blue")
    console.print("=" * 50)
    
    # Demo 1: Get labels
    console.print("\n1️⃣ Getting Gmail Labels", style="bold")
    client.get_labels()
    
    # Demo 2: List recent emails
    console.print("\n2️⃣ Listing Recent Emails", style="bold")
    emails = client.list_emails(max_results=3)
    
    # Demo 3: Search for unread emails
    console.print("\n3️⃣ Searching for Unread Emails", style="bold")
    client.search_emails("is:unread", max_results=2)
    
    # Demo 4: Read a specific email (if available)
    if emails:
        console.print("\n4️⃣ Reading a Specific Email", style="bold")
        client.read_email(emails[0]['id'])
    
    # Demo 5: Search for important emails
    console.print("\n5️⃣ Searching for Important Emails", style="bold")
    client.search_emails("is:important", max_results=2)
    
    console.print("\n✅ Demo completed!", style="bold green")

if __name__ == "__main__":
    demo()
