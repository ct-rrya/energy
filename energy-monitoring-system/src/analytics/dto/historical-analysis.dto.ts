import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

/**
 * Historical Period Type
 */
export enum HistoricalPeriod {
  LAST_7_DAYS = 'last7days',
  LAST_30_DAYS = 'last30days',
  LAST_90_DAYS = 'last90days',
}

/**
 * Historical Analysis Request DTO
 */
export class HistoricalAnalysisRequestDto {
  @ApiProperty({
    description: 'Analysis period',
    enum: HistoricalPeriod,
    example: HistoricalPeriod.LAST_7_DAYS,
  })
  @IsEnum(HistoricalPeriod)
  period: HistoricalPeriod;

  @ApiProperty({
    description: 'Custom start date (optional, overrides period)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Custom end date (optional, overrides period)',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Historical Metrics DTO
 *
 * Structured metrics for AI analysis
 */
export class HistoricalMetricsDto {
  @ApiProperty({
    description: 'Total energy generated (kWh)',
    example: 125.5,
  })
  totalEnergyKWh: number;

  @ApiProperty({
    description: 'Average daily energy (kWh)',
    example: 18.5,
  })
  avgDailyEnergyKWh: number;

  @ApiProperty({
    description: 'Peak power (W)',
    example: 45.2,
  })
  peakPowerW: number;

  @ApiProperty({
    description: 'Average power (W)',
    example: 12.3,
  })
  avgPowerW: number;

  @ApiProperty({
    description: 'Energy trend direction',
    example: 'up',
    enum: ['up', 'down', 'stable'],
  })
  energyTrend: 'up' | 'down' | 'stable';

  @ApiProperty({
    description: 'CO2 avoided (kg)',
    example: 62.75,
  })
  co2AvoidedKg: number;

  @ApiProperty({
    description: 'Cost savings (USD)',
    example: 15.06,
  })
  costSavingsUSD: number;

  @ApiProperty({
    description: 'Number of days analyzed',
    example: 7,
  })
  daysAnalyzed: number;

  @ApiProperty({
    description: 'Analysis period',
    example: 'last7days',
  })
  period: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
  })
  startDate: string;

  @ApiProperty({
    description: 'End date',
    example: '2024-01-07',
  })
  endDate: string;
}

/**
 * Historical Analysis Response DTO
 */
export class HistoricalAnalysisResponseDto {
  @ApiProperty({
    description: 'AI-generated insights',
    example:
      'Your energy generation shows a positive upward trend over the past 7 days...',
  })
  insights: string;

  @ApiProperty({
    description: 'Structured metrics',
    type: HistoricalMetricsDto,
  })
  metrics: HistoricalMetricsDto;

  @ApiProperty({
    description: 'Generated timestamp',
    example: '2024-01-08T10:30:00.000Z',
  })
  generatedAt: Date;
}
