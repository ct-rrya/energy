import { useQuery } from '@tanstack/react-query';
import { sensorService } from '@/api/services';
import type { SensorReading } from '../types/sensor.types';

/**
 * Custom hook to fetch latest reading for a specific sensor
 * 
 * Uses TanStack Query for caching and auto-refetch.
 * 
 * @param sensorId - Sensor ID
 * @param options - Query options
 * @returns Query result with latest reading
 */
export function useSensorReading(sensorId: string | undefined, enabled: boolean = true) {
  return useQuery<SensorReading>({
    queryKey: ['sensor', 'reading', sensorId],
    queryFn: async () => {
      if (!sensorId) throw new Error('Sensor ID is required');
      const response = await sensorService.getLatestReading(sensorId);
      return response.data;
    },
    enabled: enabled && !!sensorId,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Data is fresh for 5 seconds
    retry: 2,
  });
}

/**
 * Custom hook to fetch latest readings for all sensors
 * 
 * Uses TanStack Query for caching and auto-refetch.
 * 
 * @returns Query result with array of latest readings
 */
export function useSensorReadings() {
  return useQuery<SensorReading[]>({
    queryKey: ['sensors', 'readings', 'latest'],
    queryFn: async () => {
      const response = await sensorService.getLatestReadings();
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Data is fresh for 5 seconds
    retry: 2,
  });
}
