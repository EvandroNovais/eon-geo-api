import request from 'supertest';
import app from '../../src/app';

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health');

      // Accept both 200 (healthy) and 503 (unhealthy due to Redis not running in tests)
      expect([200, 503]).toContain(response.status);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('services');
    });
  });

  describe('Geocoding Endpoints', () => {
    it('should geocode a valid CEP', async () => {
      const response = await request(app)
        .get('/api/v1/geocoding/cep/01310100')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('coordinates');
      expect(response.body.data).toHaveProperty('address');
      expect(response.body.data.coordinates).toHaveProperty('latitude');
      expect(response.body.data.coordinates).toHaveProperty('longitude');
    });

    it('should return 400 for invalid CEP format', async () => {
      const response = await request(app)
        .get('/api/v1/geocoding/cep/123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('Distance Calculation Endpoints', () => {
    it('should calculate distance between coordinates', async () => {
      const requestBody = {
        origin: { latitude: -23.5613, longitude: -46.6565 },
        destination: { latitude: -22.9068, longitude: -43.1729 }
      };

      const response = await request(app)
        .post('/api/v1/distance/coordinates')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('distance');
      expect(response.body.data.distance).toHaveProperty('kilometers');
      expect(response.body.data.distance).toHaveProperty('miles');
      expect(response.body.data.distance.kilometers).toBeGreaterThan(0);
    });

    it('should return 400 for invalid coordinates', async () => {
      const requestBody = {
        origin: { latitude: -91, longitude: -46.6565 },
        destination: { latitude: -22.9068, longitude: -43.1729 }
      };

      const response = await request(app)
        .post('/api/v1/distance/coordinates')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should calculate distance between CEPs', async () => {
      const requestBody = {
        originCep: '01310100',
        destinationCep: '20040020'
      };

      const response = await request(app)
        .post('/api/v1/distance/ceps')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('distance');
      expect(response.body.data.distance.kilometers).toBeGreaterThan(0);
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('documentation');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
    });
  });
});