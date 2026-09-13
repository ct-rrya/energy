/**
 * Route path constants
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',

  // Protected routes
  DASHBOARD: '/dashboard',
  SENSORS: '/sensors',
  SENSORS_MONITORING: '/sensors/monitoring',
  SENSORS_CREATE: '/sensors/create',
  SENSOR_DETAILS: (id: string) => `/sensors/${id}`,
  ENERGY: '/energy',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  ALERTS: '/alerts',
  PROFILE: '/profile',

  // Special routes
  NOT_FOUND: '/404',
} as const;
