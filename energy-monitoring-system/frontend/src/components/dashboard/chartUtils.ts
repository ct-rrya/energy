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
  
  return timeSeries.dataPoints.map((point: TimeSeriesDataPoint) => ({
    timestamp: point.timestamp,
    value: point.value,
    label: point.label,
  }));
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
