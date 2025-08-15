#!/usr/bin/env python3
"""
Comprehensive test script for Gmail operations.
Tests fetching emails, sending emails, searching, and getting labels.
"""

import sys
import os
import json
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gmail_service import GmailService
from oauth_server import credentials

def test_gmail_operations():
    """Test all Gmail operations."""
    print("Gmail Operations Test")
    print("=" * 50)
    
    # Check if we have credentials
    if not credentials or not credentials.valid:
        print("ERROR: No valid credentials found!")
        print("Please run the OAuth server first:")
        print("1. python oauth_server.py")
        print("2. Visit http://localhost:8000/auth")
        print("3. Complete the OAuth flow")
        return False
    
    print(f"Authentication Status: {'Valid' if credentials.valid else 'Invalid'}")
    print(f"Token expires at: {credentials.expiry}")
    print()
    
    # Initialize Gmail service
    gmail_service = GmailService(credentials)
    
    # Test 1: Get Gmail Labels
    print("Test 1: Getting Gmail Labels")
    print("-" * 30)
    labels_result = gmail_service.get_labels()
    if "error" in labels_result:
        print(f"FAILED: {labels_result['error']}")
        return False
    else:
        labels = labels_result.get('labels', [])
        print(f"SUCCESS: Found {len(labels)} labels")
        for label in labels[:5]:  # Show first 5 labels
            print(f"   - {label['name']} ({label['type']})")
        if len(labels) > 5:
            print(f"   ... and {len(labels) - 5} more")
    print()
    
    # Test 2: List Recent Emails
    print("Test 2: Listing Recent Emails")
    print("-" * 30)
    emails_result = gmail_service.list_emails(max_results=5)
    if "error" in emails_result:
        print(f"FAILED: {emails_result['error']}")
        return False
    else:
        emails = emails_result.get('emails', [])
        print(f"SUCCESS: Found {len(emails)} recent emails")
        for email in emails:
            print(f"   - {email['subject']} (from: {email['from']})")
            print(f"     Date: {email['date']}")
            print(f"     Snippet: {email['snippet'][:100]}...")
            print()
    print()
    
    # Test 3: Search Emails
    print("Test 3: Searching Emails")
    print("-" * 30)
    search_result = gmail_service.search_emails("is:important", max_results=3)
    if "error" in search_result:
        print(f"FAILED: {search_result['error']}")
        return False
    else:
        search_emails = search_result.get('emails', [])
        print(f"SUCCESS: Found {len(search_emails)} important emails")
        for email in search_emails:
            print(f"   - {email['subject']} (from: {email['from']})")
    print()
    
    # Test 4: Read a Specific Email (if available)
    if emails:
        print("Test 4: Reading a Specific Email")
        print("-" * 30)
        first_email_id = emails[0]['id']
        read_result = gmail_service.read_email(first_email_id)
        if "error" in read_result:
            print(f"FAILED: {read_result['error']}")
            return False
        else:
            print(f"SUCCESS: Read email '{read_result['subject']}'")
            print(f"From: {read_result['from']}")
            print(f"Date: {read_result['date']}")
            print(f"Body preview: {read_result['body'][:200]}...")
    print()
    
    # Test 5: Send a Test Email
    print("Test 5: Sending a Test Email")
    print("-" * 30)
    
    # Get user's email for testing
    test_email = input("Enter your email address to send a test email (or press Enter to skip): ").strip()
    
    if test_email:
        subject = f"Test Email from MCP Gmail Server - {time.strftime('%Y-%m-%d %H:%M:%S')}"
        body = f"""
Hello!

This is a test email sent from your MCP Gmail Server.

Features tested:
- OAuth authentication
- Gmail API integration
- Email sending functionality

Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
Your MCP Gmail Server
        """.strip()
        
        send_result = gmail_service.send_email(
            to=test_email,
            subject=subject,
            body=body
        )
        
        if "error" in send_result:
            print(f"FAILED: {send_result['error']}")
            return False
        else:
            print(f"SUCCESS: Test email sent!")
            print(f"Message ID: {send_result['message_id']}")
            print(f"Check your inbox for: {subject}")
    else:
        print("SKIPPED: Email sending test")
    
    print()
    print("=" * 50)
    print("All Gmail operations tests completed successfully!")
    print("Your MCP Gmail server is fully functional!")
    
    return True

def main():
    """Main function."""
    try:
        success = test_gmail_operations()
        if success:
            print("\nNext steps:")
            print("1. Your MCP server is ready for production use")
            print("2. You can now use Gmail tools through MCP clients")
            print("3. Run 'python run.py' to start the MCP server")
        else:
            print("\nSome tests failed. Please check the errors above.")
        
        return success
        
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
