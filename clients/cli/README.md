# Notify-CLI

Command-line client for Notify-Studio with offline queuing, piping support, and real-time streaming capabilities.

## 🚀 Features

- **Offline Queuing**: Store messages locally when server is unreachable
- **Command Execution**: Execute commands and send output/errors to platform
- **File Watching**: Monitor log files for changes and stream updates
- **Pipe Integration**: Process stdin from other commands seamlessly
- **WebSocket Streaming**: Real-time log streaming with auto-reconnection
- **REST Alerts**: Send one-time alert messages
- **Configuration Management**: JSON config file support
- **Token Authentication**: Secure client authentication

## 📦 Installation

### Global Installation
```bash
cd clients/cli
npm install
npm run build
npm link
```

### Local Usage
```bash
cd clients/cli
npm install
npm run build
```

## 🏁 Quick Start

### 1. Get Your Token
First, generate a client token via the Notify-Studio dashboard at `http://localhost:3000`.

### 2. Basic Usage
```bash
# Send a simple message
notify-cli --server localhost:3001 --token ABC123 "Deployment completed successfully"

# Send with specific level and type
notify-cli --server localhost:3001 --token ABC123 --level error --type alerts "Build failed"
```

## 📖 Usage Examples

### Basic Messaging
```bash
# Simple alert
notify-cli --server localhost:3001 --token ABC123 "Server is back online"

# Error alert with metadata
notify-cli --server localhost:3001 --token ABC123 --level error --metadata '{"service":"api","host":"prod-01"}' "Database connection failed"
```

### Command Execution
```bash
# Execute command and send output
notify-cli --server localhost:3001 --token ABC123 --exec "npm run test"

# Execute with error handling
notify-cli --server localhost:3001 --token ABC123 --exec "npm run build" --level error
```

### Pipe Integration
```bash
# Pipe command output to platform
npm run build 2>&1 | notify-cli --server localhost:3001 --token ABC123 --level info --type logs

# Monitor script execution
./deploy.sh | notify-cli --server localhost:3001 --token ABC123 --stream --type deployment
```

### File Watching
```bash
# Watch log file for changes
notify-cli --server localhost:3001 --token ABC123 --watch /var/log/app.log --stream --type logs

# Watch with filtering
notify-cli --server localhost:3001 --token ABC123 --watch /var/log/error.log --level error --type alerts
```

### Streaming Mode
```bash
# Start streaming session
notify-cli --server localhost:3001 --token ABC123 --stream --type logs

# Stream with offline support
notify-cli --server localhost:3001 --token ABC123 --stream --offline --queue-size 500
```

### Offline Mode
```bash
# Enable offline queuing
notify-cli --server localhost:3001 --token ABC123 --offline --queue-size 1000 "Critical system alert"

# Queue management
notify-cli --queue-info                    # Show queue status
notify-cli --clear-queue                   # Clear all queued messages
notify-cli --process-queue                 # Process queued messages
```

## ⚙️ Configuration

### Config File
Create `~/.notify-cli.json` for default settings:

```json
{
  "server": "localhost:3001",
  "token": "ABC123",
  "defaultLevel": "info",
  "defaultType": "alerts",
  "queueSize": 1000,
  "offline": true,
  "retryAttempts": 3,
  "retryDelay": 1000
}
```

### Environment Variables
```bash
export NOTIFY_SERVER=localhost:3001
export NOTIFY_TOKEN=ABC123
export NOTIFY_LEVEL=info
export NOTIFY_TYPE=alerts
```

## 🔧 Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--server, -s` | Platform server URL | localhost:3001 |
| `--token, -t` | Authentication token | Required |
| `--level, -l` | Message level (info/warning/error) | info |
| `--type` | Message type (alerts/logs/events) | alerts |
| `--metadata, -m` | JSON metadata string | null |
| `--exec, -e` | Execute command and send output | - |
| `--watch, -w` | Watch file for changes | - |
| `--stream` | Enable streaming mode | false |
| `--offline` | Enable offline queuing | false |
| `--queue-size` | Max offline queue size | 100 |
| `--queue-info` | Show queue information | - |
| `--clear-queue` | Clear offline queue | - |
| `--process-queue` | Process queued messages | - |
| `--help, -h` | Show help | - |
| `--version, -v` | Show version | - |

## 🔄 Offline Queue System

The CLI automatically queues messages when the server is unreachable:

### Queue Features
- **Persistent Storage**: Messages stored in `~/.notify-cli/queue/`
- **Size Limits**: Configurable maximum queue size
- **FIFO Processing**: First-in, first-out message processing
- **Automatic Retry**: Exponential backoff for failed deliveries
- **Queue Management**: Commands to inspect and manage queue

### Queue Directory Structure
```
~/.notify-cli/
└── queue/
    ├── message-001.json
    ├── message-002.json
    └── ...
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- --testNamePattern="OfflineQueue"

# Watch mode
npm test -- --watch
```

## 🛠️ Development

### Project Structure
```
clients/cli/
├── src/
│   ├── index.ts           # Main CLI entry point
│   ├── lib/
│   │   └── client.ts      # Client communication logic
│   ├── queue/
│   │   └── offline-queue.ts # Offline queue implementation
│   └── types.ts           # TypeScript definitions
├── tests/                 # Test suites
└── dist/                  # Built output
```

### Build Process
```bash
# Development build
npm run dev

# Production build
npm run build

# Watch mode
npm run dev -- --watch
```

## 🔐 Authentication

The CLI uses token-based authentication:

1. **Generate Token**: Use the dashboard to generate a 6-character token
2. **Register Client**: Token is automatically registered on first use
3. **Authentication**: Include token in all API calls via `Authorization` header

## 🚨 Error Handling

The CLI provides comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Clear error messages for invalid tokens
- **Server Errors**: Detailed error reporting from platform
- **Queue Errors**: Graceful degradation when queue is full

## 📊 Monitoring

### Queue Status
```bash
notify-cli --queue-info
# Output:
# Queue Status:
# - Size: 15 messages
# - Max Size: 1000
# - Oldest: 2024-01-01T12:00:00Z
# - Newest: 2024-01-01T12:15:00Z
```

### Connection Status
The CLI automatically reports connection status and will attempt to reconnect when the server becomes available.

## 🚀 Production Usage

### System Service Integration
```bash
# Systemd service example
[Unit]
Description=Application Monitor
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/notify-cli --server prod.notify.local --token PROD_TOKEN --watch /var/log/app.log --stream
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### CI/CD Integration
```bash
# GitHub Actions example
- name: Deploy Application
  run: |
    npm run build 2>&1 | notify-cli --server ${{ secrets.NOTIFY_SERVER }} --token ${{ secrets.NOTIFY_TOKEN }} --level info --type deployment
```

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.