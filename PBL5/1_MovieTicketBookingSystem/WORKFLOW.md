# 🚀 Simple Workflow Guide

## ⚡ Quick Start (Your Old Way - Still Works!)

### Simple Testing Flow (Like Before)

```bash
# Terminal 1: Start Docker
docker-compose up -d

# Terminal 2: Seed Redis
cd backend
npm run seed

# Terminal 3: Start server (dev mode)
cd backend
npm run dev

# Terminal 4: Run load test
cd backend
artillery run load-test.yml
```

**That's it!** This is the same as before. PM2 is optional for production.

---

## 🎯 Two Ways to Run

### Option 1: Development Mode (npm run dev) - RECOMMENDED FOR TESTING

```bash
# 1. Start Docker
docker-compose up -d

# 2. Seed Redis
cd backend
npm run seed

# 3. Start server (auto-reloads on file changes)
npm run dev

# 4. In another terminal, run load test
cd backend
artillery run load-test.yml
```

**Use this for:** Development, testing, debugging

---

### Option 2: Production Mode (PM2) - FOR LOAD TESTING

```bash
# 1. Start Docker
docker-compose up -d

# 2. Seed Redis
cd backend
npm run seed

# 3. Start with PM2 (6 workers, better performance)
pm2 start ecosystem.config.js

# 4. In another terminal, run load test
cd backend
artillery run load-test.yml

# 5. View logs
pm2 logs movie-booking-api
```

**Use this for:** Load testing, production-like performance

---

## 🔄 Daily Workflow

### Morning/Start Testing

```bash
# 1. Start Docker (if not running)
docker-compose up -d

# 2. Seed Redis (clears old bookings, creates fresh seats)
cd backend
npm run seed

# 3. Choose one:
#    A) Development: npm run dev
#    B) Production: pm2 start ecosystem.config.js

# 4. Run tests
artillery run load-test.yml
```

### After Code Changes

**If using `npm run dev`:**

- Just save file, it auto-reloads! ✅

**If using PM2:**

```bash
cd backend
pm2 restart movie-booking-api
```

### Stop Everything

**If using `npm run dev`:**

- Press `Ctrl+C` in that terminal

**If using PM2:**

```bash
pm2 stop movie-booking-api
```

---

## 🧹 Reset Everything (Clear All Data)

```bash
# Stop server
pm2 stop movie-booking-api  # if using PM2
# OR Ctrl+C if using npm run dev

# Clear Docker data
docker-compose down -v
docker network prune -f

# Restart fresh
docker-compose up -d
sleep 15

# Recreate Kafka topic (only needed after docker-compose down -v)
cd backend
node -e "const {admin} = require('./utils/kafka'); const config = require('./utils/config'); (async () => { await admin.connect(); await admin.createTopics({waitForLeaders: true, topics: [{topic: config.KAFKA_TOPIC_BOOKINGS, numPartitions: 30, replicationFactor: 1}]}); console.log('✅ Done'); await admin.disconnect(); process.exit(0);})();"

# Reseed
npm run seed
```

---

## 📝 Quick Reference

| What You Want          | Command                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Test (simple)**      | `npm run seed` → `npm run dev` → `artillery run load-test.yml`                   |
| **Load test (better)** | `npm run seed` → `pm2 start ecosystem.config.js` → `artillery run load-test.yml` |
| **Restart server**     | `pm2 restart movie-booking-api` (if PM2) or just save file (if npm run dev)      |
| **View logs**          | `pm2 logs movie-booking-api` (PM2) or check terminal (npm run dev)               |
| **Stop**               | `pm2 stop movie-booking-api` or `Ctrl+C`                                         |

---

## ⚠️ Important Notes

1. **Don't run both `npm run dev` and PM2 at the same time** - They conflict!
2. **Use `npm run dev` for development** - Easier, auto-reloads
3. **Use PM2 for load testing** - Better performance (6 workers)
4. **Always seed before testing** - `npm run seed` clears old bookings
5. **Docker must be running** - `docker-compose up -d`

---

## 🆘 Troubleshooting

### Docker Network Error

```bash
docker-compose down
docker network prune -f
docker-compose up -d
```

### Port Already in Use

```bash
# Kill whatever is using port 3001
lsof -i :3001
# Then kill the PID or stop PM2: pm2 stop movie-booking-api
```

### PM2 Not Working

```bash
pm2 delete all
cd backend && pm2 start ecosystem.config.js
```
