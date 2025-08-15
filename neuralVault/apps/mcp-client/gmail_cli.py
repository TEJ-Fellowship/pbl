#!/usr/bin/env python3
"""
Command Line Interface for Gmail MCP Client
Provides interactive commands for Gmail operations.
"""

import asyncio
import click
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel
from gmail_client_simple import SimpleGmailClient

console = Console()

@click.group()
def cli():
    """Gmail MCP Client - Command Line Interface"""
    pass

@cli.command()
@click.option('--max-results', default=10, help='Maximum number of emails to fetch')
@click.option('--label', default='INBOX', help='Gmail label to fetch emails from')
def list_emails(max_results, label):
    """List emails from Gmail."""
    _list_emails(max_results, label)

def _list_emails(max_results, label):
    client = SimpleGmailClient()
    try:
        client.list_emails(max_results=max_results, label=label)
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

@cli.command()
@click.argument('query')
@click.option('--max-results', default=10, help='Maximum number of emails to fetch')
def search(query, max_results):
    """Search emails in Gmail."""
    _search_emails(query, max_results)

def _search_emails(query, max_results):
    client = SimpleGmailClient()
    try:
        client.search_emails(query, max_results=max_results)
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

@cli.command()
@click.argument('email_id')
def read(email_id):
    """Read a specific email."""
    _read_email(email_id)

def _read_email(email_id):
    client = SimpleGmailClient()
    try:
        client.read_email(email_id)
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

@cli.command()
@click.option('--to', prompt='Recipient email', help='Email address to send to')
@click.option('--subject', prompt='Subject', help='Email subject')
@click.option('--body', prompt='Message body', help='Email body')
@click.option('--cc', help='CC email address')
@click.option('--bcc', help='BCC email address')
def send(to, subject, body, cc, bcc):
    """Send an email."""
    _send_email(to, subject, body, cc, bcc)

def _send_email(to, subject, body, cc, bcc):
    client = SimpleGmailClient()
    try:
        success = client.send_email(to, subject, body, cc, bcc)
        if success:
            console.print("✅ Email sent successfully!", style="green")
        else:
            console.print("❌ Failed to send email", style="red")
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

@cli.command()
def labels():
    """Get Gmail labels."""
    _get_labels()

def _get_labels():
    client = SimpleGmailClient()
    try:
        client.get_labels()
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

@cli.command()
def interactive():
    """Start interactive mode."""
    _interactive_mode()

def _interactive_mode():
    client = SimpleGmailClient()
    
    try:
        
        console.print(Panel.fit(
            "🎯 Gmail MCP Client - Interactive Mode\n"
            "Type 'help' for available commands or 'quit' to exit",
            title="Welcome",
            border_style="blue"
        ))
        
        while True:
            try:
                command = Prompt.ask("\n[bold cyan]gmail>[/bold cyan]")
                
                if command.lower() in ['quit', 'exit', 'q']:
                    break
                elif command.lower() == 'help':
                    _show_help()
                elif command.lower() == 'labels':
                    client.get_labels()
                elif command.lower().startswith('list'):
                    # Parse: list [max_results] [label]
                    parts = command.split()
                    max_results = 10
                    label = 'INBOX'
                    
                    if len(parts) > 1:
                        try:
                            max_results = int(parts[1])
                        except ValueError:
                            pass
                    if len(parts) > 2:
                        label = parts[2]
                    
                    client.list_emails(max_results=max_results, label=label)
                elif command.lower().startswith('search'):
                    # Parse: search <query> [max_results]
                    parts = command.split()
                    if len(parts) < 2:
                        console.print("❌ Usage: search <query> [max_results]", style="red")
                        continue
                    
                    query = parts[1]
                    max_results = 10
                    if len(parts) > 2:
                        try:
                            max_results = int(parts[2])
                        except ValueError:
                            pass
                    
                    client.search_emails(query, max_results=max_results)
                elif command.lower().startswith('read'):
                    # Parse: read <email_id>
                    parts = command.split()
                    if len(parts) < 2:
                        console.print("❌ Usage: read <email_id>", style="red")
                        continue
                    
                    email_id = parts[1]
                    client.read_email(email_id)
                elif command.lower().startswith('send'):
                    # Parse: send <to> <subject> <body>
                    parts = command.split()
                    if len(parts) < 4:
                        console.print("❌ Usage: send <to> <subject> <body>", style="red")
                        continue
                    
                    to = parts[1]
                    subject = parts[2]
                    body = ' '.join(parts[3:])
                    
                    success = client.send_email(to, subject, body)
                    if success:
                        console.print("✅ Email sent successfully!", style="green")
                    else:
                        console.print("❌ Failed to send email", style="red")
                else:
                    console.print("❌ Unknown command. Type 'help' for available commands.", style="red")
                    
            except KeyboardInterrupt:
                break
            except Exception as e:
                console.print(f"❌ Error: {e}", style="red")
        
        console.print("👋 Goodbye!", style="blue")
        
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

def _show_help():
    """Show available commands."""
    help_text = """
[bold]Available Commands:[/bold]

[cyan]labels[/cyan]                    - Get all Gmail labels
[cyan]list [max] [label][/cyan]        - List emails (default: 10 from INBOX)
[cyan]search <query> [max][/cyan]      - Search emails (default: 10 results)
[cyan]read <email_id>[/cyan]          - Read a specific email
[cyan]send <to> <subject> <body>[/cyan] - Send an email
[cyan]help[/cyan]                     - Show this help
[cyan]quit[/cyan]                     - Exit interactive mode

[bold]Basic Examples:[/bold]
  list 5                    - List 5 emails from INBOX
  list 10 SENT              - List 10 emails from SENT
  list 5 DRAFT              - List 5 draft emails
  list 5 "IT company"       - List 5 emails from custom label
  search "is:unread" 5      - Search for 5 unread emails
  search "from:google.com"  - Search emails from Google
  read 18c1234567890abcdef  - Read specific email
  send user@example.com "Test" "Hello world"

[bold]Advanced Search Examples:[/bold]
  search "is:important" 10          - Important emails
  search "subject:meeting" 5        - Meeting emails
  search "has:attachment" 3         - Emails with attachments
  search "newer_than:1w" 10         - Emails from last week
  search "larger:5M" 3              - Large emails (>5MB)
  search "category:promotions" 5    - Promotional emails
  search "label:work" 10            - Work label emails
  search "after:2024/01/01" 10      - Emails after date

[bold]Combined Search Examples:[/bold]
  search "is:unread from:amazon" 3  - Unread Amazon emails
  search "is:important newer_than:1d" 5 - Important emails today
  search "subject:urgent has:attachment" 2 - Urgent emails with files
  search "from:boss is:unread" 5    - Unread emails from boss
  search "larger:10M has:attachment" 3 - Large emails with files

[bold]Email Management Examples:[/bold]
  search "is:starred" 10            - Starred emails
  search "is:draft" 5               - Draft emails
  search "is:spam" 3                - Spam emails
  search "is:trash" 5               - Trash emails
  search "filename:pdf" 3           - Emails with PDF files
  search "cc:team@company.com" 5    - Emails CC'd to team

[bold]Communication Examples:[/bold]
  send john@example.com "Meeting" "Hi John, let's meet tomorrow"
  send team@company.com "Update" "Weekly progress report attached"
  send boss@company.com "Complete" "Project finished successfully"
"""
    console.print(Panel(help_text, title="Help", border_style="green"))

@cli.command()
def demo():
    """Run a demo of all Gmail operations."""
    _run_demo()

def _run_demo():
    client = SimpleGmailClient()
    
    try:
        console.print("\n🎯 Gmail MCP Client Demo", style="bold blue")
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
        
    except Exception as e:
        console.print(f"❌ Error: {e}", style="red")

if __name__ == "__main__":
    cli()
