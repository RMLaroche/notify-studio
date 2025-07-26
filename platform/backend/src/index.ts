import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketService } from './services/websocket';

// Import routes
import authRoutes from './routes/auth';
import alertRoutes from './routes/alert';
import clientRoutes from './routes/clients';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alert', alertRoutes);
app.use('/api/clients', clientRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Notify-Studio Platform',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      alert: '/api/alert',
      clients: '/api/clients'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize WebSocket service
const wsService = new WebSocketService(io);

// Cleanup old messages periodically (every hour)
setInterval(async () => {
  try {
    const { db } = await import('./database/database');
    await db.cleanupOldMessages(parseInt(process.env.MESSAGE_RETENTION_DAYS || '7'));
    console.log('Cleaned up old messages');
  } catch (error) {
    console.error('Failed to cleanup old messages:', error);
  }
}, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Notify-Studio Platform running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 WebSocket ready for client connections`);
});

export { app, io, wsService };