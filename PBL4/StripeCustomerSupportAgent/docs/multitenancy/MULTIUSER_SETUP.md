# 🎯 Multi-User Setup Guide

Complete step-by-step guide to set up and test multi-user functionality for the Stripe Customer Support Agent.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ PostgreSQL installed and running
- ✅ Node.js 18+ installed
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ✅ Database already set up (ran `setup-database.js`)

## 🚀 Step-by-Step Setup

### Step 1: Install Required Packages

```bash
# Navigate to backend
cd Backend

# Install new authentication packages
npm install bcryptjs jsonwebtoken

# Verify installation
npm list bcryptjs jsonwebtoken
```

### Step 2: Update Environment Variables

Edit your `.env` file and add/update:

```bash
# Security & Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
JWT_EXPIRATION=7d
```

**🔐 Important:** Generate a secure JWT_SECRET:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64
```

### Step 3: Run Database Migration

```bash
# Still in Backend directory
node setup-multiuser.js
```

**Expected Output:**

```
🚀 Setting up multi-user functionality...
============================================================
🔍 Testing database connection...
✅ Connected to PostgreSQL successfully
📋 Reading multi-user schema...
🔧 Creating users table and adding user_id columns...
✅ Multi-user schema created successfully

📊 Users table structure:
   • id (uuid) NOT NULL
   • name (character varying)
   • email (character varying) NOT NULL
   • password_hash (text) NOT NULL
   • stripe_customer_id (character varying)
   • is_active (boolean)
   • created_at (timestamp without time zone)
   • updated_at (timestamp without time zone)

✅ user_id column added to conversation_sessions
✅ user_statistics view created
============================================================
🎉 Multi-user setup completed successfully!
```

### Step 4: Start the Backend Server

```bash
# In Backend directory
npm run dev

# Or with production mode
node index.js
```

**Verify Auth Routes:**

```bash
# Test auth endpoint
curl http://localhost:5000/api/auth/test

# Expected response:
{
  "success": true,
  "message": "Auth routes are working!",
  "endpoints": {
    "public": ["/register", "/login", "/refresh"],
    "protected": ["/profile", "/password", "/account"]
  }
}
```

### Step 5: Start the Frontend

```bash
# Navigate to frontend
cd ../Frontend

# Start development server
npm run dev
```

**Access Points:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Login Page: http://localhost:5173/login
- Signup Page: http://localhost:5173/signup

## 🧪 Testing Multi-User Functionality

### Test 1: User Registration

**Via Frontend:**

1. Navigate to http://localhost:5173/signup
2. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Confirm Password: test123
3. Click "Create Account"
4. Should redirect to dashboard

**Via API:**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "Test User",
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

### Test 2: User Login

**Via Frontend:**

1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - Email: test@example.com
   - Password: test123
3. Click "Sign in"
4. Should redirect to dashboard

**Via API:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Test 3: Access Protected Routes

**Get User Profile:**

```bash
# Replace YOUR_TOKEN with actual token from login/register
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Test User",
      "email": "test@example.com",
      "stripeCustomerId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "statistics": {
        "totalSessions": 0,
        "totalMessages": 0,
        "totalTokensUsed": 0,
        "lastActivity": null
      }
    }
  }
}
```

### Test 4: Test Data Isolation

**Create Multiple Users:**

```bash
# User 1
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User One",
    "email": "user1@example.com",
    "password": "password1"
  }'

# User 2
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Two",
    "email": "user2@example.com",
    "password": "password2"
  }'
```

**Test Isolation:**

1. Login as User 1, create a chat session
2. Login as User 2, verify they cannot see User 1's chats
3. Check database to verify user_id filtering

### Test 5: Token Verification

**Verify Token:**

```bash
curl http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Refresh Token:**

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🔍 Database Verification

### Check Users Table

```sql
-- Connect to PostgreSQL
psql -U postgres -d stripe_support_db

-- View users
SELECT id, name, email, created_at FROM users;

-- Check user statistics
SELECT * FROM user_statistics;

-- Verify user_id in conversation_sessions
SELECT session_id, user_id, created_at FROM conversation_sessions LIMIT 5;
```

## 🛠️ Troubleshooting

### Issue: "JWT_SECRET is not defined"

**Solution:**

```bash
# Make sure .env file has JWT_SECRET
echo "JWT_SECRET=your_secret_key_here" >> .env

# Restart backend server
```

### Issue: "users table does not exist"

**Solution:**

```bash
# Run the migration again
node setup-multiuser.js

# If still fails, check database connection
node -e "require('./config/database.js').default.query('SELECT NOW()')"
```

### Issue: "Cannot read property 'id' of undefined"

**Solution:**

- Token is invalid or expired
- Check if Authorization header is set correctly
- Try logging in again to get a fresh token

### Issue: Frontend shows CORS error

**Solution:**

```javascript
// In Backend/index.js, verify CORS is configured:
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
```

### Issue: "Email already exists"

**Solution:**

- User already registered with that email
- Use a different email or login instead
- Or delete existing user from database:

```sql
DELETE FROM users WHERE email = 'test@example.com';
```

## 📊 Monitoring & Maintenance

### Check Active Users

```sql
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users
FROM users;
```

### User Activity Report

```sql
SELECT
  u.name,
  u.email,
  s.total_sessions,
  s.total_messages,
  s.last_activity
FROM users u
LEFT JOIN user_statistics s ON s.user_id = u.id
ORDER BY s.last_activity DESC;
```

### Clean Up Test Users

```sql
-- Delete test users (THIS IS PERMANENT!)
DELETE FROM users WHERE email LIKE '%@example.com';
```

## 🎉 Success Checklist

- ✅ Backend server running without errors
- ✅ Frontend accessible on http://localhost:5173
- ✅ Can access signup page (/signup)
- ✅ Can create new user account
- ✅ Can login with credentials
- ✅ Protected routes require authentication
- ✅ User profile displays correctly
- ✅ Multiple users are isolated from each other
- ✅ Token refresh works
- ✅ Logout clears authentication

## 🚀 Next Steps

1. **Update Chat Services** - Add user_id filtering to chat controllers
2. **Update Memory Service** - Filter conversation history by user_id
3. **Add User Profile Page** - Create UI for profile management
4. **Implement Password Reset** - Add forgot password functionality
5. **Add Email Verification** - Verify user emails
6. **Set Up Rate Limiting** - Prevent abuse
7. **Add User Roles** - Admin vs regular user permissions
8. **Deploy to Production** - See deployment guidelines

## 📚 Additional Resources

- **Authentication Best Practices**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **JWT Guide**: https://jwt.io/introduction
- **PostgreSQL Row Level Security**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Questions or Issues?**
Refer to the multitenancy documentation in `docs/multitenancy/multitenancy.md`
