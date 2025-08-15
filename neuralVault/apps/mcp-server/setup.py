#!/usr/bin/env python3
"""
Setup script for the MCP Gmail Server.
"""

import os
import sys
from pathlib import Path

def create_env_file():
    """Create .env file from template."""
    env_example = Path("env.example")
    env_file = Path(".env")
    
    if env_file.exists():
        print("⚠️ .env file already exists. Skipping creation.")
        return True
    
    if not env_example.exists():
        print("❌ env.example file not found!")
        return False
    
    try:
        with open(env_example, 'r') as f:
            content = f.read()
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        print("✅ Created .env file from template")
        print("📝 Please edit .env file with your Google OAuth credentials")
        return True
    
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    print("🐍 Checking Python version...")
    
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} is compatible")
    return True

def check_dependencies():
    """Check if required dependencies are installed."""
    print("📦 Checking dependencies...")
    
    # Map package names to their actual import names
    package_imports = {
        'mcp': 'mcp',
        'google-auth': 'google.auth',
        'google-auth-oauthlib': 'google_auth_oauthlib',
        'google-auth-httplib2': 'google_auth_httplib2',
        'google-api-python-client': 'googleapiclient',
        'python-dotenv': 'dotenv',
        'pydantic': 'pydantic',
        'fastapi': 'fastapi',
        'uvicorn': 'uvicorn'
    }
    
    missing = []
    for package, import_name in package_imports.items():
        try:
            __import__(import_name)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package}")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️ Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("✅ All dependencies are installed")
    return True

def print_next_steps():
    """Print next steps for setup."""
    print("\n" + "="*60)
    print("🎯 NEXT STEPS")
    print("="*60)
    print("1. Set up Google Cloud Project:")
    print("   - Go to https://console.cloud.google.com/")
    print("   - Create a new project")
    print("   - Enable Gmail API")
    print("   - Create OAuth 2.0 credentials")
    print()
    print("2. Configure credentials:")
    print("   - Edit the .env file")
    print("   - Add your Google Client ID and Secret")
    print()
    print("3. Run the server:")
    print("   - python run.py")
    print("   - Visit http://localhost:8000/auth")
    print("   - Complete OAuth authentication")
    print()
    print("4. Test the setup:")
    print("   - python test_server.py")
    print()
    print("📚 For detailed instructions, see setup_guide.md")

def main():
    """Main setup function."""
    print("🚀 MCP Gmail Server Setup")
    print("="*40)
    
    checks = [
        ("Python Version", check_python_version),
        ("Dependencies", check_dependencies),
        ("Environment File", create_env_file),
    ]
    
    all_passed = True
    for check_name, check_func in checks:
        print(f"\n🔍 {check_name}...")
        if not check_func():
            all_passed = False
    
    if all_passed:
        print("\n✅ Setup completed successfully!")
        print_next_steps()
    else:
        print("\n❌ Setup failed. Please fix the issues above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
