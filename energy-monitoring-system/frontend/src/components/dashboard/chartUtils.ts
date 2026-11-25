/**
 * Chart Utility Functions
 * 
 * Helper functions for transforming, formatting, and processing data
 * for chart components in the EcoStep Dashboard.
 */

import { format } from 'date-fns';
import type { TimeSeries, TimeSeriesDataPoint, Granularity } from '@/features/analytics/types/analytics.types';
import type { ChartDataPoint } from './chartTypes';

/**
 * Transform TimeSeries API response to ChartDataPoint array
 * 
 * Converts the backend TimeSeries format to a simplified ChartDataPoint
 * format compatible with Recharts consumption.
 * 
 * @param timeSeries - TimeSeries response from Analytics API
 * @returns Array of ChartDataPoint objects, or empty array if input is undefined
 * 
 * @example
 * ```typescript
 * const chartData = transformToChartData(timeSeriesResponse);
 * // [{ timestamp: '2024-01-15T12:00:00Z', value: 125.5, label: '12 PM' }, ...]
 * ```
 */
export function transformToChartData(
  timeSeries: TimeSeries | undefined
): ChartDataPoint[] {
  if (!timeSeries?.dataPoints || !Array.isArray(timeSeries.dataPoints)) {
    return [];
  }
  
  return timeSeries.dataPoints
    .map((point: TimeSeriesDataPoint) => ({
      timestamp: point.timestamp,
      value: point.value,
      label: point.label,
    }))
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      if (isNaN(timeA) || isNaN(timeB)) return 0;
      return timeA - timeB;
    });
}

/**
 * Calculate cumulative values from data points
 * 
 * Transforms an array of data points into cumulative values by summing
 * each point with all previous points. Used for cumulative energy charts.
 * 
 * @param dataPoints - Array of ChartDataPoint objects
 * @returns Array of ChartDataPoint objects with cumulative values
 * 
 * @example
 * ```typescript
 * const data = [
 *   { timestamp: '2024-01-15', value: 10 },
 *   { timestamp: '2024-01-16', value: 15 },
 *   { timestamp: '2024-01-17', value: 20 }
 * ];
 * const cumulative = calculateCumulative(data);
 * // [
 * //   { timestamp: '2024-01-15', value: 10 },
 * //   { timestamp: '2024-01-16', value: 25 },
 * //   { timestamp: '2024-01-17', value: 45 }
 * // ]
 * ```
 */
export function calculateCumulative(
  dataPoints: ChartDataPoint[]
): ChartDataPoint[] {
  if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
    return [];
  }
  
  let cumulative = 0;
  
  return dataPoints.map((point) => {
    cumulative += point.value;
    return {
      ...point,
      value: cumulative,
      cumulativeValue: cumulative,
    };
  });
}

/**
 * Format timestamp for chart axis labels based on granularity
 * 
 * Formats ISO 8601 timestamps into human-readable labels appropriate
 * for the chart's time granularity.
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @param granularity - Time granularity ('hour', 'day', 'week', 'month')
 * @returns Formatted timestamp string
 * 
 * @example
 * ```typescript
 * formatChartTimestamp('2024-01-15T14:00:00Z', 'hour');  // "2 PM"
 * formatChartTimestamp('2024-01-15T00:00:00Z', 'day');   // "Jan 15"
 * formatChartTimestamp('2024-01-15T00:00:00Z', 'week');  // "Jan 15"
 * formatChartTimestamp('2024-01-01T00:00:00Z', 'month'); // "Jan 2024"
 * ```
 */
export function formatChartTimestamp(
  timestamp: string,
  granularity: Granularity
): string {
  try {
    const date = new Date(timestamp);
    
    // Validate date
    if (isNaN(date.getTime())) {
      return timestamp; // Return original if invalid
    }
    
    switch (granularity) {
      case 'hour':
        return format(date, 'ha'); // "2PM"
      case 'day':
        return format(date, 'MMM d'); // "Jan 15"
      case 'week':
        return format(date, 'MMM d'); // "Jan 15" (start of week)
      case 'month':
        return format(date, 'MMM yyyy'); // "Jan 2024"
      default:
        return format(date, 'MMM d'); // Default to day format
    }
  } catch (error) {
    // If date formatting fails, return original timestamp
    console.warn('Failed to format timestamp:', timestamp, error);
    return timestamp;
  }
}

/**
 * Checks whether two or more data points collapse to the same formatted tick label
 * (e.g. two day points both displaying "Nov 19", or hourly points spanning multiple days).
 */
export function hasDuplicateFormattedDates(
  data: ChartDataPoint[],
  granularity: Granularity
): boolean {
  if (!Array.isArray(data) || data.length < 2) return false;

  if (granularity === 'hour') {
    const dates = new Set<string>();
    for (const pt of data) {
      const d = new Date(pt.timestamp);
      if (!isNaN(d.getTime())) {
        dates.add(format(d, 'yyyy-MM-dd'));
        if (dates.size > 1) return true;
      }
    }
    return false;
  }

  if (granularity !== 'day' && granularity !== 'week') return false;

  const seen = new Set<string>();
  for (const pt of data) {
    const lbl = formatChartTimestamp(pt.timestamp, granularity);
    if (seen.has(lbl)) return true;
    seen.add(lbl);
  }
  return false;
}

/**
 * Smart X-axis tick formatter:
 * - For hourly granularity spanning multiple days: returns "Nov 25, 2PM"
 * - For day/week granularity with duplicate day labels: returns "Nov 19, 12:24 AM"
 */
export function formatSmartChartTimestamp(
  timestamp: string,
  granularity: Granularity,
  includeTimeOnSameDay: boolean
): string {
  if (includeTimeOnSameDay) {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        if (granularity === 'hour') {
          return format(date, 'MMM d, ha');
        }
        if (granularity === 'day' || granularity === 'week') {
          return format(date, 'MMM d, h:mm a');
        }
      }
    } catch {
      // fall through
    }
  }
  return formatChartTimestamp(timestamp, granularity);
}

/**
 * Computes clean, human-friendly Y-axis domain and evenly spaced tick values
 * using 1 / 2 / 5 × 10^n intervals (e.g. 0, 10, 20, 30 or 0, 0.2, 0.4, 0.6).
 */
export function computeNiceYAxis(
  dataMax: number,
  options: {
    minMax?: number;
    integerOnly?: boolean;
    targetSteps?: number;
    multiplier?: number;
  } = {}
): {
  domain: [number, number];
  ticks: number[];
  decimals: number;
} {
  const {
    minMax = 1,
    integerOnly = false,
    targetSteps = 4,
    multiplier = 1,
  } = options;

  const scaledMax = Number.isFinite(dataMax) && dataMax > 0 ? dataMax * multiplier : minMax;
  const effectiveMax = Math.max(scaledMax, minMax > 0 ? minMax * 0.001 : 0.0001);
  const rawStep = effectiveMax / Math.max(1, targetSteps);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceMult = 10;
  if (normalized <= 1) niceMult = 1;
  else if (normalized <= 2) niceMult = 2;
  else if (normalized <= 5) niceMult = 5;

  let niceDisplayStep = niceMult * magnitude;
  if (integerOnly) {
    niceDisplayStep = Math.max(1, Math.ceil(niceDisplayStep));
  }

  const numIntervals = Math.max(2, Math.ceil((effectiveMax * 1.05) / niceDisplayStep));
  const decimals = integerOnly
    ? 0
    : Math.max(0, Math.min(4, -Math.floor(Math.log10(niceDisplayStep) + 1e-10)));

  const roundDisplay = (v: number) => Number(v.toFixed(decimals));
  const displayTicks: number[] = [];
  for (let i = 0; i <= numIntervals; i++) {
    displayTicks.push(roundDisplay(i * niceDisplayStep));
  }

  const niceDisplayMax = displayTicks[displayTicks.length - 1];
  const ticks = displayTicks.map((t) => t / multiplier);

  return {
    domain: [0, niceDisplayMax / multiplier],
    ticks,
    decimals,
  };
}

/**
 * Formats micro-scale energy values with adaptive precision so headers match plotted curves
 * (e.g. 0.0632 mWh -> "0.063 mWh", 45 -> "45.00 mWh").
 */
export function formatAdaptiveEnergy(value: number, unit: string): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return `0.00 ${unit}`;
  }
  if (value === 0) return `0.00 ${unit}`;
  if (Math.abs(value) < 0.001) return `${value.toFixed(4)} ${unit}`;
  if (Math.abs(value) < 1) return `${value.toFixed(3)} ${unit}`;
  return `${value.toFixed(2)} ${unit}`;
}

/**
 * Limit data points for performance optimization
 * 
 * Reduces the number of data points by taking evenly spaced samples
 * to prevent performance degradation with large datasets.
 * 
 * @param data - Array of ChartDataPoint objects
 * @param maxPoints - Maximum number of points to return (default: 100)
 * @returns Array of ChartDataPoint objects limited to maxPoints
 * 
 * @example
 * ```typescript
 * const largeDataset = [...]; // 1000 points
 * const optimized = limitDataPoints(largeDataset, 100);
 * // Returns 100 evenly spaced points from the original 1000
 * ```
 */
export function limitDataPoints(
  data: ChartDataPoint[],
  maxPoints: number = 100
): ChartDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  if (data.length <= maxPoints) {
    return data;
  }
  
  // Calculate step size for evenly spaced sampling
  const step = Math.ceil(data.length / maxPoints);
  
  // Take evenly spaced points
  return data.filter((_, index) => index % step === 0);
}

/**
 * Format value with appropriate unit for tooltips
 * 
 * Formats numeric values with proper decimal places and unit labels
 * for display in chart tooltips.
 * 
 * @param value - Numeric value to format
 * @param unit - Unit string (e.g., 'W', 'V', 'A', 'kWh')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted value string with unit
 * 
 * @example
 * ```typescript
 * formatValueWithUnit(123.456, 'W');      // "123.46 W"
 * formatValueWithUnit(5.6789, 'kWh', 3);  // "5.679 kWh"
 * ```
 */
export function formatValueWithUnit(
  value: number,
  unit: string,
  decimals: number = 2
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return `0 ${unit}`;
  }
  
  return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Check if dataset is empty
 * 
 * Determines if a dataset is empty or contains no valid data points.
 * 
 * @param data - Array of ChartDataPoint objects or undefined
 * @returns true if data is empty, false otherwise
 */
export function isDatasetEmpty(
  data: ChartDataPoint[] | undefined
): boolean {
  return !data || !Array.isArray(data) || data.length === 0;
}

/**
 * Get time range label for chart titles
 * 
 * Generates human-readable time range labels for chart titles.
 * 
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @returns Formatted time range string
 * 
 * @example
 * ```typescript
 * getTimeRangeLabel('2024-01-01', '2024-01-31');
 * // "Jan 1 - Jan 31, 2024"
 * ```
 */
export function getTimeRangeLabel(
  startDate: string,
  endDate: string
): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '';
    }
    
    // Same day
    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
      return format(start, 'MMM d, yyyy');
    }
    
    // Same month
    if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }
    
    // Same year
    if (start.getFullYear() === end.getFullYear()) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    
    // Different years
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  } catch (error) {
    console.warn('Failed to format time range:', error);
    return '';
  }
}

/**
 * Calculate summary statistics for a dataset
 * 
 * Computes min, max, average, and total values from a dataset.
 * 
 * @param data - Array of ChartDataPoint objects
 * @returns Object with min, max, avg, and total properties
 * 
 * @example
 * ```typescript
 * const stats = calculateSummaryStats(chartData);
 * // { min: 10.5, max: 250.3, avg: 125.7, total: 1257.0 }
 * ```
 */
export function calculateSummaryStats(data: ChartDataPoint[]): {
  min: number;
  max: number;
  avg: number;
  total: number;
} {
  if (!Array.isArray(data) || data.length === 0) {
    return { min: 0, max: 0, avg: 0, total: 0 };
  }
  
  const values = data.map((point) => point.value);
  const total = values.reduce((sum, val) => sum + val, 0);
  
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: total / values.length,
    total,
  };
}

/**
 * Checks if a telemetry record has meaningful activity.
 * Excluded from normal historical presentation ONLY when all 5 measurements are zero:
 * - Voltage
 * - Current
 * - Power
 * - Energy
 * - Step count
 *
 * A record remains visible if at least one of these measurements indicates meaningful activity (> 0).
 * Strictly distinguishes between 0, valid positive numbers, null, undefined, and NaN.
 */
export function hasMeaningfulActivity(record: {
  voltage?: number | null;
  current?: number | null;
  power?: number | null;
  energy?: number | null;
  steps?: number | null;
  stepCount?: number | null;
}): boolean {
  if (!record) return false;

  const isPositive = (val: unknown): boolean =>
    typeof val === 'number' && !isNaN(val) && val > 0;

  return (
    isPositive(record.voltage) ||
    isPositive(record.current) ||
    isPositive(record.power) ||
    isPositive(record.energy) ||
    isPositive(record.steps ?? record.stepCount)
  );
}
