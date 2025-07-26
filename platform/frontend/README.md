# Notify-Studio Platform Frontend

React TypeScript dashboard for managing clients, viewing real-time messages, and configuring notification flows in the Notify-Studio platform.

## 🚀 Features

- **3-Column Layout**: Clients, Messages, and Modules management
- **Real-time Updates**: Live message feed via WebSocket connection
- **Client Management**: Add, remove, and monitor client connections
- **Token Generation**: Built-in client token generation and registration
- **Message Filtering**: Search and filter messages by level, client, and content
- **Responsive Design**: Modern UI with Tailwind CSS
- **TypeScript**: Full type safety with shared types

## 📁 Project Structure

```
platform/frontend/
├── src/
│   ├── components/         # React components
│   │   ├── ClientPanel.tsx    # Client management
│   │   ├── MessageFeed.tsx    # Message display
│   │   ├── ModulePanel.tsx    # Output modules
│   │   └── __tests__/         # Component tests
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API and WebSocket services
│   ├── types/             # TypeScript definitions
│   └── App.tsx            # Main application component
├── public/                # Static assets
└── build/                 # Production build output
```

## 🏁 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Platform backend running on port 3001

### Installation

```bash
cd platform/frontend
npm install
```

### Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 🎨 Components

### ClientPanel
- List all registered clients
- Generate new client tokens
- Register clients with connection type
- Delete clients
- Show client status and last seen

### MessageFeed
- Real-time message display
- Filter by level (info, warning, error)
- Search message content
- Show client source and timestamps
- Expandable metadata view

### ModulePanel
- Configure output destinations
- Manage notification flows
- Enable/disable modules
- Module-specific settings

## 🌐 WebSocket Integration

The frontend connects to the backend WebSocket for real-time updates:

```typescript
// Automatic reconnection and error handling
const socket = useWebSocket('ws://localhost:3001');

// Listen for real-time events
socket.on('new-message', (message) => {
  // Update message feed
});

socket.on('client-registered', (client) => {
  // Update client list
});
```

## 🔌 API Integration

All API calls are handled through the `services/api.ts` module:

- **Client Management**: CRUD operations for clients
- **Authentication**: Token generation and registration
- **Messages**: Fetch recent messages and statistics
- **Health**: Monitor backend status

## 🧪 Testing

Comprehensive test suite with Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- --testNamePattern="ClientPanel"

# Coverage report
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### Test Coverage
- Component rendering and interaction
- WebSocket event handling
- API integration and error handling
- User workflows (add/delete clients, message filtering)

## 🎨 Styling

Uses Tailwind CSS for styling:

- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Support for light/dark themes
- **Component Library**: Reusable UI components
- **Consistent Spacing**: Tailwind utility classes

## 🚀 Production Build

```bash
# Create optimized production build
npm run build

# Serve static files (example with serve)
npx serve -s build -p 3000
```

The build is optimized for performance:
- Code splitting for faster loading
- Minified and compressed assets
- Cache-friendly file names with hashes

## 🔧 Configuration

### Environment Variables

Create `.env` file for local development:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### Proxy Configuration

Development server proxies API calls to backend:

```json
{
  "proxy": "http://localhost:3001"
}
```

## 📱 Features Walkthrough

1. **Add New Client**:
   - Enter client name
   - Select connection type (REST/WebSocket)
   - Generate token automatically
   - Register client with backend

2. **Monitor Messages**:
   - View real-time message feed
   - Filter by severity level
   - Search message content
   - Expand to view metadata

3. **Manage Modules**:
   - Configure output destinations
   - Set up notification rules
   - Test module connections
   - Enable/disable modules

## 🛠️ Development Notes

- Built with Create React App and TypeScript
- Uses React 18 with concurrent features
- Socket.io client for WebSocket communication
- Axios for HTTP API calls
- React hooks for state management
- Modern ES6+ JavaScript features
