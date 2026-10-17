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
  batteryPercentage?: number;
}

/**
 * Paginated Energy Readings Response
 */
export interface PaginatedReadingsResponse {
  data: EnergyReading[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

  /**
   * Get raw energy readings for date range with pagination
   * Returns individual MongoDB documents without aggregation
   * 
   * @param startDate - Start date (YYYY-MM-DD or ISO format)
   * @param endDate - End date (YYYY-MM-DD or ISO format)
   * @param page - Page number (1-indexed)
   * @param limit - Records per page
   */
  getRawReadings: async (
    startDate: string,
    endDate: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedReadingsResponse> => {
    // Backend requires YYYY-MM-DD format, extract date portion if ISO string
    const formatDate = (dateStr: string) => {
      return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // Fetch more data to support pagination
    const response = await apiClient.get<ApiResponse<EnergyReading[]>>(
      `/energy/readings?startDate=${formattedStartDate}&endDate=${formattedEndDate}&limit=${limit * 10}`
    );
    
    // Extract array from response (handle both wrapped and unwrapped responses)
    const allData = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
    
    // Client-side pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = allData.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      total: allData.length,
      page,
      limit,
      totalPages: Math.ceil(allData.length / limit),
    };
  },
};

