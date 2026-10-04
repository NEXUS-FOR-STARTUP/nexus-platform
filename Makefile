# =============================================================================
# Makefile — Nexus Platform Local Development
# =============================================================================
# Daily dev tasks: start server, manage Docker DB, run tests
#
#   make dev             # Start API + Web (bun workspaces)
#   make db              # Start Docker DB
#   make db-stop         # Stop Docker DB
#   make db-migrate      # Run Prisma migrations
#   make db-backup       # Backup DB to prisma/backup/
#   make db-restore      # Restore from latest backup
#   make build           # Turbo build (not Docker)
#   make lint            # ESLint
#   make check-types     # TypeScript check
#   make test            # Run API tests
# =============================================================================

.PHONY: help dev db db-stop db-migrate db-reset db-backup db-restore \
	build lint check-types test

.DEFAULT_GOAL := help

DOCKER_COMPOSE := docker compose --env-file .env -f docker-compose.prod.yml

# ──────────────────────────────────────────
# Help
# ──────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ──────────────────────────────────────────
# Dev
# ──────────────────────────────────────────

dev: ## Start API + Web (bun workspaces, no Docker)
	@bun run dev

build: ## Turbo build (all workspaces)
	@bun run build

lint: ## ESLint all
	@bun run lint

check-types: ## TypeScript type check
	@bun run check-types

test: ## Run API tests
	@bun run --filter nexus-platform-api test

# ──────────────────────────────────────────
# Docker DB
# ──────────────────────────────────────────

db: ## Start PostgreSQL container
	@$(DOCKER_COMPOSE) up -d db

db-stop: ## Stop PostgreSQL container
	@$(DOCKER_COMPOSE) down db

db-migrate: ## Run Prisma migrations (local)
	@bun x prisma migrate dev --schema prisma/schema.prisma

db-migrate-deploy: ## Deploy migrations (production-safe)
	@bun x prisma migrate deploy --schema prisma/schema.prisma

db-reset: ## Reset DB (WARNING: deletes all data)
	@$(DOCKER_COMPOSE) down db
	@docker volume rm nexus-platform_postgres_data 2>/dev/null || true
	@$(DOCKER_COMPOSE) up -d db
	@sleep 3
	@bun x prisma migrate deploy --schema prisma/schema.prisma
	@echo "DB reset complete. Run 'make db-migrate' for local dev or restore backup."

db-seed: ## Seed service packages
	@bun x tsx prisma/seeds/seed-packages.ts
	@bun x tsx prisma/seeds/seed-active-packages.ts

db-backup: ## Backup DB to prisma/backup/
	@docker exec nexus-db pg_dump -U admin -d nexus_platform \
		> prisma/backup/nexus-db-backup-$$(date +%%Y-%%m-%%d-%%H%%M).sql 2>/dev/null
	@echo "Backed up to prisma/backup/"

db-restore: ## Restore DB from latest backup
	@latest=$$(ls -t prisma/backup/*.sql 2>/dev/null | head -1); \
	if [ -n "$$latest" ]; then \
		echo "Restoring $$latest..."; \
		docker exec -i nexus-db psql -U admin -d nexus_platform < "$$latest"; \
	else \
		echo "No backup found in prisma/backup/"; \
	fi
