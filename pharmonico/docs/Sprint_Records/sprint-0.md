# 📚 Sprint 0 — Complete Documentation

## Overview

Sprint 0 establishes the foundation for the Pharmonico project: a monorepo structure, Docker development environment, database seeds, and CI/CD pipeline.

---

## TASK-0.1: Initialize Monorepo

### Purpose
Create a well-organized project structure separating backend, frontend, infrastructure, and scripts.

### Directory Structure Created

```
pharmonico/
├── backend-go/           # Go backend (API + Workers)
│   ├── cmd/
│   │   ├── api/          # API server entrypoint
│   │   │   └── main.go
│   │   └── worker/       # Background worker entrypoint
│   │       └── main.go
│   ├── internal/         # Private application code
│   │   ├── config/       # Configuration management
│   │   │   └── config.go
│   │   ├── database/     # Database connections
│   │   │   ├── mongodb.go
│   │   │   └── postgres.go
│   │   ├── handlers/     # HTTP route handlers
│   │   │   └── router.go
│   │   ├── middleware/   # HTTP middleware (CORS, logging, recovery)
│   │   │   └── middleware.go
│   │   ├── models/       # Data models
│   │   │   ├── prescription.go
│   │   │   ├── patient.go
│   │   │   ├── pharmacy.go
│   │   │   ├── job.go
│   │   │   └── audit.go
│   │   ├── services/     # Business logic (placeholder)
│   │   └── workers/      # Background job processors
│   │       └── manager.go
│   ├── pkg/
│   │   └── ncpdp/        # NCPDP parsing utilities (placeholder)
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
│
├── frontend-react/       # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── EnrollmentPortal.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── infra/                # Infrastructure configs
│   ├── docker/           # Additional Docker configs (placeholder)
│   └── nginx/
│       └── nginx.conf    # Reverse proxy config
│
├── scripts/
│   └── seeds/            # Database seed files
│       ├── mongo/
│       └── postgres/
│
├── docs/                 # Project documentation
│   ├── requirements.md
│   ├── sprint_plan.md
│   └── user_stories.md
│
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI
│
├── docker-compose.yml    # Development environment
├── Makefile              # Development commands
├── README.md             # Project overview
└── .gitignore            # Git ignore rules
```

### Files Created

| File | Purpose |
|------|---------|
| `backend-go/go.mod` | Go module definition |
| `backend-go/cmd/api/main.go` | API server entry point with graceful shutdown |
| `backend-go/cmd/worker/main.go` | Worker process entry point |
| `backend-go/internal/config/config.go` | Environment variable configuration |
| `backend-go/internal/database/mongodb.go` | MongoDB connection wrapper |
| `backend-go/internal/database/postgres.go` | PostgreSQL connection pool |
| `backend-go/internal/handlers/router.go` | HTTP router with all API endpoints |
| `backend-go/internal/middleware/middleware.go` | CORS, logging, panic recovery |
| `backend-go/internal/models/*.go` | Data models for prescription, patient, pharmacy, job, audit |
| `backend-go/internal/workers/manager.go` | Background worker orchestration |

---

## TASK-0.2: Create Docker Compose Dev Environment

### Purpose
Set up a complete local development environment with all required services.

### Services Configuration

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `api` | Custom (Go) | 8080 | REST API server |
| `worker` | Custom (Go) | — | Background job processor |
| `frontend` | Custom (Node) | 5173 | React dev server |
| `mongodb` | mongo:7.0 | 27017 | Business data storage |
| `postgres` | postgres:16-alpine | 5432 | Jobs queue + audit logs |
| `minio` | minio/minio | 9000, 9001 | S3-compatible file storage |
| `minio-init` | minio/mc | — | Creates initial bucket |
| `maildev` | maildev/maildev | 1080, 1025 | Email testing UI |
| `nginx` | nginx:alpine | 80 | Reverse proxy (optional) |

### Key File: `docker-compose.yml`

```yaml
# Key features:
# - Health checks for MongoDB and PostgreSQL
# - Volume mounts for seed scripts
# - Network isolation (pharmonico-network)
# - Persistent volumes for databases
# - Environment variable configuration
```

### Dockerfiles Created

**`backend-go/Dockerfile`** — Multi-stage build:
- Build stage: Compiles Go binaries
- `api` target: Runs the API server
- `worker` target: Runs background workers

**`frontend-react/Dockerfile`** — Multi-stage build:
- `development` target: Vite dev server with hot reload
- `build` target: Production build
- `production` target: Nginx serving static files

---

## TASK-0.3: Add README + Development Run Scripts

### Purpose
Provide easy-to-use commands for developers and comprehensive project documentation.

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services |
| `make dev-build` | Build and start all services |
| `make dev-down` | Stop all services |
| `make dev-logs` | View logs from all services |
| `make seed` | Run database seed scripts |
| `make test` | Run all tests (backend + frontend) |
| `make test-backend` | Run Go tests only |
| `make test-frontend` | Run React tests only |
| `make lint` | Run all linters |
| `make setup` | Initial project setup |
| `make clean` | Remove containers, volumes, artifacts |
| `make mongo-shell` | Connect to MongoDB shell |
| `make psql` | Connect to PostgreSQL |

### README.md Contents

- Project overview and workflow diagram
- ASCII architecture diagram
- Quick start instructions
- Access points table (URLs and ports)
- Common commands reference
- Project structure explanation
- Technology stack details
- Sprint plan status
- Learning objectives

---

## TASK-0.4: Seed Scripts

### Purpose
Pre-populate databases with sample data for development and testing.

### MongoDB Seeds

**`scripts/seeds/mongo/001_pharmacies.js`**

Creates 5 sample pharmacies with:
- Name, NPI, NCPDP ID
- Contact info (phone, fax, email)
- Full address with geolocation (for distance queries)
- Accepted insurance carriers
- Specialty types
- Capacity tracking
- Operating hours

| Pharmacy | Location | Specialties |
|----------|----------|-------------|
| MedCare Pharmacy | San Francisco | General, Specialty |
| Valley Health Pharmacy | San Jose | General |
| Specialty Care Rx | Oakland | Specialty, Oncology, Immunology |
| Downtown Pharmacy Plus | Los Angeles | General, Compounding |
| Community Care Pharmacy | Sacramento | General |

**`scripts/seeds/mongo/002_sample_prescriptions.js`**

Creates sample prescriptions in various states:
- `received` — Newly submitted
- `validated` — Passed validation
- `validation_issue` — Failed validation with errors
- `awaiting_enrollment` — Pending patient enrollment
- `pharmacy_selected` — Assigned to pharmacy

Creates indexes for:
- Status queries
- Patient lookups
- Pharmacy assignments
- Time-based sorting

### PostgreSQL Seeds

**`scripts/seeds/postgres/001_schema.sql`**

**Jobs Table:**
```sql
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payload JSONB,
    result JSONB,
    error TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

**Audit Logs Table:**
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    payload JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE
);
```

Includes:
- Indexes for efficient polling and queries
- Auto-update trigger for `updated_at`
- UUID extension enabled

---

## TASK-0.5: CI Skeleton

### Purpose
Automate testing, linting, and build verification on every push/PR.

### GitHub Actions Workflow: `.github/workflows/ci.yml`

**Jobs:**

| Job | Purpose | Steps |
|-----|---------|-------|
| `backend-test` | Run Go tests | Setup Go → Download deps → go vet → go test |
| `backend-lint` | Lint Go code | Setup Go → golangci-lint |
| `frontend-test` | Run React tests | Setup Node → npm ci → npm test |
| `frontend-lint` | Lint React code | Setup Node → npm ci → npm run lint |
| `build` | Verify Docker builds | Build API, Worker, Frontend images |

**Triggers:**
- Push to `main` or `main-pharmonico` branches
- Pull requests to these branches

**Features:**
- Caching for Go modules and npm packages
- Parallel job execution
- Docker layer caching for builds
- Coverage artifact upload

---

## 🚀 Step-by-Step: Getting Started

### Step 1: Install Prerequisites

```bash
# Required
- Docker & Docker Compose
- Git

# Optional (for local development without Docker)
- Go 1.23+
- Node.js 20+
- Make
```

### Step 2: Clone & Navigate

```bash
cd /home/sankar/t-e-j/pbl/pharmonico
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend-react
npm install
cd ..
```

This generates `package-lock.json` required for CI.

### Step 4: Start Development Environment

```bash
# First time (builds images)
make dev-build

# Subsequent times
make dev
```

### Step 5: Verify Services

Open in browser:
- **Frontend**: http://localhost:5173
- **API Health**: http://localhost:8080/health
- **MinIO Console**: http://localhost:9001 (admin/minioadmin)
- **Maildev**: http://localhost:1080

### Step 6: Verify Database Seeds

```bash
# Check MongoDB
make mongo-shell
> db.pharmacies.countDocuments()   # Should return 5
> db.prescriptions.countDocuments() # Should return 5

# Check PostgreSQL
make psql
pharmonico=# \dt                   # Lists jobs and audit_logs tables
```

### Step 7: Run Tests

```bash
make test
```

### Step 8: Stop Environment

```bash
make dev-down
```

---

## 📋 Files Quick Reference

| Category | Files |
|----------|-------|
| **Entry Points** | `backend-go/cmd/api/main.go`, `backend-go/cmd/worker/main.go` |
| **Configuration** | `backend-go/internal/config/config.go`, `docker-compose.yml` |
| **Database** | `mongodb.go`, `postgres.go`, seed scripts |
| **API Routes** | `backend-go/internal/handlers/router.go` |
| **Models** | `prescription.go`, `patient.go`, `pharmacy.go`, `job.go`, `audit.go` |
| **Workers** | `backend-go/internal/workers/manager.go` |
| **Frontend** | `App.tsx`, `Layout.tsx`, `Dashboard.tsx`, `EnrollmentPortal.tsx` |
| **DevOps** | `Dockerfile`s, `docker-compose.yml`, `Makefile`, `ci.yml` |

---

## ➡️ Next Steps: Sprint 1

With Sprint 0 complete, you're ready to implement:

1. **TASK-1.1**: `POST /api/intake` endpoint
2. **TASK-1.2**: PostgreSQL job enqueuer
3. **TASK-1.3**: Validation worker logic
4. **TASK-1.4**: Basic Ops UI (Intake + Validation tabs)