# Pharmonico 💊

A prescription fulfillment learning project to understand US healthcare workflows, NCPDP standards, and modern full-stack development.

## 🎯 Overview

Pharmonico simulates a specialty pharmacy fulfillment service that manages the complete prescription workflow:

```
Prescription Intake → Validation → Patient Enrollment → Pharmacy Routing
        ↓                                                       ↓
   Delivery ← Shipping ← Payment ← Insurance Adjudication ←────┘
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                               │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │     Operations Dashboard      │  │     Patient Enrollment Portal    │ │
│  └──────────────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                              ┌─────▼─────┐
                              │   Nginx   │ (optional reverse proxy)
                              └─────┬─────┘
                                    │
┌───────────────────────────────────┼───────────────────────────────────┐
│                                   ▼                                    │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                     Go API Server (:8080)                       │   │
│  │  • Prescription intake (NCPDP SCRIPT)                           │   │
│  │  • Enrollment management                                         │   │
│  │  • Pharmacy routing & selection                                  │   │
│  │  • Payment & webhook handling                                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                     Go Worker Process                           │   │
│  │  • Validation Worker      • Payment Worker                      │   │
│  │  • Enrollment Worker      • Shipping Worker                     │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                    │                                   │
│         Backend (Go)               │                                   │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
┌──────────────┐          ┌──────────────────┐          ┌──────────────┐
│   MongoDB    │          │   PostgreSQL     │          │    MinIO     │
│  • Prescriptions        │  • Job Queue     │          │  • File      │
│  • Patients  │          │  • Audit Logs    │          │    Storage   │
│  • Pharmacies│          └──────────────────┘          └──────────────┘
│  • Enrollments
└──────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Go 1.23+ (for local development)
- Node.js 20+ (for local development)
- Make

### Start Development Environment

```bash
# Clone the repository
git clone <repo-url>
cd pharmonico

# Start all services
make dev

# Or build and start
make dev-build
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| API | http://localhost:8080 | Go API server |
| API Health | http://localhost:8080/health | Health check |
| MongoDB | localhost:27017 | Database |
| PostgreSQL | localhost:5432 | Job queue & audit logs |
| MinIO Console | http://localhost:9001 | S3-compatible storage |
| Maildev | http://localhost:1080 | Email testing UI |

### Common Commands

```bash
# View logs
make dev-logs

# Run tests
make test

# Run linters
make lint

# Seed databases
make seed

# Connect to MongoDB
make mongo-shell

# Connect to PostgreSQL
make psql

# Stop all services
make dev-down

# Full cleanup
make clean
```

## 📁 Project Structure

```
pharmonico/
├── backend-go/              # Go backend
│   ├── cmd/
│   │   ├── api/            # API server entrypoint
│   │   └── worker/         # Worker process entrypoint
│   ├── internal/
│   │   ├── config/         # Configuration
│   │   ├── database/       # Database connections
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/     # HTTP middleware
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── workers/        # Background workers
│   └── pkg/
│       └── ncpdp/          # NCPDP SCRIPT parsing
│
├── frontend-react/          # React frontend
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── hooks/          # Custom hooks
│       ├── api/            # API client
│       └── store/          # State management
│
├── infra/                   # Infrastructure configs
│   ├── docker/             # Additional Docker configs
│   └── nginx/              # Nginx configuration
│
├── scripts/                 # Utility scripts
│   └── seeds/
│       ├── mongo/          # MongoDB seed data
│       └── postgres/       # PostgreSQL schemas
│
├── docs/                    # Documentation
│   ├── requirements.md     # Full requirements
│   ├── sprint_plan.md      # Sprint breakdown
│   └── user_stories.md     # User stories
│
├── docker-compose.yml       # Development environment
├── Makefile                 # Development commands
└── README.md               # This file
```

## 📋 Sprint Plan

| Sprint | Focus | Status |
|--------|-------|--------|
| **Sprint 0** | Monorepo, Docker, CI setup | ✅ Complete |
| **Sprint 1** | Intake, Validation Worker | 🔄 Next |
| **Sprint 2** | Enrollment, Magic Links | ⏳ Planned |
| **Sprint 3** | Pharmacy Routing, Adjudication | ⏳ Planned |
| **Sprint 4** | Payments, Shipping, Notifications | ⏳ Planned |

## 🔧 Technology Stack

### Backend
- **Language**: Go 1.23
- **Framework**: Standard library (net/http)
- **Databases**: MongoDB (business data), PostgreSQL (jobs/audit)
- **Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Routing**: React Router v6

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Email Testing**: Maildev

### External Integrations (Test Mode)
- **Payments**: Stripe
- **Shipping**: Shippo
- **Email**: SendGrid
- **SMS**: Twilio
- **AI**: Gemini (mock prescription generation)

## 📚 Learning Objectives

This project helps understand:

- **US Healthcare Workflow**: NCPDP standards, prescription lifecycle, insurance adjudication
- **Asynchronous Processing**: Database polling job queues, worker patterns
- **Full-Stack Development**: Go backend, React frontend, multi-database setup
- **Third-Party Integrations**: Payment processing, shipping APIs, communication services
- **Compliance Concepts**: HIPAA basics, audit logging, patient data handling

## 🤝 Contributing

This is a learning project. Feel free to explore, experiment, and extend!

## 📄 License

MIT License - See LICENSE file for details.

