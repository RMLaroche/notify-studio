import request from 'supertest';
import { createTestApp } from '../test-app';

describe('Auth API', () => {
  const app = createTestApp();

  describe('POST /api/auth/generate-token', () => {
    it('should generate a token for valid client name', async () => {
      const response = await request(app)
        .post('/api/auth/generate-token')
        .send({ clientName: 'TestClient' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('clientName', 'TestClient');
      expect(response.body.token).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should reject empty client name', async () => {
      const response = await request(app)
        .post('/api/auth/generate-token')
        .send({ clientName: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register client with valid token', async () => {
      // First generate a token
      const tokenResponse = await request(app)
        .post('/api/auth/generate-token')
        .send({ clientName: 'TestClient' });

      const { token } = tokenResponse.body;

      // Then register with that token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'TestClient',
          token,
          connectionType: 'rest'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Client registered successfully');
      expect(response.body.client).toHaveProperty('name', 'TestClient');
      expect(response.body.client).toHaveProperty('token', token);
    });

    it('should reject duplicate token registration', async () => {
      // Register a client first
      const tokenResponse = await request(app)
        .post('/api/auth/generate-token')
        .send({ clientName: 'TestClient' });

      const { token } = tokenResponse.body;

      await request(app)
        .post('/api/auth/register')
        .send({ name: 'TestClient', token, connectionType: 'rest' });

      // Try to register again with same token
      const response = await request(app)
        .post('/api/auth/register')
        .send({ name: 'AnotherClient', token, connectionType: 'rest' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Token already in use');
    });
  });
});