# Replication Fix Runbook - Tier-1 Hotfix

## Root Cause Summary

1. **Products not seeded**: `products.json` data was never inserted into database tables
2. **Replication not configured**: Logical replication (publications/subscriptions) was not set up between PRIMARY and REPLICAS
3. **Tables exist but empty**: Schema was created but no data was populated

---

## Step-by-Step Fix

### Step 1: Seed Products into PRIMARY

```bash
cd backend
npm run seed
```

**Expected Output:**
```
✅ Connected to PRIMARY database
🔄 Starting product seeding...
📦 Found 30 products in JSON
✅ Processed 30/30 products...
✅ Seeding completed!
   Created: 30
   Updated: 0
   Skipped: 0
```

**Verify:**
```sql
-- On PRIMARY
SELECT COUNT(*) FROM products;  -- Should show 30
SELECT sku, title FROM products LIMIT 5;
```

---

### Step 2: Check Replication Status

```bash
npm run check-replication
```

**This will show:**
- PostgreSQL versions
- WAL level settings
- Publications (should be empty initially)
- Subscriptions (should be empty initially)
- Data consistency (will show mismatches)

**Expected Issues:**
- `wal_level` may not be `logical`
- No publications found
- No subscriptions found
- Replica product counts = 0

---

### Step 3: Fix Replication Configuration

#### 3.1 Enable Logical Replication on PRIMARY

**Connect to PRIMARY database:**
```sql
-- Check current settings
SHOW wal_level;
SHOW max_wal_senders;
SHOW max_replication_slots;

-- Enable logical replication (requires restart if not already set)
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;

-- Reload config (or restart PostgreSQL)
SELECT pg_reload_conf();
```

**⚠️ Note:** If `wal_level` was not `logical`, you may need to restart PostgreSQL:
```bash
# Linux
sudo systemctl restart postgresql

# Or check if reload worked
SHOW wal_level;  -- Should show 'logical'
```

#### 3.2 Create Replication User (if not exists)

```sql
-- On PRIMARY
CREATE USER replicator WITH REPLICATION PASSWORD 'your_secure_password';
GRANT CONNECT ON DATABASE your_database_name TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;
```

#### 3.3 Configure pg_hba.conf (if needed)

Add replication access (edit `pg_hba.conf` on PRIMARY):
```
host    replication     replicator      REPLICA1_IP/32         md5
host    replication     replicator      REPLICA2_IP/32         md5
host    all             replicator      REPLICA1_IP/32         md5
host    all             replicator      REPLICA2_IP/32         md5
```

Reload:
```sql
SELECT pg_reload_conf();
```

#### 3.4 Create Publication on PRIMARY

```sql
-- On PRIMARY
CREATE PUBLICATION ecommerce_pub FOR TABLE 
    categories, products, inventory, orders, order_items, payments;
```

**Verify:**
```sql
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
```

#### 3.5 Create Subscriptions on REPLICAS

**On REPLICA 1:**
```sql
CREATE SUBSCRIPTION sub_replica1
CONNECTION 'host=PRIMARY_HOST port=5432 dbname=DB_NAME user=replicator password=YOUR_PASSWORD sslmode=require'
PUBLICATION ecommerce_pub
WITH (
    copy_data = true,
    create_slot = true,
    enabled = true
);
```

**On REPLICA 2:**
```sql
CREATE SUBSCRIPTION sub_replica2
CONNECTION 'host=PRIMARY_HOST port=5432 dbname=DB_NAME user=replicator password=YOUR_PASSWORD sslmode=require'
PUBLICATION ecommerce_pub
WITH (
    copy_data = true,
    create_slot = true,
    enabled = true
);
```

**⚠️ Replace:**
- `PRIMARY_HOST` with your PRIMARY database host
- `DB_NAME` with your database name
- `YOUR_PASSWORD` with replicator password

**Verify:**
```sql
-- On each REPLICA
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;
```

---

### Step 4: Sync Data to Replicas

**Option A: Let replication copy data (if subscriptions created with `copy_data = true`)**
- Wait a few minutes for initial copy
- Check row counts on replicas

**Option B: Manual sync (if replication copy failed or tables already exist)**
```bash
npm run sync-replicas
```

**⚠️ Warning:** This will TRUNCATE replica tables and repopulate from PRIMARY.

---

### Step 5: Verify Replication

#### 5.1 Check Data Consistency

```bash
npm run check-replication
```

**Expected:**
- All databases show same product count (30)
- Publications exist on PRIMARY
- Subscriptions exist on REPLICAS
- Subscription status = "active"

#### 5.2 Test Real-time Replication

**On PRIMARY:**
```sql
INSERT INTO products (id, title, price, sku, stock, category_id) 
VALUES (
    gen_random_uuid(), 
    'Replication Test Product', 
    99.99, 
    'TEST-REPL-001', 
    100,
    (SELECT id FROM categories LIMIT 1)
);
```

**On REPLICAS (within 1-2 seconds):**
```sql
SELECT * FROM products WHERE sku = 'TEST-REPL-001';
```

**Expected:** Product should appear on both replicas.

#### 5.3 Check Replication Lag

**On REPLICAS:**
```sql
SELECT 
    subname,
    status,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), received_lsn)) as lag
FROM pg_stat_subscription;
```

**Expected:** Lag should be < 100ms under normal load.

---

## Verification Queries

### Row Counts (should match on all DBs)
```sql
-- Run on PRIMARY, REPLICA 1, REPLICA 2
SELECT 
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM products) as products,
    (SELECT COUNT(*) FROM inventory) as inventory,
    (SELECT COUNT(*) FROM orders) as orders;
```

### Sample Products (should match)
```sql
-- Run on all databases
SELECT id, sku, title, price, stock 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;
```

### Replication Status (PRIMARY)
```sql
SELECT 
    pid,
    application_name,
    client_addr,
    state,
    sync_state,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), replay_location)) as lag
FROM pg_stat_replication;
```

### Subscription Status (REPLICAS)
```sql
SELECT 
    subname,
    status,
    latest_end_lsn,
    latest_end_time
FROM pg_stat_subscription;
```

---

## Rollback Plan

### If Replication Setup Fails

1. **Remove subscriptions:**
   ```sql
   -- On each REPLICA
   DROP SUBSCRIPTION IF EXISTS sub_replica1;
   DROP SUBSCRIPTION IF EXISTS sub_replica2;
   ```

2. **Remove publication:**
   ```sql
   -- On PRIMARY
   DROP PUBLICATION IF EXISTS ecommerce_pub;
   ```

3. **Revert WAL level (if needed):**
   ```sql
   -- On PRIMARY
   ALTER SYSTEM SET wal_level = 'replica';  -- or previous value
   SELECT pg_reload_conf();
   ```

4. **Manual sync as fallback:**
   ```bash
   npm run sync-replicas
   ```

### If Seeding Fails

1. **Check for partial data:**
   ```sql
   SELECT COUNT(*) FROM products;
   ```

2. **Clear and reseed:**
   ```sql
   TRUNCATE TABLE products CASCADE;
   TRUNCATE TABLE inventory CASCADE;
   ```
   Then run `npm run seed` again.

---

## Configuration Files Changed

### postgresql.conf (PRIMARY)
```ini
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10
```

### pg_hba.conf (PRIMARY)
```
host    replication     replicator      REPLICA1_IP/32         md5
host    replication     replicator      REPLICA2_IP/32         md5
host    all             replicator      REPLICA1_IP/32         md5
host    all             replicator      REPLICA2_IP/32         md5
```

---

## Expected Final State

✅ **PRIMARY:**
- 30 products seeded
- Publication `ecommerce_pub` exists
- WAL level = `logical`

✅ **REPLICA 1:**
- 30 products (synced from PRIMARY)
- Subscription `sub_replica1` active
- Data matches PRIMARY

✅ **REPLICA 2:**
- 30 products (synced from PRIMARY)
- Subscription `sub_replica2` active
- Data matches PRIMARY

✅ **Replication:**
- Lag < 100ms
- New inserts propagate within seconds
- Updates propagate within seconds

---

## Troubleshooting

### Issue: "wal_level must be set to logical"
**Fix:** Restart PostgreSQL after setting `wal_level = logical`

### Issue: "subscription already exists"
**Fix:** Drop existing subscription first:
```sql
DROP SUBSCRIPTION sub_replica1;
```

### Issue: "publication does not exist"
**Fix:** Create publication on PRIMARY first

### Issue: "permission denied for user replicator"
**Fix:** Grant proper permissions:
```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
```

### Issue: "connection refused"
**Fix:** Check network connectivity, firewall rules, and pg_hba.conf

---

## Success Criteria

1. ✅ `products` table on PRIMARY contains 30 records from `products.json`
2. ✅ After seeding, same product rows exist on both replicas (30 products each)
3. ✅ A new insert on PRIMARY appears on replicas within 2 seconds
4. ✅ Replication lag < 100ms under test load
5. ✅ All verification queries return matching results

---

## Commands Summary

```bash
# 1. Seed products
npm run seed

# 2. Check replication
npm run check-replication

# 3. Sync replicas (if needed)
npm run sync-replicas

# 4. Verify again
npm run check-replication
```

---

**Analysis Completed — Ready to Execute**

## Architectural Summary

**Fix Architecture:**
1. **Seeding Layer**: Node.js script reads `products.json`, transforms data, and upserts into PRIMARY using Sequelize (idempotent, transaction-safe)
2. **Replication Layer**: PostgreSQL logical replication with publications (PRIMARY) and subscriptions (REplicas) streams WAL changes in real-time
3. **Sync Layer**: One-time data copy script for initial population or recovery scenarios

**Data Flow:**
```
products.json → seedProducts.js → PRIMARY DB → Logical Replication → REPLICA 1 & REPLICA 2
```

**Replication Method:** PostgreSQL Logical Replication (WAL streaming) with automatic conflict resolution and < 100ms typical lag.

