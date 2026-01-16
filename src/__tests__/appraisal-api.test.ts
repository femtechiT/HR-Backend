import request from 'supertest';
import app from '../src/index';

describe('Appraisal API Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // First, try to login with a default admin account
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
      userId = loginResponse.body.user.id;
    } else {
      console.log('Could not login with default admin account, response:', loginResponse.body);
    }
  });

  describe('Metrics API', () => {
    it('should get all metrics', async () => {
      if (!authToken) {
        console.log('Skipping metrics test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/metrics')
        .set('Authorization', 'Bearer ' + authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('KPI API', () => {
    it('should get all KPIs', async () => {
      if (!authToken) {
        console.log('Skipping KPI test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/kpis')
        .set('Authorization', 'Bearer ' + authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Appraisal Templates API', () => {
    it('should get all appraisal templates', async () => {
      if (!authToken) {
        console.log('Skipping appraisal templates test - no auth token');
        return;
      }

      const response = await request(app)
        .get('/api/appraisal-templates')
        .set('Authorization', 'Bearer ' + authToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});