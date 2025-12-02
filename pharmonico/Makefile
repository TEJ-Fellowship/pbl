.PHONY: help dev dev-build dev-down dev-logs seed test test-backend test-frontend lint clean setup

# Default target
help:
	@echo "Pharmonico - Prescription Fulfillment System"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Development:"
	@echo "  dev          Start all services in development mode"
	@echo "  dev-build    Build and start all services"
	@echo "  dev-down     Stop all services"
	@echo "  dev-logs     View logs from all services"
	@echo "  dev-api      View API logs only"
	@echo "  dev-worker   View worker logs only"
	@echo ""
	@echo "Database:"
	@echo "  seed         Run database seed scripts"
	@echo "  db-reset     Reset all databases (WARNING: deletes all data)"
	@echo ""
	@echo "Testing:"
	@echo "  test         Run all tests"
	@echo "  test-backend Run Go backend tests"
	@echo "  test-frontend Run React frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint         Run linters for all code"
	@echo "  lint-backend Run Go linter"
	@echo "  lint-frontend Run ESLint for React"
	@echo ""
	@echo "Setup:"
	@echo "  setup        Initial project setup"
	@echo "  clean        Remove all containers, volumes, and build artifacts"

# ============================================================
# Development
# ============================================================

dev:
	docker compose up

dev-build:
	docker compose up --build

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

dev-api:
	docker compose logs -f api

dev-worker:
	docker compose logs -f worker

dev-frontend:
	docker compose logs -f frontend

# ============================================================
# Database
# ============================================================

seed:
	@echo "Seeding databases..."
	docker compose exec mongodb mongosh pharmonico /docker-entrypoint-initdb.d/001_pharmacies.js
	docker compose exec mongodb mongosh pharmonico /docker-entrypoint-initdb.d/002_sample_prescriptions.js
	@echo "✅ Database seeding complete!"

db-reset:
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker compose down -v
	docker compose up -d mongodb postgres
	@echo "Waiting for databases to start..."
	sleep 10
	make seed
	@echo "✅ Databases reset complete!"

# ============================================================
# Testing
# ============================================================

test: test-backend test-frontend
	@echo "✅ All tests passed!"

test-backend:
	@echo "Running Go tests..."
	cd backend-go && go test -v ./...

test-frontend:
	@echo "Running React tests..."
	cd frontend-react && npm test -- --run

test-coverage:
	@echo "Running tests with coverage..."
	cd backend-go && go test -coverprofile=coverage.out ./...
	cd frontend-react && npm run test:coverage

# ============================================================
# Code Quality
# ============================================================

lint: lint-backend lint-frontend
	@echo "✅ Linting complete!"

lint-backend:
	@echo "Running Go linter..."
	cd backend-go && go vet ./...
	@if command -v golangci-lint > /dev/null; then \
		cd backend-go && golangci-lint run; \
	else \
		echo "golangci-lint not installed, skipping..."; \
	fi

lint-frontend:
	@echo "Running ESLint..."
	cd frontend-react && npm run lint

fmt:
	@echo "Formatting code..."
	cd backend-go && go fmt ./...
	cd frontend-react && npm run format 2>/dev/null || true

# ============================================================
# Setup & Cleanup
# ============================================================

setup:
	@echo "Setting up development environment..."
	@echo "Installing Go dependencies..."
	cd backend-go && go mod download
	@echo "Installing Node dependencies..."
	cd frontend-react && npm install
	@echo "✅ Setup complete! Run 'make dev' to start."

clean:
	@echo "Cleaning up..."
	docker compose down -v --rmi local
	rm -rf backend-go/bin
	rm -rf frontend-react/node_modules
	rm -rf frontend-react/dist
	@echo "✅ Cleanup complete!"

# ============================================================
# Utility
# ============================================================

# Connect to MongoDB shell
mongo-shell:
	docker compose exec mongodb mongosh pharmonico

# Connect to PostgreSQL
psql:
	docker compose exec postgres psql -U postgres -d pharmonico

# View MinIO console
minio-console:
	@echo "MinIO Console: http://localhost:9001"
	@echo "Username: minioadmin"
	@echo "Password: minioadmin"

# View Maildev UI
maildev:
	@echo "Maildev UI: http://localhost:1080"

