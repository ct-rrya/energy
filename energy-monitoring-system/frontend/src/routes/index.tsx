import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';
import { FlexibleRoute } from './FlexibleRoute';
import { ROUTES } from './routes.config';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Pages
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { HealthCheckPage } from '@/features/dashboard/pages/HealthCheckPage';
import { SensorMonitoringPage } from '@/features/sensors/pages/SensorMonitoringPage';
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage';
import { EnergyMonitoringPage } from '@/features/energy/pages/EnergyMonitoringPage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { DiagnosticsPage } from '@/features/admin/pages/DiagnosticsPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { SettingsPage } from '@/features/admin/pages/SettingsPage';
import { NotFoundPage } from '@/features/auth/pages/NotFoundPage';

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
  {
    path: ROUTES.DASHBOARD,
    element: (
      <FlexibleRoute requireAuth={false}>
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      </FlexibleRoute>
    ),
  },

  // Analytics - PUBLIC ACCESS ALLOWED (with limited features)
  {
    path: ROUTES.ANALYTICS,
    element: (
      <FlexibleRoute requireAuth={false}>
        <DashboardLayout>
          <AnalyticsPage />
        </DashboardLayout>
      </FlexibleRoute>
    ),
  },

  // Energy Monitoring - PUBLIC ACCESS ALLOWED (with limited features)
  {
    path: ROUTES.ENERGY,
    element: (
      <FlexibleRoute requireAuth={false}>
        <DashboardLayout>
          <EnergyMonitoringPage />
        </DashboardLayout>
      </FlexibleRoute>
    ),
  },

  // Admin-only protected routes
  {
    path: ROUTES.SENSORS_MONITORING,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <SensorMonitoringPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // Alerts (Admin only)
  {
    path: ROUTES.ALERTS,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <AlertsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // Reports (Admin only)
  {
    path: ROUTES.REPORTS,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ReportsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // System Diagnostics (Admin only)
  {
    path: ROUTES.ADMIN_DIAGNOSTICS,
    element: (
      <AdminRoute>
        <DashboardLayout>
          <DiagnosticsPage />
        </DashboardLayout>
      </AdminRoute>
    ),
  },

  // Profile (Phase 10)
  {
    path: ROUTES.PROFILE,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <ProfilePage />
        </DashboardLayout>
      </ProtectedRoute>
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
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
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

