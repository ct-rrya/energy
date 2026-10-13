/**
 * Alerts Service
 * 
 * Handles alert-related API operations.
 * Backend endpoints (verified):
 * - GET  /api/alerts - Get all alerts with filters and pagination
 * - GET  /api/alerts/stats - Get alert statistics
 * - GET  /api/alerts/:id - Get alert by ID
 * - POST /api/alerts/:id/acknowledge - Acknowledge an alert
 * - POST /api/alerts/:id/resolve - Resolve an alert
 * 
 * Authentication: Required (JWT)
 * All endpoints require JWT authentication via JwtAuthGuard.
 * The apiClient automatically attaches the JWT token via request interceptor.
 */

import apiClient from '../client';
import type {
  PaginatedApiResponse,
  ApiResponse,
  Alert,
  AlertQuery,
  AlertStatistics,
} from '../../types';

/**
 * Get Alerts
 * 
 * Query alerts with filters, pagination, and sorting.
 * Supports filtering by status, severity, type, sensor, date range, and search.
 * 
 * Backend endpoint: GET /api/alerts
 * Authentication: Required (JWT)
 * 
 * @param query - Query parameters (all optional: status, severity, type, sensorId, startDate, endDate, search, page, limit, sortBy, sortOrder)
 * @returns Paginated alerts with pagination metadata
 * @throws Error if unauthorized or network fails
 */
export async function getAlerts(
  query?: AlertQuery
): Promise<{ data: Alert[]; pagination: PaginatedApiResponse<Alert>['pagination'] }> {
  try {
    // Build params object excluding undefined values
    const params: Record<string, string | number> = {};
    if (query?.status) params.status = query.status;
    if (query?.severity) params.severity = query.severity;
    if (query?.type) params.type = query.type;
    if (query?.sensorId) params.sensorId = query.sensorId;
    if (query?.startDate) params.startDate = query.startDate;
    if (query?.endDate) params.endDate = query.endDate;
    if (query?.search) params.search = query.search;
    if (query?.page !== undefined) params.page = query.page;
    if (query?.limit !== undefined) params.limit = query.limit;
    if (query?.sortBy) params.sortBy = query.sortBy;
    if (query?.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<PaginatedApiResponse<Alert>>(
      '/alerts',
      { params: Object.keys(params).length > 0 ? params : undefined }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch alerts'
      );
    }

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch alerts.';
    throw new Error(message);
  }
}

/**
 * Get Alert Statistics
 * 
 * Returns aggregate statistics about alerts.
 * Includes total, active, acknowledged, resolved, critical, warning, info counts,
 * and breakdowns by type, severity, and status.
 * 
 * Backend endpoint: GET /api/alerts/stats
 * Authentication: Required (JWT)
 * 
 * @returns Alert statistics
 * @throws Error if unauthorized or network fails
 */
export async function getAlertStats(): Promise<AlertStatistics> {
  try {
    const response = await apiClient.get<ApiResponse<AlertStatistics>>(
      '/alerts/stats'
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch alert statistics'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch alert statistics.';
    throw new Error(message);
  }
}

/**
 * Get Alert by ID
 * 
 * Retrieve detailed information about a specific alert.
 * 
 * Backend endpoint: GET /api/alerts/:id
 * Authentication: Required (JWT)
 * 
 * @param id - Alert ID (MongoDB ObjectId)
 * @returns Alert details
 * @throws Error if alert not found, unauthorized, or network fails
 */
export async function getAlertById(id: string): Promise<Alert> {
  try {
    const response = await apiClient.get<ApiResponse<Alert>>(
      `/alerts/${id}`
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to fetch alert'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to fetch alert.';
    throw new Error(message);
  }
}

/**
 * Acknowledge Alert
 * 
 * Marks an alert as acknowledged by the current user.
 * The user ID is extracted from the JWT token via @CurrentUser() decorator on the backend.
 * Mobile does not need to send userId in the request body.
 * 
 * Backend endpoint: POST /api/alerts/:id/acknowledge
 * Authentication: Required (JWT)
 * 
 * @param id - Alert ID (MongoDB ObjectId)
 * @returns Updated alert with acknowledgment details
 * @throws Error if alert not found, wrong status, unauthorized, or network fails
 */
export async function acknowledgeAlert(id: string): Promise<Alert> {
  try {
    const response = await apiClient.post<ApiResponse<Alert>>(
      `/alerts/${id}/acknowledge`,
      {} // Empty body - userId extracted from JWT by backend
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to acknowledge alert'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to acknowledge alert.';
    throw new Error(message);
  }
}

/**
 * Resolve Alert
 * 
 * Marks an alert as resolved by the current user.
 * The user ID is extracted from the JWT token via @CurrentUser() decorator on the backend.
 * Mobile does not need to send userId in the request body.
 * 
 * Backend endpoint: POST /api/alerts/:id/resolve
 * Authentication: Required (JWT)
 * 
 * @param id - Alert ID (MongoDB ObjectId)
 * @returns Updated alert with resolution details
 * @throws Error if alert not found, already resolved, unauthorized, or network fails
 */
export async function resolveAlert(id: string): Promise<Alert> {
  try {
    const response = await apiClient.post<ApiResponse<Alert>>(
      `/alerts/${id}/resolve`,
      {} // Empty body - userId extracted from JWT by backend
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || 'Failed to resolve alert'
      );
    }

    return response.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network error. Unable to resolve alert.';
    throw new Error(message);
  }
}
