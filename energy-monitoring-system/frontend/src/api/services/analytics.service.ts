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
 * Get Voltage History
 * 
 * Fetches voltage measurements over time.
 * 
 * @param query - Analytics query parameters
 * @returns Time-series data for voltage
 */
export const getVoltageHistory = async (query: AnalyticsQuery): Promise<TimeSeries> => {
  const response = await apiClient.get<TimeSeries>('/analytics/voltage-history', {
    params: query,
  });
  return response.data;
};

/**
 * Get Capacitor Voltage History
 * 
 * Fetches capacitor voltage measurements over time.
 * 
 * @param query - Analytics query parameters
 * @returns Time-series data for capacitor voltage
 */
export const getCapacitorHistory = async (query: AnalyticsQuery): Promise<TimeSeries> => {
  const response = await apiClient.get<TimeSeries>('/analytics/capacitor-history', {
    params: query,
  });
  return response.data;
};

/**
 * Get Steps History
 * 
 * Fetches step count over time.
 * 
 * @param query - Analytics query parameters
 * @returns Time-series data for steps
 */
export const getStepsHistory = async (query: AnalyticsQuery): Promise<TimeSeries> => {
  const response = await apiClient.get<TimeSeries>('/analytics/steps-history', {
    params: query,
  });
  return response.data;
};

/**
 * Historical Analysis Request
 */
export interface HistoricalAnalysisRequest {
  period: 'last7days' | 'last30days' | 'last90days';
  startDate?: string;
  endDate?: string;
}

/**
 * Historical Metrics
 */
export interface HistoricalMetrics {
  totalEnergyKWh: number;
  avgDailyEnergyKWh: number;
  peakPowerW: number;
  avgPowerW: number;
  energyTrend: 'up' | 'down' | 'stable';
  co2AvoidedKg: number;
  costSavingsUSD: number;
  daysAnalyzed: number;
  period: string;
  startDate: string;
  endDate: string;
}

/**
 * Historical Analysis Response
 */
export interface HistoricalAnalysisResponse {
  insights: string;
  metrics: HistoricalMetrics;
  generatedAt: string;
}

/**
 * Analyze Historical Data
 * 
 * Analyzes historical energy data and generates AI-powered insights.
 * 
 * @param request - Historical analysis request
 * @returns AI insights and structured metrics
 */
export const analyzeHistorical = async (
  request: HistoricalAnalysisRequest
): Promise<HistoricalAnalysisResponse> => {
  const response = await apiClient.post<HistoricalAnalysisResponse>(
    '/analytics/historical-analysis',
    request
  );
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
  getVoltageHistory,
  getCapacitorHistory,
  getStepsHistory,
  analyzeHistorical,
};
