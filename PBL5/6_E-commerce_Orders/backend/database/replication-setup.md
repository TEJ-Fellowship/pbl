# PostgreSQL Replication Setup Guide

## Overview

This guide explains how to set up PostgreSQL logical replication between the Primary database and two Replica databases for Tier-1 implementation.

## Architecture

```
PRIMARY DB (Write Source of Truth)
    │
    ├── REPLICA 1 (Read-only)
    └── REPLICA 2 (Read-only)
```

## Prerequisites

- PostgreSQL 12+ (logical replication requires PostgreSQL 10+)
- All three databases accessible from application servers
- Network connectivity between databases

## Step 1: Configure Primary Database

### 1.1 Enable Logical Replication

Edit `postgresql.conf` on PRIMARY:

```ini
# Enable logical replication
wal_level = logical
max_replication_slots = 4  # At least 2 for replicas + buffer
max_wal_senders = 4        # At least 2 for replicas + buffer
```

### 1.2 Configure pg_hba.conf

Add replication access for replica servers:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    replication     replicator      192.168.1.0/24         md5
host    all             replicator      192.168.1.0/24         md5
```

### 1.3 Create Replication User

```sql
-- On PRIMARY database
CREATE USER replicator WITH REPLICATION PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE your_database_name TO replicator;
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;
```

### 1.4 Create Publication

```sql
-- On PRIMARY database
CREATE PUBLICATION pub_all_tables FOR ALL TABLES;

-- Or selectively:
CREATE PUBLICATION pub_ecommerce FOR TABLE 
    categories, products, inventory, orders, order_items, payments;
```

## Step 2: Configure Replica Databases

### 2.1 Create Replica Databases

On each replica server, create an empty database with the same schema:

```bash
# On REPLICA 1 and REPLICA 2
createdb -U postgres your_database_name
```

### 2.2 Apply Schema

Apply the same schema from `schema.sql` to both replicas:

```bash
psql -U postgres -d your_database_name -f schema.sql
```

### 2.3 Create Subscription (Replica 1)

```sql
-- On REPLICA 1 database
CREATE SUBSCRIPTION sub_replica1
CONNECTION 'host=primary_db_host port=5432 dbname=your_database_name user=replicator password=secure_password_here'
PUBLICATION pub_all_tables
WITH (
    copy_data = true,
    create_slot = true,
    enabled = true
);
```

### 2.4 Create Subscription (Replica 2)

```sql
-- On REPLICA 2 database
CREATE SUBSCRIPTION sub_replica2
CONNECTION 'host=primary_db_host port=5432 dbname=your_database_name user=replicator password=secure_password_here'
PUBLICATION pub_all_tables
WITH (
    copy_data = true,
    create_slot = true,
    enabled = true
);
```

## Step 3: Verify Replication

### 3.1 Check Publication Status (Primary)

```sql
-- On PRIMARY
SELECT * FROM pg_publication;
SELECT * FROM pg_publication_tables;
```

### 3.2 Check Subscription Status (Replicas)

```sql
-- On REPLICA 1 and REPLICA 2
SELECT * FROM pg_subscription;
SELECT * FROM pg_stat_subscription;
```

### 3.3 Test Replication

```sql
-- On PRIMARY: Insert test data
INSERT INTO products (title, price, sku, stock) 
VALUES ('Test Product', 99.99, 'TEST-001', 100);

-- On REPLICA 1 and REPLICA 2: Verify data appears
SELECT * FROM products WHERE sku = 'TEST-001';
```

### 3.4 Monitor Replication Lag

```sql
-- On REPLICA 1 and REPLICA 2
SELECT 
    subname,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), received_lsn)) as lag
FROM pg_stat_subscription;
```

## Step 4: Application Configuration

The application automatically routes:
- **WRITE operations** → PRIMARY database
- **READ operations** → REPLICA databases (round-robin or least-connections)

See `utils/db.js` for connection pooling and read/write splitting.

## Monitoring & Maintenance

### Check Replication Lag

```sql
-- On each replica
SELECT 
    application_name,
    state,
    sync_state,
    pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), latest_end_lsn)) as lag
FROM pg_stat_replication;
```

### Handle Replication Errors

```sql
-- On replica, check for errors
SELECT * FROM pg_stat_subscription WHERE subname = 'sub_replica1';

-- If errors occur, check logs:
-- /var/log/postgresql/postgresql-*.log
```

### Resync Replica (if needed)

```sql
-- On REPLICA: Drop and recreate subscription
DROP SUBSCRIPTION sub_replica1;

CREATE SUBSCRIPTION sub_replica1
CONNECTION 'host=primary_db_host port=5432 dbname=your_database_name user=replicator password=secure_password_here'
PUBLICATION pub_all_tables
WITH (
    copy_data = true,
    create_slot = true,
    enabled = true
);
```

## Failover Procedure (Future)

If PRIMARY fails:

1. **Promote Replica to Primary:**
   ```sql
   -- On REPLICA 1
   ALTER SUBSCRIPTION sub_replica1 DISABLE;
   -- Update application to point writes to REPLICA 1
   ```

2. **Reconfigure Remaining Replicas:**
   ```sql
   -- On REPLICA 2
   DROP SUBSCRIPTION sub_replica2;
   CREATE SUBSCRIPTION sub_replica2
   CONNECTION 'host=new_primary_host ...'
   PUBLICATION pub_all_tables;
   ```

## Performance Considerations

- **Replication Lag**: Typically < 100ms for logical replication
- **Network**: Ensure low latency between PRIMARY and REPLICAS
- **WAL Size**: Monitor WAL size on PRIMARY; archive old WAL files
- **Connection Pooling**: Use PgBouncer for connection management

## Security

- Use strong passwords for replication user
- Restrict network access (firewall rules)
- Use SSL/TLS for replication connections:
  ```sql
  CREATE SUBSCRIPTION sub_replica1
  CONNECTION 'host=primary_db_host ... sslmode=require'
  ...
  ```

## Troubleshooting

### Replication Not Working

1. Check PostgreSQL logs on both PRIMARY and REPLICA
2. Verify network connectivity
3. Check user permissions
4. Verify `wal_level = logical` on PRIMARY

### High Replication Lag

1. Check network latency
2. Monitor PRIMARY write load
3. Consider increasing `max_wal_senders`
4. Check for long-running transactions on PRIMARY

### Subscription Errors

```sql
-- Check subscription status
SELECT * FROM pg_stat_subscription;

-- Check for specific errors
SELECT * FROM pg_replication_slots;
```

## References

- [PostgreSQL Logical Replication Documentation](https://www.postgresql.org/docs/current/logical-replication.html)
- [PostgreSQL Replication Guide](https://www.postgresql.org/docs/current/high-availability.html)

