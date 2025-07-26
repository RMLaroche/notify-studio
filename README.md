# Notify-Studio

A centralized notification routing platform with visual flow interface for managing alerts, logs, and notifications from multiple sources to various output destinations.

## 🚀 Features

- **Multi-Client Support**: CLI client with offline queuing and piping support
- **Real-time Dashboard**: React-based dashboard with live updates via WebSocket
- **Output Modules**: Extensible system for routing to Discord, Email, Slack, etc.
- **Offline Capabilities**: Queue messages when server is unreachable
- **Token-based Authentication**: 6-character alphanumeric tokens for client authentication
- **Visual Flow Interface**: Manage notification flows through an intuitive UI

## 📁 Project Structure

```
notify-studio/
├── clients/                 # Client implementations
│   └── cli/                # Command-line client
├── platform/               # Core platform server
│   ├── backend/            # Express.js API server
│   └── frontend/           # React dashboard
├── modules/                # Output destination modules
├── shared/                 # Shared types and utilities
└── docs/                   # Documentation
```

## 🏁 Quick Start

### Prerequisites

**Option 1: Docker (Recommended)**
- Docker 20.10+
- Docker Compose 2.0+

**Option 2: Local Development**
- Node.js 18+ and npm
- Git

### Installation

#### 🐳 Docker Deployment (Recommended)

1. **Clone and configure**
   ```bash
   git clone https://github.com/RMLaroche/notify-studio.git
   cd notify-studio
   cp .env.docker.example .env.docker
   # Edit .env.docker with your configuration
   ```

2. **Start the platform**
   ```bash
   # Production deployment
   make docker-prod
   
   # Or with Discord module
   make docker-discord
   ```

3. **Access the application**
   - Frontend Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001

#### 💻 Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/RMLaroche/notify-studio.git
   cd notify-studio
   ```

2. **Install dependencies**
   ```bash
   # Install platform backend dependencies
   cd platform/backend
   npm install

   # Install platform frontend dependencies
   cd ../frontend
   npm install

   # Install CLI client dependencies
   cd ../../clients/cli
   npm install
   ```

3. **Start the platform**
   ```bash
   # Start backend (in platform/backend)
   npm run dev

   # Start frontend (in platform/frontend)
   npm start
   ```

4. **Use the CLI client**
   ```bash
   # Build and use CLI (in clients/cli)
   npm run build
   npm link
   
   # Generate client token via dashboard first, then:
   notify-cli --server localhost:3000 --token YOUR_TOKEN "Hello World"
   ```

## 🧪 Testing

Each component has comprehensive test suites:

```bash
# Test platform backend
cd platform/backend
npm test

# Test CLI client
cd clients/cli
npm test

# Test frontend
cd platform/frontend
npm test
```

## 📖 Documentation

- [Docker Deployment Guide](./docker/README.md)
- [CLI Client Documentation](./clients/cli/README.md)
- [Platform Backend Documentation](./platform/backend/README.md)
- [Platform Frontend Documentation](./platform/frontend/README.md)
- [Development Guide](./CLAUDE.md)
- [Project Roadmap](./TODO.md)

## 🛠️ Development

See [CLAUDE.md](./CLAUDE.md) for comprehensive development instructions and project architecture details.

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.