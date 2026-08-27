import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './routes.config';

// Layouts
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Pages
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { HealthCheckPage } from '@/features/dashboard/pages/HealthCheckPage';
import { SensorMonitoringPage } from '@/features/sensors/pages/SensorMonitoringPage';
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage';
import { AlertsPage } from '@/features/alerts/pages/AlertsPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { NotFoundPage } from '@/features/auth/pages/NotFoundPage';

/**
 * Application Router Configuration
 */
export const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
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
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },

  // Protected routes
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // Sensor Monitoring (NEW)
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

  // Analytics (Phase 6)
  {
    path: ROUTES.ANALYTICS,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <AnalyticsPage />
        </DashboardLayout>
      </ProtectedRoute>
    ),
  },

  // Alerts (Phase 8)
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

  // Reports (Phase 9)
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
    path: ROUTES.ENERGY,
    element: (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-8">
            <h1 className="text-3xl font-bold text-primary-500">Energy Monitoring</h1>
            <p className="mt-2 text-neutral-600">Coming soon</p>
          </div>
        </DashboardLayout>
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
