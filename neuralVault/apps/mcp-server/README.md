# MCP Gmail Server

A Model Context Protocol (MCP) server that provides Gmail integration capabilities with OAuth 2.0 authentication.

## 📁 **Project Structure**

```
neuralVault/apps/mcp-server/
├── main.py              # MCP server (stdio transport) - NOT needed for Gemini app
├── oauth_server.py      # OAuth authentication server - REQUIRED
├── run.py               # MCP server runner - NOT needed for Gemini app
├── config.py            # Configuration management
├── gmail_service.py     # Gmail API service
├── complete_oauth.py    # OAuth helper script
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
pip install -r requirements.txt
```

### **2. Configure Environment**

The `.env` file should contain your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
HOST=0.0.0.0
PORT=8000
```

### **3. Run OAuth Authentication (REQUIRED)**

**For Gemini App Integration:**

```bash
# Start OAuth server
python oauth_server.py
```

Then visit http://localhost:8000/auth to complete OAuth

**OR use the helper script:**

```bash
python complete_oauth.py
```

### **4. That's It!**

Once OAuth is complete, the Gemini app can use the credentials directly. No need to run `run.py`.

## 📧 **Features**

- **Gmail Authentication** via OAuth 2.0
- **Read Emails** from Gmail
- **Send Emails** via Gmail
- **Search Emails** with advanced queries
- **Manage Email Labels**
- **OAuth Credentials Management** for client integration

## 🔧 **Core Components**

### **oauth_server.py** ⭐ **REQUIRED**

- FastAPI-based OAuth authentication server
- Handles Google OAuth 2.0 flow
- Saves credentials to `credentials.json`
- **This is the only component needed for Gemini app integration**

### **complete_oauth.py** ⭐ **HELPER**

- Helper script for OAuth authentication
- Automates OAuth flow completion
- Tests OAuth server connectivity

### **config.py**

- Configuration management
- Environment variable handling
- OAuth credential validation

### **gmail_service.py**

- Gmail API integration service
- Handles email operations (list, search, read, send)
- Manages OAuth token refresh

### **main.py** ❌ **NOT NEEDED**

- MCP server implementation using stdio transport
- Only needed for MCP protocol clients
- **Not used by Gemini app**

### **run.py** ❌ **NOT NEEDED**

- MCP server runner
- Only needed for MCP protocol clients
- **Not used by Gemini app**

## 🔒 **Authentication**

The server uses OAuth 2.0 for secure Gmail access:

1. **OAuth Server**: Runs on `http://localhost:8000`
2. **Credentials Storage**: Saved to `credentials.json`
3. **Token Refresh**: Automatic token renewal
4. **Scope**: Full Gmail API access (read, send, modify)

## 🎯 **Integration**

### **With Gemini App** ⭐ **PRIMARY USE CASE**

- Supplies OAuth credentials for Gmail access
- Enables natural language email management
- Provides secure authentication flow
- **Only requires OAuth authentication, no MCP server needed**

### **With MCP Client** (Alternative)

- Provides Gmail operations via MCP protocol
- Supports function calling for email management
- Handles authentication automatically
- **Requires both OAuth authentication AND MCP server**

## 🚨 **Troubleshooting**

### **"OAuth server not running"**

```bash
python oauth_server.py
```

### **"Authentication required"**

```bash
python complete_oauth.py
```

### **"Configuration validation failed"**

- Check `.env` file exists with correct credentials
- Verify Google OAuth client is configured properly

### **"MCP server not responding"** (Only for MCP clients)

```bash
python run.py
```

## 📊 **Current Status**

**✅ FULLY OPERATIONAL**

- ✅ OAuth authentication working
- ✅ Gmail API integration functional
- ✅ Credentials management operational
- ✅ Token refresh working
- ✅ Integration with Gemini app successful
- ✅ MCP protocol communication active (for MCP clients)

## 🔗 **Related Components**

- **MCP Client**: `../mcp-client/` - Python Gmail client (used by Gemini app)
- **Gemini App**: `../gemini/` - TypeScript AI integration
- **Credentials**: `credentials.json` - OAuth tokens

## 📞 **Support**

For Gemini app integration:

1. Check OAuth server is running
2. Verify credentials in `.env` file
3. Test with `python complete_oauth.py`
4. **No need to run `run.py`**

For MCP protocol clients:

1. Complete OAuth authentication first
2. Then run `python run.py`

---

**🎉 MCP Gmail Server is ready for integration!**

**Note**: For Gemini app integration, only OAuth authentication is required. The MCP server (`run.py`) is not needed.
