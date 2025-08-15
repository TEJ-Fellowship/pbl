#!/usr/bin/env python3
"""
Run script for the MCP Gmail Server.
"""

import asyncio
import sys
from config import Config
from main import main

if __name__ == "__main__":
    # Validate configuration
    missing_config = Config.validate()
    if missing_config:
        print("❌ Missing required configuration:")
        for item in missing_config:
            print(f"   - {item}")
        print("\nPlease set the required environment variables in your .env file.")
        print("See env.example for reference.")
        sys.exit(1)
    
    print("✅ Configuration validated successfully!")
    print(f"🚀 Starting MCP Gmail Server on {Config.HOST}:{Config.PORT}")
    print("📧 Gmail integration ready!")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 MCP Server stopped by user")
    except Exception as e:
        print(f"❌ Error running MCP server: {e}")
        sys.exit(1)
