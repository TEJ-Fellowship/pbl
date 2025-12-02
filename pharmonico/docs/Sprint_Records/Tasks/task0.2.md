

# TASK-0.2: Create Docker Compose Dev Environment — Sub-Task Breakdown

---

## Overview

TASK-0.2 sets up the complete Docker development environment. Breaking it into sub-tasks allows incremental, testable progress.

---

## Sub-Task Structure

| Sub-Task | Description | Dependencies |
|----------|-------------|--------------|
| **0.2.1** | Database Services (MongoDB + PostgreSQL) | None |
| **0.2.2** | Storage Service (MinIO) | None |
| **0.2.3** | Development Tools (Maildev) | None |
| **0.2.4** | Go Backend Dockerfiles (API + Worker) | 0.2.1 |
| **0.2.5** | React Frontend Dockerfile | None |
| **0.2.6** | Docker Compose Orchestration | 0.2.1 - 0.2.5 |
| **0.2.7** | Nginx Reverse Proxy (Optional) | 0.2.4, 0.2.5 |

---

## TASK-0.2.1: Database Services (MongoDB + PostgreSQL)

### Purpose
Set up the two database systems used by Pharmonico:
- **MongoDB**: Business data (prescriptions, patients, pharmacies)
- **PostgreSQL**: Job queue and audit logs

### Files to Create
None (configuration in docker-compose.yml)

### Docker Compose Configuration

```yaml
# MongoDB Service
mongodb:
  image: mongo:7.0
  ports:
    - "27017:27017"
  volumes:
    - mongodb-data:/data/db
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
  networks:
    - pharmonico-network
  restart: unless-stopped

# PostgreSQL Service
postgres:
  image: postgres:16-alpine
  ports:
    - "5432:5432"
  environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
    - POSTGRES_DB=pharmonico
  volumes:
    - postgres-data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
  networks:
    - pharmonico-network
  restart: unless-stopped
```

### Verification
```bash
# Start databases
docker compose up -d mongodb postgres

# Test MongoDB
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Test PostgreSQL
docker compose exec postgres psql -U postgres -c "SELECT 1"
```

---

## TASK-0.2.2: Storage Service (MinIO)

### Purpose
S3-compatible object storage for:
- Insurance card images
- Shipping labels
- Other file uploads

### Docker Compose Configuration

```yaml
# MinIO Service
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"   # API
    - "9001:9001"   # Console
  environment:
    - MINIO_ROOT_USER=minioadmin
    - MINIO_ROOT_PASSWORD=minioadmin
  volumes:
    - minio-data:/data
  command: server /data --console-address ":9001"
  networks:
    - pharmonico-network
  restart: unless-stopped

# MinIO Bucket Initialization
minio-init:
  image: minio/mc:latest
  depends_on:
    - minio
  entrypoint: >
    /bin/sh -c "
    sleep 5;
    mc alias set myminio http://minio:9000 minioadmin minioadmin;
    mc mb myminio/pharmonico --ignore-existing;
    mc anonymous set download myminio/pharmonico;
    exit 0;
    "
  networks:
    - pharmonico-network
```

### Verification
```bash
# Start MinIO
docker compose up -d minio minio-init

# Access Console: http://localhost:9001
# Login: minioadmin / minioadmin
```

---

## TASK-0.2.3: Development Tools (Maildev)

### Purpose
Email testing UI that captures all outgoing emails without actually sending them.

### Docker Compose Configuration

```yaml
# Maildev Service
maildev:
  image: maildev/maildev:2.1.0
  ports:
    - "1080:1080"  # Web UI
    - "1025:1025"  # SMTP Server
  networks:
    - pharmonico-network
  restart: unless-stopped
```

### Verification
```bash
# Start Maildev
docker compose up -d maildev

# Access UI: http://localhost:1080
```

---

## TASK-0.2.4: Go Backend Dockerfiles (API + Worker)

### Purpose
Multi-stage Dockerfile for building optimized Go binaries for both API server and background worker.

### File to Create
`backend-go/Dockerfile`

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the API binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api ./cmd/api

# Build the worker binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/worker ./cmd/worker

# API runtime stage
FROM alpine:3.19 AS api

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /bin/api /app/api
EXPOSE 8080
CMD ["/app/api"]

# Worker runtime stage
FROM alpine:3.19 AS worker

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /bin/worker /app/worker
CMD ["/app/worker"]
```

### Docker Compose Configuration

```yaml
# Go API Server
api:
  build:
    context: ./backend-go
    target: api
  ports:
    - "8080:8080"
  environment:
    - PORT=8080
    - ENVIRONMENT=development
    - MONGO_URI=mongodb://mongodb:27017
    - MONGO_DATABASE=pharmonico
    - POSTGRES_URI=postgres://postgres:postgres@postgres:5432/pharmonico?sslmode=disable
    - MINIO_ENDPOINT=minio:9000
    - MINIO_ACCESS_KEY=minioadmin
    - MINIO_SECRET_KEY=minioadmin
  depends_on:
    mongodb:
      condition: service_healthy
    postgres:
      condition: service_healthy
  networks:
    - pharmonico-network
  restart: unless-stopped

# Go Worker
worker:
  build:
    context: ./backend-go
    target: worker
  environment:
    - ENVIRONMENT=development
    - MONGO_URI=mongodb://mongodb:27017
    - MONGO_DATABASE=pharmonico
    - POSTGRES_URI=postgres://postgres:postgres@postgres:5432/pharmonico?sslmode=disable
  depends_on:
    mongodb:
      condition: service_healthy
    postgres:
      condition: service_healthy
  networks:
    - pharmonico-network
  restart: unless-stopped
```

### Note
This sub-task requires placeholder Go code in `cmd/api/main.go` and `cmd/worker/main.go` to build successfully. Minimal placeholder code:

```go
// cmd/api/main.go
package main

import (
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte(`{"status":"ok"}`))
    })
    log.Println("API starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

```go
// cmd/worker/main.go
package main

import (
    "log"
    "time"
)

func main() {
    log.Println("Worker started")
    for {
        time.Sleep(time.Minute)
    }
}
```

---

## TASK-0.2.5: React Frontend Dockerfile

### Purpose
Multi-stage Dockerfile for React development (with hot reload) and production builds.

### File to Create
`frontend-react/Dockerfile`

```dockerfile
# Development stage
FROM node:20-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Build stage
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration

```yaml
# React Frontend (Development)
frontend:
  build:
    context: ./frontend-react
    target: development
  ports:
    - "5173:5173"
  volumes:
    - ./frontend-react:/app
    - /app/node_modules
  environment:
    - VITE_API_URL=http://localhost:8080
  networks:
    - pharmonico-network
  restart: unless-stopped
```

### Note
This sub-task requires a basic React project with `package.json`. Minimal setup needed before this works.

---

## TASK-0.2.6: Docker Compose Orchestration

### Purpose
Combine all services into a single `docker-compose.yml` with proper networking, volumes, and dependencies.

### File to Create
`docker-compose.yml`

```yaml
version: "3.8"

services:
  # Include all services from 0.2.1 - 0.2.5

volumes:
  mongodb-data:
  postgres-data:
  minio-data:

networks:
  pharmonico-network:
    driver: bridge
```

### Key Features
- Health checks for database readiness
- Named volumes for data persistence
- Isolated network for service communication
- Proper `depends_on` with conditions

---

## TASK-0.2.7: Nginx Reverse Proxy (Optional)

### Purpose
Single entry point for all services (useful for production-like setup).

### File to Create
`infra/nginx/nginx.conf`

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:8080;
    }

    upstream frontend {
        server frontend:5173;
    }

    server {
        listen 80;

        location /api {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /webhook {
            proxy_pass http://api;
        }

        location /health {
            proxy_pass http://api;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
        }
    }
}
```

### Docker Compose Configuration (commented by default)

```yaml
# nginx:
#   image: nginx:alpine
#   ports:
#     - "80:80"
#   volumes:
#     - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
#   depends_on:
#     - api
#     - frontend
#   networks:
#     - pharmonico-network
```

---

## Execution Order

```
TASK-0.2.1 ──┐
TASK-0.2.2 ──┼── Can run in parallel (no dependencies)
TASK-0.2.3 ──┘
             │
             ▼
TASK-0.2.4 ── Requires placeholder Go code
TASK-0.2.5 ── Requires placeholder React setup
             │
             ▼
TASK-0.2.6 ── Combines all services
             │
             ▼
TASK-0.2.7 ── Optional final step
```

---

## Verification Checklist

| Sub-Task | Verification Command |
|----------|---------------------|
| 0.2.1 | `docker compose up -d mongodb postgres && docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"` |
| 0.2.2 | `docker compose up -d minio` → Access http://localhost:9001 |
| 0.2.3 | `docker compose up -d maildev` → Access http://localhost:1080 |
| 0.2.4 | `docker compose build api worker` |
| 0.2.5 | `docker compose build frontend` |
| 0.2.6 | `docker compose up` (all services start) |
| 0.2.7 | Access http://localhost:80 (routes to services) |

