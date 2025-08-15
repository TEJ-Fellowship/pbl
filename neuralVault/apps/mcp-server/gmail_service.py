"""
Gmail service module for handling Gmail API operations.
"""

import base64
from typing import Any, Dict, List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import Config

class GmailService:
    """Service class for Gmail operations."""
    
    def __init__(self, credentials: Optional[Credentials] = None):
        """Initialize Gmail service with credentials."""
        self.credentials = credentials
        self.service = None
    
    def authenticate(self, credentials: Credentials):
        """Set credentials for the service."""
        self.credentials = credentials
        self.service = None
    
    def get_service(self):
        """Get authenticated Gmail service."""
        if not self.credentials or not self.credentials.valid:
            if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                self.credentials.refresh(GoogleRequest())
            else:
                raise ValueError("Not authenticated")
        
        if not self.service:
            self.service = build('gmail', 'v1', credentials=self.credentials)
        
        return self.service
    
    def list_emails(self, max_results: int = 10, label: str = "INBOX") -> Dict[str, Any]:
        """List emails from Gmail."""
        try:
            service = self.get_service()
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
            
            return {"emails": emails}
        
        except HttpError as error:
            return {"error": f"Gmail API error: {error.resp.status} {error.content.decode()}"}
        except Exception as e:
            return {"error": f"Failed to list emails: {str(e)}"}
    
    def read_email(self, email_id: str) -> Dict[str, Any]:
        """Read a specific email."""
        try:
            service = self.get_service()
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
            return {"error": f"Gmail API error: {error.resp.status} {error.content.decode()}"}
        except Exception as e:
            return {"error": f"Failed to read email: {str(e)}"}
    
    def send_email(self, to: str, subject: str, body: str, 
                   cc: Optional[str] = None, bcc: Optional[str] = None) -> Dict[str, Any]:
        """Send an email via Gmail."""
        try:
            service = self.get_service()
            
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
            
            return {
                'message': 'Email sent successfully',
                'message_id': sent_message['id']
            }
        
        except HttpError as error:
            return {"error": f"Gmail API error: {error.resp.status} {error.content.decode()}"}
        except Exception as e:
            return {"error": f"Failed to send email: {str(e)}"}
    
    def search_emails(self, query: str, max_results: int = 10) -> Dict[str, Any]:
        """Search emails in Gmail."""
        try:
            service = self.get_service()
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
            
            return {"emails": emails}
        
        except HttpError as error:
            return {"error": f"Gmail API error: {error.resp.status} {error.content.decode()}"}
        except Exception as e:
            return {"error": f"Failed to search emails: {str(e)}"}
    
    def get_labels(self) -> Dict[str, Any]:
        """Get Gmail labels."""
        try:
            service = self.get_service()
            results = service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            
            return {
                'labels': [
                    {
                        'id': label['id'],
                        'name': label['name'],
                        'type': label['type']
                    }
                    for label in labels
                ]
            }
        
        except HttpError as error:
            return {"error": f"Gmail API error: {error.resp.status} {error.content.decode()}"}
        except Exception as e:
            return {"error": f"Failed to get labels: {str(e)}"}
    
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
                body = base64.urlsafe_b64decode(body).decode('utf-8')
            except Exception:
                body = "Unable to decode email body"
        
        return body
