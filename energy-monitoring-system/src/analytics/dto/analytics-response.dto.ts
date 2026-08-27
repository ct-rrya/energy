import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Energy Summary DTO
 * 
 * Common fields for all energy summaries.
 */
export class BaseEnergySummaryDto {
  @ApiProperty({
    description: 'Total energy generated (kWh)',
    example: 12.5,
  })
  totalEnergyKWh: number;

  @ApiProperty({
    description: 'Total power sum (W)',
    example: 12500,
  })
  totalPowerW: number;

  @ApiProperty({
    description: 'Average power (W)',
    example: 8.5,
  })
  avgPowerW: number;

  @ApiProperty({
    description: 'Peak power (W)',
    example: 25.3,
  })
  peakPowerW: number;

  @ApiProperty({
    description: 'Minimum power (W)',
    example: 0.5,
  })
  minPowerW: number;

  @ApiProperty({
    description: 'Number of readings',
    example: 1470,
  })
  readingCount: number;
}

/**
 * Daily Energy Summary DTO
 */
export class DailyEnergySummaryDto extends BaseEnergySummaryDto {
  @ApiProperty({
    description: 'Date (YYYY-MM-DD)',
    example: '2026-07-17',
  })
  date: string;

  @ApiProperty({
    description: 'Day of week',
    example: 'Friday',
  })
  dayOfWeek: string;

  @ApiProperty({
    description: 'Is today',
    example: true,
  })
  isToday: boolean;
}

/**
 * Weekly Energy Summary DTO
 */
export class WeeklyEnergySummaryDto extends BaseEnergySummaryDto {
  @ApiProperty({
    description: 'Week start date (Monday)',
    example: '2026-07-13',
  })
  weekStart: string;

  @ApiProperty({
    description: 'Week end date (Sunday)',
    example: '2026-07-19',
  })
  weekEnd: string;

  @ApiProperty({
    description: 'Week number (1-53)',
    example: 29,
  })
  weekNumber: number;

  @ApiProperty({
    description: 'Is current week',
    example: true,
  })
  isCurrentWeek: boolean;

  @ApiProperty({
    description: 'Daily breakdown',
    type: [DailyEnergySummaryDto],
  })
  dailyBreakdown: DailyEnergySummaryDto[];
}

/**
 * Monthly Energy Summary DTO
 */
export class MonthlyEnergySummaryDto extends BaseEnergySummaryDto {
  @ApiProperty({
    description: 'Month (1-12)',
    example: 7,
  })
  month: number;

  @ApiProperty({
    description: 'Month name',
    example: 'July',
  })
  monthName: string;

  @ApiProperty({
    description: 'Year',
    example: 2026,
  })
  year: number;

  @ApiProperty({
    description: 'Is current month',
    example: true,
  })
  isCurrentMonth: boolean;

  @ApiProperty({
    description: 'Number of days in month',
    example: 31,
  })
  daysInMonth: number;

  @ApiProperty({
    description: 'Days with data',
    example: 17,
  })
  daysWithData: number;
}

/**
 * Peak Generation DTO
 */
export class PeakGenerationDto {
  @ApiProperty({
    description: 'Peak power (W)',
    example: 45.2,
  })
  peakPowerW: number;

  @ApiProperty({
    description: 'Timestamp of peak',
    example: '2026-07-17T13:25:00.000Z',
  })
  timestamp: Date;

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
    description: 'Date of peak (YYYY-MM-DD)',
    example: '2026-07-17',
  })
  date: string;

  @ApiProperty({
    description: 'Time of peak (HH:MM)',
    example: '13:25',
  })
  time: string;
}

/**
 * Environmental Impact DTO
 */
export class EnvironmentalImpactDto {
  @ApiProperty({
    description: 'Total energy generated (kWh)',
    example: 125.5,
  })
  energyGeneratedKWh: number;

  @ApiProperty({
    description: 'CO2 emissions avoided (kg)',
    example: 62.75,
    type: Number,
  })
  co2AvoidedKg: number;

  @ApiProperty({
    description: 'Equivalent trees planted',
    example: 2.8,
    type: Number,
  })
  treesEquivalent: number;

  @ApiProperty({
    description: 'Coal not burned (kg)',
    example: 56.5,
    type: Number,
  })
  coalNotBurnedKg: number;

  @ApiProperty({
    description: 'Homes powered for a day',
    example: 4.2,
    type: Number,
  })
  homesPoweredDays: number;

  @ApiProperty({
    description: 'Phone charges equivalent',
    example: 10450,
  })
  phoneChargesEquivalent: number;

  @ApiProperty({
    description: 'Calculation notes',
    example:
      'Based on US EPA conversion factors. CO2: 0.5 kg/kWh, Tree: 21 kg CO2/year',
  })
  calculationNotes: string;
}

/**
 * Cost Savings DTO
 */
export class CostSavingsDto {
  @ApiProperty({
    description: 'Energy generated (kWh)',
    example: 125.5,
  })
  energyGeneratedKWh: number;

  @ApiProperty({
    description: 'Electricity rate ($/kWh)',
    example: 0.12,
    type: Number,
  })
  electricityRatePerKWh: number;

  @ApiProperty({
    description: 'Total savings ($)',
    example: 15.06,
    type: Number,
  })
  totalSavings: number;

  @ApiProperty({
    description: 'Daily average savings ($)',
    example: 0.88,
    type: Number,
  })
  dailyAverageSavings: number;

  @ApiProperty({
    description: 'Monthly projected savings ($)',
    example: 26.64,
    type: Number,
  })
  monthlyProjectedSavings: number;

  @ApiProperty({
    description: 'Yearly projected savings ($)',
    example: 319.68,
    type: Number,
  })
  yearlyProjectedSavings: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Period covered (days)',
    example: 17,
  })
  periodDays: number;
}

/**
 * Trend Analysis DTO
 */
export class TrendAnalysisDto {
  @ApiProperty({
    description: 'Current period value',
    example: 125.5,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Previous period value',
    example: 98.3,
  })
  previousValue: number;

  @ApiProperty({
    description: 'Change amount',
    example: 27.2,
  })
  change: number;

  @ApiProperty({
    description: 'Change percentage',
    example: 27.7,
  })
  changePercent: number;

  @ApiProperty({
    description: 'Trend direction',
    example: 'up',
    enum: ['up', 'down', 'stable'],
  })
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({
    description: 'Period description',
    example: 'This week vs last week',
  })
  period: string;
}

/**
 * Comprehensive Analytics DTO
 * 
 * Combines all analytics for dashboard/bot.
 */
export class ComprehensiveAnalyticsDto {
  @ApiProperty({
    description: 'Daily summary',
    type: DailyEnergySummaryDto,
  })
  today: DailyEnergySummaryDto;

  @ApiProperty({
    description: 'Weekly summary',
    type: WeeklyEnergySummaryDto,
  })
  thisWeek: WeeklyEnergySummaryDto;

  @ApiProperty({
    description: 'Monthly summary',
    type: MonthlyEnergySummaryDto,
  })
  thisMonth: MonthlyEnergySummaryDto;

  @ApiProperty({
    description: 'Peak generation',
    type: PeakGenerationDto,
    nullable: true,
  })
  peakGeneration: PeakGenerationDto | null;

  @ApiProperty({
    description: 'Environmental impact',
    type: EnvironmentalImpactDto,
  })
  environmentalImpact: EnvironmentalImpactDto;

  @ApiProperty({
    description: 'Cost savings',
    type: CostSavingsDto,
  })
  costSavings: CostSavingsDto;

  @ApiProperty({
    description: 'Trend analysis',
    type: TrendAnalysisDto,
  })
  trend: TrendAnalysisDto;

  @ApiProperty({
    description: 'Generated timestamp',
    example: '2026-07-17T15:30:00.000Z',
  })
  generatedAt: Date;
}
