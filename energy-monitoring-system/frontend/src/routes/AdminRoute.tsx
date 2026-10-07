import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ROUTES } from './routes.config';

/**
 * Admin Route Props
 */
interface AdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

/**
 * Admin Route Component
 * Ensures user is authenticated (redirects to admin login if not)
 * If requireSuperAdmin is true, ensures user has SUPER_ADMIN role (redirects non-SUPER_ADMIN to dashboard)
 */
export function AdminRoute({ children, requireSuperAdmin = true }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }

  // Redirect to dashboard if authenticated but not SUPER_ADMIN
  if (requireSuperAdmin && user?.role !== 'SUPER_ADMIN') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
}
