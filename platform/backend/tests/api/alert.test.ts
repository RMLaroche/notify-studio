import request from 'supertest';
import { createTestApp } from '../test-app';

describe('Alert API', () => {
  const app = createTestApp();
  let clientToken: string;

  beforeEach(async () => {
    // Register a test client
    const tokenResponse = await request(app)
      .post('/api/auth/generate-token')
      .send({ clientName: 'TestClient' });

    clientToken = tokenResponse.body.token;

    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'TestClient',
        token: clientToken,
        connectionType: 'rest'
      });
  });

  describe('POST /api/alert', () => {
    it('should accept valid alert with authentication', async () => {
      const response = await request(app)
        .post('/api/alert')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          message: 'Test alert message',
          level: 'error',
          type: 'alerts',
          metadata: { source: 'test' }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Alert received and queued for processing');
      expect(response.body).toHaveProperty('client', 'TestClient');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should reject alert without authentication', async () => {
      const response = await request(app)
        .post('/api/alert')
        .send({
          message: 'Test alert message',
          level: 'error'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should reject alert with invalid token', async () => {
      const response = await request(app)
        .post('/api/alert')
        .set('Authorization', 'Bearer INVALID')
        .send({
          message: 'Test alert message',
          level: 'error'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate alert data', async () => {
      const response = await request(app)
        .post('/api/alert')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          message: '', // Empty message should fail
          level: 'invalid_level'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid alert data');
      expect(response.body).toHaveProperty('details');
    });

    it('should use default values for optional fields', async () => {
      const response = await request(app)
        .post('/api/alert')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          message: 'Simple alert'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});