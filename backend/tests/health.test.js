const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const { getDBStatus } = require('../src/config/db');

describe('Module 1: Infrastructure & Health Check Test Suite', () => {
  // TC-M1-002: Health Check Endpoint Returns Expected Healthy Response
  describe('GET /api/health', () => {
    it('should return HTTP 200 with standardized healthy JSON payload', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'FraudShield API is running');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('environment', 'test');
      expect(response.body.data).toHaveProperty('database');
      expect(['connected', 'disconnected', 'connecting']).toContain(response.body.data.database);
    });
  });

  // TC-M1-003: Unknown API Route Returns Standardized 404 Not Found
  describe('404 Not Found Handler', () => {
    it('should return standardized JSON 404 for non-existent GET route', async () => {
      const response = await request(app).get('/api/non-existent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND'
        }
      });
    });

    it('should return standardized JSON 404 for non-existent POST route', async () => {
      const response = await request(app).post('/api/unknown-action').send({ test: true });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        success: false,
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND'
        }
      });
    });
  });

  // TC-M1-004: Centralized Error Handling Middleware Catches Errors
  describe('Centralized Error Handler Middleware', () => {
    it('should catch unhandled errors and return formatted 500 JSON response', async () => {
      const response = await request(app).get('/api/test-error');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message', 'Simulated internal server error');
      expect(response.body.error).toHaveProperty('code', 'INTERNAL_ERROR');
    });
  });

  // TC-M1-005: JSON Request Body Limit Is Enforced (10kb Limit)
  describe('Request Body Payload Limiter', () => {
    it('should accept valid JSON payload under 10kb', async () => {
      const response = await request(app)
        .post('/api/test-body')
        .send({ message: 'Small valid test body' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, received: true });
    });

    it('should reject request payload larger than 10kb with HTTP 413', async () => {
      // Create a string larger than 10kb (12,000 characters)
      const largeData = 'A'.repeat(12000);

      const response = await request(app)
        .post('/api/test-body')
        .send({ data: largeData });

      expect(response.status).toBe(413);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'PAYLOAD_TOO_LARGE');
    });
  });

  // TC-M1-006 & TC-M1-007: CORS Origins
  describe('CORS Configuration', () => {
    it('should allow requests matching the configured CORS_ORIGIN', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', config.corsOrigin);

      expect(response.headers['access-control-allow-origin']).toBe(config.corsOrigin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject or disallow requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://unauthorized-malicious-domain.com');

      // The origin header will not match the unauthorized origin
      expect(response.headers['access-control-allow-origin']).not.toBe('http://unauthorized-malicious-domain.com');
    });
  });

  // TC-M1-008: Helmet Security Headers
  describe('Helmet HTTP Security Headers', () => {
    it('should include essential security headers on responses', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-dns-prefetch-control', 'off');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  // TC-M1-009: Environment Configuration
  describe('Configuration Loader', () => {
    it('should expose port, mongodbUri, and corsOrigin correctly', () => {
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('mongodbUri');
      expect(config).toHaveProperty('corsOrigin');
      expect(config).toHaveProperty('jwtSecret');
      expect(typeof config.port).toBe('number');
    });
  });

  // TC-M1-011: Database Connection Status
  describe('Database Connection State', () => {
    it('should report database connection status accurately', () => {
      const status = getDBStatus();
      expect(['connected', 'disconnected', 'connecting']).toContain(status);
    });
  });
});
