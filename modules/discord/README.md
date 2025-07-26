# Discord Output Module

A Discord bot integration for Notify-Studio that sends notifications to Discord channels with rich formatting and intelligent routing.

## Features

- **Rich Embeds**: Beautiful Discord embeds with colors, fields, and timestamps
- **Channel Routing**: Route different message types to specific channels
- **Rate Limiting**: Respects Discord API limits with configurable thresholds
- **Message Queuing**: Queues messages when bot is offline or rate limited
- **Fallback Support**: Falls back to plain text if embeds fail
- **Real-time Integration**: WebSocket connection to Notify-Studio platform

## Quick Start

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Enable required intents: `Send Messages`, `Use Slash Commands`

### 2. Invite Bot to Server

Use this URL template (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot
```

### 3. Setup Configuration

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Discord bot token and channel IDs
```

### 4. Run the Module

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_DEFAULT_CHANNEL` | ✅ | Default channel ID for notifications |
| `DISCORD_ALERTS_CHANNEL` | ❌ | Channel ID for alert-type messages |
| `DISCORD_LOGS_CHANNEL` | ❌ | Channel ID for log-type messages |
| `DISCORD_ERRORS_CHANNEL` | ❌ | Channel ID for error-level messages |
| `DISCORD_GUILD_ID` | ❌ | Discord server/guild ID |
| `PLATFORM_URL` | ❌ | Notify-Studio platform URL (default: http://localhost:3001) |
| `MODULE_TOKEN` | ❌ | Authentication token for platform connection |

### Message Routing

The module routes messages using this priority:

1. **By Level**: Error messages → `DISCORD_ERRORS_CHANNEL`
2. **By Type**: 
   - `alerts` → `DISCORD_ALERTS_CHANNEL`
   - `logs` → `DISCORD_LOGS_CHANNEL`
3. **Fallback**: `DISCORD_DEFAULT_CHANNEL`

### Embed Formatting

Messages are formatted as rich Discord embeds with:

- **Color coding** based on message level (info=blue, error=red, etc.)
- **Structured fields** for client name, level, type, and metadata
- **Timestamps** for when messages were sent
- **Custom author/footer** branding

## How to Get Channel IDs

1. Enable Developer Mode in Discord: Settings → Advanced → Developer Mode
2. Right-click on any channel → "Copy ID"
3. Use these IDs in your environment variables

## Message Levels & Colors

| Level | Color | Emoji |
|-------|-------|-------|
| `info` | Blue | ℹ️ |
| `success` | Green | ✅ |
| `warning` | Orange | ⚠️ |
| `error` | Red | ❌ |
| `debug` | Gray | 🔍 |

## Rate Limiting

Built-in rate limiting prevents hitting Discord API limits:

- **Default**: 50 messages per minute per channel
- **Configurable** via code (not environment yet)
- **Automatic queuing** when limits are reached

## Testing

Send a test notification:

```bash
# The module responds to 'test' events from the platform
# This will send a test message to your default channel
```

## Troubleshooting

### Bot Not Responding

1. Check bot token is correct
2. Verify bot has permissions in target channels
3. Ensure bot is online in Discord
4. Check console logs for connection errors

### Messages Not Appearing

1. Verify channel IDs are correct
2. Check bot has `Send Messages` permission
3. Look for rate limiting messages in logs
4. Try the fallback plain text format

### Platform Connection Issues

1. Verify `PLATFORM_URL` is correct
2. Check platform is running and accessible
3. Verify WebSocket connection in logs

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Integration with Notify-Studio

This module automatically connects to the Notify-Studio platform via WebSocket and listens for notification events. It requires the platform backend to be running at the configured URL.

The module registers itself as an output module and can be managed through the platform dashboard.