#!/usr/bin/env python3
"""
Gmail API for TypeScript Bridge
Returns JSON data instead of displaying output
"""

import sys
import json
import argparse
import os
from google.oauth2.credentials import Credentials
from gmail_client_simple import SimpleGmailClient

# Suppress console output for API mode
os.environ['SUPPRESS_OUTPUT'] = '1'

def get_gmail_service():
    """Get Gmail service with credentials."""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'mcp-server'))
        
        from gmail_service import GmailService
        
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
            
            return GmailService(credentials)
        else:
            raise Exception("No credentials file found. Please complete OAuth authentication.")
    except Exception as e:
        raise Exception(f"Failed to initialize Gmail service: {str(e)}")

def list_emails(max_results=10, label='INBOX'):
    """List emails and return JSON."""
    try:
        gmail_service = get_gmail_service()
        result = gmail_service.list_emails(max_results=max_results, label=label)
        
        if "emails" in result:
            emails = result["emails"]
            return {
                "success": True,
                "emails": emails,
                "count": len(emails),
                "message": f"Found {len(emails)} emails from {label}"
            }
        else:
            return {
                "success": False,
                "error": result.get('error', 'Unknown error'),
                "emails": [],
                "count": 0
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "emails": [],
            "count": 0
        }

def search_emails(query, max_results=10):
    """Search emails and return JSON."""
    try:
        gmail_service = get_gmail_service()
        result = gmail_service.search_emails(query=query, max_results=max_results)
        
        if "emails" in result:
            emails = result["emails"]
            return {
                "success": True,
                "emails": emails,
                "count": len(emails),
                "query": query,
                "message": f"Found {len(emails)} emails matching '{query}'"
            }
        else:
            return {
                "success": False,
                "error": result.get('error', 'Unknown error'),
                "emails": [],
                "count": 0,
                "query": query
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "emails": [],
            "count": 0,
            "query": query
        }

def read_email(email_id):
    """Read email and return JSON."""
    try:
        gmail_service = get_gmail_service()
        result = gmail_service.read_email(email_id)
        
        if "email" in result:
            email = result["email"]
            return {
                "success": True,
                "email": email,
                "message": f"Successfully read email {email_id}"
            }
        else:
            return {
                "success": False,
                "error": result.get('error', f"Email {email_id} not found"),
                "message": f"Email {email_id} not found"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Error reading email: {str(e)}"
        }

def send_email(to, subject, body, cc=None, bcc=None):
    """Send email and return JSON."""
    try:
        gmail_service = get_gmail_service()
        result = gmail_service.send_email(to=to, subject=subject, body=body, cc=cc, bcc=bcc)
        
        if result.get("success", False):
            return {
                "success": True,
                "to": to,
                "subject": subject,
                "message": f"Email sent successfully to {to}"
            }
        else:
            return {
                "success": False,
                "to": to,
                "subject": subject,
                "error": result.get('error', 'Failed to send email'),
                "message": f"Failed to send email to {to}"
            }
    except Exception as e:
        return {
            "success": False,
            "to": to,
            "subject": subject,
            "error": str(e),
            "message": f"Error sending email: {str(e)}"
        }

def get_labels():
    """Get labels and return JSON."""
    try:
        gmail_service = get_gmail_service()
        result = gmail_service.get_labels()
        
        if "labels" in result:
            labels = result["labels"]
            return {
                "success": True,
                "labels": labels,
                "count": len(labels),
                "message": f"Found {len(labels)} Gmail labels"
            }
        else:
            return {
                "success": False,
                "error": result.get('error', 'Unknown error'),
                "labels": [],
                "count": 0
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "labels": [],
            "count": 0
        }

def main():
    parser = argparse.ArgumentParser(description='Gmail API for TypeScript Bridge')
    parser.add_argument('command', choices=['list-emails', 'search', 'read', 'send', 'labels'])
    parser.add_argument('--max-results', type=int, default=10)
    parser.add_argument('--label', default='INBOX')
    parser.add_argument('--query', help='Search query')
    parser.add_argument('--email-id', help='Email ID to read')
    parser.add_argument('--to', help='Recipient email')
    parser.add_argument('--subject', help='Email subject')
    parser.add_argument('--body', help='Email body')
    parser.add_argument('--cc', help='CC email')
    parser.add_argument('--bcc', help='BCC email')
    
    args = parser.parse_args()
    
    if args.command == 'list-emails':
        result = list_emails(args.max_results, args.label)
    elif args.command == 'search':
        if not args.query:
            result = {"success": False, "error": "Query is required for search"}
        else:
            result = search_emails(args.query, args.max_results)
    elif args.command == 'read':
        if not args.email_id:
            result = {"success": False, "error": "Email ID is required for read"}
        else:
            result = read_email(args.email_id)
    elif args.command == 'send':
        if not all([args.to, args.subject, args.body]):
            result = {"success": False, "error": "to, subject, and body are required for send"}
        else:
            result = send_email(args.to, args.subject, args.body, args.cc, args.bcc)
    elif args.command == 'labels':
        result = get_labels()
    else:
        result = {"success": False, "error": f"Unknown command: {args.command}"}
    
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
