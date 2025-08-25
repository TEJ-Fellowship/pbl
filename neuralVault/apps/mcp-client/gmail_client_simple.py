#!/usr/bin/env python3
"""
Simple Gmail client that uses the MCP server's OAuth flow.
"""

import json
import pickle
import requests
from typing import List, Dict, Any, Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Import config from MCP server
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
from config import Config

console = Console()

class SimpleGmailClient:
    """Simple Gmail client using MCP server's OAuth flow."""
    
    def __init__(self, server_url: str = "http://localhost:8000", silent: bool = False):
        """Initialize Gmail client."""
        self.server_url = server_url
        self.session = requests.Session()
        self.silent = silent
        self.service = None
        self.credentials = None

    def _print(self, message: str, style: str = "blue"):
        """Print message if not in silent mode."""
        if not self.silent:
            console.print(message, style=style)

    def _ensure_authenticated(self):
        """Ensure we have valid credentials by using MCP server's OAuth flow."""
        if self.credentials and self.credentials.valid:
            return True
        
        # Try to load credentials from MCP server's credentials.json
        try:
            if os.path.exists('credentials.json'):
                with open('credentials.json', 'r') as f:
                    creds_data = json.load(f)
                
                self.credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    self.credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                if self.credentials.valid:
                    self._print("✅ Loaded existing credentials", "green")
                    return True
        except Exception as e:
            self._print(f"⚠️  Could not load existing credentials: {e}", "yellow")
        
        # Check if MCP OAuth server is running and has valid credentials
        try:
            response = self.session.get(f"{self.server_url}/status", timeout=5)
            if response.status_code == 200:
                status_data = response.json()
                if status_data.get("authenticated"):
                    # Load credentials from MCP server
                    self._load_credentials_from_mcp_server()
                    return True
        except Exception as e:
            self._print(f"⚠️  MCP OAuth server not accessible: {e}", "yellow")
        
        # If no valid credentials, guide user to complete OAuth
        self._print("❌ No valid credentials found", "red")
        self._print("Please complete OAuth authentication first:", "yellow")
        self._print("1. Start the MCP OAuth server: python ../mcp-server/oauth_server.py", "cyan")
        self._print("2. Complete OAuth: python ../mcp-server/complete_oauth.py", "cyan")
        self._print("3. Or manually visit: http://localhost:8000/auth", "cyan")
        return False

    def _load_credentials_from_mcp_server(self):
        """Load credentials from MCP server's credentials.json file."""
        try:
            mcp_creds_path = os.path.join(os.path.dirname(__file__), '..', 'mcp-server', 'credentials.json')
            if os.path.exists(mcp_creds_path):
                with open(mcp_creds_path, 'r') as f:
                    creds_data = json.load(f)
                
                self.credentials = Credentials(
                    token=creds_data['token'],
                    refresh_token=creds_data['refresh_token'],
                    token_uri=creds_data['token_uri'],
                    client_id=creds_data['client_id'],
                    client_secret=creds_data['client_secret'],
                    scopes=creds_data['scopes']
                )
                
                if creds_data['expiry']:
                    from datetime import datetime
                    self.credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
                
                self._print("✅ Loaded credentials from MCP server", "green")
        except Exception as e:
            self._print(f"❌ Failed to load credentials from MCP server: {e}", "red")

    def _get_gmail_service(self):
        """Get authenticated Gmail service."""
        if not self._ensure_authenticated():
            return None
        
        if not self.service:
            try:
                # Refresh token if needed
                if self.credentials.expired and self.credentials.refresh_token:
                    self.credentials.refresh(Request())
                
                self.service = build('gmail', 'v1', credentials=self.credentials)
                self._print("✅ Gmail service initialized", "green")
            except Exception as e:
                self._print(f"❌ Failed to initialize Gmail service: {e}", "red")
                return None
        
        return self.service

    def list_emails(self, max_results: int = 10, label: str = "INBOX") -> Optional[List[Dict[str, Any]]]:
        """List emails from Gmail."""
        service = self._get_gmail_service()
        if not service:
            return None
        
        try:
            results = service.users().messages().list(
                userId='me',
                labelIds=[label],
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = service.users().messages().get(
                    userId='me',
                    id=message['id'],
                    format='metadata',
                    metadataHeaders=['Subject', 'From', 'Date']
                ).execute()
                
                headers = msg['payload']['headers']
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                emails.append({
                    'id': message['id'],
                    'subject': subject,
                    'from': sender,
                    'date': date,
                    'snippet': msg.get('snippet', '')
                })
            
            return emails
        
        except HttpError as error:
            self._print(f"❌ Gmail API error: {error.resp.status} {error.content.decode()}", "red")
            return None
        except Exception as e:
            self._print(f"❌ Failed to list emails: {str(e)}", "red")
            return None

    def read_email(self, email_id: str) -> Optional[Dict[str, Any]]:
        """Read a specific email."""
        service = self._get_gmail_service()
        if not service:
            return None
        
        try:
            message = service.users().messages().get(
                userId='me',
                id=email_id,
                format='full'
            ).execute()
            
            headers = message['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
            
            # Extract body
            body = self._extract_email_body(message['payload'])
            
            return {
                'id': email_id,
                'subject': subject,
                'from': sender,
                'date': date,
                'body': body
            }
        
        except HttpError as error:
            self._print(f"❌ Gmail API error: {error.resp.status} {error.content.decode()}", "red")
            return None
        except Exception as e:
            self._print(f"❌ Failed to read email: {str(e)}", "red")
            return None

    def send_email(self, to: str, subject: str, body: str, 
                   cc: Optional[str] = None, bcc: Optional[str] = None) -> bool:
        """Send an email via Gmail."""
        service = self._get_gmail_service()
        if not service:
            return False
        
        try:
            import base64
            from email.mime.text import MIMEText
            
            message = MIMEText(body)
            message['to'] = to
            message['subject'] = subject
            
            if cc:
                message['cc'] = cc
            if bcc:
                message['bcc'] = bcc
            
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            sent_message = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            self._print(f"✅ Email sent successfully! Message ID: {sent_message['id']}", "green")
            return True
        
        except HttpError as error:
            self._print(f"❌ Gmail API error: {error.resp.status} {error.content.decode()}", "red")
            return False
        except Exception as e:
            self._print(f"❌ Failed to send email: {str(e)}", "red")
            return False

    def search_emails(self, query: str, max_results: int = 10) -> Optional[List[Dict[str, Any]]]:
        """Search emails in Gmail."""
        service = self._get_gmail_service()
        if not service:
            return None
        
        try:
            results = service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                msg = service.users().messages().get(
                    userId='me',
                    id=message['id'],
                    format='metadata',
                    metadataHeaders=['Subject', 'From', 'Date']
                ).execute()
                
                headers = msg['payload']['headers']
                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
                date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')
                
                emails.append({
                    'id': message['id'],
                    'subject': subject,
                    'from': sender,
                    'date': date,
                    'snippet': msg.get('snippet', '')
                })
            
            return emails
        
        except HttpError as error:
            self._print(f"❌ Gmail API error: {error.resp.status} {error.content.decode()}", "red")
            return None
        except Exception as e:
            self._print(f"❌ Failed to search emails: {str(e)}", "red")
            return None

    def get_labels(self) -> Optional[List[Dict[str, Any]]]:
        """Get Gmail labels."""
        service = self._get_gmail_service()
        if not service:
            return None
        
        try:
            results = service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            
            return [
                {
                    'id': label['id'],
                    'name': label['name'],
                    'type': label['type']
                }
                for label in labels
            ]
        
        except HttpError as error:
            self._print(f"❌ Gmail API error: {error.resp.status} {error.content.decode()}", "red")
            return None
        except Exception as e:
            self._print(f"❌ Failed to get labels: {str(e)}", "red")
            return None

    def _extract_email_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body from payload."""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = part['body']['data']
                    break
        elif payload['mimeType'] == 'text/plain':
            if 'data' in payload['body']:
                body = payload['body']['data']
        
        if body:
            try:
                import base64
                body = base64.urlsafe_b64decode(body).decode('utf-8')
            except Exception:
                body = "Unable to decode email body"
        
        return body

    def display_emails(self, emails: List[Dict[str, Any]], title: str = "Emails"):
        """Display emails in a nice table format."""
        if not emails:
            self._print("No emails found", "yellow")
            return
        
        table = Table(title=title)
        table.add_column("From", style="cyan")
        table.add_column("Subject", style="green")
        table.add_column("Date", style="yellow")
        table.add_column("ID", style="dim")
        
        for email in emails:
            table.add_row(
                email.get('from', 'Unknown')[:30],
                email.get('subject', 'No Subject')[:50],
                email.get('date', 'Unknown')[:20],
                email.get('id', 'Unknown')
            )
        
        console.print(table)

    def display_labels(self, labels: List[Dict[str, Any]]):
        """Display labels in a nice format."""
        if not labels:
            self._print("No labels found", "yellow")
            return
        
        table = Table(title="Gmail Labels")
        table.add_column("Name", style="cyan")
        table.add_column("Type", style="green")
        table.add_column("ID", style="dim")
        
        for label in labels:
            table.add_row(
                label.get('name', 'Unknown'),
                label.get('type', 'Unknown'),
                label.get('id', 'Unknown')
            )
        
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
