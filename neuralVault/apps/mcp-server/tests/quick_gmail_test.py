#!/usr/bin/env python3
"""
Quick automated test for Gmail operations.
Tests fetching emails, searching, and getting labels without user input.
"""

import sys
import os
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from gmail_service import GmailService
from google.oauth2.credentials import Credentials

def load_credentials():
    """Load credentials from file."""
    try:
        creds_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'credentials.json')
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
                credentials.expiry = datetime.fromisoformat(creds_data['expiry'])
            
            return credentials
        else:
            return None
    except Exception as e:
        print(f"Error loading credentials: {e}")
        return None

def quick_gmail_test():
    """Quick test of Gmail operations."""
    print("Quick Gmail Operations Test")
    print("=" * 40)
    
    # Load credentials from file
    credentials = load_credentials()
    
    # Check if we have credentials
    if not credentials or not credentials.valid:
        print("ERROR: No valid credentials found!")
        print("Please complete OAuth authentication first.")
        print("Run: python complete_oauth.py")
        return False
    
    print(f"Authentication: Valid (expires: {credentials.expiry})")
    
    # Initialize Gmail service
    gmail_service = GmailService(credentials)
    
    # Test 1: Get Labels
    print("\n1. Testing Gmail Labels...")
    labels_result = gmail_service.get_labels()
    if "error" in labels_result:
        print(f"   FAILED: {labels_result['error']}")
        return False
    else:
        labels = labels_result.get('labels', [])
        print(f"   SUCCESS: Found {len(labels)} labels")
    
    # Test 2: List Recent Emails
    print("\n2. Testing Email Listing...")
    emails_result = gmail_service.list_emails(max_results=3)
    if "error" in emails_result:
        print(f"   FAILED: {emails_result['error']}")
        return False
    else:
        emails = emails_result.get('emails', [])
        print(f"   SUCCESS: Found {len(emails)} recent emails")
        if emails:
            print(f"   Sample: {emails[0]['subject']}")
    
    # Test 3: Search Emails
    print("\n3. Testing Email Search...")
    search_result = gmail_service.search_emails("is:unread", max_results=2)
    if "error" in search_result:
        print(f"   FAILED: {search_result['error']}")
        return False
    else:
        search_emails = search_result.get('emails', [])
        print(f"   SUCCESS: Found {len(search_emails)} unread emails")
    
    # Test 4: Read Email (if available)
    if emails:
        print("\n4. Testing Email Reading...")
        first_email_id = emails[0]['id']
        read_result = gmail_service.read_email(first_email_id)
        if "error" in read_result:
            print(f"   FAILED: {read_result['error']}")
            return False
        else:
            print(f"   SUCCESS: Read email '{read_result['subject']}'")
    
    print("\n" + "=" * 40)
    print("All Gmail operations working correctly!")
    return True

if __name__ == "__main__":
    success = quick_gmail_test()
    sys.exit(0 if success else 1)
