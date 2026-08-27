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
 * Ensures user is authenticated before rendering children
 * Redirects to login if not authenticated
 * Preserves intended destination for post-login redirect
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Redirect to login if not authenticated
  // Save the current location to redirect back after login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}
