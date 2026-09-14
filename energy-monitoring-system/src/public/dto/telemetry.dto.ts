import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for public telemetry data
 *
 * Requirements: 11.3, 11.4, 11.5
 */
export class TelemetryDto {
  @ApiProperty({
    description: 'Current voltage in volts',
    example: 12.5,
  })
  voltage: number;

  @ApiProperty({
    description: 'Current current in amperes',
    example: 2.3,
  })
  current: number;

  @ApiProperty({
    description: 'Current power output in watts',
    example: 28.75,
  })
  power: number;

  @ApiProperty({
    description: 'Total energy generated today in kilowatt-hours',
    example: 0.145,
  })
  energyToday: number;

  @ApiProperty({
    description: 'Timestamp of the last update (ISO 8601)',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'System status',
    example: 'online',
    enum: ['online', 'offline'],
  })
  status: 'online' | 'offline';
}
