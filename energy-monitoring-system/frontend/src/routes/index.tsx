import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { FlexibleRoute } from './FlexibleRoute';
import { ROUTES } from './routes.config';

// Layouts
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Core pages (loaded immediately)
import { LandingPage } from '@/features/landing/pages/LandingPage';
import AdminAccessCodePage from '@/features/auth/pages/AdminAccessCodePage';
import AdminManagementPage from '@/features/admin-management/pages/AdminManagementPage';
import { HealthCheckPage } from '@/features/dashboard/pages/HealthCheckPage';
import { NotFoundPage } from '@/features/auth/pages/NotFoundPage';

// Lazy-loaded pages
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const EnergyMonitoringPage = lazy(() => import('@/features/energy/pages/EnergyMonitoringPage').then(m => ({ default: m.EnergyMonitoringPage })));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SensorMonitoringPage = lazy(() => import('@/features/sensors/pages/SensorMonitoringPage').then(m => ({ default: m.SensorMonitoringPage })));
const AlertsPage = lazy(() => import('@/features/alerts/pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const DiagnosticsPage = lazy(() => import('@/features/admin/pages/DiagnosticsPage').then(m => ({ default: m.DiagnosticsPage })));
const SettingsPage = lazy(() => import('@/features/admin/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SensorsManagementPage = lazy(() => import('@/features/sensors/pages/SensorsManagementPage').then(m => ({ default: m.SensorsManagementPage })));

/**
 * Loading fallback component for lazy-loaded routes
 */
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#2FBF71] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

/**
 * Wrapper component for lazy-loaded routes with Suspense boundary
 */
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    {children}
  </Suspense>
);

/**
 * Application Router Configuration
 * 
 * PUBLIC ACCESS PHILOSOPHY:
 * - Public users can view dashboard, analytics, energy monitoring (read-only)
 * - Only administrators need authentication (via access code)
 * - NO email/password login for public users
 */
export const router = createBrowserRouter([
  // Landing Page (Root)
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },

  // Health check
  {
    path: '/health',
    element: <HealthCheckPage />,
  },

  // Admin Access Code Login (ONLY login page in the system)
  {
    path: ROUTES.ADMIN_LOGIN,
    element: (
      <FlexibleRoute redirectIfAuth={true}>
        <AdminAccessCodePage />
      </FlexibleRoute>
    ),
  },

  // Admin Management (SUPER_ADMIN only)
  {
    path: ROUTES.ADMIN_MANAGEMENT,
    element: (
      <AdminRoute requireSuperAdmin={true}>
        <DashboardLayout>
          <AdminManagementPage />
        </DashboardLayout>
      </AdminRoute>
    ),
  },

  // Dashboard - Public access (read-only for public users, full access for admins)
  {
    path: ROUTES.DASHBOARD,
    element: (
      <LazyRoute>
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      </LazyRoute>
    ),
  },

  // Analytics - Public access
  {
    path: ROUTES.ANALYTICS,
    element: (
      <LazyRoute>
        <DashboardLayout>
          <AnalyticsPage />
        </DashboardLayout>
      </LazyRoute>
    ),
  },

  // Energy Monitoring - Public access
  {
    path: ROUTES.ENERGY,
    element: (
      <LazyRoute>
        <DashboardLayout>
          <EnergyMonitoringPage />
        </DashboardLayout>
      </LazyRoute>
    ),
  },

  // ADMIN-ONLY ROUTES - Require authentication (SYSTEM_ADMIN or SUPER_ADMIN)
  {
    path: ROUTES.SENSORS_MONITORING,
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <DashboardLayout>
            <SensorMonitoringPage />
          </DashboardLayout>
        </ProtectedRoute>
      </LazyRoute>
    ),
  },

  // Alerts (Admin only)
  {
    path: ROUTES.ALERTS,
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <DashboardLayout>
            <AlertsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </LazyRoute>
    ),
  },

  // Reports (Admin only)
  {
    path: ROUTES.REPORTS,
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <DashboardLayout>
            <ReportsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </LazyRoute>
    ),
  },

  // System Diagnostics (Admin only)
  {
    path: ROUTES.ADMIN_DIAGNOSTICS,
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <DashboardLayout>
            <DiagnosticsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </LazyRoute>
    ),
  },

  // Profile (Admin only)
  {
    path: ROUTES.PROFILE,
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </ProtectedRoute>
      </LazyRoute>
    ),
  },

  // Settings (Admin only)
  {
    path: ROUTES.SETTINGS,
    element: (
      <LazyRoute>
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      </LazyRoute>
    ),
  },

  // Sensors Management (SYSTEM_ADMIN only)
  {
    path: ROUTES.SENSORS,
    element: (
      <LazyRoute>
        <AdminRoute>
          <DashboardLayout>
            <SensorsManagementPage />
          </DashboardLayout>
        </AdminRoute>
      </LazyRoute>
    ),
  },

  // 404 Not Found
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
