import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ROUTES } from './routes.config';

/**
 * Admin Route Props
 */
interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Admin Route Component
 * Ensures user is authenticated AND has SUPER_ADMIN role before rendering children
 * Redirects to login if not authenticated
 * Redirects to dashboard if authenticated but not SUPER_ADMIN
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Redirect to dashboard if authenticated but not SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // User is authenticated and has admin role, render children
  return <>{children}</>;
}
