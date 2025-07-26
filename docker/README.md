# Docker Configuration for Notify-Studio

This directory contains Docker configuration files for containerizing the entire Notify-Studio platform.

## 🐳 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Production Deployment

1. **Copy environment template**
   ```bash
   cp .env.docker.example .env.docker
   # Edit .env.docker with your configuration
   ```

2. **Start the platform**
   ```bash
   # Start core platform (backend + frontend)
   docker-compose up -d

   # Start with Discord module
   docker-compose --profile discord up -d
   ```

3. **Access the application**
   - Frontend Dashboard: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

### Development Mode

For development with hot reloading:

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or specific services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up backend frontend
```

## 📁 Container Architecture

### Services

| Service | Port | Description |
|---------|------|-------------|
| `backend` | 3001 | Express.js API server with WebSocket support |
| `frontend` | 3000 | React dashboard served by Nginx |
| `discord-module` | - | Discord output module (optional) |

### Volumes

- `backend_data`: Persistent SQLite database storage

### Networks

- `notify-studio`: Internal bridge network for service communication

## 🔧 Configuration

### Environment Variables

Core platform variables:

```env
# Platform
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000
MESSAGE_RETENTION_DAYS=7
DATABASE_PATH=/app/data/notify-studio.db

# Discord Module (optional)
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_DEFAULT_CHANNEL=general
DISCORD_ALERTS_CHANNEL=alerts
DISCORD_GUILD_ID=your_guild_id
```

### Profiles

Use Docker Compose profiles to start optional services:

```bash
# Start with Discord module
docker-compose --profile discord up -d

# Start multiple modules (when more are added)
docker-compose --profile discord --profile email up -d
```

## 🚀 Deployment Options

### Single Server Deployment

```bash
# Production deployment
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Development Environment

```bash
# Development with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild after dependency changes
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### CLI Client Usage

Build and use the CLI client in a container:

```bash
# Build CLI image
docker build -f docker/cli.Dockerfile -t notify-studio-cli .

# Use CLI client
docker run --rm --network notify-studio_notify-studio \
  notify-studio-cli \
  --server http://backend:3001 \
  --token YOUR_TOKEN \
  "Hello from Docker!"
```

## 🔍 Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect <container_name> | grep -A 10 Health
```

Health check endpoints:
- Backend: `GET /health`
- Frontend: `GET /` (nginx status)

## 📊 Monitoring & Logs

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# With timestamps
docker-compose logs -f -t
```

### Performance Monitoring

```bash
# Container stats
docker stats

# Service resource usage
docker-compose top
```

## 🛠️ Maintenance

### Database Backup

```bash
# Backup SQLite database
docker-compose exec backend cp /app/data/notify-studio.db /tmp/backup.db
docker cp $(docker-compose ps -q backend):/tmp/backup.db ./backup.db
```

### Updating Images

```bash
# Rebuild and restart
docker-compose build
docker-compose up -d

# Force rebuild without cache
docker-compose build --no-cache
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ destroys data)
docker-compose down -v

# Clean up unused images
docker image prune -f
```

## 🔒 Security Considerations

### Production Security

1. **Environment Variables**: Never commit `.env.docker` files
2. **User Permissions**: Containers run as non-root users
3. **Network Isolation**: Services communicate via internal bridge network
4. **Resource Limits**: Consider adding resource constraints in production

Example production overrides:

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    restart: always
  frontend:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
```

### Secrets Management

For production, consider using Docker secrets:

```yaml
services:
  discord-module:
    secrets:
      - discord_bot_token
    environment:
      - DISCORD_BOT_TOKEN_FILE=/run/secrets/discord_bot_token

secrets:
  discord_bot_token:
    external: true
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :3001
   ```

2. **Database Permissions**
   ```bash
   # Fix volume permissions
   docker-compose exec backend chown -R backend:nodejs /app/data
   ```

3. **Build Failures**
   ```bash
   # Clean build cache
   docker-compose build --no-cache
   docker system prune -f
   ```

4. **Module Connection Issues**
   ```bash
   # Check network connectivity
   docker-compose exec discord-module ping backend
   
   # Check logs
   docker-compose logs discord-module
   ```

### Debugging

Enable development mode for debugging:

```bash
# Run with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Access container shell
docker-compose exec backend sh
```

## 📋 Docker Files Reference

- `docker-compose.yml`: Main production configuration
- `docker-compose.dev.yml`: Development overrides with hot reloading
- `docker/backend.Dockerfile`: Backend API server
- `docker/frontend.Dockerfile`: React frontend with Nginx
- `docker/discord.Dockerfile`: Discord output module
- `docker/cli.Dockerfile`: CLI client for containerized usage
- `docker/nginx.conf`: Nginx configuration for frontend
- `.dockerignore`: Files excluded from build context