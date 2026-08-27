import apiClient from '../client';
import type { DashboardAnalytics, AnalyticsQuery, TimeSeries } from '@/features/analytics/types';

/**
 * Analytics API Service
 * 
 * Handles all analytics-related API calls.
 */

/**
 * Get Dashboard Analytics
 * 
 * Fetches comprehensive dashboard summary data.
 * Optimized single endpoint to minimize API requests.
 * 
 * @returns Dashboard analytics with today, yesterday, week, month, system health
 */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const response = await apiClient.get<DashboardAnalytics>('/analytics/dashboard');
  return response.data;
};

/**
 * Get Time Series Data
 * 
 * Fetches time-series data for charts with specified granularity.
 * 
 * @param query - Analytics query parameters
 * @returns Time-series data with data points and summary
 */
export const getTimeSeries = async (query: AnalyticsQuery): Promise<TimeSeries> => {
  const response = await apiClient.get<TimeSeries>('/analytics/time-series', {
    params: query,
  });
  return response.data;
};

/**
 * Get Battery History
 * 
 * Fetches battery percentage over time.
 * 
 * @param query - Analytics query parameters
 * @returns Time-series data for battery
 */
export const getBatteryHistory = async (query: AnalyticsQuery): Promise<TimeSeries> => {
  const response = await apiClient.get<TimeSeries>('/analytics/battery-history', {
    params: query,
  });
  return response.data;
};

/**
 * Analytics Service Object
 * 
 * Centralized object for all analytics API calls.
 */
export const analyticsService = {
  getDashboardAnalytics,
  getTimeSeries,
  getBatteryHistory,
};
