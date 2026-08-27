import { ApiProperty } from '@nestjs/swagger';

/**
 * Health Status Enum
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

/**
 * Database Health DTO
 */
export class DatabaseHealthDto {
  @ApiProperty({
    description: 'Database connection status',
    example: 'up',
    enum: ['up', 'down'],
  })
  status: string;

  @ApiProperty({
    description: 'Database connection state',
    example: 'connected',
  })
  state: string;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 5,
    required: false,
  })
  responseTime?: number;
}

/**
 * Memory Health DTO
 */
export class MemoryHealthDto {
  @ApiProperty({
    description: 'Memory heap status',
    example: 'up',
    enum: ['up', 'down'],
  })
  status: string;

  @ApiProperty({
    description: 'Used memory in bytes',
    example: 50000000,
  })
  used: number;

  @ApiProperty({
    description: 'Total memory in bytes',
    example: 100000000,
  })
  total: number;

  @ApiProperty({
    description: 'Memory usage percentage',
    example: 50,
  })
  percentage: number;
}

/**
 * System Info DTO
 */
export class SystemInfoDto {
  @ApiProperty({
    description: 'Node.js version',
    example: 'v22.20.0',
  })
  nodeVersion: string;

  @ApiProperty({
    description: 'Operating system platform',
    example: 'win32',
  })
  platform: string;

  @ApiProperty({
    description: 'Process uptime in seconds',
    example: 3600,
  })
  uptime: number;

  @ApiProperty({
    description: 'Process ID',
    example: 12345,
  })
  pid: number;
}

/**
 * Health Check Response DTO
 */
export class HealthCheckResponseDto {
  @ApiProperty({
    description: 'Overall health status',
    example: 'healthy',
    enum: Object.values(HealthStatus),
  })
  status: string;

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2026-07-17T10:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Application version',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Environment',
    example: 'development',
  })
  environment: string;

  @ApiProperty({
    description: 'Database health status',
    type: DatabaseHealthDto,
  })
  database: DatabaseHealthDto;

  @ApiProperty({
    description: 'Memory health status',
    type: MemoryHealthDto,
  })
  memory: MemoryHealthDto;

  @ApiProperty({
    description: 'System information',
    type: SystemInfoDto,
  })
  system: SystemInfoDto;
}
