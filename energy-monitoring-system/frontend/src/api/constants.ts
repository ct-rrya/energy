/**
 * API Endpoint Constants
 * Centralized endpoint definitions matching backend routes
 */

// Health Check Endpoints
export const HEALTH_ENDPOINTS = {
  CHECK: '/health',
} as const;

// Authentication Endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  PROFILE: '/users/profile',
} as const;

// Sensor Endpoints
export const SENSOR_ENDPOINTS = {
  LIST: '/sensors',
  CREATE: '/sensors',
  DETAILS: (id: string) => `/sensors/${id}`,
  UPDATE: (id: string) => `/sensors/${id}`,
  DELETE: (id: string) => `/sensors/${id}`,
  REGENERATE_KEY: (id: string) => `/sensors/${id}/regenerate-key`,
} as const;

// Energy Endpoints
export const ENERGY_ENDPOINTS = {
  READINGS: '/energy/readings',
  CURRENT: '/energy/current',
  STATISTICS: '/energy/statistics',
  HISTORY: '/energy/history',
} as const;

// Analytics Endpoints
export const ANALYTICS_ENDPOINTS = {
  DAILY: '/analytics/daily',
  WEEKLY: '/analytics/weekly',
  MONTHLY: '/analytics/monthly',
  PEAK_TIMES: '/analytics/peak-times',
} as const;

// Dashboard Endpoints
export const DASHBOARD_ENDPOINTS = {
  METRICS: '/dashboard/metrics',
  ALERTS: '/dashboard/alerts',
} as const;

// Reports Endpoints
export const REPORTS_ENDPOINTS = {
  GENERATE: '/reports/generate',
  LIST: '/reports',
  DOWNLOAD: (id: string) => `/reports/${id}/download`,
} as const;

// Query Keys for TanStack Query
export const QUERY_KEYS = {
  HEALTH: ['health'],
  PROFILE: ['profile'],
  SENSORS: ['sensors'],
  SENSOR: (id: string) => ['sensor', id],
  ENERGY_READINGS: ['energy', 'readings'],
  ENERGY_CURRENT: ['energy', 'current'],
  ENERGY_STATISTICS: ['energy', 'statistics'],
  ANALYTICS_DAILY: ['analytics', 'daily'],
  ANALYTICS_WEEKLY: ['analytics', 'weekly'],
  ANALYTICS_MONTHLY: ['analytics', 'monthly'],
  DASHBOARD_METRICS: ['dashboard', 'metrics'],
  REPORTS: ['reports'],
} as const;
