import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Database } from '../src/database/database';
import { WebSocketService } from '../src/services/websocket';

// Import routes
import authRoutes from '../src/routes/auth';
import alertRoutes from '../src/routes/alert';
import clientRoutes from '../src/routes/clients';
import healthRoutes from '../src/routes/health';

export function createTestApp() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Routes
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/alert', alertRoutes);
  app.use('/api/clients', clientRoutes);
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
  
  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
}

export function createTestServer() {
  const app = createTestApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  
  // Initialize WebSocket service with test database
  const testDatabase = new Database(':memory:');
  const webSocketService = new WebSocketService(io, testDatabase);
  
  return { app, httpServer, io, webSocketService, database: testDatabase };
}