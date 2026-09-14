import { ApiProperty } from '@nestjs/swagger';

/**
 * Today Metrics DTO
 */
export class TodayMetricsDto {
  @ApiProperty({
    description: 'Total energy generated today (kWh)',
    example: 5.2,
  })
  energyKWh: number;

  @ApiProperty({
    description: 'Average power today (W)',
    example: 12.5,
  })
  avgPowerW: number;

  @ApiProperty({
    description: 'Peak power today (W)',
    example: 45.3,
  })
  peakPowerW: number;

  @ApiProperty({
    description: 'Number of readings today',
    example: 720,
  })
  readingCount: number;
}

/**
 * Yesterday Comparison DTO
 */
export class YesterdayComparisonDto {
  @ApiProperty({
    description: 'Energy generated yesterday (kWh)',
    example: 4.8,
  })
  energyKWh: number;

  @ApiProperty({
    description: 'Change vs today (percentage)',
    example: 8.3,
  })
  change: number;

  @ApiProperty({
    description: 'Trend direction',
    example: 'up',
    enum: ['up', 'down', 'stable'],
  })
  trend: 'up' | 'down' | 'stable';
}

/**
 * Week Metrics DTO
 */
export class WeekMetricsDto {
  @ApiProperty({
    description: 'Total energy this week (kWh)',
    example: 32.5,
  })
  energyKWh: number;

  @ApiProperty({
    description: 'Average power this week (W)',
    example: 15.2,
  })
  avgPowerW: number;

  @ApiProperty({
    description: 'Days active this week',
    example: 5,
  })
  daysActive: number;
}

/**
 * Month Metrics DTO
 */
export class MonthMetricsDto {
  @ApiProperty({
    description: 'Total energy this month (kWh)',
    example: 125.5,
  })
  energyKWh: number;

  @ApiProperty({
    description: 'Projected energy for full month (kWh)',
    example: 220.8,
  })
  projectedKWh: number;

  @ApiProperty({
    description: 'Cost savings this month ($)',
    example: 15.06,
  })
  costSavings: number;
}

/**
 * System Health Metrics DTO
 */
export class SystemHealthDto {
  @ApiProperty({
    description: 'Number of active sensors',
    example: 3,
  })
  activeSensors: number;

  @ApiProperty({
    description: 'Total readings in database',
    example: 12450,
  })
  totalReadings: number;

  @ApiProperty({
    description: 'Average reporting interval (minutes)',
    example: 2.5,
  })
  avgReportingInterval: number;

  @ApiProperty({
    description: 'System uptime percentage',
    example: 98.5,
  })
  systemUptime: number;
}

/**
 * Dashboard Analytics DTO
 *
 * Single endpoint response with all dashboard summary data.
 *
 * Usage:
 * - Dashboard page initial load
 * - Minimizes API requests
 * - Provides comprehensive overview
 */
export class DashboardAnalyticsDto {
  @ApiProperty({
    description: "Today's metrics",
    type: TodayMetricsDto,
  })
  today: TodayMetricsDto;

  @ApiProperty({
    description: 'Yesterday comparison',
    type: YesterdayComparisonDto,
  })
  yesterday: YesterdayComparisonDto;

  @ApiProperty({
    description: 'This week metrics',
    type: WeekMetricsDto,
  })
  week: WeekMetricsDto;

  @ApiProperty({
    description: 'This month metrics',
    type: MonthMetricsDto,
  })
  month: MonthMetricsDto;

  @ApiProperty({
    description: 'System health',
    type: SystemHealthDto,
  })
  system: SystemHealthDto;

  @ApiProperty({
    description: 'Generated timestamp',
    example: '2026-07-17T15:30:00.000Z',
  })
  generatedAt: Date;
}
