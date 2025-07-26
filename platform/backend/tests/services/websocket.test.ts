import { Server } from 'socket.io';
import { createServer } from 'http';
import { WebSocketService } from '../../src/services/websocket';
import { Database } from '../../src/database/database';

describe('WebSocketService', () => {
  let httpServer: any;
  let io: Server;
  let webSocketService: WebSocketService;
  let database: Database;

  beforeEach(() => {
    httpServer = createServer();
    io = new Server(httpServer);
    database = new Database(':memory:');
    webSocketService = new WebSocketService(io, database);
  });

  afterEach(async () => {
    io.close();
    httpServer.close();
    await database.close();
  });

  describe('initialization', () => {
    it('should initialize WebSocket service', () => {
      expect(webSocketService).toBeDefined();
    });
  });

  describe('client authentication', () => {
    it('should authenticate valid token', async () => {
      // First register a client
      const token = 'ABC123';
      await database.addClient('TestClient', token, 'websocket');

      const isValid = webSocketService.authenticateClient(token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const isValid = webSocketService.authenticateClient('INVALID');
      expect(isValid).toBe(false);
    });
  });

  describe('broadcasting', () => {
    it('should broadcast to dashboard', () => {
      const mockEmit = jest.fn();
      io.to = jest.fn().mockReturnValue({ emit: mockEmit });

      const testData = { message: 'Test broadcast' };
      webSocketService.broadcastToDashboard('test-event', testData);

      expect(io.to).toHaveBeenCalledWith('dashboard');
      expect(mockEmit).toHaveBeenCalledWith('test-event', testData);
    });
  });
});