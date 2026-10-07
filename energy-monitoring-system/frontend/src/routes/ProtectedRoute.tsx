import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ROUTES } from './routes.config';

/**
 * Protected Route Props
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Ensures user is authenticated (SYSTEM_ADMIN or SUPER_ADMIN) before rendering children.
 * Redirects unauthenticated users to admin login (/admin/login).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
