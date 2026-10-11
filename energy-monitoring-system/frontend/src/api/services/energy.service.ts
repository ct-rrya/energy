import apiClient from '../client';
import type { ApiResponse } from '@/types';

/**
 * Energy Reading Response
 * Matches backend EnergyReadingResponseDto
 */
export interface EnergyReading {
  id: string;
  sensorId: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  timestamp: string;
  receivedAt: string;
  stepCount?: number;
  capacitorVoltage?: number;
  frequency?: number;
}

/**
 * Energy Service
 * Handles energy reading API operations
 */
export const energyService = {
  /**
   * Get recent energy readings
   * @param limit - Number of readings to fetch (default: 1)
   */
  getRecentReadings: async (limit = 1): Promise<ApiResponse<EnergyReading[]>> => {
    const response = await apiClient.get<ApiResponse<EnergyReading[]>>(
      `/energy/recent?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get the latest energy reading
   * Convenience method that returns a single reading or null
   */
  getLatestReading: async (): Promise<EnergyReading | null> => {
    try {
      const response = await energyService.getRecentReadings(1);
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Failed to fetch latest reading:', error);
      return null;
    }
  },
};
