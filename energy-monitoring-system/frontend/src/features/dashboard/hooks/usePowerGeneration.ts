import { useMemo } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useTimeSeriesData } from './useTimeSeriesData';
import type { UseTimeSeriesDataReturn } from './useTimeSeriesData';
import type { Granularity } from '@/features/analytics/types';

/**
 * Time Filter Options for Power Generation Chart
 */
export type TimeFilter = 'today' | '7days' | '30days';

export interface PowerRangeOverride {
  startDate?: string;
  endDate?: string;
  granularity?: Granularity;
}

/**
 * Specialized hook for PowerGenerationChart with time filter logic
 * 
 * Automatically calculates appropriate date ranges and granularity based on
 * the selected time filter, or uses the unified page period override when provided.
 * Fetches power metric data from the Analytics API.
 * 
 * @param timeFilter - Selected time range: 'today', '7days', or '30days'
 * @param customRange - Optional start/end/granularity override from page-level period filter
 * @returns Time-series data with loading state, error state, and refetch function
 */
export function usePowerGeneration(
  timeFilter: TimeFilter,
  customRange?: PowerRangeOverride
): UseTimeSeriesDataReturn {
  const customStartDate = customRange?.startDate;
  const customEndDate = customRange?.endDate;
  const customGranularity = customRange?.granularity;

  const { startDate, endDate, granularity } = useMemo(() => {
    if (customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        granularity: customGranularity ?? ('day' as const),
      };
    }

    const now = new Date();

    switch (timeFilter) {
      case 'today':
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: customGranularity ?? ('hour' as const),
        };
      case '7days':
        return {
          startDate: subDays(startOfDay(now), 7).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: customGranularity ?? ('day' as const),
        };
      case '30days':
        return {
          startDate: subDays(startOfDay(now), 30).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: customGranularity ?? ('day' as const),
        };
    }
  }, [timeFilter, customStartDate, customEndDate, customGranularity]);

  return useTimeSeriesData({
    metric: 'power',
    granularity,
    startDate,
    endDate,
  });
}
