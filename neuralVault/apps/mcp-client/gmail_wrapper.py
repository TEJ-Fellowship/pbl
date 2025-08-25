#!/usr/bin/env python3
"""
Gmail Wrapper for Gemini Integration
Simple wrapper to make Gmail client accessible to the Gemini app.
"""

import sys
import json
import os
from gmail_client_simple import SimpleGmailClient

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No command provided"}))
        return

    command = sys.argv[1]
    try:
        client = SimpleGmailClient(silent=True)  # Initialize in silent mode

        if command == "list-emails":
            max_results = 10
            label = "INBOX"
            
            if len(sys.argv) > 2:
                try:
                    max_results = int(sys.argv[2])
                except ValueError:
                    pass
            
            if len(sys.argv) > 3:
                label = sys.argv[3]
            
            emails = client.list_emails(max_results=max_results, label=label)
            if emails is None:
                emails = []
            print(json.dumps({"success": True, "emails": emails}, ensure_ascii=False))
            
        elif command == "search-emails":
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "error": "Search query required"}))
                return
            
            query = sys.argv[2]
            max_results = 10
            
            if len(sys.argv) > 3:
                try:
                    max_results = int(sys.argv[3])
                except ValueError:
                    pass
            
            emails = client.search_emails(query, max_results=max_results)
            if emails is None:
                emails = []
            print(json.dumps({"success": True, "emails": emails}, ensure_ascii=False))
            
        elif command == "read-email":
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "error": "Email ID required"}))
                return
            
            email_id = sys.argv[2]
            email = client.read_email(email_id)
            if email is None:
                print(json.dumps({"success": False, "error": "Failed to read email"}))
            else:
                print(json.dumps({"success": True, "email": email}, ensure_ascii=False))
                
        elif command == "send-email":
            if len(sys.argv) < 5:
                print(json.dumps({"success": False, "error": "To, subject, and body required"}))
                return
            
            to_email = sys.argv[2]
            subject = sys.argv[3]
            body = sys.argv[4]
            
            success = client.send_email(to_email, subject, body)
            print(json.dumps({"success": success, "message": "Email sent" if success else "Failed to send email"}))
            
        elif command == "get-labels":
            labels = client.get_labels()
            if labels is None:
                labels = []
            print(json.dumps({"success": True, "labels": labels}, ensure_ascii=False))
            
        else:
            print(json.dumps({"success": False, "error": f"Unknown command: {command}"}))
            
    except Exception as e:
        error_msg = str(e)
        if "No credentials file found" in error_msg or "Missing Google OAuth credentials" in error_msg:
            print(json.dumps({"success": False, "error": "Authentication required. Please complete OAuth setup first."}))
        else:
            print(json.dumps({"success": False, "error": error_msg}))

if __name__ == "__main__":
    main()
