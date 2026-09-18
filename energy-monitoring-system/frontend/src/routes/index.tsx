import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { FlexibleRoute } from './FlexibleRoute';
import { ROUTES } from './routes.config';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Core pages (loaded immediately for landing/auth experience only)
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { HealthCheckPage } from '@/features/dashboard/pages/HealthCheckPage';
import { NotFoundPage } from '@/features/auth/pages/NotFoundPage';

// Lazy-loaded pages (code-split for better initial bundle size)
// EcoStep Central (Dashboard) - lazy loaded to reduce initial bundle
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));

// Historical Analytics and other public pages
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const EnergyMonitoringPage = lazy(() => import('@/features/energy/pages/EnergyMonitoringPage').then(m => ({ default: m.EnergyMonitoringPage })));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));

// Admin-only pages (heavy features with charts/reports/diagnostics)
const SensorMonitoringPage = lazy(() => import('@/features/sensors/pages/SensorMonitoringPage').then(m => ({ default: m.SensorMonitoringPage })));
const AlertsPage = lazy(() => import('@/features/alerts/pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const DiagnosticsPage = lazy(() => import('@/features/admin/pages/DiagnosticsPage').then(m => ({ default: m.DiagnosticsPage })));
const SettingsPage = lazy(() => import('@/features/admin/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

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
 */
export const router = createBrowserRouter([
  // Landing Page (Root)
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },

  // Health check (temporary, for testing backend connection)
  {
    path: '/health',
    element: <HealthCheckPage />,
  },

  // Public routes
  {
    path: ROUTES.LOGIN,
    element: (
      <FlexibleRoute redirectIfAuth={true}>
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </FlexibleRoute>
    ),
  },

  // Dashboard routes - PUBLIC ACCESS ALLOWED (with limited features)
  // EcoStep Central is now lazy-loaded to reduce initial bundle size
  {
    path: ROUTES.DASHBOARD,
    element: (
      <LazyRoute>
        <FlexibleRoute requireAuth={false}>
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </FlexibleRoute>
      </LazyRoute>
    ),
  },

  // Analytics - PUBLIC ACCESS ALLOWED (with limited features)
  {
    path: ROUTES.ANALYTICS,
    element: (
      <LazyRoute>
        <FlexibleRoute requireAuth={false}>
          <DashboardLayout>
            <AnalyticsPage />
          </DashboardLayout>
        </FlexibleRoute>
      </LazyRoute>
    ),
  },

  // Energy Monitoring - PUBLIC ACCESS ALLOWED (with limited features)
  {
    path: ROUTES.ENERGY,
    element: (
      <LazyRoute>
        <FlexibleRoute requireAuth={false}>
          <DashboardLayout>
            <EnergyMonitoringPage />
          </DashboardLayout>
        </FlexibleRoute>
      </LazyRoute>
    ),
  },

  // Admin-only protected routes
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
        <AdminRoute>
          <DashboardLayout>
            <DiagnosticsPage />
          </DashboardLayout>
        </AdminRoute>
      </LazyRoute>
    ),
  },

  // Profile (Phase 10)
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

  // Placeholder protected routes
  {
    path: ROUTES.SENSORS,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-primary-500">Sensors</h1>
            <p className="mt-2 text-neutral-600">Coming soon</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },
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

