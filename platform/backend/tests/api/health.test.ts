import request from 'supertest';
import { createTestApp } from '../test-app';

describe('Health API', () => {
  const app = createTestApp();

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.body).toHaveProperty('stats');
      
      // Check stats structure
      expect(response.body.stats).toHaveProperty('totalClients');
      expect(response.body.stats).toHaveProperty('activeClients');
      expect(response.body.stats).toHaveProperty('messagesLastHour');
      expect(response.body.stats).toHaveProperty('activeModules');
    });
  });
});