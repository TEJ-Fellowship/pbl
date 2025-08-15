#!/usr/bin/env python3
"""
Comprehensive OAuth debugger to identify the exact issue.
"""

import requests
import urllib.parse
from config import Config

def debug_oauth_flow():
    """Debug the OAuth flow step by step."""
    print("🔍 OAuth Flow Debugger")
    print("=" * 50)
    
    # Step 1: Get the authorization URL
    print("📋 Step 1: Getting authorization URL...")
    try:
        response = requests.get("http://localhost:8000/auth", allow_redirects=False)
        if response.status_code == 307:  # Temporary redirect
            auth_url = response.headers.get('location')
            print(f"✅ Authorization URL generated: {auth_url[:100]}...")
            
            # Parse the URL to extract parameters
            parsed_url = urllib.parse.urlparse(auth_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            print("\n📋 Authorization URL Parameters:")
            print(f"   Client ID: {query_params.get('client_id', ['N/A'])[0]}")
            print(f"   Response Type: {query_params.get('response_type', ['N/A'])[0]}")
            print(f"   Scope: {query_params.get('scope', ['N/A'])[0]}")
            print(f"   State: {query_params.get('state', ['N/A'])[0]}")
            print(f"   Prompt: {query_params.get('prompt', ['N/A'])[0]}")
            print(f"   Access Type: {query_params.get('access_type', ['N/A'])[0]}")
            
            # Check if redirect_uri is missing
            if 'redirect_uri' not in query_params:
                print("\n🚨 ISSUE FOUND: redirect_uri is missing from authorization URL!")
                print("   This is likely because it's not configured in Google Cloud Console.")
            else:
                print(f"\n✅ Redirect URI: {query_params.get('redirect_uri', ['N/A'])[0]}")
            
            return auth_url
            
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting authorization URL: {e}")
        return None

def test_google_oauth_directly(auth_url):
    """Test the Google OAuth URL directly."""
    print("\n🌐 Step 2: Testing Google OAuth URL directly...")
    try:
        response = requests.get(auth_url, allow_redirects=False)
        print(f"   Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Google OAuth page loaded successfully")
            return True
        elif response.status_code == 302:
            print("✅ Google OAuth redirecting (this is normal)")
            return True
        else:
            print(f"❌ Unexpected response from Google: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"❌ Error testing Google OAuth: {e}")
        return False

def check_common_issues():
    """Check for common OAuth configuration issues."""
    print("\n🔧 Step 3: Checking for common issues...")
    
    issues = []
    
    # Check if OAuth server is running
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code != 200:
            issues.append("OAuth server not responding correctly")
    except:
        issues.append("OAuth server not running")
    
    # Check configuration
    if not Config.GOOGLE_CLIENT_ID:
        issues.append("Client ID is missing")
    if not Config.GOOGLE_CLIENT_SECRET:
        issues.append("Client Secret is missing")
    if not Config.GOOGLE_REDIRECT_URI:
        issues.append("Redirect URI is missing")
    
    if issues:
        print("❌ Issues found:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("✅ No obvious configuration issues found")
    
    return issues

def provide_solutions():
    """Provide specific solutions based on the error."""
    print("\n💡 Solutions for 'Error 400: invalid_request':")
    print("=" * 50)
    
    print("1. 🔗 **Redirect URI Configuration**")
    print("   Go to Google Cloud Console > APIs & Services > Credentials")
    print("   Click on your OAuth 2.0 Client ID")
    print("   Add this exact redirect URI:")
    print("   http://localhost:8000/auth/callback")
    print("   Click 'Save'")
    
    print("\n2. 👥 **Test User Configuration**")
    print("   Go to Google Cloud Console > APIs & Services > OAuth consent screen")
    print("   Make sure your app is in 'Testing' mode (not 'Production')")
    print("   Add 'sankar.jt68@gmail.com' as a test user")
    print("   Click 'Save'")
    
    print("\n3. 🔑 **OAuth Consent Screen Scopes**")
    print("   In OAuth consent screen, click 'Add or Remove Scopes'")
    print("   Add these Gmail scopes:")
    print("   - https://www.googleapis.com/auth/gmail.readonly")
    print("   - https://www.googleapis.com/auth/gmail.send")
    print("   - https://www.googleapis.com/auth/gmail.modify")
    print("   Click 'Update'")
    
    print("\n4. 📧 **Gmail API**")
    print("   Go to Google Cloud Console > APIs & Services > Library")
    print("   Search for 'Gmail API' and make sure it's enabled")
    
    print("\n5. ⏰ **Wait for Changes**")
    print("   After making changes, wait 2-3 minutes for them to propagate")
    print("   Then try the OAuth flow again")

def main():
    """Main debug function."""
    print("🚀 Starting OAuth Debug...")
    
    # Check for common issues
    issues = check_common_issues()
    
    # Get authorization URL
    auth_url = debug_oauth_flow()
    
    if auth_url:
        # Test Google OAuth directly
        test_google_oauth_directly(auth_url)
    
    # Provide solutions
    provide_solutions()
    
    print("\n🎯 Next Steps:")
    print("1. Follow the solutions above")
    print("2. Wait 2-3 minutes after making changes")
    print("3. Try accessing http://localhost:8000/auth again")
    print("4. If still having issues, check the Google Cloud Console error logs")

if __name__ == "__main__":
    main()
