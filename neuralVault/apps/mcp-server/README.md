# MCP Gmail Server

This is a Model Context Protocol (MCP) server that provides Gmail integration capabilities.

## 📁 **Project Structure**

```
apps/mcp-server/
├── main.py              # MCP server (stdio transport)
├── oauth_server.py      # OAuth authentication server
├── run.py               # MCP server runner
├── setup.py             # Initial setup script
├── config.py            # Configuration management
├── gmail_service.py     # Gmail API service
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
├── README.md           # This file
└── tests/              # Test and debug files
    ├── run_tests.py    # Test runner
    ├── test_oauth.py   # OAuth tests
    ├── debug_oauth.py  # OAuth debugger
    ├── manual_test.py  # Component tests
    ├── echo_test.py    # MCP communication tests
    └── README.md       # Test documentation
```

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
pip install -r requirements.txt
```

### **2. Setup Google OAuth**

```bash
python setup.py
```

### **3. Configure Environment**

Create a `.env` file with your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

### **4. Run the Servers**

**Option A: Run MCP server only (for MCP clients):**

```bash
python run.py
```

**Option B: Run OAuth server (for web authentication):**

```bash
python oauth_server.py
```

Then visit http://localhost:8000/auth

## 🧪 **Testing**

### **Run All Tests**

```bash
python tests/run_tests.py
```

### **Individual Tests**

```bash
# OAuth configuration
python tests/test_oauth.py

# OAuth status checker
python tests/check_oauth_status.py

# Component tests
python tests/manual_test.py

# MCP communication
python tests/echo_test.py

# OAuth debugging
python tests/debug_oauth.py
```

## 📧 **Features**

- **Gmail Authentication** via OAuth 2.0
- **Read Emails** from Gmail
- **Send Emails** via Gmail
- **Search Emails** with advanced queries
- **Manage Email Labels**
- **MCP Protocol** support for tool calls

## 🛠️ **MCP Tools**

The server provides these tools:

- `gmail_list_emails` - List emails from Gmail
- `gmail_read_email` - Read a specific email
- `gmail_send_email` - Send an email
- `gmail_search_emails` - Search emails
- `gmail_get_labels` - Get Gmail labels

## 🔧 **Configuration**

### **Environment Variables**

- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI` - OAuth redirect URI
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)

### **Google Cloud Console Setup**

1. Create a project in Google Cloud Console
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:8000/auth/callback`
5. Add test user: `sankar.jt68@gmail.com`

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Missing required parameter: redirect_uri"**

   - Add redirect URI in Google Cloud Console
   - Make sure it matches exactly: `http://localhost:8000/auth/callback`

2. **"Access blocked: Authorization Error"**

   - Add your email as a test user in OAuth consent screen
   - Make sure app is in "Testing" mode

3. **OAuth server not starting**
   - Check if port 8000 is available
   - Verify all dependencies are installed

### **Debug Tools**

- Use `python tests/debug_oauth.py` for OAuth issues
- Use `python tests/check_oauth_status.py` for status check
- Use `python tests/manual_test.py` for component testing

## 📚 **Documentation**

- **Setup Guide**: `tests/oauth_setup_guide.md`
- **Visual Guide**: `tests/oauth_visual_guide.md`
- **Test Documentation**: `tests/README.md`

## 🔒 **Security Notes**

- Store client secrets securely
- Never commit `.env` files to version control
- Use test users for development
- Implement proper token storage in production

## 🎯 **Next Steps**

1. **Test OAuth flow**: Visit http://localhost:8000/auth
2. **Test MCP server**: Use an MCP client to connect
3. **Test Gmail operations**: Try listing and sending emails
4. **Deploy to production**: Update configuration for production use
