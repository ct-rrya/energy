import apiClient from '../client';
import type { ApiResponse } from '@/types';
import type {
  SensorReading,
  PaginatedReadings,
  ReadingStatistics,
  ReadingQueryParams,
  StatisticsQueryParams,
} from '@/features/sensors/types/sensor.types';

/**
 * Sensor Service
 * 
 * Handles sensor reading-related API operations.
 */
export const sensorService = {
  /**
   * Get latest reading for a specific sensor
   * 
   * @param sensorId - Sensor ID
   * @returns Latest sensor reading
   */
  getLatestReading: async (sensorId: string): Promise<ApiResponse<SensorReading>> => {
    const response = await apiClient.get<ApiResponse<SensorReading>>(
      `/iot/readings/latest/${sensorId}`
    );
    return response.data;
  },

  /**
   * Get latest readings for all sensors
   * 
   * @returns Array of latest readings
   */
  getLatestReadings: async (): Promise<ApiResponse<SensorReading[]>> => {
    const response = await apiClient.get<ApiResponse<SensorReading[]>>(
      '/iot/readings/latest'
    );
    return response.data;
  },

  /**
   * Get reading history for a sensor with pagination
   * 
   * @param sensorId - Sensor ID
   * @param params - Query parameters (date range, pagination, source)
   * @returns Paginated readings
   */
  getReadingHistory: async (
    sensorId: string,
    params?: ReadingQueryParams
  ): Promise<ApiResponse<PaginatedReadings>> => {
    const response = await apiClient.get<ApiResponse<PaginatedReadings>>(
      `/iot/readings/history/${sensorId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get reading statistics for a sensor
   * 
   * @param sensorId - Sensor ID
   * @param params - Query parameters (date range, source)
   * @returns Aggregated statistics
   */
  getReadingStatistics: async (
    sensorId: string,
    params?: StatisticsQueryParams
  ): Promise<ApiResponse<ReadingStatistics>> => {
    const response = await apiClient.get<ApiResponse<ReadingStatistics>>(
      `/iot/readings/statistics/${sensorId}`,
      { params }
    );
    return response.data;
  },
};
