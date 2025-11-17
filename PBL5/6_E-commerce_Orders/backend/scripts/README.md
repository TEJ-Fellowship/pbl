# Database Seeding & Replication Scripts

## Scripts Overview

### 1. `seedProducts.js` - Seed Products from JSON
Seeds products from `products.json` into PRIMARY database with idempotent upsert.

**Usage:**
```bash
npm run seed
```

**What it does:**
- Reads `docs/products.json`
- Maps category strings to UUIDs (creates categories if needed)
- Transforms JSON structure to database schema
- Upserts products (ON CONFLICT DO UPDATE based on SKU)
- Creates inventory records
- Verifies seeding results

**Output:**
- Shows created/updated/skipped counts
- Displays sample products
- Verifies data integrity

---

### 2. `checkReplication.js` - Replication Diagnostics
Checks replication status and provides fix recommendations.

**Usage:**
```bash
npm run check-replication
```

**What it checks:**
- PostgreSQL versions on all databases
- WAL level, max_wal_senders, max_replication_slots
- Publications on PRIMARY
- Subscriptions on REPLICAS
- Data consistency (row counts)
- Replication lag

**Output:**
- Detailed status report
- Recommended fix commands
- Data consistency verification

---

### 3. `syncReplicas.js` - One-time Data Sync
Syncs all data from PRIMARY to REPLICAS (for initial setup or recovery).

**Usage:**
```bash
npm run sync-replicas
```

**⚠️ Warning:** This will TRUNCATE and repopulate replica tables!

**What it does:**
- Fetches all data from PRIMARY
- Truncates replica tables
- Inserts data in batches
- Verifies sync completion

**When to use:**
- Initial replica setup
- After replication failure
- When replicas are out of sync

---

## Typical Workflow

### Initial Setup

1. **Seed products:**
   ```bash
   npm run seed
   ```

2. **Check replication status:**
   ```bash
   npm run check-replication
   ```

3. **If replication not configured, follow the fix commands from step 2**

4. **If replicas are empty, sync data:**
   ```bash
   npm run sync-replicas
   ```

5. **Verify replication:**
   ```bash
   npm run check-replication
   ```

### After Replication Fix

1. **Check replication:**
   ```bash
   npm run check-replication
   ```

2. **If data is missing on replicas:**
   ```bash
   npm run sync-replicas
   ```

3. **Test replication:**
   - Insert test product on PRIMARY
   - Check if it appears on REPLICAS within seconds

---

## Troubleshooting

### Seeding Fails

- Check database connection (`.env` file)
- Verify `products.json` exists at `docs/products.json`
- Check table schema matches JSON structure
- Look for duplicate SKU conflicts

### Replication Not Working

- Run `check-replication` to see exact issues
- Follow recommended fix commands
- Check PostgreSQL logs for errors
- Verify network connectivity between databases
- Ensure replication user has correct permissions

### Sync Fails

- Check all database connections
- Verify tables exist on all databases
- Check for foreign key constraints
- Review error messages for specific table issues

---

## Manual SQL Commands

### Check Replication Status (Primary)
```sql
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
SELECT * FROM pg_stat_replication;
```

### Check Subscription Status (Replica)
```sql
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;
```

### Check Data Counts
```sql
-- On each database
SELECT 
  (SELECT COUNT(*) FROM categories) as categories,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM inventory) as inventory,
  (SELECT COUNT(*) FROM orders) as orders;
```

### Test Replication
```sql
-- On PRIMARY
INSERT INTO products (id, title, price, sku, stock) 
VALUES (gen_random_uuid(), 'Test Product', 99.99, 'TEST-REPLICATION', 100);

-- On REPLICAS (should appear within seconds)
SELECT * FROM products WHERE sku = 'TEST-REPLICATION';
```

