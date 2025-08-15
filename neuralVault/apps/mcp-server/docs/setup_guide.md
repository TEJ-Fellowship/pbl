# MCP Gmail Server Setup Guide

This guide will walk you through setting up the MCP Gmail Server step by step.

## Prerequisites

- Python 3.8 or higher
- A Google account
- Access to Google Cloud Console

## Step 1: Set Up Google Cloud Project

1. **Go to Google Cloud Console**

   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**

   - Click on the project dropdown at the top
   - Click "New Project"
   - Give it a name (e.g., "MCP Gmail Server")
   - Click "Create"

3. **Enable Gmail API**

   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click on "Gmail API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" user type
     - Fill in required fields (App name, User support email, Developer contact)
     - Add scopes: `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/gmail.modify`
     - Add test users (your email)
   - For application type, choose "Desktop application"
   - Give it a name (e.g., "MCP Gmail Server")
   - Click "Create"
   - **Save the Client ID and Client Secret** - you'll need these for the next step

## Step 2: Configure the MCP Server

1. **Install Dependencies**

   ```bash
   cd apps/mcp-server
   pip install -r requirements.txt
   ```

2. **Create Environment File**

   ```bash
   cp env.example .env
   ```

3. **Edit the .env file**
   ```env
   GOOGLE_CLIENT_ID=your_client_id_from_step_1
   GOOGLE_CLIENT_SECRET=your_client_secret_from_step_1
   GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
   ```

## Step 3: Run the MCP Server

1. **Start the server**

   ```bash
   python run.py
   ```

2. **Authenticate with Gmail**
   - Open your browser and go to `http://localhost:8000/auth`
   - Sign in with your Google account
   - Grant the requested permissions
   - You should see "Authentication successful!"

## Step 4: Test the Integration

The MCP server provides the following tools:

### List Emails

```json
{
  "name": "gmail_list_emails",
  "arguments": {
    "max_results": 5,
    "label": "INBOX"
  }
}
```

### Read Email

```json
{
  "name": "gmail_read_email",
  "arguments": {
    "email_id": "message_id_here"
  }
}
```

### Send Email

```json
{
  "name": "gmail_send_email",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Test Email",
    "body": "This is a test email sent via MCP server"
  }
}
```

### Search Emails

```json
{
  "name": "gmail_search_emails",
  "arguments": {
    "query": "from:important@example.com",
    "max_results": 10
  }
}
```

### Get Labels

```json
{
  "name": "gmail_get_labels",
  "arguments": {}
}
```

## Troubleshooting

### Common Issues

1. **"Not authenticated" error**

   - Make sure you've completed the OAuth flow
   - Visit `http://localhost:8000/auth` to authenticate

2. **"Missing required configuration" error**

   - Check that your `.env` file exists and has the correct values
   - Verify your Google Client ID and Secret are correct

3. **Gmail API errors**

   - Ensure Gmail API is enabled in your Google Cloud project
   - Check that your OAuth consent screen is configured properly
   - Verify you're using the correct scopes

4. **Port already in use**
   - Change the port in your `.env` file
   - Or stop any other services using port 8000

### Gmail Search Queries

You can use Gmail's search operators:

- `from:email@example.com` - emails from specific sender
- `to:email@example.com` - emails to specific recipient
- `subject:keyword` - emails with keyword in subject
- `has:attachment` - emails with attachments
- `is:unread` - unread emails
- `after:2024/01/01` - emails after specific date

## Security Notes

- Never commit your `.env` file to version control
- Keep your Google Client Secret secure
- Consider using environment variables in production
- Regularly rotate your OAuth credentials

## Next Steps

Once your MCP server is running, you can:

- Integrate it with MCP clients
- Add more Gmail functionality
- Implement persistent credential storage
- Add rate limiting and error handling
- Deploy to production with proper security measures
