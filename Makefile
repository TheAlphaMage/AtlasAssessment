# Shortcuts for the everyday commands. Every target just runs an npm script, so
# `make test` and `npm test` do the same thing. Run `make` on its own to see the list.
#
# Examples:
#   make install        install the locked dependencies
#   make dev            start the app on http://localhost:3000
#   make dev PORT=4000  start it on another port
#   make check          typecheck, test and build (what a clean clone must pass)

NPM  ?= npm
PORT ?= 3000

.DEFAULT_GOAL := help
# Run targets one after another, even with `make -j`, so `make check` stops at the first failure.
.NOTPARALLEL:
.PHONY: help check-node install env dev build start test test-watch typecheck check clean distclean

help: ## Show this list of commands
	@echo "Atlas Fresh Daily Export Planner"
	@echo
	@awk 'BEGIN { FS = ":.*## " } /^[a-zA-Z_-]+:.*## / { printf "  make %-11s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

check-node: # Used by other targets. Stops early if Node is too old.
	@node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 12)) { console.error("Node 22.12 or newer is required, found " + process.versions.node); process.exit(1); }'

install: check-node ## Install the exact locked dependencies (npm ci)
	$(NPM) ci

env: ## Create .env from .env.example if it does not exist yet
	@if [ -f .env ]; then \
		echo ".env already exists, leaving it alone."; \
	else \
		cp .env.example .env; \
		echo "Created .env. Add DEEPSEEK_API_KEY=... to switch the AI assistant on."; \
	fi

dev: check-node ## Start the development server (PORT=3000 by default)
	PORT=$(PORT) $(NPM) run dev

build: check-node ## Build the production bundle
	$(NPM) run build

start: build ## Build, then run the production server (PORT=3000 by default)
	PORT=$(PORT) $(NPM) start

test: ## Run the unit tests once
	$(NPM) test

test-watch: ## Re-run the unit tests when a file changes
	npx vitest

typecheck: ## Check the TypeScript types
	$(NPM) run typecheck

check: typecheck test build ## Typecheck, test and build in order

clean: ## Delete build output (.next, coverage)
	rm -rf .next coverage *.tsbuildinfo

distclean: clean ## Also delete node_modules (run `make install` afterwards)
	rm -rf node_modules
