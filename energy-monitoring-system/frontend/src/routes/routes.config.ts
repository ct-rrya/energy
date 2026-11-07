/**
 * Route path constants
 */
export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/admin/login', // Redirect old login references to admin login

  // Admin routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN_MANAGEMENT: '/admin-management',
  ADMIN_LOGS: '/admin/logs',

  // Dashboard and monitoring routes
  DASHBOARD: '/dashboard',
  ENERGY: '/energy',
  ANALYTICS: '/analytics',
  MILESTONES: '/milestones',

  // Admin-only routes (auth required)
  SENSORS: '/sensors',
  SENSORS_MONITORING: '/sensors/monitoring',
  SENSORS_CREATE: '/sensors/create',
  SENSOR_DETAILS: (id: string) => `/sensors/${id}`,
  ALERTS: '/alerts',
  REPORTS: '/reports',
  ADMIN_DIAGNOSTICS: '/admin/diagnostics',
  SETTINGS: '/settings',
  PROFILE: '/profile',

  // Special routes
  SPLASH: '/splash',
  NOT_FOUND: '/404',
} as const;
