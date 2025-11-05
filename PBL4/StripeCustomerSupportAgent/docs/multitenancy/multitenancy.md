# 🏗️ Multitenancy Architecture for Stripe Customer Support Agent

## 1. What is Multitenancy?

**Multitenancy** means a single application instance serves multiple **users** (individuals or organizations), while keeping their data **isolated and secure**.

Each user experiences the system as if it were dedicated to them — but in reality, the backend and infrastructure are shared.

### 🧠 Example

- User A → Their customers, support tickets, Stripe payments
- User B → Their own isolated set of data
- User C → Completely separate data

All use the **same backend**, **same database tables**, but are separated by a `user_id` column.

---

## 2. Why Multitenancy Matters

| Benefit             | Description                                                 |
| ------------------- | ----------------------------------------------------------- |
| **Efficiency**      | One app instance supports many users — cheaper and scalable |
| **Maintainability** | Centralized code updates and deployments                    |
| **Customization**   | Each user can have unique configurations or integrations    |
| **Security**        | Data is isolated so one user can't access another's data    |
| **Simplicity**      | Shared schema is easiest to implement and maintain          |

---

## 3. PostgreSQL Multitenancy Models

In PostgreSQL, there are three main ways to design multitenancy:

| Model                 | Description                                           | Pros                               | Cons                             |
| --------------------- | ----------------------------------------------------- | ---------------------------------- | -------------------------------- |
| **Shared Schema** ⭐  | All users share tables, separated by `user_id` column | Simple, efficient, easy migrations | Requires careful query filtering |
| **Separate Schema**   | One database, but each user has their own schema      | Strong isolation, easy backup      | More complex migrations          |
| **Separate Database** | One database per user                                 | Maximum isolation                  | Expensive, complex to scale      |

**⭐ We are using Shared Schema** — it's the simplest approach for multi-user applications.

---

## 4. Shared Schema Implementation (Our Approach)

### 🗃️ How It Works

All users share the same database tables, but each row is tagged with a `user_id` column:

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Each user only sees their own data
SELECT * FROM customers WHERE user_id = 'user-123';
```

#### ✅ Why Shared Schema is Great for Multi-User Apps

- **Simple Setup** — No complex schema management needed
- **Easy Maintenance** — One schema, one set of migrations
- **Cost Efficient** — Optimal resource utilization
- **Fast Queries** — PostgreSQL optimizes well with indexed user_id
- **Perfect for SaaS** — Industry-standard for user-based applications

#### 🔒 Important Security Considerations

- **Always filter by user_id** in every query
- **Use middleware** to automatically inject user context
- **Validate user_id** from authenticated user
- **Create database indexes** on user_id columns
- **Use Row Level Security (RLS)** for extra protection (optional)

---

## 5. Other Approaches (For Reference)

### 🏗️ Separate Schema Approach

Each tenant gets its own schema (not used in our implementation):

```sql
-- User A Schema
user_a.customers
user_a.tickets

-- User B Schema
user_b.customers
user_b.tickets
```

**Pros:** Stronger isolation, easier per-user backups  
**Cons:** Complex migrations, more admin overhead

### 🗄️ Separate Database Approach

Each tenant gets their own database (not used in our implementation):

**Pros:** Maximum isolation  
**Cons:** Very expensive, difficult to scale, complex connection management

---

## 6. Shared Schema Implementation Steps

### 🥇 Step 1: Create Users Table

First, create a table to store all users:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_id ON users(stripe_customer_id);
```

---

### 🥈 Step 2: Add user_id to All Data Tables

Every table that holds user-specific data must have a `user_id` column:

```sql
-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL, -- 'agent', 'customer', 'ai'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🥉 Step 3: Create Indexes on user_id

**Critical for performance!** Every table needs an index on `user_id`:

```sql
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);

-- Composite indexes for common queries
CREATE INDEX idx_tickets_user_status ON tickets(user_id, status);
CREATE INDEX idx_messages_user_ticket ON messages(user_id, ticket_id);
```

---

### 🧠 Step 4: Implement User Context Middleware

In your Node.js/Express application, create middleware to extract user ID from the authenticated user:

```javascript
// middleware/userContext.js
const userContext = (req, res, next) => {
  // Get user_id from JWT token (set during authentication)
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Store user_id in request object for easy access
  req.userId = userId;

  next();
};

module.exports = userContext;
```

Usage in your routes:

```javascript
const express = require("express");
const router = express.Router();
const authenticateToken = require("./middleware/auth");
const userContext = require("./middleware/userContext");

// Apply to all routes that need user isolation
router.use(authenticateToken); // First authenticate
router.use(userContext); // Then set user context

router.get("/customers", async (req, res) => {
  const { userId } = req;

  // Always filter by user_id
  const customers = await db.query(
    "SELECT * FROM customers WHERE user_id = $1",
    [userId]
  );

  res.json(customers.rows);
});
```

---

### 🔒 Step 5: Security Best Practices

#### 1. **Always Filter Queries by user_id**

```javascript
// ❌ BAD - No user filtering
const tickets = await db.query("SELECT * FROM tickets");

// ✅ GOOD - Always filter by user
const tickets = await db.query("SELECT * FROM tickets WHERE user_id = $1", [
  req.userId,
]);
```

#### 2. **Validate Ownership on Updates/Deletes**

```javascript
// Update ticket - verify it belongs to the user
const result = await db.query(
  "UPDATE tickets SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
  [newStatus, ticketId, req.userId]
);

if (result.rowCount === 0) {
  return res.status(404).json({ error: "Ticket not found" });
}
```

#### 3. **Use Prepared Statements (Always!)**

```javascript
// ❌ NEVER do this - SQL injection risk!
const query = `SELECT * FROM customers WHERE user_id = '${userId}'`;

// ✅ Always use parameterized queries
const result = await db.query("SELECT * FROM customers WHERE user_id = $1", [
  userId,
]);
```

---

### 🛡️ Step 6: Optional - PostgreSQL Row Level Security (RLS)

For extra security, enable Row Level Security:

```sql
-- Enable RLS on tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy for customers table
CREATE POLICY user_isolation_policy ON customers
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_isolation_policy ON tickets
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_isolation_policy ON messages
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

Then in your application:

```javascript
// Set user context at database level
await db.query("SET app.current_user_id = $1", [userId]);

// Now queries automatically filter by user (RLS enforces it)
const customers = await db.query("SELECT * FROM customers");
```

---

### 🧱 Step 7: Database Migration Strategy

When you need to add columns or modify tables:

```sql
-- Simple ALTER TABLE works for all tenants
ALTER TABLE customers ADD COLUMN phone TEXT;
ALTER TABLE tickets ADD COLUMN priority VARCHAR(50) DEFAULT 'medium';
```

No need to loop through schemas — one migration applies to all users!

---

### 📊 Step 8: Analytics and Reporting

You can easily query across users for admin/analytics:

```sql
-- Total tickets per user
SELECT
  u.name AS user_name,
  u.email,
  COUNT(t.id) AS ticket_count
FROM users u
LEFT JOIN tickets t ON t.user_id = u.id
GROUP BY u.id, u.name, u.email
ORDER BY ticket_count DESC;

-- System-wide statistics
SELECT
  COUNT(DISTINCT user_id) AS total_users,
  COUNT(*) AS total_tickets
FROM tickets
WHERE created_at >= NOW() - INTERVAL '30 days';
```

---

## 7. Visual Diagram - Shared Schema Architecture

```
                           ┌─────────────────────┐
                           │    Application      │
                           │  (Single Instance)  │
                           └──────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  PostgreSQL         │
                           │  (Single Database)  │
                           └──────────┬──────────┘
                                      │
                         ┌────────────▼────────────┐
                         │   Shared Tables         │
                         │  with user_id column    │
                         └────────────┬────────────┘
                                      │
          ┌───────────────────────────┼────────────────────────────┐
          │                           │                            │
   ┌────────────┐              ┌────────────┐               ┌────────────┐
   │  User A    │              │  User B    │               │  User C    │
   │  user_id:  │              │  user_id:  │               │  user_id:  │
   │  uuid-aaa  │              │  uuid-bbb  │               │  uuid-ccc  │
   └────────────┘              └────────────┘               └────────────┘
        │                           │                            │
   Filtered by                 Filtered by                 Filtered by
   WHERE user_id=uuid-aaa      WHERE user_id=uuid-bbb      WHERE user_id=uuid-ccc
```

All users share the same tables, filtered by `user_id`.

---

## 8. Why Shared Schema is Perfect for Your Use Case

Your Stripe Customer Support Agent integrates:

- 🧾 **Stripe API** (per-user payment & customer data)
- 💬 **Support tickets** (customer issues, chat logs)
- 🧠 **RAG + MCP integrations** (AI-assisted support responses)
- 👤 **Multiple users** (each managing their own support operations)

### ✅ Why Shared Schema Works Best

| Reason                   | Explanation                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| **Simplicity**           | Easy to implement and maintain with standard SQL queries         |
| **User-Level Isolation** | Each user has their own data, isolated by user_id                |
| **Easy Migrations**      | One migration applies to all users automatically                 |
| **Cost Efficient**       | Single database handles all users without complex infrastructure |
| **Perfect for SaaS**     | Industry-standard approach for user-based applications           |
| **Stripe Integration**   | Store per-user Stripe customer IDs easily in users table         |
| **Analytics Friendly**   | Easy to generate reports across users or per-user                |
| **Rapid Development**    | Focus on features, not complex schema management                 |

---

## 9. Summary - Implementation Checklist

| Step | Task                                                 | Status |
| ---- | ---------------------------------------------------- | ------ |
| 1    | Create `users` table with user info                  | ⬜     |
| 2    | Add `user_id` column to all data tables              | ⬜     |
| 3    | Create indexes on `user_id` columns                  | ⬜     |
| 4    | Implement user context middleware                    | ⬜     |
| 5    | Update all queries to filter by `user_id`            | ⬜     |
| 6    | Validate ownership on all updates/deletes            | ⬜     |
| 7    | Test data isolation between users                    | ⬜     |
| 8    | Optional: Enable PostgreSQL Row Level Security (RLS) | ⬜     |
| 9    | Integrate Stripe API with per-user customer IDs      | ⬜     |

---

## 10. Next Steps for Implementation

### 🎯 Immediate Actions

1. **Create Database Schema**
   - Run the SQL scripts from Step 1 and Step 2
   - Add indexes from Step 3
2. **Update Authentication**

   - Ensure JWT tokens include `id` (user ID)
   - Create or update user registration to create user records

3. **Add Middleware**

   - Implement `userContext` middleware
   - Apply to all protected routes

4. **Refactor Queries**

   - Update all database queries to include `WHERE user_id = $1`
   - Validate ownership on updates/deletes

5. **Testing**
   - Create test users
   - Verify data isolation
   - Test cross-user access prevention

### 📚 Additional Resources

- **PostgreSQL Indexes:** Optimize query performance with proper indexing
- **Row Level Security:** Add database-level user isolation
- **JWT Best Practices:** Secure token generation and validation
- **Stripe API Integration:** Store and use per-user Stripe customer IDs

---

**Author:** TEJ Fellowship – PBL4: Stripe Customer Support Agent  
**Database:** PostgreSQL  
**Architecture:** Shared Schema Multitenancy (user_id column)  
**Implementation:** Simple, Efficient, Production-Ready
