import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth';
import { Database } from '../database/database';

interface ClientSocket extends Socket {
  clientId?: number;
  clientName?: string;
  moduleType?: string;
  moduleName?: string;
}

export class WebSocketService {
  constructor(private io: Server, private database?: Database) {
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: ClientSocket) => {
      console.log('Client connected:', socket.id);

      // Handle client authentication
      socket.on('client-connect', async (data) => {
        try {
          const { token, clientName, connectionType } = data;
          
          if (!verifyToken(token)) {
            socket.emit('error', { message: 'Invalid token' });
            socket.disconnect();
            return;
          }

          // Find client by token
          const dbInstance = this.database || (await import('../database/database')).db;
          const client = await dbInstance.get(
            'SELECT id, name FROM clients WHERE token = ?',
            [token]
          );

          if (!client) {
            socket.emit('error', { message: 'Client not found' });
            socket.disconnect();
            return;
          }

          // Update client info
          socket.clientId = client.id;
          socket.clientName = client.name;

          // Update last_seen
          await dbInstance.run(
            'UPDATE clients SET last_seen = ? WHERE id = ?',
            [new Date().toISOString(), client.id]
          );

          // Join client room for targeted messages
          socket.join(`client-${client.id}`);

          socket.emit('authenticated', {
            clientId: client.id,
            clientName: client.name
          });

          // Broadcast to dashboard about client connection
          socket.broadcast.emit('client-status-update', {
            clientId: client.id,
            clientName: client.name,
            status: 'online',
            lastSeen: new Date().toISOString()
          });

          console.log(`Client authenticated: ${client.name} (${client.id})`);
        } catch (error) {
          console.error('Client authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Handle streaming messages from CLI clients
      socket.on('stream-message', async (data) => {
        try {
          if (!socket.clientId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { message, level, streamType, metadata } = data;

          // Store message in history
          const dbInstance = this.database || (await import('../database/database')).db;
          await dbInstance.run(
            'INSERT INTO message_history (client_id, message, level, stream_type, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [
              socket.clientId,
              message,
              level || 'info',
              streamType || 'logs',
              metadata ? JSON.stringify(metadata) : null,
              new Date().toISOString()
            ]
          );

          // Broadcast to dashboard
          this.io.emit('new-message', {
            clientId: socket.clientId,
            clientName: socket.clientName,
            message,
            level: level || 'info',
            streamType: streamType || 'logs',
            metadata,
            timestamp: new Date().toISOString()
          });

          // TODO: Route message to output modules based on routing rules
          console.log(`[STREAM] [${socket.clientName}] [${level}] [${streamType}] ${message}`);

        } catch (error) {
          console.error('Stream message error:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      // Handle heartbeat
      socket.on('heartbeat', async () => {
        if (socket.clientId) {
          const dbInstance = this.database || (await import('../database/database')).db;
          await dbInstance.run(
            'UPDATE clients SET last_seen = ? WHERE id = ?',
            [new Date().toISOString(), socket.clientId]
          );
        }
      });

      // Handle module connections (Discord, Email, etc.)
      socket.on('module-connect', async (data) => {
        try {
          const { token, type, name } = data;
          
          // Simple token validation for modules (you may want to make this more secure)
          if (!token || token.length < 6) {
            socket.emit('error', { message: 'Invalid module token' });
            socket.disconnect();
            return;
          }

          // Set module info
          socket.moduleType = type;
          socket.moduleName = name;

          // Join module room for targeted messages
          socket.join(`module-${type}`);
          socket.join('modules'); // Join general modules room

          socket.emit('authenticated', {
            moduleType: type,
            moduleName: name
          });

          // Broadcast to dashboard about module connection
          socket.broadcast.emit('module-status-update', {
            moduleType: type,
            moduleName: name,
            status: 'online',
            connectedAt: new Date().toISOString()
          });

          console.log(`Module connected: ${name} (${type})`);
        } catch (error) {
          console.error('Module authentication error:', error);
          socket.emit('error', { message: 'Module authentication failed' });
          socket.disconnect();
        }
      });

      // Handle dashboard connections
      socket.on('dashboard-connect', () => {
        socket.join('dashboard');
        console.log('Dashboard connected:', socket.id);
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        if (socket.clientId && socket.clientName) {
          console.log(`Client disconnected: ${socket.clientName} (${socket.clientId})`);
          
          // Broadcast to dashboard about client disconnection
          socket.broadcast.emit('client-status-update', {
            clientId: socket.clientId,
            clientName: socket.clientName,
            status: 'offline',
            lastSeen: new Date().toISOString()
          });
        } else {
          console.log('Client disconnected:', socket.id);
        }
      });
    });
  }

  // Send message to specific client
  public sendToClient(clientId: number, event: string, data: any): void {
    this.io.to(`client-${clientId}`).emit(event, data);
  }

  // Broadcast to all dashboard connections
  public broadcastToDashboard(event: string, data: any): void {
    this.io.to('dashboard').emit(event, data);
  }

  // Broadcast to all connected modules
  public broadcastToModules(event: string, data: any): void {
    this.io.to('modules').emit(event, data);
  }

  // Send to specific module type
  public sendToModuleType(moduleType: string, event: string, data: any): void {
    this.io.to(`module-${moduleType}`).emit(event, data);
  }

  // Get connected clients count
  public async getConnectedClientsCount(): Promise<number> {
    const sockets = await this.io.fetchSockets();
    return sockets.filter(socket => (socket as unknown as ClientSocket).clientId).length;
  }

  // Authentication helper for tests
  public authenticateClient(token: string): boolean {
    return verifyToken(token);
  }
}