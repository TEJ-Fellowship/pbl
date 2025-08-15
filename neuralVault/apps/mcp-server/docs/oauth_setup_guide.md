# OAuth Setup Guide - Fixing "Missing required parameter: redirect_uri"

## 🔧 **The Problem**

You're getting this error:

```
Access blocked: Authorization Error
Missing required parameter: redirect_uri
Error 400: invalid_request
```

This means Google OAuth can't find the redirect URI that matches your configuration.

## 🛠️ **Solution Steps**

### **Step 1: Fix Google Cloud Console OAuth Settings**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (the one with your OAuth credentials)
3. **Navigate to "APIs & Services" > "Credentials"**
4. **Find your OAuth 2.0 Client ID** and click on it
5. **In the "Authorized redirect URIs" section, add:**
   ```
   http://localhost:8000/auth/callback
   ```
6. **Click "Save"**

### **Step 2: Fix OAuth Consent Screen**

1. **Go to "APIs & Services" > "OAuth consent screen"**
2. **Add your email as a test user:**
   - Click "Add Users"
   - Add: `sankar.jt68@gmail.com`
   - Click "Add"
3. **Make sure Gmail scopes are added:**
   - Click "Add or Remove Scopes"
   - Search for and add:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Click "Update"

### **Step 3: Enable Gmail API**

1. **Go to "APIs & Services" > "Library"**
2. **Search for "Gmail API"**
3. **Click on "Gmail API"**
4. **Click "Enable"** (if not already enabled)

### **Step 4: Test the Configuration**

Run the test script:

```bash
python test_oauth.py
```

### **Step 5: Start the OAuth Server**

```bash
python oauth_server.py
```

### **Step 6: Test the OAuth Flow**

1. **Open your browser**
2. **Go to**: http://localhost:8000/auth
3. **You should be redirected to Google's OAuth page**
4. **Sign in with your Google account**
5. **Grant the requested permissions**
6. **You should be redirected back to your server**

## 🔍 **Common Issues and Solutions**

### **Issue 1: "redirect_uri_mismatch"**

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:

```
http://localhost:8000/auth/callback
```

### **Issue 2: "access_denied"**

**Solution**: Add your email as a test user in the OAuth consent screen.

### **Issue 3: "invalid_client"**

**Solution**: Check that your Client ID and Client Secret are correct in the `.env` file.

### **Issue 4: "scope_not_allowed"**

**Solution**: Make sure the Gmail scopes are added to your OAuth consent screen.

## 📋 **Verification Checklist**

- [ ] Redirect URI `http://localhost:8000/auth/callback` is added to Google Cloud Console
- [ ] Your email `sankar.jt68@gmail.com` is added as a test user
- [ ] Gmail API is enabled
- [ ] Gmail scopes are added to OAuth consent screen
- [ ] Client ID and Secret are correct in `.env` file
- [ ] OAuth server is running on port 8000

## 🚀 **After OAuth is Working**

Once OAuth is working, you can:

1. **Use the MCP server with authenticated Gmail access**
2. **Test Gmail operations** like listing emails, sending emails, etc.
3. **Integrate with MCP clients** that can use your Gmail tools

## 📞 **Need Help?**

If you're still having issues:

1. **Check the Google Cloud Console error logs**
2. **Verify all settings match exactly**
3. **Try creating a new OAuth 2.0 Client ID**
4. **Make sure you're using the correct Google account**
