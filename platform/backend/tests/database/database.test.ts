import { Database } from '../../src/database/database';
import fs from 'fs';

describe('Database', () => {
  let database: Database;
  const testDbPath = ':memory:'; // Use in-memory database for tests

  beforeEach(() => {
    database = new Database(testDbPath);
  });

  afterEach(async () => {
    await database.close();
  });

  describe('initialization', () => {
    it('should create database and tables', async () => {
      expect(database).toBeDefined();
      
      // Test that tables exist by trying to query them
      const clients = await database.getAllClients();
      expect(Array.isArray(clients)).toBe(true);
    });
  });

  describe('client management', () => {
    it('should add and retrieve client', async () => {
      const clientData = {
        name: 'TestClient',
        token: 'ABC123',
        connectionType: 'rest' as const
      };

      const clientId = await database.addClient(
        clientData.name,
        clientData.token,
        clientData.connectionType
      );

      expect(clientId).toBeDefined();

      const client = await database.getClientByToken(clientData.token);
      expect(client).toBeDefined();
      expect(client?.name).toBe(clientData.name);
      expect(client?.token).toBe(clientData.token);
      expect(client?.connection_type).toBe(clientData.connectionType);
    });

    it('should return null for non-existent token', async () => {
      const client = await database.getClientByToken('NONEXISTENT');
      expect(client).toBeUndefined();
    });

    it('should get all clients', async () => {
      await database.addClient('Client1', 'TOKEN1', 'rest');
      await database.addClient('Client2', 'TOKEN2', 'websocket');

      const clients = await database.getAllClients();
      expect(clients).toHaveLength(2);
      expect(clients.map((c: any) => c.name)).toContain('Client1');
      expect(clients.map((c: any) => c.name)).toContain('Client2');
    });

    it('should delete client', async () => {
      const clientId = await database.addClient('TestClient', 'ABC123', 'rest');
      
      // Verify client exists
      let client = await database.getClientByToken('ABC123');
      expect(client).toBeDefined();

      // Delete client
      await database.deleteClient(clientId);

      // Verify client is deleted
      client = await database.getClientByToken('ABC123');
      expect(client).toBeUndefined();
    });

    it('should update client last seen', async () => {
      const clientId = await database.addClient('TestClient', 'ABC123', 'rest');
      
      const beforeUpdate = await database.getClientByToken('ABC123');
      const originalLastSeen = beforeUpdate?.last_seen;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      await database.updateClientLastSeen(clientId);
      
      const afterUpdate = await database.getClientByToken('ABC123');
      expect(afterUpdate?.last_seen).not.toBe(originalLastSeen);
    });
  });

  describe('message management', () => {
    let clientId: number;

    beforeEach(async () => {
      clientId = await database.addClient('TestClient', 'ABC123', 'rest');
    });

    it('should add and retrieve message', async () => {
      const messageData = {
        message: 'Test message',
        level: 'info' as const,
        type: 'alerts' as const,
        metadata: { source: 'test' }
      };

      const messageId = await database.addMessage(
        clientId,
        messageData.message,
        messageData.level,
        messageData.type,
        messageData.metadata
      );

      expect(messageId).toBeDefined();

      const messages = await database.getRecentMessages(10);
      expect(messages).toHaveLength(1);
      expect(messages[0].message).toBe(messageData.message);
      expect(messages[0].level).toBe(messageData.level);
      expect(messages[0].type).toBe(messageData.type);
    });

    it('should get messages by client', async () => {
      const client2Id = await database.addClient('Client2', 'TOKEN2', 'rest');

      await database.addMessage(clientId, 'Message 1', 'info', 'alerts');
      await database.addMessage(client2Id, 'Message 2', 'error', 'alerts');
      await database.addMessage(clientId, 'Message 3', 'warn', 'alerts');

      const client1Messages = await database.getMessagesByClient(clientId, 10);
      expect(client1Messages).toHaveLength(2);
      expect(client1Messages.map((m: any) => m.message)).toContain('Message 1');
      expect(client1Messages.map((m: any) => m.message)).toContain('Message 3');

      const client2Messages = await database.getMessagesByClient(client2Id, 10);
      expect(client2Messages).toHaveLength(1);
      expect(client2Messages[0].message).toBe('Message 2');
    });

    it('should limit recent messages', async () => {
      // Add more messages than the limit
      for (let i = 0; i < 15; i++) {
        await database.addMessage(clientId, `Message ${i}`, 'info', 'alerts');
      }

      const messages = await database.getRecentMessages(10);
      expect(messages).toHaveLength(10);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      // Add test data
      const client1 = await database.addClient('Client1', 'TOKEN1', 'rest');
      const client2 = await database.addClient('Client2', 'TOKEN2', 'websocket');
      
      await database.addMessage(client1, 'Message 1', 'info', 'alerts');
      await database.addMessage(client2, 'Message 2', 'error', 'alerts');
    });

    it('should get client count', async () => {
      const count = await database.getClientCount();
      expect(count).toBe(2);
    });

    it('should get message count', async () => {
      const count = await database.getMessageCount();
      expect(count).toBe(2);
    });

    it('should get messages in time range', async () => {
      // Get count since a year ago (should include all messages)
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const count = await database.getMessageCountSince(oneYearAgo);
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});