/**
 * Chart Utility Functions Tests
 * 
 * Unit tests for chart utility functions in chartUtils.ts
 */

import { describe, it, expect } from 'vitest';
import {
  transformToChartData,
  calculateCumulative,
  formatChartTimestamp,
  limitDataPoints,
  formatValueWithUnit,
  isDatasetEmpty,
  getTimeRangeLabel,
  calculateSummaryStats,
} from './chartUtils';
import type { TimeSeries } from '@/features/analytics/types/analytics.types';
import type { ChartDataPoint } from './chartTypes';

describe('transformToChartData', () => {
  it('should transform TimeSeries to ChartDataPoint array', () => {
    const timeSeries: TimeSeries = {
      metric: 'power',
      unit: 'W',
      dataPoints: [
        { timestamp: '2024-01-15T12:00:00Z', value: 100, label: '12 PM' },
        { timestamp: '2024-01-15T13:00:00Z', value: 150, label: '1 PM' },
      ],
      summary: { min: 100, max: 150, avg: 125, dataPoints: 2, totalReadings: 2 },
      startDate: '2024-01-15T12:00:00Z',
      endDate: '2024-01-15T13:00:00Z',
      granularity: 'hour',
    };

    const result = transformToChartData(timeSeries);

    expect(result).toEqual([
      { timestamp: '2024-01-15T12:00:00Z', value: 100, label: '12 PM' },
      { timestamp: '2024-01-15T13:00:00Z', value: 150, label: '1 PM' },
    ]);
  });

  it('should return empty array when timeSeries is undefined', () => {
    const result = transformToChartData(undefined);
    expect(result).toEqual([]);
  });

  it('should return empty array when dataPoints is undefined', () => {
    const timeSeries = {
      metric: 'power',
      unit: 'W',
      dataPoints: undefined,
    } as unknown as TimeSeries;

    const result = transformToChartData(timeSeries);
    expect(result).toEqual([]);
  });

  it('should handle empty dataPoints array', () => {
    const timeSeries: TimeSeries = {
      metric: 'power',
      unit: 'W',
      dataPoints: [],
      summary: { min: 0, max: 0, avg: 0, dataPoints: 0, totalReadings: 0 },
      startDate: '2024-01-15T12:00:00Z',
      endDate: '2024-01-15T13:00:00Z',
      granularity: 'hour',
    };

    const result = transformToChartData(timeSeries);
    expect(result).toEqual([]);
  });
});

describe('calculateCumulative', () => {
  it('should calculate cumulative values correctly', () => {
    const dataPoints: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 10 },
      { timestamp: '2024-01-16', value: 15 },
      { timestamp: '2024-01-17', value: 20 },
    ];

    const result = calculateCumulative(dataPoints);

    expect(result).toEqual([
      { timestamp: '2024-01-15', value: 10, cumulativeValue: 10 },
      { timestamp: '2024-01-16', value: 25, cumulativeValue: 25 },
      { timestamp: '2024-01-17', value: 45, cumulativeValue: 45 },
    ]);
  });

  it('should return empty array for empty input', () => {
    const result = calculateCumulative([]);
    expect(result).toEqual([]);
  });

  it('should handle single data point', () => {
    const dataPoints: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 100 },
    ];

    const result = calculateCumulative(dataPoints);

    expect(result).toEqual([
      { timestamp: '2024-01-15', value: 100, cumulativeValue: 100 },
    ]);
  });

  it('should handle zero values', () => {
    const dataPoints: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 0 },
      { timestamp: '2024-01-16', value: 10 },
      { timestamp: '2024-01-17', value: 0 },
    ];

    const result = calculateCumulative(dataPoints);

    expect(result).toEqual([
      { timestamp: '2024-01-15', value: 0, cumulativeValue: 0 },
      { timestamp: '2024-01-16', value: 10, cumulativeValue: 10 },
      { timestamp: '2024-01-17', value: 10, cumulativeValue: 10 },
    ]);
  });

  it('should preserve label property if present', () => {
    const dataPoints: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 10, label: 'Day 1' },
      { timestamp: '2024-01-16', value: 15, label: 'Day 2' },
    ];

    const result = calculateCumulative(dataPoints);

    expect(result[0].label).toBe('Day 1');
    expect(result[1].label).toBe('Day 2');
  });
});

describe('formatChartTimestamp', () => {
  it('should format hourly timestamps correctly', () => {
    const result = formatChartTimestamp('2024-01-15T14:00:00Z', 'hour');
    expect(result).toMatch(/\d{1,2}(AM|PM)/); // e.g., "2PM" or "14PM" depending on locale
  });

  it('should format daily timestamps correctly', () => {
    const result = formatChartTimestamp('2024-01-15T00:00:00Z', 'day');
    expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/); // e.g., "Jan 15"
  });

  it('should format weekly timestamps correctly', () => {
    const result = formatChartTimestamp('2024-01-15T00:00:00Z', 'week');
    expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/); // e.g., "Jan 15"
  });

  it('should format monthly timestamps correctly', () => {
    const result = formatChartTimestamp('2024-01-01T00:00:00Z', 'month');
    expect(result).toMatch(/[A-Z][a-z]{2} \d{4}/); // e.g., "Jan 2024"
  });

  it('should handle invalid timestamps gracefully', () => {
    const result = formatChartTimestamp('invalid-date', 'day');
    expect(result).toBe('invalid-date'); // Returns original on error
  });

  it('should use default format for unknown granularity', () => {
    const result = formatChartTimestamp('2024-01-15T00:00:00Z', 'unknown' as 'day');
    expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/); // Defaults to day format
  });
});

describe('limitDataPoints', () => {
  it('should limit data points to max when exceeding', () => {
    const data: ChartDataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: `2024-01-15T${String(i).padStart(2, '0')}:00:00Z`,
      value: i,
    }));

    const result = limitDataPoints(data, 100);

    expect(result.length).toBeLessThanOrEqual(100);
  });

  it('should return all points when below max', () => {
    const data: ChartDataPoint[] = Array.from({ length: 50 }, (_, i) => ({
      timestamp: `2024-01-15T${String(i).padStart(2, '0')}:00:00Z`,
      value: i,
    }));

    const result = limitDataPoints(data, 100);

    expect(result.length).toBe(50);
    expect(result).toEqual(data);
  });

  it('should take evenly spaced samples', () => {
    const data: ChartDataPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: `2024-01-15T${String(i).padStart(2, '0')}:00:00Z`,
      value: i,
    }));

    const result = limitDataPoints(data, 5);

    // Should take every 2nd point (indices 0, 2, 4, 6, 8)
    expect(result.length).toBe(5);
    expect(result[0].value).toBe(0);
    expect(result[1].value).toBe(2);
    expect(result[2].value).toBe(4);
  });

  it('should return empty array for empty input', () => {
    const result = limitDataPoints([], 100);
    expect(result).toEqual([]);
  });

  it('should use default max points of 100', () => {
    const data: ChartDataPoint[] = Array.from({ length: 200 }, (_, i) => ({
      timestamp: `timestamp-${i}`,
      value: i,
    }));

    const result = limitDataPoints(data);

    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe('formatValueWithUnit', () => {
  it('should format value with unit and default decimals', () => {
    const result = formatValueWithUnit(123.456, 'W');
    expect(result).toBe('123.46 W');
  });

  it('should format value with custom decimals', () => {
    const result = formatValueWithUnit(5.6789, 'kWh', 3);
    expect(result).toBe('5.679 kWh');
  });

  it('should handle zero decimals', () => {
    const result = formatValueWithUnit(123.456, 'W', 0);
    expect(result).toBe('123 W');
  });

  it('should handle NaN values', () => {
    const result = formatValueWithUnit(NaN, 'W');
    expect(result).toBe('0 W');
  });

  it('should handle negative values', () => {
    const result = formatValueWithUnit(-123.45, 'V');
    expect(result).toBe('-123.45 V');
  });
});

describe('isDatasetEmpty', () => {
  it('should return true for undefined', () => {
    expect(isDatasetEmpty(undefined)).toBe(true);
  });

  it('should return true for empty array', () => {
    expect(isDatasetEmpty([])).toBe(true);
  });

  it('should return false for array with data', () => {
    const data: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 100 },
    ];
    expect(isDatasetEmpty(data)).toBe(false);
  });
});

describe('getTimeRangeLabel', () => {
  it('should format same day correctly', () => {
    const result = getTimeRangeLabel('2024-01-15T12:00:00Z', '2024-01-15T12:00:00Z');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('should format same month correctly', () => {
    const result = getTimeRangeLabel('2024-01-15T00:00:00Z', '2024-01-20T00:00:00Z');
    expect(result).toMatch(/Jan 15 - 20, 2024/);
  });

  it('should format same year correctly', () => {
    const result = getTimeRangeLabel('2024-01-15T00:00:00Z', '2024-03-20T00:00:00Z');
    expect(result).toMatch(/Jan 15 - Mar 20, 2024/);
  });

  it('should format different years correctly', () => {
    const result = getTimeRangeLabel('2023-12-15T00:00:00Z', '2024-01-20T00:00:00Z');
    expect(result).toMatch(/Dec 15, 2023 - Jan 20, 2024/);
  });

  it('should handle invalid dates gracefully', () => {
    const result = getTimeRangeLabel('invalid-date', '2024-01-20T00:00:00Z');
    expect(result).toBe('');
  });
});

describe('calculateSummaryStats', () => {
  it('should calculate correct statistics', () => {
    const data: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 10 },
      { timestamp: '2024-01-16', value: 20 },
      { timestamp: '2024-01-17', value: 30 },
    ];

    const result = calculateSummaryStats(data);

    expect(result).toEqual({
      min: 10,
      max: 30,
      avg: 20,
      total: 60,
    });
  });

  it('should return zeros for empty array', () => {
    const result = calculateSummaryStats([]);

    expect(result).toEqual({
      min: 0,
      max: 0,
      avg: 0,
      total: 0,
    });
  });

  it('should handle single data point', () => {
    const data: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: 100 },
    ];

    const result = calculateSummaryStats(data);

    expect(result).toEqual({
      min: 100,
      max: 100,
      avg: 100,
      total: 100,
    });
  });

  it('should handle negative values', () => {
    const data: ChartDataPoint[] = [
      { timestamp: '2024-01-15', value: -10 },
      { timestamp: '2024-01-16', value: 20 },
      { timestamp: '2024-01-17', value: 30 },
    ];

    const result = calculateSummaryStats(data);

    expect(result.min).toBe(-10);
    expect(result.total).toBe(40);
  });
});
