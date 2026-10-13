/**
 * Analytics Service
 * 
 * Handles analytics-related API operations.
 * Backend endpoints (verified):
 * - GET  /api/analytics/dashboard - Dashboard summary
 * - GET  /api/analytics/comprehensive - Comprehensive analytics
 * - GET  /api/analytics/daily - Daily energy summary
 * - GET  /api/analytics/weekly - Weekly energy summary
 * - GET  /api/analytics/monthly - Monthly energy summary
 * - GET  /api/analytics/peak - Peak generation
 * - GET  /api/analytics/environmental - Environmental impact
 * - GET  /api/analytics/cost-savings - Cost savings
 * - GET  /api/analytics/time-series - Time-series data
 * - GET  /api/analytics/battery-history - Battery history
 * - GET  /api/analytics/voltage-history - Voltage history
 * - GET  /api/analytics/steps-history - Steps history
 * - POST /api/analytics/historical-analysis - Historical analysis with AI insights
 * 
 * Authentication: Public (no JWT required)
 * All analytics endpoints are publicly accessible to support public dashboard viewing.
 */

import apiClient from '../client';
import type {
  ApiResponse,
  ComprehensiveAnalytics,
  DailyEnergySummary,
  WeeklyEnergySummary,
  MonthlyEnergySummary,
  PeakGeneration,
  EnvironmentalImpact,
  CostSavings,
  TimeSeriesData,
  AnalyticsQuery,
  HistoricalAnalysisRequest,
  HistoricalAnalysisResponse,
} from '../../types';

/**
 * Get Analytics Dashboard
 * 
 * Fetches dashboard summary including today, yesterday comparison,
 * week metrics, month metrics, and system health.
 * 
 * Backend endpoint: GET /api/analytics/dashboard
 * Authentication: Public
 * 
 * @returns Dashboard summary (dynamic type, not fully typed yet)
 * @throws Error if network fails or server error occurs
 */
export async function getAnalyticsDashboard(): Promise<unknown> {
  try {
    const response = await apiClient.get<ApiResponse<unknown>>(
      '/analytics/dashboard'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch analytics dashboard'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch analytics dashboard.';
    throw new Error(message);
  }
}

/**
 * Get Comprehensive Analytics
 * 
 * Retrieves all analytics in one response: today, this week, this month,
 * peak generation, environmental impact, cost savings, and trends.
 * Perfect for dashboard initial load.
 * 
 * Backend endpoint: GET /api/analytics/comprehensive
 * Authentication: Public
 * 
 * @returns Comprehensive analytics
 * @throws Error if network fails or server error occurs
 */
export async function getComprehensiveAnalytics(): Promise<ComprehensiveAnalytics> {
  try {
    const response = await apiClient.get<ApiResponse<ComprehensiveAnalytics>>(
      '/analytics/comprehensive'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch comprehensive analytics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch comprehensive analytics.';
    throw new Error(message);
  }
}

/**
 * Get Daily Analytics
 * 
 * Returns energy summary for a specific date.
 * 
 * Backend endpoint: GET /api/analytics/daily
 * Authentication: Public
 * 
 * @param date - Date (YYYY-MM-DD), optional (defaults to today on backend)
 * @returns Daily energy summary
 * @throws Error if date is invalid or network fails
 */
export async function getDailyAnalytics(date?: string): Promise<DailyEnergySummary> {
  try {
    const params = date ? { date } : undefined;
    const response = await apiClient.get<ApiResponse<DailyEnergySummary>>(
      '/analytics/daily',
      { params }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch daily analytics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch daily analytics.';
    throw new Error(message);
  }
}

/**
 * Get Weekly Analytics
 * 
 * Returns energy summary for a week (Monday-Sunday).
 * 
 * Backend endpoint: GET /api/analytics/weekly
 * Authentication: Public
 * 
 * @param weekStart - Week start date (Monday, YYYY-MM-DD), optional
 * @returns Weekly energy summary with daily breakdown
 * @throws Error if date is invalid or network fails
 */
export async function getWeeklyAnalytics(weekStart?: string): Promise<WeeklyEnergySummary> {
  try {
    const params = weekStart ? { weekStart } : undefined;
    const response = await apiClient.get<ApiResponse<WeeklyEnergySummary>>(
      '/analytics/weekly',
      { params }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch weekly analytics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch weekly analytics.';
    throw new Error(message);
  }
}

/**
 * Get Monthly Analytics
 * 
 * Returns energy summary for a month.
 * 
 * Backend endpoint: GET /api/analytics/monthly
 * Authentication: Public
 * 
 * @param year - Year, optional (defaults to current year on backend)
 * @param month - Month (1-12), optional (defaults to current month on backend)
 * @returns Monthly energy summary
 * @throws Error if parameters are invalid or network fails
 */
export async function getMonthlyAnalytics(
  year?: number,
  month?: number
): Promise<MonthlyEnergySummary> {
  try {
    const params: Record<string, number> = {};
    if (year !== undefined) params.year = year;
    if (month !== undefined) params.month = month;

    const response = await apiClient.get<ApiResponse<MonthlyEnergySummary>>(
      '/analytics/monthly',
      { params: Object.keys(params).length > 0 ? params : undefined }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch monthly analytics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch monthly analytics.';
    throw new Error(message);
  }
}

/**
 * Get Peak Generation
 * 
 * Returns reading with highest power in date range.
 * 
 * Backend endpoint: GET /api/analytics/peak
 * Authentication: Public
 * 
 * @param startDate - Start date (YYYY-MM-DD), required
 * @param endDate - End date (YYYY-MM-DD), optional (defaults to today on backend)
 * @returns Peak generation details or null if no data
 * @throws Error if dates are invalid or network fails
 */
export async function getPeakGeneration(
  startDate: string,
  endDate?: string
): Promise<PeakGeneration | null> {
  try {
    const params: Record<string, string> = { startDate };
    if (endDate) params.endDate = endDate;

    const response = await apiClient.get<ApiResponse<PeakGeneration | null>>(
      '/analytics/peak',
      { params }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch peak generation'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch peak generation.';
    throw new Error(message);
  }
}

/**
 * Get Environmental Impact
 * 
 * Calculates environmental impact for given energy amount.
 * Includes CO2 avoided, trees equivalent, coal not burned, homes powered, and phone charges.
 * 
 * Backend endpoint: GET /api/analytics/environmental
 * Authentication: Public
 * 
 * @param energymWh - Energy generated (kWh), required
 * @returns Environmental impact metrics
 * @throws Error if parameter is invalid or network fails
 */
export async function getEnvironmentalImpact(
  energymWh: number
): Promise<EnvironmentalImpact> {
  try {
    const response = await apiClient.get<ApiResponse<EnvironmentalImpact>>(
      '/analytics/environmental',
      { params: { energymWh } }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch environmental impact'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch environmental impact.';
    throw new Error(message);
  }
}

/**
 * Get Cost Savings
 * 
 * Estimates cost savings from energy generated.
 * Includes daily, monthly, and yearly projections.
 * 
 * Backend endpoint: GET /api/analytics/cost-savings
 * Authentication: Public
 * 
 * @param energymWh - Energy generated (kWh), required
 * @param periodDays - Number of days in period, required
 * @param electricityRate - Electricity rate ($/kWh), optional (defaults to 0.12)
 * @returns Cost savings metrics
 * @throws Error if parameters are invalid or network fails
 */
export async function getCostSavings(
  energymWh: number,
  periodDays: number,
  electricityRate?: number
): Promise<CostSavings> {
  try {
    const params: Record<string, number> = { energymWh, periodDays };
    if (electricityRate !== undefined) params.electricityRate = electricityRate;

    const response = await apiClient.get<ApiResponse<CostSavings>>(
      '/analytics/cost-savings',
      { params }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch cost savings'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch cost savings.';
    throw new Error(message);
  }
}

/**
 * Get Time Series Data
 * 
 * Returns aggregated time-series data for charts.
 * Supports power, voltage, current, battery, energy, and steps metrics
 * with hourly, daily, weekly, or monthly granularity.
 * 
 * Backend endpoint: GET /api/analytics/time-series
 * Authentication: Public
 * 
 * @param query - Analytics query parameters (all optional)
 * @returns Time-series data with data points and summary
 * @throws Error if parameters are invalid or network fails
 */
export async function getTimeSeries(query: AnalyticsQuery): Promise<TimeSeriesData> {
  try {
    // Build params object excluding undefined values
    const params: Record<string, string> = {};
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.sensorId) params.sensorId = query.sensorId;
    if (query.source) params.source = query.source;
    if (query.granularity) params.granularity = query.granularity;
    if (query.metric) params.metric = query.metric;

    const response = await apiClient.get<ApiResponse<TimeSeriesData>>(
      '/analytics/time-series',
      { params: Object.keys(params).length > 0 ? params : undefined }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch time series data'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch time series data.';
    throw new Error(message);
  }
}

/**
 * Get Battery History
 * 
 * Returns battery percentage over time.
 * Convenience endpoint for battery metric time-series data.
 * 
 * Backend endpoint: GET /api/analytics/battery-history
 * Authentication: Public
 * 
 * @param query - Analytics query parameters (all optional)
 * @returns Time-series data for battery
 * @throws Error if parameters are invalid or network fails
 */
export async function getBatteryHistory(query: AnalyticsQuery): Promise<TimeSeriesData> {
  try {
    const params: Record<string, string> = {};
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.sensorId) params.sensorId = query.sensorId;
    if (query.source) params.source = query.source;
    if (query.granularity) params.granularity = query.granularity;

    const response = await apiClient.get<ApiResponse<TimeSeriesData>>(
      '/analytics/battery-history',
      { params: Object.keys(params).length > 0 ? params : undefined }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch battery history'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch battery history.';
    throw new Error(message);
  }
}

/**
 * Get Voltage History
 * 
 * Returns voltage measurements over time.
 * Convenience endpoint for voltage metric time-series data.
 * 
 * Backend endpoint: GET /api/analytics/voltage-history
 * Authentication: Public
 * 
 * @param query - Analytics query parameters (all optional)
 * @returns Time-series data for voltage
 * @throws Error if parameters are invalid or network fails
 */
export async function getVoltageHistory(query: AnalyticsQuery): Promise<TimeSeriesData> {
  try {
    const params: Record<string, string> = {};
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.sensorId) params.sensorId = query.sensorId;
    if (query.source) params.source = query.source;
    if (query.granularity) params.granularity = query.granularity;

    const response = await apiClient.get<ApiResponse<TimeSeriesData>>(
      '/analytics/voltage-history',
      { params: Object.keys(params).length > 0 ? params : undefined }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch voltage history'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch voltage history.';
    throw new Error(message);
  }
}

/**
 * Get Steps History
 * 
 * Returns step count over time.
 * Shows detected footsteps on the piezoelectric tile.
 * Steps are summed per time period.
 * 
 * Backend endpoint: GET /api/analytics/steps-history
 * Authentication: Public
 * 
 * @param query - Analytics query parameters (all optional)
 * @returns Time-series data for steps
 * @throws Error if parameters are invalid or network fails
 */
export async function getStepsHistory(query: AnalyticsQuery): Promise<TimeSeriesData> {
  try {
    const params: Record<string, string> = {};
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.sensorId) params.sensorId = query.sensorId;
    if (query.source) params.source = query.source;
    if (query.granularity) params.granularity = query.granularity;

    const response = await apiClient.get<ApiResponse<TimeSeriesData>>(
      '/analytics/steps-history',
      { params: Object.keys(params).length > 0 ? params : undefined }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch steps history'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch steps history.';
    throw new Error(message);
  }
}

/**
 * Get Historical Analysis
 * 
 * Analyzes historical energy data and generates AI-powered insights.
 * Uses Gemini AI to provide comprehensive analysis of trends, patterns, and recommendations.
 * 
 * Backend endpoint: POST /api/analytics/historical-analysis
 * Authentication: Public
 * 
 * IMPORTANT: Backend expects period as string enum ('last7days' | 'last30days' | 'last90days'),
 * but mobile type uses numbers (7 | 30 | 90). This function maps the number to the string.
 * 
 * @param request - Historical analysis request (period: 7|30|90, optional startDate/endDate)
 * @returns AI-generated insights and structured metrics
 * @throws Error if period is invalid, parameters are invalid, or network fails
 */
export async function getHistoricalAnalysis(
  request: HistoricalAnalysisRequest
): Promise<HistoricalAnalysisResponse> {
  try {
    // Map mobile number period to backend string enum
    let backendPeriod: 'last7days' | 'last30days' | 'last90days';
    switch (request.period) {
      case 7:
        backendPeriod = 'last7days';
        break;
      case 30:
        backendPeriod = 'last30days';
        break;
      case 90:
        backendPeriod = 'last90days';
        break;
      default:
        throw new Error(
          `Invalid period: ${request.period}. Must be 7, 30, or 90.`
        );
    }

    // Build request body matching backend DTO
    const body: {
      period: string;
      startDate?: string;
      endDate?: string;
    } = {
      period: backendPeriod,
    };
    if (request.startDate) body.startDate = request.startDate;
    if (request.endDate) body.endDate = request.endDate;

    const response = await apiClient.post<ApiResponse<HistoricalAnalysisResponse>>(
      '/analytics/historical-analysis',
      body
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch historical analysis'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch historical analysis.';
    throw new Error(message);
  }
}
