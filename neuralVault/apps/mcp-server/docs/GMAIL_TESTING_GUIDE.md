# Gmail Operations Testing Guide

This guide will help you test all Gmail operations including fetching emails, sending emails, searching, and managing labels.

## 🚀 **Step-by-Step Testing Process**

### **Step 1: Start OAuth Server**

```bash
cd apps/mcp-server
python oauth_server.py
```

### **Step 2: Complete OAuth Authentication**

1. Open your browser and visit: `http://localhost:8000/auth`
2. You'll be redirected to Google's OAuth consent page
3. Click "Allow" to grant Gmail access
4. You'll be redirected back to `http://localhost:8000/auth/callback`
5. You should see: `"Authentication successful!"`

### **Step 3: Test Gmail Operations**

#### **Option A: Quick Automated Test (Recommended)**

```bash
python tests/quick_gmail_test.py
```

This will test:

- ✅ Gmail Labels (getting all labels)
- ✅ Email Listing (fetching recent emails)
- ✅ Email Search (searching for unread emails)
- ✅ Email Reading (reading a specific email)

#### **Option B: Comprehensive Test with Email Sending**

```bash
python tests/test_gmail_operations.py
```

This includes all tests from Option A plus:

- ✅ Email Sending (sends a test email to your address)

## 📧 **What Each Test Does**

### **1. Gmail Labels Test**

- Fetches all Gmail labels (INBOX, SENT, DRAFT, etc.)
- Shows label types (system, user, etc.)
- Verifies Gmail API connectivity

### **2. Email Listing Test**

- Fetches recent emails from your inbox
- Shows email subject, sender, date, and snippet
- Tests basic email retrieval

### **3. Email Search Test**

- Searches for specific emails (unread, important, etc.)
- Tests Gmail's search functionality
- Shows search results

### **4. Email Reading Test**

- Reads the full content of a specific email
- Extracts email body and metadata
- Tests detailed email retrieval

### **5. Email Sending Test** (Comprehensive test only)

- Sends a test email to your address
- Verifies email composition and sending
- Tests Gmail's send functionality

## 🔍 **Expected Results**

### **Successful Test Output:**

```
Quick Gmail Operations Test
========================================
Authentication: Valid (expires: 2025-08-14 10:30:16+00:00)

1. Testing Gmail Labels...
   SUCCESS: Found 15 labels

2. Testing Email Listing...
   SUCCESS: Found 3 recent emails
   Sample: Welcome to Gmail

3. Testing Email Search...
   SUCCESS: Found 2 unread emails

4. Testing Email Reading...
   SUCCESS: Read email 'Welcome to Gmail'

========================================
All Gmail operations working correctly!
```

### **Common Issues and Solutions:**

#### **Issue: "No valid credentials found"**

**Solution:**

1. Make sure OAuth server is running: `python oauth_server.py`
2. Visit `http://localhost:8000/auth` and complete authentication
3. Check that you see "Authentication successful!" message

#### **Issue: "Gmail API error: 403 Forbidden"**

**Solution:**

1. Check that Gmail API is enabled in Google Cloud Console
2. Verify OAuth scopes include Gmail permissions
3. Make sure your email is added as a test user

#### **Issue: "Token expired"**

**Solution:**

1. Re-authenticate by visiting `http://localhost:8000/auth`
2. The refresh token should automatically renew access

## 🎯 **Testing Different Gmail Operations**

### **Test Email Search with Different Queries:**

```python
# In the test script, you can modify search queries:
gmail_service.search_emails("is:unread")           # Unread emails
gmail_service.search_emails("is:important")        # Important emails
gmail_service.search_emails("from:google.com")     # Emails from specific domain
gmail_service.search_emails("subject:test")        # Emails with subject containing "test"
gmail_service.search_emails("after:2024/01/01")    # Emails after specific date
```

### **Test Different Labels:**

```python
# List emails from different labels:
gmail_service.list_emails(label="SENT")            # Sent emails
gmail_service.list_emails(label="DRAFT")           # Draft emails
gmail_service.list_emails(label="SPAM")            # Spam emails
gmail_service.list_emails(label="TRASH")           # Trash emails
```

## 🚀 **Next Steps After Successful Testing**

1. **Start MCP Server**: `python run.py`
2. **Use with MCP Clients**: Connect your MCP client to use Gmail tools
3. **Production Deployment**: Update configuration for production use

## 📊 **Test Results Interpretation**

- ✅ **All tests pass**: Your MCP Gmail server is fully functional
- ⚠️ **Some tests fail**: Check the specific error messages
- ❌ **Authentication fails**: Re-run OAuth flow
- 🔄 **Token expired**: Re-authenticate to get fresh tokens

## 🔧 **Troubleshooting**

### **If tests fail:**

1. Check OAuth server is running
2. Verify authentication was completed
3. Check Google Cloud Console settings
4. Ensure Gmail API is enabled
5. Verify your email is a test user

### **If you need to re-authenticate:**

1. Stop the OAuth server (Ctrl+C)
2. Restart: `python oauth_server.py`
3. Visit `http://localhost:8000/auth`
4. Complete the OAuth flow again

---

**Your MCP Gmail server is ready for production use once all tests pass!** 🎉
