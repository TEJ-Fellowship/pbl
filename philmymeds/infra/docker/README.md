# How to Link and Run API with MongoDB

## Quick Start

### 1. Navigate to Docker Directory
```bash
cd /home/sanjeev/Desktop/PBL/pbl/philmymeds/infra/docker
```

### 2. Start Both Services
```bash
docker-compose up -d
```

This will:
- ✅ Start MongoDB container
- ✅ Start API container (waits for MongoDB)
- ✅ Link them automatically via Docker network
- ✅ Set MONGODB_URI automatically

### 3. Check Status
```bash
docker-compose ps
```

You should see:
```
NAME                    STATUS
philmymeds-api          Up
philmymeds-mongodb      Up
```

### 4. View Logs
```bash
# See all logs
docker-compose logs -f

# See only API logs
docker-compose logs -f api

# See only MongoDB logs
docker-compose logs -f mongodb
```

### 5. Test the Connection
```bash
# Health check
curl http://localhost:8080/health

# Should return: "OK - MongoDB connected"
```

## How the Linking Works

### Network Linking
Both containers are on the same Docker network (`philmymeds-network`):
- API container can reach MongoDB using hostname: `mongodb`
- MongoDB is accessible at: `mongodb:27017`

### Environment Variable
The `MONGODB_URI` is automatically set in the API container:
```
mongodb://admin:password@mongodb:27017/philmymeds?authSource=admin
```

### Startup Order
- MongoDB starts first (because of `depends_on`)
- API waits for MongoDB to be ready
- Then API connects using the URI

## Alternative: Run API Locally, MongoDB in Docker

If you want to develop locally but use Docker MongoDB:

### 1. Start Only MongoDB
```bash
cd infra/docker
docker-compose up -d mongodb
```

### 2. Set Environment Variable Locally
Create/update `.env` file in project root:
```bash
MONGODB_URI=mongodb://admin:password@localhost:27017/philmymeds?authSource=admin
PORT=8081
```

### 3. Run API Locally
```bash
cd backend-go
go run cmd/api/main.go
# or
air
```

## Troubleshooting

### Can't Connect to MongoDB
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Port Already in Use
```bash
# Stop everything
docker-compose down

# Change port in docker-compose.yml if needed
# Then restart
docker-compose up -d
```

### Reset Everything
```bash
# Stop and remove containers + volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

