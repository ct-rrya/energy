import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

/**
 * Time Series Data Point DTO
 *
 * Represents a single data point in a time-series chart.
 *
 * Usage:
 * - Chart data points
 * - Hourly/daily/weekly aggregations
 * - Historical trends
 */
export class TimeSeriesDataPointDto {
  @ApiProperty({
    description: 'Timestamp of data point',
    example: '2026-07-17T14:00:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Metric value',
    example: 42.5,
  })
  value: number;

  @ApiProperty({
    description: 'Display label (e.g., "14:00", "Mon", "July")',
    example: '14:00',
  })
  label: string;

  @ApiPropertyOptional({
    description: 'Optional minimum value (for range charts)',
    example: 38.2,
  })
  min?: number;

  @ApiPropertyOptional({
    description: 'Optional maximum value (for range charts)',
    example: 45.8,
  })
  max?: number;

  @ApiPropertyOptional({
    description: 'Number of readings in this data point',
    example: 60,
  })
  count?: number;
}

/**
 * Time Series Summary DTO
 *
 * Statistical summary of time-series data.
 */
export class TimeSeriesSummaryDto {
  @ApiProperty({
    description: 'Minimum value',
    example: 0.5,
  })
  min: number;

  @ApiProperty({
    description: 'Maximum value',
    example: 48.3,
  })
  max: number;

  @ApiProperty({
    description: 'Average value',
    example: 12.7,
  })
  avg: number;

  @ApiPropertyOptional({
    description: 'Total (for cumulative metrics like energy)',
    example: 125.5,
  })
  total?: number;

  @ApiProperty({
    description: 'Number of data points',
    example: 24,
  })
  dataPoints: number;

  @ApiProperty({
    description: 'Total readings aggregated',
    example: 1440,
  })
  totalReadings: number;
}

/**
 * Time Series Response DTO
 *
 * Complete time-series data with metadata.
 */
export class TimeSeriesDto {
  @ApiProperty({
    description: 'Metric name',
    example: 'power',
    enum: ['power', 'voltage', 'current', 'battery', 'energy'],
  })
  metric: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'W',
  })
  unit: string;

  @ApiProperty({
    description: 'Time-series data points',
    type: [TimeSeriesDataPointDto],
  })
  dataPoints: TimeSeriesDataPointDto[];

  @ApiProperty({
    description: 'Statistical summary',
    type: TimeSeriesSummaryDto,
  })
  summary: TimeSeriesSummaryDto;

  @ApiProperty({
    description: 'Start date',
    example: '2026-07-17T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2026-07-18T00:00:00.000Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Granularity level',
    example: 'hour',
    enum: ['hour', 'day', 'week', 'month'],
  })
  granularity: string;
}
