/**
 * Analytics Types
 * 
 * Type definitions for analytics data and time-series.
 * These match the backend analytics DTOs.
 */

/**
 * Base Energy Summary
 * Common fields for all energy summaries
 */
export interface BaseEnergySummary {
  totalEnergyKWh: number;
  totalPowerW: number;
  avgPowerW: number;
  peakPowerW: number;
  minPowerW: number;
  readingCount: number;
}

/**
 * Daily Energy Summary
 * Matches: DailyEnergySummaryDto
 */
export interface DailyEnergySummary extends BaseEnergySummary {
  date: string;         // YYYY-MM-DD
  dayOfWeek: string;
  isToday: boolean;
}

/**
 * Weekly Energy Summary
 * Matches: WeeklyEnergySummaryDto
 */
export interface WeeklyEnergySummary extends BaseEnergySummary {
  weekStart: string;    // YYYY-MM-DD (Monday)
  weekEnd: string;      // YYYY-MM-DD (Sunday)
  weekNumber: number;   // 1-53
  isCurrentWeek: boolean;
  dailyBreakdown: DailyEnergySummary[];
}

/**
 * Monthly Energy Summary
 * Matches: MonthlyEnergySummaryDto
 */
export interface MonthlyEnergySummary extends BaseEnergySummary {
  month: number;        // 1-12
  monthName: string;
  year: number;
  isCurrentMonth: boolean;
  daysInMonth: number;
  daysWithData: number;
}

/**
 * Peak Generation
 * Matches: PeakGenerationDto
 */
export interface PeakGeneration {
  peakPowerW: number;
  timestamp: string;    // ISO 8601
  sensorId: string;
  sensorName: string;
  sensorLocation: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM
}

/**
 * Environmental Impact
 * Matches: EnvironmentalImpactDto
 */
export interface EnvironmentalImpact {
  energyGeneratedKWh: number;
  co2AvoidedKg: number;
  treesEquivalent: number;
  coalNotBurnedKg: number;
  homesPoweredDays: number;
  phoneChargesEquivalent: number;
  calculationNotes: string;
}

/**
 * Cost Savings
 * Matches: CostSavingsDto
 */
export interface CostSavings {
  energyGeneratedKWh: number;
  electricityRatePerKWh: number;
  totalSavings: number;
  dailyAverageSavings: number;
  monthlyProjectedSavings: number;
  yearlyProjectedSavings: number;
  currency: string;
  periodDays: number;
}

/**
 * Trend Analysis
 * Matches: TrendAnalysisDto
 */
export interface TrendAnalysis {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

/**
 * Comprehensive Analytics
 * All analytics in one response
 * Matches: ComprehensiveAnalyticsDto
 * Used by: GET /api/analytics/comprehensive
 */
export interface ComprehensiveAnalytics {
  today: DailyEnergySummary;
  thisWeek: WeeklyEnergySummary;
  thisMonth: MonthlyEnergySummary;
  peakGeneration: PeakGeneration | null;
  environmentalImpact: EnvironmentalImpact;
  costSavings: CostSavings;
  trend: TrendAnalysis;
  generatedAt: string; // ISO 8601
}

/**
 * Time Series Data Point
 * Matches: TimeSeriesDataPointDto
 */
export interface TimeSeriesDataPoint {
  timestamp: string;    // ISO 8601
  value: number;
  label: string;        // Display label (e.g., "14:00", "Mon", "July")
  min?: number;         // Optional for range charts
  max?: number;         // Optional for range charts
  count?: number;       // Number of readings aggregated
}

/**
 * Time Series Summary
 * Matches: TimeSeriesSummaryDto
 */
export interface TimeSeriesSummary {
  min: number;
  max: number;
  avg: number;
  total?: number;       // For cumulative metrics
  dataPoints: number;   // Number of data points
  totalReadings: number;// Total readings aggregated
}

/**
 * Time Series Data
 * Complete time-series with metadata
 * Matches: TimeSeriesDto
 */
export interface TimeSeriesData {
  metric: 'power' | 'voltage' | 'current' | 'battery' | 'energy' | 'steps';
  unit: string;         // e.g., "W", "V", "A", "%", "kWh", "steps"
  dataPoints: TimeSeriesDataPoint[];
  summary: TimeSeriesSummary;
  startDate: string;    // ISO 8601
  endDate: string;      // ISO 8601
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Analytics Query Parameters
 * Matches: AnalyticsQueryDto
 */
export interface AnalyticsQuery {
  startDate?: string;   // YYYY-MM-DD or ISO 8601
  endDate?: string;     // YYYY-MM-DD or ISO 8601
  sensorId?: string;
  source?: 'all' | 'hardware' | 'mock';
  granularity?: 'hour' | 'day' | 'week' | 'month';
  metric?: 'power' | 'voltage' | 'current' | 'battery' | 'energy' | 'steps';
}

/**
 * Historical Analysis Request
 * Matches: HistoricalAnalysisRequestDto
 */
export interface HistoricalAnalysisRequest {
  period: 7 | 30 | 90;  // Days to analyze
  startDate?: string;   // Optional custom start (YYYY-MM-DD)
  endDate?: string;     // Optional custom end (YYYY-MM-DD)
}

/**
 * Historical Analysis Response
 * Matches: HistoricalAnalysisResponseDto
 */
export interface HistoricalAnalysisResponse {
  insights: string;     // AI-generated insights
  metrics: {
    period: string;
    startDate: string;
    endDate: string;
    daysAnalyzed: number;
    totalEnergyKWh: number;
    avgDailyEnergyKWh: number;
    peakPowerW: number;
    avgPowerW: number;
    energyTrend: 'increasing' | 'decreasing' | 'stable';
    co2AvoidedKg: number;
    costSavingsUSD: number;
  };
  generatedAt: string;  // ISO 8601
}
