# 🎭 Anonymous User Frontend Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [User Journeys](#user-journeys)
7. [API Reference](#api-reference)
8. [LocalStorage Schema](#localstorage-schema)
9. [Integration Guide](#integration-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The anonymous user system allows visitors to use the chat functionality without creating an account. This provides a frictionless onboarding experience while encouraging conversion through progressive prompts.

### Key Features

- ✅ **Instant Access** - Users can start chatting immediately without signup
- ✅ **Persistent Identity** - Anonymous users get a unique UUID stored in localStorage
- ✅ **Message Tracking** - System tracks messages sent by anonymous users
- ✅ **Progressive Conversion** - Signup prompt appears after 5 messages
- ✅ **Session Migration** - Chat history preserved when converting to authenticated account
- ✅ **Graceful Fallback** - Automatic anonymous user creation on auth errors

---

## Architecture

### Component Hierarchy

```
App
└── AuthProvider (Context Provider)
    └── AppWrapper
        ├── Layout
        │   ├── Routes (Public/Protected)
        │   └── SignupPrompt (Conditional)
        └── Chat Components
            ├── useChat
            └── useIntegratedChat
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Load                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              AuthContext.initialize()                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Check localStorage for token                          │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│         ┌───────────┴───────────┐                          │
│         │                       │                            │
│    Has Token?            No Token?                          │
│         │                       │                            │
│         ▼                       ▼                            │
│  Verify Token          generateAnonymousUser()              │
│         │                       │                            │
│    ┌────┴────┐                 │                            │
│ Valid?  Invalid?               │                            │
│    │      │                    │                            │
│    ▼      ▼                    ▼                            │
│ Auth   Anonymous          Anonymous                         │
│ User   User               User                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              User Sends Message                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         useChat/useIntegratedChat                            │
│              handleSendMessage()                             │
│                      │                                       │
│                      ▼                                       │
│         incrementMessageCount() (if anonymous)              │
│                      │                                       │
│         ┌────────────┴────────────┐                         │
│         │                        │                          │
│    Update State          Check Count                        │
│    localStorage          >= 5?                              │
│         │                        │                          │
│         │                        ▼                          │
│         │              setShowSignupPrompt(true)            │
│         │                        │                          │
│         └────────────────────────┘                          │
│                      │                                       │
│                      ▼                                       │
│         AppWrapper renders SignupPrompt                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. AuthContext (`src/context/AuthContext.jsx`)

The central state management component for authentication and anonymous user handling.

#### State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `user` | `Object \| null` | Current user object (authenticated or anonymous) |
| `loading` | `boolean` | Loading state during auth initialization |
| `error` | `string \| null` | Error message if any |
| `isAnonymous` | `boolean` | Flag indicating if user is anonymous |
| `messageCount` | `number` | Number of messages sent by anonymous user |
| `showSignupPrompt` | `boolean` | Controls visibility of signup prompt modal |

#### Core Functions

##### `generateAnonymousUser()`

Generates or retrieves an anonymous user object with a unique UUID.

```javascript
const generateAnonymousUser = () => {
  let anonymousId = localStorage.getItem("anonymousUserId");

  if (!anonymousId) {
    // Generate new UUID for anonymous user
    anonymousId = crypto.randomUUID();
    localStorage.setItem("anonymousUserId", anonymousId);
    localStorage.setItem("anonymousCreatedAt", new Date().toISOString());
  }

  const anonymousUser = {
    id: anonymousId,
    name: "Guest User",
    email: null,
    isAnonymous: true,
    createdAt: localStorage.getItem("anonymousCreatedAt"),
  };

  return anonymousUser;
};
```

**Returns:** Anonymous user object with UUID, name, and metadata

**LocalStorage Keys Used:**
- `anonymousUserId` - Unique identifier for the anonymous user
- `anonymousCreatedAt` - Timestamp when anonymous user was created

---

##### `incrementMessageCount()`

Increments the message counter for anonymous users and shows signup prompt after 5 messages.

```javascript
const incrementMessageCount = () => {
  if (isAnonymous) {
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    localStorage.setItem("anonymousMessageCount", newCount.toString());

    // Show signup prompt after 5 messages
    if (newCount >= 5) {
      setShowSignupPrompt(true);
    }
  }
};
```

**Behavior:**
- Only increments if `isAnonymous === true`
- Persists count to localStorage
- Triggers signup prompt when count reaches 5

**LocalStorage Key:** `anonymousMessageCount`

---

##### `clearAnonymousData()`

Removes all anonymous user data from localStorage and resets state.

```javascript
const clearAnonymousData = () => {
  localStorage.removeItem("anonymousUserId");
  localStorage.removeItem("anonymousCreatedAt");
  localStorage.removeItem("anonymousMessageCount");
  setMessageCount(0);
  setShowSignupPrompt(false);
};
```

**When Called:**
- After successful registration with migration
- After successful login
- When user explicitly dismisses prompt (optional)

---

##### `dismissSignupPrompt()`

Hides the signup prompt modal.

```javascript
const dismissSignupPrompt = () => {
  setShowSignupPrompt(false);
};
```

---

##### `register(name, email, password, migrateSession = true)`

Registers a new user with optional session migration from anonymous account.

```javascript
const register = async (name, email, password, migrateSession = true) => {
  // Get anonymous user ID if exists
  const anonymousUserId = isAnonymous ? user?.id : null;

  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
      anonymousUserId: migrateSession ? anonymousUserId : null,
    }),
  });

  // ... handle response

  // Clear anonymous data after successful migration
  if (migrateSession && anonymousUserId) {
    clearAnonymousData();
  }

  return {
    success: true,
    user: data.data.user,
    migrated: !!anonymousUserId,
  };
};
```

**Parameters:**
- `name` (string) - User's name
- `email` (string) - User's email
- `password` (string) - User's password
- `migrateSession` (boolean, default: true) - Whether to migrate anonymous sessions

**Returns:**
```javascript
{
  success: boolean,
  user?: UserObject,
  migrated?: boolean,
  error?: string
}
```

---

##### `login(email, password)`

Logs in an authenticated user and clears anonymous data.

```javascript
const login = async (email, password) => {
  // ... login logic

  // Clear anonymous data after login
  clearAnonymousData();

  return { success: true, user: data.data.user };
};
```

**Note:** Always clears anonymous data on successful login to prevent conflicts.

---

##### `logout()`

Logs out the current user and creates a new anonymous user.

```javascript
const logout = () => {
  // Clear tokens and user
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  // Clear all chat session data
  localStorage.removeItem("stripe_integrated_current_session");
  localStorage.removeItem("stripe_current_session");
  localStorage.removeItem("chatHistory");
  localStorage.removeItem("integratedChatHistory");

  // Clear any other session-related keys
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("session_") || key.includes("chat")) {
      localStorage.removeItem(key);
    }
  });

  // Create new anonymous user after logout
  const anonUser = generateAnonymousUser();
  setUser(anonUser);
  setIsAnonymous(true);
  setMessageCount(0);
  setShowSignupPrompt(false);

  navigate("/");
};
```

**Behavior:**
- Clears all authentication tokens
- Clears all chat session data
- Creates fresh anonymous user
- Resets message count
- Navigates to home page

---

### 2. SignupPrompt (`src/components/SignupPrompt.jsx`)

Modal component that encourages anonymous users to sign up after sending 5 messages.

#### Props

None (uses `useAuth` hook to access state)

#### Features

- Displays current message count
- Lists benefits of signing up
- "Sign Up Free" button - navigates to signup page and dismisses prompt
- "Continue as Guest" button - dismisses prompt without navigation
- Professional, non-intrusive design with animations

#### Implementation

```javascript
const SignupPrompt = () => {
  const navigate = useNavigate();
  const { messageCount, dismissSignupPrompt } = useAuth();

  const handleSignup = () => {
    dismissSignupPrompt(); // Close modal before navigation
    navigate("/signup");
  };

  const handleDismiss = () => {
    dismissSignupPrompt();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modal content */}
    </div>
  );
};
```

**Key Points:**
- Always dismisses prompt before navigation to prevent modal from persisting
- Uses high z-index (z-50) to appear above all content
- Responsive design with padding for mobile devices

---

### 3. AppWrapper (`src/Routes.jsx`)

Wrapper component that conditionally renders the SignupPrompt globally.

```javascript
const AppWrapper = ({ children }) => {
  const { showSignupPrompt } = useAuth();

  return (
    <>
      {children}
      {showSignupPrompt && <SignupPrompt />}
    </>
  );
};
```

**Purpose:**
- Ensures SignupPrompt is available on all routes
- Renders only when `showSignupPrompt === true`
- Does not interfere with routing or other components

---

## State Management

### Initialization Flow

The `AuthContext` initializes on app load through a `useEffect` hook:

```javascript
useEffect(() => {
  const initAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        // Verify token is still valid
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const realUser = JSON.parse(storedUser);
          setUser(realUser);
          setIsAnonymous(false);
        } else {
          // Token invalid, clear storage and create anonymous user
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");

          const anonUser = generateAnonymousUser();
          setUser(anonUser);
          setIsAnonymous(true);
        }
      } else {
        // No token - create anonymous user
        const anonUser = generateAnonymousUser();
        setUser(anonUser);
        setIsAnonymous(true);

        // Load message count for anonymous user
        const savedCount = localStorage.getItem("anonymousMessageCount");
        setMessageCount(savedCount ? parseInt(savedCount, 10) : 0);
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      // Fallback to anonymous user on error
      const anonUser = generateAnonymousUser();
      setUser(anonUser);
      setIsAnonymous(true);
    } finally {
      setLoading(false);
    }
  };

  initAuth();
}, []);
```

### Decision Tree

```
App Initialization
│
├─ Has Token?
│  │
│  ├─ Yes → Verify Token
│  │        │
│  │        ├─ Valid → Set Authenticated User
│  │        │
│  │        └─ Invalid → Clear Storage → Create Anonymous User
│  │
│  └─ No → Create Anonymous User
│           │
│           └─ Load Message Count from localStorage
│
└─ Error → Fallback to Anonymous User
```

---

## Data Flow

### Message Sending Flow

```
User Types Message
    │
    ▼
handleSendMessage() (in useChat/useIntegratedChat)
    │
    ├─ Send message to API
    │
    ├─ On Success:
    │   │
    │   ├─ incrementMessageCount() (if anonymous)
    │   │   │
    │   │   ├─ Check: isAnonymous === true?
    │   │   │
    │   │   ├─ Increment messageCount
    │   │   │
    │   │   ├─ Save to localStorage
    │   │   │
    │   │   └─ Check: messageCount >= 5?
    │   │       │
    │   │       └─ Yes → setShowSignupPrompt(true)
    │   │
    │   └─ Update chat UI
    │
    └─ On Error:
        └─ Show error message
```

### Registration with Migration Flow

```
User Clicks "Sign Up Free"
    │
    ▼
dismissSignupPrompt() → Close modal
    │
    ▼
Navigate to /signup
    │
    ▼
User Fills Registration Form
    │
    ▼
register(name, email, password, migrateSession=true)
    │
    ├─ Extract anonymousUserId (if isAnonymous)
    │
    ├─ Send to API:
    │   {
    │     name, email, password,
    │     anonymousUserId: <UUID or null>
    │   }
    │
    ├─ Backend migrates sessions
    │
    ├─ On Success:
    │   │
    │   ├─ Save tokens to localStorage
    │   │
    │   ├─ Set authenticated user
    │   │
    │   ├─ setIsAnonymous(false)
    │   │
    │   └─ clearAnonymousData()
    │       │
    │       ├─ Remove anonymousUserId
    │       ├─ Remove anonymousCreatedAt
    │       ├─ Remove anonymousMessageCount
    │       ├─ Reset messageCount to 0
    │       └─ Set showSignupPrompt to false
    │
    └─ Return { success: true, migrated: true }
```

---

## User Journeys

### Journey 1: New Anonymous User

```
1. User visits website
   └─ No token in localStorage
       │
       ▼
2. AuthContext initializes
   └─ generateAnonymousUser() called
       │
       ├─ Generate UUID: "abc-123-def-456"
       ├─ Save to localStorage
       └─ Create user object: { id: "abc-123...", name: "Guest User", isAnonymous: true }
           │
           ▼
3. User navigates to chat
   └─ Can chat immediately (no authentication required)
       │
       ▼
4. User sends message #1
   └─ incrementMessageCount() called
       │
       ├─ messageCount: 0 → 1
       ├─ Save to localStorage
       └─ showSignupPrompt: false (count < 5)
           │
           ▼
5. User sends messages #2, #3, #4
   └─ Same process, count increments
       │
       ▼
6. User sends message #5
   └─ incrementMessageCount() called
       │
       ├─ messageCount: 4 → 5
       ├─ Save to localStorage
       └─ showSignupPrompt: false → true (count >= 5)
           │
           ▼
7. SignupPrompt modal appears
   └─ Shows message count and benefits
       │
       ├─ User clicks "Sign Up Free"
       │   └─ Navigate to /signup → Registration flow
       │
       └─ User clicks "Continue as Guest"
           └─ Modal dismissed, can continue chatting
```

### Journey 2: Returning Anonymous User

```
1. User returns to website
   └─ anonymousUserId exists in localStorage: "abc-123-def-456"
       │
       ▼
2. AuthContext initializes
   └─ generateAnonymousUser() called
       │
       ├─ Retrieve existing UUID from localStorage
       ├─ Retrieve createdAt timestamp
       └─ Create user object with same ID
           │
           ▼
3. Load message count
   └─ anonymousMessageCount: "3" (from previous session)
       │
       ├─ setMessageCount(3)
       └─ showSignupPrompt: false (count < 5)
           │
           ▼
4. User continues chatting
   └─ Message count persists across sessions
```

### Journey 3: Anonymous to Authenticated Conversion

```
1. Anonymous user with 5+ messages
   └─ SignupPrompt visible
       │
       ▼
2. User clicks "Sign Up Free"
   └─ Navigate to /signup
       │
       ▼
3. User fills registration form
   └─ Submits: name, email, password
       │
       ▼
4. register() called with migrateSession=true
   └─ anonymousUserId: "abc-123-def-456" sent to backend
       │
       ├─ Backend creates new user account
       ├─ Backend migrates all sessions from anonymousUserId to new user
       └─ Returns: { user, token, refreshToken }
           │
           ▼
5. Frontend receives response
   └─ Save tokens and user to localStorage
       │
       ├─ setUser(authenticatedUser)
       ├─ setIsAnonymous(false)
       └─ clearAnonymousData()
           │
           ├─ Remove anonymousUserId
           ├─ Remove anonymousCreatedAt
           ├─ Remove anonymousMessageCount
           ├─ Reset messageCount: 0
           └─ Set showSignupPrompt: false
               │
               ▼
6. User is now authenticated
   └─ Can access all features
   └─ Chat history preserved from anonymous session
```

### Journey 4: Logout Flow

```
1. Authenticated user clicks logout
   └─ logout() called
       │
       ▼
2. Clear authentication data
   └─ Remove token, refreshToken, user from localStorage
       │
       ▼
3. Clear chat session data
   └─ Remove all chat-related localStorage keys
       │
       ▼
4. Create new anonymous user
   └─ generateAnonymousUser()
       │
       ├─ Generate NEW UUID (different from before)
       ├─ Save to localStorage
       └─ Create fresh anonymous user object
           │
           ▼
5. Reset state
   └─ setMessageCount(0)
   └─ setShowSignupPrompt(false)
       │
       ▼
6. Navigate to home
   └─ User can start fresh anonymous session
```

---

## API Reference

### useAuth Hook

The `useAuth` hook provides access to all authentication and anonymous user functionality.

#### Usage

```javascript
import { useAuth } from "../context/AuthContext";

const MyComponent = () => {
  const {
    user,
    loading,
    error,
    isAuthenticated,
    isAnonymous,
    messageCount,
    showSignupPrompt,
    register,
    login,
    logout,
    incrementMessageCount,
    dismissSignupPrompt,
    // ... other methods
  } = useAuth();

  // Use the values and methods
};
```

#### Returned Values

| Property | Type | Description |
|----------|------|-------------|
| `user` | `Object \| null` | Current user object |
| `loading` | `boolean` | Loading state |
| `error` | `string \| null` | Error message |
| `isAuthenticated` | `boolean` | `true` if user is authenticated |
| `isAnonymous` | `boolean` | `true` if user is anonymous |
| `messageCount` | `number` | Messages sent by anonymous user |
| `showSignupPrompt` | `boolean` | Signup prompt visibility |
| `register` | `Function` | Register new user |
| `login` | `Function` | Login user |
| `logout` | `Function` | Logout user |
| `incrementMessageCount` | `Function` | Increment message counter |
| `dismissSignupPrompt` | `Function` | Hide signup prompt |

---

## LocalStorage Schema

### Anonymous User Keys

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `anonymousUserId` | `string` | UUID for anonymous user | `"abc-123-def-456"` |
| `anonymousCreatedAt` | `string` | ISO timestamp | `"2024-01-15T10:30:00.000Z"` |
| `anonymousMessageCount` | `string` | Number of messages sent | `"5"` |

### Authentication Keys

| Key | Type | Description |
|-----|------|-------------|
| `token` | `string` | JWT access token |
| `refreshToken` | `string` | JWT refresh token |
| `user` | `string` | JSON stringified user object |

### Chat Session Keys

| Key | Type | Description |
|-----|------|-------------|
| `stripe_integrated_current_session` | `string` | Current integrated chat session ID |
| `stripe_current_session` | `string` | Current standard chat session ID |
| `chatHistory` | `string` | JSON stringified chat history |
| `integratedChatHistory` | `string` | JSON stringified integrated chat history |

**Note:** All chat session keys are cleared on logout to prevent data leakage between users.

---

## Integration Guide

### Integrating Message Counting in Chat Components

To track messages for anonymous users, call `incrementMessageCount()` after successful message sends:

```javascript
import { useAuth } from "../context/AuthContext";

const useChat = () => {
  const { user, incrementMessageCount } = useAuth();

  const handleSendMessage = async () => {
    // ... send message logic

    try {
      const response = await apiService.sendMessage(
        messageText,
        currentSessionId,
        user?.id
      );

      // ... handle response

      // Increment message count for anonymous users
      incrementMessageCount();

      // ... update UI
    } catch (error) {
      // ... handle error
    }
  };

  return { handleSendMessage, /* ... */ };
};
```

**Important:** Only call `incrementMessageCount()` after a successful message send, not on errors or retries.

---

### Checking User Type

Use the `isAnonymous` flag to conditionally render features:

```javascript
const MyComponent = () => {
  const { isAnonymous, isAuthenticated } = useAuth();

  return (
    <div>
      {isAuthenticated && (
        <button>Access Dashboard</button>
      )}
      
      {isAnonymous && (
        <p>You're using as a guest. Sign up to save your progress!</p>
      )}
    </div>
  );
};
```

---

### Handling Registration with Migration

When implementing a registration form, the migration happens automatically:

```javascript
const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      true // migrateSession = true (default)
    );

    if (result.success) {
      if (result.migrated) {
        console.log("Chat history migrated successfully!");
      }
      navigate("/dashboard");
    } else {
      // Handle error
      console.error(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

---

## Troubleshooting

### Issue: Signup Prompt Not Appearing

**Symptoms:** User sends 5+ messages but modal doesn't show.

**Possible Causes:**
1. `incrementMessageCount()` not being called
2. `isAnonymous` is `false` (user is authenticated)
3. `showSignupPrompt` state not updating

**Solutions:**
```javascript
// Check if incrementMessageCount is called
console.log("Message count:", messageCount);
console.log("Is anonymous:", isAnonymous);

// Verify in chat hook
const { incrementMessageCount, isAnonymous } = useAuth();

// Make sure to call after successful send
if (response.ok) {
  incrementMessageCount(); // ✅ Correct
}
```

---

### Issue: Signup Prompt Persists After Navigation

**Symptoms:** Modal stays visible when navigating to signup page.

**Solution:** Ensure `dismissSignupPrompt()` is called before navigation:

```javascript
const handleSignup = () => {
  dismissSignupPrompt(); // ✅ Must call this first
  navigate("/signup");
};
```

---

### Issue: Message Count Not Persisting

**Symptoms:** Message count resets on page refresh.

**Possible Causes:**
1. localStorage not being saved
2. localStorage cleared by browser
3. Incorrect key name

**Solutions:**
```javascript
// Verify localStorage save
localStorage.setItem("anonymousMessageCount", newCount.toString());

// Check on next load
const savedCount = localStorage.getItem("anonymousMessageCount");
console.log("Saved count:", savedCount);
```

---

### Issue: Anonymous User ID Changes on Refresh

**Symptoms:** New UUID generated each time instead of reusing existing one.

**Possible Causes:**
1. `anonymousUserId` not being saved to localStorage
2. localStorage cleared
3. Different browser/incognito mode

**Solutions:**
```javascript
// Verify UUID is saved
const anonymousId = localStorage.getItem("anonymousUserId");
if (!anonymousId) {
  // Generate new one
  anonymousId = crypto.randomUUID();
  localStorage.setItem("anonymousUserId", anonymousId);
} else {
  // Reuse existing
  console.log("Reusing UUID:", anonymousId);
}
```

---

### Issue: Chat History Not Migrating

**Symptoms:** After registration, previous chat history is lost.

**Possible Causes:**
1. `anonymousUserId` not sent to backend
2. Backend migration failing
3. `migrateSession` parameter set to `false`

**Solutions:**
```javascript
// Verify anonymousUserId is sent
const anonymousUserId = isAnonymous ? user?.id : null;
console.log("Sending anonymousUserId:", anonymousUserId);

// Check registration call
const result = await register(name, email, password, true); // ✅ migrateSession = true
console.log("Migration result:", result.migrated);
```

---

## Best Practices

1. **Always check `isAnonymous` before calling `incrementMessageCount()`**
   - The function has internal checks, but explicit checks improve code clarity

2. **Clear anonymous data after successful authentication**
   - Prevents conflicts and data leakage

3. **Handle errors gracefully**
   - Always fallback to anonymous user on auth errors

4. **Persist state to localStorage**
   - Ensures anonymous user identity persists across sessions

5. **Clear chat data on logout**
   - Prevents showing previous user's conversations

6. **Dismiss prompt before navigation**
   - Prevents modal from persisting on new pages

---

## Testing Checklist

- [ ] Anonymous user created on app load without token
- [ ] Anonymous user UUID persists across page refreshes
- [ ] Message count increments correctly
- [ ] Message count persists across sessions
- [ ] Signup prompt appears after 5 messages
- [ ] Signup prompt dismisses correctly
- [ ] Registration migrates anonymous sessions
- [ ] Login clears anonymous data
- [ ] Logout creates new anonymous user
- [ ] Chat history preserved during migration
- [ ] Error handling falls back to anonymous user

---

## Related Documentation

- [Backend Anonymous User Documentation](../multitenancy/ANONYMOUS_USERS.md)
- [Anonymous User Fix Documentation](../ANONYMOUS_USER_FIX.md)
- [Memory System Documentation](../MEMORY_SYSTEM.md)

---

## Version History

- **v1.0.0** - Initial implementation with basic anonymous user support
- **v1.1.0** - Added message counting and signup prompt
- **v1.2.0** - Added session migration on registration
- **v1.3.0** - Fixed signup prompt persistence issue

---

**Last Updated:** 2024-01-15  
**Maintained By:** Frontend Team

