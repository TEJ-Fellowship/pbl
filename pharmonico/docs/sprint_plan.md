# ✅ **SPRINT 0 — Repo + Infra Bootstrap**

### **TASK-0.1:** Initialize monorepo

* Structure: `backend-go/`, `frontend-react/`, `infra/`, `scripts/`, `docs/`.

### **TASK-0.2:** Create Docker Compose Dev Environment

Services:

* golang-api
* react-app
* mongodb
* postgres
* minio
* maildev
* nginx reverse proxy (optional)
* worker container (placeholder)

### **TASK-0.3:** Add README + Development Run Scripts

* `make dev`
* `make seed`
* `make test`
* Architecture overview

### **TASK-0.4:** Seed Scripts

* Mongo seeds: pharmacies, sample prescriptions
* Postgres seeds: job queue schema, audit log schema

### **TASK-0.5:** CI Skeleton

* GitHub Actions:

  * Go tests
  * React tests
  * Linters
  * Build checks

---

# ✅ **SPRINT 1 — Intake + Validation Worker**

### **TASK-1.1:** Implement POST `/api/intake`

* Accept NCPDP-like data
* Store in MongoDB with `status: "received"`
* Link to patient if exists
  **Requirements:** Intake workflow, prescription data structure

### **TASK-1.2:** Create PostgreSQL Jobs Table + Minimal Enqueuer

* Schema for jobs: `pending/processing/failed/succeeded`
* Enqueue `validate_prescription` on intake
  **Requirements:** Job queue + background work system

### **TASK-1.3:** Implement Validation Worker (Go)

* Poll jobs table
* Validate prescription: NPI, NDC, dosage, demographics
* Update Mongo: `validated` OR `validation_issue`
  **Requirements:** NCPDP validation rules

### **TASK-1.4:** Basic Ops UI

* Two tabs in React:

  * **Intake**
  * **Validation**
* Display statuses, details, errors

---

# ✅ **SPRINT 2 — Enrollment Flow + Magic Links**

### **TASK-2.1:** Magic Link Generator Endpoint

* `/api/enrollment/start`
* Create token + expiry in Mongo
* Store patient reference
  **Requirements:** Patient onboarding & authorization process

### **TASK-2.2:** Email/SMS Integration (Dev Mode)

* Maildev for email previews
* SMS mock or Twilio test mode
* Magic link deep link

### **TASK-2.3:** Enrollment SPA (React)

Routes:

* `/enroll/:token` → verify token
  Forms:
* Insurance details
* Consent checkboxes
* File upload: insurance card → MinIO
  **Requirements:** Enrollment workflow

### **TASK-2.4:** Enrollment Worker

* Detect enrollment completion
* Validate insurance info
* Move prescription to next stage
* Enqueue `pharmacy_recommendation` job
  **Requirements:** Post-enrollment state transitions

---

# ✅ **SPRINT 3 — Pharmacy Routing + Adjudication**

### **TASK-3.1:** Implement Pharmacy Scoring Engine

Factors:

* Distance
* Current load/capacity
* Accepted insurers
* Specialty match
  **Requirements:** Pharmacy routing and load balancing

### **TASK-3.2:** Ops UI — Pharmacy Selection

* Show ranked pharmacies
* Manual override
* Update Mongo with selected pharmacy

### **TASK-3.3:** Mock Adjudication API

* Fake claim simulation
* Results: copay, coupon, reimbursement
* Save adjudication record
  **Requirements:** Insurance adjudication simulation

### **TASK-3.4:** Adjudication Worker

* Process `run_adjudication` jobs
* Attach results to prescription
* Enqueue `create_payment_link`

---

# ✅ **SPRINT 4 — Payments + Shipping + Webhooks + Audits + Notifications + Testing**

### **TASK-4.1:** Stripe Payment Link Integration

* `/api/payments/create-link`
* Save Stripe session ID
* Return payment URL
  **Requirements:** Payment processing flow

### **TASK-4.2:** Stripe Webhook Handler

* `/webhook/stripe`
* Validate signature
* On payment success: update status → `paid`
* Enqueue `start_shipping` job

### **TASK-4.3:** Shipping Integration (Shippo)

* Generate label
* Save tracking number
* Update prescription to `shipped`
  **Requirements:** Fulfillment + logistics

### **TASK-4.4:** Delivery Tracking Worker

* Poll Shippo test API
* Mark as `delivered` when confirmed
* Notify patient (email/SMS)

### **TASK-4.5:** Audit Log System

* Postgres `audit_logs` table
* Every state change → log entry
* Ops UI → Audit Log Viewer
  **Requirements:** Audit + compliance

### **TASK-4.6:** Notification System

* Email templates:

  * Enrollment started
  * Payment link
  * Shipping confirmation
  * Delivery confirmation
* SMS optional

### **TASK-4.7:** Ops Dashboard Finalization

* Full workflow timeline
* Search (patient name, Rx ID)
* Filters (status, pharmacy, insurance)

### **TASK-4.8:** Observability

* Logging (Zap or Logrus)
* Basic metrics `/metrics` endpoint
* Track job failures / retry counts

### **TASK-4.9:** E2E Testing

* Intake → Validation
* Enrollment → Routing
* Adjudication → Payment
* Shipping → Delivery
* Worker reliability tests

### **TASK-4.10:** Deployment Preparation (Optional)

* Dockerfile optimizations
* Production `docker-compose.prod.yml`
* Environment variable templates

---

# 🚀 **FINAL STRUCTURE (SPRINTS 0–4)**

| Sprint       | Focus Area                                                             |
| ------------ | ---------------------------------------------------------------------- |
| **Sprint 0** | Infra, Monorepo, Docker, Seeds, CI                                     |
| **Sprint 1** | Intake, Validation Worker, Ops Intake UI                               |
| **Sprint 2** | Enrollment, Magic Links, Insurance, Enrollment Worker                  |
| **Sprint 3** | Pharmacy Routing, Adjudication, Ops Routing UI                         |
| **Sprint 4** | Payments, Shipping, Delivery, Webhooks, Audits, Notifications, Testing |


