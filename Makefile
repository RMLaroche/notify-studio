.PHONY: help install build test dev stop clean

help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	cd platform/backend && npm install
	cd platform/frontend && npm install
	cd clients/cli && npm install
	cd shared && npm install
	cd modules/discord && npm install

build: ## Build all components
	cd shared && npm run build
	cd clients/cli && npm run build
	cd platform/backend && npm run build
	cd platform/frontend && npm run build
	cd modules/discord && npm run build

test: ## Run all tests
	cd platform/backend && npm test
	cd clients/cli && npm test
	cd platform/frontend && npm test

dev: ## Start development servers
	cd platform/backend && npm run dev &
	cd platform/frontend && npm start &

stop: ## Stop all services and free ports
	-lsof -ti:3000 | xargs kill -9 2>/dev/null
	-lsof -ti:3001 | xargs kill -9 2>/dev/null
	-pkill -f "npm.*dev" 2>/dev/null
	-pkill -f "npm.*start" 2>/dev/null
	-pkill -f "ts-node-dev" 2>/dev/null
	-pkill -f "react-scripts start" 2>/dev/null

clean: ## Clean build artifacts
	rm -rf platform/backend/dist
	rm -rf platform/frontend/build
	rm -rf clients/cli/dist
	rm -rf shared/dist
	rm -rf modules/discord/dist

cli-link: ## Link CLI globally
	cd clients/cli && npm run build && npm link

test-client: ## Start interactive test client
	@echo "🚀 Starting interactive test client..."
	@echo "Make sure the platform backend is running (make dev)"
	node test-client.js

discord-dev: ## Start Discord module in development mode
	@echo "🤖 Starting Discord module..."
	@echo "Make sure you have configured modules/discord/.env"
	cd modules/discord && npm run dev