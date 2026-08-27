import { useQuery } from '@tanstack/react-query';
import { sensorService } from '@/api/services';
import type { ReadingStatistics, StatisticsQueryParams } from '../types/sensor.types';

/**
 * Custom hook to fetch reading statistics for a sensor
 * 
 * Uses TanStack Query for caching.
 * Supports date range and source filtering.
 * 
 * @param sensorId - Sensor ID
 * @param params - Query parameters (date range, source)
 * @param enabled - Whether to enable the query
 * @returns Query result with statistics
 */
export function useSensorStatistics(
  sensorId: string | undefined,
  params?: StatisticsQueryParams,
  enabled: boolean = true
) {
  return useQuery<ReadingStatistics>({
    queryKey: ['sensor', 'statistics', sensorId, params],
    queryFn: async () => {
      if (!sensorId) throw new Error('Sensor ID is required');
      const response = await sensorService.getReadingStatistics(sensorId, params);
      return response.data;
    },
    enabled: enabled && !!sensorId,
    staleTime: 60000, // Data is fresh for 60 seconds
    retry: 1,
  });
}
