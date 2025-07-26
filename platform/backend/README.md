# Notify-Studio Platform Backend

Express.js API server with SQLite database, WebSocket support, and authentication for the Notify-Studio platform.

## 🚀 Features

- **REST API**: Complete API for client management, authentication, and message handling
- **WebSocket Support**: Real-time updates for the dashboard using Socket.io
- **SQLite Database**: Persistent storage with migrations and statistics
- **Token Authentication**: 6-character alphanumeric token system
- **Health Monitoring**: Built-in health check and statistics endpoints
- **TypeScript**: Full type safety with Zod validation

## 📁 Project Structure

```
platform/backend/
├── src/
│   ├── database/           # Database schema and operations
│   ├── middleware/         # Express middleware (auth, etc.)
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── tests/                 # Comprehensive test suite
└── data/                  # SQLite database files
```

## 🏁 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
cd platform/backend
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/generate-token` - Generate new client token
- `POST /api/auth/register` - Register client with token

### Client Management

- `GET /api/clients` - List all clients
- `DELETE /api/clients/:id` - Delete client

### Alerts & Messages

- `POST /api/alert` - Submit alert/message (requires auth)
- `GET /api/messages` - Get recent messages
- `GET /api/messages/client/:id` - Get messages by client

### Health & Monitoring

- `GET /health` - Health check with statistics

## 🔐 Authentication

The backend uses a token-based authentication system:

1. Generate a 6-character alphanumeric token via `/api/auth/generate-token`
2. Register the client with the token via `/api/auth/register`
3. Include token in `Authorization: Bearer TOKEN` header for API calls

## 🌐 WebSocket Events

The WebSocket service provides real-time updates:

- **Dashboard Room**: `dashboard` - For web interface updates
- **Client Events**: New client registrations, status changes
- **Message Events**: Real-time message broadcasting

## 💾 Database Schema

### Clients Table
- `id` - Auto-increment primary key
- `name` - Client display name
- `token` - Authentication token (unique)
- `connection_type` - 'rest' or 'websocket'
- `created_at` - Registration timestamp
- `last_seen` - Last activity timestamp

### Messages Table
- `id` - Auto-increment primary key
- `client_id` - Foreign key to clients
- `message` - Message content
- `level` - 'info', 'warning', 'error'
- `type` - 'alerts', 'logs', etc.
- `metadata` - JSON metadata
- `created_at` - Message timestamp

## 🧪 Testing

Comprehensive test suite covering:

- **API Tests**: All endpoints with authentication
- **Database Tests**: CRUD operations and queries
- **WebSocket Tests**: Real-time communication
- **Integration Tests**: End-to-end workflows

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test -- --testPathPattern=database

# Watch mode for development
npm test -- --watch
```

## 🔧 Configuration

Environment variables:

- `PORT` - Server port (default: 3001)
- `DATABASE_PATH` - SQLite database path (default: ./data/notify-studio.db)
- `NODE_ENV` - Environment mode

## 📊 Health Monitoring

The `/health` endpoint provides:

- Server status and uptime
- Database connectivity
- Client and message statistics
- Active connections count

## 🚀 Deployment

1. Build the application: `npm run build`
2. Set environment variables
3. Start with: `npm start`
4. Database migrations run automatically on startup

## 📝 Development Notes

- Uses TypeScript with strict type checking
- Zod for runtime validation
- SQLite with automatic migrations
- Express.js with CORS enabled
- Socket.io for WebSocket support