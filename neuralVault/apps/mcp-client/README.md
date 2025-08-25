# Gmail Client Setup Guide

This Gmail client now uses the MCP server's OAuth flow for authentication, which is more reliable and secure.

## Prerequisites

1. **Google OAuth 2.0 Credentials**: You need to create OAuth 2.0 credentials in Google Cloud Console
2. **Python Dependencies**: Install required packages

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: **Desktop application**
   - Add redirect URIs:
     - `http://localhost:8000/auth/callback`
     - `http://localhost`
     - `urn:ietf:wg:oauth:2.0:oob`

### 3. Set Environment Variables

Create a `.env` file in the `mcp-server` directory:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
```

### 4. Complete OAuth Authentication

#### Option A: Use the OAuth Helper (Recommended)

```bash
# Start the OAuth server
cd ../mcp-server
python oauth_server.py

# In another terminal, complete OAuth
python complete_oauth.py
```

#### Option B: Manual OAuth

1. Start the OAuth server:

   ```bash
   cd ../mcp-server
   python oauth_server.py
   ```

2. Visit `http://localhost:8000/auth` in your browser
3. Complete the Google OAuth flow
4. You should see "Authentication successful!"

### 5. Test the Gmail Client

Once OAuth is complete, test the client:

```bash
# Get Gmail labels
python gmail_wrapper.py get-labels

# List emails
python gmail_wrapper.py list-emails

# Search emails
python gmail_wrapper.py search-emails "important"

# Read specific email
python gmail_wrapper.py read-email <email_id>
```

## How It Works

1. **OAuth Server**: The MCP server runs an OAuth server on `http://localhost:8000`
2. **Web-based Flow**: Uses a web-based OAuth flow instead of out-of-band flow
3. **Credential Sharing**: Credentials are saved to `credentials.json` and shared between processes
4. **Automatic Refresh**: Tokens are automatically refreshed when needed

## Troubleshooting

### "No valid credentials found"

- Make sure you've completed the OAuth flow
- Check that the OAuth server is running
- Verify your `.env` file has correct credentials

### "redirect_uri_mismatch"

- Ensure your Google OAuth client has the correct redirect URIs
- Make sure the application type is set to "Desktop application"

### "MCP OAuth server not accessible"

- Start the OAuth server: `python ../mcp-server/oauth_server.py`
- Check that it's running on port 8000

## File Structure

```
mcp-client/
├── gmail_client_simple.py    # Main Gmail client
├── gmail_wrapper.py          # Command-line wrapper
├── requirements.txt          # Python dependencies
└── README.md                # This file

mcp-server/
├── oauth_server.py          # OAuth server
├── complete_oauth.py        # OAuth helper
├── gmail_service.py         # Gmail service
├── config.py               # Configuration
└── credentials.json        # Saved credentials (after OAuth)
```
