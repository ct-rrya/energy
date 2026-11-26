import { type ReactNode } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { DesktopDashboardLayout } from './DesktopDashboardLayout';
import { SplashScreen } from '@/components/common/SplashScreen';
import { NicknameWelcomeModal } from '@/components/common/NicknameWelcomeModal';
import { useAuditPageView } from '@/hooks/useAuditPageView';

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
  const [searchParams] = useSearchParams();
  const forceSplash = searchParams.get('splash') === 'true';

  return (
    <>
      <SplashScreen forceShow={forceSplash} />
      <NicknameWelcomeModal />
      <DesktopDashboardLayout>{children ?? <Outlet />}</DesktopDashboardLayout>
    </>
  );
}
