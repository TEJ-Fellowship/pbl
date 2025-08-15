#!/usr/bin/env python3
"""
Test script to verify OAuth configuration.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from google_auth_oauthlib.flow import InstalledAppFlow

def test_oauth_config():
    """Test OAuth configuration."""
    print("Testing OAuth Configuration")
    print("=" * 40)
    
    # Check configuration
    print("Configuration:")
    print(f"   Client ID: {Config.GOOGLE_CLIENT_ID[:20]}...")
    print(f"   Client Secret: {'*' * 10}...")
    print(f"   Redirect URI: {Config.GOOGLE_REDIRECT_URI}")
    print(f"   Scopes: {Config.GMAIL_SCOPES}")
    
    # Test OAuth flow creation
    try:
        print("\nTesting OAuth flow creation...")
        flow = InstalledAppFlow.from_client_config(
            Config.get_google_config(),
            Config.GMAIL_SCOPES
        )
        print("OAuth flow created successfully")
        
        # Test authorization URL
        print("\nTesting authorization URL...")
        auth_url, _ = flow.authorization_url(prompt='consent')
        print(f"Authorization URL generated:")
        print(f"   {auth_url[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ OAuth configuration error: {e}")
        return False

if __name__ == "__main__":
    success = test_oauth_config()
    if success:
        print("\nOAuth configuration is working!")
        print("\nNext steps:")
        print("1. Make sure redirect URI is configured in Google Cloud Console")
        print("2. Add your email as a test user in OAuth consent screen")
        print("3. Run: python oauth_server.py")
        print("4. Visit: http://localhost:8000/auth")
    else:
        print("\nOAuth configuration needs to be fixed.")
