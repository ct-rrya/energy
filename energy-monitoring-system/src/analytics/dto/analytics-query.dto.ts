import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

/**
 * Metric Type Enum
 */
export enum MetricType {
  POWER = 'power',
  VOLTAGE = 'voltage',
  CURRENT = 'current',
  BATTERY = 'battery',
  ENERGY = 'energy',
  STEPS = 'steps',
  CAPACITOR_VOLTAGE = 'capacitorVoltage',
  TEMPERATURE = 'temperature',
  FREQUENCY = 'frequency',
}

/**
 * Granularity Enum
 */
export enum Granularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Source Filter Enum
 */
export enum SourceFilter {
  ALL = 'all',
  HARDWARE = 'hardware',
  MOCK = 'mock',
}

/**
 * Analytics Query DTO
 *
 * Query parameters for analytics endpoints.
 */
export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD or ISO 8601)',
    example: '2026-07-17',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD or ISO 8601)',
    example: '2026-07-18',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Specific sensor ID (optional, aggregates all if omitted)',
    example: '64f9a1b2c3d4e5f6g7h8i9j0',
  })
  @IsOptional()
  @IsString()
  sensorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by data source',
    enum: SourceFilter,
    default: SourceFilter.HARDWARE,
  })
  @IsOptional()
  @IsEnum(SourceFilter)
  source?: SourceFilter;

  @ApiPropertyOptional({
    description: 'Aggregation granularity',
    enum: Granularity,
    default: Granularity.HOUR,
  })
  @IsOptional()
  @IsEnum(Granularity)
  granularity?: Granularity;

  @ApiPropertyOptional({
    description: 'Metric to query',
    enum: MetricType,
    default: MetricType.POWER,
  })
  @IsOptional()
  @IsEnum(MetricType)
  metric?: MetricType;
}
