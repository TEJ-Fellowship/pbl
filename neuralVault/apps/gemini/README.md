# 🤖 Gemini-Gmail Bridge (TypeScript)

A powerful TypeScript-based integration that connects Google's Gemini AI with Gmail through MCP (Model Context Protocol), enabling natural language email management.

## 🏗️ **Architecture**

```
User → Gemini (LLM) → TypeScript Bridge → MCP Client → MCP Server (Gmail) → Gmail API
```

### **Components:**

1. **TypeScript Bridge** - Handles Gemini API calls and function calling
2. **MCP Client** - Your existing Python Gmail MCP client
3. **MCP Server** - Your existing Python Gmail MCP server
4. **Function Schemas** - Gemini function definitions matching MCP client API

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
npm install
# or
yarn install
```

### **2. Build the Project**

```bash
npm run build
# or
yarn build
```

### **3. Set up Environment Variables**

```bash
cp .env.example .env
# Edit .env with your Gemini API key
```

### **4. Ensure MCP Server is Running**

```bash
cd ../mcp-server
python run.py
```

### **5. Run the Bridge**

```bash
npm start
# or
yarn start
```

## 📧 **Available Gmail Operations via Gemini**

### **Email Management**

- "Show me my recent emails"
- "List unread emails from Google"
- "Search for emails about meetings"
- "Read the latest email from John"

### **Email Actions**

- "Send an email to john@example.com about the meeting"
- "Reply to the last email"
- "Forward the email about project updates"

### **Email Analysis**

- "Summarize my inbox"
- "Find important emails from this week"
- "Show emails with attachments"

## 🛠️ **Function Schemas**

The bridge provides these Gemini functions:

1. **`list_emails`** - List emails with filtering
2. **`search_emails`** - Search emails with Gmail query syntax
3. **`read_email`** - Read a specific email
4. **`send_email`** - Send a new email
5. **`get_labels`** - Get Gmail labels

## 🎯 **Usage Examples**

### **Natural Language Commands**

```
User: "Show me my 5 most recent emails"
Gemini: Calls list_emails(maxResults=5, label="INBOX")

User: "Search for unread emails from Google"
Gemini: Calls search_emails(query="is:unread from:google.com")

User: "Send an email to john@example.com about the meeting tomorrow"
Gemini: Calls send_email(to="john@example.com", subject="Meeting Tomorrow", body="...")
```

## ✅ **Current Status**

The Gemini-Gmail Bridge is now **fully functional**!

- ✅ **TypeScript Bridge**: Successfully built and running
- ✅ **Python API**: Clean JSON responses without console interference
- ✅ **Gemini Integration**: Function calling working properly
- ✅ **MCP Communication**: Direct Gmail service integration
- ✅ **Interactive Mode**: Ready for natural language Gmail management

You can now use natural language commands like:

- "Show me my recent emails"
- "Search for unread emails"
- "Get my Gmail labels"
- "Read the latest email from John"

## 🔧 **Configuration**

### **Environment Variables**

- `GEMINI_API_KEY` - Your Gemini API key
- `GEMINI_MODEL` - Gemini model to use (default: gemini-1.5-pro)
- `GEMINI_MAX_TOKENS` - Maximum tokens for responses (default: 4096)
- `GEMINI_TEMPERATURE` - Response creativity (default: 0.7)
- `MCP_SERVER_URL` - MCP server URL (default: http://localhost:8000)
- `GMAIL_CREDENTIALS_PATH` - Path to Gmail credentials file
- `DEBUG` - Enable debug mode (default: false)
- `LOG_LEVEL` - Logging level (default: info)

### **Gemini Model Options**

- `gemini-1.5-pro` - Most capable model
- `gemini-1.5-flash` - Faster, more efficient
- `gemini-1.0-pro` - Legacy model

## 📁 **Project Structure**

```
apps/gemini/
├── src/
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── config/
│   │   └── index.ts              # Configuration management
│   ├── schemas/
│   │   └── functionSchemas.ts    # Gemini function definitions
│   ├── services/
│   │   ├── geminiService.ts      # Gemini API service
│   │   └── mcpService.ts         # MCP client adapter
│   └── index.ts                  # Main application entry point
├── dist/                         # Compiled JavaScript output
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## 🧪 **Testing**

### **Test the Bridge**

```bash
npm run test
# or
yarn test
```

### **Test Individual Components**

```bash
npm run dev
# Then use the test command in the CLI
```

## 🔒 **Security**

- API keys are stored in environment variables
- OAuth credentials are managed by MCP server
- No sensitive data is logged
- All communications are encrypted

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"Gemini API key not found"**
   - Set GEMINI_API_KEY in .env file

2. **"MCP server not responding"**
   - Ensure MCP server is running
   - Check server URL in configuration

3. **"OAuth authentication required"**
   - Complete OAuth setup in MCP server first

4. **"Python not found"**
   - Ensure Python is installed and in PATH
   - Try using `python3` or `py` instead

## 📋 **Development Commands**

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Watch for changes
npm run watch
```

## 🎯 **CLI Commands**

```bash
# Start interactive mode
npm start

# Test connections
npm run test

# Show help
npm start -- --help
```

## 🔄 **Integration with Existing MCP System**

The TypeScript bridge integrates seamlessly with your existing Python MCP client:

1. **No Changes Required** - Your existing MCP client and server remain unchanged
2. **Bridge Communication** - TypeScript bridge communicates with Python MCP client via subprocess
3. **Function Mapping** - Gemini functions map directly to MCP client methods
4. **Error Handling** - Comprehensive error handling across the entire stack

## 🎉 **Ready to Use!**

Your TypeScript Gemini-Gmail bridge is now ready to handle natural language email management with full type safety and modern JavaScript/TypeScript features!
