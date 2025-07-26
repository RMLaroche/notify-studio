# Notify-Studio

A centralized web platform for routing logs/events/notifications to dedicated services through a visual flow interface.

## Quick Start

```bash
# Start with Docker
docker-compose up -d

# Access web interface
open http://localhost:3000

# Install CLI client
npm install -g ./cli
```

## Project Structure

- `backend/` - Node.js server with Express and Socket.io
- `frontend/` - React TypeScript web interface
- `cli/` - Command-line client with offline queuing
- `docker/` - Docker configuration files

## Development

See individual README files in each directory for development instructions.

## Features

- Visual drag & drop interface for routing configuration
- Dual output per client (logs + alerts)
- Real-time monitoring with WebSocket
- Output modules: Discord, Email, Slack, Webhooks
- CLI client with offline message queuing
- Hot-reload module configurations