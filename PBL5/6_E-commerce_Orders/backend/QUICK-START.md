# Quick Start - Seeding & Replication Fix

## Immediate Actions (Run These Now)

### 1. Seed Products into PRIMARY
```bash
cd backend
npm run seed
```

**Expected:** 30 products created in PRIMARY database

### 2. Check Replication Status
```bash
npm run check-replication
```

**This will show:**
- Current replication configuration
- What's missing
- Exact SQL commands to fix it

### 3. Follow Fix Commands from Step 2

The diagnostic will output SQL commands. Run them on your databases:

**On PRIMARY:**
- Enable logical replication (if not enabled)
- Create publication
- Create replication user (if needed)

**On REPLICAS:**
- Create subscriptions

### 4. Sync Data to Replicas
```bash
npm run sync-replicas
```

**⚠️ Warning:** This truncates replica tables and repopulates from PRIMARY.

### 5. Verify Everything Works
```bash
npm run check-replication
```

**Expected:**
- All databases show same product count
- Publications active
- Subscriptions active
- Data consistent

---

## Quick Verification

```sql
-- On PRIMARY
SELECT COUNT(*) FROM products;  -- Should be 30

-- On REPLICA 1
SELECT COUNT(*) FROM products;  -- Should be 30

-- On REPLICA 2  
SELECT COUNT(*) FROM products;  -- Should be 30
```

---

## If Something Fails

1. **Check error messages** - they're descriptive
2. **Run `npm run check-replication`** - shows what's wrong
3. **See `docs/REPLICATION-FIX-RUNBOOK.md`** - detailed troubleshooting

---

## Files Created

- `scripts/seedProducts.js` - Seeds products from JSON
- `scripts/checkReplication.js` - Diagnoses replication
- `scripts/syncReplicas.js` - Syncs data to replicas
- `docs/REPLICATION-FIX-RUNBOOK.md` - Complete runbook

---

**Start with:** `npm run seed` then `npm run check-replication`

