/**
 * Dashboard Service
 * 
 * Handles dashboard-related API operations.
 * Backend endpoints (verified):
 * - GET /api/dashboard/metrics - Dashboard summary with AI insights
 * - GET /api/dashboard/alerts - Dashboard alerts (placeholder)
 * 
 * Authentication: Public (no JWT required)
 * These endpoints are accessible without authentication to support public dashboard viewing.
 */

import apiClient from '../client';
import type { ApiResponse, DashboardMetrics } from '../../types';

/**
 * Get Dashboard Metrics
 * 
 * Fetches aggregated metrics for the main dashboard view.
 * Includes today's energy, active sensors, last reading, and AI insights.
 * 
 * Backend endpoint: GET /api/dashboard/metrics
 * Authentication: Public
 * 
 * @returns Dashboard metrics with AI-generated insights
 * @throws Error if network fails or server error occurs
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    console.log('[Dashboard Service] Fetching dashboard metrics...');
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>(
      '/dashboard/metrics'
    );

    console.log('[Dashboard Service] Response status:', response.status);
    console.log('[Dashboard Service] Response data:', JSON.stringify(response.data, null, 2));

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch dashboard metrics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    console.error('[Dashboard Service] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch dashboard metrics.';
    throw new Error(message);
  }
}

/**
 * Get Dashboard Alerts
 * 
 * Fetches alerts for dashboard display.
 * Note: This endpoint returns a placeholder empty array in the current backend.
 * 
 * Backend endpoint: GET /api/dashboard/alerts
 * Authentication: Public
 * 
 * @returns Array of dashboard alerts (currently empty)
 * @throws Error if network fails or server error occurs
 */
export async function getDashboardAlerts(): Promise<any[]> {
  try {
    const response = await apiClient.get<ApiResponse<any[]>>(
      '/dashboard/alerts'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch dashboard alerts'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch dashboard alerts.';
    throw new Error(message);
  }
}
