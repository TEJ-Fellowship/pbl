# **Pharmonico 💊 — Prescription Fulfillment Learning Platform**

*A complete end-to-end simulation of U.S. specialty pharmacy workflows, NCPDP SCRIPT intake, insurance adjudication, routing, payments, and shipping.*

This project is designed for **learning** modern healthcare tech stacks, including API design, worker systems, job queues, NCPDP standards, React frontends, asynchronous pipelines, Redis caching, and Kafka event-driven architecture.

---

# 📦 **Contents**

* Overview
* Architecture (Updated with Redis + Kafka)
* Quick Start
* Access Points
* Common Commands
* Project Structure
* Technology Stack
* Sprint Plan
* Learning Objectives
* License

---

# 🎯 **Overview**

Pharmonico simulates an end-to-end prescription lifecycle:

```
Prescription Intake → Validation → Enrollment → Pharmacy Routing
       ↓                                                    ↓
  Delivery ← Shipping ← Payment ← Insurance Adjudication ←──┘
```

It models real-world specialty pharmacy workflows including:

* Patient onboarding
* Insurance eligibility & BIN/PCN checks
* Pharmacy selection based on geography & networks
* Adjudication (simulated)
* Stripe payments
* Shippo shipping
* Email/SMS notifications

---

# 🏗️ **Architecture (Updated with Redis & Kafka)**

Pharmonico now uses an **event-driven microservices-inspired** pipeline supported by:

* **Redis** → caching, sessions, magic links, rate limits
* **Kafka** → async workflow orchestration
* **MongoDB** → business data
* **PostgreSQL** → audit logs & fallback job queue
* **MinIO** → storage for insurance cards & labels

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                Frontend (React)                             │
│  ┌──────────────────────────────┐    ┌────────────────────────────────────┐ │
│  │   Operations Dashboard        │    │   Patient Enrollment Portal        │ │
│  └──────────────────────────────┘    └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
                                       │
                                 ┌─────▼─────┐
                                 │   Nginx    │ (optional reverse proxy)
                                 └─────┬─────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                                      ▼                                      │
│       ┌──────────────────────────────────────────────────────────────────┐   │
│       │                     Go API Server (:8080)                         │   │
│       │  • NCPDP Intake                                                   │   │
│       │  • Enrollment + Insurance APIs                                     │   │
│       │  • Redis: caching, tokens, sessions                                │   │
│       │  • Kafka: event publishing                                         │   │
│       │  • Stripe/Webhook handler                                          │   │
│       └──────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│       ┌──────────────────────────────────────────────────────────────────┐   │
│       │                      Worker Services                              │   │
│       │  • Validation Worker          • Payment Worker                      │   │
│       │  • Enrollment Worker          • Shipping Worker                     │   │
│       │  • Kafka Consumers (primary queue)                                  │   │
│       │  • Postgres Job Queue (fallback)                                    │   │
│       └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────┬───────────────────────────────────┘
                                           │
                     ┌─────────────────────┼────────────────────────────┐
                     ▼                     ▼                            ▼
       ┌──────────────────┐     ┌──────────────────────┐       ┌──────────────────┐
       │     MongoDB       │     │     PostgreSQL       │       │      MinIO        │
       │  • Prescriptions  │     │  • Job Queue (backup)│       │  • Insurance files│
       │  • Patients       │     │  • Audit Logs        │       │  • Shipping labels│
       │  • Pharmacies     │     └──────────────────────┘       └──────────────────┘
       └──────────────────┘
                     ┌────────────────────┬──────────────────────┬────────────────────┐
                     ▼                    ▼                      ▼                    ▼
           ┌─────────────┐    ┌────────────────┐      ┌─────────────────┐   ┌───────────────┐
           │    Redis     │    │     Kafka       │      │    Stripe API   │   │   Shippo API    │
           │  • Magic link│    │  • Event bus    │      │  • Payments     │   │  • Labels        │
           │  • Cache     │    │  • Worker queue │      │  • Webhooks     │   │  • Tracking      │
           └─────────────┘    └────────────────┘      └─────────────────┘   └───────────────┘
```

---

# 🚀 **Quick Start**

### **Prerequisites**

* Docker + Docker Compose
* Go 1.23+
* Node.js 20+
* Make

---

### **Start Development Environment**

```bash
git clone <repo-url>
cd pharmonico

make dev
```

To build fresh images:

```bash
make dev-build
```

---

# 🌐 **Access Points**

| Service               | URL                                                          | Description                              |
| --------------------- | ------------------------------------------------------------ | ---------------------------------------- |
| Frontend              | [http://localhost:5173](http://localhost:5173)               | Operations Dashboard + Enrollment Portal |
| API                   | [http://localhost:8080](http://localhost:8080)               | Go API                                   |
| API Health            | [http://localhost:8080/health](http://localhost:8080/health) | Health endpoint                          |
| MongoDB               | localhost:27017                                              | Business database                        |
| PostgreSQL            | localhost:5432                                               | Jobs + audit logs                        |
| Redis                 | localhost:6379                                               | Cache + tokens                           |
| Kafka                 | localhost:9092                                               | Event bus                                |
| Kafka UI *(optional)* | [http://localhost:8085](http://localhost:8085)               | Topic viewer                             |
| MinIO Console         | [http://localhost:9001](http://localhost:9001)               | File storage                             |
| Maildev               | [http://localhost:1080](http://localhost:1080)               | Email testing                            |

---

# 🔧 **Common Commands**

```bash
# Start services
make dev

# Stop services
make dev-down

# View logs
make dev-logs

# Connect to MongoDB
make mongo-shell

# Connect to PostgreSQL
make psql

# Seed databases
make seed

# Run tests
make test

# Full cleanup
make clean
```

---

# 📁 **Project Structure**

```
pharmonico/
├── backend-go/
│   ├── cmd/
│   │   ├── api/
│   │   └── worker/
│   ├── internal/
│   │   ├── cache/        # Redis wrappers
│   │   ├── events/       # Kafka producers/consumers
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── workers/
│   └── pkg/
│       └── ncpdp/
│
├── frontend-react/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── api/
│       └── store/
│
├── infra/
│   ├── docker/
│   └── nginx/
│
├── scripts/
│   └── seeds/
│       ├── mongo/
│       └── postgres/
│
├── docs/
│   ├── requirements.md
│   ├── sprint_plan.md
│   └── user_stories.md
│
├── docker-compose.yml
├── Makefile
└── README.md
```

---

# 🔧 **Technology Stack**

### **Backend (Go)**

* net/http
* MongoDB
* PostgreSQL
* Redis (tokens, caching, rate-limits)
* Kafka (event-driven workflow)
* MinIO (S3-compatible file storage)

### **Frontend (React + Vite)**

* React 18
* Tailwind CSS
* Zustand
* React Query
* React Router

### **Infrastructure**

* Docker & Docker Compose
* GitHub Actions CI
* Maildev (email testing)

### **Integrations (test mode)**

* Stripe
* Shippo
* SendGrid
* Twilio
* Gemini API (mock prescription generation)

---

# 📋 **Sprint Plan**

| Sprint       | Focus                                               | Status     |
| ------------ | --------------------------------------------------- | ---------- |
| **Sprint 0** | Monorepo, Docker, Redis, Kafka, CI                  | ✅ Complete |
| **Sprint 1** | Intake API + Validation Worker + Kafka Intake Topic | 🔄 Next    |
| **Sprint 2** | Enrollment Flow + Redis Magic Links                 | ⏳ Planned  |
| **Sprint 3** | Pharmacy Routing + Redis Cache                      | ⏳ Planned  |
| **Sprint 4** | Payments + Shipping + Webhooks                      | ⏳ Planned  |
| **Sprint 5** | Notifications + Audit Logs                          | ⏳ Planned  |

---

# 📚 **Learning Objectives**

Through Pharmonico you will learn:

### 🏥 **Healthcare**

* NCPDP SCRIPT
* Prescription life cycle
* Pharmacy routing
* Insurance adjudication

### 🏗️ **Software Engineering**

* REST API design
* Event-driven architecture with Kafka
* Redis caching patterns
* Worker pipelines
* File storage with MinIO/S3
* Multi-database architecture
* Secure magic links
* Stripe payment flows
* Shipping label automation

### 🔐 **Compliance & Ops**

* HIPAA basics
* Audit logging
* Webhooks
* Jobs & retries
* CI/CD pipelines

---

# 🤝 **Contributing**

This is a learning-oriented project—feel free to explore, contribute, and extend.

---

# 📄 **License**

MIT License — see `LICENSE`.

