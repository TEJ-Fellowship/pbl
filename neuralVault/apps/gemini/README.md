# 🤖 Gemini-Gmail Bridge (TypeScript)

A powerful TypeScript-based integration that connects Google's Gemini AI with Gmail through MCP (Model Context Protocol), enabling natural language email management.

## 🏗️ **System Architecture**

```
User Input (Natural Language)
    ↓
Gemini AI (Processes & Understands)
    ↓
TypeScript Bridge (Function Calling)
    ↓
MCP Client (Python Gmail API)
    ↓
Gmail Account
```

### **Components:**

1. **TypeScript Bridge** - Handles Gemini API calls and function calling
2. **MCP Client** - Python Gmail client with OAuth authentication
3. **MCP Server** - Python OAuth server for Gmail authentication
4. **Function Schemas** - Gemini function definitions matching MCP client API

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
npm install
```

### **2. Build the Project**

```bash
npm run build
```

### **3. Set up Environment Variables**

Create a `.env` file with your configuration:

```env
# Gemini API Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=4096
GEMINI_TEMPERATURE=0.7

# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8000

# Application Configuration
DEBUG=false
LOG_LEVEL=info

# Gmail Authentication - Using credentials file
GMAIL_CREDENTIALS_PATH=./credentials.json

# OAuth credentials (backup method)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

### **4. Set up Gmail Authentication**

#### **Option A: Use Existing Credentials (Recommended)**

```bash
# Copy credentials from MCP server
cp ../mcp-server/credentials.json .
```

#### **Option B: Complete OAuth Setup**

```bash
# Start OAuth server
cd ../mcp-server
python oauth_server.py

# Complete OAuth in browser
# Visit: http://localhost:8000/auth

# OR use the helper script
python complete_oauth.py
```

**Note**: Only OAuth authentication is needed. No need to run `run.py` for Gemini app integration.

### **5. Run the Bridge**

```bash
# Start interactive mode
npm start

# Or test connections
npm start -- test
```

## 📧 **Available Gmail Operations via Gemini**

### **Email Management**

- ✅ "Show me my recent emails"
- ✅ "List 5 emails from my inbox"
- ✅ "Get emails from SENT folder"
- ✅ "Display unread emails"

### **Email Search**

- ✅ "Search for emails with TEJ"
- ✅ "Find emails from Google"
- ✅ "Show emails about meetings"
- ✅ "Search for important emails"

### **Email Actions**

- ✅ "Read the latest email from John"
- ✅ "Send an email to sarah@example.com about the meeting"
- ✅ "Compose an email to the team about project updates"

### **Email Management & Organization** 🆕

- ✅ "Mark all unread emails from John as read"
- ✅ "Star the latest 5 important emails"
- ✅ "Move all emails about meetings to the 'Work' label"
- ✅ "Mark email 198e18af09f54660 as unread"

### **Email Communication** 🆕

- ✅ "Reply to the latest email from Sarah with 'Thanks, I'll get back to you soon'"
- ✅ "Forward the email about the project to john@example.com"
- ✅ "Reply to email 198e18af09f54660 without including the original"

### **Email Attachments** 🆕

- ✅ "Show me attachments for email 198e18af09f54660"
- ✅ "Get attachment details for the latest email"

### **Email Analysis**

- ✅ "Summarize my inbox"
- ✅ "Show emails from yesterday"
- ✅ "Find emails larger than 10MB"

## 🛠️ **Function Schemas**

The bridge provides these Gemini functions:

### **Core Email Operations**

1. **`list_emails`** - List emails with filtering
   - Parameters: `maxResults`, `label`
   - Example: "Show me 5 emails from INBOX"

2. **`search_emails`** - Search emails with Gmail query syntax
   - Parameters: `query`, `maxResults`
   - Example: "Search for unread emails from Google"

3. **`read_email`** - Read a specific email
   - Parameters: `emailId`
   - Example: "Read email 198e18af09f54660"

4. **`send_email`** - Send a new email
   - Parameters: `to`, `subject`, `body`, `cc`, `bcc`
   - Example: "Send email to john@example.com"

5. **`get_labels`** - Get Gmail labels
   - Example: "Show all my Gmail labels"

### **Email Management & Organization** 🆕

6. **`mark_as_read`** - Mark emails as read/unread
   - Parameters: `emailIds` (array), `read` (boolean)
   - Example: "Mark emails 198e18af09f54660,198e124f5fae7a87 as read"

7. **`star_emails`** - Star/unstar emails
   - Parameters: `emailIds` (array), `starred` (boolean)
   - Example: "Star the latest 3 emails"

8. **`move_to_label`** - Move emails to a specific label
   - Parameters: `emailIds` (array), `label` (string)
   - Example: "Move emails to the 'Work' label"

### **Email Communication** 🆕

9. **`reply_to_email`** - Reply to a specific email
   - Parameters: `emailId`, `body`, `includeOriginal` (optional)
   - Example: "Reply to email 198e18af09f54660 with 'Thanks for the update'"

10. **`forward_email`** - Forward an email to new recipients
    - Parameters: `emailId`, `to`, `message` (optional)
    - Example: "Forward email 198e18af09f54660 to john@example.com"

### **Email Attachments** 🆕

11. **`get_attachments`** - Get attachment information for an email
    - Parameters: `emailId`
    - Example: "Show attachments for email 198e18af09f54660"

## 🎯 **Usage Examples**

### **Natural Language Commands**

```
User: "get latest 5 emails"
Gemini: Calls list_emails(maxResults=5, label="INBOX")
Result: Shows 5 most recent emails with details

User: "search any one latest emails with word TEJ"
Gemini: Calls search_emails(query="TEJ", maxResults=10)
Result: Finds 10 emails containing "TEJ"

User: "read email 198e18af09f54660"
Gemini: Calls read_email(emailId="198e18af09f54660")
Result: Shows full email content
```

### **Gmail Search Syntax**

- `is:unread` - Unread emails
- `from:domain.com` - Emails from specific domain
- `subject:keyword` - Emails with subject containing keyword
- `has:attachment` - Emails with attachments
- `after:2024/01/01` - Emails after specific date
- `larger:10M` - Emails larger than 10MB

## 🔧 **Available Commands**

```bash
# Start interactive mode
npm start

# Test connections
npm start -- test

# Show help
npm start -- --help

# Build project
npm run build

# Development mode
npm run dev
```

## 📁 **Project Structure**

```
neuralVault/apps/gemini/
├── src/
│   ├── config/          # Configuration management
│   ├── services/        # Gemini and MCP services
│   ├── schemas/         # Function schemas
│   ├── types/           # TypeScript type definitions
│   └── index.ts         # Main application entry
├── dist/                # Compiled JavaScript (auto-generated)
├── .env                 # Environment variables
├── credentials.json     # Gmail OAuth credentials
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🎉 **Success Features**

### **✅ Working Integrations**

- **Gemini AI**: Natural language processing and function calling
- **Gmail API**: Full email management capabilities
- **OAuth Authentication**: Secure Gmail access
- **MCP Protocol**: Seamless TypeScript-Python bridge
- **Real-time Email Operations**: List, search, read, send emails

### **✅ Tested Commands**

- ✅ "get latest 5 emails" → Successfully lists 5 emails
- ✅ "search any one latest emails with word TEJ" → Finds TEJ-related emails
- ✅ "get-labels" → Retrieves all Gmail labels
- ✅ "list-emails 3" → Lists 3 emails from inbox
- ✅ "search-emails is:unread 2" → Finds 2 unread emails

### **✅ New Phase 1 Features Tested** 🆕

- ✅ "mark-as-read emailId1,emailId2 true" → Marks emails as read
- ✅ "star-emails emailId1,emailId2 true" → Stars emails
- ✅ "move-to-label emailId1,emailId2 Work" → Moves emails to label
- ✅ "reply-to-email emailId message" → Replies to email
- ✅ "forward-email emailId recipient@example.com" → Forwards email
- ✅ "get-attachments emailId" → Gets attachment information

## 🔒 **Security & Authentication**

- **OAuth 2.0**: Secure Gmail authentication
- **API Key Management**: Secure Gemini API access
- **Environment Variables**: Secure configuration storage
- **Token Refresh**: Automatic OAuth token renewal

## 🚨 **Troubleshooting**

### **"Configuration validation failed"**

- Ensure `.env` file exists with required variables
- Check that `credentials.json` is present
- Verify Gemini API key is valid

### **"MCP client not found"**

- Ensure MCP client is properly set up in `../mcp-client/`
- Check that `gmail_wrapper.py` exists
- **Note**: Only the MCP client is needed, not the MCP server (`run.py`)

### **"Authentication required"**

- Complete OAuth setup: `python ../mcp-server/oauth_server.py`
- Copy credentials: `cp ../mcp-server/credentials.json .`

### **"Python not found"**

- Ensure Python is installed and in PATH
- Try: `python --version` to verify installation

## 🎯 **Current Status**

**✅ FULLY OPERATIONAL**

- ✅ Gemini AI integration working
- ✅ Gmail API access functional
- ✅ Natural language processing active
- ✅ Email operations successful
- ✅ OAuth authentication complete
- ✅ MCP bridge operational

## 📞 **Support**

For issues or questions:

1. Check the troubleshooting section above
2. Verify all dependencies are installed
3. Ensure environment variables are set correctly
4. Test with simple commands first

---

**🎉 Your Gemini-Gmail Bridge is ready for natural language email management!**
