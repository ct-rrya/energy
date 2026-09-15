import { useMemo } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useTimeSeriesData } from './useTimeSeriesData';
import type { UseTimeSeriesDataReturn } from './useTimeSeriesData';

/**
 * Time Filter Options for Power Generation Chart
 */
export type TimeFilter = 'today' | '7days' | '30days';

/**
 * Specialized hook for PowerGenerationChart with time filter logic
 * 
 * Automatically calculates appropriate date ranges and granularity based on
 * the selected time filter. Fetches power metric data from the Analytics API.
 * 
 * @param timeFilter - Selected time range: 'today', '7days', or '30days'
 * @returns Time-series data with loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
 * const { data, isLoading, error } = usePowerGeneration(timeFilter);
 * ```
 */
export function usePowerGeneration(timeFilter: TimeFilter): UseTimeSeriesDataReturn {
  const { startDate, endDate, granularity } = useMemo(() => {
    const now = new Date();

    switch (timeFilter) {
      case 'today':
        return {
          startDate: startOfDay(now).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: 'hour' as const,
        };
      case '7days':
        return {
          startDate: subDays(startOfDay(now), 7).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: 'day' as const,
        };
      case '30days':
        return {
          startDate: subDays(startOfDay(now), 30).toISOString(),
          endDate: endOfDay(now).toISOString(),
          granularity: 'day' as const,
        };
    }
  }, [timeFilter]);

  return useTimeSeriesData({
    metric: 'power',
    granularity,
    startDate,
    endDate,
  });
}
