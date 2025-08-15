# Gmail MCP Client

A powerful command-line client for interacting with Gmail through the MCP (Model Context Protocol) server.

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
pip install -r requirements.txt
```

### **2. Ensure OAuth Authentication**
Make sure your MCP server is authenticated:
```bash
cd ../mcp-server
python complete_oauth.py
```

### **3. Run the Client**
```bash
# Interactive mode (recommended)
python gmail_cli.py interactive

# Or run a demo
python gmail_cli.py demo
```

## 📧 **Available Gmail Operations**

### **1. List Emails**
```bash
# List recent emails from INBOX
python gmail_cli.py list-emails

# List 5 emails from SENT folder
python gmail_cli.py list-emails --max-results 5 --label SENT
```

### **2. Search Emails**
```bash
# Search for unread emails
python gmail_cli.py search "is:unread"

# Search emails from specific domain
python gmail_cli.py search "from:google.com" --max-results 5

# Search important emails
python gmail_cli.py search "is:important"
```

### **3. Read Email**
```bash
# Read a specific email by ID
python gmail_cli.py read 18c1234567890abcdef
```

### **4. Send Email**
```bash
# Send an email (will prompt for details)
python gmail_cli.py send
```

### **5. Get Labels**
```bash
# Get all Gmail labels
python gmail_cli.py labels
```

## 🎯 **Interactive Mode**

Start interactive mode for the best experience:
```bash
python gmail_cli.py interactive
```

### **Interactive Commands:**
- `labels` - Get all Gmail labels
- `list [max] [label]` - List emails (default: 10 from INBOX)
- `search <query> [max]` - Search emails
- `read <email_id>` - Read a specific email
- `send <to> <subject> <body>` - Send an email
- `help` - Show available commands
- `quit` - Exit

### **Examples:**
```
gmail> list 5
gmail> list 10 SENT
gmail> search "is:unread" 5
gmail> search "from:google.com"
gmail> read 18c1234567890abcdef
gmail> send user@example.com "Test" "Hello world"
```

## 🔍 **Gmail Search Queries**

### **Common Search Operators:**
- `is:unread` - Unread emails
- `is:read` - Read emails
- `is:important` - Important emails
- `is:starred` - Starred emails
- `from:domain.com` - Emails from specific domain
- `to:email@domain.com` - Emails sent to specific address
- `subject:"keyword"` - Emails with subject containing keyword
- `after:2024/01/01` - Emails after specific date
- `before:2024/12/31` - Emails before specific date
- `has:attachment` - Emails with attachments
- `larger:10M` - Emails larger than 10MB

### **Combined Queries:**
- `is:unread from:google.com` - Unread emails from Google
- `is:important after:2024/01/01` - Important emails after Jan 1, 2024
- `subject:"meeting" has:attachment` - Meeting emails with attachments

## 📁 **Gmail Labels**

### **System Labels:**
- `INBOX` - Main inbox
- `SENT` - Sent emails
- `DRAFT` - Draft emails
- `SPAM` - Spam folder
- `TRASH` - Trash folder
- `IMPORTANT` - Important emails
- `STARRED` - Starred emails

### **Custom Labels:**
You can also use any custom labels you've created in Gmail.

## 🛠️ **Programmatic Usage**

You can also use the client programmatically:

```python
import asyncio
from gmail_client import GmailMCPClient

async def main():
    client = GmailMCPClient()
    
    if await client.start_server():
        # List recent emails
        emails = await client.list_emails(max_results=5)
        
        # Search for unread emails
        unread = await client.search_emails("is:unread", max_results=3)
        
        # Read a specific email
        if emails:
            email_details = await client.read_email(emails[0]['id'])
        
        # Send an email
        success = await client.send_email(
            to="user@example.com",
            subject="Test Email",
            body="Hello from MCP client!"
        )
        
        await client.shutdown()

asyncio.run(main())
```

## 🔧 **Troubleshooting**

### **Authentication Issues:**
1. Make sure OAuth server is running: `cd ../mcp-server && python oauth_server.py`
2. Complete authentication: `python complete_oauth.py`
3. Check credentials file exists: `ls credentials.json`

### **Connection Issues:**
1. Ensure MCP server is running: `cd ../mcp-server && python run.py`
2. Check server path in client configuration
3. Verify all dependencies are installed

### **Gmail API Errors:**
1. Check Gmail API is enabled in Google Cloud Console
2. Verify OAuth scopes include Gmail permissions
3. Ensure your email is added as a test user

## 📊 **Features**

- ✅ **Rich UI** - Beautiful tables and panels with Rich library
- ✅ **Interactive Mode** - Command-line interface for easy use
- ✅ **All Gmail Operations** - List, search, read, send emails
- ✅ **Gmail Labels** - Access to all labels and folders
- ✅ **Advanced Search** - Full Gmail search query support
- ✅ **Error Handling** - Comprehensive error messages
- ✅ **Async Operations** - Fast and responsive

## 🎉 **Ready to Use!**

Your Gmail MCP client is now ready to help you manage your emails efficiently!
