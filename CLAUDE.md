# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Notify-Studio is a centralized web platform for routing logs/events/notifications to dedicated services through a visual flow interface. The project emphasizes a playful and intuitive user experience with drag & drop connections between sources and destinations.

**Current Status: Phase 1 MVP Complete** - Full client-to-dashboard workflow implemented with real-time communication.

## Architecture

### Backend
- **Node.js with Express** for REST API
- **Socket.io** for WebSocket management
- **SQLite** for data persistence
- **Joi/Zod** for input validation
- **Jest** for testing with **Supertest** for API testing

### Frontend
- **React with TypeScript**
- **Socket.io-client** for real-time communication
- **React Flow** for visual drag & drop connections
- **Tailwind CSS** for styling
- **Recharts** for metrics
- **React Testing Library** + **Cypress** for testing

### Infrastructure
- **Docker** with docker-compose (planned)
- Persistent volumes for SQLite
- Health checks for monitoring

### Project Structure
```
notify-studio/
├── clients/cli/          # CLI client with offline queuing
├── platform/
│   ├── backend/         # Express server + Socket.io  
│   └── frontend/        # React dashboard
├── modules/             # Output modules (Discord, Email, etc.)
├── shared/              # Shared TypeScript types
└── docs/                # Documentation
```

## Core Components

### Database Schema (SQLite)
- **clients**: Client producers (log sources) with tokens
- **output_modules**: Destinations (Discord, Email, Slack, Webhooks)
- **routing_rules**: Connections between clients and modules
- **message_history**: 7-day retention message storage

### Key Features
- **Dual output per client**: Logs + Alerts for flexible routing
- **Real-time monitoring**: Live message feed via WebSocket
- **One-time authentication codes**: 6-character tokens for client onboarding
- **Mixed protocol support**: REST for alerts, WebSocket for streams
- **Visual flow interface**: Drag & drop connections with React Flow
- **Offline message queuing**: CLI client queues messages locally when server unreachable
- **Hot-reload configurations**: Module settings update without restart to fix broken connections

### Output Modules
- **Discord Bot**: Rich embeds, rate limiting compliance
- **Email SMTP**: Template variables, delivery confirmation
- **Slack**: Webhook/Bot token support, custom formatting
- **Generic Webhook**: Custom payload templates, authentication

## Development Commands

### Platform Backend (platform/backend/)
```bash
npm install
npm run dev          # Development server (ts-node-dev)
npm run build        # TypeScript compilation
npm start           # Production server
npm test            # Jest unit tests
npm run test:api    # API integration tests
npm run lint        # ESLint checking
```

### Platform Frontend (platform/frontend/)
```bash
npm install
npm start           # React development server
npm run build       # Production build
npm test            # React component tests
npm run test:e2e    # Cypress E2E tests (planned)
```

### CLI Client (clients/cli/)
```bash
npm install
npm run build       # TypeScript compilation  
npm run dev         # Development with ts-node
npm test           # Jest tests (planned)
npm run lint       # ESLint checking
```

### Shared Types (shared/)
```bash
npm install
npm run build       # TypeScript compilation
npm run dev         # Watch mode compilation
```

### Docker Operations (planned)
```bash
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
```

## Testing Strategy

### Backend Testing
- **Unit tests** with Jest for database operations, routing logic, token validation
- **Integration tests** with Supertest for REST API endpoints
- **WebSocket tests** for real-time functionality

### Frontend Testing
- **Component tests** with React Testing Library
- **E2E tests** with Cypress for critical user flows
- **Cross-browser testing** for WebSocket compatibility

### Performance Testing
- Load tests for 100+ concurrent clients
- Message throughput testing (1000+ messages/second)
- Memory usage monitoring

## Security Considerations

- **Token expiration**: 24-hour default
- **Rate limiting** per token and IP
- **Input sanitization** for all user data
- **HTTPS/WSS enforcement** in production
- **Message history cleanup**: 7-day retention
- **Sensitive configuration encryption** at rest

## Development Phases

1. **Phase 1 - Core MVP** ✅ **COMPLETED**: Backend foundation, basic frontend, CLI client with offline queuing, real-time dashboard
2. **Phase 2 - Advanced UX**: React Flow integration, Discord/Email modules, filtering system, hot-reload configurations  
3. **Phase 3 - Polish**: Performance optimization, security hardening, Docker deployment, comprehensive documentation

## Phase 1 Achievements ✅

### Complete End-to-End Workflow
- **CLI Client**: Command execution, pipe integration, offline queuing, WebSocket streaming
- **Platform Backend**: REST API, WebSocket handling, SQLite database, token authentication
- **React Dashboard**: 3-column layout, real-time monitoring, client management, message filtering
- **Real-time Communication**: Live message updates, client status tracking, platform statistics

### Technical Foundation
- **TypeScript**: Strict configuration across all components
- **Monorepo Structure**: Clean separation with shared types
- **Authentication**: 6-character token system
- **Database**: SQLite with proper schema and migrations
- **Testing Setup**: Jest configuration (tests to be implemented)
- **Documentation**: Comprehensive README files and code documentation

## CLI Client

```bash
# Installation
npm install -g notify-studio-cli

# One-time alerts
notify-cli --server localhost:3000 --token A7X9K2 --message "Deploy completed" --level info --type alert

# Continuous streaming
notify-cli --server localhost:3000 --token A7X9K2 --stream --type logs

# Pipe integration
echo "Error occurred" | notify-cli --server localhost:3000 --token A7X9K2 --level error --type alert

# Offline mode (queues messages locally when server unreachable)
notify-cli --server localhost:3000 --token A7X9K2 --offline --queue-size 1000 --message "Critical alert" --level error --type alert
```

### CLI Features
- **Automatic reconnection** for WebSocket connections
- **Offline message queuing** with configurable local storage
- **Configurable retry logic** with exponential backoff
- **Environment variable** support for tokens

## Code Quality Standards

- **TypeScript strict mode** enabled
- **ESLint and Prettier** for formatting
- **Conventional Commits** for commit messages
- **Feature branches** with pull request reviews
- **Semantic versioning** for releases