import apiClient from '../client';
import type { ApiResponse } from '@/types';
import type { DashboardMetrics } from '@/features/dashboard/types/dashboard.types';

/**
 * Dashboard Service
 * Handles dashboard-related API operations
 */
export const dashboardService = {
  /**
   * Get dashboard metrics
   */
  getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>(
      '/dashboard/metrics'
    );
    return response.data;
  },

  /**
   * Get dashboard alerts (if available)
   */
  getAlerts: async (): Promise<ApiResponse<unknown[]>> => {
    const response = await apiClient.get<ApiResponse<unknown[]>>(
      '/dashboard/alerts'
    );
    return response.data;
  },
};
