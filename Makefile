# BioLens Development Makefile
.PHONY: help setup start stop restart logs clean test build

# Default target
help:
	@echo "BioLens Development Commands:"
	@echo ""
	@echo "  setup     - Set up development environment"
	@echo "  start     - Start all services"
	@echo "  stop      - Stop all services"
	@echo "  restart   - Restart all services"
	@echo "  logs      - View logs for all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo "  test      - Run all tests"
	@echo "  build     - Build all Docker images"
	@echo ""
	@echo "Service-specific commands:"
	@echo "  logs-backend     - View backend logs"
	@echo "  logs-frontend    - View frontend logs"
	@echo "  logs-biobert     - View BioBERT service logs"
	@echo "  logs-image       - View image analysis service logs"

# Setup development environment
setup:
	@echo "Setting up BioLens development environment..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file"; fi
	@if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "Created backend/.env file"; fi
	@if [ ! -f frontend/.env.local ]; then cp frontend/.env.example frontend/.env.local; echo "Created frontend/.env.local file"; fi
	@echo "Environment files created. Please update them with your actual values."

# Start all services
start:
	@echo "Starting BioLens services..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "Services started. Access at:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend: http://localhost:8000"
	@echo "  BioBERT: http://localhost:8001"
	@echo "  Image Analysis: http://localhost:8002"

# Stop all services
stop:
	@echo "Stopping BioLens services..."
	docker-compose down

# Restart all services
restart: stop start

# View logs for all services
logs:
	docker-compose logs -f

# Service-specific logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-biobert:
	docker-compose logs -f biobert-service

logs-image:
	docker-compose logs -f image-analysis-service

# Clean up containers and volumes
clean:
	@echo "Cleaning up BioLens environment..."
	docker-compose down -v --rmi local
	docker system prune -f

# Run all tests
test:
	@echo "Running backend tests..."
	cd backend && poetry run pytest
	@echo "Running BioBERT service tests..."
	cd ml-services/biobert-service && poetry run pytest
	@echo "Running image analysis service tests..."
	cd ml-services/image-analysis-service && poetry run pytest

# Build all Docker images
build:
	@echo "Building BioLens Docker images..."
	docker-compose build --parallel

# Development helpers
dev-backend:
	cd backend && poetry run uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev-biobert:
	cd ml-services/biobert-service && poetry run uvicorn app.main:app --reload --port 8001

dev-image:
	cd ml-services/image-analysis-service && poetry run uvicorn app.main:app --reload --port 8002