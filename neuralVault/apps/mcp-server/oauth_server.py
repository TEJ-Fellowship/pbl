#!/usr/bin/env python3
"""
OAuth server for Gmail authentication.
This runs separately from the MCP server.
"""

import uvicorn
import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from config import Config

# FastAPI app for OAuth flow
app = FastAPI(title="Gmail OAuth Server")

# Store credentials (in production, use proper storage)
credentials = None

def save_credentials_to_file(creds):
    """Save credentials to a file for other processes to access."""
    if creds:
        creds_data = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes,
            'expiry': creds.expiry.isoformat() if creds.expiry else None
        }
        
        with open('credentials.json', 'w') as f:
            json.dump(creds_data, f)

def load_credentials_from_file():
    """Load credentials from file."""
    global credentials
    try:
        if os.path.exists('credentials.json'):
            with open('credentials.json', 'r') as f:
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
            
            return credentials
    except Exception as e:
        print(f"Error loading credentials: {e}")
        return None

# Load existing credentials on startup
load_credentials_from_file()

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Gmail OAuth Server",
        "endpoints": {
            "auth": "/auth - Start OAuth flow",
            "callback": "/auth/callback - OAuth callback",
            "status": "/status - Check authentication status"
        }
    }

@app.get("/auth")
async def auth():
    """Start OAuth flow."""
    try:
        # Create OAuth flow with redirect URI
        flow = Flow.from_client_config(
            Config.get_google_config(),
            Config.GMAIL_SCOPES,
            redirect_uri=Config.GOOGLE_REDIRECT_URI
        )
        
        auth_url, _ = flow.authorization_url(prompt='consent')
        return RedirectResponse(url=auth_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth error: {str(e)}")

@app.get("/auth/callback")
async def auth_callback(code: str):
    """Handle OAuth callback."""
    global credentials
    
    try:
        # Create OAuth flow with redirect URI
        flow = Flow.from_client_config(
            Config.get_google_config(),
            Config.GMAIL_SCOPES,
            redirect_uri=Config.GOOGLE_REDIRECT_URI
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Save credentials to file
        save_credentials_to_file(credentials)
        
        return {
            "message": "Authentication successful!",
            "access_token": credentials.token[:20] + "..." if credentials.token else None,
            "expires_at": credentials.expiry.isoformat() if credentials.expiry else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OAuth callback error: {str(e)}")

@app.get("/status")
async def status():
    """Check authentication status."""
    global credentials
    
    if credentials and credentials.valid:
        return {
            "authenticated": True,
            "expires_at": credentials.expiry.isoformat() if credentials.expiry else None
        }
    else:
        return {
            "authenticated": False,
            "message": "Not authenticated. Visit /auth to start OAuth flow."
        }

@app.get("/credentials")
async def get_credentials():
    """Get credentials (for testing purposes)."""
    global credentials
    
    if credentials and credentials.valid:
        return {
            "authenticated": True,
            "expires_at": credentials.expiry.isoformat() if credentials.expiry else None,
            "scopes": credentials.scopes
        }
    else:
        return {
            "authenticated": False,
            "message": "No valid credentials available"
        }

def main():
    """Run the OAuth server."""
    print("🚀 Starting Gmail OAuth Server...")
    print(f"📧 Server will run on http://{Config.HOST}:{Config.PORT}")
    print("🔗 Visit http://localhost:8000/auth to start OAuth flow")
    
    uvicorn.run(
        app,
        host=Config.HOST,
        port=Config.PORT,
        log_level="info"
    )

if __name__ == "__main__":
    main()
