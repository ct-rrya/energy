import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { ROUTES } from './routes.config';

/**
 * Flexible Route Props
 */
interface FlexibleRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, requires authentication (default: false)
  redirectIfAuth?: boolean; // If true, redirects authenticated users (e.g., login page)
}

/**
 * Flexible Route Component
 * Supports both public and protected access based on configuration
 * 
 * Use Cases:
 * - requireAuth=false (default): Accessible by both public and authenticated users
 * - requireAuth=true: Only authenticated users (redirects to login)
 * - redirectIfAuth=true: Only unauthenticated users (redirects authenticated to dashboard)
 */
export function FlexibleRoute({
  children,
  requireAuth = false,
  redirectIfAuth = false,
}: FlexibleRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Redirect authenticated users away (e.g., from login page)
  if (redirectIfAuth && isAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname;
    return <Navigate to={from || ROUTES.DASHBOARD} replace />;
  }

  // Require authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Allow access
  return <>{children}</>;
}
