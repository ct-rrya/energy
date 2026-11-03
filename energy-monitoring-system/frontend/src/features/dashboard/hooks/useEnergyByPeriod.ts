import { useMemo } from 'react';
import { subHours, subDays, subWeeks, startOfDay, endOfDay } from 'date-fns';
import { useTimeSeriesData } from './useTimeSeriesData';
import type { UseTimeSeriesDataReturn } from './useTimeSeriesData';
import type { Granularity } from '@/features/analytics/types';

/**
 * Period Filter Options for Energy Period Chart
 */
export type PeriodFilter = 'hourly' | 'daily' | 'weekly';

export interface EnergyRangeOverride {
  startDate?: string;
  endDate?: string;
  granularity?: Granularity;
}

/**
 * Specialized hook for EnergyPeriodChart with period filter logic
 * 
 * Automatically calculates appropriate date ranges and granularity based on
 * the selected period filter, or uses the unified page period override when provided.
 * Fetches energy metric data from the Analytics API.
 * 
 * @param periodFilter - Selected time period: 'hourly', 'daily', or 'weekly'
 * @param customRange - Optional start/end/granularity override from page-level period filter
 * @returns Time-series data with loading state, error state, and refetch function
 */
export function useEnergyByPeriod(
  periodFilter: PeriodFilter,
  customRange?: EnergyRangeOverride
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

    switch (periodFilter) {
      case 'hourly':
        return {
          startDate: subHours(now, 24).toISOString(),
          endDate: now.toISOString(),
          granularity: customGranularity ?? ('hour' as const),
        };
      case 'daily':
        return {
          startDate: subDays(startOfDay(now), 30).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: customGranularity ?? ('day' as const),
        };
      case 'weekly':
        return {
          startDate: subWeeks(startOfDay(now), 12).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: customGranularity ?? ('week' as const),
        };
    }
  }, [periodFilter, customStartDate, customEndDate, customGranularity]);

  return useTimeSeriesData({
    metric: 'energy',
    granularity,
    startDate,
    endDate,
  });
}
