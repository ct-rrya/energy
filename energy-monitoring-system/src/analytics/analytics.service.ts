import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EnergyService } from '../energy/energy.service';
import { SensorsService } from '../sensors/sensors.service';
import {
  EnergyReading,
  EnergyReadingDocument,
} from '../iot/schemas/energy-reading.schema';
import { Sensor, SensorDocument } from '../sensors/schemas/sensor.schema';
import {
  DailyEnergySummaryDto,
  WeeklyEnergySummaryDto,
  MonthlyEnergySummaryDto,
  PeakGenerationDto,
  EnvironmentalImpactDto,
  CostSavingsDto,
  TrendAnalysisDto,
  ComprehensiveAnalyticsDto,
  TimeSeriesDto,
  TimeSeriesDataPointDto,
  TimeSeriesSummaryDto,
  AnalyticsQueryDto,
  MetricType,
  Granularity,
  SourceFilter,
  DashboardAnalyticsDto,
  TodayMetricsDto,
  YesterdayComparisonDto,
  WeekMetricsDto,
  MonthMetricsDto,
  SystemHealthDto,
  HourlyAverageDto,
  HourlyAveragesResponseDto,
  SensorUptimeDto,
  SensorUptimeResponseDto,
  HistoricalMetricsDto,
  HistoricalPeriod,
} from './dto';

/**
 * Analytics Service
 *
 * Centralized service for energy analytics calculations.
 * Provides reusable methods for Dashboard and Messenger Bot.
 *
 * Responsibilities:
 * - Daily/Weekly/Monthly energy summaries
 * - Peak generation detection
 * - Environmental impact calculation
 * - Cost savings estimation
 * - Trend analysis (compare periods)
 *
 * Principle: Don't Duplicate, Delegate
 * - Uses EnergyService for database queries
 * - Adds business logic on top of raw data
 * - Single source of truth for calculations
 *
 * Consumed By:
 * - Dashboard (real-time charts)
 * - Messenger Bot (chat responses)
 * - API endpoints (REST responses)
 * - Reports (PDF generation)
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // Environmental conversion factors (US EPA standards)
  private readonly CO2_PER_KWH = 0.5; // kg CO2 per kWh
  private readonly CO2_PER_TREE_YEAR = 21; // kg CO2 absorbed by tree per year
  private readonly COAL_PER_KWH = 0.45; // kg coal burned per kWh
  private readonly AVG_HOME_DAILY_KWH = 30; // Average home uses 30 kWh/day
  private readonly PHONE_CHARGE_KWH = 0.012; // 12 Wh per phone charge

  // Cost conversion (configurable)
  private readonly DEFAULT_ELECTRICITY_RATE = 0.12; // $/kWh (US average)

  constructor(
    private energyService: EnergyService,
    @InjectModel(EnergyReading.name)
    private readingModel: Model<EnergyReadingDocument>,
    @InjectModel(Sensor.name)
    private sensorModel: Model<SensorDocument>,
    private sensorsService: SensorsService,
  ) {}

  /**
   * Get Daily Energy Summary
   *
   * Calculates energy summary for a specific date.
   *
   * @param date - Date string (YYYY-MM-DD) or Date object
   * @returns Daily energy summary
   *
   * Usage:
   * - Today's summary: getDailySummary(new Date())
   * - Specific date: getDailySummary('2026-07-15')
   */
  async getDailySummary(date: Date | string): Promise<DailyEnergySummaryDto> {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const dateStr = targetDate.toISOString().split('T')[0];

    this.logger.debug(`Getting daily summary for ${dateStr}`);

    // Query energy for the date
    const energy = await this.energyService.getEnergyRange(dateStr, dateStr);

    // Get day of week
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayOfWeek = dayNames[targetDate.getDay()];

    // Check if today
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;

    return {
      date: dateStr,
      dayOfWeek,
      isToday,
      totalEnergyKWh: energy.estimatedEnergyKWh,
      totalPowerW: energy.totalPower,
      avgPowerW: energy.avgPower,
      peakPowerW: energy.maxPower,
      minPowerW: energy.minPower,
      readingCount: energy.count,
    };
  }

  /**
   * Get Weekly Energy Summary
   *
   * Calculates energy summary for a week (Monday-Sunday).
   *
   * @param weekStartDate - Week start date (Monday)
   * @returns Weekly energy summary with daily breakdown
   *
   * Usage:
   * - This week: getWeeklySummary(getMondayOfCurrentWeek())
   * - Specific week: getWeeklySummary('2026-07-13')
   */
  async getWeeklySummary(
    weekStartDate?: Date | string,
  ): Promise<WeeklyEnergySummaryDto> {
    // Get Monday of the week
    const monday = weekStartDate
      ? typeof weekStartDate === 'string'
        ? new Date(weekStartDate)
        : weekStartDate
      : this.getMondayOfWeek(new Date());

    // Get Sunday (6 days after Monday)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = sunday.toISOString().split('T')[0];

    this.logger.debug(`Getting weekly summary for ${weekStart} to ${weekEnd}`);

    // Query energy for the week
    const energy = await this.energyService.getEnergyRange(weekStart, weekEnd);

    // Get week number (1-53)
    const weekNumber = this.getWeekNumber(monday);

    // Check if current week
    const currentMonday = this.getMondayOfWeek(new Date());
    const isCurrentWeek =
      monday.toISOString().split('T')[0] ===
      currentMonday.toISOString().split('T')[0];

    // Get daily breakdown
    const dailyBreakdown: DailyEnergySummaryDto[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dailySummary = await this.getDailySummary(day);
      dailyBreakdown.push(dailySummary);
    }

    return {
      weekStart,
      weekEnd,
      weekNumber,
      isCurrentWeek,
      totalEnergyKWh: energy.estimatedEnergyKWh,
      totalPowerW: energy.totalPower,
      avgPowerW: energy.avgPower,
      peakPowerW: energy.maxPower,
      minPowerW: energy.minPower,
      readingCount: energy.count,
      dailyBreakdown,
    };
  }

  /**
   * Get Monthly Energy Summary
   *
   * Calculates energy summary for a month.
   *
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Monthly energy summary
   *
   * Usage:
   * - This month: getMonthlySummary(2026, 7)
   * - Specific month: getMonthlySummary(2026, 6)
   */
  async getMonthlySummary(
    year?: number,
    month?: number,
  ): Promise<MonthlyEnergySummaryDto> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    // Get first and last day of month
    const firstDay = new Date(targetYear, targetMonth - 1, 1);
    const lastDay = new Date(targetYear, targetMonth, 0);

    const monthStart = firstDay.toISOString().split('T')[0];
    const monthEnd = lastDay.toISOString().split('T')[0];

    this.logger.debug(
      `Getting monthly summary for ${targetYear}-${String(targetMonth).padStart(2, '0')}`,
    );

    // Query energy for the month
    const energy = await this.energyService.getEnergyRange(
      monthStart,
      monthEnd,
    );

    // Get month name
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthName = monthNames[targetMonth - 1];

    // Check if current month
    const isCurrentMonth =
      targetYear === now.getFullYear() && targetMonth === now.getMonth() + 1;

    // Days in month
    const daysInMonth = lastDay.getDate();

    // Days with data (count distinct dates)
    const daysWithData = energy.count > 0 ? now.getDate() : 0; // Simplified

    return {
      month: targetMonth,
      monthName,
      year: targetYear,
      isCurrentMonth,
      daysInMonth,
      daysWithData,
      totalEnergyKWh: energy.estimatedEnergyKWh,
      totalPowerW: energy.totalPower,
      avgPowerW: energy.avgPower,
      peakPowerW: energy.maxPower,
      minPowerW: energy.minPower,
      readingCount: energy.count,
    };
  }

  /**
   * Get Peak Generation
   *
   * Finds the reading with highest power in a date range.
   *
   * @param startDate - Start date
   * @param endDate - End date (optional, defaults to today)
   * @returns Peak generation details
   *
   * Usage:
   * - This month: getPeakGeneration('2026-07-01', '2026-07-31')
   * - All time: getPeakGeneration('2020-01-01')
   */
  async getPeakGeneration(
    startDate: string,
    endDate?: string,
  ): Promise<PeakGenerationDto | null> {
    const end = endDate || new Date().toISOString().split('T')[0];

    this.logger.debug(`Finding peak generation from ${startDate} to ${end}`);

    // Query database for max power reading (hardware data only)
    const peakReading = await this.readingModel
      .findOne({
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(end + 'T23:59:59.999Z'),
        },
        source: 'hardware' as any, // REQUIREMENT 12.1: Filter for hardware data only
      })
      .sort({ power: -1 }) // Highest power first
      .limit(1)
      .populate('sensorId', 'name location')
      .exec();

    if (!peakReading) {
      return null;
    }

    const sensor = peakReading.sensorId as any;

    return {
      peakPowerW: peakReading.power,
      timestamp: peakReading.timestamp,
      sensorId: sensor._id.toString(),
      sensorName: sensor.name,
      sensorLocation: sensor.location,
      date: peakReading.timestamp.toISOString().split('T')[0],
      time: peakReading.timestamp.toTimeString().substring(0, 5),
    };
  }

  /**
   * Calculate Environmental Impact
   *
   * Calculates CO2 avoided, trees equivalent, etc.
   *
   * @param energyKWh - Energy generated in kWh
   * @returns Environmental impact metrics
   *
   * Conversion Factors (US EPA):
   * - CO2: 0.5 kg per kWh
   * - Tree: Absorbs 21 kg CO2 per year
   * - Coal: 0.45 kg per kWh
   * - Home: Uses 30 kWh per day
   * - Phone: 0.012 kWh per charge
   */
  calculateEnvironmentalImpact(energyKWh: number): EnvironmentalImpactDto {
    const co2AvoidedKg = energyKWh * this.CO2_PER_KWH;
    const treesEquivalent = co2AvoidedKg / this.CO2_PER_TREE_YEAR;
    const coalNotBurnedKg = energyKWh * this.COAL_PER_KWH;
    const homesPoweredDays = energyKWh / this.AVG_HOME_DAILY_KWH;
    const phoneChargesEquivalent = Math.floor(
      energyKWh / this.PHONE_CHARGE_KWH,
    );

    return {
      energyGeneratedKWh: Math.round(energyKWh * 1000) / 1000,
      co2AvoidedKg: Math.round(co2AvoidedKg * 100) / 100,
      treesEquivalent: Math.round(treesEquivalent * 10) / 10,
      coalNotBurnedKg: Math.round(coalNotBurnedKg * 10) / 10,
      homesPoweredDays: Math.round(homesPoweredDays * 10) / 10,
      phoneChargesEquivalent,
      calculationNotes:
        'Based on US EPA conversion factors. CO2: 0.5 kg/kWh, Tree: 21 kg CO2/year, Coal: 0.45 kg/kWh, Home: 30 kWh/day, Phone: 0.012 kWh',
    };
  }

  /**
   * Calculate Cost Savings
   *
   * Estimates cost savings from generated energy.
   *
   * @param energyKWh - Energy generated in kWh
   * @param periodDays - Number of days in period
   * @param electricityRate - Rate per kWh (optional, defaults to 0.12)
   * @returns Cost savings metrics
   *
   * Formula:
   * - Savings = Energy (kWh) × Rate ($/kWh)
   * - Daily Average = Total Savings / Days
   * - Monthly Projected = Daily Average × 30
   * - Yearly Projected = Daily Average × 365
   */
  calculateCostSavings(
    energyKWh: number,
    periodDays: number,
    electricityRate?: number,
  ): CostSavingsDto {
    const rate = electricityRate || this.DEFAULT_ELECTRICITY_RATE;

    const totalSavings = energyKWh * rate;
    const dailyAverageSavings = totalSavings / periodDays;
    const monthlyProjectedSavings = dailyAverageSavings * 30;
    const yearlyProjectedSavings = dailyAverageSavings * 365;

    return {
      energyGeneratedKWh: Math.round(energyKWh * 1000) / 1000,
      electricityRatePerKWh: rate,
      totalSavings: Math.round(totalSavings * 100) / 100,
      dailyAverageSavings: Math.round(dailyAverageSavings * 100) / 100,
      monthlyProjectedSavings: Math.round(monthlyProjectedSavings * 100) / 100,
      yearlyProjectedSavings: Math.round(yearlyProjectedSavings * 100) / 100,
      currency: 'USD',
      periodDays,
    };
  }

  /**
   * Analyze Trend
   *
   * Compares current and previous period values.
   *
   * @param currentValue - Current period value
   * @param previousValue - Previous period value
   * @param periodDescription - Description (e.g., "This week vs last week")
   * @returns Trend analysis
   *
   * Trend Direction:
   * - up: current > previous (by > 5%)
   * - down: current < previous (by > 5%)
   * - stable: within 5% range
   */
  analyzeTrend(
    currentValue: number,
    previousValue: number,
    periodDescription: string,
  ): TrendAnalysisDto {
    const change = currentValue - previousValue;
    const changePercent =
      previousValue > 0 ? (change / previousValue) * 100 : 0;

    let trend: 'up' | 'down' | 'stable';
    if (changePercent > 5) {
      trend = 'up';
    } else if (changePercent < -5) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    return {
      currentValue: Math.round(currentValue * 100) / 100,
      previousValue: Math.round(previousValue * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
      period: periodDescription,
    };
  }

  /**
   * Get Comprehensive Analytics
   *
   * Returns all analytics in one response.
   * Perfect for dashboard and bot.
   *
   * @returns Comprehensive analytics
   *
   * Includes:
   * - Today's summary
   * - This week's summary
   * - This month's summary
   * - Peak generation (this month)
   * - Environmental impact (this month)
   * - Cost savings (this month)
   * - Trend analysis (this week vs last week)
   */
  async getComprehensiveAnalytics(): Promise<ComprehensiveAnalyticsDto> {
    this.logger.debug('Generating comprehensive analytics');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Today
    const today = await this.getDailySummary(now);

    // This week
    const thisWeek = await this.getWeeklySummary();

    // This month
    const thisMonth = await this.getMonthlySummary(year, month);

    // Peak generation (this month)
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const peakGeneration = await this.getPeakGeneration(monthStart);

    // Environmental impact (this month)
    const environmentalImpact = this.calculateEnvironmentalImpact(
      thisMonth.totalEnergyKWh,
    );

    // Cost savings (this month)
    const costSavings = this.calculateCostSavings(
      thisMonth.totalEnergyKWh,
      thisMonth.daysWithData,
    );

    // Trend (this week vs last week)
    const lastWeekMonday = new Date(this.getMondayOfWeek(now));
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
    const lastWeek = await this.getWeeklySummary(lastWeekMonday);

    const trend = this.analyzeTrend(
      thisWeek.totalEnergyKWh,
      lastWeek.totalEnergyKWh,
      'This week vs last week',
    );

    return {
      today,
      thisWeek,
      thisMonth,
      peakGeneration,
      environmentalImpact,
      costSavings,
      trend,
      generatedAt: new Date(),
    };
  }

  /**
   * Helper: Get Monday of Week
   *
   * Returns Monday of the week for a given date.
   */
  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Helper: Get Week Number
   *
   * Returns ISO week number (1-53).
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(
      ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return weekNo;
  }

  // ============================================================================
  // PHASE 6: New Methods for Analytics & Insights Module
  // ============================================================================

  /**
   * Get Dashboard Analytics (Phase 6)
   *
   * Single endpoint for all dashboard summary data.
   * Minimizes API requests, provides comprehensive overview.
   *
   * @returns Dashboard analytics with today, yesterday, week, month, system health
   */
  async getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
    this.logger.debug('Fetching dashboard analytics');

    const now = new Date();
    const today = this.getDateString(now);
    const yesterday = this.getDateString(this.subtractDays(now, 1));

    // Fetch all metrics in parallel
    const [
      todayMetrics,
      yesterdayMetrics,
      weekMetrics,
      monthMetrics,
      systemHealth,
    ] = await Promise.all([
      this.getTodayMetrics(today),
      this.getTodayMetrics(yesterday),
      this.getWeekMetrics(),
      this.getMonthMetrics(),
      this.getSystemHealth(),
    ]);

    // Calculate yesterday comparison
    const yesterdayComparison = this.compareWithYesterday(
      todayMetrics.energyKWh,
      yesterdayMetrics.energyKWh,
    );

    return {
      today: todayMetrics,
      yesterday: yesterdayComparison,
      week: weekMetrics,
      month: monthMetrics,
      system: systemHealth,
      generatedAt: new Date(),
    };
  }

  // Phase 6 Private Helper Methods
  private async getTodayMetrics(date: string): Promise<TodayMetricsDto> {
    const energy = await this.energyService.getEnergyRange(date, date);
    return {
      energyKWh: energy.estimatedEnergyKWh,
      avgPowerW: energy.avgPower,
      peakPowerW: energy.maxPower,
      readingCount: energy.count,
    };
  }

  private compareWithYesterday(
    today: number,
    yesterday: number,
  ): YesterdayComparisonDto {
    const change = yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 5) trend = 'up';
    else if (change < -5) trend = 'down';
    return {
      energyKWh: yesterday,
      change: Math.round(change * 10) / 10,
      trend,
    };
  }

  private async getWeekMetrics(): Promise<WeekMetricsDto> {
    const now = new Date();
    const monday = this.getMondayOfWeek(now);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekStart = this.getDateString(monday);
    const weekEnd = this.getDateString(sunday);
    const energy = await this.energyService.getEnergyRange(weekStart, weekEnd);
    const daysActive = await this.countDaysWithData(weekStart, weekEnd);
    return {
      energyKWh: energy.estimatedEnergyKWh,
      avgPowerW: energy.avgPower,
      daysActive,
    };
  }

  private async getMonthMetrics(): Promise<MonthMetricsDto> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const monthStart = this.getDateString(firstDay);
    const monthEnd = this.getDateString(lastDay);
    const energy = await this.energyService.getEnergyRange(
      monthStart,
      monthEnd,
    );
    const currentDay = now.getDate();
    const daysInMonth = lastDay.getDate();
    const projectedKWh =
      currentDay > 0
        ? (energy.estimatedEnergyKWh / currentDay) * daysInMonth
        : 0;
    const costSavings = energy.estimatedEnergyKWh * 0.12;
    return {
      energyKWh: energy.estimatedEnergyKWh,
      projectedKWh: Math.round(projectedKWh * 100) / 100,
      costSavings: Math.round(costSavings * 100) / 100,
    };
  }

  private async getSystemHealth(): Promise<SystemHealthDto> {
    const activeSensors = await this.sensorModel.countDocuments({
      status: 'active' as any,
    });
    const totalReadings = await this.readingModel.countDocuments({
      source: 'hardware' as any,
    });
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReadings = await this.readingModel.countDocuments({
      timestamp: { $gte: oneDayAgo },
      source: 'hardware' as any,
    });
    const avgReportingInterval =
      recentReadings > 0 ? Math.round((1440 / recentReadings) * 10) / 10 : 0;
    const expectedReadings = activeSensors * 1440;
    const systemUptime =
      expectedReadings > 0
        ? Math.min((recentReadings / expectedReadings) * 100, 100)
        : 0;
    return {
      activeSensors,
      totalReadings,
      avgReportingInterval,
      systemUptime: Math.round(systemUptime * 10) / 10,
    };
  }

  private async countDaysWithData(
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const pipeline = [
      {
        $match: {
          timestamp: {
            $gte: new Date(startDate),
            $lte: this.getEndOfDay(new Date(endDate)),
          },
          source: 'hardware',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
        },
      },
      { $count: 'daysCount' },
    ] as any[];
    const result = await this.readingModel.aggregate(pipeline).exec();
    return result.length > 0 ? result[0].daysCount : 0;
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private subtractDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  private getEndOfDay(date: Date): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  // ============================================================================
  // Time Series Methods for Charts
  // ============================================================================

  /**
   * Get Time Series Data
   *
   * Fetches aggregated time-series data for charts with specified granularity.
   * Supports power, voltage, current, energy, and battery metrics.
   *
   * @param query - Analytics query parameters
   * @returns Time-series data with data points and summary
   */
  async getTimeSeries(query: AnalyticsQueryDto): Promise<TimeSeriesDto> {
    this.logger.debug(
      `Fetching time-series for metric: ${query.metric}, granularity: ${query.granularity}`,
    );

    const {
      metric = MetricType.POWER,
      granularity = Granularity.HOUR,
      startDate,
      endDate,
      sensorId,
      source = SourceFilter.HARDWARE,
    } = query;

    // Set default date range if not provided (last 24 hours)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 24 * 60 * 60 * 1000);

    // Build aggregation pipeline
    const matchStage: any = {
      timestamp: {
        $gte: start,
        $lte: this.getEndOfDay(end),
      },
    };

    // Filter by source
    if (source !== SourceFilter.ALL) {
      matchStage.source = source;
    }

    // Filter by sensor
    if (sensorId) {
      matchStage.sensorId = new Types.ObjectId(sensorId);
    }

    // Determine field to aggregate based on metric
    let fieldName: string;
    let unit: string;

    switch (metric) {
      case MetricType.VOLTAGE:
        fieldName = 'voltage';
        unit = 'V';
        break;
      case MetricType.CURRENT:
        fieldName = 'current';
        unit = 'A';
        break;
      case MetricType.BATTERY:
        fieldName = 'batteryPercentage';
        unit = '%';
        break;
      case MetricType.ENERGY:
        fieldName = 'power'; // We'll calculate energy from power
        unit = 'kWh';
        break;
      case MetricType.STEPS:
        fieldName = 'stepCount';
        unit = 'steps';
        break;
      case MetricType.CAPACITOR_VOLTAGE:
        fieldName = 'capacitorVoltage';
        unit = 'V';
        break;
      case MetricType.TEMPERATURE:
        fieldName = 'temperature';
        unit = '°C';
        break;
      case MetricType.FREQUENCY:
        fieldName = 'frequency';
        unit = 'Hz';
        break;
      case MetricType.POWER:
      default:
        fieldName = 'power';
        unit = 'W';
        break;
    }

    // Build group stage based on granularity
    const groupId = this.buildGroupId(granularity);

    // For steps, we want to sum instead of average
    const aggregationOperator = metric === MetricType.STEPS ? '$sum' : '$avg';

    const pipeline: any[] = [
      { $match: matchStage },
      { $sort: { timestamp: 1 } },
      {
        $group: {
          _id: groupId,
          value: { [aggregationOperator]: `$${fieldName}` },
          min: { $min: `$${fieldName}` },
          max: { $max: `$${fieldName}` },
          count: { $sum: 1 },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ];

    const results = await this.readingModel.aggregate(pipeline).exec();

    // Convert energy from W to kWh if needed
    const dataPoints: TimeSeriesDataPointDto[] = results.map((r) => {
      let value = r.value;
      let minValue = r.min;
      let maxValue = r.max;

      // For energy metric, convert from average power (W) to energy (kWh)
      if (metric === MetricType.ENERGY) {
        const hours = this.getHoursForGranularity(granularity);
        value = (value * hours) / 1000; // Convert W to kWh
        minValue = (minValue * hours) / 1000;
        maxValue = (maxValue * hours) / 1000;
      }

      return {
        timestamp: r.timestamp,
        value: Math.round(value * 100) / 100,
        label: this.formatTimeSeriesLabel(r._id, granularity),
        min: Math.round(minValue * 100) / 100,
        max: Math.round(maxValue * 100) / 100,
        count: r.count,
      };
    });

    // Calculate summary
    const values = dataPoints.map((dp) => dp.value);
    const summary: TimeSeriesSummaryDto = {
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
      avg:
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0,
      total:
        metric === MetricType.ENERGY || metric === MetricType.STEPS
          ? values.reduce((a, b) => a + b, 0)
          : undefined,
      dataPoints: dataPoints.length,
      totalReadings: results.reduce((sum, r) => sum + r.count, 0),
    };

    // Round summary values
    summary.min = Math.round(summary.min * 100) / 100;
    summary.max = Math.round(summary.max * 100) / 100;
    summary.avg = Math.round(summary.avg * 100) / 100;
    if (summary.total !== undefined) {
      summary.total = Math.round(summary.total * 100) / 100;
    }

    return {
      metric,
      unit,
      dataPoints,
      summary,
      startDate: start,
      endDate: end,
      granularity,
    };
  }

  /**
   * Get Battery History
   *
   * Fetches battery percentage over time.
   * This is a convenience wrapper around getTimeSeries for battery metric.
   *
   * @param query - Analytics query parameters
   * @returns Time-series data for battery
   */
  async getBatteryHistory(query: AnalyticsQueryDto): Promise<TimeSeriesDto> {
    this.logger.debug('Fetching battery history');

    // Force metric to battery
    const batteryQuery: AnalyticsQueryDto = {
      ...query,
      metric: MetricType.BATTERY,
    };

    return this.getTimeSeries(batteryQuery);
  }

  /**
   * Get Voltage History
   *
   * Fetches voltage measurements over time.
   * This is a convenience wrapper around getTimeSeries for voltage metric.
   *
   * @param query - Analytics query parameters
   * @returns Time-series data for voltage
   */
  async getVoltageHistory(query: AnalyticsQueryDto): Promise<TimeSeriesDto> {
    this.logger.debug('Fetching voltage history');

    const voltageQuery: AnalyticsQueryDto = {
      ...query,
      metric: MetricType.VOLTAGE,
    };

    return this.getTimeSeries(voltageQuery);
  }

  /**
   * Get Capacitor Voltage History
   *
   * Fetches capacitor voltage measurements over time.
   * This is a convenience wrapper around getTimeSeries for capacitor voltage metric.
   *
   * @param query - Analytics query parameters
   * @returns Time-series data for capacitor voltage
   */
  async getCapacitorHistory(query: AnalyticsQueryDto): Promise<TimeSeriesDto> {
    this.logger.debug('Fetching capacitor voltage history');

    const capacitorQuery: AnalyticsQueryDto = {
      ...query,
      metric: MetricType.CAPACITOR_VOLTAGE,
    };

    return this.getTimeSeries(capacitorQuery);
  }

  /**
   * Get Steps History
   *
   * Fetches step count over time.
   * This is a convenience wrapper around getTimeSeries for steps metric.
   * Note: Steps are summed, not averaged, per time period.
   *
   * @param query - Analytics query parameters
   * @returns Time-series data for steps
   */
  async getStepsHistory(query: AnalyticsQueryDto): Promise<TimeSeriesDto> {
    this.logger.debug('Fetching steps history');

    const stepsQuery: AnalyticsQueryDto = {
      ...query,
      metric: MetricType.STEPS,
    };

    return this.getTimeSeries(stepsQuery);
  }

  /**
   * Build Group ID for Aggregation
   *
   * Constructs the MongoDB group _id object based on granularity.
   */
  private buildGroupId(granularity: Granularity): any {
    const base = {
      year: { $year: '$timestamp' },
      month: { $month: '$timestamp' },
    };

    switch (granularity) {
      case Granularity.HOUR:
        return {
          ...base,
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' },
        };
      case Granularity.DAY:
        return {
          ...base,
          day: { $dayOfMonth: '$timestamp' },
        };
      case Granularity.WEEK:
        return {
          ...base,
          week: { $week: '$timestamp' },
        };
      case Granularity.MONTH:
        return base;
      default:
        return {
          ...base,
          day: { $dayOfMonth: '$timestamp' },
        };
    }
  }

  /**
   * Format Time Series Label
   *
   * Formats the display label based on granularity.
   */
  private formatTimeSeriesLabel(
    groupId: any,
    granularity: Granularity,
  ): string {
    const { year, month, day, hour, week } = groupId;

    switch (granularity) {
      case Granularity.HOUR:
        return `${String(hour).padStart(2, '0')}:00`;
      case Granularity.DAY:
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      case Granularity.WEEK:
        return `Week ${week}`;
      case Granularity.MONTH:
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        return monthNames[month - 1];
      default:
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  /**
   * Get Hours for Granularity
   *
   * Returns the number of hours represented by a granularity level.
   * Used for energy calculations.
   */
  private getHoursForGranularity(granularity: Granularity): number {
    switch (granularity) {
      case Granularity.HOUR:
        return 1;
      case Granularity.DAY:
        return 24;
      case Granularity.WEEK:
        return 168; // 7 * 24
      case Granularity.MONTH:
        return 730; // ~30.4 * 24
      default:
        return 1;
    }
  }

  // ============================================================================
  // Historical Analysis Methods
  // ============================================================================

  /**
   * Analyze Historical Data
   *
   * Calculates structured metrics for a given historical period.
   * Used for AI-powered historical insights.
   *
   * @param period - Historical period (last7days, last30days, last90days)
   * @param startDate - Optional custom start date (overrides period)
   * @param endDate - Optional custom end date (overrides period)
   * @returns Structured historical metrics for AI analysis
   */
  async analyzeHistoricalData(
    period: HistoricalPeriod,
    startDate?: string,
    endDate?: string,
  ): Promise<HistoricalMetricsDto> {
    this.logger.debug(
      `Analyzing historical data for period: ${period}, startDate: ${startDate}, endDate: ${endDate}`,
    );

    // Calculate date range
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      // Use custom date range
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Use predefined period
      end = new Date();
      switch (period) {
        case HistoricalPeriod.LAST_7_DAYS:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case HistoricalPeriod.LAST_30_DAYS:
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case HistoricalPeriod.LAST_90_DAYS:
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    const startDateStr = this.getDateString(start);
    const endDateStr = this.getDateString(end);

    // Calculate days analyzed
    const daysAnalyzed = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get energy data for the period
    const energyData = await this.energyService.getEnergyRange(
      startDateStr,
      endDateStr,
    );

    // Get peak power
    const peakGeneration = await this.getPeakGeneration(
      startDateStr,
      endDateStr,
    );

    // Calculate metrics
    const totalEnergyKWh = energyData.estimatedEnergyKWh;
    const avgDailyEnergyKWh =
      daysAnalyzed > 0 ? totalEnergyKWh / daysAnalyzed : 0;
    const peakPowerW = peakGeneration ? peakGeneration.peakPowerW : 0;
    const avgPowerW = energyData.avgPower;

    // Calculate environmental impact
    const environmentalImpact =
      this.calculateEnvironmentalImpact(totalEnergyKWh);

    // Calculate cost savings
    const costSavings = this.calculateCostSavings(totalEnergyKWh, daysAnalyzed);

    // Determine energy trend (compare first half vs second half)
    let energyTrend: 'up' | 'down' | 'stable' = 'stable';
    if (daysAnalyzed >= 4) {
      const midPoint = Math.floor(daysAnalyzed / 2);
      const midDate = new Date(
        start.getTime() + midPoint * 24 * 60 * 60 * 1000,
      );
      const midDateStr = this.getDateString(midDate);

      const firstHalfEnergy = await this.energyService.getEnergyRange(
        startDateStr,
        midDateStr,
      );
      const secondHalfEnergy = await this.energyService.getEnergyRange(
        midDateStr,
        endDateStr,
      );

      const firstHalfAvg = firstHalfEnergy.estimatedEnergyKWh / midPoint;
      const secondHalfAvg =
        secondHalfEnergy.estimatedEnergyKWh / (daysAnalyzed - midPoint);

      const changePercent =
        firstHalfAvg > 0
          ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
          : 0;

      if (changePercent > 10) {
        energyTrend = 'up';
      } else if (changePercent < -10) {
        energyTrend = 'down';
      }
    }

    return {
      totalEnergyKWh: Math.round(totalEnergyKWh * 1000) / 1000,
      avgDailyEnergyKWh: Math.round(avgDailyEnergyKWh * 1000) / 1000,
      peakPowerW: Math.round(peakPowerW * 100) / 100,
      avgPowerW: Math.round(avgPowerW * 100) / 100,
      energyTrend,
      co2AvoidedKg: environmentalImpact.co2AvoidedKg,
      costSavingsUSD: costSavings.totalSavings,
      daysAnalyzed,
      period,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }
}
