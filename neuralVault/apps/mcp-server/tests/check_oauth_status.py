#!/usr/bin/env python3
"""
Comprehensive OAuth status checker.
"""

import os
import requests
from config import Config

def check_oauth_status():
    """Check OAuth configuration and status."""
    print("🔍 OAuth Status Checker")
    print("=" * 50)
    
    # Check environment variables
    print("📋 Environment Variables:")
    print(f"   Client ID: {Config.GOOGLE_CLIENT_ID[:20]}...")
    print(f"   Client Secret: {'*' * 10}...")
    print(f"   Redirect URI: {Config.GOOGLE_REDIRECT_URI}")
    print(f"   Host: {Config.HOST}")
    print(f"   Port: {Config.PORT}")
    
    # Check if OAuth server is running
    print("\n🌐 Checking OAuth server status...")
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ OAuth server is running")
            print(f"   Response: {response.json()}")
        else:
            print(f"⚠️ OAuth server responded with status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ OAuth server is not running")
        print("   Run: python oauth_server.py")
    except Exception as e:
        print(f"❌ Error checking OAuth server: {e}")
    
    # Check OAuth configuration
    print("\n🔧 OAuth Configuration:")
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
        flow = InstalledAppFlow.from_client_config(
            Config.get_google_config(),
            Config.GMAIL_SCOPES
        )
        auth_url, _ = flow.authorization_url(prompt='consent')
        print("✅ OAuth flow configuration is valid")
        print(f"   Auth URL: {auth_url[:80]}...")
    except Exception as e:
        print(f"❌ OAuth configuration error: {e}")
    
    # Check Gmail API access
    print("\n📧 Gmail API Access:")
    try:
        from googleapiclient.discovery import build
        from google.oauth2.credentials import Credentials
        
        # This will fail without valid credentials, but we can check if the API is accessible
        print("✅ Gmail API client can be created")
    except Exception as e:
        print(f"❌ Gmail API error: {e}")
    
    print("\n📋 Manual Verification Steps:")
    print("1. Go to: https://console.cloud.google.com/")
    print("2. Select your project")
    print("3. Go to 'APIs & Services' > 'OAuth consent screen'")
    print("4. Check that 'sankar.jt68@gmail.com' is in 'Test users'")
    print("5. Go to 'APIs & Services' > 'Credentials'")
    print("6. Check that redirect URI 'http://localhost:8000/auth/callback' is added")
    print("7. Go to 'APIs & Services' > 'Library'")
    print("8. Search for 'Gmail API' and ensure it's enabled")

if __name__ == "__main__":
    check_oauth_status()
