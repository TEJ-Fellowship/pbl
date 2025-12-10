# Docker Setup Guide

This guide explains how to run the PhilMyMeds backend API in Docker.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### 1. Navigate to Docker Directory

```bash
cd philmymeds/infra/docker
```

### 2. Start All Services

```bash
docker-compose up -d
```

This will start:
- **API** - Backend Go API (port 8080)
- **MongoDB** - Database (port 27017)
- **Kafka** - Message broker (port 9092)
- **Zookeeper** - Kafka dependency (port 2181)

### 3. Check Status

```bash
docker-compose ps
```

You should see all services running:
```
NAME                    STATUS              PORTS
philmymeds-api          Up 2 minutes        0.0.0.0:8080->8080/tcp
philmymeds-mongodb      Up 2 minutes        0.0.0.0:27017->27017/tcp
philmymeds-kafka        Up 2 minutes        0.0.0.0:9092->9092/tcp
philmymeds-zookeeper    Up 2 minutes        0.0.0.0:2181->2181/tcp
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f mongodb
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8080/health

# Create a patient
curl -X POST http://localhost:8080/api/v1/patients \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "date_of_birth": "1990-01-01",
    "sex": "M",
    "address": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    }
  }'
```

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose stop
```

### Stop and Remove Containers
```bash
docker-compose down
```

### Stop and Remove Containers + Volumes
```bash
docker-compose down -v
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild only API
docker-compose build api
docker-compose up -d api
```

### View Logs
```bash
# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f api
```

### Execute Commands in Container
```bash
# Access API container shell
docker-compose exec api sh

# Access MongoDB shell
docker-compose exec mongodb mongosh
```

## Running Specific Services

### Only MongoDB and API
```bash
docker-compose up -d mongodb api
```

### Only MongoDB
```bash
docker-compose up -d mongodb
```

## Environment Variables

Create a `.env` file in `infra/docker/` directory (optional):

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# API Keys (optional)
STRIPE_SECRET_KEY=sk_test_...
SHIPPO_API_KEY=shippo_test_...
```

If not provided, defaults will be used.

## Troubleshooting

### Port Already in Use

If port 8080 is already in use:
```bash
# Change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead
```

### MongoDB Connection Issues

If API can't connect to MongoDB:
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Rebuild After Code Changes

After modifying Go code:
```bash
docker-compose build api
docker-compose up -d api
```

### Clear Everything and Start Fresh

```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose rm -f

# Start fresh
docker-compose up -d --build
```

### View API Logs

```bash
# Real-time logs
docker-compose logs -f api

# Last 50 lines
docker-compose logs --tail=50 api
```

### Check API Health

```bash
# From host
curl http://localhost:8080/health

# From inside container
docker-compose exec api wget -qO- http://localhost:8080/health
```

## Development Workflow

### Option 1: Full Docker (Recommended for Production-like Testing)

1. Make code changes
2. Rebuild: `docker-compose build api`
3. Restart: `docker-compose up -d api`
4. Check logs: `docker-compose logs -f api`

### Option 2: Hybrid (Faster Development)

1. Run MongoDB in Docker: `docker-compose up -d mongodb`
2. Run API locally: `cd backend-go && go run ./cmd/api`
3. API connects to `localhost:27017`

## Docker Compose Files

- `docker.compose.yml` - Main compose file (all services)
- `docker.compose.dev.yml` - Development overrides (if needed)
- `docker.compose.prod.yml` - Production overrides (if needed)

## Service URLs

When running in Docker, services are accessible at:

- **API**: http://localhost:8080
- **MongoDB**: localhost:27017
- **Kafka**: localhost:9092
- **Zookeeper**: localhost:2181

Inside Docker network, services use service names:
- **API → MongoDB**: `mongodb:27017`
- **API → Kafka**: `kafka:9092`

## Data Persistence

MongoDB data is stored in a Docker volume `mongodb_data`. To persist data:

```bash
# Data persists even after docker-compose down
docker-compose down
docker-compose up -d
```

To remove all data:
```bash
docker-compose down -v
```

## Network

All services are on the `philmymeds-network` bridge network, allowing them to communicate using service names.

## Monitoring

### Check Resource Usage
```bash
docker stats
```

### Inspect Container
```bash
docker inspect philmymeds-api
```

### Check Network
```bash
docker network inspect docker_philmymeds-network
```

## Production Considerations

For production, consider:
1. Use environment-specific compose files
2. Set up proper secrets management
3. Configure resource limits
4. Set up health checks
5. Use proper logging drivers
6. Configure backup strategies

## Next Steps

Once Docker is running:
1. Test API endpoints (see API_ARCHITECTURE.md)
2. Connect to MongoDB to verify data
3. Set up your development environment
4. Start building features!
