# Visual Guide: Adding Test User to OAuth Consent Screen

## 🎯 **Step-by-Step Visual Guide**

### **Step 1: Access Google Cloud Console**

1. Open your browser
2. Go to: https://console.cloud.google.com/
3. **Make sure you're signed in with the Google account that owns the project**

### **Step 2: Select Your Project**

1. In the top navigation bar, click on the **project dropdown**
2. Select your project (the one with your OAuth credentials)

### **Step 3: Navigate to OAuth Consent Screen**

1. In the left sidebar, click **"APIs & Services"**
2. Click **"OAuth consent screen"**

### **Step 4: Add Test User**

1. **Scroll down** to find the **"Test users"** section
2. Click the **"ADD USERS"** button
3. In the popup dialog that appears:
   - **Email address**: Enter `sankar.jt68@gmail.com`
   - Click **"ADD"**
4. Click **"SAVE"** at the bottom of the page

### **Step 5: Verify Test User Addition**

You should now see `sankar.jt68@gmail.com` listed in the "Test users" section.

## 🔍 **Alternative Method: If You Don't See "Test users" Section**

If you don't see the "Test users" section, it might be because:

1. **Your app is in "Production" mode** instead of "Testing" mode
2. **You need to publish the app first**

### **To Fix This:**

1. In the OAuth consent screen, look for **"Publishing status"**
2. If it says "In production", click **"BACK TO TESTING"**
3. This will make the "Test users" section visible

## 🚨 **Important Notes**

- **Only test users can access your app** when it's in testing mode
- **You must use the exact email**: `sankar.jt68@gmail.com`
- **The email must be a Google account**
- **You can add up to 100 test users**

## 🔧 **After Adding Test User**

1. **Save the changes**
2. **Wait a few minutes** for changes to propagate
3. **Try the OAuth flow again**:
   - Go to: http://localhost:8000/auth
   - You should now be able to proceed with authentication

## 📞 **If Still Having Issues**

If you're still getting the "Missing required parameter: redirect_uri" error after adding the test user:

1. **Double-check the redirect URI** in "Credentials" section
2. **Make sure it exactly matches**: `http://localhost:8000/auth/callback`
3. **Check that Gmail API is enabled**
4. **Verify all scopes are added** to the OAuth consent screen

## 🎯 **Quick Checklist**

- [ ] Added `sankar.jt68@gmail.com` as test user
- [ ] App is in "Testing" mode (not "Production")
- [ ] Redirect URI `http://localhost:8000/auth/callback` is configured
- [ ] Gmail API is enabled
- [ ] Gmail scopes are added
- [ ] Saved all changes
