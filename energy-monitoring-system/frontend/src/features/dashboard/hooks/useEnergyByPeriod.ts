import { useMemo } from 'react';
import { subHours, subDays, subWeeks, startOfDay, endOfDay } from 'date-fns';
import { useTimeSeriesData } from './useTimeSeriesData';
import type { UseTimeSeriesDataReturn } from './useTimeSeriesData';

/**
 * Period Filter Options for Energy Period Chart
 */
export type PeriodFilter = 'hourly' | 'daily' | 'weekly';

/**
 * Specialized hook for EnergyPeriodChart with period filter logic
 * 
 * Automatically calculates appropriate date ranges and granularity based on
 * the selected period filter. Fetches energy metric data from the Analytics API.
 * 
 * @param periodFilter - Selected time period: 'hourly', 'daily', or 'weekly'
 * @returns Time-series data with loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('daily');
 * const { data, isLoading, error } = useEnergyByPeriod(periodFilter);
 * ```
 */
export function useEnergyByPeriod(periodFilter: PeriodFilter): UseTimeSeriesDataReturn {
  const { startDate, endDate, granularity } = useMemo(() => {
    const now = new Date();

    switch (periodFilter) {
      case 'hourly':
        return {
          startDate: subHours(now, 24).toISOString(),
          endDate: now.toISOString(),
          granularity: 'hour' as const,
        };
      case 'daily':
        return {
          startDate: subDays(startOfDay(now), 30).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: 'day' as const,
        };
      case 'weekly':
        return {
          startDate: subWeeks(startOfDay(now), 12).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: 'week' as const,
        };
    }
  }, [periodFilter]);

  return useTimeSeriesData({
    metric: 'energy',
    granularity,
    startDate,
    endDate,
  });
}
