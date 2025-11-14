# Anonymous User Fix - Foreign Key Constraint Issue

## 📋 Table of Contents

1. [Problem Overview](#problem-overview)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Solution Architecture](#solution-architecture)
4. [Implementation Details](#implementation-details)
5. [Database Migration](#database-migration)
6. [Code Flow & Logic](#code-flow--logic)
7. [API Endpoints](#api-endpoints)
8. [Frontend Integration](#frontend-integration)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)
11. [Related Files](#related-files)

---

## Problem Overview

### Error Message

When anonymous (guest) users tried to create a chat session, the system failed with:

```
❌ Failed to initialize memory system: insert or update on table "conversation_sessions"
violates foreign key constraint "conversation_sessions_user_id_fkey"

Detail: Key (user_id)=(b6b8561f-8fcb-4000-892a-457e1fd12f76) is not present in table "users".
```

### When It Occurred

- Anonymous users visiting the site without login
- Frontend generating UUID for guest users
- Attempting to create chat sessions
- System trying to insert session with UUID that doesn't exist in `users` table

---

## Root Cause Analysis

### The Problem Chain

1. **Frontend Generated UUID**: Anonymous users get a UUID (e.g., `b6b8561f-8fcb-4000-892a-457e1fd12f76`) stored in `localStorage`
2. **UUID Sent to Backend**: This UUID is passed as `userId` when creating sessions
3. **Foreign Key Constraint**: The `conversation_sessions.user_id` column has a foreign key constraint:
   ```sql
   FOREIGN KEY (user_id) REFERENCES users(id)
   ```
4. **Constraint Violation**: Since anonymous UUIDs don't exist in `users` table, PostgreSQL rejects the insert

### Why NULL is the Solution

- PostgreSQL foreign key constraints **allow NULL values** by default
- NULL represents "no user" which is semantically correct for anonymous users
- We can still identify anonymous sessions via metadata
- Migration is possible when users register

---

## Solution Architecture

### High-Level Approach

```
┌─────────────────────────────────────────────────────────────┐
│                    Anonymous User Flow                       │
└─────────────────────────────────────────────────────────────┘

1. Frontend generates UUID → localStorage
2. UUID sent to backend as userId
3. Backend checks: Does UUID exist in users table?
   ├─ NO  → Set user_id = NULL, store UUID in metadata
   └─ YES → Use actual user_id
4. Session created with user_id = NULL (no foreign key error!)
5. When user registers → Find sessions by metadata.anonymousUserId
6. Migrate sessions: Update user_id from NULL to registered user ID
```

### Key Components

1. **Anonymous Detection**: Check if `userId` exists in `users` table
2. **NULL Storage**: Store `user_id = NULL` for anonymous sessions
3. **Metadata Tracking**: Store anonymous UUID in `metadata.anonymousUserId`
4. **Session Migration**: Find and migrate anonymous sessions on registration

---

## Implementation Details

### 1. Core Fix: `postgresMemoryService.js`

**File**: `Backend/services/postgresMemoryService.js`  
**Method**: `createOrGetSession(sessionId, userId = null, metadata = {})`

#### Code Explanation

```javascript
async createOrGetSession(sessionId, userId = null, metadata = {}) {
  const client = await this.pool.connect();

  try {
    // STEP 1: Check if session already exists
    const existingSession = await client.query(
      "SELECT * FROM conversation_sessions WHERE session_id = $1",
      [sessionId]
    );

    if (existingSession.rows.length > 0) {
      // Session exists - just update last activity timestamp
      await client.query(
        "UPDATE conversation_sessions SET updated_at = NOW() WHERE session_id = $1",
        [sessionId]
      );
      return existingSession.rows[0];
    }

    // STEP 2: Handle anonymous user detection
    let finalUserId = userId;  // Start with provided userId
    let finalMetadata = { ...metadata };  // Copy metadata

    // STEP 3: Check if userId is valid registered user
    if (userId && userId !== "anonymous") {
      try {
        // Query users table to verify user exists
        const userCheck = await client.query(
          "SELECT id FROM users WHERE id = $1",
          [userId]
        );

        // STEP 4: If user doesn't exist, it's anonymous
        if (userCheck.rows.length === 0) {
          console.log(
            `🔓 Anonymous user detected (UUID: ${userId}), setting user_id to NULL`
          );
          finalUserId = null;  // Set to NULL to avoid foreign key error

          // Store original UUID in metadata for later migration
          finalMetadata.anonymousUserId = userId;
        }
      } catch (error) {
        // Handle invalid UUID format or database errors
        console.log(
          `🔓 Invalid or anonymous userId (${userId}), setting user_id to NULL`
        );
        finalUserId = null;

        // Still store UUID in metadata if it's not the string "anonymous"
        if (userId !== "anonymous") {
          finalMetadata.anonymousUserId = userId;
        }
      }
    } else if (userId === "anonymous") {
      // Explicitly marked as anonymous
      finalUserId = null;
    }

    // STEP 5: Create session with NULL user_id for anonymous users
    const newSession = await client.query(
      `INSERT INTO conversation_sessions (session_id, user_id, metadata)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, finalUserId, JSON.stringify(finalMetadata)]
    );

    console.log(
      `🆕 Created new conversation session: ${sessionId}${
        finalUserId ? ` (user: ${finalUserId})` : " (anonymous)"
      }`
    );
    return newSession.rows[0];
  } finally {
    client.release();  // Always release database connection
  }
}
```

**Key Points**:

- **Line 227-228**: Initialize variables to track final userId and metadata
- **Line 230**: Only check database if userId is provided and not "anonymous"
- **Line 233-236**: Database query to verify user exists
- **Line 239-246**: If user not found → Anonymous user detected
- **Line 243**: Set `finalUserId = null` to avoid foreign key constraint
- **Line 245**: Store UUID in metadata for migration
- **Line 263-268**: Insert session with NULL user_id (allowed by foreign key)

---

### 2. Session Migration: `authController.js`

**File**: `Backend/controllers/authController.js`  
**Method**: `register()` - Session migration logic

#### Code Explanation

```javascript
// Migrate anonymous sessions if anonymousUserId provided
let migratedSessions = 0;
if (anonymousUserId) {
  try {
    console.log(
      `🔄 Migrating sessions from anonymous user ${anonymousUserId} to ${user.id}`
    );

    // Find and update anonymous sessions
    const sessionsResult = await client.query(
      `UPDATE conversation_sessions 
       SET user_id = $1, updated_at = NOW(),
           metadata = jsonb_set(metadata, '{anonymousUserId}', 'null'::jsonb, true)
       WHERE user_id IS NULL 
         AND metadata->>'anonymousUserId' = $2
       RETURNING session_id`,
      [user.id, anonymousUserId]
    );

    migratedSessions = sessionsResult.rowCount;

    if (migratedSessions > 0) {
      console.log(
        `✅ Migrated ${migratedSessions} sessions to new user account`
      );
    } else {
      console.log(`ℹ️ No sessions found for anonymous user to migrate`);
    }
  } catch (migrationError) {
    console.error("⚠️ Session migration error:", migrationError);
    // Don't fail registration if migration fails
  }
}
```

**SQL Query Breakdown**:

- `WHERE user_id IS NULL`: Only find anonymous sessions
- `AND metadata->>'anonymousUserId' = $2`: Match by stored UUID
- `SET user_id = $1`: Assign to new registered user
- `jsonb_set(metadata, '{anonymousUserId}', 'null'::jsonb, true)`: Remove anonymousUserId from metadata

**Key Points**:

- **Line 86-94**: SQL query finds sessions with NULL user_id matching the anonymous UUID
- **Line 89**: Cleans up metadata by removing `anonymousUserId` field
- **Line 96**: Counts how many sessions were migrated
- **Line 108-112**: Errors don't fail registration (graceful degradation)

---

### 3. Session Creation Endpoint: `chatController.js`

**File**: `Backend/controllers/chatController.js`  
**Method**: `createSession()`

#### Code Explanation

```javascript
async createSession(req, res) {
  try {
    // Extract userId from request body, default to "anonymous"
    const { userId = "anonymous", context = {} } = req.body;

    console.log(`🆕 Creating new session for user: ${userId}`);

    // Call memory service to create session
    const session = await memoryService.createSession(userId, {
      project: "stripe_support",
      context: "customer_support",
      ...context,  // Merge any additional context
    });

    // Return success response
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        userId: session.userId,  // May be null for anonymous users
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Create session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create session",
      message: error.message,
    });
  }
}
```

**Key Points**:

- **Line 125**: Defaults to "anonymous" if no userId provided
- **Line 129**: Delegates to memoryService which calls createOrGetSession()
- **Line 139**: Returns userId (may be null for anonymous)

---

### 4. Authentication Middleware: `optionalAuth.js`

**File**: `Backend/middleware/optionalAuth.js`

#### Code Explanation

```javascript
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No auth header - treat as anonymous
    if (!authHeader) {
      req.isAnonymous = true;
      req.userId = null;
      console.log("🔓 Anonymous user access");
      return next();
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      req.isAnonymous = true;
      req.userId = null;
      console.log("🔓 Anonymous user access (no token)");
      return next();
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.security.JWT_SECRET);
      req.userId = decoded.id;
      req.user = decoded;
      req.isAnonymous = false;
      console.log(`✅ Authenticated user: ${decoded.id}`);
      next();
    } catch (jwtError) {
      // Invalid token - treat as anonymous
      console.log("⚠️ Invalid token, treating as anonymous:", jwtError.message);
      req.isAnonymous = true;
      req.userId = null;
      next();
    }
  } catch (error) {
    console.error("❌ Optional auth error:", error);
    // On error, allow as anonymous rather than blocking
    req.isAnonymous = true;
    req.userId = null;
    next();
  }
};

export const requireUserId = (req, res, next) => {
  // Check for authenticated user ID
  if (req.userId) {
    return next();
  }

  // Check for anonymous user ID in body, query, or params
  const anonymousUserId =
    req.body?.userId || req.query?.userId || req.params?.userId;

  if (anonymousUserId) {
    req.userId = anonymousUserId;
    req.isAnonymous = true;
    return next();
  }

  // No user ID found
  return res.status(400).json({
    success: false,
    message: "User ID required. Please login or provide an anonymous user ID.",
  });
};
```

**Key Points**:

- **Line 14-19**: No auth header → Anonymous
- **Line 31-38**: Valid token → Authenticated user
- **Line 39-45**: Invalid token → Anonymous (graceful fallback)
- **Line 59-80**: `requireUserId` ensures either authenticated or anonymous ID exists

---

## Database Migration

### Migration Script: `migrate_anonymous_users.sql`

**File**: `Backend/utils/migrate_anonymous_users.sql`

#### Script Breakdown

```sql
-- Step 1: Drop existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'conversation_sessions_user_id_fkey'
        AND table_name = 'conversation_sessions'
    ) THEN
        ALTER TABLE conversation_sessions
        DROP CONSTRAINT conversation_sessions_user_id_fkey;

        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
END $$;

-- Step 2: Ensure user_id column allows NULL
ALTER TABLE conversation_sessions
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Recreate foreign key with NULL support
ALTER TABLE conversation_sessions
ADD CONSTRAINT conversation_sessions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL;  -- If user deleted, set to NULL

-- Step 4: Add documentation comment
COMMENT ON COLUMN conversation_sessions.user_id IS
'User ID for authenticated users. NULL for anonymous/guest users.';
```

**What It Does**:

1. **Drops old constraint**: Removes existing foreign key that might not allow NULL
2. **Ensures NULL allowed**: Makes sure column definition allows NULL
3. **Recreates constraint**: Adds foreign key with `ON DELETE SET NULL`
4. **Documents behavior**: Adds SQL comment explaining NULL usage

### Running the Migration

```bash
# Option 1: Using application user
psql -U stripe_user -d stripe_support_db -f Backend/utils/migrate_anonymous_users.sql

# Option 2: Using superuser (if needed)
psql -U postgres -d stripe_support_db -f Backend/utils/migrate_anonymous_users.sql
```

### Verification

After migration, verify the constraint:

```sql
-- Check constraint definition
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'conversation_sessions_user_id_fkey';

-- Should show: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
```

---

## Code Flow & Logic

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANONYMOUS USER SESSION CREATION                │
└─────────────────────────────────────────────────────────────────┘

1. Frontend (AuthContext.jsx)
   │
   ├─ User visits site (no login)
   ├─ generateAnonymousUser() called
   ├─ UUID generated: crypto.randomUUID()
   ├─ Stored in localStorage: "anonymousUserId"
   │
   ▼
2. Frontend sends request
   │
   POST /api/chat/session
   {
     "userId": "b6b8561f-8fcb-4000-892a-457e1fd12f76"
   }
   │
   ▼
3. Backend Middleware (optionalAuth.js)
   │
   ├─ No Authorization header
   ├─ Sets: req.isAnonymous = true
   ├─ Sets: req.userId = null
   │
   ▼
4. Chat Controller (chatController.js)
   │
   ├─ Receives: userId = "b6b8561f-8fcb-4000-892a-457e1fd12f76"
   ├─ Calls: memoryService.createSession(userId, context)
   │
   ▼
5. Memory Service (memoryService.js)
   │
   ├─ Creates sessionId
   ├─ Calls: memoryController.initializeSession(sessionId, userId, metadata)
   │
   ▼
6. Memory Controller (memoryController.js)
   │
   ├─ Calls: postgresMemory.createOrGetSession(sessionId, userId, metadata)
   │
   ▼
7. PostgreSQL Memory Service (postgresMemoryService.js)
   │
   ├─ Check if session exists? → NO (new session)
   ├─ Check if userId exists in users table?
   │  │
   │  ├─ Query: SELECT id FROM users WHERE id = $1
   │  │
   │  └─ Result: 0 rows (user not found)
   │     │
   │     ├─ Set: finalUserId = null
   │     ├─ Set: finalMetadata.anonymousUserId = userId
   │     │
   │     ▼
   │  INSERT INTO conversation_sessions
   │  (session_id, user_id, metadata)
   │  VALUES ($1, NULL, '{"anonymousUserId": "b6b8561f-..."}')
   │
   └─ ✅ Session created successfully (no foreign key error!)

┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION & MIGRATION                  │
└─────────────────────────────────────────────────────────────────┘

1. Frontend (AuthContext.jsx)
   │
   ├─ User clicks "Sign Up"
   ├─ Registration form submitted
   ├─ Includes: anonymousUserId from localStorage
   │
   ▼
2. Backend (authController.js)
   │
   POST /api/auth/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "secure123",
     "anonymousUserId": "b6b8561f-8fcb-4000-892a-457e1fd12f76"
   }
   │
   ▼
3. User Creation
   │
   ├─ Validate input
   ├─ Hash password
   ├─ INSERT INTO users (name, email, password_hash)
   ├─ New user.id generated: "abc-123-def-456"
   │
   ▼
4. Session Migration
   │
   ├─ if (anonymousUserId) {
   │     UPDATE conversation_sessions
   │     SET user_id = 'abc-123-def-456',
   │         metadata = jsonb_set(metadata, '{anonymousUserId}', 'null')
   │     WHERE user_id IS NULL
   │       AND metadata->>'anonymousUserId' = 'b6b8561f-...'
   │  }
   │
   └─ ✅ Sessions migrated: 3 sessions found and updated
   │
   ▼
5. Response
   │
   {
     "success": true,
     "data": {
       "user": {...},
       "token": "jwt-token",
       "migrated": true,
       "migratedSessions": 3
     }
   }
```

---

## API Endpoints

### 1. Create Session (Anonymous or Authenticated)

**Endpoint**: `POST /api/chat/session`

**Request Body**:

```json
{
  "userId": "b6b8561f-8fcb-4000-892a-457e1fd12f76", // Optional: UUID for anonymous, or null
  "context": {
    "project": "stripe_support",
    "context": "customer_support"
  }
}
```

**Response (Anonymous)**:

```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abc123",
    "userId": null, // null for anonymous users
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Authenticated)**:

```json
{
  "success": true,
  "data": {
    "sessionId": "session_1234567890_abc123",
    "userId": "abc-123-def-456", // Actual user ID
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Register with Session Migration

**Endpoint**: `POST /api/auth/register`

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "anonymousUserId": "b6b8561f-8fcb-4000-892a-457e1fd12f76" // Optional
}
```

**Response**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "abc-123-def-456",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "migrated": true,
    "migratedSessions": 3
  }
}
```

---

## Frontend Integration

### AuthContext Implementation

**File**: `Frontend/src/context/AuthContext.jsx`

#### Key Functions

```javascript
// Generate or retrieve anonymous user ID
const generateAnonymousUser = () => {
  let anonymousId = localStorage.getItem("anonymousUserId");

  if (!anonymousId) {
    // Generate new UUID for anonymous user
    anonymousId = crypto.randomUUID();
    localStorage.setItem("anonymousUserId", anonymousId);
    localStorage.setItem("anonymousCreatedAt", new Date().toISOString());
  }

  return {
    id: anonymousId,
    name: "Guest User",
    email: null,
    isAnonymous: true,
    createdAt: localStorage.getItem("anonymousCreatedAt"),
  };
};

// Register with session migration
const register = async (name, email, password) => {
  const anonymousUserId = localStorage.getItem("anonymousUserId");

  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      password,
      anonymousUserId, // Include for migration
    }),
  });

  // ... handle response
};
```

---

## Testing Guide

### Test 1: Anonymous Session Creation

**Objective**: Verify anonymous users can create sessions without foreign key errors

```bash
# 1. Create session as anonymous user
curl -X POST http://localhost:5000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "b6b8561f-8fcb-4000-892a-457e1fd12f76"
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "sessionId": "session_...",
    "userId": null,
    "createdAt": "..."
  }
}

# 2. Check database
psql -U stripe_user -d stripe_support_db -c "
  SELECT session_id, user_id, metadata->>'anonymousUserId' as anonymous_id
  FROM conversation_sessions
  WHERE user_id IS NULL;
"

# Expected: Row with user_id = NULL and anonymous_id = UUID
```

### Test 2: Authenticated User Session

**Objective**: Verify registered users still work correctly

```bash
# 1. Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 2. Create session with auth token
curl -X POST http://localhost:5000/api/chat/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": "abc-123-def-456"
  }'

# Expected: Session with user_id = actual user ID
```

### Test 3: Session Migration

**Objective**: Verify anonymous sessions migrate when user registers

```bash
# 1. Create anonymous session
curl -X POST http://localhost:5000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-anonymous-uuid-123"
  }'

# 2. Register with anonymousUserId
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "anonymousUserId": "test-anonymous-uuid-123"
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "migrated": true,
    "migratedSessions": 1
  }
}

# 3. Verify migration in database
psql -U stripe_user -d stripe_support_db -c "
  SELECT session_id, user_id, metadata->>'anonymousUserId'
  FROM conversation_sessions
  WHERE user_id = '<new-user-id>';
"
```

### Test 4: Error Handling

**Objective**: Verify graceful handling of invalid UUIDs

```bash
# Test with invalid UUID format
curl -X POST http://localhost:5000/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "invalid-uuid-format"
  }'

# Expected: Should still work, treated as anonymous
```

---

## Troubleshooting

### Issue 1: Foreign Key Error Still Occurs

**Symptoms**:

```
❌ violates foreign key constraint "conversation_sessions_user_id_fkey"
```

**Solutions**:

1. **Verify migration ran successfully**:

   ```sql
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conname = 'conversation_sessions_user_id_fkey';
   ```

   Should show `ON DELETE SET NULL`

2. **Check if constraint allows NULL**:

   ```sql
   SELECT column_name, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'conversation_sessions'
     AND column_name = 'user_id';
   ```

   Should show `is_nullable = YES`

3. **Re-run migration script** if needed

### Issue 2: Sessions Not Migrating

**Symptoms**: `migratedSessions: 0` when registering

**Solutions**:

1. **Check metadata format**:

   ```sql
   SELECT session_id, user_id, metadata
   FROM conversation_sessions
   WHERE user_id IS NULL;
   ```

   Verify `metadata->>'anonymousUserId'` exists

2. **Verify anonymousUserId matches**:

   ```sql
   SELECT session_id, metadata->>'anonymousUserId'
   FROM conversation_sessions
   WHERE user_id IS NULL
     AND metadata->>'anonymousUserId' = 'your-uuid';
   ```

3. **Check logs** for migration errors

### Issue 3: Anonymous UUID Not Being Stored

**Symptoms**: Sessions created but `metadata.anonymousUserId` is missing

**Solutions**:

1. **Check backend logs** for "Anonymous user detected" message
2. **Verify UUID format** is valid
3. **Check code** at line 245 in `postgresMemoryService.js`

### Issue 4: Multiple Anonymous Sessions per User

**Symptoms**: One anonymous user creates multiple sessions

**Expected Behavior**: This is normal - each session gets its own row

- Migration will find all sessions with matching `anonymousUserId`
- All will be migrated together

---

## Related Files

### Backend Files

| File                                        | Purpose                     | Key Changes                        |
| ------------------------------------------- | --------------------------- | ---------------------------------- |
| `Backend/services/postgresMemoryService.js` | Core session creation logic | Anonymous detection, NULL handling |
| `Backend/controllers/authController.js`     | User registration           | Session migration logic            |
| `Backend/controllers/chatController.js`     | Chat endpoints              | Session creation endpoint          |
| `Backend/middleware/optionalAuth.js`        | Authentication middleware   | Anonymous user support             |
| `Backend/utils/migrate_anonymous_users.sql` | Database migration          | Foreign key constraint update      |

### Frontend Files

| File                                       | Purpose                | Key Features              |
| ------------------------------------------ | ---------------------- | ------------------------- |
| `Frontend/src/context/AuthContext.jsx`     | Authentication context | Anonymous user generation |
| `Frontend/src/components/SignupPrompt.jsx` | Signup modal           | Migration prompt          |

### Documentation Files

| File                                   | Purpose                              |
| -------------------------------------- | ------------------------------------ |
| `docs/ANONYMOUS_USER_FIX.md`           | This file - fix documentation        |
| `docs/multitenancy/ANONYMOUS_USERS.md` | Original anonymous user feature docs |

---

## Summary

### What Was Fixed

✅ **Foreign key constraint violation** - Anonymous users can now create sessions  
✅ **Session storage** - Anonymous sessions stored with `user_id = NULL`  
✅ **Metadata tracking** - Anonymous UUID stored for migration  
✅ **Session migration** - Anonymous sessions migrate when users register  
✅ **No data loss** - All chat history preserved during migration

### Key Technical Decisions

1. **NULL instead of fake user** - Semantically correct, avoids foreign key issues
2. **Metadata for tracking** - Allows finding anonymous sessions for migration
3. **Graceful degradation** - Migration errors don't break registration
4. **Backward compatible** - Existing authenticated users unaffected

### Database Schema

```sql
conversation_sessions
├─ session_id (VARCHAR, PRIMARY KEY)
├─ user_id (VARCHAR, NULLABLE, FOREIGN KEY → users.id)
├─ metadata (JSONB)
│  └─ anonymousUserId (stored here for anonymous users)
└─ created_at, updated_at, etc.
```

**Key Point**: `user_id` can be NULL, which is allowed by foreign key constraints.

---

## Additional Notes

- Anonymous users can create unlimited sessions (no hard limit)
- Each anonymous session stores its UUID in metadata
- Migration happens automatically when users register
- All related data (messages, Q&A pairs) migrate with sessions
- Frontend tracks message count separately for UX purposes

---

**Last Updated**: 2024-01-15  
**Version**: 1.0  
**Author**: Development Team
