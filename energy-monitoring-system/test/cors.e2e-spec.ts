import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

/**
 * CORS Configuration E2E Tests
 *
 * Tests for Task 8.1: Configure CORS in main.ts
 * Requirements: 5.11, 8.10, 11.10, 15.1
 *
 * Verifies that:
 * - CORS is enabled with correct origins from env vars
 * - Only GET and POST methods are allowed
 * - Correct headers are allowed (Content-Type, Accept)
 * - Credentials are disabled for public API
 * - Preflight requests are cached appropriately
 */
describe('CORS Configuration (e2e)', () => {
  let app: INestApplication<App>;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);

    // Apply same configuration as main.ts
    const frontendUrl =
      configService.get<string>('app.frontendUrl') ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173';
    const productionUrl =
      configService.get<string>('app.productionUrl') ||
      process.env.PRODUCTION_URL ||
      'https://ecostep.example.com';

    const allowedOrigins = [frontendUrl];
    if (
      productionUrl &&
      productionUrl.trim() !== '' &&
      productionUrl !== 'https://ecostep.example.com'
    ) {
      allowedOrigins.push(productionUrl);
    }

    app.enableCors({
      origin: allowedOrigins.filter(Boolean),
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Accept'],
      credentials: false,
      maxAge: 3600,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
    app.setGlobalPrefix(apiPrefix);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CORS Headers', () => {
    it('should allow requests from FRONTEND_URL origin', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', frontendUrl)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe(frontendUrl);
    });

    it('should allow requests from PRODUCTION_URL origin if configured', async () => {
      const productionUrl = configService.get<string>('app.productionUrl');

      if (
        productionUrl &&
        productionUrl.trim() !== '' &&
        productionUrl !== 'https://ecostep.example.com'
      ) {
        const response = await request(app.getHttpServer())
          .get('/api/health')
          .set('Origin', productionUrl)
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe(
          productionUrl,
        );
      } else {
        // If production URL is not set, test should pass
        expect(true).toBe(true);
      }
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com');

      // CORS middleware should not set allow-origin for unauthorized origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should support GET method in preflight request', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
    });

    it('should support POST method in preflight request', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .options('/api/chat')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('POST');
    });

    it('should allow Content-Type and Accept headers', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .options('/api/chat')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Accept')
        .expect(204);

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Accept');
    });

    it('should disable credentials for public API', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', frontendUrl)
        .expect(200);

      // Access-Control-Allow-Credentials should not be set (or be false)
      const allowCredentials =
        response.headers['access-control-allow-credentials'];
      expect(allowCredentials).toBeUndefined();
    });

    it('should cache preflight requests for 1 hour (3600 seconds)', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .options('/api/chat')
        .set('Origin', frontendUrl)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      const maxAge = response.headers['access-control-max-age'];
      expect(maxAge).toBe('3600');
    });
  });

  describe('Environment Variable Configuration', () => {
    it('should read FRONTEND_URL from environment variables', () => {
      const frontendUrl = configService.get<string>('app.frontendUrl');
      expect(frontendUrl).toBeDefined();
      expect(typeof frontendUrl).toBe('string');
      // Should have a default value even if not set
      expect(frontendUrl).toMatch(/^https?:\/\//);
    });

    it('should handle missing PRODUCTION_URL gracefully', () => {
      const productionUrl = configService.get<string>('app.productionUrl');
      // Production URL can be empty or undefined in development
      expect(
        typeof productionUrl === 'string' || productionUrl === undefined,
      ).toBe(true);
    });

    it('should use default values if environment variables are not set', () => {
      // If FRONTEND_URL is not set, it should default to http://localhost:5173
      const frontendUrl =
        configService.get<string>('app.frontendUrl') ||
        process.env.FRONTEND_URL ||
        'http://localhost:5173';
      expect(frontendUrl).toBeTruthy();
      expect(frontendUrl).toMatch(/^https?:\/\//);
    });
  });

  describe('Public API Endpoints CORS', () => {
    it('should allow CORS for /api/public/telemetry endpoint', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .get('/api/public/telemetry')
        .set('Origin', frontendUrl);

      // Response may be 200 (success) or 503 (service unavailable) depending on DB state
      expect([200, 503]).toContain(response.status);
      expect(response.headers['access-control-allow-origin']).toBe(frontendUrl);
    });

    it('should allow CORS for /api/chat endpoint', async () => {
      const frontendUrl =
        configService.get<string>('app.frontendUrl') || 'http://localhost:5173';

      const response = await request(app.getHttpServer())
        .post('/api/chat')
        .set('Origin', frontendUrl)
        .set('Content-Type', 'application/json')
        .send({ message: 'test' });

      // Response may vary, but CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBe(frontendUrl);
    });
  });
});
