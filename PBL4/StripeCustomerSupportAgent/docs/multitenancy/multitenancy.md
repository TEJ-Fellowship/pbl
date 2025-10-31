# 🏗️ Multitenancy Architecture for Stripe Customer Support Agent

## 1. What is Multitenancy?

**Multitenancy** means a single application instance serves multiple **tenants** (clients, organizations, or users), while keeping their data **isolated and secure**.

Each tenant experiences the system as if it were dedicated to them — but in reality, the backend and infrastructure are shared.

### 🧠 Example

- Tenant A → Company Alpha → Their customers, support tickets, Stripe payments
- Tenant B → Company Beta → Their own isolated set of data

Both use the **same backend**, but **different logical data spaces**.

---

## 2. Why Multitenancy Matters

| Benefit             | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| **Efficiency**      | One app instance supports many clients — cheaper and scalable |
| **Maintainability** | Centralized code updates and deployments                      |
| **Customization**   | Each tenant can have unique configurations or integrations    |
| **Security**        | Data is isolated so one tenant can’t access another’s data    |

---

## 3. PostgreSQL Multitenancy Models

In PostgreSQL, there are three main ways to design multitenancy:

| Model                 | Description                                               | Pros                          | Cons                              |
| --------------------- | --------------------------------------------------------- | ----------------------------- | --------------------------------- |
| **Shared Schema**     | All tenants share tables, separated by `tenant_id` column | Simple, efficient             | Weak isolation, easy to leak data |
| **Separate Schema**   | One database, but each tenant has their own schema        | Strong isolation, easy backup | More complex migrations           |
| **Separate Database** | One database per tenant                                   | Maximum isolation             | Expensive, complex to scale       |

---

## 4. Shared vs Separate Schema — Comparison

### 🗃️ Shared Schema Example

All tenants share one schema with a `tenant_id` column:

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name TEXT,
  email TEXT
);

SELECT * FROM customers WHERE tenant_id = 'tenant_alpha';
```

#### ✅ Advantages

- Easy setup
- One schema to maintain
- Simple migrations

#### ❌ Disadvantages

- Weak isolation (risk of leaking data)
- Hard to back up individual tenants
- Huge tables over time
- Requires `WHERE tenant_id = ...` everywhere

---

### 🏗️ Separate Schema Example

Each tenant gets its own schema:

```sql
-- Tenant Alpha
tenant_alpha.customers
tenant_alpha.tickets

-- Tenant Beta
tenant_beta.customers
tenant_beta.tickets
```

You switch between tenants using:

```sql
SET search_path TO tenant_alpha;
SELECT * FROM customers;
```

#### ✅ Advantages

- Strong data isolation
- Easier per-tenant backup and debugging
- No need for tenant_id filters
- Customization possible per tenant

#### ❌ Disadvantages

- Need automation for migrations
- Slightly more admin overhead
- More complex analytics across tenants

---

## 5. PostgreSQL Implementation Steps (Recommended: Separate Schema)

### 🥇 Step 1: Tenant Registry

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🥈 Step 2: Base Template Schema

```sql
-- Schema: base_template
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  issue TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 🥉 Step 3: Create Schema Per Tenant

When a new tenant signs up:

```sql
CREATE SCHEMA tenant_alpha;
CREATE TABLE tenant_alpha.customers (LIKE base_template.customers INCLUDING ALL);
CREATE TABLE tenant_alpha.tickets (LIKE base_template.tickets INCLUDING ALL);
```

In Node.js:

```ts
await db.query(`CREATE SCHEMA tenant_${slug}`);
await db.query(
  `CREATE TABLE tenant_${slug}.customers (LIKE base_template.customers INCLUDING ALL)`
);
await db.query(
  `CREATE TABLE tenant_${slug}.tickets (LIKE base_template.tickets INCLUDING ALL)`
);
```

---

### 🧠 Step 4: Set Tenant Context per Request

Determine tenant from:

- Subdomain (`alpha.app.com`)
- JWT Token with `tenant_id`
- API key header

Then set schema dynamically:

```sql
SET search_path TO tenant_alpha;
SELECT * FROM customers;
```

In Node.js:

```ts
await db.query(`SET search_path TO tenant_${tenantSlug}`);
const customers = await db.query(`SELECT * FROM customers`);
```

Reset after request:

```ts
await db.query("RESET search_path");
```

---

### 🔒 Step 5: Security Rules

- Validate tenant slugs (`^[a-z0-9_]+$`)
- Reset `search_path` after each request
- No cross-tenant joins or global queries without admin rights

---

### 🧱 Step 6: Migrations and Updates

When schema changes:

- Maintain a base template migration
- Run updates for all tenant schemas:
  ```bash
  psql -d mydb -c "ALTER TABLE tenant_alpha.customers ADD COLUMN phone TEXT;"
  ```
- Automate with scripts that loop over:
  ```sql
  SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';
  ```

---

### 🌐 Step 7: Global Shared Schema

For common tables:

```sql
CREATE SCHEMA global;
CREATE TABLE global.analytics (...);
```

Then:

```sql
SET search_path TO tenant_alpha, global;
```

---

## 6. Visual Diagram

```
                           ┌─────────────────────┐
                           │    Application      │
                           │  (Single Instance)  │
                           └──────────┬──────────┘
                                      │
          ┌───────────────────────────┼────────────────────────────┐
          │                           │                            │
   ┌────────────┐              ┌────────────┐               ┌────────────┐
   │ Tenant A   │              │ Tenant B   │               │ Tenant C   │
   │ (Schema A) │              │ (Schema B) │               │ (Schema C) │
   └──────┬─────┘              └──────┬─────┘               └──────┬─────┘
          │                           │                            │
   customers, tickets          customers, tickets           customers, tickets
```

Each schema is isolated but managed by the same app.

---

## 7. In Your Case — Stripe Customer Support Agent

Your project integrates:

- 🧾 **Stripe** (per-tenant payment & customer data)
- 💬 **Support tickets** (customer issues, chat logs)
- 🧠 **RAG + MCP integrations** (AI-assisted support responses)

### ✅ Why Separate Schema is Best for You

| Reason                   | Explanation                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| **Data Privacy**         | Each company’s customers, transactions, and tickets must be isolated      |
| **Compliance**           | Stripe data requires secure logical boundaries                            |
| **Easy Backups**         | You can backup or restore one company’s schema without touching others    |
| **Debugging**            | You can query one tenant’s data easily (`tenant_alpha.*`)                 |
| **PostgreSQL Advantage** | PostgreSQL handles thousands of schemas efficiently with minimal overhead |
| **Scalable Growth**      | When new clients onboard, you simply generate a new schema dynamically    |

---

## 8. Summary

| Step | Description                                 |
| ---- | ------------------------------------------- |
| 1    | Choose schema-per-tenant strategy           |
| 2    | Create tenant registry table                |
| 3    | Maintain base template schema               |
| 4    | Dynamically create schema per new tenant    |
| 5    | Set schema search path on each request      |
| 6    | Secure tenant routing & prevent leaks       |
| 7    | Manage per-tenant migrations                |
| 8    | Add global schema for shared resources      |
| 9    | Monitor and test tenant isolation regularly |

---

## 9. Next Steps

- [ ] Implement tenant creation API
- [ ] Add middleware for tenant resolution
- [ ] Automate schema creation & migrations
- [ ] Integrate with Stripe API (store `stripe_customer_id` per tenant)
- [ ] Test data isolation with multiple tenants

---

**Author:** TEJ Fellowship – PBL4: Stripe Customer Support Agent  
**Database:** PostgreSQL  
**Recommended Architecture:** Separate Schema Multitenancy
