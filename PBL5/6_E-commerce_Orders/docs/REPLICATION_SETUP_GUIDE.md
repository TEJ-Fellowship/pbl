# Complete Replication Setup Guide

## Quick Start

If you have **superuser access** to PostgreSQL, run:
```bash
npm run generate-replication-sql
```
This will show you the exact SQL commands to run.

## Step-by-Step Solution

### Option 1: Using SQL Commands (If you have superuser access)

#### Step 1: Connect to PRIMARY database as superuser
```bash
psql -U postgres -d your_database_name
```

#### Step 2: Enable Logical Replication
```sql
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;
SELECT pg_reload_conf();
```

#### Step 3: RESTART PostgreSQL Server
⚠️ **CRITICAL**: `wal_level` changes require a server restart.

**Linux:**
```bash
sudo systemctl restart postgresql
# or
sudo service postgresql restart
```

**Windows:**
- Open Services (services.msc)
- Find "PostgreSQL" service
- Right-click → Restart

**macOS (Homebrew):**
```bash
brew services restart postgresql
```

#### Step 4: Verify WAL Level
```sql
SHOW wal_level;  -- Should show "logical"
```

#### Step 5: Run Setup Script
```bash
npm run setup-replication
```

---

### Option 2: Edit postgresql.conf File (If you have file system access)

#### Step 1: Find postgresql.conf location
```bash
npm run find-postgres-config
```

Or run this SQL:
```sql
SHOW config_file;
```

#### Step 2: Edit postgresql.conf
Add or modify these lines:
```ini
wal_level = logical
max_wal_senders = 10
max_replication_slots = 10
```

#### Step 3: Restart PostgreSQL
(Use commands from Option 1, Step 3)

#### Step 4: Run Setup Script
```bash
npm run setup-replication
```

---

### Option 3: Managed Database Services

#### AWS RDS
1. Go to RDS Console → Parameter Groups
2. Create/Edit parameter group
3. Set:
   - `rds.logical_replication = 1`
   - `max_wal_senders = 10`
   - `max_replication_slots = 10`
4. Apply to database instance
5. Restart instance

#### Azure Database for PostgreSQL
1. Go to Azure Portal → Your Database
2. Server Parameters
3. Set:
   - `azure.replication_support = logical`
   - `max_wal_senders = 10`
   - `max_replication_slots = 10`
4. Save and restart

#### Google Cloud SQL
1. Go to Cloud Console → SQL Instances
2. Edit instance
3. Under Flags, set:
   - `max_wal_senders = 10`
   - `max_replication_slots = 10`
4. Enable logical replication in settings
5. Restart instance

---

## Verification

After configuration, verify replication is working:

```bash
npm run check-replication
```

You should see:
- ✅ WAL level: logical
- ✅ Publications exist
- ✅ Subscriptions exist on replicas

---

## Troubleshooting

### "permission denied to set parameter"
- You need superuser access
- Use Option 2 (edit postgresql.conf) or Option 3 (managed service)

### "wal_level cannot be changed"
- PostgreSQL must be restarted after changing wal_level
- This is a PostgreSQL limitation, not a bug

### "Could not connect to replica"
- Check network connectivity
- Verify pg_hba.conf allows replication connections
- Check firewall rules

---

## Need Help?

Run these diagnostic commands:
```bash
npm run find-postgres-config      # Find config file location
npm run generate-replication-sql  # Generate SQL commands
npm run check-replication         # Check current status
```

