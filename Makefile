.DEFAULT_GOAL := help

# ==============================================================================
# Variables
# ==============================================================================

# Get the directory of the Makefile
MAKEFILE_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

# ==============================================================================
# Help
# ==============================================================================

.PHONY: help
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install                     Install all dependencies for frontend and backend"
	@echo "  dev                         Start the development servers for frontend and backend"
	@echo "  test                        Run tests for frontend and backend"
	@echo "  lint                        Lint the frontend and backend code"
	@echo "  docker-build                Build the production Docker images"
	@echo "  docker-up                   Start the production application with Docker Compose"
	@echo "  docker-down                 Stop the production application"
	@echo "  docker-dev-up               Start the development environment with Docker Compose"
	@echo "  docker-dev-down             Stop the development environment"
	@echo "  clean                       Remove generated files and caches"


# ==============================================================================
# Project Commands
# ==============================================================================

.PHONY: install
install: install-backend install-frontend ## Install all dependencies

.PHONY: install-backend
install-backend:
	@echo ">>> Installing backend dependencies..."
	@cd backend && uv sync --all-extras

.PHONY: install-frontend
install-frontend:
	@echo ">>> Installing frontend dependencies..."
	@cd frontend && npm install

.PHONY: dev
dev: ## Start development servers
	@echo ">>> Starting development servers..."
	@echo ">>> Starting backend server..."
	@bash -c 'set -a; source .env; set +a; cd backend && uv run uvicorn app.main:app --reload' &
	@echo ">>> Starting frontend server..."
	@bash -c 'set -a; source .env; set +a; cd frontend && npm run dev'

.PHONY: test
test: test-backend test-frontend ## Run all tests

.PHONY: test-backend
test-backend:
	@echo ">>> Running backend tests..."
	@cd backend && uv run pytest

.PHONY: test-frontend
test-frontend:
	@echo ">>> Running frontend tests..."
	@cd frontend && npm test

.PHONY: lint
lint: lint-backend lint-frontend ## Lint all code

.PHONY: lint-backend
lint-backend:
	@echo ">>> Linting backend code..."
	@cd backend && uv run ruff check .

.PHONY: lint-frontend
lint-frontend:
	@echo ">>> Linting frontend code..."
	@cd frontend && npm run lint


# ==============================================================================
# Docker Commands
# ==============================================================================

.PHONY: docker-build
docker-build: ## Build production Docker images
	@echo ">>> Building production Docker images..."
	@docker compose build

.PHONY: docker-up
docker-up: ## Start production application
	@echo ">>> Starting production application..."
	@docker compose up -d

.PHONY: docker-down
docker-down: ## Stop production application
	@echo ">>> Stopping production application..."
	@docker compose down

.PHONY: docker-dev-up
docker-dev-up: ## Start development environment with Docker
	@echo ">>> Starting development environment with Docker..."
	@docker compose -f docker-compose.dev.yml up -d

.PHONY: docker-dev-down
docker-dev-down: ## Stop development environment with Docker
	@echo ">>> Stopping development environment with Docker..."
	@docker compose -f docker-compose.dev.yml down


# ==============================================================================
# Cleaning
# ==============================================================================

.PHONY: clean
clean: ## Remove generated files
	@echo ">>> Cleaning up..."
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type d -name ".pytest_cache" -exec rm -r {} +
	@find . -type d -name ".ruff_cache" -exec rm -r {} +
	@rm -rf backend/.venv
	@rm -rf frontend/.next
	@rm -rf frontend/node_modules
	@echo ">>> Done."
