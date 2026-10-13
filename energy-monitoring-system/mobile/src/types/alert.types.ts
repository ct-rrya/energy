/**
 * Alert Types
 * 
 * Type definitions for system alerts and notifications.
 * These match the backend alert DTOs and schema.
 */

/**
 * Alert Severity
 * Matches backend AlertSeverity enum
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Alert Type
 * Matches backend AlertType enum
 */
export enum AlertType {
  BATTERY_LOW = 'battery_low',
  BATTERY_CRITICAL = 'battery_critical',
  SENSOR_OFFLINE = 'sensor_offline',
  SENSOR_ONLINE = 'sensor_online',
  VOLTAGE_THRESHOLD = 'voltage_threshold',
  CURRENT_THRESHOLD = 'current_threshold',
  ENERGY_MILESTONE = 'energy_milestone',
  SYSTEM_ERROR = 'system_error',
  DATABASE_CONNECTION = 'database_connection',
  DEVICE_COMMUNICATION = 'device_communication',
}

/**
 * Alert Status
 * Matches backend AlertStatus enum
 */
export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

/**
 * Alert
 * Represents a system alert
 * Matches backend Alert schema
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
  acknowledgedBy?: string;
  acknowledgedAt?: string; // ISO 8601
  resolvedBy?: string;
  resolvedAt?: string;     // ISO 8601
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

/**
 * Alert Query Parameters
 * Matches: AlertQueryDto
 * Used by: GET /api/alerts
 */
export interface AlertQuery {
  status?: AlertStatus;
  severity?: AlertSeverity;
  type?: AlertType;
  sensorId?: string;
  startDate?: string;      // ISO 8601
  endDate?: string;        // ISO 8601
  search?: string;         // Search in title or description
  page?: number;           // Default: 1
  limit?: number;          // Default: 20, max: 100
  sortBy?: string;         // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
}

/**
 * Alert Statistics
 * Aggregate statistics about alerts
 * Used by: GET /api/alerts/stats
 */
export interface AlertStatistics {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<AlertType, number>;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
}
