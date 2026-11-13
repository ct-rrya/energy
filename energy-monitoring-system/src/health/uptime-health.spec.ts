import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import * as fs from 'fs';
import * as path from 'path';
import {
  getUptimeHealthPayload,
  registerUptimeHealthRoute,
} from './uptime-health';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

interface DispatchResult {
  statusCode: number;
  body: string;
  json: () => any;
}

function dispatchInMemory(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
  method: string,
  url: string,
): Promise<DispatchResult> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.headers = { host: 'localhost' };

    const res = new ServerResponse(req);
    const chunks: Buffer[] = [];

    const origWrite = res.write.bind(res);
    res.write = ((chunk: any, ...args: any[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return origWrite(chunk, ...args);
    }) as any;

    const origEnd = res.end.bind(res);
    res.end = ((chunk?: any, ...args: any[]) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      resolve({
        statusCode: res.statusCode,
        body: raw,
        json: () => JSON.parse(raw),
      });
      return origEnd(chunk, ...args);
    }) as any;

    res.on('error', reject);
    handler(req, res);
  });
}

describe('UptimeRobot Health Endpoint (GET /health)', () => {
  describe('getUptimeHealthPayload', () => {
    it('should return status "ok", service "ecostep-backend", and a valid ISO timestamp', () => {
      const payload = getUptimeHealthPayload();

      expect(payload.status).toBe('ok');
      expect(payload.service).toBe('ecostep-backend');
      expect(typeof payload.timestamp).toBe('string');
      expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);
    });
  });

  describe('HTTP routing with global /api prefix', () => {
    let app: INestApplication;
    let expressHandler: (req: IncomingMessage, res: ServerResponse) => void;

    const mockHealthService = {
      check: jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: '2026-11-13T00:00:00.000Z',
        version: '1.0.0',
        environment: 'test',
        database: { status: 'up', state: 'connected', responseTime: 1 },
        memory: { status: 'up', used: 100, total: 1000, percentage: 10 },
        system: { platform: 'linux', nodeVersion: 'v22', uptime: 10 },
      }),
    };
    const mockAppService = {
      getHello: jest.fn().mockReturnValue('Hello World!'),
      getConfigStatus: jest.fn().mockReturnValue({}),
    };

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AppController, HealthController],
        providers: [
          { provide: HealthService, useValue: mockHealthService },
          { provide: AppService, useValue: mockAppService },
        ],
      }).compile();

      app = moduleFixture.createNestApplication();
      registerUptimeHealthRoute(app);
      app.setGlobalPrefix('api');
      await app.init();

      expressHandler = app.getHttpAdapter().getInstance();
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /health returns HTTP 200 with expected JSON and does not touch HealthService', async () => {
      const response = await dispatchInMemory(expressHandler, 'GET', '/health');

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual({
        status: 'ok',
        service: 'ecostep-backend',
        timestamp: expect.any(String),
      });
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
      expect(mockHealthService.check).not.toHaveBeenCalled();
    });

    it('keeps existing GET /api/health route functional', async () => {
      const response = await dispatchInMemory(
        expressHandler,
        'GET',
        '/api/health',
      );

      expect(response.statusCode).toBe(200);
      expect(response.json().status).toBe('healthy');
      expect(mockHealthService.check).toHaveBeenCalledTimes(1);
    });

    it('keeps existing GET /api/health/live route functional', async () => {
      const response = await dispatchInMemory(
        expressHandler,
        'GET',
        '/api/health/live',
      );

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    });

    it('keeps existing GET /api root route functional', async () => {
      const response = await dispatchInMemory(expressHandler, 'GET', '/api');

      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('Hello World!');
    });
  });

  describe('main.ts registration', () => {
    it('registers the uptime health route in main.ts before global prefix', () => {
      const mainPath = path.join(__dirname, '..', 'main.ts');
      const mainContent = fs.readFileSync(mainPath, 'utf-8');

      const registerIndex = mainContent.indexOf('registerUptimeHealthRoute(app)');
      const prefixIndex = mainContent.indexOf('app.setGlobalPrefix(apiPrefix)');

      expect(registerIndex).toBeGreaterThan(-1);
      expect(prefixIndex).toBeGreaterThan(registerIndex);
    });
  });
});
