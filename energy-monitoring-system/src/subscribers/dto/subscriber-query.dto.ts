import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Subscriber Query DTO
 * 
 * Query parameters for filtering subscribers.
 */
export class SubscriberQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'inactive', 'blocked'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'])
  status?: 'active' | 'inactive' | 'blocked';

  @ApiPropertyOptional({
    description: 'Filter by subscription status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isSubscribed?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name or Facebook User ID',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tag',
    example: 'vip',
  })
  @IsOptional()
  @IsString()
  tag?: string;
}
