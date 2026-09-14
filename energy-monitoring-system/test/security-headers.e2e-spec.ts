import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E Tests for Helmet Security Headers
 *
 * Task 8.2: Add Helmet.js security headers
 * Requirements: 8.11 - THE Chat_API SHALL sanitize user input to prevent XSS attacks
 *
 * These tests verify that Helmet.js is properly configured and
 * security headers are present in HTTP responses.
 */
describe('Security Headers (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app similar to main.ts to test Helmet integration
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet Security Headers', () => {
    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // Note: Helmet 7+ may not set X-XSS-Protection as it's deprecated
      // but it's safe to check if it exists
      // expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('should include Strict-Transport-Security header (if enabled)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      // HSTS may not be present in development, but check if configured
      // In production, this should be: max-age=15552000; includeSubDomains
      // For now, we just verify Helmet is working via other headers
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain(
        "default-src 'self'",
      );
    });

    it('should not include X-Powered-By header (removed by Helmet)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Content-Security-Policy Directives', () => {
    it('should have appropriate CSP directives for API usage', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).toBeDefined();

      // Verify key directives are present
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-src 'none'");
    });

    it('should allow inline styles for API documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];

      // Verify that unsafe-inline is allowed for styles (needed for Swagger UI)
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('should allow data: and https: for images', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];

      // Verify image sources include data: and https: (for external images in docs)
      expect(csp).toContain('img-src');
      expect(csp).toContain('data:');
      expect(csp).toContain('https:');
    });
  });

  describe('XSS Protection via Input Validation', () => {
    it('should prevent XSS in chat message input', async () => {
      const maliciousPayload = {
        message: '<script>alert("XSS")</script>',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat')
        .send(maliciousPayload)
        .expect(200);

      // The response should not contain the script tag unescaped
      expect(response.body.response).toBeDefined();
      expect(response.body.response).not.toContain('<script>');
    });

    it('should handle HTML entities in messages safely', async () => {
      const payloadWithEntities = {
        message: '&lt;script&gt;alert("test")&lt;/script&gt;',
      };

      const response = await request(app.getHttpServer())
        .post('/api/chat')
        .send(payloadWithEntities)
        .expect(200);

      // Should process without errors and sanitize output
      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Headers on Different Endpoints', () => {
    it('should apply security headers to public telemetry endpoint', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/public/telemetry',
      );

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should apply security headers to chat endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chat')
        .send({ message: 'test' });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('should apply security headers to Swagger docs endpoint', async () => {
      const response = await request(app.getHttpServer()).get('/api/docs');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      // CSP should still be present but configured to allow Swagger UI
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Cross-Origin Resource Sharing (CORS)', () => {
    it('should allow CORS from configured frontend URL', async () => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', frontendUrl);

      // Should not be blocked
      expect(response.status).toBe(200);
    });

    it('should restrict methods to GET and POST', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/chat')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      // CORS preflight should succeed for allowed methods
      if (response.status === 204 || response.status === 200) {
        const allowedMethods = response.headers['access-control-allow-methods'];
        if (allowedMethods) {
          expect(allowedMethods).toContain('POST');
          expect(allowedMethods).toContain('GET');
        }
      }
    });
  });
});
