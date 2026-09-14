import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsMongoId,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReadingSource } from '../schemas/energy-reading.schema';

/**
 * Reading Query DTO
 *
 * Query parameters for fetching sensor readings with filters and pagination.
 *
 * Usage:
 * GET /iot/readings/history/:sensorId?startDate=...&endDate=...&page=1&limit=20
 */
export class ReadingQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering readings (ISO 8601 format)',
    example: '2026-07-01T00:00:00.000Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering readings (ISO 8601 format)',
    example: '2026-07-17T23:59:59.999Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string' },
  )
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by reading source (hardware or mock)',
    enum: ReadingSource,
    example: ReadingSource.HARDWARE,
  })
  @IsOptional()
  @IsEnum(ReadingSource, {
    message: 'Source must be either "hardware" or "mock"',
  })
  source?: ReadingSource;

  @ApiPropertyOptional({
    description: 'Page number for pagination (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of readings per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number = 20;
}

/**
 * Statistics Query DTO
 *
 * Query parameters for fetching reading statistics.
 *
 * Usage:
 * GET /iot/readings/statistics/:sensorId?startDate=...&endDate=...
 */
export class StatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics calculation (ISO 8601 format)',
    example: '2026-07-01T00:00:00.000Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics calculation (ISO 8601 format)',
    example: '2026-07-17T23:59:59.999Z',
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string' },
  )
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by reading source (hardware or mock)',
    enum: ReadingSource,
    example: ReadingSource.HARDWARE,
  })
  @IsOptional()
  @IsEnum(ReadingSource, {
    message: 'Source must be either "hardware" or "mock"',
  })
  source?: ReadingSource;
}
