import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  DailyEnergySummaryDto,
  WeeklyEnergySummaryDto,
  MonthlyEnergySummaryDto,
  PeakGenerationDto,
  EnvironmentalImpactDto,
  CostSavingsDto,
  ComprehensiveAnalyticsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Analytics Controller
 * 
 * REST API endpoints for energy analytics.
 * 
 * Endpoints:
 * - GET /api/analytics/comprehensive     All analytics
 * - GET /api/analytics/dashboard         Dashboard summary (Phase 6)
 * - GET /api/analytics/daily             Daily summary
 * - GET /api/analytics/weekly            Weekly summary
 * - GET /api/analytics/monthly           Monthly summary
 * - GET /api/analytics/peak              Peak generation
 * - GET /api/analytics/environmental     Environmental impact
 * - GET /api/analytics/cost-savings      Cost savings
 * 
 * All endpoints require JWT authentication.
 * 
 * Usage:
 * - Dashboard: Fetch comprehensive analytics
 * - Reports: Fetch specific analytics
 * - Messenger Bot: Uses service directly (not HTTP)
 */
@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get Dashboard Analytics (Phase 6)
   * 
   * Returns dashboard summary with today, yesterday, week, month, and system health.
   * Optimized single endpoint to minimize API requests.
   * 
   * @returns Dashboard analytics
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard analytics',
    description:
      'Returns dashboard summary including today, yesterday comparison, week metrics, month metrics, and system health. Optimized for dashboard page.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics retrieved successfully',
  })
  async getDashboard() {
    return this.analyticsService.getDashboardAnalytics();
  }

  /**
   * Get Comprehensive Analytics
   * 
   * Returns all analytics in one response.
   * 
   * @returns Comprehensive analytics
   * 
   * Perfect for dashboard initial load.
   */
  @Get('comprehensive')
  @ApiOperation({
    summary: 'Get comprehensive analytics',
    description:
      'Returns all analytics including today, this week, this month, peak, environmental, cost savings, and trends. Perfect for dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive analytics retrieved successfully',
    type: ComprehensiveAnalyticsDto,
  })
  async getComprehensive(): Promise<ComprehensiveAnalyticsDto> {
    return this.analyticsService.getComprehensiveAnalytics();
  }

  /**
   * Get Daily Summary
   * 
   * Returns energy summary for a specific date.
   * 
   * @param date - Date (YYYY-MM-DD), defaults to today
   * @returns Daily energy summary
   */
  @Get('daily')
  @ApiOperation({
    summary: 'Get daily energy summary',
    description:
      'Returns energy summary for a specific date. Defaults to today if date not provided.',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date (YYYY-MM-DD)',
    example: '2026-07-17',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily summary retrieved successfully',
    type: DailyEnergySummaryDto,
  })
  async getDaily(
    @Query('date') date?: string,
  ): Promise<DailyEnergySummaryDto> {
    return this.analyticsService.getDailySummary(date || new Date());
  }

  /**
   * Get Weekly Summary
   * 
   * Returns energy summary for a week (Monday-Sunday).
   * 
   * @param weekStart - Week start date (Monday), defaults to this week
   * @returns Weekly energy summary with daily breakdown
   */
  @Get('weekly')
  @ApiOperation({
    summary: 'Get weekly energy summary',
    description:
      'Returns energy summary for a week (Monday-Sunday). Defaults to current week if not provided.',
  })
  @ApiQuery({
    name: 'weekStart',
    required: false,
    description: 'Week start date (Monday, YYYY-MM-DD)',
    example: '2026-07-13',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly summary retrieved successfully',
    type: WeeklyEnergySummaryDto,
  })
  async getWeekly(
    @Query('weekStart') weekStart?: string,
  ): Promise<WeeklyEnergySummaryDto> {
    return this.analyticsService.getWeeklySummary(weekStart);
  }

  /**
   * Get Monthly Summary
   * 
   * Returns energy summary for a month.
   * 
   * @param year - Year, defaults to current year
   * @param month - Month (1-12), defaults to current month
   * @returns Monthly energy summary
   */
  @Get('monthly')
  @ApiOperation({
    summary: 'Get monthly energy summary',
    description:
      'Returns energy summary for a month. Defaults to current month if not provided.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year',
    example: 2026,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month (1-12)',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Monthly summary retrieved successfully',
    type: MonthlyEnergySummaryDto,
  })
  async getMonthly(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ): Promise<MonthlyEnergySummaryDto> {
    return this.analyticsService.getMonthlySummary(year, month);
  }

  /**
   * Get Peak Generation
   * 
   * Returns reading with highest power in date range.
   * 
   * @param startDate - Start date
   * @param endDate - End date (optional, defaults to today)
   * @returns Peak generation details
   */
  @Get('peak')
  @ApiOperation({
    summary: 'Get peak generation',
    description:
      'Returns the reading with highest power in specified date range.',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date (YYYY-MM-DD)',
    example: '2026-07-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD), defaults to today',
    example: '2026-07-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Peak generation retrieved successfully',
    type: PeakGenerationDto,
  })
  async getPeak(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate?: string,
  ): Promise<PeakGenerationDto | null> {
    return this.analyticsService.getPeakGeneration(startDate, endDate);
  }

  /**
   * Get Environmental Impact
   * 
   * Calculates environmental impact for given energy.
   * 
   * @param energyKWh - Energy in kWh
   * @returns Environmental impact metrics
   */
  @Get('environmental')
  @ApiOperation({
    summary: 'Get environmental impact',
    description:
      'Calculates CO2 avoided, trees equivalent, and other environmental metrics for given energy amount.',
  })
  @ApiQuery({
    name: 'energyKWh',
    required: true,
    description: 'Energy generated (kWh)',
    example: 125.5,
  })
  @ApiResponse({
    status: 200,
    description: 'Environmental impact calculated successfully',
    type: EnvironmentalImpactDto,
  })
  getEnvironmentalImpact(
    @Query('energyKWh') energyKWh: number,
  ): EnvironmentalImpactDto {
    return this.analyticsService.calculateEnvironmentalImpact(
      Number(energyKWh),
    );
  }

  /**
   * Get Cost Savings
   * 
   * Estimates cost savings for given energy.
   * 
   * @param energyKWh - Energy in kWh
   * @param periodDays - Number of days in period
   * @param electricityRate - Rate per kWh (optional, defaults to 0.12)
   * @returns Cost savings metrics
   */
  @Get('cost-savings')
  @ApiOperation({
    summary: 'Get cost savings',
    description:
      'Estimates cost savings from energy generated. Includes daily, monthly, and yearly projections.',
  })
  @ApiQuery({
    name: 'energyKWh',
    required: true,
    description: 'Energy generated (kWh)',
    example: 125.5,
  })
  @ApiQuery({
    name: 'periodDays',
    required: true,
    description: 'Number of days in period',
    example: 30,
  })
  @ApiQuery({
    name: 'electricityRate',
    required: false,
    description: 'Electricity rate ($/kWh)',
    example: 0.12,
  })
  @ApiResponse({
    status: 200,
    description: 'Cost savings calculated successfully',
    type: CostSavingsDto,
  })
  getCostSavings(
    @Query('energyKWh') energyKWh: number,
    @Query('periodDays') periodDays: number,
    @Query('electricityRate') electricityRate?: number,
  ): CostSavingsDto {
    return this.analyticsService.calculateCostSavings(
      Number(energyKWh),
      Number(periodDays),
      electricityRate ? Number(electricityRate) : undefined,
    );
  }
}
