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
            
        elif command == "mark-as-read":
            if len(sys.argv) < 4:
                print(json.dumps({"success": False, "error": "Email IDs and read status required"}))
                return
            
            email_ids = sys.argv[2].split(',')
            read = sys.argv[3].lower() == 'true'
            
            success = client.mark_as_read(email_ids, read)
            print(json.dumps({"success": success, "message": f"Marked {len(email_ids)} email(s) as {'read' if read else 'unread'}"}))
            
        elif command == "star-emails":
            if len(sys.argv) < 4:
                print(json.dumps({"success": False, "error": "Email IDs and starred status required"}))
                return
            
            email_ids = sys.argv[2].split(',')
            starred = sys.argv[3].lower() == 'true'
            
            success = client.star_emails(email_ids, starred)
            print(json.dumps({"success": success, "message": f"{'Starred' if starred else 'Unstarred'} {len(email_ids)} email(s)"}))
            
        elif command == "move-to-label":
            if len(sys.argv) < 4:
                print(json.dumps({"success": False, "error": "Email IDs and label name required"}))
                return
            
            email_ids = sys.argv[2].split(',')
            label_name = sys.argv[3]
            
            success = client.move_to_label(email_ids, label_name)
            print(json.dumps({"success": success, "message": f"Moved {len(email_ids)} email(s) to label '{label_name}'"}))
            
        elif command == "reply-to-email":
            if len(sys.argv) < 4:
                print(json.dumps({"success": False, "error": "Email ID and reply body required"}))
                return
            
            email_id = sys.argv[2]
            body = sys.argv[3]
            include_original = len(sys.argv) > 4 and sys.argv[4].lower() == 'true'
            
            success = client.reply_to_email(email_id, body, include_original)
            print(json.dumps({"success": success, "message": "Reply sent" if success else "Failed to send reply"}))
            
        elif command == "forward-email":
            if len(sys.argv) < 4:
                print(json.dumps({"success": False, "error": "Email ID and recipient email required"}))
                return
            
            email_id = sys.argv[2]
            to_email = sys.argv[3]
            message = sys.argv[4] if len(sys.argv) > 4 else ""
            
            success = client.forward_email(email_id, to_email, message)
            print(json.dumps({"success": success, "message": "Email forwarded" if success else "Failed to forward email"}))
            
        elif command == "get-attachments":
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "error": "Email ID required"}))
                return
            
            email_id = sys.argv[2]
            attachments = client.get_attachments(email_id)
            if attachments is None:
                attachments = []
            print(json.dumps({"success": True, "attachments": attachments}, ensure_ascii=False))
            
        elif command == "create-label":
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "error": "Label name required"}))
                return
            
            label_name = sys.argv[2]
            background_color = sys.argv[3] if len(sys.argv) > 3 else "#4285f4"
            
            created_label = client.create_label(label_name, background_color)
            if created_label:
                print(json.dumps({"success": True, "label": created_label}, ensure_ascii=False))
            else:
                print(json.dumps({"success": False, "error": "Failed to create label"}))
            
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
