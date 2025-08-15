#!/usr/bin/env python3
"""
Helper script to complete OAuth authentication for Gmail testing.
"""

import webbrowser
import time
import requests

def complete_oauth():
    """Guide user through OAuth completion."""
    print("Gmail OAuth Authentication Helper")
    print("=" * 40)
    
    # Check if OAuth server is running
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ OAuth server is running")
        else:
            print("❌ OAuth server is not responding")
            return False
    except requests.exceptions.RequestException:
        print("❌ OAuth server is not running")
        print("Please start it first: python oauth_server.py")
        return False
    
    # Check current authentication status
    try:
        status_response = requests.get("http://localhost:8000/status", timeout=5)
        if status_response.status_code == 200:
            status_data = status_response.json()
            if status_data.get("authenticated"):
                print("✅ Already authenticated!")
                print(f"Token expires: {status_data.get('expires_at')}")
                return True
    except:
        pass
    
    print("❌ Not authenticated yet")
    print("\nLet's complete OAuth authentication:")
    print("1. Opening browser to OAuth page...")
    
    # Open browser to OAuth page
    try:
        webbrowser.open("http://localhost:8000/auth")
        print("2. Browser opened! Complete the OAuth flow:")
        print("   - Click 'Allow' on Google's consent page")
        print("   - You'll be redirected back to localhost")
        print("   - You should see 'Authentication successful!'")
        
        # Wait for user to complete authentication
        print("\n3. Waiting for authentication to complete...")
        print("   (Complete the OAuth flow in your browser)")
        
        # Poll for authentication status
        max_attempts = 30  # 30 seconds
        for attempt in range(max_attempts):
            time.sleep(1)
            try:
                status_response = requests.get("http://localhost:8000/status", timeout=2)
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    if status_data.get("authenticated"):
                        print("✅ Authentication completed successfully!")
                        print(f"Token expires: {status_data.get('expires_at')}")
                        return True
            except:
                pass
            
            if attempt % 5 == 0:  # Show progress every 5 seconds
                print(f"   Still waiting... ({attempt + 1}/{max_attempts} seconds)")
        
        print("❌ Authentication timeout. Please try again.")
        return False
        
    except Exception as e:
        print(f"❌ Error opening browser: {e}")
        print("Please manually visit: http://localhost:8000/auth")
        return False

if __name__ == "__main__":
    success = complete_oauth()
    if success:
        print("\n🎉 Ready to test Gmail operations!")
        print("Run: python tests/quick_gmail_test.py")
    else:
        print("\n❌ Authentication failed. Please try again.")
