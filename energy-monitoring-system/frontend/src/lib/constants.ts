/**
 * Application-wide constants
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Energy Monitoring System';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
} as const;

// Sensor Status Colors
export const SENSOR_STATUS_COLORS = {
  active: 'bg-secondary-500 text-white',
  inactive: 'bg-neutral-400 text-white',
  maintenance: 'bg-accent-500 text-white',
} as const;

// Chart Colors
export const CHART_COLORS = {
  primary: '#0A2947',
  secondary: '#22C55E',
  accent: '#F59E0B',
  voltage: '#3B82F6',
  current: '#EF4444',
  power: '#8B5CF6',
  energy: '#10B981',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// API Polling Intervals (ms)
export const POLLING_INTERVALS = {
  FAST: 5000, // 5 seconds
  MEDIUM: 30000, // 30 seconds
  SLOW: 60000, // 1 minute
} as const;
