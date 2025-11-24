# Migration Guide: Render.com to AWS RDS / Azure PostgreSQL

## 🆓 Free Tier Information

### AWS RDS PostgreSQL (Free Tier)
**AWS Free Tier includes:**
- ✅ **750 hours/month** of db.t2.micro or db.t3.micro instance
- ✅ **20 GB** of General Purpose (SSD) database storage
- ✅ **20 GB** of backup storage
- ✅ **Valid for 12 months** from AWS account creation
- ✅ **Logical replication supported** ✅

**After free tier:**
- db.t3.micro: ~$15/month
- Storage: ~$0.115/GB/month
- **Total estimate: ~$20-30/month** for small applications

### Azure Database for PostgreSQL (Free Tier)
**Azure offers:**
- ✅ **Free Azure account** with $200 credit for 30 days
- ✅ **Basic tier** starts at ~$25/month (no free tier, but low cost)
- ✅ **Flexible Server** supports logical replication ✅
- ✅ **Pay-as-you-go** pricing

**Cost estimate:**
- Basic tier: ~$25-35/month
- **Total estimate: ~$30-40/month** for small applications

## 📊 Comparison

| Feature | Render.com | AWS RDS | Azure PostgreSQL |
|---------|-----------|---------|-----------------|
| **Free Tier** | ✅ Yes | ✅ 12 months | ❌ No (but $200 credit) |
| **Logical Replication** | ❌ No | ✅ Yes | ✅ Yes |
| **Automatic Replication** | ❌ No | ✅ Yes | ✅ Yes |
| **Monthly Cost (after free)** | ~$7-20 | ~$20-30 | ~$30-40 |
| **Setup Complexity** | Easy | Medium | Medium |

---

## 🚀 Migration to AWS RDS PostgreSQL

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Create free account (requires credit card, but won't charge during free tier)
3. Complete account verification

### Step 2: Create RDS PostgreSQL Instance

#### Via AWS Console:
1. **Go to RDS Console**: https://console.aws.amazon.com/rds/
2. **Click "Create database"**
3. **Select:**
   - Engine: PostgreSQL
   - Version: 15.x or 14.x (recommended)
   - Template: **Free tier** (if eligible) or Dev/Test
   - DB instance class: **db.t3.micro** (free tier eligible)
4. **Settings:**
   - DB instance identifier: `ecommerce-primary`
   - Master username: `postgres` (or your choice)
   - Master password: (create strong password)
5. **Storage:**
   - Storage type: General Purpose (SSD)
   - Allocated storage: 20 GB (free tier)
6. **Connectivity:**
   - VPC: Default
   - Public access: **Yes** (for external access)
   - Security group: Create new (we'll configure later)
7. **Database authentication: Password authentication**
8. **Additional configuration:**
   - Initial database name: `ecommerce`
   - Enable automated backups: Yes
   - Backup retention: 7 days
9. **Click "Create database"**

#### Enable Logical Replication:
1. **Go to Parameter Groups** in RDS Console
2. **Create parameter group:**
   - Family: postgres15 (or your version)
   - Name: `ecommerce-replication`
3. **Edit parameters:**
   - `rds.logical_replication` = `1`
   - `max_wal_senders` = `10`
   - `max_replication_slots` = `10`
4. **Apply parameter group** to your database instance
5. **Reboot** the database instance (required for logical replication)

### Step 3: Configure Security Group
1. **Go to EC2 Console** → Security Groups
2. **Find your RDS security group**
3. **Add inbound rule:**
   - Type: PostgreSQL
   - Port: 5432
   - Source: Your IP address (or 0.0.0.0/0 for development - not recommended for production)

### Step 4: Create Replica Instances
1. **In RDS Console**, select your PRIMARY instance
2. **Click "Actions"** → **"Create read replica"**
3. **Settings:**
   - DB instance identifier: `ecommerce-replica-1`
   - Instance class: db.t3.micro
   - Public access: Yes
4. **Repeat** for second replica: `ecommerce-replica-2`

### Step 5: Get Connection Strings
1. **Click on each database instance**
2. **Copy the endpoint** (e.g., `ecommerce-primary.xxxxx.us-east-1.rds.amazonaws.com`)
3. **Update your `.env` file:**

```env
# PRIMARY (AWS RDS)
DATABASE_URL1=postgresql://postgres:YOUR_PASSWORD@ecommerce-primary.xxxxx.us-east-1.rds.amazonaws.com:5432/ecommerce

# REPLICA 1 (AWS RDS)
DATABASE_URL2=postgresql://postgres:YOUR_PASSWORD@ecommerce-replica-1.xxxxx.us-east-1.rds.amazonaws.com:5432/ecommerce

# REPLICA 2 (AWS RDS)
DATABASE_URL3=postgresql://postgres:YOUR_PASSWORD@ecommerce-replica-2.xxxxx.us-east-1.rds.amazonaws.com:5432/ecommerce
```

### Step 6: Migrate Data from Render.com

#### Option A: Using pg_dump (Recommended)
```bash
# Export from Render.com
pg_dump "YOUR_RENDER_DATABASE_URL" > backup.sql

# Import to AWS RDS PRIMARY
psql "YOUR_AWS_RDS_PRIMARY_URL" < backup.sql
```

#### Option B: Using Application Script
```bash
# Run sync script to copy data
npm run sync-replicas
```

### Step 7: Setup Replication
```bash
# Now that logical replication is enabled, run:
npm run setup-replication
```

This will automatically:
- Create replication user
- Create publication
- Create subscriptions on replicas

### Step 8: Verify
```bash
npm run check-replication
```

---

## 🚀 Migration to Azure Database for PostgreSQL

### Step 1: Create Azure Account
1. Go to https://azure.microsoft.com
2. Create free account (get $200 credit for 30 days)
3. Complete verification

### Step 2: Create PostgreSQL Flexible Server

#### Via Azure Portal:
1. **Go to Azure Portal**: https://portal.azure.com
2. **Search "Azure Database for PostgreSQL"**
3. **Click "Create"** → **"Flexible server"**
4. **Basics:**
   - Subscription: Your subscription
   - Resource group: Create new (e.g., `ecommerce-rg`)
   - Server name: `ecommerce-primary` (must be unique)
   - Region: Choose closest to you
   - PostgreSQL version: 15 or 14
   - Workload type: Development
   - Compute + storage: **Burstable B1ms** (cheapest, ~$25/month)
5. **Authentication:**
   - Admin username: `postgres`
   - Password: (create strong password)
6. **Networking:**
   - Public access: **Allow public access from any Azure service**
   - Firewall rules: Add your IP address
7. **Review + Create** → **Create**

### Step 3: Enable Logical Replication
1. **Go to your PostgreSQL server** in Azure Portal
2. **Settings** → **Server parameters**
3. **Search and set:**
   - `azure.replication_support` = `logical`
   - `max_wal_senders` = `10`
   - `max_replication_slots` = `10`
4. **Save** (server will restart automatically)

### Step 4: Create Replica Servers
1. **In Azure Portal**, go to your PRIMARY server
2. **Settings** → **Replicas**
3. **Click "Add replica"**
4. **Settings:**
   - Replica name: `ecommerce-replica-1`
   - Location: Same as primary
   - Compute + storage: Burstable B1ms
5. **Create**
6. **Repeat** for second replica: `ecommerce-replica-2`

### Step 5: Get Connection Strings
1. **Go to each server** → **Connection strings**
2. **Copy the connection string**
3. **Update your `.env` file:**

```env
# PRIMARY (Azure)
DATABASE_URL1=postgresql://postgres:YOUR_PASSWORD@ecommerce-primary.postgres.database.azure.com:5432/postgres

# REPLICA 1 (Azure)
DATABASE_URL2=postgresql://postgres:YOUR_PASSWORD@ecommerce-replica-1.postgres.database.azure.com:5432/postgres

# REPLICA 2 (Azure)
DATABASE_URL3=postgresql://postgres:YOUR_PASSWORD@ecommerce-replica-2.postgres.database.azure.com:5432/postgres
```

### Step 6: Migrate Data
Same as AWS RDS (Step 6 above)

### Step 7: Setup Replication
```bash
npm run setup-replication
```

### Step 8: Verify
```bash
npm run check-replication
```

---

## 💰 Cost Optimization Tips

### AWS RDS:
- Use **Reserved Instances** for 30-60% savings (1-3 year commitment)
- Use **db.t3.micro** (free tier eligible)
- Enable **auto-scaling** for storage
- Use **snapshot backups** (cheaper than continuous)

### Azure:
- Use **Reserved Capacity** for 30-50% savings
- Use **Burstable B1ms** tier for development
- Enable **auto-pause** (saves money when not in use)
- Use **Azure Hybrid Benefit** if you have Windows Server licenses

---

## 🔄 Migration Checklist

- [ ] Create AWS/Azure account
- [ ] Create PRIMARY database instance
- [ ] Enable logical replication
- [ ] Create REPLICA instances
- [ ] Configure security/firewall rules
- [ ] Export data from Render.com
- [ ] Import data to new PRIMARY
- [ ] Update `.env` file with new connection strings
- [ ] Run `npm run setup-replication`
- [ ] Verify with `npm run check-replication`
- [ ] Test application with new databases
- [ ] Update DNS/connection strings in production
- [ ] Monitor costs in AWS/Azure console
- [ ] Cancel Render.com databases (after verification)

---

## 🆘 Troubleshooting

### Connection Issues:
- Check security group/firewall rules
- Verify connection strings
- Check if database is publicly accessible

### Replication Not Working:
- Verify logical replication is enabled
- Check parameter group settings
- Ensure database was restarted after enabling

### High Costs:
- Monitor usage in AWS Cost Explorer / Azure Cost Management
- Set up billing alerts
- Consider Reserved Instances/Capacity

---

## 📞 Support Resources

**AWS:**
- AWS RDS Documentation: https://docs.aws.amazon.com/rds/
- AWS Free Tier: https://aws.amazon.com/free/
- AWS Support: https://aws.amazon.com/support/

**Azure:**
- Azure PostgreSQL Docs: https://docs.microsoft.com/azure/postgresql/
- Azure Free Account: https://azure.microsoft.com/free/
- Azure Support: https://azure.microsoft.com/support/

---

## ✅ Recommendation

**For your use case:**
1. **Start with AWS RDS** (better free tier, easier setup)
2. **Use free tier for 12 months** to test
3. **Migrate gradually** (test with staging first)
4. **Monitor costs** closely

**Estimated monthly cost after free tier: ~$20-30/month** for 3 database instances (1 primary + 2 replicas)

