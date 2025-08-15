#!/usr/bin/env python3
"""
Simple OAuth test that can be run from the tests directory.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_oauth_config():
    """Test OAuth configuration."""
    try:
        from config import Config
        print("OAuth Configuration Test")
        print("=" * 40)
        
        # Check configuration
        print("Configuration:")
        print(f"   Client ID: {Config.GOOGLE_CLIENT_ID[:20]}...")
        print(f"   Client Secret: {'*' * 10}...")
        print(f"   Redirect URI: {Config.GOOGLE_REDIRECT_URI}")
        print(f"   Scopes: {Config.GMAIL_SCOPES}")
        
        # Test OAuth flow creation
        print("\nTesting OAuth flow creation...")
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            Config.get_google_config(),
            Config.GMAIL_SCOPES,
            redirect_uri=Config.GOOGLE_REDIRECT_URI
        )
        print("OAuth flow created successfully")
        
        # Test authorization URL
        print("\nTesting authorization URL...")
        auth_url, _ = flow.authorization_url(prompt='consent')
        print(f"Authorization URL generated:")
        print(f"   {auth_url[:100]}...")
        
        # Check if redirect_uri is included
        if 'redirect_uri' in auth_url:
            print("Redirect URI is included in authorization URL")
            return True
        else:
            print("WARNING: Redirect URI is missing from authorization URL")
            return False
        
    except Exception as e:
        print(f"OAuth configuration error: {e}")
        return False

if __name__ == "__main__":
    success = test_oauth_config()
    if success:
        print("\nOAuth configuration is working!")
    else:
        print("\nOAuth configuration needs to be fixed.")
