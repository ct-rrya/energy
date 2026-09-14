/**
 * User Role and Permission Management
 * Defines role types and permission checks for public vs admin access
 */

import type { User } from '@/types';

/**
 * User role types
 */
export type UserRole = 'public' | 'admin';

/**
 * Feature permissions based on role
 */
export interface FeaturePermissions {
  // Navigation features
  canAccessDashboard: boolean;
  canAccessAnalytics: boolean;
  canAccessReports: boolean;
  canAccessAlerts: boolean;
  canAccessSensors: boolean;
  canAccessSettings: boolean;
  canAccessProfile: boolean;

  // Action permissions
  canManageDevices: boolean;
  canConfigureAlerts: boolean;
  canExportReports: boolean;
  canModifySettings: boolean;
}

/**
 * Determine user role based on authentication state
 */
export function getUserRole(
  isAuthenticated: boolean,
  user: User | null
): UserRole {
  if (isAuthenticated && user) {
    return 'admin';
  }
  return 'public';
}

/**
 * Check if user is admin
 */
export function isAdmin(isAuthenticated: boolean, user: User | null): boolean {
  return getUserRole(isAuthenticated, user) === 'admin';
}

/**
 * Check if user is public (unauthenticated)
 */
export function isPublic(
  isAuthenticated: boolean,
  user: User | null
): boolean {
  return getUserRole(isAuthenticated, user) === 'public';
}

/**
 * Get permissions for a given role
 */
export function getPermissions(role: UserRole): FeaturePermissions {
  switch (role) {
    case 'admin':
      return {
        // Navigation
        canAccessDashboard: true,
        canAccessAnalytics: true,
        canAccessReports: true,
        canAccessAlerts: true,
        canAccessSensors: true,
        canAccessSettings: true,
        canAccessProfile: true,

        // Actions
        canManageDevices: true,
        canConfigureAlerts: true,
        canExportReports: true,
        canModifySettings: true,
      };

    case 'public':
      return {
        // Navigation - public users can view basic analytics and dashboard
        canAccessDashboard: true,
        canAccessAnalytics: true,
        canAccessReports: false,
        canAccessAlerts: false,
        canAccessSensors: false,
        canAccessSettings: false,
        canAccessProfile: false,

        // Actions - public users have read-only access
        canManageDevices: false,
        canConfigureAlerts: false,
        canExportReports: false,
        canModifySettings: false,
      };

    default:
      // Default to most restrictive permissions
      return getPermissions('public');
  }
}

/**
 * Get user permissions based on authentication state
 */
export function getUserPermissions(
  isAuthenticated: boolean,
  user: User | null
): FeaturePermissions {
  const role = getUserRole(isAuthenticated, user);
  return getPermissions(role);
}

/**
 * Check if a specific feature is accessible
 */
export function canAccessFeature(
  feature: keyof FeaturePermissions,
  isAuthenticated: boolean,
  user: User | null
): boolean {
  const permissions = getUserPermissions(isAuthenticated, user);
  return permissions[feature];
}
