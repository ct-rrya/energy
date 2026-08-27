import { IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Date Range Query DTO
 * 
 * Used for querying energy data within a date range.
 * 
 * Usage:
 * - GET /api/energy/range?startDate=2026-07-01&endDate=2026-07-17
 * - GET /api/energy/sensor/:sensorId/range?startDate=2026-07-01&endDate=2026-07-17
 * 
 * Validation:
 * - Both dates must be valid ISO 8601 format
 * - Dates are optional (defaults in service)
 * 
 * Example:
 * ?startDate=2026-07-01&endDate=2026-07-17
 */
export class DateRangeQueryDto {
  @ApiProperty({
    description: 'Start date (ISO 8601 format)',
    example: '2026-07-01',
    type: String,
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date (ISO 8601 format)',
    example: '2026-07-17',
    type: String,
  })
  @IsDateString()
  endDate: string;
}

/**
 * Limit Query DTO
 * 
 * Used for querying recent readings with a limit.
 * 
 * Usage:
 * - GET /api/energy/recent?limit=50
 * - GET /api/energy/sensor/:sensorId/recent?limit=100
 * 
 * Validation:
 * - Limit must be integer
 * - Min: 1
 * - Max: 1000
 * - Default: 100 (in controller)
 * 
 * Example:
 * ?limit=50
 */
export class LimitQueryDto {
  @ApiPropertyOptional({
    description: 'Number of readings to retrieve',
    example: 100,
    minimum: 1,
    maximum: 1000,
    default: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

/**
 * Date Range with Limit Query DTO
 * 
 * Used for querying readings within a date range with a limit.
 * 
 * Usage:
 * - GET /api/energy/readings?startDate=2026-07-01&endDate=2026-07-17&limit=500
 * 
 * Validation:
 * - Dates must be valid ISO 8601
 * - Limit is optional (default: 1000)
 * 
 * Example:
 * ?startDate=2026-07-01&endDate=2026-07-17&limit=500
 */
export class DateRangeLimitQueryDto {
  @ApiProperty({
    description: 'Start date (ISO 8601 format)',
    example: '2026-07-01',
    type: String,
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date (ISO 8601 format)',
    example: '2026-07-17',
    type: String,
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Maximum number of readings to retrieve',
    example: 1000,
    minimum: 1,
    maximum: 10000,
    default: 1000,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number = 1000;
}
