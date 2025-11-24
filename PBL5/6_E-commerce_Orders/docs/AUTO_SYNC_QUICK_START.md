# Automatic Replication Sync - Quick Start Guide

## 🚀 Quick Start

### Option 1: Run Sync Once
```bash
npm run auto-sync
```
This will sync data from PRIMARY to REPLICAS once and exit.

### Option 2: Run Sync Continuously (Watch Mode)
```bash
npm run auto-sync:watch
```
This will sync every hour automatically. Press `Ctrl+C` to stop.

### Option 3: Custom Interval
```bash
# Sync every 30 minutes
node scripts/autoSyncReplicas.js --watch --interval=1800000

# Sync every 6 hours
node scripts/autoSyncReplicas.js --watch --interval=21600000

# Sync every 15 minutes
node scripts/autoSyncReplicas.js --watch --interval=900000
```

### Option 4: Setup Cron Job (Linux/macOS)
```bash
# Generate cron job file
npm run setup-cron

# Install cron job
crontab ~/replication-sync.cron

# View installed cron jobs
crontab -l
```

---

## 📋 What Gets Synced

The script syncs all tables:
- ✅ categories
- ✅ products
- ✅ inventory
- ✅ orders
- ✅ order_items
- ✅ payments

**Note:** This is a **one-way sync** from PRIMARY → REPLICAS. Writes should always go to PRIMARY.

---

## ⚙️ Configuration

### Environment Variables

You can set sync interval via environment variable:

```env
# In .env file
SYNC_INTERVAL=3600000  # 1 hour in milliseconds
```

### Default Settings

- **Default interval:** 1 hour (3,600,000 ms)
- **Sync mode:** Full sync (truncates and repopulates)
- **Error handling:** Continues on errors, logs and retries next interval

---

## 📊 Monitoring

### Check Sync Status

While running in watch mode, the script displays:
- Total number of syncs performed
- Last sync time
- Last error (if any)
- Next scheduled sync time

### View Logs

The script outputs detailed logs:
- ✅ Success messages with timing
- ❌ Error messages with details
- 📊 Status updates

---

## 🔧 Advanced Usage

### Run as Background Process (Linux/macOS)

```bash
# Run in background
nohup npm run auto-sync:watch > sync.log 2>&1 &

# View logs
tail -f sync.log

# Stop process
pkill -f autoSyncReplicas
```

### Run as Windows Service

Use `node-windows` or `pm2`:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start scripts/autoSyncReplicas.js --name "replication-sync" -- --watch

# View logs
pm2 logs replication-sync

# Stop
pm2 stop replication-sync
```

### Docker/Container

Add to your Dockerfile or docker-compose.yml:

```yaml
services:
  sync:
    build: .
    command: npm run auto-sync:watch
    environment:
      - DATABASE_URL1=${DATABASE_URL1}
      - DATABASE_URL2=${DATABASE_URL2}
      - DATABASE_URL3=${DATABASE_URL3}
    restart: unless-stopped
```

---

## ⚠️ Important Notes

1. **Sync is one-way:** PRIMARY → REPLICAS only
2. **Replicas are overwritten:** Data on replicas is replaced with PRIMARY data
3. **Sync time depends on data size:** Large databases take longer
4. **Network required:** Script needs access to all three databases
5. **Not real-time:** There's a delay between PRIMARY writes and replica sync

---

## 🐛 Troubleshooting

### Sync Fails

1. **Check database connections:**
   ```bash
   npm run check-replication
   ```

2. **Verify .env file** has correct database URLs

3. **Check network connectivity** to all databases

4. **Review error messages** in console output

### Sync Takes Too Long

- Reduce sync frequency (increase interval)
- Optimize database (add indexes)
- Consider migrating to AWS RDS/Azure for automatic replication

### High Resource Usage

- Increase sync interval
- Run sync during off-peak hours
- Use cron job instead of continuous watch mode

---

## 📈 Performance Tips

1. **Schedule syncs during low traffic:**
   - Use cron job with specific times
   - Example: `0 2 * * *` (2 AM daily)

2. **Monitor sync duration:**
   - If syncs take > 5 minutes, consider optimizing

3. **Use incremental sync (future enhancement):**
   - Currently does full sync
   - Can be enhanced to sync only changes

---

## 🔄 Migration Path

**Current (Render.com):**
- Use `auto-sync` script for periodic syncing

**Future (AWS RDS/Azure):**
- Automatic replication (no script needed)
- Real-time sync
- Better performance

See `MIGRATION_GUIDE_AWS_AZURE.md` for migration steps.

