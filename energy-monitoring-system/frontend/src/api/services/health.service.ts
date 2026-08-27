import apiClient from '../client';
import { HEALTH_ENDPOINTS } from '../constants';
import type { ApiResponse } from '@/types';

/**
 * Health Check Response Type
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    responseTime: number;
  };
}

/**
 * Health Service
 * Handles backend connectivity verification
 */
export const healthService = {
  /**
   * Check backend health
   */
  check: async (): Promise<ApiResponse<HealthCheckResponse>> => {
    const response = await apiClient.get<ApiResponse<HealthCheckResponse>>(
      HEALTH_ENDPOINTS.CHECK
    );
    return response.data;
  },
};
