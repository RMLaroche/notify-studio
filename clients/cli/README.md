# Notify-CLI

CLI client for Notify-Studio with offline queuing support.

## Installation

```bash
npm install -g .
```

## Usage

### Basic Alert
```bash
notify-cli --server localhost:3001 --token ABC123 --message "Deploy completed" --level info
```

### Stream Logs (WebSocket)
```bash
notify-cli --server localhost:3001 --token ABC123 --stream --type logs
```

### Pipe Command Output
```bash
npm run build 2>&1 | notify-cli --server localhost:3001 --token ABC123 --level error --type alerts
```

### Execute Command
```bash
notify-cli --server localhost:3001 --token ABC123 --exec "npm run test" --stream
```

### Watch File
```bash
notify-cli --server localhost:3001 --token ABC123 --watch /var/log/app.log --stream --type logs
```

### Offline Mode
```bash
# Messages are queued locally when server is unreachable
notify-cli --server localhost:3001 --token ABC123 --offline --queue-size 1000 --message "Critical alert"
```

### Queue Management
```bash
# Show queue info
notify-cli --queue-info

# Clear queue
notify-cli --clear-queue
```

## Configuration

Create a config file at `~/.notify-cli.json`:

```json
{
  "server": "localhost:3001",
  "token": "your-token-here",
  "defaultLevel": "info",
  "defaultType": "alerts",
  "queueSize": 1000
}
```

## Features

- **Offline queuing**: Messages stored locally when server unreachable
- **Command execution**: Execute commands and send output/errors
- **File watching**: Monitor log files for changes
- **Pipe integration**: Process stdin from other commands
- **WebSocket streaming**: Real-time log streaming
- **REST alerts**: One-time alert messages
- **Automatic reconnection**: Resilient WebSocket connections
- **Configurable retry logic**: Exponential backoff for failed messages