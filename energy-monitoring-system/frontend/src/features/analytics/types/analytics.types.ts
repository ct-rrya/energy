/**
 * Analytics Types
 * 
 * TypeScript interfaces matching backend DTOs for analytics module.
 */

// ============================================================================
// Dashboard Analytics Types
// ============================================================================

export interface TodayMetrics {
  energyKWh: number;
  avgPowerW: number;
  peakPowerW: number;
  readingCount: number;
}

export interface YesterdayComparison {
  energyKWh: number;
  change: number; // Percentage
  trend: 'up' | 'down' | 'stable';
}

export interface WeekMetrics {
  energyKWh: number;
  avgPowerW: number;
  daysActive: number;
}

export interface MonthMetrics {
  energyKWh: number;
  projectedKWh: number;
  costSavings: number; // USD
}

export interface SystemHealth {
  activeSensors: number;
  totalReadings: number;
  avgReportingInterval: number; // minutes
  systemUptime: number; // percentage
}

export interface DashboardAnalytics {
  today: TodayMetrics;
  yesterday: YesterdayComparison;
  week: WeekMetrics;
  month: MonthMetrics;
  system: SystemHealth;
  generatedAt: string;
}

// ============================================================================
// Time Series Types
// ============================================================================

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label: string;
  min?: number;
  max?: number;
  count?: number;
}

export interface TimeSeriesSummary {
  min: number;
  max: number;
  avg: number;
  total?: number;
  dataPoints: number;
  totalReadings: number;
}

export interface TimeSeries {
  metric: string;
  unit: string;
  dataPoints: TimeSeriesDataPoint[];
  summary: TimeSeriesSummary;
  startDate: string;
  endDate: string;
  granularity: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export type MetricType = 
  | 'power' 
  | 'voltage' 
  | 'current' 
  | 'battery' 
  | 'energy' 
  | 'steps' 
  | 'temperature' 
  | 'frequency';
export type Granularity = 'hour' | 'day' | 'week' | 'month';
export type SourceFilter = 'all' | 'hardware' | 'mock';

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  sensorId?: string;
  source?: SourceFilter;
  granularity?: Granularity;
  metric?: MetricType;
}

// ============================================================================
// Date Range Types
// ============================================================================

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisWeek'
  | 'thisMonth'
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface ChartDataPoint {
  time: string;
  value: number;
  label?: string;
}

export interface ChartConfig {
  title: string;
  metric: MetricType;
  unit: string;
  color: string;
  height?: number;
}
