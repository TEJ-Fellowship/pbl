# 🎭 Anonymous User Support Documentation

## Overview

This system now supports **anonymous (guest) users** who can access the chat functionality without creating an account. Anonymous users can send messages, have conversations, and later convert to full accounts while preserving their chat history.

---

## 🎯 Key Features

### For Anonymous Users:

- ✅ **Instant Access** - Start chatting immediately without signup
- ✅ **Temporary Identity** - Automatic UUID generated for session tracking
- ✅ **Limited Messages** - First 5 messages are free
- ✅ **Session Persistence** - Chat history saved in browser localStorage
- ✅ **Easy Conversion** - Simple signup process to save progress permanently

### For Authenticated Users:

- ✅ **Unlimited Messages** - No message limits
- ✅ **Persistent Storage** - Chat history saved to database
- ✅ **Cross-Device Access** - Access from anywhere
- ✅ **Full Features** - Access to dashboard, customers, knowledge base

---

## 🏗️ Architecture

### Frontend Flow

```
┌─────────────────┐
│  User Visits    │
│   Website       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthContext    │
│  Initializes    │
└────────┬────────┘
         │
         ├──── Has Token? ───► Yes ──► Verify Token ──► Load User
         │                                  │
         │                                  ▼
         └──── No Token? ───────────► Invalid/No Token
                                           │
                                           ▼
                                   Generate Anonymous UUID
                                           │
                                           ▼
                                   Create Guest User
                                           │
                                           ▼
                                   Track Message Count
```

### Backend Flow

```
┌──────────────────┐
│  API Request     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ optionalAuth     │
│  Middleware      │
└────────┬─────────┘
         │
         ├──── Has Token? ───► Yes ──► Verify JWT ──► Set req.userId
         │                                               req.isAnonymous = false
         │
         └──── No Token? ────► Set req.isAnonymous = true
                                   req.userId = null
                                           │
                                           ▼
                                   requireUserId Middleware
                                           │
                                           ▼
                            Check for userId in body/query/params
                                           │
                                           ▼
                                  Continue with Request
```

---

## 📁 File Changes

### Frontend

#### 1. **`Frontend/src/context/AuthContext.jsx`**

**New State:**

- `isAnonymous` - Boolean flag for anonymous users
- `messageCount` - Tracks messages sent by anonymous users
- `showSignupPrompt` - Controls signup prompt visibility

**New Functions:**

- `generateAnonymousUser()` - Creates temporary UUID for guest
- `incrementMessageCount()` - Tracks messages, shows prompt at 5
- `clearAnonymousData()` - Cleans up anonymous user data
- `dismissSignupPrompt()` - Hides signup prompt

**Updated Functions:**

- `register()` - Now accepts `anonymousUserId` for session migration
- `login()` - Clears anonymous data after successful login
- `logout()` - Creates new anonymous user instead of null state

#### 2. **`Frontend/src/components/SignupPrompt.jsx`** (NEW)

Beautiful modal that appears after 5 messages:

- Encourages signup with benefits list
- "Sign Up Free" button (navigates to `/signup`)
- "Continue as Guest" button (dismisses modal)
- Professional, non-intrusive design

#### 3. **`Frontend/src/Routes.jsx`**

**Changes:**

- Added `AppWrapper` component to show `SignupPrompt` globally
- Chat routes (`/chat`, `/integrated-chat`) no longer protected
- Dashboard, Customers, Knowledge remain protected
- Anonymous users can chat but can't access admin features

#### 4. **`Frontend/src/hooks/useChat.js` & `useIntegratedChat.js`**

**Changes:**

- Import `incrementMessageCount` from `useAuth`
- Call `incrementMessageCount()` after successful message send
- Works for both anonymous and authenticated users

### Backend

#### 5. **`Backend/middleware/optionalAuth.js`** (NEW)

Two middleware functions:

**`optionalAuth`:**

- Checks for JWT token
- If valid → sets `req.userId`, `req.isAnonymous = false`
- If missing/invalid → sets `req.isAnonymous = true`, `req.userId = null`
- Never blocks requests

**`requireUserId`:**

- Ensures userId exists (from auth or body/query/params)
- Returns 400 error if no userId found
- Used for endpoints that need user context

#### 6. **`Backend/routes/chat.js` & `Backend/routes/integratedChat.js`**

**Changes:**

- Apply `optionalAuth` middleware to all routes
- Add `requireUserId` to routes that need user context
- Allow anonymous users to chat, create sessions
- Both standard chat and integrated chat support anonymous users

#### 7. **`Backend/controllers/authController.js`**

**Updated `register()` function:**

- Accepts `anonymousUserId` in request body
- Migrates conversation sessions from anonymous user to new account
- Returns `migrated: true` and `migratedSessions` count
- Uses database transactions for safety

---

## 🔄 Anonymous to Authenticated Migration

### How It Works:

1. **Anonymous User Chats:**

   - UUID: `123e4567-e89b-12d3-a456-426614174000`
   - Creates sessions in database with this UUID
   - Messages tracked: 1, 2, 3, 4, 5... ✅

2. **Signup Prompt Appears:**

   - After 5 messages, modal shows
   - User clicks "Sign Up Free"

3. **Registration:**

   - Frontend sends:
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "password": "secure123",
       "anonymousUserId": "123e4567-e89b-12d3-a456-426614174000"
     }
     ```

4. **Backend Migration:**

   ```sql
   BEGIN TRANSACTION;

   -- Create new user
   INSERT INTO users (name, email, password_hash)
   VALUES ('John Doe', 'john@example.com', '$2a$10$...')
   RETURNING id; -- Returns: 'abc-def-456-...'

   -- Migrate sessions
   UPDATE conversation_sessions
   SET user_id = 'abc-def-456-...'
   WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

   COMMIT;
   ```

5. **Result:**
   - User gets full account
   - All chat history preserved
   - Message count resets
   - Full features unlocked

---

## 🧪 Testing Guide

### Test 1: Anonymous User Flow

```bash
# 1. Visit the app (no login)
# Browser should automatically generate UUID
# Check localStorage:
localStorage.getItem('anonymousUserId')
# → "123e4567-e89b-12d3-a456-426614174000"

# 2. Send messages
# After each message, check:
localStorage.getItem('anonymousMessageCount')
# → "1", "2", "3", "4", "5"

# 3. On 5th message
# SignupPrompt modal should appear
```

### Test 2: Session Migration

```bash
# 1. As anonymous user, send 3 messages
# Check database:
SELECT * FROM conversation_sessions
WHERE user_id = 'your-anonymous-uuid';
# → 1 session found

# 2. Sign up with new account
POST /api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123",
  "anonymousUserId": "your-anonymous-uuid"
}

# 3. Check response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "...",
    "migrated": true,
    "migratedSessions": 1
  }
}

# 4. Verify database:
SELECT * FROM conversation_sessions
WHERE user_id = 'new-user-uuid';
# → Session transferred!
```

### Test 3: Continue as Guest

```bash
# 1. Trigger signup prompt (5 messages)
# 2. Click "Continue as Guest"
# Modal should close
# Can send more messages (unlimited for now)
# Prompt won't show again unless page refresh
```

### Test 4: Cross-Device Isolation

```bash
# Device 1:
- Open in Chrome
- Anonymous UUID: "abc-123"
- Send messages

# Device 2:
- Open in Firefox
- Anonymous UUID: "def-456" (different!)
- Send messages

# Both should have separate sessions
```

---

## 🔐 Security Considerations

### 1. **Data Isolation**

- ✅ Each anonymous user gets unique UUID
- ✅ Database enforces user_id filtering
- ✅ No cross-user data leakage

### 2. **Rate Limiting** (Future Enhancement)

- ⚠️ Currently unlimited messages for anonymous users
- 💡 Recommendation: Add IP-based rate limiting
- 💡 Suggestion: Limit to 10-20 messages per anonymous user

### 3. **Spam Prevention**

- ⚠️ No CAPTCHA currently
- 💡 Recommendation: Add CAPTCHA after signup prompt dismiss
- 💡 Suggestion: Track anonymous user IPs for abuse

### 4. **Session Security**

- ✅ UUIDs stored in localStorage (client-side only)
- ✅ No sensitive data in anonymous sessions
- ✅ Sessions automatically migrate on signup

---

## 📊 Monitoring

### Metrics to Track:

```sql
-- 1. Anonymous User Activity
SELECT COUNT(DISTINCT user_id) as anonymous_users
FROM conversation_sessions
WHERE user_id NOT IN (SELECT id FROM users);

-- 2. Conversion Rate
SELECT
  COUNT(DISTINCT anonymousUserId) as signups_with_migration,
  COUNT(*) as total_signups,
  (COUNT(DISTINCT anonymousUserId)::float / COUNT(*) * 100) as conversion_rate
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 3. Messages Before Signup
SELECT
  AVG(message_count) as avg_messages_before_signup
FROM (
  SELECT cs.user_id, COUNT(cm.id) as message_count
  FROM conversation_sessions cs
  JOIN conversation_messages cm ON cm.session_id = cs.session_id
  WHERE cs.user_id IN (SELECT id FROM users WHERE created_at >= NOW() - INTERVAL '7 days')
  GROUP BY cs.user_id
) subquery;
```

---

## 🚀 Future Enhancements

### 1. **Rate Limiting**

```javascript
// middleware/rateLimit.js
export const anonymousRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  skip: (req) => !req.isAnonymous, // Only apply to anonymous
  message: "Too many requests. Please sign up for unlimited access.",
});
```

### 2. **Session Expiration**

```javascript
// Auto-expire anonymous sessions after 7 days
const ANONYMOUS_SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const sessionAge = Date.now() - new Date(anonymousCreatedAt).getTime();
if (sessionAge > ANONYMOUS_SESSION_TTL) {
  // Clear old anonymous data
  clearAnonymousData();
  generateAnonymousUser();
}
```

### 3. **Analytics**

```javascript
// Track anonymous user behavior
analytics.track("anonymous_user_created", {
  anonymousId: user.id,
  timestamp: new Date(),
});

analytics.track("anonymous_user_converted", {
  anonymousId: oldId,
  userId: newId,
  messagesSent: messageCount,
});
```

### 4. **Progressive Disclosure**

```javascript
// Show different features based on status
{
  isAnonymous && (
    <Banner>
      <strong>You're using Guest Mode</strong>
      Sign up to unlock: Advanced Analytics, Team Collaboration, Priority Support
    </Banner>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Signup prompt not showing

**Check:**

```javascript
// In browser console:
localStorage.getItem("anonymousMessageCount");
// Should be "5" or higher

// Check auth context:
const { messageCount, showSignupPrompt } = useAuth();
console.log({ messageCount, showSignupPrompt });
```

**Solution:**

- Clear localStorage and try again
- Check `incrementMessageCount()` is being called
- Verify `AuthContext` is properly initialized

### Issue: Sessions not migrating

**Check backend logs:**

```
🔄 Migrating sessions from anonymous user abc-123 to def-456
✅ Migrated 2 sessions to new user account
```

**If no logs:**

- Verify `anonymousUserId` is in request body
- Check database for existing sessions
- Ensure anonymous UUID is valid

### Issue: Anonymous user can't send messages

**Check middleware:**

```javascript
// Should see in logs:
🔓 Anonymous user access
```

**Solution:**

- Verify `optionalAuth` middleware is applied
- Check `requireUserId` middleware accepts body params
- Ensure userId is sent in request body

---

## 📚 API Reference

### Anonymous User Endpoints

#### POST /api/chat/session

Create new chat session (anonymous or authenticated)

**Request:**

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000", // Anonymous UUID
  "context": {
    "project": "stripe_support",
    "context": "customer_support"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sessionId": "session_123",
    "message": "Session created"
  }
}
```

#### POST /api/auth/register

Register new user with optional session migration

**Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "anonymousUserId": "123e4567-e89b-12d3-a456-426614174000" // Optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "abc-def-456",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "migrated": true,
    "migratedSessions": 2
  }
}
```

---

## ✅ Summary

### What We Built:

1. ✅ Anonymous user support with temporary UUIDs
2. ✅ Message count tracking with signup prompts
3. ✅ Beautiful signup modal after 5 messages
4. ✅ Seamless session migration on registration
5. ✅ Optional authentication middleware
6. ✅ Updated routes for anonymous access

### Benefits:

- 📈 **Lower Barrier to Entry** - Users can try before signup
- 💰 **Better Conversion** - Gradual engagement funnel
- 🎯 **User-Friendly** - No forced registration
- 🔐 **Still Secure** - Proper data isolation maintained

### Next Steps:

1. Test the complete flow
2. Add rate limiting for anonymous users
3. Implement analytics tracking
4. Monitor conversion metrics
5. Optimize signup prompt timing

---

**Last Updated:** $(date)  
**Status:** ✅ Implementation Complete  
**Version:** 2.0.0 - Anonymous User Support
