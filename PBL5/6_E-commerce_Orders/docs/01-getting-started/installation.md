# Installation Guide

Detailed installation steps for the E-commerce Order Processing System.

## Prerequisites

### Required Software
- **Node.js:** 18.x or higher
- **PostgreSQL:** 12.x or higher (3 instances for replication)
- **Redis:** 6.x or higher
- **NGINX:** 1.18+ (optional, for load balancing)
- **Git:** For cloning the repository

### System Requirements
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** 10GB free space
- **OS:** Linux, macOS, or Windows (WSL recommended for Windows)

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd PBL5/6_E-commerce_Orders
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Environment Configuration

Create `.env` file in `backend/`:

```env
# Server
PORT=3000
NODE_ENV=development

# Database - Primary
DATABASE_URL1=postgresql://user:password@localhost:5432/ecommerce_primary

# Database - Replica 1
DATABASE_URL2=postgresql://user:password@localhost:5433/ecommerce_replica1

# Database - Replica 2
DATABASE_URL3=postgresql://user:password@localhost:5434/ecommerce_replica2

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### Environment Configuration

Create `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Database Setup

#### Create Databases

```bash
# Primary database
createdb -U postgres ecommerce_primary

# Replica 1
createdb -U postgres ecommerce_replica1

# Replica 2
createdb -U postgres ecommerce_replica2
```

#### Initialize Schema

```bash
cd backend
npm run init-db
```

#### Set Up Replication

See [Database Setup Guide](../04-deployment/database-setup.md) for detailed replication configuration.

### 5. Redis Setup

```bash
# Start Redis server
redis-server

# Verify connection
redis-cli ping
# Should return: PONG
```

### 6. Seed Database (Optional)

```bash
cd backend
npm run seed
```

This populates the database with sample products.

## Verification

### Backend

```bash
cd backend
npm start
```

Should see:
```
✅ Connected to PRIMARY PostgreSQL database
✅ Connected to REPLICA 1 PostgreSQL database
✅ Connected to REPLICA 2 PostgreSQL database
✅ Redis connection verified
🚀 Server running on port 3000
```

### Frontend

```bash
cd frontend
npm run dev
```

Should open at `http://localhost:5173`

### Test API

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-..."
}
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check connection strings in `.env`
- Ensure databases exist
- Verify user permissions

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- Check firewall settings

### Port Conflicts
- Change `PORT` in backend `.env`
- Update `VITE_API_URL` in frontend `.env`
- Update CORS settings in `backend/index.js`

## Next Steps

- [Quick Start Guide](./quick-start.md) - Fast setup
- [Development Setup](./development-setup.md) - Development environment
- [Database Setup](../04-deployment/database-setup.md) - Replication setup

