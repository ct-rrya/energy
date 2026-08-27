import { ApiProperty } from '@nestjs/swagger';

/**
 * Sensor Uptime DTO
 * 
 * Represents reliability metrics for a single sensor.
 */
export class SensorUptimeDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  sensorId: string;

  @ApiProperty({
    description: 'Sensor name',
    example: 'Main Entrance Sensor',
  })
  sensorName: string;

  @ApiProperty({
    description: 'Sensor location',
    example: 'Building A - Main Entrance',
  })
  sensorLocation: string;

  @ApiProperty({
    description: 'Uptime percentage',
    example: 98.5,
  })
  uptimePercent: number;

  @ApiProperty({
    description: 'Last seen timestamp',
    example: '2026-07-17T15:28:00.000Z',
  })
  lastSeen: Date;

  @ApiProperty({
    description: 'Number of readings in period',
    example: 1440,
  })
  readingCount: number;

  @ApiProperty({
    description: 'Expected readings in period',
    example: 1470,
  })
  expectedReadings: number;

  @ApiProperty({
    description: 'Average reporting interval (minutes)',
    example: 2.1,
  })
  avgReportingInterval: number;

  @ApiProperty({
    description: 'Reliability score',
    example: 'excellent',
    enum: ['excellent', 'good', 'fair', 'poor'],
  })
  reliability: 'excellent' | 'good' | 'fair' | 'poor';

  @ApiProperty({
    description: 'Is currently online',
    example: true,
  })
  isOnline: boolean;
}

/**
 * Sensor Uptime Response DTO
 * 
 * Complete sensor reliability report.
 */
export class SensorUptimeResponseDto {
  @ApiProperty({
    description: 'Start date of analysis',
    example: '2026-07-10',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date of analysis',
    example: '2026-07-17',
  })
  endDate: string;

  @ApiProperty({
    description: 'Sensor uptime data',
    type: [SensorUptimeDto],
  })
  sensors: SensorUptimeDto[];

  @ApiProperty({
    description: 'Overall system uptime',
    example: 97.8,
  })
  overallUptime: number;
}
