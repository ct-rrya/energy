/**
 * Alert Type Definitions
 * 
 * Matches backend alert schema.
 */

/**
 * Alert Severity
 */
export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

export type AlertSeverity = typeof AlertSeverity[keyof typeof AlertSeverity];

/**
 * Alert Type
 */
export const AlertType = {
  BATTERY_LOW: 'battery_low',
  BATTERY_CRITICAL: 'battery_critical',
  SENSOR_OFFLINE: 'sensor_offline',
  SENSOR_ONLINE: 'sensor_online',
  VOLTAGE_THRESHOLD: 'voltage_threshold',
  CURRENT_THRESHOLD: 'current_threshold',
  ENERGY_MILESTONE: 'energy_milestone',
  SYSTEM_ERROR: 'system_error',
  DATABASE_CONNECTION: 'database_connection',
  DEVICE_COMMUNICATION: 'device_communication',
} as const;

export type AlertType = typeof AlertType[keyof typeof AlertType];

/**
 * Alert Status
 */
export const AlertStatus = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
} as const;

export type AlertStatus = typeof AlertStatus[keyof typeof AlertStatus];

/**
 * Alert Interface
 */
export interface Alert {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  sensorId?: string;
  sensorName?: string;
  sensorLocation?: string;
  metadata?: {
    batteryLevel?: number;
    voltage?: number;
    current?: number;
    threshold?: number;
    milestone?: number;
    errorMessage?: string;
    errorCode?: string;
    [key: string]: any;
  };
  acknowledgedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  acknowledgedAt?: string;
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Alert Query Parameters
 */
export interface AlertQueryParams {
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: AlertType;
  sensorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Alerts Response
 */
export interface AlertsResponse {
  data: Alert[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Alert Statistics
 */
export interface AlertStats {
  total: number;
  active: number;
  critical: number;
  bySeverity: {
    info?: number;
    warning?: number;
    critical?: number;
  };
  byType: {
    [key: string]: number;
  };
  recent: Alert[];
}
