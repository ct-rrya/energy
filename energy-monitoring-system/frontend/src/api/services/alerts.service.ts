import apiClient from '../client';
import type {
  Alert,
  AlertsResponse,
  AlertStats,
  AlertQueryParams,
} from '@/types/alert.types';

/**
 * Alerts API Service
 * 
 * Handles all alert-related API calls.
 */

/**
 * Get Alerts
 * 
 * Fetches alerts with filters, pagination, and sorting.
 * 
 * @param params - Query parameters
 * @returns Paginated alerts
 */
export const getAlerts = async (params?: AlertQueryParams): Promise<AlertsResponse> => {
  const response = await apiClient.get<AlertsResponse>('/alerts', { params });
  return response.data;
};

/**
 * Get Alert Statistics
 * 
 * Fetches aggregate statistics about alerts.
 * 
 * @returns Alert statistics
 */
export const getAlertStats = async (): Promise<AlertStats> => {
  const response = await apiClient.get<AlertStats>('/alerts/stats');
  return response.data;
};

/**
 * Get Alert by ID
 * 
 * Fetches a specific alert by ID.
 * 
 * @param id - Alert ID
 * @returns Alert details
 */
export const getAlertById = async (id: string): Promise<Alert> => {
  const response = await apiClient.get<Alert>(`/alerts/${id}`);
  return response.data;
};

/**
 * Acknowledge Alert
 * 
 * Marks an alert as acknowledged.
 * 
 * @param id - Alert ID
 * @returns Updated alert
 */
export const acknowledgeAlert = async (id: string): Promise<Alert> => {
  const response = await apiClient.post<Alert>(`/alerts/${id}/acknowledge`);
  return response.data;
};

/**
 * Resolve Alert
 * 
 * Marks an alert as resolved.
 * 
 * @param id - Alert ID
 * @returns Updated alert
 */
export const resolveAlert = async (id: string): Promise<Alert> => {
  const response = await apiClient.post<Alert>(`/alerts/${id}/resolve`);
  return response.data;
};

/**
 * Alerts Service Object
 * 
 * Centralized object for all alert API calls.
 */
export const alertsService = {
  getAlerts,
  getAlertStats,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
};
