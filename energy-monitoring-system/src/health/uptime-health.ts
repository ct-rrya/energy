import { INestApplication } from '@nestjs/common';

export interface UptimeHealthResponse {
  status: 'ok';
  service: 'ecostep-backend';
  timestamp: string;
}

/**
 * Builds the lightweight health-check payload for external uptime monitors
 * such as UptimeRobot. Performs no database, Firebase, or external calls.
 */
export function getUptimeHealthPayload(): UptimeHealthResponse {
  return {
    status: 'ok',
    service: 'ecostep-backend',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Registers an unprefixed `GET /health` endpoint on the HTTP adapter instance.
 *
 * Kept separate from `setGlobalPrefix(apiPrefix)` so `/health` is reachable at
 * the root path without displacing or modifying the existing `/api/health`
 * diagnostic endpoints.
 */
export function registerUptimeHealthRoute(app: INestApplication): void {
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();

  instance.get('/health', (_req: unknown, res: any) => {
    res.status(200).json(getUptimeHealthPayload());
  });
}

