import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * Diagnostic History Query DTO
 *
 * Data Transfer Object for paginating diagnostic test history.
 *
 * Query Parameters:
 * - page: Page number (default: 1, min: 1)
 * - limit: Items per page (default: 20, min: 1, max: 100)
 *
 * Usage:
 * GET /api/diagnostics/history?page=1&limit=20
 * GET /api/diagnostics/history?page=2&limit=50
 *
 * Pagination Logic:
 * - Results are sorted by testDate descending (newest first)
 * - Skip = (page - 1) × limit
 * - Total pages = Math.ceil(total / limit)
 */
export class DiagnosticHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination (starts at 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit?: number;
}
