import { describe, it, expect } from 'vitest';
import {
  getUserRole,
  isAdmin,
  isPublic,
  getPermissions,
  getUserPermissions,
  canAccessFeature,
  type UserRole,
} from './permissions';
import type { User } from '@/types';

// Mock user data
const mockAdminUser: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('permissions', () => {
  describe('getUserRole', () => {
    it('should return "admin" for authenticated user', () => {
      const role = getUserRole(true, mockAdminUser);
      expect(role).toBe('admin');
    });

    it('should return "public" for unauthenticated user', () => {
      const role = getUserRole(false, null);
      expect(role).toBe('public');
    });

    it('should return "public" when authenticated but user is null', () => {
      const role = getUserRole(false, null);
      expect(role).toBe('public');
    });
  });

  describe('isAdmin', () => {
    it('should return true for authenticated user', () => {
      expect(isAdmin(true, mockAdminUser)).toBe(true);
    });

    it('should return false for unauthenticated user', () => {
      expect(isAdmin(false, null)).toBe(false);
    });
  });

  describe('isPublic', () => {
    it('should return false for authenticated user', () => {
      expect(isPublic(true, mockAdminUser)).toBe(false);
    });

    it('should return true for unauthenticated user', () => {
      expect(isPublic(false, null)).toBe(true);
    });
  });

  describe('getPermissions', () => {
    it('should return full permissions for admin role', () => {
      const permissions = getPermissions('admin');

      expect(permissions.canAccessDashboard).toBe(true);
      expect(permissions.canAccessAnalytics).toBe(true);
      expect(permissions.canAccessReports).toBe(true);
      expect(permissions.canAccessAlerts).toBe(true);
      expect(permissions.canAccessSensors).toBe(true);
      expect(permissions.canAccessSettings).toBe(true);
      expect(permissions.canAccessProfile).toBe(true);
      expect(permissions.canManageDevices).toBe(true);
      expect(permissions.canConfigureAlerts).toBe(true);
      expect(permissions.canExportReports).toBe(true);
      expect(permissions.canModifySettings).toBe(true);
    });

    it('should return limited permissions for public role', () => {
      const permissions = getPermissions('public');

      // Public users can access dashboard and analytics (read-only)
      expect(permissions.canAccessDashboard).toBe(true);
      expect(permissions.canAccessAnalytics).toBe(true);

      // Public users cannot access admin features
      expect(permissions.canAccessReports).toBe(false);
      expect(permissions.canAccessAlerts).toBe(false);
      expect(permissions.canAccessSensors).toBe(false);
      expect(permissions.canAccessSettings).toBe(false);
      expect(permissions.canAccessProfile).toBe(false);

      // Public users cannot perform admin actions
      expect(permissions.canManageDevices).toBe(false);
      expect(permissions.canConfigureAlerts).toBe(false);
      expect(permissions.canExportReports).toBe(false);
      expect(permissions.canModifySettings).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return admin permissions for authenticated user', () => {
      const permissions = getUserPermissions(true, mockAdminUser);

      expect(permissions.canAccessDashboard).toBe(true);
      expect(permissions.canAccessReports).toBe(true);
      expect(permissions.canManageDevices).toBe(true);
    });

    it('should return public permissions for unauthenticated user', () => {
      const permissions = getUserPermissions(false, null);

      expect(permissions.canAccessDashboard).toBe(true);
      expect(permissions.canAccessAnalytics).toBe(true);
      expect(permissions.canAccessReports).toBe(false);
      expect(permissions.canManageDevices).toBe(false);
    });
  });

  describe('canAccessFeature', () => {
    it('should allow admin to access all features', () => {
      expect(canAccessFeature('canAccessDashboard', true, mockAdminUser)).toBe(
        true
      );
      expect(canAccessFeature('canAccessReports', true, mockAdminUser)).toBe(
        true
      );
      expect(canAccessFeature('canManageDevices', true, mockAdminUser)).toBe(
        true
      );
    });

    it('should allow public user to access dashboard and analytics only', () => {
      expect(canAccessFeature('canAccessDashboard', false, null)).toBe(true);
      expect(canAccessFeature('canAccessAnalytics', false, null)).toBe(true);
      expect(canAccessFeature('canAccessReports', false, null)).toBe(false);
      expect(canAccessFeature('canAccessAlerts', false, null)).toBe(false);
      expect(canAccessFeature('canManageDevices', false, null)).toBe(false);
    });
  });
});
