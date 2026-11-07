import { useEffect, type ReactNode } from 'react';
import { Outlet, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { DesktopDashboardLayout } from './DesktopDashboardLayout';
import { SplashScreen } from '@/components/common/SplashScreen';
import { useAuditPageView } from '@/hooks/useAuditPageView';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';

interface DashboardLayoutProps {
  children?: ReactNode;
}

/**
 * Dashboard Layout with Unified EcoStep Central Shell
 *
 * Renders the EcoSidebar shell across all viewports:
 * - Desktop (> 768px): Left navigation sidebar, center main column, right EcoGuide panel
 * - Mobile (<= 768px): Top bar, single-column main content, fixed bottom tab bar,
 *   EcoGuide full-height bottom sheet, and Guest/User bottom sheet
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  useAuditPageView();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forceSplash = searchParams.get('splash') === 'true';

  // Super Admin account can ONLY access Admins and Logs
  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      const allowedPaths = [ROUTES.ADMIN_MANAGEMENT, ROUTES.ADMIN_LOGS];
      const isAllowed = allowedPaths.some(
        (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
      );
      if (!isAllowed) {
        navigate(ROUTES.ADMIN_MANAGEMENT, { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  return (
    <>
      <SplashScreen forceShow={forceSplash} />
      <DesktopDashboardLayout>{children ?? <Outlet />}</DesktopDashboardLayout>
    </>
  );
}
