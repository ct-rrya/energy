import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReadingSource, SignalQuality } from '../schemas/energy-reading.schema';

/**
 * Create Reading Response DTO
 *
 * Lightweight response for ESP32 after submitting a reading.
 */
export class CreateReadingResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Reading ID',
    example: '6a5a35213fe6213bf029d104',
  })
  readingId: string;

  @ApiProperty({
    description: 'Server received timestamp',
    example: '2026-07-17T14:30:01.234Z',
  })
  receivedAt: Date;
}

/**
 * Reading Response DTO
 *
 * Standard response for sensor reading with calculated fields.
 */
export class ReadingResponseDto {
  @ApiProperty({
    description: 'Reading ID',
    example: '6a5a35213fe6213bf029d104',
  })
  id: string;

  @ApiProperty({
    description: 'Sensor ID',
    example: '6a5a35213fe6213bf029d100',
  })
  sensorId: string;

  @ApiProperty({
    description: 'Voltage in volts',
    example: 5.2,
  })
  voltage: number;

  @ApiProperty({
    description: 'Current in amperes',
    example: 0.15,
  })
  current: number;

  @ApiProperty({
    description: 'Power in watts',
    example: 0.78,
  })
  power: number;

  @ApiProperty({
    description: 'Energy in kilowatt-hours',
    example: 0.000001,
  })
  energy: number;

  @ApiProperty({
    description: 'Battery percentage (0-100%)',
    example: 85,
  })
  batteryPercentage: number;

  @ApiPropertyOptional({
    description: 'Temperature in Celsius',
    example: 25.5,
  })
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Frequency in Hz',
    example: 55,
  })
  frequency?: number;

  @ApiProperty({
    description: 'Reading timestamp from device',
    example: '2026-07-17T14:30:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Server received timestamp',
    example: '2026-07-17T14:30:01.234Z',
  })
  receivedAt: Date;

  @ApiProperty({
    description: 'Reading source',
    enum: ReadingSource,
    example: ReadingSource.HARDWARE,
  })
  source: ReadingSource;

  @ApiProperty({
    description: 'Signal quality (calculated from latency)',
    enum: SignalQuality,
    example: SignalQuality.EXCELLENT,
  })
  signalQuality: SignalQuality;

  @ApiProperty({
    description: 'Network latency in milliseconds',
    example: 234,
  })
  latency: number;

  @ApiProperty({
    description: 'Power in kilowatts',
    example: 0.00078,
  })
  powerKW: number;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2026-07-17T14:30:01.234Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2026-07-17T14:30:01.234Z',
  })
  updatedAt: Date;
}

/**
 * Paginated Readings Response DTO
 *
 * Response for paginated list of readings.
 */
export class PaginatedReadingsResponseDto {
  @ApiProperty({
    description: 'Array of readings',
    type: [ReadingResponseDto],
  })
  readings: ReadingResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 20,
      total: 150,
      totalPages: 8,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Reading Statistics Response DTO
 *
 * Aggregated statistics for sensor readings.
 */
export class ReadingStatisticsResponseDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: '6a5a35213fe6213bf029d100',
  })
  sensorId: string;

  @ApiProperty({
    description: 'Total number of readings',
    example: 150,
  })
  totalReadings: number;

  @ApiProperty({
    description: 'Date range start',
    example: '2026-07-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'Date range end',
    example: '2026-07-17T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Voltage statistics',
    example: {
      min: 3.5,
      max: 12.0,
      avg: 7.8,
    },
  })
  voltage: {
    min: number;
    max: number;
    avg: number;
  };

  @ApiProperty({
    description: 'Current statistics',
    example: {
      min: 0.01,
      max: 1.5,
      avg: 0.45,
    },
  })
  current: {
    min: number;
    max: number;
    avg: number;
  };

  @ApiProperty({
    description: 'Power statistics',
    example: {
      min: 0.1,
      max: 18.0,
      avg: 3.5,
    },
  })
  power: {
    min: number;
    max: number;
    avg: number;
  };

  @ApiProperty({
    description: 'Total energy harvested in kWh',
    example: 0.523,
  })
  totalEnergy: number;

  @ApiProperty({
    description: 'Battery statistics',
    example: {
      min: 15,
      max: 100,
      avg: 75,
    },
  })
  battery: {
    min: number;
    max: number;
    avg: number;
  };

  @ApiPropertyOptional({
    description: 'Temperature statistics (if available)',
    example: {
      min: 20,
      max: 35,
      avg: 27.5,
    },
  })
  temperature?: {
    min: number;
    max: number;
    avg: number;
  };

  @ApiPropertyOptional({
    description: 'Frequency statistics (if available)',
    example: {
      min: 45,
      max: 65,
      avg: 55,
    },
  })
  frequency?: {
    min: number;
    max: number;
    avg: number;
  };
}
