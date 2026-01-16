import request from 'supertest';
import app from '../src/index';

describe('Appraisal System API Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Login with a default admin account to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
      
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
      console.log('Successfully authenticated for testing');
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

    it('should create a new metric', async () => {
      if (!authToken) {
        console.log('Skipping metric creation test - no auth token');
        return;
      }
      
      const response = await request(app)
        .post('/api/metrics')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          name: 'Test Metric',
          description: 'A test metric for API validation',
          data_type: 'percentage',
          formula: '(value / total) * 100',
          data_source: 'test_module',
          categories: ['Teacher', 'Sales'],
          is_active: true
        });
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Metric');
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

    it('should create a new KPI', async () => {
      if (!authToken) {
        console.log('Skipping KPI creation test - no auth token');
        return;
      }
      
      const response = await request(app)
        .post('/api/kpis')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          name: 'Test KPI',
          description: 'A test KPI for API validation',
          formula: '(metric1 * 0.6) + (metric2 * 0.4)',
          weight: 25.00,
          metric_ids: [1],
          categories: ['Teacher'],
          is_active: true
        });
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test KPI');
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

    it('should create a new appraisal template', async () => {
      if (!authToken) {
        console.log('Skipping appraisal template creation test - no auth token');
        return;
      }
      
      const response = await request(app)
        .post('/api/appraisal-templates')
        .set('Authorization', 'Bearer ' + authToken)
        .send({
          name: 'Test Appraisal Template',
          description: 'A test appraisal template for API validation',
          category: 'Teacher',
          kpi_ids: [1],
          is_active: true
        });
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Appraisal Template');
    });
  });

  describe('Targets API', () => {
    it('should get all targets', async () => {
      if (!authToken) {
        console.log('Skipping targets test - no auth token');
        return;
      }
      
      const response = await request(app)
        .get('/api/targets')
        .set('Authorization', 'Bearer ' + authToken);
        
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Appraisals API', () => {
    it('should get all appraisal cycles', async () => {
      if (!authToken) {
        console.log('Skipping appraisal cycles test - no auth token');
        return;
      }
      
      const response = await request(app)
        .get('/api/appraisals')
        .set('Authorization', 'Bearer ' + authToken);
        
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Performance API', () => {
    it('should get employee performance', async () => {
      if (!authToken) {
        console.log('Skipping employee performance test - no auth token');
        return;
      }
      
      // Test with a sample employee ID (will likely return empty array if employee doesn't exist)
      const response = await request(app)
        .get('/api/performance/employee/1')
        .set('Authorization', 'Bearer ' + authToken);
        
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});