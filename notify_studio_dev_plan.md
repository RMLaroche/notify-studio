# Notify-Studio Development Plan

## Project Overview

### Core Concept
Develop a centralized web platform for easily routing logs/events/notifications to dedicated services. The emphasis is on a **playful and intuitive user experience** with a graphical "flow" interface to visually connect sources to destinations.

### Key Features
- **Visual flow interface** with drag & drop connections
- **Dual output per client** (logs + alerts) for flexible routing
- **Real-time monitoring** with live message feed
- **One-time authentication codes** for seamless client onboarding
- **Mixed protocol support** (REST for alerts, WebSocket for streams)
- **Modular output system** (Discord, Email, Slack, Webhooks)

## Technical Stack

### Backend
- **Node.js** with Express for REST API
- **Socket.io** for WebSocket management
- **SQLite** for data persistence (simple, no dependencies)
- **Joi** or **Zod** for input validation
- **Jest** for testing framework
- **Supertest** for API testing

### Frontend
- **React** with **TypeScript**
- **Socket.io-client** for real-time communication
- **React Flow** for visual drag & drop connections
- **Tailwind CSS** for styling
- **Recharts** for metrics and graphs
- **React Testing Library** for component testing
- **Cypress** for E2E testing

### Infrastructure
- **Docker** with docker-compose
- **Persistent volumes** for SQLite and configuration
- **Health checks** for container monitoring

## Database Schema

### SQLite Structure
```sql
-- Client producers (log sources)
CREATE TABLE clients (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME,
    connection_type TEXT -- 'websocket' | 'rest' | 'both'
);

-- Output modules (destinations)
CREATE TABLE output_modules (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'discord', 'email', 'slack', 'webhook'
    config JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routing connections
CREATE TABLE routing_rules (
    id INTEGER PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    output_module_id INTEGER REFERENCES output_modules(id),
    stream_type TEXT NOT NULL, -- 'logs' | 'alerts'
    filters JSON,
    rate_limit JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Message history (7-day retention)
CREATE TABLE message_history (
    id INTEGER PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    message TEXT NOT NULL,
    level TEXT, -- 'info', 'warn', 'error', 'debug'
    stream_type TEXT, -- 'logs' | 'alerts'
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Architecture

### REST Endpoints
```
POST /api/auth/generate-token    # Generate client token
POST /api/clients               # Register client
GET  /api/clients               # List clients
DELETE /api/clients/:id         # Remove client

POST /api/modules               # Add output module
GET  /api/modules               # List modules
PUT  /api/modules/:id           # Update module
DELETE /api/modules/:id         # Remove module

POST /api/routing               # Create routing rule
GET  /api/routing               # List routing rules
PUT  /api/routing/:id           # Update routing rule
DELETE /api/routing/:id         # Remove routing rule

POST /api/alert                 # Send one-time alert (REST clients)
GET  /api/history               # Retrieve message history
GET  /api/metrics               # Get dashboard metrics
```

### WebSocket Events
```javascript
// Client events
'client-connect' -> { token, clientName, connectionType }
'stream-message' -> { message, level, streamType, metadata }
'heartbeat' -> { timestamp }

// Dashboard events
'dashboard-connect' -> {}
'client-status-update' <- { clientId, status, lastSeen }
'new-message' <- { clientId, message, level, streamType, timestamp }
'routing-update' <- { routingRules }
'metrics-update' <- { activeClients, messagesPerMin, errors }
```

## Output Modules Implementation

### Discord Bot Module
**Configuration:**
- Bot Token (required)
- Channel ID (required)
- Mentions array (optional)
- Message template (optional)

**Features:**
- Rich embed support
- Rate limiting compliance
- Connection health monitoring

### Email SMTP Module
**Configuration:**
- SMTP host, port, credentials
- Recipient list
- Subject template
- HTML/text formatting

**Features:**
- Template variables support
- Attachment capability (future)
- Delivery confirmation

### Slack Module
**Configuration:**
- Webhook URL or Bot Token
- Channel selection
- Username customization
- Slack-specific formatting

### Generic Webhook Module
**Configuration:**
- Target URL
- HTTP method
- Headers
- Custom payload template
- Authentication options

## User Interface Specifications

### Main Layout (3-Column Design)

#### Left Column - Client Producers
```
┌─────────────────────────────┐
│ + Add New Client            │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Claude Code Session     │ │
│ │ ● Connected (WebSocket) │ │
│ │ 45 msg/min              │ │
│ │ ┌─────┐ ┌─────┐        │ │
│ │ │LOGS │ │ALERT│        │ │ ← Dual outputs
│ │ └─────┘ └─────┘        │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Center Column - Real-time Monitoring
- **Live message feed** (scrollable, color-coded by client)
- **Metrics dashboard** (messages/min, active clients, error count)
- **Visual connection status** (animated lines during message flow)

#### Right Column - Output Modules
- **Module cards** with status indicators
- **Configuration buttons** for each module
- **Performance metrics** (messages sent, success rate)

### Interactive Features

#### Drag & Drop Connections
- **Source outputs** (LOGS/ALERT) draggable to destination modules
- **Visual feedback** during drag operation
- **Connection lines** with animation on message transmission
- **Color coding** (logs = blue, alerts = red/orange)

#### Configuration Modals
- **Client addition** with token generation
- **Module setup** with real-time validation
- **Routing rules** with filter configuration
- **Template editor** with variable preview

### User Experience Flow

1. **Initial Setup:**
   - Launch Docker container
   - Access web interface (localhost:3000)
   - Empty dashboard with "Add" buttons

2. **Module Configuration:**
   - Click "+ Add Module"
   - Select type (Discord, Email, etc.)
   - Fill configuration form
   - Test connection automatically
   - Module appears with green status

3. **Client Registration:**
   - Click "+ Add Client"
   - Enter client name
   - Generate 6-character code (e.g., A7X9K2)
   - Client block appears in "waiting" state (orange)

4. **Client Connection:**
   - Use CLI with generated token
   - Block turns green on successful connection
   - Dual outputs (LOGS/ALERT) become draggable

5. **Routing Setup:**
   - Drag from client output to module
   - Configure filters in popup
   - Connection line appears
   - Live message flow visualization

## CLI Client Implementation

### Installation & Usage
```bash
# Global installation
npm install -g notify-studio-cli

# One-time alerts (REST)
notify-cli --server localhost:3000 --token A7X9K2 \
          --message "Deploy completed" --level info --type alert

# Continuous streaming (WebSocket)
notify-cli --server localhost:3000 --token A7X9K2 --stream --type logs

# Pipe integration
echo "Critical error occurred" | notify-cli --server localhost:3000 \
                                           --token A7X9K2 --level error --type alert

# Log file monitoring
tail -f /var/log/app.log | notify-cli --server localhost:3000 \
                                     --token A7X9K2 --stream --type logs

# Offline mode (queues messages locally when server unreachable)
notify-cli --server localhost:3000 --token A7X9K2 --offline --queue-size 1000 \
          --message "Critical alert" --level error --type alert
```

### CLI Features
- **Automatic reconnection** for WebSocket connections
- **Configurable retry logic** with exponential backoff
- **Local configuration** file support
- **Multiple output formats** (JSON, plain text)
- **Environment variable** support for tokens
- **Offline message queuing** with local storage when server is unreachable

## Development Phases

### Phase 1 - Core MVP (2-3 weeks)

#### Backend Foundation
- **Project setup** with TypeScript, Express, Socket.io
- **Database schema** implementation with migrations
- **Basic REST API** (auth, clients, modules, routing)
- **WebSocket handling** for client connections and dashboard
- **Token generation** and validation system

#### Frontend Foundation
- **React TypeScript** project setup
- **Basic 3-column layout** with Tailwind CSS
- **Client and module** addition forms
- **Real-time connection** status display
- **Simple message feed** implementation

#### Output Modules
- **Discord module** implementation with full feature set
- **Email module** with SMTP support
- **Basic webhook** module for generic integrations

#### CLI Client
- **Basic CLI** with REST and WebSocket support
- **Token authentication** system
- **Message formatting** and metadata handling
- **Offline message queuing** implementation with local storage

#### Testing Foundation
- **Unit tests** for core backend functions
- **API integration tests** with Supertest
- **Basic React component** tests
- **Docker setup** with health checks

### Phase 2 - Advanced UX (2-3 weeks)

#### Visual Flow Interface
- **React Flow integration** for drag & drop
- **Visual connection** system between clients and modules
- **Real-time animation** for message transmission
- **Connection configuration** modals with filters

#### Advanced Features
- **Message filtering** system (level, keywords, regex)
- **Rate limiting** implementation with various strategies
- **Template system** for message formatting
- **Metrics dashboard** with charts and analytics
- **Hot-reload module configurations** for fixing broken connections without restart

#### Additional Modules
- **Slack integration** with rich formatting
- **Advanced webhook** module with authentication
- **Custom module** creation framework

#### Enhanced Testing
- **E2E tests** with Cypress for critical flows
- **WebSocket testing** for real-time features
- **Load testing** for message throughput
- **Module integration** tests with mocked services
- **Offline queuing** tests for CLI client resilience
- **Hot-reload** testing for module configuration updates

### Phase 3 - Polish & Production (1-2 weeks)

#### Performance & Optimization
- **Database indexing** and query optimization
- **WebSocket connection** pooling and management
- **Frontend performance** optimization (memoization, lazy loading)
- **Memory leak** prevention and monitoring

#### Security & Reliability
- **Input validation** hardening
- **Rate limiting** for API endpoints
- **Error handling** and recovery mechanisms
- **Logging and monitoring** implementation

#### Documentation & Deployment
- **Comprehensive README** with examples
- **API documentation** (OpenAPI/Swagger)
- **Deployment guides** for various platforms
- **Troubleshooting guide** and FAQ

## Testing Strategy

### Backend Testing

#### Unit Tests (Jest)
- **Database operations** with in-memory SQLite
- **Message routing** logic validation
- **Token generation** and validation
- **Filter matching** algorithms
- **Rate limiting** functionality

#### Integration Tests (Supertest)
- **REST API endpoints** with various scenarios
- **Authentication flows** and token validation
- **Database transactions** and rollbacks
- **Output module** integrations with mocked services

#### WebSocket Tests
- **Connection establishment** and maintenance
- **Message broadcasting** to multiple clients
- **Reconnection handling** and error recovery
- **Concurrent client** management

### Frontend Testing

#### Component Tests (React Testing Library)
- **UI components** in isolation
- **User interactions** (clicks, drags, form submissions)
- **State management** and prop passing
- **Conditional rendering** based on data

#### Integration Tests
- **Real-time updates** from WebSocket
- **Drag & drop** functionality
- **Form validation** and error handling
- **Modal interactions** and data flow

### End-to-End Tests (Cypress)

#### Critical User Flows
- **Complete setup** flow (add client → add module → create connection)
- **Message routing** verification (send message → verify delivery)
- **Configuration changes** and real-time updates
- **Error scenarios** and recovery

#### Cross-browser Testing
- **Chrome, Firefox, Safari** compatibility
- **Responsive design** on different screen sizes
- **WebSocket support** across browsers

### Performance Testing

#### Load Tests
- **Concurrent client** connections (100+ clients)
- **Message throughput** testing (1000+ messages/second)
- **Memory usage** monitoring under load
- **Database performance** with large datasets

#### Stress Tests
- **Connection drop** and recovery scenarios
- **High message volume** burst handling
- **Resource exhaustion** recovery
- **Network interruption** resilience

## Security Considerations

### Authentication & Authorization
- **Token expiration** (24-hour default)
- **Rate limiting** per token and IP
- **Input sanitization** for all user data
- **CORS configuration** for web interface

### Data Protection
- **Sensitive configuration** encryption at rest
- **Message history** automatic cleanup (7-day retention)
- **Audit logging** for administrative actions
- **Secure defaults** for all configurations

### Network Security
- **HTTPS enforcement** in production
- **WebSocket secure** connections (WSS)
- **Container isolation** and minimal attack surface
- **Health check** endpoints without sensitive data

## Deployment Strategy

### Docker Configuration
- **Multi-stage build** for optimized images
- **Non-root user** execution
- **Health checks** for container orchestration
- **Volume mounting** for persistent data

### Environment Management
- **Environment variables** for all configuration
- **Secrets management** for sensitive data
- **Configuration validation** on startup
- **Graceful shutdown** handling

### Monitoring & Observability
- **Application metrics** (Prometheus format)
- **Health check** endpoints
- **Structured logging** with correlation IDs
- **Error tracking** and alerting

## Development Guidelines

### Code Quality
- **TypeScript strict mode** enabled
- **ESLint and Prettier** for code formatting
- **Commit message** conventions (Conventional Commits)
- **Code review** requirements for all changes

### Git Workflow
- **Feature branches** for all development
- **Pull request** templates with testing checklist
- **Automated testing** on all commits
- **Semantic versioning** for releases

### Documentation Standards
- **README.md** with quick start guide
- **API documentation** with examples
- **Architecture decisions** recorded (ADRs)
- **Inline code** documentation for complex logic

This development plan provides a comprehensive roadmap for building Notify-Studio with emphasis on user experience, testing, and production readiness.