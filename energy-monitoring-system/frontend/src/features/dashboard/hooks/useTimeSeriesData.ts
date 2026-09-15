import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/api/services';
import type { TimeSeries, MetricType, Granularity } from '@/features/analytics/types';

/**
 * useTimeSeriesData Hook Parameters
 */
export interface UseTimeSeriesDataParams {
  metric: MetricType;
  granularity: Granularity;
  startDate: string;
  endDate: string;
  sensorId?: string;
  enabled?: boolean;
}

/**
 * useTimeSeriesData Hook Return Type
 */
export interface UseTimeSeriesDataReturn {
  data: TimeSeries | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Generic hook for fetching time-series data from Analytics API
 * 
 * Provides consistent data fetching with caching, auto-refetch, and error handling
 * for all chart components.
 * 
 * @param params - Query parameters including metric type, date range, and granularity
 * @returns Time-series data with loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useTimeSeriesData({
 *   metric: 'power',
 *   granularity: 'hour',
 *   startDate: '2024-01-15T00:00:00Z',
 *   endDate: '2024-01-15T23:59:59Z',
 * });
 * ```
 */
export function useTimeSeriesData({
  metric,
  granularity,
  startDate,
  endDate,
  sensorId,
  enabled = true,
}: UseTimeSeriesDataParams): UseTimeSeriesDataReturn {
  const query = useQuery({
    queryKey: ['analytics', 'time-series', metric, granularity, startDate, endDate, sensorId],
    queryFn: async () => {
      const response = await analyticsService.getTimeSeries({
        metric,
        granularity,
        startDate,
        endDate,
        sensorId,
      });
      return response;
    },
    enabled,
    // Hourly data stale after 1 minute, daily/weekly/monthly after 5 minutes
    staleTime: granularity === 'hour' ? 60000 : 300000,
    // Auto-refetch hourly data every minute for near-real-time updates
    refetchInterval: granularity === 'hour' ? 60000 : false,
    // Retry failed requests up to 2 times with exponential backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
